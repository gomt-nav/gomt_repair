from urllib.parse import urljoin, urlparse, urldefrag
import requests
from bs4 import BeautifulSoup
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

# 初始 URL 列表
urls = [
    "https://www.cwa.gov.tw/V8/C/",  # 氣象
    "https://hiking.biji.co/",  # 登山
    "https://www.forest.gov.tw/0004442"  # 林道
]

# 關鍵字分類
keywords = {
    "weather": ["氣象", "降雨", "溫度", "濃霧", "風力", "特報", "天氣", "預報", "預測"],
    "hiking": ["登山", "健行", "新手", "路線", "步道", "百岳", "小百岳"],
    "lindao": ["林道", "道路封閉", "通行", "山路"]
}

# 結果儲存
results = {"weather": [], "hiking": [], "lindao": []}

# 設定最大深度
max_depth = 2  # 限制爬取深度
visited_urls = set()

# 抓取頁面內容
def fetch_page(url):
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            print(f"成功抓取 {url}")
            return response.text
        else:
            print(f"無法訪問網址 {url}，狀態碼: {response.status_code}")
    except requests.RequestException as e:
        print(f"抓取錯誤: {e}")
    return None

# 提取關鍵字相關內容
def extract_by_keywords(html, url):
    soup = BeautifulSoup(html, "lxml")
    text = soup.get_text(separator="\n", strip=True)

    for category, keyword_list in keywords.items():
        for keyword in keyword_list:
            if keyword in text:
                # 找到關鍵字附近的段落
                context = []
                for line in text.splitlines():
                    if keyword in line:
                        context.append(line.strip())
                
                if context:  # 確保有內容
                    results[category].append({
                        "url": url,
                        "keyword": keyword,
                        "context": context[:3]  # 僅提取最多3段相關內容
                    })
                break  # 每個分類只需匹配一次

# 提取頁面內的連結
def extract_links(html, base_url):
    soup = BeautifulSoup(html, "lxml")
    links = []
    for link in soup.find_all('a', href=True):
        href = link.get('href')
        # 組合完整 URL，移除錨點
        full_url = urljoin(base_url, href)
        full_url, _ = urldefrag(full_url)  # 去除 URL 錨點
        # 確保同域名，避免外部網站
        if urlparse(full_url).netloc == urlparse(base_url).netloc and full_url not in visited_urls:
            links.append(full_url)
    return links

# 爬取單個頁面
def crawl(url, depth):
    if url in visited_urls or depth > max_depth:
        return
    visited_urls.add(url)
    
    html = fetch_page(url)
    if html:
        extract_by_keywords(html, url)
        if depth < max_depth:  # 繼續爬取內部連結
            links = extract_links(html, url)
            for link in links:
                crawl(link, depth + 1)

# 主程式
def main():
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(crawl, url, 0) for url in urls]
        for future in as_completed(futures):
            future.result()

    # 保存結果到 JSON 檔案
    with open("mountain_data.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=4)
    print("結果已保存到 mountain_data.json")

if __name__ == "__main__":
    main()
