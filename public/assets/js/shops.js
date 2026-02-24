let editingId = null;

// --- GLOBAL UTILITIES (Sidebar & PWA) ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Sidebar Toggle Logic
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('-translate-x-full');
        });
    }

    // 2. Logout Logic
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.clear();
            window.location.href = 'index.html';
        };
    }

    // 3. PWA Install Button Visibility
    const installBtn = document.getElementById('install-cta');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    
    if (installBtn && isStandalone) {
        installBtn.style.setProperty('display', 'none', 'important');
    }

    // 4. Initial Shop Load
    loadShops();
});

// --- MODAL HELPERS ---
const openModal = () => document.getElementById('modal').classList.remove('hidden');
const closeModal = () => {
    document.getElementById('modal').classList.add('hidden');
    editingId = null;
};

// --- SHOPS CORE LOGIC ---
async function loadShops() {
    try {
        const response = await fetch('/api/shops');
        const shops = await response.json();
        const list = document.getElementById('shops-list');
        
        list.innerHTML = shops.map(shop => `
            <li class="p-4 bg-white rounded shadow flex justify-between items-center border-l-4 border-indigo-500">
                <div>
                    <span class="block font-bold text-gray-800">${shop.name}</span>
                    <span class="text-sm text-gray-500">${shop.location} • ${shop.category}</span>
                </div>
                <div class="flex gap-3">
                    <button class="text-indigo-600 hover:text-indigo-800 font-medium edit-shop" data-id="${shop.id}">Edit</button>
                    <button class="text-red-500 hover:text-red-700 font-medium delete-shop" data-id="${shop.id}">Delete</button>
                </div>
            </li>
        `).join('');

        attachButtonEvents(shops);
    } catch (err) {
        console.error('Error loading shops:', err);
    }
}

function attachButtonEvents(shops) {
    // Edit Logic
    document.querySelectorAll('.edit-shop').forEach(btn => {
        btn.onclick = (e) => {
            editingId = e.target.dataset.id;
            const shop = shops.find(s => s.id == editingId);
            document.getElementById('shop-name').value = shop.name;
            document.getElementById('shop-location').value = shop.location;
            document.getElementById('shop-category').value = shop.category;
            document.getElementById('modal-title').textContent = 'Edit Shop Details';
            openModal();
        };
    });

    // Delete Logic
    document.querySelectorAll('.delete-shop').forEach(btn => {
        btn.onclick = async (e) => {
            if (confirm('Are you sure you want to delete this shop?')) {
                await fetch(`/api/shops/${e.target.dataset.id}`, { method: 'DELETE' });
                loadShops();
            }
        };
    });
}

// Form Submission (Add or Update)
document.getElementById('modal-form').onsubmit = async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('shop-name').value,
        location: document.getElementById('shop-location').value,
        category: document.getElementById('shop-category').value
    };

    const url = editingId ? `/api/shops/${editingId}` : '/api/shops';
    const method = editingId ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        closeModal();
        loadShops();
    }
};

// Toggle Modal
document.getElementById('add-shop').onclick = () => {
    document.getElementById('modal-form').reset();
    document.getElementById('modal-title').textContent = 'Add New Shop';
    openModal();
};
document.getElementById('close-modal').onclick = closeModal;