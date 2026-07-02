requireAuth();

let allMensajes = [];
let currentId = null;

async function loadMensajes() {
    const tbody = document.getElementById('mensajesTable');
    try {
        const res = await authFetch(`${API}/api/contact`);
        allMensajes = await res.json();

        const unread = allMensajes.filter(m => !m.read).length;
        const badge = document.getElementById('unreadBadge');
        badge.textContent = unread > 0 ? `${unread} sin leer` : '';

        if (allMensajes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No hay mensajes todavía</td></tr>`;
            return;
        }

        tbody.innerHTML = allMensajes.map(m => `
            <tr style="${!m.read ? 'font-weight:600' : ''}">
                <td>${m.name}</td>
                <td style="color:#64748b; font-size:0.82rem">${m.email}</td>
                <td style="color:#64748b; font-size:0.82rem; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${m.message}</td>
                <td style="font-size:0.82rem">${formatDate(m.created_at)}</td>
                <td>
                    <span style="padding:0.2rem 0.6rem; border-radius:20px; font-size:0.75rem; font-weight:600; ${m.read ? 'background:#f1f5f9; color:#64748b' : 'background:#dbeafe; color:#1d4ed8'}">
                        ${m.read ? 'Leído' : 'Nuevo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="openModal(${m.id})">Ver</button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Error al cargar</td></tr>`;
    }
}

function openModal(id) {
    currentId = id;
    const m = allMensajes.find(m => m.id === id);
    if (!m) return;

    document.getElementById('modalName').textContent = m.name;
    document.getElementById('modalEmail').textContent = m.email;
    document.getElementById('modalMessage').textContent = m.message;

    const markBtn = document.getElementById('markReadBtn');
    if (m.read) {
        markBtn.style.display = 'none';
    } else {
        markBtn.style.display = 'inline-block';
        markBtn.onclick = () => markAsRead(id);
    }

    document.getElementById('modalOverlay').classList.add('show');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    currentId = null;
}

async function markAsRead(id) {
    await authFetch(`${API}/api/contact/${id}/read`, { method: 'PATCH' });
    closeModal();
    loadMensajes();
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' });
}

loadMensajes();