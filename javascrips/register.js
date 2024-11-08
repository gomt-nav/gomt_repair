document.addEventListener("DOMContentLoaded", function () {
    const registerButton = document.getElementById("registerButton");

    registerButton.addEventListener("click", function (event) {
        event.preventDefault(); // 防止表單自動提交（雖然沒有 `<form>`，仍然加上這行保險）

        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // 確保所有欄位都有填寫
        if (!username || !email || !password) {
            alert("請填寫所有欄位！");
            return;
        }

        // 建立用戶資料物件
        const userData = {
            userId: new Date().getTime(),  // 使用唯一值作為 userId
            username: username,
            mail: email,
            password: password
        };

        // 開啟 IndexedDB 資料庫
        const dbRequest = indexedDB.open('gomtDB', 8);

        dbRequest.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');

            // 將用戶資料加入 `users` ObjectStore 中
            const addRequest = store.add(userData);

            addRequest.onsuccess = function () {
                console.log("用戶資料已成功加入 IndexedDB");

                // 儲存新註冊用戶的登入狀態到 localStorage
                localStorage.setItem("loggedInUser", JSON.stringify(userData));

                // 跳轉到個人資料頁面
                window.location.href = "profile.html";
            };

            addRequest.onerror = function (event) {
                console.error("無法加入用戶資料: ", event.target.error);
            };
        };

        dbRequest.onerror = function (event) {
            console.error("無法開啟資料庫: ", event.target.errorCode);
        };
    });
});
