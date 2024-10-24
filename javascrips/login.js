document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.querySelector(".login-form");

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault(); // 阻止表單自動提交

        const usernameOrEmail = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        console.log("登入嘗試，使用者名稱或電郵:", usernameOrEmail); // 調試輸出
        console.log("輸入的密碼:", password); // 調試輸出

        // 打開 IndexedDB
        const dbRequest = indexedDB.open("gomtDB", 8);

        dbRequest.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction(["users"], "readonly");
            const store = transaction.objectStore("users");

            console.log("資料庫開啟成功，開始查找使用者資料"); // 調試輸出

            let matchFound = false;

            // 使用游標查找符合 username 或 email 的資料
            const cursorRequest = store.openCursor();

            cursorRequest.onsuccess = function (event) {
                const cursor = event.target.result;

                if (cursor) {
                    const userData = cursor.value;

                    console.log("找到使用者資料:", userData); // 調試輸出

                    // 比對 username 或 email 且密碼正確
                    if ((userData.username === usernameOrEmail || userData.email === usernameOrEmail) && userData.password === password) {
                        matchFound = true;
                        console.log("使用者驗證成功，儲存登入狀態"); // 調試輸出

                        // 使用者登入成功，儲存登入狀態到 IndexedDB 的 sessions
                        saveSession(userData);

                        // 跳轉到個人資料頁面
                        window.location.href = "profile.html";
                    } else {
                        console.log("驗證失敗，繼續查找其他使用者"); // 調試輸出
                        cursor.continue(); // 繼續查找下一個游標
                    }
                } else {
                    if (!matchFound) {
                        console.log("未找到匹配的使用者"); // 調試輸出
                        alert("帳號或密碼錯誤，請重新嘗試！");
                    }
                }
            };

            cursorRequest.onerror = function (event) {
                console.error("查找過程中出現錯誤: ", event.target.error); // 調試輸出
                alert("登入過程中出現問題，請稍後再試！");
            };
        };

        dbRequest.onerror = function (event) {
            console.error("無法開啟 IndexedDB: ", event.target.errorCode); // 調試輸出
            alert("資料庫無法開啟，請稍後再試！");
        };
    });

    // 儲存當前使用者登入狀態到 sessions
    function saveSession(userData) {
        
        const dbRequest = indexedDB.open('gomtDB', 8);

        dbRequest.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction(["sessions"], "readwrite");
            const sessionStore = transaction.objectStore("sessions");

            const sessionData = {
                sessionId: "currentUser", // 固定使用 currentUser 來表示當前登入的用戶
                userId: userData.userId,  // 儲存用戶的 userId
                username: userData.username, // 使用者名稱
                email: userData.email, // 使用者的電子郵件
                loginDate: new Date().toISOString() // 登入時間
            };

            console.log("正在儲存 sessionData:", sessionData); // 調試輸出

            const request = sessionStore.put(sessionData);

            request.onsuccess = function () {
                console.log("登入狀態已儲存到 sessions"); // 調試輸出
            };

            request.onerror = function (event) {
                console.error("儲存登入狀態失敗: ", event.target.error); // 調試輸出
            };
        };

        dbRequest.onerror = function (event) {
            console.error("無法打開資料庫: ", event.target.errorCode); // 調試輸出
        };
    }
});
