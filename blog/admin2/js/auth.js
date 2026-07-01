const API = 'https://hub-api.jordana-escalona.workers.dev';

const PERIODS = {
    '1c1': '1° Año - 1° Cuatrimestre',
    '1c2': '1° Año - 2° Cuatrimestre',
    '2c1': '2° Año - 1° Cuatrimestre',
    '2c2': '2° Año - 2° Cuatrimestre'
};

function saveToken(token) { localStorage.setItem('blog_admin_token', token); }
function getToken() { return localStorage.getItem('blog_admin_token'); }

function logout() {
    localStorage.removeItem('blog_admin_token');
    window.location.href = 'index.html';
}

function requireAuth() {
    if (!getToken()) window.location.href = 'index.html';
}

async function authFetch(url, options = {}) {
    const headers = {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        ...options.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) { logout(); return; }
    return response;
}

function showAlert(elementId, message, type = 'error') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.className = `alert ${type} show`;
    setTimeout(() => el.classList.remove('show'), 4000);
}