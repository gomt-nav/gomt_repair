// 確保 EmailJS SDK 已初始化
(function(){
    emailjs.init("B6zFwgyu5FF07aHMS"); //userID
    console.log('emailjs初始化成功');
})();

/**
 * 發送電子郵件
 * @param {string} toEmail - 收件人的電子郵件地址
 * @param {string} fromEmail - 寄件人的電子郵件地址 (如果適用)
 * @param {string} subject - 郵件主題
 * @param {string} message - 郵件內容
 */
function sendEmail(toEmail, fromEmail = "", subject = "郵件主題", message = "郵件內容") {
    console.log(`寄送郵件至: ${toEmail}`);
    console.log(`來自: ${fromEmail}`);
    console.log(`主題: ${subject}`);
    console.log(`內容: ${message}`);

    // 使用 EmailJS 發送郵件
    emailjs.send("service_9ww3q6s", "template_q44vklq", {
        to_name: toEmail,            // 對應到模板中的 {{to_name}}
        from_name: fromEmail,        // 對應到模板中的 {{from_name}}
        message: message,            // 對應到模板中的 {{message}}
        reply_to: fromEmail,         // 對應到模板中的 {{reply_to}}
        subject: subject             // 對應到模板中的 {{subject}}
    }).then(function(response) {
        console.log('郵件發送成功！', response.status, response.text);
        alert(`郵件已成功發送至 ${toEmail}！`);
    }, function(error) {
        console.error('郵件發送失敗...', error);
        alert('郵件發送失敗，請稍後再試！');
    });
}

/**
 * 發送驗證信到指定的電子郵件地址
 * @param {string} email - 目標電子郵件地址
 * @param {string} subject - 郵件主題 (預設為 "帳號驗證")
 * @param {string} message - 郵件內容 (預設為 "您的帳號密碼已變更")
 */
function sendVerificationEmail(email, subject = "帳號驗證", message = "您的帳號密碼已變更") {
    sendEmail(email, "", subject, message);
}

export { sendEmail, sendVerificationEmail };
