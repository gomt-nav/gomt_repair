import { syncIndexedDBToFirebase } from '../db/firebase-sync.js'; // 同步資料至 Firebase
import { getFirestore, collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { firestoreDB } from '../db/firebase-config.js'; // Firestore 配置

// 解析 URL 中的參數
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

document.addEventListener("DOMContentLoaded", function() {
    const resetPasswordForm = document.getElementById("resetPasswordForm");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const messageDiv = document.getElementById("message");

    // 獲取 URL 中的 email 參數
    const email = getQueryParam('email');
    if (!email) {
        messageDiv.innerHTML = '<div class="alert alert-danger">無效的重置連結！</div>';
        resetPasswordForm.style.display = 'none';
        return;
    }

    // 表單提交處理
    resetPasswordForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        // 驗證兩次密碼是否相符
        if (newPassword !== confirmPassword) {
            messageDiv.innerHTML = '<div class="alert alert-danger">密碼不匹配，請重新輸入！</div>';
            return;
        }

        // 更新 IndexedDB 中的密碼
        const dbRequest = indexedDB.open("gomtDB", 8);
        dbRequest.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(["users"], "readwrite");
            const userStore = transaction.objectStore("users");

            // 根據電子郵件查找用戶
            const emailIndex = userStore.index("mail");
            const emailQuery = emailIndex.get(email);

            emailQuery.onsuccess = function() {
                const userData = emailQuery.result;
                if (userData) {
                    // 驗證新密碼是否與原密碼相同
                    if (userData.password === newPassword) {
                        messageDiv.innerHTML = '<div class="alert alert-warning">新密碼不可與原密碼相同！</div>';
                        return;
                    }

                    // 更新用戶密碼
                    userData.password = newPassword;
                    const updateRequest = userStore.put(userData);

                    updateRequest.onsuccess = async function() {
                        messageDiv.innerHTML = '<div class="alert alert-success">密碼已成功重置！</div>';
                        
                        // 同步到 Firebase（如果線上）
                        if (navigator.onLine) {
                            try {
                                await syncUserToFirebase(userData);
                                console.log('Firebase 同步成功！');
                            } catch (error) {
                                console.error('同步至 Firebase 失敗: ', error);
                            }
                        }

                        // 離線狀態下同步到 Firebase，當重新上線時
                        window.addEventListener('online', function() {
                            syncIndexedDBToFirebase();
                        });

                        // 密碼重置成功後導向到 profile.html
                        setTimeout(() => {
                            window.location.href = "profile.html";
                        }, 100); // 延遲 2 秒，以便顯示成功訊息
                    };

                    updateRequest.onerror = function() {
                        messageDiv.innerHTML = '<div class="alert alert-danger">重置密碼失敗，請稍後再試。</div>';
                    };
                } else {
                    messageDiv.innerHTML = '<div class="alert alert-danger">無法找到對應的使用者。</div>';
                }
            };

            emailQuery.onerror = function() {
                messageDiv.innerHTML = '<div class="alert alert-danger">查詢用戶失敗，請稍後再試。</div>';
            };
        };

        dbRequest.onerror = function() {
            messageDiv.innerHTML = '<div class="alert alert-danger">無法連接資料庫。</div>';
        };
    });
});

// 同步用戶資料到 Firebase
async function syncUserToFirebase(userData) {
    try {
        const userId = String(userData.userId); // 確保 userId 是字串格式
        const userDocRef = doc(firestoreDB, 'users', userId);
        await setDoc(userDocRef, userData);
        console.log('Firebase 中用戶資料已更新');
    } catch (error) {
        console.error('同步至 Firebase 失敗: ', error);
    }
}
