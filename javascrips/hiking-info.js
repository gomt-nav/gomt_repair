export async function getMountainData() {
    try {
        const response = await fetch('../crawler/mountain_data.json'); // JSON 文件的路徑
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching mountain data:", error);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const data = await getMountainData();
    if (!data) return;

    // 天氣資訊
    const weatherContainer = document.getElementById('weatherContainer');
    if (data.weather && Array.isArray(data.weather)) {
        data.weather.forEach(weather => {
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-3';
            card.innerHTML = `
                <div class="card p-3">
                    <h5><a href="${weather.url}" target="_blank">${weather.keyword}</a></h5>
                    <ul>
                        ${weather.context.map(context => `<li>${context}</li>`).join('')}
                    </ul>
                </div>
            `;
            weatherContainer.appendChild(card);
        });
    } else {
        weatherContainer.innerHTML = "<p>無天氣資訊</p>";
    }

    // 登山文章
    const hikingContainer = document.getElementById('hikingContainer');
    if (data.hiking && Array.isArray(data.hiking)) {
        data.hiking.forEach(article => {
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-3';
            card.innerHTML = `
                <div class="card p-3">
                    <h5><a href="${article.url}" target="_blank">${article.keyword}</a></h5>
                    <ul>
                        ${article.context.map(context => `<li>${context}</li>`).join('')}
                    </ul>
                </div>
            `;
            hikingContainer.appendChild(card);
        });
    } else {
        hikingContainer.innerHTML = "<p>無登山文章</p>";
    }

    // 林道資訊
    const lindaoContainer = document.getElementById('lindaoContainer');
    if (data.lindao && Array.isArray(data.lindao)) {
        data.lindao.forEach(lindao => {
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-3';
            card.innerHTML = `
                <div class="card p-3">
                    <h5><a href="${lindao.url}" target="_blank">${lindao.keyword}</a></h5>
                    <ul>
                        ${lindao.context.map(context => `<li>${context}</li>`).join('')}
                    </ul>
                </div>
            `;
            lindaoContainer.appendChild(card);
        });
    } else {
        lindaoContainer.innerHTML = "<p>無林道資訊</p>";
    }
});
