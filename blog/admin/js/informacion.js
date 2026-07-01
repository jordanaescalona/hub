requireAuth();

let editingId = null;
let deletingId = null;
let editingCatId = null;
let deletingCatId = null;
let quillEditor = null;
let allCategories = [];

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

// ── CATEGORÍAS ────────────────────────────────────────────────
async function loadCategories() {
    const res = await fetch(`${API}/api/info-categories`);
    allCategories = await res.json();

    const tbody = document.getElementById('categoriesTable');
    const select = document.getElementById('fieldCategory');

    if (allCategories.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No hay categorías todavía</td></tr>`;
    } else {
        tbody.innerHTML = allCategories.map(cat => `
            <tr>
                <td>${cat.icon}</td>
                <td><strong>${cat.name}</strong></td>
                <td style="color:#64748b; font-size:0.82rem">${cat.slug}</td>
                <td>${cat.order}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="openCatModal(${cat.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="openDeleteCat(${cat.id}, '${cat.name.replace(/'/g, "\\'")}')">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    select.innerHTML = allCategories.map(cat =>
        `<option value="${cat.slug}">${cat.icon} ${cat.name}</option>`
    ).join('');
}

function openCatModal(id = null) {
    editingCatId = id;
    document.getElementById('catModalTitle').textContent = id ? 'Editar categoría' : 'Nueva categoría';
    document.getElementById('catModalOverlay').classList.add('show');

    if (id) {
        const cat = allCategories.find(c => c.id === id);
        document.getElementById('catIcon').value = cat.icon;
        document.getElementById('catName').value = cat.name;
        document.getElementById('catSlug').value = cat.slug;
        document.getElementById('catOrder').value = cat.order;
    } else {
        document.getElementById('catIcon').value = '';
        document.getElementById('catName').value = '';
        document.getElementById('catSlug').value = '';
        document.getElementById('catOrder').value = 0;
    }
}

function closeCatModal() {
    document.getElementById('catModalOverlay').classList.remove('show');
    editingCatId = null;
}

async function saveCategory() {
    const icon = document.getElementById('catIcon').value.trim();
    const name = document.getElementById('catName').value.trim();
    const slug = document.getElementById('catSlug').value.trim();
    const order = document.getElementById('catOrder').value || 0;

    if (!name || !slug) { alert('Nombre y slug son obligatorios'); return; }

    const url = editingCatId ? `${API}/api/info-categories/${editingCatId}` : `${API}/api/info-categories`;
    const method = editingCatId ? 'PUT' : 'POST';

    await authFetch(url, {
        method,
        body: JSON.stringify({ name, slug, icon, order })
    });

    closeCatModal();
    await loadCategories();
    await loadInfo();
}

function openDeleteCat(id, name) {
    deletingCatId = id;
    document.getElementById('deleteCatName').textContent = name;
    document.getElementById('deleteCatOverlay').classList.add('show');
}

function closeDeleteCat() {
    document.getElementById('deleteCatOverlay').classList.remove('show');
    deletingCatId = null;
}

async function confirmDeleteCat() {
    await authFetch(`${API}/api/info-categories/${deletingCatId}`, { method: 'DELETE' });
    closeDeleteCat();
    await loadCategories();
    await loadInfo();
}

// Auto slug desde nombre de categoría
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('catName').addEventListener('input', function() {
        if (!editingCatId) {
            document.getElementById('catSlug').value = this.value
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-');
        }
    });
});

// ── INFORMACIÓN ────────────────────────────────────────────────
async function loadInfo() {
    const tbody = document.getElementById('infoTable');
    const category = document.getElementById('filterCategory').value;

    try {
        const url = category ? `${API}/api/info?category=${category}` : `${API}/api/info`;
        const res = await fetch(url);
        const items = await res.json();

        // Actualizar filtro con categorías dinámicas
        const filterSelect = document.getElementById('filterCategory');
        const currentVal = filterSelect.value;
        filterSelect.innerHTML = `<option value="">Todas las categorías</option>` +
            allCategories.map(cat => `<option value="${cat.slug}">${cat.icon} ${cat.name}</option>`).join('');
        filterSelect.value = currentVal;

        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No hay información todavía</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(item => {
            const cat = allCategories.find(c => c.slug === item.category);
            return `
                <tr>
                    <td><strong>${item.title}</strong></td>
                    <td>${cat ? `${cat.icon} ${cat.name}` : item.category}</td>
                    <td>${item.is_pinned ? '📌 Sí' : '—'}</td>
                    <td style="color:#64748b; font-size:0.82rem">${item.show_date ? formatDate(item.custom_date || item.created_at) : '—'}</td>
                    <td class="actions">
                        <button class="btn btn-secondary btn-sm" onclick="openModal(${item.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="openDelete(${item.id}, '${item.title.replace(/'/g, "\\'")}')">Eliminar</button>
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
    document.getElementById('modalTitle').textContent = id ? 'Editar información' : 'Nueva información';
    document.getElementById('modalOverlay').classList.add('show');
    initEditor();

    if (id) {
        const res = await authFetch(`${API}/api/info/${id}`);
        const item = await res.json();
        document.getElementById('fieldCategory').value = item.category;
        document.getElementById('fieldTitle').value = item.title;
        quillEditor.root.innerHTML = item.content || '';
        document.getElementById('fieldIsPinned').checked = !!item.is_pinned;
        document.getElementById('fieldShowDate').checked = item.show_date !== 0;
        document.getElementById('fieldDate').value = item.custom_date || '';
        document.getElementById('fieldOrder').value = item.order;
    } else {
        document.getElementById('fieldCategory').value = allCategories[0]?.slug || '';
        document.getElementById('fieldTitle').value = '';
        if (quillEditor) quillEditor.root.innerHTML = '';
        document.getElementById('fieldIsPinned').checked = false;
        document.getElementById('fieldShowDate').checked = true;
        document.getElementById('fieldDate').value = '';
        document.getElementById('fieldOrder').value = 0;
    }
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    editingId = null;
}

async function save() {
    const category = document.getElementById('fieldCategory').value;
    const title = document.getElementById('fieldTitle').value.trim();
    const content = quillEditor.root.innerHTML.trim();
    const is_pinned = document.getElementById('fieldIsPinned').checked;
    const show_date = document.getElementById('fieldShowDate').checked;
    const custom_date = document.getElementById('fieldDate').value || null;
    const order = document.getElementById('fieldOrder').value || 0;

    if (!title || !content) { alert('Título y contenido son obligatorios'); return; }

    const url = editingId ? `${API}/api/info/${editingId}` : `${API}/api/info`;
    const method = editingId ? 'PUT' : 'POST';

    await authFetch(url, {
        method,
        body: JSON.stringify({ category, title, content, is_pinned, show_date, custom_date, order })
    });

    closeModal();
    loadInfo();
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
    await authFetch(`${API}/api/info/${deletingId}`, { method: 'DELETE' });
    closeDelete();
    loadInfo();
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── INIT ──────────────────────────────────────────────────────
(async () => {
    await loadCategories();
    await loadInfo();
})();
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
    await authFetch(`${API}/api/info/${deletingId}`, { method: 'DELETE' });
    closeDelete();
    loadInfo();
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' });
}

loadInfo();