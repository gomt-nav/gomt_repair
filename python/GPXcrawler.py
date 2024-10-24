import os
import requests
from bs4 import BeautifulSoup
import logging
import time
import random
import urllib3

# 禁用 SSL 證書警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 設置 log 基本配置
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("crawler.log"),
        logging.StreamHandler()
    ]
)

# 偽裝瀏覽器的 User-Agent
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://colorfulbutterfly.net/2020/11/18/gpx-%E8%B3%87%E6%96%99%E5%BA%AB%F0%9F%A6%8B%E8%8A%B1%E8%9D%B4%E8%9D%B6%F0%9F%A6%8B/"
}

# 爬取 .gpx 檔案的函數
def fetch_gpx_files(url, max_files=100):
    try:
        # 禁用 SSL 驗證
        response = requests.get(url, headers=headers, verify=False)
        response.raise_for_status()  # 檢查是否有 HTTP 錯誤
        soup = BeautifulSoup(response.text, 'html.parser')

        # 找到所有的 .gpx 檔案連結
        gpx_links = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            if href.endswith('gpx'):
                gpx_links.append(href)
            if len(gpx_links) >= max_files:
                break

        if not gpx_links:
            logging.warning(f"No .gpx files found on {url}")
        else:
            logging.info(f"Found {len(gpx_links)} .gpx files on {url}")

        return gpx_links

    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to retrieve data from {url}: {e}")
        return []

# 下載檔案的函數
def download_file(url, save_dir):
    try:
        filename = os.path.basename(url)
        response = requests.get(url, headers=headers, verify=False)
        response.raise_for_status()

        file_path = os.path.join(save_dir, filename)
        with open(file_path, 'wb') as f:
            f.write(response.content)
        logging.info(f"Downloaded: {filename}")

    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to download {url}: {e}")

# 設定你要爬取的網站 URL
target_urls = [
    "https://colorfulbutterfly.net/2020/11/18/gpx-%E8%B3%87%E6%96%99%E5%BA%AB%F0%9F%A6%8B%E8%8A%B1%E8%9D%B4%E8%9D%B6%F0%9F%A6%8B/",
]

# 設定本地儲存檔案的資料夾
save_directory = 'gpx_files'

if not os.path.exists(save_directory):
    os.makedirs(save_directory)

# 迭代每個 target_urls，並爬取最多 100 筆 .gpx 檔案
for url in target_urls:
    gpx_files = fetch_gpx_files(url, max_files=100)
    if gpx_files:
        for gpx_url in gpx_files:
            time.sleep(random.uniform(1, 3))  # 隨機延遲 1 到 3 秒
            download_file(gpx_url, save_directory)
    else:
        logging.warning(f"No .gpx files to download from {url}.")
