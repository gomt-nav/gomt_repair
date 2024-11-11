import { getFirestore, collection, addDoc, deleteDoc, doc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { firestoreDB } from '../db/firebase-config.js'; // 從 firebase-config 導入 firestoreDB
import { checkLoginStatus } from './loginValidator.js';

const DB_NAME = 'gomtDB';
const DB_VERSION = 8;
let db;

document.addEventListener("DOMContentLoaded", function () {
    checkLoginStatus((isLoggedIn, user) => {
        if (!isLoggedIn) {
            alert("您需要登入才能使用此功能。");
        } else {
            console.log("已登入的使用者資料：", user);
            openDatabase();
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
            loadRouteData();
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
            routeContainer.innerHTML = '';

            routes.forEach(route => {
                const routeTemplate = document.getElementById('routeInfoTemplate');
                const routeBox = routeTemplate.cloneNode(true);
                routeBox.classList.remove('d-none');

                routeBox.querySelector('.route-name').innerText = route.routeName;
                routeBox.querySelector('.route-date').innerText = `日期: ${route.date}`;
                routeBox.querySelector('.route-place').innerText = `地點: ${route.mtPlace}`;
                routeBox.querySelector('.route-memo').innerText = `備忘錄: ${route.memo}`;

                routeBox.querySelector('.delete-button').addEventListener('click', function (event) {
                    event.stopPropagation();
                    deleteRoute(route.recordId);
                });

                routeBox.querySelector('.download-button').addEventListener('click', function (event) {
                    event.stopPropagation();
                    downloadRouteFromFirebase(route.recordId);
                });

                routeBox.addEventListener('click', function () {
                    window.location.href = `mapdetails.html?routeId=${route.recordId}`;
                });

                routeContainer.appendChild(routeBox);
            });
        };

        request.onerror = function (event) {
            console.error('加載路線資料時出錯', event);
        };
    }

    function deleteRoute(recordId) {
        const transaction = db.transaction('routeRecords', 'readwrite');
        const store = transaction.objectStore('routeRecords');
        const request = store.delete(recordId);

        request.onsuccess = async function () {
            console.log(`IndexedDB 中的記錄 ${recordId} 已刪除`);
            await deleteRouteFromFirebase(recordId);
            location.reload();
        };

        request.onerror = function (event) {
            console.error("刪除資料時出錯", event);
        };
    }

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

    async function downloadRouteFromFirebase(recordId) {
        try {
            const q = query(collection(firestoreDB, 'routes'), where('recordId', '==', recordId));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const firebaseRecord = snapshot.docs[0].data();

                const transaction = db.transaction('routeRecords', 'readonly');
                const store = transaction.objectStore('routeRecords');
                const request = store.get(recordId);

                request.onsuccess = function (event) {
                    const localRecord = event.target.result;
                    if (localRecord) {
                        alert('本地已有相同資料，無需下載');
                    } else {
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
