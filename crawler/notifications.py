import requests
from bs4 import BeautifulSoup
import json

def fetch_forest_data():
    """
    爬取林務局的林道公告資訊。
    """
    url = "https://www.forest.gov.tw/0003286"  # 林務局公告頁面
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    forest_data = []

    try:
        # 發送請求並解析 HTML
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # 爬取林道公告資料（假設公告結構）
        for item in soup.select(".announcement-item"):  # 假設公告項目在 .announcement-item 中
            title = item.select_one(".title").text.strip()  # 公告標題
            content = item.select_one(".content").text.strip()  # 公告內容
            forest_data.append({"title": title, "message": content})

    except Exception as e:
        print(f"林道公告爬取失敗: {e}")

    # 如果無公告，提供默認消息
    if not forest_data:
        forest_data.append({
            "title": "目前無林道公告",
            "message": "未檢測到新的林道公告。"
        })

    return forest_data


def fetch_weather_data():
    """
    爬取中央氣象局天氣資料，返回所有地區的天氣資訊。
    """
    url = "https://www.cwa.gov.tw/V8/C/W/index.html"  # 中央氣象局觀測資料地圖
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    weather_data = []

    try:
        # 發送請求並解析 HTML
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # 爬取各地區的天氣資料
        for area in soup.select(".location"):  # 假設地區資訊以 .location 包含
            area_name = area.select_one(".locationName").text.strip()  # 地區名稱
            temperature = area.select_one(".temperature").text.strip()  # 溫度
            weather_desc = area.select_one(".wx").text.strip()  # 天氣描述
            rainfall = area.select_one(".rainfall").text.strip()  # 降雨量

            weather_data.append({
                "area": area_name,
                "temperature": temperature,
                "weather": weather_desc,
                "rainfall": rainfall
            })

    except Exception as e:
        print(f"天氣資料爬取失敗: {e}")

    # 如果無任何資料，添加默認消息
    if not weather_data:
        weather_data.append({
            "area": "無法取得資料",
            "temperature": "N/A",
            "weather": "N/A",
            "rainfall": "N/A"
        })

    return weather_data


def save_notifications(filepath="./notifications.json"):
    """
    整合林道公告與天氣資訊，保存為 JSON 格式。
    """
    notifications = []

    # 爬取林道公告
    forest_data = fetch_forest_data()
    notifications.extend(forest_data)

    # 爬取天氣資訊
    weather_data = fetch_weather_data()
    for weather in weather_data:
        notifications.append({
            "title": f"{weather['area']} 天氣預報",
            "message": f"天氣：{weather['weather']}，溫度：{weather['temperature']}，降雨量：{weather['rainfall']}"
        })

    # 保存為 JSON 文件
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(notifications, f, ensure_ascii=False, indent=4)


if __name__ == "__main__":
    # 整合並保存通知
    save_notifications()
    print("通知已更新")
