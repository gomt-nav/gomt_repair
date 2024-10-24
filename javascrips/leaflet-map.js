import { getGPXDataFromIndexedDB } from '../db/indexeddb-helper.js';
import { checkLoginStatus } from './loginValidator.js';

// 將 currentPosition 變數導出，以便其他模組引用
export let currentPosition = null; // 全局變數，存儲使用者的當前位置

document.addEventListener("DOMContentLoaded", function () {
    // 初始化 Leaflet 地圖
    var map = L.map('map').setView([25.0330, 121.5654], 13); // 初始位置設置為台北市

    // 設定全局 marker 的圖示，這裡使用 Leaflet 的默認圖像
    L.Marker.prototype.options.icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // 添加 OpenStreetMap 圖層
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 用於記錄路徑的多邊線（polyline）
    var pathCoordinates = []; // 初始化為全局變數
    var polyline = L.polyline(pathCoordinates, { color: 'red' }).addTo(map);

    // 運算數據的變數
    var totalDistance = 0; // 總距離
    var prevLatLng = null; // 上一個點的位置
    var totalElevationGain = 0; // 總爬升
    var prevAltitude = null; // 上一次的海拔
    var startTime = null; // 開始時間

    // 更新時間、距離、高度的 UI
    function updateUI() {
        const currentTime = new Date();

        // 確保 startTime 已初始化
        if (startTime) {
            const elapsedTime = Math.floor((currentTime - startTime) / 1000); // 計算秒數
            const hours = Math.floor(elapsedTime / 3600);
            const minutes = Math.floor((elapsedTime % 3600) / 60);
            const seconds = elapsedTime % 60;
            document.getElementById("time").innerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            // 如果 startTime 未初始化，顯示初始時間
            document.getElementById("time").innerText = "00:00:00";
        }

        document.getElementById("distance").innerText = totalDistance.toFixed(2) + " KM";
        document.getElementById("elevation").innerText = totalElevationGain.toFixed(2) + " M";
    }

    // 初始化 GPX 路線圖層
    var gpxLayer;

    // 解析 URL 參數，獲取 routeId
    const urlParams = new URLSearchParams(window.location.search);
    const routeId = urlParams.get('routeId');

    if (routeId) {
        // 從 IndexedDB 讀取對應的 GPX 資料，並顯示在地圖上
        loadGPXFromIndexedDB(routeId);
    }

    // 從 IndexedDB 讀取並顯示 GPX 路線資料
    function loadGPXFromIndexedDB(routeId) {
        const dbRequest = indexedDB.open('gomtDB', 8);

        dbRequest.onsuccess = function (event) {
            var db = event.target.result;
            var transaction = db.transaction(["routeRecords"], "readonly");
            var store = transaction.objectStore("routeRecords");
            var request = store.get(parseInt(routeId));

            request.onsuccess = function (event) {
                const route = event.target.result;
                if (route && route.gpx) {
                    gpxLayer = new L.GPX(route.gpx, { async: true }).addTo(map);
                    gpxLayer.on('loaded', function (e) {
                        map.fitBounds(e.target.getBounds()); // 調整地圖視野到 GPX 範圍

                        pathCoordinates = gpxLayer.getLayers().flatMap(layer => {
                            if (typeof layer.getLatLngs === 'function') {
                                return layer.getLatLngs();
                            }
                            return [];
                        });
                        console.log(pathCoordinates); // 檢查是否正確取得 pathCoordinates
                    });
                } else {
                    console.error("未找到對應的 GPX 資料");
                }
            };

            request.onerror = function (event) {
                console.error("無法從 IndexedDB 中讀取 GPX 資料: ", event.target.errorCode);
            };
        };

        dbRequest.onerror = function (event) {
            console.error("無法開啟資料庫: ", event.target.errorCode);
        };
    }

    // 初始化地圖標記
    var marker = L.marker([25.0330, 121.5654]).addTo(map).bindPopup('現在位置').openPopup();

    // 自動開始定位
    startNavigation();

    // 導航功能
    function startNavigation() {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(function (position) {
                var lat = position.coords.latitude;
                var lon = position.coords.longitude;
                var altitude = position.coords.altitude;
                var userLatLng = L.latLng(lat, lon);

                // 更新全局位置變數，讓其他模組可以使用
                currentPosition = {
                    latitude: lat,
                    longitude: lon,
                    altitude: altitude,
                    accuracy: position.coords.accuracy
                };

                if (pathCoordinates && pathCoordinates.length > 0) {
                    var nearestPoint = getNearestPointOnRoute(userLatLng, pathCoordinates);
                    if (nearestPoint) {
                        var distanceToRoute = userLatLng.distanceTo(nearestPoint);

                        if (distanceToRoute > 20) {
                            marker.bindPopup('偏離路線，請調整方向').openPopup();
                        } else {
                            marker.bindPopup('沿著路線行走').openPopup();
                        }
                    } else {
                        marker.bindPopup('無法找到最近的路徑點').openPopup();
                    }
                }

                // 更新標記位置
                marker.setLatLng(userLatLng);
                map.setView(userLatLng, map.getZoom());

                // 計算總距離
                if (prevLatLng) {
                    var distance = prevLatLng.distanceTo(userLatLng) / 1000; // 轉換為公里
                    totalDistance += distance;
                }
                prevLatLng = userLatLng;

                // 計算爬升
                if (prevAltitude !== null && altitude !== null) {
                    var elevationChange = altitude - prevAltitude;
                    if (elevationChange > 0) {
                        totalElevationGain += elevationChange;
                    }
                }
                prevAltitude = altitude;

                // 更新 UI
                updateUI();

            }, function (error) {
                console.error("導航失敗: ", error);
            }, { enableHighAccuracy: true });
        } else {
            alert('您的裝置不支援導航功能');
        }
    }

    // 計算使用者距離路徑最近的點
    function getNearestPointOnRoute(userLatLng, pathCoordinates) {
        let nearestPoint = null;
        let minDistance = Infinity;

        pathCoordinates.forEach(function (coord) {
            var routePoint = L.latLng(coord);
            var distance = userLatLng.distanceTo(routePoint);

            if (distance < minDistance) {
                minDistance = distance;
                nearestPoint = routePoint;
            }
        });

        return nearestPoint;
    }

    // 開始/停止記錄按鈕
    var isRecording = false;
    var recordButton = document.getElementById("recordButton");

    recordButton.addEventListener("click", function () {
        checkLoginStatusAndStartRecording(); // 檢查登入狀態並決定是否開始記錄
    });

    // 檢查登入狀態並開始記錄
    function checkLoginStatusAndStartRecording() {
        checkLoginStatus((isLoggedIn, user) => {
            if (isLoggedIn) {
                handleRecording();
            } else {
                showLoginPrompt();
            }
        });
    }

    // 顯示未登入提示視窗
    function showLoginPrompt() {
        const loginPromptHtml = `
            <div class="modal" tabindex="-1" id="loginPromptModal">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">請先登入</h5>
                        </div>
                        <div class="modal-body">
                            <p>您需要先登入帳號才能開始記錄路線。</p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" id="loginButton">前往登入</button>
                            <button class="btn btn-secondary" id="closePromptButton">關閉</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', loginPromptHtml);

        document.getElementById("loginButton").addEventListener("click", function () {
            window.location.href = "login.html"; // 前往登入頁面
        });

        document.getElementById("closePromptButton").addEventListener("click", function () {
            document.getElementById("loginPromptModal").remove();
        });

        new bootstrap.Modal(document.getElementById("loginPromptModal")).show();
    }

    // 處理記錄路徑的邏輯
    function handleRecording() {
        if (!isRecording) {
            isRecording = true;
            recordButton.innerText = "停止記錄";
            startTime = new Date(); // 在這裡初始化開始時間

            // 開始記錄過程
            if (navigator.geolocation) {
                navigator.geolocation.watchPosition(function (position) {
                    var lat = position.coords.latitude;
                    var lon = position.coords.longitude;
                    var altitude = position.coords.altitude;

                    marker.setLatLng([lat, lon]);
                    map.setView([lat, lon], map.getZoom());

                    pathCoordinates.push([lat, lon]);
                    polyline.setLatLngs(pathCoordinates);

                    if (prevLatLng) {
                        var distance = prevLatLng.distanceTo(L.latLng(lat, lon)) / 1000; // 轉換為公里
                        totalDistance += distance;
                    }
                    prevLatLng = L.latLng(lat, lon);

                    if (prevAltitude !== null && altitude !== null) {
                        var elevationChange = altitude - prevAltitude;
                        if (elevationChange > 0) {
                            totalElevationGain += elevationChange;
                        }
                    }
                    prevAltitude = altitude;

                    updateUI();

                }, function (error) {
                    console.error("定位失敗: ", error);
                }, { enableHighAccuracy: true });
            }
        } else {
            isRecording = false;
            recordButton.innerText = "開始記錄";
            openSaveWindow();
        }
    }



    // 彈出儲存視窗 
    function openSaveWindow() {
        const saveWindowHtml = `
    <div class="modal" tabindex="-1" id="saveModal">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">建立路線檔</h5>
                </div>
                <div class="modal-body">
                    <label for="routeName">輸入檔名:</label>
                    <input type="text" id="routeName" class="form-control" placeholder="輸入檔名" />
                    <label for="routeCity">選擇城市:</label>
                    <select id="routeCity" class="form-select">
                        <option value="臺北市">臺北市</option>
<option value="新北市">新北市</option>
<option value="桃園市">桃園市</option>
<option value="臺中市">臺中市</option>
<option value="臺南市">臺南市</option>
<option value="高雄市">高雄市</option>
<option value="基隆市">基隆市</option>
<option value="新竹市">新竹市</option>
<option value="嘉義市">嘉義市</option>
<option value="新竹縣">新竹縣</option>
<option value="苗栗縣">苗栗縣</option>
<option value="彰化縣">彰化縣</option>
<option value="南投縣">南投縣</option>
<option value="雲林縣">雲林縣</option>
<option value="嘉義縣">嘉義縣</option>
<option value="屏東縣">屏東縣</option>
<option value="宜蘭縣">宜蘭縣</option>
<option value="花蓮縣">花蓮縣</option>
<option value="臺東縣">臺東縣</option>
<option value="澎湖縣">澎湖縣</option>
<option value="金門縣">金門縣</option>
<option value="連江縣">連江縣</option>

                    </select>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="saveRoute">儲存</button>
                    <button class="btn btn-secondary" id="cancelRoute">取消</button>
                </div>
            </div>
        </div>
    </div>
    `;
        document.body.insertAdjacentHTML('beforeend', saveWindowHtml);
        document.getElementById("saveRoute").addEventListener("click", saveRouteToGpx);
        document.getElementById("cancelRoute").addEventListener("click", function () {
            document.getElementById("saveModal").remove();
        });
        new bootstrap.Modal(document.getElementById("saveModal")).show();
    }


    // 將路徑存為 GPX 並儲存到 IndexedDB
    function saveRouteToGpx() {
        const routeName = document.getElementById("routeName").value;
        const routeCity = document.getElementById("routeCity").value;

        // 獲取預估時間、距離、海拔高度等數據
        const duration = document.getElementById("time").innerText;
        const distance = document.getElementById("distance").innerText;
        const elevationGain = document.getElementById("elevation").innerText;

        // 檢查必填欄位是否都有值
        if (!routeName || !routeCity) {
            alert("請輸入路線名稱並選擇城市！");
            return;
        }

        // 將路徑數據轉為 GPX 格式
        let gpxData = `<?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1" creator="GoMT" xmlns="http://www.topografix.com/GPX/1/1">
            <trk><name>${routeName}</name><trkseg>`;
        pathCoordinates.forEach(coord => {
            gpxData += `<trkpt lat="${coord[0]}" lon="${coord[1]}"></trkpt>`;
        });
        gpxData += `</trkseg></trk></gpx>`;

        // 打開 IndexedDB
        var dbRequest = indexedDB.open('gomtDB', 8);

        dbRequest.onsuccess = function (event) {
            var db = event.target.result;
            var transaction = db.transaction(["routeRecords"], "readwrite");
            var store = transaction.objectStore("routeRecords");

            // 準備要插入的數據
            var data = {
                routeName: routeName,
                date: new Date().toISOString(),
                duration: duration,
                distance: distance,
                elevationGain: elevationGain,
                // elevationLoss: elevationLoss,
                mtPlace: routeCity,
                gpx: gpxData
            };

            // 確保資料有正確的數據
            if (data.routeName && data.date && data.gpx) {
                store.add(data).onsuccess = function () {
                    alert("路線已成功儲存！");
                    location.reload();  // 儲存後刷新頁面
                };

                store.onerror = function (event) {
                    console.error("新增資料時發生錯誤: ", event.target.error);
                };
            } else {
                console.error("資料缺少必要欄位，無法儲存。");
            }
        };

        dbRequest.onerror = function (event) {
            console.error("無法開啟資料庫: ", event.target.errorCode);
        };

        // 移除彈窗
        document.getElementById("saveModal").remove();
    }
});
