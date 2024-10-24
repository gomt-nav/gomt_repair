
import { sendEmailForgot } from './sendEmail.js';

document.addEventListener("DOMContentLoaded", function () {
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");

    forgotPasswordForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        console.log("輸入的電子郵件:", email);  // 調試電子郵件的值

        // 檢查 email 是否為空或不合法
        if (!email) {
            console.log("電子郵件輸入為空或不合法");
            document.getElementById('message').innerText = "請輸入有效的電子郵件地址";
            return;
        }

        // 打開 IndexedDB 並查找該電子郵件是否存在
        const dbRequest = indexedDB.open('gomtDB', 8);

        dbRequest.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction(['users'], 'readonly');
            const userStore = transaction.objectStore('users');

            // 嘗試通過 'username' 查找
            const emailIndex = userStore.index('mail');  // 使用你提供的 'mail' 索引
            console.log("使用 'username' 索引查找用戶...");

            const userRequest = emailIndex.get(email);

            userRequest.onsuccess = function (event) {
                const userData = event.target.result;
                if (userData) {
                    console.log("找到對應用戶:", userData);

                    // 發送重置密碼的郵件
                    sendEmailForgot(
                        email,
                        "noreply@yourwebsite.com",
                        "重置密碼",
                        `親愛的用戶，\n請點擊以下鏈接來重置您的密碼：\nhttps://gomtnav.ddsking.com/resetPassword?email=${encodeURIComponent(email)} \n如果您未請求重置密碼，請忽略此郵件。`
                    );
                    document.getElementById('message').innerText = "重置密碼的連結已發送到您的電子郵件。";
                } else {
                    console.log("找不到該電子郵件對應的用戶");
                    document.getElementById('message').innerText = "找不到此電子郵件對應的帳戶。";
                }
            };

            userRequest.onerror = function () {
                console.error("查詢用戶資料時發生錯誤");
                document.getElementById('message').innerText = "查詢時發生錯誤，請稍後再試。";
            };
        };

        dbRequest.onerror = function (event) {
            console.error("無法開啟 IndexedDB 資料庫", event);
            document.getElementById('message').innerText = "無法連接資料庫，請稍後再試。";
        };
    });
});
