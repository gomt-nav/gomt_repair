export function getGPXDataFromIndexedDB(routeId) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('gomtDB', 8);

        request.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction('routeRecords', 'readonly');
            const store = transaction.objectStore('routeRecords');
            const getRequest = store.get(routeId);

            getRequest.onsuccess = function (event) {
                resolve(event.target.result);
            };

            getRequest.onerror = function (event) {
                reject('無法讀取資料: ' + event.target.errorCode);
            };
        };

        request.onerror = function (event) {
            reject('無法開啟資料庫: ' + event.target.errorCode);
        };
    });
}
