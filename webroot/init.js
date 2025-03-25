// Initialize the asteroid page
window.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('shop.html')) {
        initShopPage();
    } else {
        init();
    }
}); 