requireAuth();

let editingId = null;
let deletingId = null;
let quillEditor = null;

const CATEGORY_LABELS = {
    noticia: '📢 Noticia',
    examen: '📅 Examen',
    faq: '❓ FAQ',
    documento: '📄 Documento'
};

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
            const embedHtml = `<iframe src="${data.url}#toolbar=0&navpanes=0&scrollbar=1&zoom=100" width="100%" height="500" style="border:1px solid #e2e8f0; border-radius:8px; margin:1rem 0;"></iframe>`;
            quillEditor.clipboard.dangerouslyPasteHTML(range.index, embedHtml);
        } catch (err) { alert('Error al conectar'); }
    };
    input.click();
}

async function loadInfo() {
    const tbody = document.getElementById('infoTable');
    const category = document.getElementById('filterCategory').value;

    try {
        const url = category ? `${API}/api/info?category=${category}` : `${API}/api/info`;
        const res = await fetch(url);
        const items = await res.json();

        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No hay información todavía</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(item => `
            <tr>
                <td><strong>${item.title}</strong></td>
                <td>${CATEGORY_LABELS[item.category] || item.category}</td>
                <td>${item.is_pinned ? '📌 Sí' : '—'}</td>
                <td style="color:#64748b; font-size:0.82rem">${formatDate(item.created_at)}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="openModal(${item.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="openDelete(${item.id}, '${item.title.replace(/'/g, "\\'")}')">Eliminar</button>
                </td>
            </tr>
        `).join('');

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
        document.getElementById('fieldDate').value = item.custom_date || '';
        quillEditor.root.innerHTML = item.content || '';
        document.getElementById('fieldIsPinned').checked = !!item.is_pinned;
        document.getElementById('fieldOrder').value = item.order;
    } else {
        document.getElementById('fieldCategory').value = 'noticia';
        document.getElementById('fieldTitle').value = '';
        document.getElementById('fieldDate').value = '';
        if (quillEditor) quillEditor.root.innerHTML = '';
        document.getElementById('fieldIsPinned').checked = false;
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
    const custom_date = document.getElementById('fieldDate').value || null;
    const content = quillEditor.root.innerHTML.trim();
    const is_pinned = document.getElementById('fieldIsPinned').checked;
    const order = document.getElementById('fieldOrder').value || 0;

    if (!title || !content) { alert('Título y contenido son obligatorios'); return; }

    const url = editingId ? `${API}/api/info/${editingId}` : `${API}/api/info`;
    const method = editingId ? 'PUT' : 'POST';

    await authFetch(url, {
        method,
        body: JSON.stringify({ category, title, content, is_pinned, order })
    });

    await authFetch(url, {
        method,
        body: JSON.stringify({ category, title, content, is_pinned, order, custom_date })
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

loadInfo();