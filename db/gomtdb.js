const DB_NAME = 'gomtDB'; // 定義資料庫名稱
const DB_VERSION = 8; // 設定資料庫版本號

let db; // 儲存資料庫的變數

// 開啟資料庫
function openDatabase() {
    let request = indexedDB.open(DB_NAME, DB_VERSION); // 開啟或創建 IndexedDB 資料庫

    request.onupgradeneeded = function (event) {
        db = event.target.result;

        // 建立 routes 物件存儲（路線資料）
        if (!db.objectStoreNames.contains('routes')) {
            let routesStore = db.createObjectStore('routes', { keyPath: 'routeId' }); // 指定 routeId 為主鍵
            routesStore.createIndex('routeName', 'routeName', { unique: false }); // 建立索引 routeName
            routesStore.createIndex('date', 'date', { unique: false }); // 建立索引 date
        }

        // 建立其他資料表格
        // ... 其他資料表格如 weatherData, waterSources...

        // 建立 routeRecords 物件存儲
        if (!db.objectStoreNames.contains('routeRecords')) {
            let routeRecordsStore = db.createObjectStore('routeRecords', { keyPath: 'recordId', autoIncrement: true });

            routeRecordsStore.createIndex('routeName', 'routeName', { unique: false });
            routeRecordsStore.createIndex('date', 'date', { unique: false });
            routeRecordsStore.createIndex('duration', 'duration', { unique: false });
            routeRecordsStore.createIndex('distance', 'distance', { unique: false });
            routeRecordsStore.createIndex('elevationGain', 'elevationGain', { unique: false });
            routeRecordsStore.createIndex('elevationLoss', 'elevationLoss', { unique: false });
            routeRecordsStore.createIndex('mtPlace', 'mtPlace', { unique: false });
            routeRecordsStore.createIndex('gpx', 'gpx', { unique: false });
        }

        // 建立使用者資料表
        if (!db.objectStoreNames.contains('users')) {
            let usersStore = db.createObjectStore('users', { keyPath: 'userId' });
            usersStore.createIndex('username', 'username', { unique: false });
            usersStore.createIndex('mail', 'mail', { unique: false });
            usersStore.createIndex('password', 'password', { unique: false });
            usersStore.createIndex('loginDate', 'loginDate', { unique: false });
        }

        // 建立 sessions 資料表，用來儲存當前登入的使用者
        if (!db.objectStoreNames.contains('sessions')) {
            let sessionsStore = db.createObjectStore('sessions', { keyPath: 'sessionId', autoIncrement: true });
            sessionsStore.createIndex('currentUser', 'currentUser', { unique: false });
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        console.log('資料庫連接成功');
    };

    request.onerror = function (event) {
        console.log('資料庫連接失敗', event);
    };
}

// 新增資料
function addData(storeName, data) {
    let transaction = db.transaction([storeName], 'readwrite');
    let objectStore = transaction.objectStore(storeName);
    let request = objectStore.add(data);

    request.onsuccess = function () {
        console.log(`${storeName} 新增資料成功`);
    };

    request.onerror = function (event) {
        console.log(`${storeName} 新增資料失敗`, event);
    };
}

// 取得所有資料
function getAllData(storeName) {
    return new Promise((resolve, reject) => {
        let transaction = db.transaction([storeName], 'readonly');
        let objectStore = transaction.objectStore(storeName);
        let request = objectStore.getAll();

        request.onsuccess = function (event) {
            resolve(event.target.result);
        };

        request.onerror = function (event) {
            reject('取得資料失敗', event);
        };
    });
}

// 刪除資料
function deleteData(storeName, key) {
    let transaction = db.transaction([storeName], 'readwrite');
    let objectStore = transaction.objectStore(storeName);
    let request = objectStore.delete(key);

    request.onsuccess = function () {
        console.log(`${storeName} 刪除資料成功`);
    };

    request.onerror = function (event) {
        console.log(`${storeName} 刪除資料失敗`, event);
    };
}

// 更新資料
function updateData(storeName, data) {
    let transaction = db.transaction([storeName], 'readwrite');
    let objectStore = transaction.objectStore(storeName);
    let request = objectStore.put(data);

    request.onsuccess = function () {
        console.log(`${storeName} 更新資料成功`);
    };

    request.onerror = function (event) {
        console.log(`${storeName} 更新資料失敗`, event);
    };
}

// 開啟資料庫
openDatabase();
