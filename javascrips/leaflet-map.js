import { getGPXDataFromIndexedDB } from '../db/indexeddb-helper.js';
import { checkLoginStatus } from './loginValidator.js';

// 將 currentPosition 變數導出，以便其他模組引用
export let currentPosition = null; // 全局變數，存儲使用者的當前位置

document.addEventListener("DOMContentLoaded", function () {
    var map = L.map('map').setView([25.0330, 121.5654], 13); // 初始位置設置為台北市

    L.Marker.prototype.options.icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var pathCoordinates = [];
    var polyline = L.polyline(pathCoordinates, { color: 'red' }).addTo(map);

    var totalDistance = 0;
    var prevLatLng = null;
    var totalElevationGain = 0; // 總爬升
    var elevationLoss = 0; // 新增總下降變數
    var prevAltitude = null;
    var startTime = null;

    function updateUI() {
        const currentTime = new Date();

        if (startTime) {
            const elapsedTime = Math.floor((currentTime - startTime) / 1000);
            const hours = Math.floor(elapsedTime / 3600);
            const minutes = Math.floor((elapsedTime % 3600) / 60);
            const seconds = elapsedTime % 60;
            document.getElementById("time").innerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            document.getElementById("time").innerText = "00:00:00";
        }

        document.getElementById("distance").innerText = totalDistance.toFixed(2) + " KM";
        document.getElementById("elevation").innerText = totalElevationGain.toFixed(2) + " M";
        document.getElementById("elevationLoss").innerText = elevationLoss.toFixed(2) + " M"; // 更新總下降 UI
    }

    var gpxLayer;
    const urlParams = new URLSearchParams(window.location.search);
    const routeId = urlParams.get('routeId');

    if (routeId) {
        loadGPXFromIndexedDB(routeId);
    }

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
                        map.fitBounds(e.target.getBounds());

                        pathCoordinates = gpxLayer.getLayers().flatMap(layer => {
                            if (typeof layer.getLatLngs === 'function') {
                                return layer.getLatLngs();
                            }
                            return [];
                        });
                        console.log(pathCoordinates);
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

    var marker = L.marker([25.0330, 121.5654]).addTo(map).bindPopup('現在位置').openPopup();

    startNavigation();

    function startNavigation() {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(function (position) {
                var lat = position.coords.latitude;
                var lon = position.coords.longitude;
                var altitude = position.coords.altitude;
                var userLatLng = L.latLng(lat, lon);

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

                marker.setLatLng(userLatLng);
                map.setView(userLatLng, map.getZoom());

                if (prevLatLng) {
                    var distance = prevLatLng.distanceTo(userLatLng) / 1000;
                    totalDistance += distance;
                }
                prevLatLng = userLatLng;

                // 計算總爬升和總下降
                if (prevAltitude !== null && altitude !== null) {
                    var elevationChange = altitude - prevAltitude;
                    if (elevationChange > 0) {
                        totalElevationGain += elevationChange;
                    } else if (elevationChange < 0) {
                        elevationLoss += Math.abs(elevationChange); // 計算總下降
                    }
                }
                prevAltitude = altitude;

                updateUI();

            }, function (error) {
                console.error("導航失敗: ", error);
            }, { enableHighAccuracy: true });
        } else {
            alert('您的裝置不支援導航功能');
        }
    }

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

    var isRecording = false;
    var recordButton = document.getElementById("recordButton");

    recordButton.addEventListener("click", function () {
        checkLoginStatusAndStartRecording();
    });

    function checkLoginStatusAndStartRecording() {
        checkLoginStatus((isLoggedIn, user) => {
            if (isLoggedIn) {
                handleRecording();
            } else {
                showLoginPrompt();
            }
        });
    }

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
            window.location.href = "login.html";
        });

        document.getElementById("closePromptButton").addEventListener("click", function () {
            document.getElementById("loginPromptModal").remove();
        });

        new bootstrap.Modal(document.getElementById("loginPromptModal")).show();
    }

    function handleRecording() {
        if (!isRecording) {
            isRecording = true;
            recordButton.innerText = "停止記錄";
            startTime = new Date();

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
                        var distance = prevLatLng.distanceTo(L.latLng(lat, lon)) / 1000;
                        totalDistance += distance;
                    }
                    prevLatLng = L.latLng(lat, lon);

                    if (prevAltitude !== null && altitude !== null) {
                        var elevationChange = altitude - prevAltitude;
                        if (elevationChange > 0) {
                            totalElevationGain += elevationChange;
                        } else if (elevationChange < 0) {
                            elevationLoss += Math.abs(elevationChange);
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
    <option value="基隆市">基隆市</option>
    <option value="桃園市">桃園市</option>
    <option value="新竹市">新竹市</option>
    <option value="新竹縣">新竹縣</option>
    <option value="苗栗縣">苗栗縣</option>
    <option value="臺中市">臺中市</option>
    <option value="彰化縣">彰化縣</option>
    <option value="南投縣">南投縣</option>
    <option value="雲林縣">雲林縣</option>
    <option value="嘉義市">嘉義市</option>
    <option value="嘉義縣">嘉義縣</option>
    <option value="臺南市">臺南市</option>
    <option value="高雄市">高雄市</option>
    <option value="屏東縣">屏東縣</option>
    <option value="宜蘭縣">宜蘭縣</option>
    <option value="花蓮縣">花蓮縣</option>
    <option value="臺東縣">臺東縣</option>
    <option value="澎湖縣">澎湖縣</option>
    <option value="金門縣">金門縣</option>
    <option value="連江縣">連江縣</option>
</select>

                            <label for="memo">備忘錄:</label>
                            <input type="text" id="memo" class="form-control" placeholder="備忘錄" />
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

    function saveRouteToGpx() {
        const routeName = document.getElementById("routeName").value;
        const routeCity = document.getElementById("routeCity").value;
        const memo = document.getElementById("memo").value;
        const duration = document.getElementById("time").innerText;
        const distance = document.getElementById("distance").innerText;
        const elevationGain = document.getElementById("elevation").innerText;

        if (!routeName || !routeCity) {
            alert("請輸入路線名稱並選擇城市！");
            return;
        }

        let gpxData = `<?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1" creator="GoMT" xmlns="http://www.topografix.com/GPX/1/1">
            <trk><name>${routeName}</name><trkseg>`;
        pathCoordinates.forEach(coord => {
            gpxData += `<trkpt lat="${coord[0]}" lon="${coord[1]}"></trkpt>`;
        });
        gpxData += `</trkseg></trk></gpx>`;

        var dbRequest = indexedDB.open('gomtDB', 8);

        dbRequest.onsuccess = function (event) {
            var db = event.target.result;
            var transaction = db.transaction(["routeRecords"], "readwrite");
            var store = transaction.objectStore("routeRecords");

            var data = {
                routeName: routeName,
                date: new Date().toISOString(),
                duration: duration,
                distance: distance,
                elevationGain: elevationGain,
                elevationLoss: elevationLoss, // 儲存總下降
                mtPlace: routeCity,
                gpx: gpxData,
                memo: memo
            };

            if (data.routeName && data.date && data.gpx) {
                store.add(data).onsuccess = function () {
                    alert("路線已成功儲存！");
                    location.reload();
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

        document.getElementById("saveModal").remove();
    }
});
