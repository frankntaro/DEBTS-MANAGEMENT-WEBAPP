let isRegister = false;
let currentRole = 'shopkeeper';

const authTitle = document.getElementById('auth-title');
const idLabel = document.getElementById('id-label');
const toggleAuth = document.getElementById('toggle-auth');
const authForm = document.getElementById('auth-form');
const installBtn = document.getElementById('install-cta');

// --- PWA INSTALLATION LOGIC ---
let deferredPrompt;

/**
 * Logic to show/hide install button based on PWA state
 */
function handleInstallButtonUI() {
    // 1. Check if already installed/running in standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (isStandalone) {
        console.log("PWA: Running in standalone mode. Hiding button.");
        if (installBtn) installBtn.style.setProperty('display', 'none', 'important');
        return;
    }

    // 2. If we have the prompt ready, show the button
    if (deferredPrompt && installBtn) {
        console.log("PWA: Deferred prompt detected. Showing button.");
        installBtn.style.display = 'flex';
        // Remove Tailwind 'hidden' class if present
        installBtn.classList.remove('hidden');
    } else {
        // Keep hidden until beforeinstallprompt fires
        if (installBtn) installBtn.style.display = 'none';
    }
}

// Capture the install event
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA: beforeinstallprompt event fired');
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event
    deferredPrompt = e;
    // Update the UI
    handleInstallButtonUI();
});

// Handle the click
if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
            alert("To install DebtProof:\n1. Open Browser Menu (3 dots)\n2. Tap 'Install App' or 'Add to Home Screen'");
            return;
        }
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA: User response to install: ${outcome}`);
        
        if (outcome === 'accepted') {
            installBtn.style.display = 'none';
        }
        deferredPrompt = null;
    });
}

// Hide if installed successfully
window.addEventListener('appinstalled', () => {
    console.log('PWA: App was installed');
    if (installBtn) installBtn.style.display = 'none';
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW: Registered successfully'))
            .catch(err => console.error('SW: Registration failed', err));
    });
}

// --- AUTH UI LOGIC ---

function updateForm() {
    authTitle.textContent = `${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} ${isRegister ? 'Register' : 'Login'}`;
    idLabel.textContent = currentRole === 'shopkeeper' ? 'Username' : 'Phone Number';
    toggleAuth.textContent = isRegister ? 'Switch to Login' : 'Switch to Register';
}

document.getElementById('role-shopkeeper').addEventListener('click', () => {
    currentRole = 'shopkeeper';
    setActiveRoleButton('role-shopkeeper', 'role-customer');
    updateForm();
});

document.getElementById('role-customer').addEventListener('click', () => {
    currentRole = 'customer';
    setActiveRoleButton('role-customer', 'role-shopkeeper');
    updateForm();
});

function setActiveRoleButton(activeId, inactiveId) {
    const active = document.getElementById(activeId);
    const inactive = document.getElementById(inactiveId);
    
    active.classList.add('bg-blue-600', 'text-white');
    active.classList.remove('bg-gray-100');
    inactive.classList.add('bg-gray-100');
    inactive.classList.remove('bg-blue-600', 'text-white');
}

toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isRegister = !isRegister;
    updateForm();
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('auth-id').value.trim();
    const password = document.getElementById('auth-password').value.trim();

    if (!id || !password) {
        alert("Please enter both ID and password");
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, password, role: currentRole, isRegister })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token || 'reg_success');
            localStorage.setItem('username', id); 
            const finalRole = data.role || currentRole;
            localStorage.setItem('role', finalRole);
            window.location.href = (finalRole === 'shopkeeper') ? 'dashboard.html' : 'customer-dashboard.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Connection Error:", error);
        alert("Could not connect to server. Check port 5000.");
    }
});

// Initialization
handleInstallButtonUI();
updateForm();