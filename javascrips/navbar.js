document.addEventListener('DOMContentLoaded', () => {
    const navbarToggle = document.getElementById('navbar');
    if (navbarToggle) {
        navbarToggle.addEventListener('click', function() {
            // 處理導航欄的切換或其他邏輯
            console.log('Navbar clicked');
        });
    } else {
        console.error('Navbar element not found');
    }
});
