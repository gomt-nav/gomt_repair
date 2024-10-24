export function checkLoginStatus(callback) {
   
    console.log("checkLoginStatus已導出");
    const dbRequest = indexedDB.open('gomtDB', 8);

    dbRequest.onsuccess = function (event) {
        console.log("成功打開 IndexedDB 資料庫");
        const db = event.target.result;
        const transaction = db.transaction(["sessions"], "readonly");
        const store = transaction.objectStore("sessions");
        
        console.log("正在從 'sessions' 物件存儲空間中查找 'currentUser'...");
        const getUserRequest = store.get('currentUser');

        getUserRequest.onsuccess = function (event) {
            const user = event.target.result;
            if (user) {
                console.log("找到已登入的使用者：", user);
                callback(true, user);  // 用戶已登入
            } else {
                console.log("未找到登入的使用者");
                callback(false, null);  // 用戶未登入
            }
        };

        getUserRequest.onerror = function () {
            console.error("無法檢查登入狀態");
            callback(false, null);
        };
    };

    dbRequest.onerror = function (event) {
        console.error("無法打開 IndexedDB 資料庫: ", event.target.errorCode);
        callback(false, null);
    };
}
