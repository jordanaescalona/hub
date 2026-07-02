requireAuth();

let editingId = null;
let deletingId = null;
let allProyectos = [];
let allTecnologias = [];
let selectedTechs = [];

async function loadTecnologias() {
    const res = await fetch(`${API}/api/technologies`);
    allTecnologias = await res.json();
}

function renderTechIcon(t) {
    return t.icon && t.icon.startsWith('fa')
        ? `<i class="${t.icon}"></i>`
        : t.icon || '';
}

function renderTechSelector(selected = []) {
    selectedTechs = selected;
    const container = document.getElementById('techSelector');
    container.innerHTML = allTecnologias.map(t => `
        <label style="display:flex; align-items:center; gap:0.4rem; padding:0.3rem 0.7rem; border:1px solid #e2e8f0; border-radius:20px; cursor:pointer; font-size:0.82rem; ${selectedTechs.includes(t.name) ? 'background:#dbeafe; border-color:#2563eb;' : ''}">
            <input type="checkbox" value="${t.name}" ${selectedTechs.includes(t.name) ? 'checked' : ''} style="display:none" onchange="toggleTech('${t.name}', this)">
            ${renderTechIcon(t)} ${t.name}
        </label>
    `).join('');
}

function toggleTech(name, checkbox) {
    if (checkbox.checked) {
        if (!selectedTechs.includes(name)) selectedTechs.push(name);
    } else {
        selectedTechs = selectedTechs.filter(t => t !== name);
    }
    renderTechSelector(selectedTechs);
}

async function loadProyectos() {
    const tbody = document.getElementById('proyectosTable');
    try {
        const res = await fetch(`${API}/api/projects`);
        allProyectos = await res.json();

        if (allProyectos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No hay proyectos todavía</td></tr>`;
            return;
        }

        tbody.innerHTML = allProyectos.map(p => `
            <tr>
                <td><strong>${p.title}</strong></td>
                <td style="color:#64748b; font-size:0.82rem">${p.technologies}</td>
                <td>${p.featured ? '⭐ Sí' : '—'}</td>
                <td>${p.order}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="openModal(${p.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="openDelete(${p.id}, '${p.title.replace(/'/g, "\\'")}')">Eliminar</button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Error al cargar</td></tr>`;
    }
}

async function openModal(id = null) {
    editingId = id;
    document.getElementById('modalTitle').textContent = id ? 'Editar proyecto' : 'Nuevo proyecto';
    document.getElementById('modalOverlay').classList.add('show');

    if (id) {
        const p = allProyectos.find(p => p.id === id);
        document.getElementById('fieldTitle').value = p.title;
        document.getElementById('fieldDescription').value = p.description;
        document.getElementById('fieldRepoUrl').value = p.repo_url || '';
        document.getElementById('fieldDemoUrl').value = p.demo_url || '';
        document.getElementById('fieldImageUrl').value = p.image_url || '';
        document.getElementById('fieldFeatured').checked = !!p.featured;
        document.getElementById('fieldOrder').value = p.order;
        const techs = p.technologies ? p.technologies.split(',').map(t => t.trim()) : [];
        renderTechSelector(techs);
    } else {
        document.getElementById('fieldTitle').value = '';
        document.getElementById('fieldDescription').value = '';
        document.getElementById('fieldRepoUrl').value = '';
        document.getElementById('fieldDemoUrl').value = '';
        document.getElementById('fieldImageUrl').value = '';
        document.getElementById('fieldFeatured').checked = false;
        document.getElementById('fieldOrder').value = 0;
        renderTechSelector([]);
    }
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    editingId = null;
}

function uploadImage() {
    document.getElementById('fileInput').click();
}

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
        const res = await fetch(`${API}/api/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: formData
        });
        if (!res.ok) { alert('Error al subir la imagen'); return; }
        const data = await res.json();
        document.getElementById('fieldImageUrl').value = data.url;
    } catch (err) {
        alert('Error al conectar con el servidor');
    }
}

async function save() {
    const title = document.getElementById('fieldTitle').value.trim();
    const description = document.getElementById('fieldDescription').value.trim();
    const repo_url = document.getElementById('fieldRepoUrl').value.trim();
    const demo_url = document.getElementById('fieldDemoUrl').value.trim();
    const image_url = document.getElementById('fieldImageUrl').value.trim();
    const featured = document.getElementById('fieldFeatured').checked;
    const order = document.getElementById('fieldOrder').value || 0;
    const technologies = selectedTechs.join(', ');

    if (!title || !description) {
        alert('Título y descripción son obligatorios');
        return;
    }

    const url = editingId ? `${API}/api/projects/${editingId}` : `${API}/api/projects`;
    const method = editingId ? 'PUT' : 'POST';

    await authFetch(url, {
        method,
        body: JSON.stringify({ title, description, technologies, repo_url, demo_url, image_url, featured, order })
    });

    closeModal();
    loadProyectos();
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
    await authFetch(`${API}/api/projects/${deletingId}`, { method: 'DELETE' });
    closeDelete();
    loadProyectos();
}

(async () => {
    await loadTecnologias();
    await loadProyectos();
})();