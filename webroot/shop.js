// Shop page initialization
function initShopPage() {
    // Create and add back to asteroid button
    const backButton = document.createElement('button');
    backButton.className = 'back-to-asteroid-button';
    backButton.innerHTML = `
        <span class="icon">🚀</span>
        <span class="text">Back to Asteroid</span>
    `;
    
    // Add click handler
    backButton.addEventListener('click', () => {
        // Use window.location.replace for better navigation
        window.location.replace('page.html');
    });
    
    document.body.appendChild(backButton);
    
    // Add shop page specific initialization here
    // ...
}

// Initialize shop page when DOM is loaded
document.addEventListener('DOMContentLoaded', initShopPage); 