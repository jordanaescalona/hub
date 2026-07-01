requireAuth();

let editingId = null;
let deletingId = null;
let allMaterias = [];
let allUnidades = [];

async function loadMaterias() {
    const res = await authFetch(`${API}/api/subjects`);
    allMaterias = await res.json();

    const filter = document.getElementById('filterMateria');
    const select = document.getElementById('fieldMateria');

    const options = allMaterias.map(m => `<option value="${m.id}">${m.name} — ${PERIODS[m.period] || m.period}</option>`).join('');
    filter.innerHTML = `<option value="">Todas las materias</option>` + options;
    select.innerHTML = options;
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
                        ${materia ? `<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${materia.color || '#7dd3fc'}; margin-right:0.4rem;"></span>${materia.name}` : '—'}
                    </td>
                    <td style="color:#64748b; font-size:0.82rem">${u.description || '—'}</td>
                    <td>${u.order}</td>
                    <td class="actions">
                        <button class="btn btn-secondary btn-sm" onclick="openModal(${u.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="openDelete(${u.id}, '${u.name.replace(/'/g, "\\'")}')">Eliminar</button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Error al cargar</td></tr>`;
    }
}

async function openModal(id = null) {
    editingId = id;
    document.getElementById('modalTitle').textContent = id ? 'Editar unidad' : 'Nueva unidad';
    document.getElementById('modalOverlay').classList.add('show');

    if (id) {
        const u = allUnidades.find(u => u.id === id);
        document.getElementById('fieldMateria').value = u.subject_id;
        document.getElementById('fieldName').value = u.name;
        document.getElementById('fieldDescription').value = u.description || '';
        document.getElementById('fieldOrder').value = u.order;
    } else {
        document.getElementById('fieldName').value = '';
        document.getElementById('fieldDescription').value = '';
        document.getElementById('fieldOrder').value = 0;
    }
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    editingId = null;
}

async function save() {
    const subject_id = document.getElementById('fieldMateria').value;
    const name = document.getElementById('fieldName').value.trim();
    const description = document.getElementById('fieldDescription').value.trim();
    const order = document.getElementById('fieldOrder').value || 0;

    if (!subject_id || !name) { alert('Materia y nombre son obligatorios'); return; }

    const url = editingId ? `${API}/api/units/${editingId}` : `${API}/api/units`;
    const method = editingId ? 'PUT' : 'POST';

    await authFetch(url, {
        method,
        body: JSON.stringify({ subject_id, name, description, order })
    });

    closeModal();
    loadUnidades();
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
    await authFetch(`${API}/api/units/${deletingId}`, { method: 'DELETE' });
    closeDelete();
    loadUnidades();
}

(async () => {
    await loadMaterias();
    await loadUnidades();
})();