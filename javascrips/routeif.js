import { getFirestore, collection, addDoc, deleteDoc, doc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { firestoreDB } from '../db/firebase-config.js'; // 從 firebase-config 導入 firestoreDB
import { checkLoginStatus } from './loginValidator.js';

// 開啟 IndexedDB 資料庫
const DB_NAME = 'gomtDB';
const DB_VERSION = 8;
let db;

document.addEventListener("DOMContentLoaded", function () {
    // 檢查登入狀態，未登入則跳轉至登入頁面
    checkLoginStatus((isLoggedIn, user) => {
        if (!isLoggedIn) {
            alert("您需要登入才能使用此功能。");
            // window.location.href = 'login.html'; // 跳轉至登入頁面
        } else {
            console.log("已登入的使用者資料：", user);
            openDatabase(); // 打開資料庫後再加載路線資料
        }
    });

    function openDatabase() {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function (event) {
            db = event.target.result;
            if (!db.objectStoreNames.contains('routeRecords')) {
                db.createObjectStore('routeRecords', { keyPath: 'recordId', autoIncrement: true });
            }
        };

        request.onsuccess = function (event) {
            db = event.target.result;
            console.log("成功打開資料庫");
            loadRouteData(); // 資料庫連接成功後加載資料
        };

        request.onerror = function (event) {
            console.error("無法開啟資料庫", event);
        };
    }

    function loadRouteData() {
        const transaction = db.transaction('routeRecords', 'readonly');
        const store = transaction.objectStore('routeRecords');
        const request = store.getAll();

        request.onsuccess = function (event) {
            const routes = event.target.result;
            console.log("加載到的路線資料：", routes);
            const routeContainer = document.getElementById('routeContainer');
            routeContainer.innerHTML = ''; // 清空舊資料

            routes.forEach(route => {
                const routeBox = document.createElement('div');
                routeBox.className = 'route-box';
                routeBox.innerHTML = `
                    <div class="route-info">
                        <h2>${route.routeName}</h2>
                        <p>日期: ${route.date}</p>
                        <p>地點: ${route.mtPlace}</p>
                        <button class="delete-button" data-id="${route.recordId}">刪除</button>
                        <button class="download-button" data-id="${route.recordId}">下載</button>
                    </div>
                `;

                routeBox.addEventListener('click', function () {
                    window.location.href = `mapdetails.html?routeId=${route.recordId}`;
                });

                routeContainer.appendChild(routeBox);
            });

            // 刪除和下載按鈕邏輯
            document.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', function (event) {
                    event.stopPropagation();
                    const recordId = parseInt(button.getAttribute('data-id'));
                    deleteRoute(recordId);
                });
            });

            document.querySelectorAll('.download-button').forEach(button => {
                button.addEventListener('click', function (event) {
                    event.stopPropagation();
                    const recordId = parseInt(button.getAttribute('data-id'));
                    downloadRouteFromFirebase(recordId);
                });
            });
        };

        request.onerror = function (event) {
            console.error('加載路線資料時出錯', event);
        };
    }

    // 刪除 IndexedDB 和 Firebase 中的資料
    function deleteRoute(recordId) {
        const transaction = db.transaction('routeRecords', 'readwrite');
        const store = transaction.objectStore('routeRecords');
        const request = store.delete(recordId);

        request.onsuccess = async function () {
            console.log(`IndexedDB 中的記錄 ${recordId} 已刪除`);
            await deleteRouteFromFirebase(recordId); // 同時刪除 Firebase 中的資料

            // 刪除成功後刷新頁面
            location.reload();
        };

        request.onerror = function (event) {
            console.error("刪除資料時出錯", event);
        };
    }

    // 從 Firebase 刪除資料
    async function deleteRouteFromFirebase(recordId) {
        try {
            const q = query(collection(firestoreDB, 'routes'), where('recordId', '==', recordId));
            const snapshot = await getDocs(q);

            snapshot.forEach(doc => {
                deleteDoc(doc.ref);
            });

            console.log(`Firebase 中的記錄 ${recordId} 已刪除`);
        } catch (error) {
            console.error("刪除 Firebase 資料時出錯", error);
        }
    }

    // 從 Firebase 下載資料到 IndexedDB
    async function downloadRouteFromFirebase(recordId) {
        try {
            const q = query(collection(firestoreDB, 'routes'), where('recordId', '==', recordId));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const firebaseRecord = snapshot.docs[0].data();

                // 檢查本地是否已有相同的資料
                const transaction = db.transaction('routeRecords', 'readonly');
                const store = transaction.objectStore('routeRecords');
                const request = store.get(recordId);

                request.onsuccess = function (event) {
                    const localRecord = event.target.result;
                    if (localRecord) {
                        alert('本地已有相同資料，無需下載');
                    } else {
                        // 本地無相同資料，進行下載
                        addRecordToIndexedDB(firebaseRecord);
                        alert('已成功下載');
                    }
                };
            } else {
                console.error(`Firebase 中找不到記錄 ${recordId}`);
            }
        } catch (error) {
            console.error('從 Firebase 下載資料時發生錯誤', error);
        }
    }

    // 將資料加入 IndexedDB
    function addRecordToIndexedDB(record) {
        const transaction = db.transaction('routeRecords', 'readwrite');
        const store = transaction.objectStore('routeRecords');
        const request = store.add(record);

        request.onsuccess = function () {
            console.log(`資料已成功下載到 IndexedDB`);
            alert('資料已成功下載到本地');
        };

        request.onerror = function (event) {
            console.error('資料下載到 IndexedDB 時出錯', event);
        };
    }
});
