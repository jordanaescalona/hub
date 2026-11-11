requireAuth();

let editingId = null;
let allMaterias = [];
let allUnidades = [];

async function loadMaterias() {
    const res = await authFetch(`${API}/api/subjects`);
    allMaterias = await res.json();

    const options = materiaOptions(allMaterias);
    document.getElementById('filterMateria').innerHTML = `<option value="">Todas las materias</option>` + options;
    document.getElementById('fieldMateria').innerHTML = options;
}

async function loadUnidades() {
    const tbody = document.getElementById('unidadesTable');
    const materiaId = document.getElementById('filterMateria').value;

    try {
        const url = materiaId ? `${API}/api/units?subject_id=${materiaId}` : `${API}/api/units`;
        const res = await fetch(url);
        allUnidades = await res.json();

        if (allUnidades.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No hay unidades todavía</td></tr>`;
            return;
        }

        tbody.innerHTML = allUnidades.map(u => {
            const materia = allMaterias.find(m => m.id === u.subject_id);
            return `
                <tr>
                    <td><strong>${u.name}</strong></td>
                    <td>
                        ${materia ? `<span class="color-dot color-dot-sm" style="background:${materia.color || '#7dd3fc'}"></span>${materia.name}` : '—'}
                    </td>
                    <td class="muted">${u.description || '—'}</td>
                    <td>${u.order}</td>
                    <td class="actions">
                        <button class="btn btn-secondary btn-sm" onclick="openModal(${u.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="openDelete(${u.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Error al cargar</td></tr>`;
    }
}

function openModal(id = null) {
    editingId = id;
    const u = allUnidades.find(u => u.id === id);
    document.getElementById('modalTitle').textContent = id ? 'Editar unidad' : 'Nueva unidad';
    if (u) document.getElementById('fieldMateria').value = u.subject_id;
    document.getElementById('fieldName').value = u?.name || '';
    document.getElementById('fieldDescription').value = u?.description || '';
    document.getElementById('fieldOrder').value = u?.order || 0;
    openOverlay('modalOverlay');
}

function closeModal() {
    closeOverlay('modalOverlay');
    editingId = null;
}

async function save() {
    const data = {
        subject_id: document.getElementById('fieldMateria').value,
        name: document.getElementById('fieldName').value.trim(),
        description: document.getElementById('fieldDescription').value.trim(),
        order: document.getElementById('fieldOrder').value || 0
    };

    if (!data.subject_id || !data.name) { alert('Materia y nombre son obligatorios'); return; }

    if (await saveResource('/api/units', editingId, data)) {
        closeModal();
        loadUnidades();
    }
}

function openDelete(id) {
    const u = allUnidades.find(u => u.id === id);
    askDelete(u.name, `/api/units/${id}`, loadUnidades);
}

(async () => {
    await loadMaterias();
    await loadUnidades();
})();
