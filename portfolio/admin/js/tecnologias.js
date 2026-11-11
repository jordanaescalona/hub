requireAuth();

let editingId = null;

async function loadTabla() {
    const tbody = document.getElementById('tecnologiasTable');
    try {
        await loadTecnologias();

        if (allTecnologias.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No hay tecnologías todavía</td></tr>`;
            return;
        }

        tbody.innerHTML = allTecnologias.map(t => `
            <tr>
                <td class="tech-icon-cell">${renderTechIcon(t) || '—'}</td>
                <td><strong>${t.name}</strong></td>
                <td>${t.order}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="openModal(${t.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="openDelete(${t.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Error al cargar</td></tr>`;
    }
}

function openModal(id = null) {
    editingId = id;
    const t = allTecnologias.find(t => t.id === id) || {};
    document.getElementById('modalTitle').textContent = id ? 'Editar tecnología' : 'Nueva tecnología';
    document.getElementById('fieldName').value = t.name || '';
    document.getElementById('fieldIcon').value = t.icon || '';
    document.getElementById('fieldOrder').value = t.order || 0;
    openOverlay('modalOverlay');
}

function closeModal() {
    closeOverlay('modalOverlay');
    editingId = null;
}

async function save() {
    const data = {
        name: document.getElementById('fieldName').value.trim(),
        icon: document.getElementById('fieldIcon').value.trim(),
        order: document.getElementById('fieldOrder').value || 0
    };

    if (!data.name) { alert('El nombre es obligatorio'); return; }

    if (await saveResource('/api/technologies', editingId, data)) {
        closeModal();
        loadTabla();
    }
}

function openDelete(id) {
    const t = allTecnologias.find(t => t.id === id);
    askDelete(t.name, `/api/technologies/${id}`, loadTabla);
}

loadTabla();
