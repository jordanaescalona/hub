requireAuth();

let editingSubjectId = null;
let editingPostId = null;
let allSubjects = [];
let quillEditor = null;

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

            if (!res.ok) {
                alert('Error al subir la imagen');
                return;
            }

            const data = await res.json();
            quillEditor.insertEmbed(range.index, 'image', data.url);

        } catch (err) {
            alert('Error al conectar con el servidor');
        }
    };
    input.click();
}

function pdfHandler() {
    const url = prompt('Pegá la URL del PDF:');
    if (url) {
        const range = quillEditor.getSelection();
        const embedHtml = `<iframe src="${url}" width="100%" height="500" style="border:1px solid #e2e8f0; border-radius:8px; margin: 1rem 0;"></iframe>`;
        quillEditor.clipboard.dangerouslyPasteHTML(range ? range.index : quillEditor.getLength(), embedHtml);
    }
}
function initQuillEditor() {
    if (quillEditor) return;
    quillEditor = new Quill('#postContentEditor', {
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
                handlers: {
                    image: imageHandler
                }
            }
        }
    });
}

function initQuillEditor() {
    if (quillEditor) return;
    quillEditor = new Quill('#postContentEditor', {
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
                handlers: {
                    image: imageHandler
                }
            }
        }
    });
}

// ── CARGAR MATERIAS ────────────────────────────────────────────
async function loadSubjects() {
    const res = await fetch(`${API}/api/subjects`);
    allSubjects = await res.json();

    const tbody = document.getElementById('subjectsTable');
    if (allSubjects.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">No hay materias todavía</td></tr>`;
    } else {
        tbody.innerHTML = allSubjects.map(s => `
            <tr>
                <td>${s.name}</td>
                <td>${s.slug}</td>
                <td>${s.order}</td>
                <td class="actions">
                    <button class="btn btn-secondary" onclick="openSubjectModal(${s.id})">Editar</button>
                    <button class="btn btn-danger" onclick="deleteSubject(${s.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    const select = document.getElementById('postSubject');
    select.innerHTML = allSubjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

function openSubjectModal(id = null) {
    editingSubjectId = id;
    document.getElementById('subjectModalTitle').textContent = id ? 'Editar materia' : 'Nueva materia';
    document.getElementById('subjectModalOverlay').classList.add('show');

    if (id) {
        const s = allSubjects.find(s => s.id === id);
        document.getElementById('subjectName').value = s.name;
        document.getElementById('subjectSlug').value = s.slug;
        document.getElementById('subjectDescription').value = s.description || '';
        document.getElementById('subjectOrder').value = s.order;
    } else {
        document.getElementById('subjectName').value = '';
        document.getElementById('subjectSlug').value = '';
        document.getElementById('subjectDescription').value = '';
        document.getElementById('subjectOrder').value = 0;
    }
}

function closeSubjectModal() {
    document.getElementById('subjectModalOverlay').classList.remove('show');
    editingSubjectId = null;
}

async function saveSubject() {
    const name = document.getElementById('subjectName').value.trim();
    const slug = document.getElementById('subjectSlug').value.trim();
    const description = document.getElementById('subjectDescription').value.trim();
    const order = document.getElementById('subjectOrder').value || 0;

    if (!name || !slug) { alert('Nombre y slug son obligatorios'); return; }

    const url = editingSubjectId ? `${API}/api/subjects/${editingSubjectId}` : `${API}/api/subjects`;
    const method = editingSubjectId ? 'PUT' : 'POST';

    await authFetch(url, {
        method,
        body: JSON.stringify({ name, slug, description, order })
    });

    closeSubjectModal();
    loadSubjects();
}

async function deleteSubject(id) {
    if (!confirm('¿Eliminar esta materia? También se borrarán todas sus entradas.')) return;
    await authFetch(`${API}/api/subjects/${id}`, { method: 'DELETE' });
    loadSubjects();
    loadPosts();
}

// ── CARGAR ENTRADAS ────────────────────────────────────────────
async function loadPosts() {
    const res = await fetch(`${API}/api/posts`);
    const posts = await res.json();

    const tbody = document.getElementById('postsTable');
    if (posts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">No hay entradas todavía</td></tr>`;
        return;
    }

    tbody.innerHTML = posts.map(p => {
        const subject = allSubjects.find(s => s.id === p.subject_id);
        return `
            <tr>
                <td>${p.title}</td>
                <td>${subject ? subject.name : '—'}</td>
                <td>${p.is_pro ? '<span class="pro-tag">PRO</span>' : 'Gratis'}</td>
                <td class="actions">
                    <button class="btn btn-secondary" onclick="openPostModal(${p.id})">Editar</button>
                    <button class="btn btn-danger" onclick="deletePost(${p.id})">Eliminar</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function openPostModal(id = null) {
    editingPostId = id;
    document.getElementById('postModalTitle').textContent = id ? 'Editar entrada' : 'Nueva entrada';
    document.getElementById('postModalOverlay').classList.add('show');

    initQuillEditor();

    if (id) {
        const res = await authFetch(`${API}/api/admin/posts/${id}`);
        const p = await res.json();
        document.getElementById('postSubject').value = p.subject_id;
        document.getElementById('postTitle').value = p.title;
        quillEditor.root.innerHTML = p.content;
        document.getElementById('postImageUrl').value = p.image_url || '';
        document.getElementById('postIsPro').checked = !!p.is_pro;
        document.getElementById('postOrder').value = p.order;
    } else {
        document.getElementById('postTitle').value = '';
        quillEditor.root.innerHTML = '';
        document.getElementById('postImageUrl').value = '';
        document.getElementById('postIsPro').checked = false;
        document.getElementById('postOrder').value = 0;
    }
}

function closePostModal() {
    document.getElementById('postModalOverlay').classList.remove('show');
    editingPostId = null;
}

async function savePost() {
    const subject_id = document.getElementById('postSubject').value;
    const title = document.getElementById('postTitle').value.trim();
    const content = quillEditor.root.innerHTML.trim();
    const image_url = document.getElementById('postImageUrl').value.trim();
    const is_pro = document.getElementById('postIsPro').checked;
    const order = document.getElementById('postOrder').value || 0;

    if (!subject_id || !title || !content) { alert('Materia, título y contenido son obligatorios'); return; }

    const url = editingPostId ? `${API}/api/posts/${editingPostId}` : `${API}/api/posts`;
    const method = editingPostId ? 'PUT' : 'POST';

    await authFetch(url, {
        method,
        body: JSON.stringify({ subject_id, title, content, image_url, is_pro, order })
    });

    closePostModal();
    loadPosts();
}

async function deletePost(id) {
    if (!confirm('¿Eliminar esta entrada?')) return;
    await authFetch(`${API}/api/posts/${id}`, { method: 'DELETE' });
    loadPosts();
}

// ── INIT ──────────────────────────────────────────────────────
(async () => {
    await loadSubjects();
    await loadPosts();
})();