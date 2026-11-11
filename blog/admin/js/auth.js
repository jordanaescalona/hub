// Sesión del panel de administración y llamadas autenticadas a la API.
const API = 'https://hub-api.jordana-escalona.workers.dev';
const TOKEN_KEY = 'blog_admin_token';

function saveToken(token) { localStorage.setItem(TOKEN_KEY, token); }
function getToken() { return localStorage.getItem(TOKEN_KEY); }

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = 'index.html';
}

function requireAuth() {
    if (!getToken()) window.location.href = 'index.html';
}

// Valida el token contra un endpoint que exige autenticación
// (el token de administrador es el mismo para toda la API).
async function checkToken(token) {
    const res = await fetch(`${API}/api/contact`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.ok;
}

async function authFetch(url, options = {}) {
    const headers = {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        ...options.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        logout();
        throw new Error('Sesión expirada');
    }
    return response;
}

// Sube un archivo a R2 y devuelve su URL pública.
async function uploadFile(file, folder = 'blog') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const res = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
    });
    if (!res.ok) throw new Error('Error al subir el archivo');
    return (await res.json()).url;
}

function showAlert(elementId, message, type = 'error') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.className = `alert ${type} show`;
    setTimeout(() => el.classList.remove('show'), 4000);
}
