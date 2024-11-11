import { sendEmail } from './sendEmail.js';

document.addEventListener("DOMContentLoaded", function () {
    const submitButton = document.querySelector(".contact-btn");

    if (submitButton) {
        submitButton.addEventListener("click", function (event) {
            event.preventDefault(); // 防止按鈕的默認行為

            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const message = document.getElementById("message").value;

            if (!name || !email || !message) {
                alert("請填寫所有欄位！");
                return;
            }

            // 呼叫 sendEmail 函數發送電子郵件
            sendEmail("gomt.nav@gmail.com", email, `聯絡我們的訊息 - 來自: ${name}`, message)
                .then(() => {
                    alert("感謝您的聯絡！\n我們會盡快回覆您。");
                    window.location.href = "profile.html"; // 返回個人資料頁面
                })
                .catch(error => {
                    console.error("電子郵件發送失敗: ", error);
                    alert("抱歉，發送失敗，請稍後再試。");
                });
        });
    }
});
