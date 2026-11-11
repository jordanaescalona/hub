requireAuth();

let allMensajes = [];

// Los mensajes llegan del formulario público: todo se escapa antes de mostrarlo.
async function loadMensajes() {
    const tbody = document.getElementById('mensajesTable');
    try {
        const res = await authFetch(`${API}/api/contact`);
        allMensajes = await res.json();

        const unread = allMensajes.filter(m => !m.read).length;
        document.getElementById('unreadBadge').textContent = unread > 0 ? `${unread} sin leer` : '';

        if (allMensajes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No hay mensajes todavía</td></tr>`;
            return;
        }

        tbody.innerHTML = allMensajes.map(m => `
            <tr class="${m.read ? '' : 'unread'}">
                <td>${escapeHtml(m.name)}</td>
                <td class="muted">${escapeHtml(m.email)}</td>
                <td class="muted message-preview">${escapeHtml(m.message)}</td>
                <td class="muted">${formatDate(m.created_at)}</td>
                <td><span class="status-tag ${m.read ? '' : 'new'}">${m.read ? 'Leído' : 'Nuevo'}</span></td>
                <td><button class="btn btn-secondary btn-sm" onclick="openModal(${m.id})">Ver</button></td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Error al cargar</td></tr>`;
    }
}

function openModal(id) {
    const m = allMensajes.find(m => m.id === id);
    if (!m) return;

    document.getElementById('modalName').textContent = m.name;
    document.getElementById('modalEmail').textContent = m.email;
    document.getElementById('modalMessage').textContent = m.message;

    const markBtn = document.getElementById('markReadBtn');
    markBtn.style.display = m.read ? 'none' : 'inline-block';
    markBtn.onclick = () => markAsRead(id);

    openOverlay('modalOverlay');
}

function closeModal() {
    closeOverlay('modalOverlay');
}

async function markAsRead(id) {
    await authFetch(`${API}/api/contact/${id}/read`, { method: 'PATCH' });
    closeModal();
    loadMensajes();
}

loadMensajes();
