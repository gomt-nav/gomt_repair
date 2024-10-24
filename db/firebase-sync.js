//firebase-sync.js
import { getFirestore, collection, addDoc, deleteDoc, doc, getDocs, persistentLocalCache } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { app, firestoreDB } from './firebase-config.js';  // 匯入 Firebase App 和 Firestore

// 使用已經初始化的 Firestore
const firestore = getFirestore(app); // 使用 getFirestore 獲取已初始化的 Firestore

// 同步會員和路線資料到 Firebase
async function syncIndexedDBToFirebase() {
    // 檢查網絡狀態
    if (!navigator.onLine) {
        console.log('離線狀態，等待重新上線後進行同步');
        return;
    }

    const dbRequest = indexedDB.open('gomtDB', 8);

    dbRequest.onupgradeneeded = function (event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('routeRecords')) {
            db.createObjectStore('routeRecords', { keyPath: 'recordId', autoIncrement: true });
            console.log("routeRecords object store 已創建");
        }
        if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'userId', autoIncrement: false });
            console.log("users object store 已創建");
        }
    };

    dbRequest.onsuccess = function (event) {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('routeRecords') || !db.objectStoreNames.contains('users')) {
            console.error("routeRecords 或 users object store 不存在。");
            return;
        }

        // 同步資料
        syncRoutes(db);
        syncUsers(db);
    };

    dbRequest.onerror = function (event) {
        console.error("無法開啟 IndexedDB", event);
    };
}

// 同步路線資料的函式
async function syncRoutes(db) {
    const transaction = db.transaction(['routeRecords'], 'readonly');
    const store = transaction.objectStore('routeRecords');
    const getAllRecords = store.getAll();

    getAllRecords.onsuccess = async function () {
        const indexedDbRecords = getAllRecords.result;

        try {
            const firebaseRecordsSnapshot = await getDocs(collection(firestoreDB, 'routes'));
            const firebaseRecords = firebaseRecordsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            for (let firebaseRecord of firebaseRecords) {
                if (!indexedDbRecords.some(record => record.recordId === firebaseRecord.recordId)) {
                    await deleteDoc(doc(firestoreDB, 'routes', firebaseRecord.id));
                    console.log(`成功刪除 Firebase 路線記錄: ${firebaseRecord.recordId}`);
                }
            }

            for (let indexedDbRecord of indexedDbRecords) {
                const existsInFirebase = firebaseRecords.some(record => record.recordId === indexedDbRecord.recordId);
                if (!existsInFirebase) {
                    await addDoc(collection(firestoreDB, 'routes'), indexedDbRecord);
                    console.log(`成功新增 Firebase 路線記錄: ${indexedDbRecord.recordId}`);
                }
            }
            console.log("路線資料同步成功！");
        } catch (error) {
            console.error("同步路線資料時發生錯誤: ", error);
        }
    };

    getAllRecords.onerror = function () {
        console.error("無法從 IndexedDB 讀取路線資料。");
    };
}

// 同步會員資料的函式
async function syncUsers(db) {
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const getAllUsers = store.getAll();

    getAllUsers.onsuccess = async function () {
        const indexedDbUsers = getAllUsers.result;

        try {
            const firebaseUsersSnapshot = await getDocs(collection(firestoreDB, 'users'));
            const firebaseUsers = firebaseUsersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            for (let firebaseUser of firebaseUsers) {
                if (!indexedDbUsers.some(user => user.userId === firebaseUser.userId)) {
                    await deleteDoc(doc(firestoreDB, 'users', firebaseUser.id));
                    console.log(`成功刪除 Firebase 會員資料: ${firebaseUser.userId}`);
                }
            }

            for (let indexedDbUser of indexedDbUsers) {
                const existsInFirebase = firebaseUsers.some(user => user.userId === indexedDbUser.userId);
                if (!existsInFirebase) {
                    await addDoc(collection(firestoreDB, 'users'), indexedDbUser);
                    console.log(`成功新增 Firebase 會員資料: ${indexedDbUser.userId}`);
                }
            }
            console.log("會員資料同步成功！");
        } catch (error) {
            console.error("同步會員資料時發生錯誤: ", error);
        }
    };

    getAllUsers.onerror = function () {
        console.error("無法從 IndexedDB 讀取會員資料。");
    };
}

// 在網路變回在線時進行同步
window.addEventListener('online', syncIndexedDBToFirebase);

// 立即同步資料（頁面加載或有變更時）
syncIndexedDBToFirebase();

export { syncIndexedDBToFirebase };
