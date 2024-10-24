// 引入寄送驗證信的功能模組
import { sendVerificationEmail } from './sendEmail.js';
import { syncIndexedDBToFirebase } from '../db/firebase-sync.js'; // 匯入同步功能

// 等待網頁DOM完全加載後執行主要邏輯
document.addEventListener("DOMContentLoaded", function () {
    // 獲取表單和各個輸入框的DOM元素
    const updateForm = document.querySelector("form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const nameInput = document.getElementById("name");

    // 加載當前用戶資料的函數
    function loadCurrentUser() {
        // 開啟indexedDB數據庫
        const dbRequest = indexedDB.open("gomtDB", 8);
        dbRequest.onsuccess = function (event) {
            const db = event.target.result;
            // 開啟唯讀交易，並選擇"users"和"sessions"資料存儲空間
            const transaction = db.transaction(["users", "sessions"], "readonly");
            const sessionStore = transaction.objectStore("sessions");
            const userStore = transaction.objectStore("users");

            // 獲取當前用戶的會話資料
            const sessionRequest = sessionStore.get("currentUser");
            sessionRequest.onsuccess = function (event) {
                const sessionData = event.target.result;
                if (sessionData && sessionData.userId) {
                    // 根據會話資料中的用戶ID獲取用戶資料
                    const userRequest = userStore.get(sessionData.userId);
                    userRequest.onsuccess = function (event) {
                        const userData = event.target.result;
                        if (userData) {
                            // 將用戶資料加載到輸入框中
                            emailInput.value = userData.email;
                            nameInput.value = userData.username;
                        } else {
                            // 如果無法加載用戶資料，跳轉到登入頁面
                            alert("無法加載使用者資料，請重新登入！");
                            window.location.href = "login.html";
                        }
                    };
                } else {
                    // 如果會話不存在，提示用戶重新登入
                    alert("尚未登入，請重新登入！");
                    window.location.href = "login.html";
                }
            };
        };
    }

    // 為表單提交事件添加監聽
    updateForm.addEventListener("submit", function (event) {
        event.preventDefault();

        // 獲取輸入框中的新資料
        const newEmail = emailInput.value.trim();
        const newName = nameInput.value.trim();
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        // 確認新密碼與確認密碼是否一致
        if (newPassword !== confirmPassword) {
            alert("新密碼與確認密碼不一致！");
            return;
        }

        // 再次開啟數據庫進行讀寫操作
        const dbRequest = indexedDB.open("gomtDB", 8);
        dbRequest.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction(["users", "sessions"], "readwrite");
            const sessionStore = transaction.objectStore("sessions");
            const userStore = transaction.objectStore("users");

            // 獲取當前用戶的會話資料
            const sessionRequest = sessionStore.get("currentUser");

            sessionRequest.onsuccess = function (event) {
                const sessionData = event.target.result;
                if (sessionData && sessionData.userId) {
                    // 根據會話中的用戶ID獲取用戶資料
                    const userRequest = userStore.get(sessionData.userId);
                    userRequest.onsuccess = function (event) {
                        const userData = event.target.result;
                        if (userData) {
                            // 確認新密碼不可與舊密碼相同
                            if (userData.password === newPassword) {
                                alert("新密碼不可與舊密碼相同！");
                                return;
                            }

                            // 更新用戶資料
                            userData.username = newName;
                            userData.email = newEmail;
                            userData.password = newPassword;

                            // 將更新後的資料存回數據庫
                            const updateUserRequest = userStore.put(userData);

                            updateUserRequest.onsuccess = function () {
                                alert("帳號資訊更新成功！");
                                // 成功後發送驗證信到新的電子郵件地址
                                // sendVerificationEmail(newEmail);

                                // 同步資料到 Firebase
                                syncIndexedDBToFirebase();
                            };
                        }
                    };
                }
            };
        };
    });

    // 加載當前用戶資料
    loadCurrentUser();
});
