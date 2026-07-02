requireAuth();

let editingId = null;
let deletingId = null;
let allTecnologias = [];

async function loadTecnologias() {
    const tbody = document.getElementById('tecnologiasTable');
    try {
        const res = await fetch(`${API}/api/technologies`);
        allTecnologias = await res.json();

        if (allTecnologias.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No hay tecnologías todavía</td></tr>`;
            return;
        }

        tbody.innerHTML = allTecnologias.map(t => `
            <tr>
                <td style="font-size:1.3rem">${t.icon || '—'}</td>
                <td><strong>${t.name}</strong></td>
                <td>${t.order}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="openModal(${t.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="openDelete(${t.id}, '${t.name.replace(/'/g, "\\'")}')">Eliminar</button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Error al cargar</td></tr>`;
    }
}

function openModal(id = null) {
    editingId = id;
    document.getElementById('modalTitle').textContent = id ? 'Editar tecnología' : 'Nueva tecnología';
    document.getElementById('modalOverlay').classList.add('show');

    if (id) {
        const t = allTecnologias.find(t => t.id === id);
        document.getElementById('fieldName').value = t.name;
        document.getElementById('fieldIcon').value = t.icon || '';
        document.getElementById('fieldOrder').value = t.order;
    } else {
        document.getElementById('fieldName').value = '';
        document.getElementById('fieldIcon').value = '';
        document.getElementById('fieldOrder').value = 0;
    }
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    editingId = null;
}

async function save() {
    const name = document.getElementById('fieldName').value.trim();
    const icon = document.getElementById('fieldIcon').value.trim();
    const order = document.getElementById('fieldOrder').value || 0;

    if (!name) { alert('El nombre es obligatorio'); return; }

    const url = editingId ? `${API}/api/technologies/${editingId}` : `${API}/api/technologies`;
    const method = editingId ? 'PUT' : 'POST';

    await authFetch(url, {
        method,
        body: JSON.stringify({ name, icon, order })
    });

    closeModal();
    loadTecnologias();
}

function openDelete(id, name) {
    deletingId = id;
    document.getElementById('deleteName').textContent = name;
    document.getElementById('deleteOverlay').classList.add('show');
}

function closeDelete() {
    document.getElementById('deleteOverlay').classList.remove('show');
    deletingId = null;
}

async function confirmDelete() {
    await authFetch(`${API}/api/technologies/${deletingId}`, { method: 'DELETE' });
    closeDelete();
    loadTecnologias();
}

loadTecnologias();