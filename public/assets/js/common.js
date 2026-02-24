const API_BASE = 'http://localhost:5000/api'; // Corrected to match server.js
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

if (!token && !window.location.pathname.includes('index.html')) {
    window.location.href = 'index.html';
}

// Sidebar mobile toggle
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebar-toggle');
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
    });
}

// Hide management links for customers
if (role === 'customer') {
    document.querySelectorAll('.shop-link, .debt-link').forEach(el => { el.style.display = 'none'; });
}

// Logout
document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

// API helper
async function apiFetch(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    // Ensure endpoint doesn't double slash
    const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;
    
    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });

    if (res.status === 401) {
        localStorage.clear();
        window.location.href = 'index.html';
        return null;
    }
    if (!res.ok) throw new Error(await res.text());
    return res.json();  
}

function highlightActiveLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
    const currentPage = currentPath.replace('.html', '');
    document.querySelectorAll('.sidebar-link').forEach(link => {
        const page = link.getAttribute('data-page');
        if (page === currentPage) {
            link.classList.add('bg-indigo-800', 'font-semibold', 'text-white');
        }
    });
}
document.addEventListener('DOMContentLoaded', highlightActiveLink);