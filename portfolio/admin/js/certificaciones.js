requireAuth();

let editingId = null;
let allCertificaciones = [];

async function loadCertificaciones() {
    const tbody = document.getElementById('certificacionesTable');
    try {
        const res = await fetch(`${API}/api/certifications`);
        allCertificaciones = await res.json();

        if (allCertificaciones.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No hay certificaciones todavía</td></tr>`;
            return;
        }

        tbody.innerHTML = allCertificaciones.map(c => `
            <tr>
                <td>${c.image_url ? `<img src="${c.image_url}" class="thumb" alt="">` : '<span class="muted">—</span>'}</td>
                <td><strong>${c.name}</strong></td>
                <td class="muted">${c.issuer}</td>
                <td class="muted">${formatMonthYear(c.date)}</td>
                <td>${c.order}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="openModal(${c.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="openDelete(${c.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Error al cargar</td></tr>`;
    }
}

function openModal(id = null) {
    editingId = id;
    const c = allCertificaciones.find(c => c.id === id) || {};
    document.getElementById('modalTitle').textContent = id ? 'Editar certificación' : 'Nueva certificación';
    document.getElementById('fieldName').value = c.name || '';
    document.getElementById('fieldIssuer').value = c.issuer || '';
    document.getElementById('fieldDate').value = c.date || '';
    document.getElementById('fieldCredentialUrl').value = c.credential_url || '';
    document.getElementById('fieldImageUrl').value = c.image_url || '';
    document.getElementById('fieldOrder').value = c.order || 0;
    previewImage(c.image_url);
    renderTechSelector(parseTechs(c.technologies));
    openOverlay('modalOverlay');
}

function closeModal() {
    closeOverlay('modalOverlay');
    editingId = null;
}

function previewImage(url) {
    document.getElementById('previewImg').src = url || '';
    document.getElementById('imagePreview').style.display = url ? 'block' : 'none';
}

async function save() {
    const data = {
        name: document.getElementById('fieldName').value.trim(),
        issuer: document.getElementById('fieldIssuer').value.trim(),
        date: document.getElementById('fieldDate').value,
        credential_url: document.getElementById('fieldCredentialUrl').value.trim(),
        image_url: document.getElementById('fieldImageUrl').value.trim(),
        order: document.getElementById('fieldOrder').value || 0,
        technologies: selectedTechs.join(', ')
    };

    if (!data.name || !data.issuer || !data.date) { alert('Nombre, emisor y fecha son obligatorios'); return; }

    if (await saveResource('/api/certifications', editingId, data)) {
        closeModal();
        loadCertificaciones();
    }
}

function openDelete(id) {
    const c = allCertificaciones.find(c => c.id === id);
    askDelete(c.name, `/api/certifications/${id}`, loadCertificaciones);
}

(async () => {
    await loadTecnologias();
    await loadCertificaciones();
})();
