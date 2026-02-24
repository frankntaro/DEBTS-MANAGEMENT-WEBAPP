document.addEventListener('DOMContentLoaded', () => {
    // 1. Sidebar Toggle
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (toggleBtn) toggleBtn.onclick = () => sidebar.classList.toggle('-translate-x-full');

    // 2. Logout Logic
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.clear();
            window.location.href = 'index.html';
        };
    }
    // 3. Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered for Dashboard'))
            .catch(err => console.error('SW registration failed:', err));
    }

    // 3. PWA Visibility Check
    // If already installed and running as an app, hide the button immediately
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        if (installBtn) installBtn.style.display = 'none';
    }

    // 4. Load Stats
    loadDashboard();
});

async function loadDashboard() {
    const totalDebtEl = document.getElementById('total-debt');
    const debtCustomersEl = document.getElementById('debt-customers');
    const recentDebtsEl = document.getElementById('recent-debts');

    try {
        const response = await fetch('/api/dashboard-stats');
        const data = await response.json();

        totalDebtEl.textContent = `${Number(data.totalSum).toLocaleString()} TZS`;
        debtCustomersEl.textContent = data.customerCount;

        if (data.recent.length > 0) {
            recentDebtsEl.innerHTML = data.recent.map(d => `
                <li class="flex justify-between items-center text-sm">
                    <span class="text-gray-700 font-medium">${d.customer_name}</span>
                    <span class="text-red-500 font-bold">${Number(d.amount).toLocaleString()} TZS</span>
                </li>
            `).join('');
        } else {
            recentDebtsEl.innerHTML = '<li class="text-gray-400 text-sm italic">No entries yet</li>';
        }
    } catch (err) {
        totalDebtEl.textContent = "Error";
        console.error('Fetch error:', err);
    }
}

// ---  INSTALL LOGIC ---
let deferredPrompt;
const installBtn = document.getElementById('install-cta');

window.addEventListener('beforeinstallprompt', (e) => {
    // If the user is already in standalone mode, don't even capture the prompt
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return;
    }
    e.preventDefault();
    deferredPrompt = e;
    console.log('Install prompt is ready');
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installBtn.style.display = 'none'; // Use display:none for a cleaner removal
            }
            deferredPrompt = null;
        } else {
            alert("To install DebtProof:\n\n1. Tap the browser menu (three dots or share icon)\n2. Select 'Install App' or 'Add to Home Screen'.");
        }
    });
}

// Permanent hide if installation completes
window.addEventListener('appinstalled', () => {
    console.log('DebtProof was installed');
    if (installBtn) installBtn.style.display = 'none';
});