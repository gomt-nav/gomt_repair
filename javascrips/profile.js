//routeif.js
document.addEventListener("DOMContentLoaded", function () {
    // 綁定各個按鈕的 DOM 元素
    const logoutButton = document.getElementById("logoutButton");
    const navToMapButton = document.getElementById("navToMapButton");
    const accountSettingsButton = document.getElementById("accountSettingsButton");
    const contactUsButton = document.getElementById("contactUsButton");
    const myRoutesLink = document.getElementById("myRoutesLink");
    const downloadedRoutesLink = document.getElementById("downloadedRoutesLink");

    // 用來顯示使用者名稱的 DOM 元素
    const usernameDisplay = document.getElementById("usernameDisplay");

    // 從 IndexedDB 取得登入的使用者資料
    function loadUserProfile() {
        const dbRequest = indexedDB.open('gomtDB', 8);

        dbRequest.onsuccess = function (event) {
            const db = event.target.result;

            // 確認 'users' 和 'sessions' 物件存儲存在
            if (!db.objectStoreNames.contains('users') || !db.objectStoreNames.contains('sessions')) {
                console.error("資料庫中缺少 'users' 或 'sessions' 物件存儲。");
                return;
            }

            const transaction = db.transaction(["users", "sessions"], "readonly");
            const userStore = transaction.objectStore("users");
            const sessionStore = transaction.objectStore("sessions");

            // 檢索 `sessions` 資料庫中的 `currentUser`，用來存放當前登入的用戶
            const sessionRequest = sessionStore.get("currentUser");

            sessionRequest.onsuccess = function (event) {
                const sessionData = event.target.result;
                if (sessionData && sessionData.userId) {
                    // 用戶登入過，根據 `userId` 從 `users` 資料庫中檢索用戶資料
                    const userRequest = userStore.get(sessionData.userId);

                    userRequest.onsuccess = function (event) {
                        const user = event.target.result;
                        if (user) {
                            // 顯示使用者名稱
                            usernameDisplay.textContent = user.username;
                        } else {
                            console.error("未找到用戶資料");
                            alert("無法加載用戶資料，請重新登入");
                            window.location.href = "login.html";
                        }
                    };

                    userRequest.onerror = function (event) {
                        console.error("從 IndexedDB 中檢索用戶資料失敗: ", event.target.error);
                    };
                } else {
                    // 沒有找到登入會話，提示用戶重新登入
                    alert("尚未登入，請重新登入。");
                    window.location.href = "login.html";
                }
            };

            sessionRequest.onerror = function (event) {
                console.error("無法從 sessions 資料庫中獲取當前用戶: ", event.target.errorCode);
            };
        };

        dbRequest.onerror = function (event) {
            console.error("無法打開資料庫: ", event.target.errorCode);
        };
    }

    // 觸發用戶資料加載
    loadUserProfile();

    // 綁定登出按鈕的事件監聽器
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            console.log("登出按鈕被點擊");
            // 清除用戶的本地身份驗證狀態
            const dbRequest = indexedDB.open('gomtDB', 8);
            dbRequest.onsuccess = function (event) {
                const db = event.target.result;
                const transaction = db.transaction(["sessions"], "readwrite");
                const sessionStore = transaction.objectStore("sessions");

                // 移除 currentUser session
                sessionStore.delete("currentUser").onsuccess = function () {
                    console.log("用戶已登出");
                    window.location.href = "login.html";
                };
            };
        });
    }

    // 綁定導航至地圖頁面的按鈕事件監聽器
    if (navToMapButton) {
        navToMapButton.addEventListener("click", function () {
            console.log("山林導航按鈕被點擊");
            window.location.href = "map.html";
        });
    }

    // 綁定帳號設定按鈕的事件監聽器
    if (accountSettingsButton) {
        accountSettingsButton.addEventListener("click", function () {
            console.log("帳號設定按鈕被點擊");
            window.location.href = "account-settings.html";
        });
    }

    // 綁定聯絡我們按鈕的事件監聽器
    if (contactUsButton) {
        contactUsButton.addEventListener("click", function () {
            console.log("聯絡我們按鈕被點擊");
            window.location.href = "contact.html";
        });
    }

    // 綁定我的路線連結的事件監聽器
    if (myRoutesLink) {
        myRoutesLink.addEventListener("click", function () {
            console.log("我的路線連結被點擊");
            window.location.href = "routeif.html?filter=myRoutes";
        });
    }

    // 綁定下載的路線連結的事件監聽器
    if (downloadedRoutesLink) {
        downloadedRoutesLink.addEventListener("click", function () {
            console.log("下載的路線連結被點擊");
            window.location.href = "routeif.html?filter=downloadedRoutes";
        });
    }
});
