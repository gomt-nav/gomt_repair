import { sendEmail } from './sendEmail.js';  // 引入 sendEmail 功能

document.addEventListener("DOMContentLoaded", function () {
    // 獲取表單和輸入框的 DOM 元素
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    const emailInput = document.getElementById("email");

    // 為表單提交事件添加監聽
    forgotPasswordForm.addEventListener("submit", function (event) {
        event.preventDefault();  // 防止表單的默認提交行為

        const email = emailInput.value.trim();  // 獲取輸入的電子郵件

        if (!email) {
            alert("請輸入您的電子郵件地址！");
            return;
        }

        // 構建重置密碼的郵件內容
        const subject = "重置密碼";
        const message = `
            親愛的用戶，\n
            您已請求重置密碼，請點擊以下鏈接來完成密碼重置：\n
            https://yourwebsite.com/reset-password?email=${encodeURIComponent(email)} \n
            如果您並未請求重置密碼，請忽略此郵件。\n
            感謝您！
        `;

        // 使用 sendEmail 功能發送重置密碼郵件
        sendEmail(email, "", subject, message);

        // 顯示成功提示，並清除輸入框
        const messageDiv = document.getElementById("message");
        messageDiv.innerHTML = `<div class="alert alert-success" role="alert">
            重置密碼的鏈接已發送至您的電子郵件，請檢查您的收件箱！
        </div>`;
        emailInput.value = "";  // 清除輸入框
    });
});
