requireAuth();

let editingId = null;
let deletingId = null;
let allMaterias = [];
let allUnidades = [];
let allEntradas = [];
let quillEditor = null;

// ── QUILL ──────────────────────────────────────────────────────
function initEditor() {
    if (quillEditor) return;
    quillEditor = new Quill('#editorContainer', {
        theme: 'snow',
        modules: {
            toolbar: {
                container: [
                    ['bold', 'italic', 'underline'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'header': [1, 2, 3, false] }],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link', 'blockquote', 'code-block'],
                    ['image', 'formula'],
                    ['clean']
                ],
                handlers: { image: imageHandler }
            }
        }
    });
    const toolbar = quillEditor.getModule('toolbar');
    toolbar.addHandler('image', imageHandler);
}

function imageHandler() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        const range = quillEditor.getSelection() || { index: quillEditor.getLength() };
        try {
            const res = await fetch(`${API}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}` },
                body: formData
            });
            if (!res.ok) { alert('Error al subir la imagen'); return; }
            const data = await res.json();
            quillEditor.insertEmbed(range.index, 'image', data.url);
        } catch (err) { alert('Error al conectar'); }
    };
    input.click();
}

function pdfHandler() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}` },
                body: formData
            });
            if (!res.ok) { alert('Error al subir el PDF'); return; }
            const data = await res.json();
            const range = quillEditor.getSelection() || { index: quillEditor.getLength() };
            const embedHtml = `<iframe src="${data.url}#toolbar=1&navpanes=0&scrollbar=1&zoom=100" width="100%" height="600" style="border:1px solid #e2e8f0; border-radius:8px; margin:1rem 0;"></iframe>`;
            quillEditor.clipboard.dangerouslyPasteHTML(range.index, embedHtml);
        } catch (err) { alert('Error al conectar'); }
    };
    input.click();
}

// ── CARGAR DATOS ───────────────────────────────────────────────
async function loadMaterias() {
    const res = await authFetch(`${API}/api/subjects`);
    allMaterias = await res.json();

    const filter = document.getElementById('filterMateria');
    const field = document.getElementById('fieldMateria');
    const options = allMaterias.map(m => `<option value="${m.id}">${m.name} — ${PERIODS[m.period] || m.period}</option>`).join('');
    filter.innerHTML = `<option value="">Todas las materias</option>` + options;
    field.innerHTML = options;
}

async function onMateriaFilter() {
    const materiaId = document.getElementById('filterMateria').value;
    await loadUnidadesFilter(materiaId);
    await loadEntradas();
}

async function loadUnidadesFilter(materiaId) {
    const filter = document.getElementById('filterUnidad');
    if (!materiaId) {
        filter.innerHTML = `<option value="">Todas las unidades</option>`;
        return;
    }
    const res = await fetch(`${API}/api/units?subject_id=${materiaId}`);
    const unidades = await res.json();
    filter.innerHTML = `<option value="">Todas las unidades</option>` +
        unidades.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
}

async function onMateriaChange() {
    const materiaId = document.getElementById('fieldMateria').value;
    const select = document.getElementById('fieldUnidad');
    if (!materiaId) { select.innerHTML = `<option value="">Sin unidad</option>`; return; }
    const res = await fetch(`${API}/api/units?subject_id=${materiaId}`);
    const unidades = await res.json();
    select.innerHTML = `<option value="">Sin unidad</option>` +
        unidades.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
}

async function loadEntradas() {
    const tbody = document.getElementById('entradasTable');
    const materiaId = document.getElementById('filterMateria').value;
    const unidadId = document.getElementById('filterUnidad').value;

    try {
        let url = `${API}/api/posts`;
        const params = [];
        if (materiaId) params.push(`subject_id=${materiaId}`);
        if (unidadId) params.push(`unit_id=${unidadId}`);
        if (params.length) url += '?' + params.join('&');

        const res = await fetch(url);
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
                    <td style="color:#64748b; font-size:0.82rem">${unidad ? unidad.name : '—'}</td>
                    <td>${e.is_pro ? '<span class="pro-tag">PRO</span>' : 'Gratis'}</td>
                    <td>${e.order}</td>
                    <td class="actions">
                        <button class="btn btn-secondary btn-sm" onclick="openModal(${e.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="openDelete(${e.id}, '${e.title.replace(/'/g, "\\'")}')">Eliminar</button>
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
    document.getElementById('modalOverlay').classList.add('show');
    initEditor();

    if (id) {
        const res = await authFetch(`${API}/api/admin/posts/${id}`);
        const e = await res.json();
        document.getElementById('fieldMateria').value = e.subject_id;
        await onMateriaChange();
        document.getElementById('fieldUnidad').value = e.unit_id || '';
        document.getElementById('fieldTitle').value = e.title;
        quillEditor.root.innerHTML = e.content || '';
        document.getElementById('fieldImageUrl').value = e.image_url || '';
        document.getElementById('fieldIsPro').checked = !!e.is_pro;
        document.getElementById('fieldOrder').value = e.order;
    } else {
        document.getElementById('fieldTitle').value = '';
        if (quillEditor) quillEditor.root.innerHTML = '';
        document.getElementById('fieldImageUrl').value = '';
        document.getElementById('fieldIsPro').checked = false;
        document.getElementById('fieldOrder').value = 0;
        await onMateriaChange();
    }
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    editingId = null;
}

async function save() {
    const subject_id = document.getElementById('fieldMateria').value;
    const unit_id = document.getElementById('fieldUnidad').value || null;
    const title = document.getElementById('fieldTitle').value.trim();
    const content = quillEditor.root.innerHTML.trim();
    const image_url = document.getElementById('fieldImageUrl').value.trim();
    const is_pro = document.getElementById('fieldIsPro').checked;
    const order = document.getElementById('fieldOrder').value || 0;

    if (!subject_id || !title || !content) { alert('Materia, título y contenido son obligatorios'); return; }

    const url = editingId ? `${API}/api/posts/${editingId}` : `${API}/api/posts`;
    const method = editingId ? 'PUT' : 'POST';

    await authFetch(url, {
        method,
        body: JSON.stringify({ subject_id, unit_id, title, content, image_url, is_pro, order })
    });

    closeModal();
    loadEntradas();
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
    await authFetch(`${API}/api/posts/${deletingId}`, { method: 'DELETE' });
    closeDelete();
    loadEntradas();
}

// ── INIT ──────────────────────────────────────────────────────
(async () => {
    await loadMaterias();
    const res = await fetch(`${API}/api/units`);
    allUnidades = await res.json();
    await loadEntradas();
})();