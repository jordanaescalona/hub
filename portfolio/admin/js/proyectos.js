requireAuth();

let editingId = null;
let allProyectos = [];

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
                <td class="muted">${p.technologies || '—'}</td>
                <td>${p.featured ? '⭐ Sí' : '—'}</td>
                <td>${p.order}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="openModal(${p.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="openDelete(${p.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Error al cargar</td></tr>`;
    }
}

function openModal(id = null) {
    editingId = id;
    const p = allProyectos.find(p => p.id === id) || {};
    document.getElementById('modalTitle').textContent = id ? 'Editar proyecto' : 'Nuevo proyecto';
    document.getElementById('fieldTitle').value = p.title || '';
    document.getElementById('fieldDescription').value = p.description || '';
    document.getElementById('fieldRepoUrl').value = p.repo_url || '';
    document.getElementById('fieldDemoUrl').value = p.demo_url || '';
    document.getElementById('fieldImageUrl').value = p.image_url || '';
    document.getElementById('fieldFeatured').checked = !!p.featured;
    document.getElementById('fieldOrder').value = p.order || 0;
    renderTechSelector(parseTechs(p.technologies));
    openOverlay('modalOverlay');
}

function closeModal() {
    closeOverlay('modalOverlay');
    editingId = null;
}

async function save() {
    const data = {
        title: document.getElementById('fieldTitle').value.trim(),
        description: document.getElementById('fieldDescription').value.trim(),
        technologies: selectedTechs.join(', '),
        repo_url: document.getElementById('fieldRepoUrl').value.trim(),
        demo_url: document.getElementById('fieldDemoUrl').value.trim(),
        image_url: document.getElementById('fieldImageUrl').value.trim(),
        featured: document.getElementById('fieldFeatured').checked,
        order: document.getElementById('fieldOrder').value || 0
    };

    if (!data.title || !data.description) { alert('Título y descripción son obligatorios'); return; }

    if (await saveResource('/api/projects', editingId, data)) {
        closeModal();
        loadProyectos();
    }
}

function openDelete(id) {
    const p = allProyectos.find(p => p.id === id);
    askDelete(p.title, `/api/projects/${id}`, loadProyectos);
}

(async () => {
    await loadTecnologias();
    await loadProyectos();
})();
