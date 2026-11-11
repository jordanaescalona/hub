requireAuth();

let editingId = null;
let allMaterias = [];
let allUnidades = [];
let allEntradas = [];

// ── CARGAR DATOS ───────────────────────────────────────────────
async function loadMaterias() {
    const res = await authFetch(`${API}/api/subjects`);
    allMaterias = await res.json();

    const options = materiaOptions(allMaterias);
    document.getElementById('filterMateria').innerHTML = `<option value="">Todas las materias</option>` + options;
    document.getElementById('fieldMateria').innerHTML = options;
}

async function fetchUnidades(materiaId) {
    const res = await fetch(`${API}/api/units?subject_id=${materiaId}`);
    return res.json();
}

function unidadOptions(unidades, emptyLabel) {
    return `<option value="">${emptyLabel}</option>` +
        unidades.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
}

// Filtro de la tabla: al cambiar la materia se recargan sus unidades.
async function onMateriaFilter() {
    const materiaId = document.getElementById('filterMateria').value;
    const unidades = materiaId ? await fetchUnidades(materiaId) : [];
    document.getElementById('filterUnidad').innerHTML = unidadOptions(unidades, 'Todas las unidades');
    await loadEntradas();
}

// Selector del modal: muestra las unidades de la materia elegida.
async function onMateriaChange() {
    const materiaId = document.getElementById('fieldMateria').value;
    const unidades = materiaId ? await fetchUnidades(materiaId) : [];
    document.getElementById('fieldUnidad').innerHTML = unidadOptions(unidades, 'Sin unidad');
}

async function loadEntradas() {
    const tbody = document.getElementById('entradasTable');
    const params = new URLSearchParams();
    const materiaId = document.getElementById('filterMateria').value;
    const unidadId = document.getElementById('filterUnidad').value;
    if (materiaId) params.set('subject_id', materiaId);
    if (unidadId) params.set('unit_id', unidadId);

    try {
        const res = await fetch(`${API}/api/posts?${params}`);
        allEntradas = await res.json();

        if (allEntradas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No hay entradas</td></tr>`;
            return;
        }

        tbody.innerHTML = allEntradas.map(e => {
            const materia = allMaterias.find(m => m.id === e.subject_id);
            const unidad = allUnidades.find(u => u.id === e.unit_id);
            return `
                <tr>
                    <td><strong>${e.title}</strong></td>
                    <td>${materia ? materia.name : '—'}</td>
                    <td class="muted">${unidad ? unidad.name : '—'}</td>
                    <td>${e.is_pro ? '<span class="pro-tag">PRO</span>' : 'Gratis'}</td>
                    <td>${e.order}</td>
                    <td class="actions">
                        <button class="btn btn-secondary btn-sm" onclick="openModal(${e.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="openDelete(${e.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Error al cargar</td></tr>`;
    }
}

// ── MODAL ──────────────────────────────────────────────────────
async function openModal(id = null) {
    editingId = id;
    document.getElementById('modalTitle').textContent = id ? 'Editar entrada' : 'Nueva entrada';
    openOverlay('modalOverlay');
    initEditor();

    // La versión pública de la entrada oculta el contenido PRO, por eso se pide la de admin.
    const e = id ? await (await authFetch(`${API}/api/admin/posts/${id}`)).json() : {};

    if (id) document.getElementById('fieldMateria').value = e.subject_id;
    await onMateriaChange();
    document.getElementById('fieldUnidad').value = e.unit_id || '';
    document.getElementById('fieldTitle').value = e.title || '';
    setEditorContent(e.content);
    document.getElementById('fieldImageUrl').value = e.image_url || '';
    document.getElementById('fieldIsPro').checked = !!e.is_pro;
    document.getElementById('fieldOrder').value = e.order || 0;
}

function closeModal() {
    closeOverlay('modalOverlay');
    editingId = null;
}

async function save() {
    const data = {
        subject_id: document.getElementById('fieldMateria').value,
        unit_id: document.getElementById('fieldUnidad').value || null,
        title: document.getElementById('fieldTitle').value.trim(),
        content: getEditorContent(),
        image_url: document.getElementById('fieldImageUrl').value.trim(),
        is_pro: document.getElementById('fieldIsPro').checked,
        order: document.getElementById('fieldOrder').value || 0
    };

    if (!data.subject_id || !data.title || !data.content) {
        alert('Materia, título y contenido son obligatorios');
        return;
    }

    if (await saveResource('/api/posts', editingId, data)) {
        closeModal();
        loadEntradas();
    }
}

function openDelete(id) {
    const e = allEntradas.find(e => e.id === id);
    askDelete(e.title, `/api/posts/${id}`, loadEntradas);
}

// ── INIT ──────────────────────────────────────────────────────
(async () => {
    await loadMaterias();
    allUnidades = await (await fetch(`${API}/api/units`)).json();
    await loadEntradas();
})();
