// Shop page initialization
function initShopPage() {
    // Load resources from localStorage
    const resources = JSON.parse(localStorage.getItem('resources')) || {
        CARBON: 0,
        NICKEL: 0,
        IRON: 0,
        GOLD: 0,
        PLATINUM: 0
    };

    // Load shovel cooldown from localStorage
    let shovelCooldown = parseInt(localStorage.getItem('shovelCooldown')) || 12000; // 12 seconds

    // Load dynamite count from localStorage
    let dynamiteCount = parseInt(localStorage.getItem('dynamiteCount')) || 0;

    // Use existing back button
    const backButton = document.getElementById('backButton');
    backButton.addEventListener('click', () => {
        window.location.href = 'page.html';
    });

    // Update button states
    function updateButtons() {
        const upgradeShovelBtn = document.getElementById('upgradeShovel');
        const buyDynamiteBtn = document.getElementById('buyDynamite');

        // Check if user can afford shovel upgrade
        if (resources.CARBON >= 100 && resources.IRON >= 50) {
            upgradeShovelBtn.disabled = false;
        } else {
            upgradeShovelBtn.disabled = true;
        }

        // Check if user can afford dynamite
        if (resources.CARBON >= 50 && resources.NICKEL >= 25) {
            buyDynamiteBtn.disabled = false;
        } else {
            buyDynamiteBtn.disabled = true;
        }
    }

    // Handle shovel upgrade
    document.getElementById('upgradeShovel').addEventListener('click', () => {
        if (resources.CARBON >= 100 && resources.IRON >= 50) {
            resources.CARBON -= 100;
            resources.IRON -= 50;
            shovelCooldown = Math.max(1000, shovelCooldown - 2000); // Reduce cooldown by 2 seconds, minimum 1 second
            
            // Save updated values
            localStorage.setItem('resources', JSON.stringify(resources));
            localStorage.setItem('shovelCooldown', shovelCooldown);
            
            alert('Shovel upgraded! New cooldown: ' + (shovelCooldown / 1000) + ' seconds');
            updateButtons();
        }
    });

    // Handle dynamite purchase
    document.getElementById('buyDynamite').addEventListener('click', () => {
        if (resources.CARBON >= 50 && resources.NICKEL >= 25) {
            resources.CARBON -= 50;
            resources.NICKEL -= 25;
            dynamiteCount += 1;
            
            // Save updated values
            localStorage.setItem('resources', JSON.stringify(resources));
            localStorage.setItem('dynamiteCount', dynamiteCount);
            
            alert('Dynamite purchased! Total dynamite: ' + dynamiteCount);
            updateButtons();
        }
    });

    // Initial button state update
    updateButtons();
}

// Initialize shop page when DOM is loaded
document.addEventListener('DOMContentLoaded', initShopPage); 