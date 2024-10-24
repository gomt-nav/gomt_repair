import { currentPosition } from './leaflet-map.js';  // 假設兩個文件位於相同路徑

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('sendEmergencySms').addEventListener('click', function () {
        if (currentPosition) {
            sendEmergencyMessage(currentPosition);
        } else {
            alert('無法取得您的位置，請確認定位功能是否開啟。');
        }
    });

    function sendEmergencyMessage(position) {
        const latitude = position.latitude;
        const longitude = position.longitude;
        const accuracy = position.accuracy;

        const message = `緊急情況！我的當前位置是：\nhttps://maps.google.com/?q=${latitude},${longitude}\n位置準確度：${accuracy} 公尺。`;

        const emergencyNumber = '0928730871';
        const smsUrl = `sms:${emergencyNumber}?body=${encodeURIComponent(message)}`;

        window.location.href = smsUrl;
    }
});
