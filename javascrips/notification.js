export function showNotification(title, message) {
    if ("Notification" in window) {
        // 請求通知權限
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        // 顯示推播通知
        if (Notification.permission === "granted") {
            new Notification(title, {
                body: message,
                icon: "./icons/icon-192x192.png" // 通知圖示
            });
        }
    } else {
        console.error("此瀏覽器不支援通知功能。");
    }
}

// 載入並顯示最新通知
export async function loadAndPushNotifications() {
    try {
        const response = await fetch('/notifications'); // 向伺服器請求 notifications.json
        const notifications = await response.json();

        // 確認通知數據為陣列
        if (Array.isArray(notifications)) {
            notifications.forEach(notification => {
                showNotification(notification.title, notification.message);
            });
        } else {
            console.error('通知數據格式錯誤，期望為陣列:', notifications);
        }
    } catch (error) {
        console.error('無法載入通知:', error);
    }
}