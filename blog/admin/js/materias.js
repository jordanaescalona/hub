requireAuth();

let editingId = null;
let allMaterias = [];

async function loadMaterias() {
    const tbody = document.getElementById('materiasTable');
    try {
        const res = await authFetch(`${API}/api/subjects`);
        allMaterias = await res.json();

        if (allMaterias.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No hay materias todavía</td></tr>`;
            return;
        }

        tbody.innerHTML = allMaterias.map(m => `
            <tr>
                <td><span class="color-dot" style="background:${m.color || '#7dd3fc'}"></span></td>
                <td><strong>${m.name}</strong></td>
                <td><span class="badge badge-${m.period}">${PERIODS[m.period] || m.period}</span></td>
                <td class="muted">${m.slug}</td>
                <td>${m.order}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="openModal(${m.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="openDelete(${m.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Error al cargar</td></tr>`;
    }
}

function openModal(id = null) {
    editingId = id;
    const m = allMaterias.find(m => m.id === id) || {};
    document.getElementById('modalTitle').textContent = id ? 'Editar materia' : 'Nueva materia';
    document.getElementById('fieldName').value = m.name || '';
    document.getElementById('fieldSlug').value = m.slug || '';
    document.getElementById('fieldPeriod').value = m.period || '1c1';
    document.getElementById('fieldDescription').value = m.description || '';
    document.getElementById('fieldColor').value = m.color || '#7dd3fc';
    document.getElementById('fieldOrder').value = m.order || 0;
    openOverlay('modalOverlay');
}

function closeModal() {
    closeOverlay('modalOverlay');
    editingId = null;
}

async function save() {
    const data = {
        name: document.getElementById('fieldName').value.trim(),
        slug: document.getElementById('fieldSlug').value.trim(),
        period: document.getElementById('fieldPeriod').value,
        description: document.getElementById('fieldDescription').value.trim(),
        color: document.getElementById('fieldColor').value,
        order: document.getElementById('fieldOrder').value || 0
    };

    if (!data.name || !data.slug) { alert('Nombre y slug son obligatorios'); return; }

    if (await saveResource('/api/subjects', editingId, data)) {
        closeModal();
        loadMaterias();
    }
}

function openDelete(id) {
    const m = allMaterias.find(m => m.id === id);
    askDelete(m.name, `/api/subjects/${id}`, loadMaterias);
}

autoSlug('fieldName', 'fieldSlug', () => editingId);
loadMaterias();
