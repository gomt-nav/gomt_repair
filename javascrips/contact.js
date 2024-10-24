import { sendEmail } from './sendEmail.js';

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("contactForm").addEventListener("submit", function (event) {
        event.preventDefault(); // 防止表單的默認提交行為

        const email = document.getElementById("email").value;
        const message = document.getElementById("message").value;

        // 呼叫 sendEmail 函數發送電子郵件
        sendEmail("gomt.nav@gmail.com", email, "聯絡我們的訊息", message);

        // 提示用戶感謝信息
        alert("感謝您的聯絡！\n我們會盡快回覆您。");
        window.location.href = "profile.html"; // 返回個人資料頁面
    });
});
