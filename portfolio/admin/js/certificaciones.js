requireAuth();

let editingId = null;
let deletingId = null;
let allCertificaciones = [];
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

async function loadCertificaciones() {
    const tbody = document.getElementById('certificacionesTable');
    try {
        const res = await fetch(`${API}/api/certifications`);
        allCertificaciones = await res.json();

        if (allCertificaciones.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No hay certificaciones todavía</td></tr>`;
            return;
        }

        tbody.innerHTML = allCertificaciones.map(c => `
            <tr>
                <td><strong>${c.name}</strong></td>
                <td style="color:#64748b">${c.issuer}</td>
                <td style="font-size:0.82rem">${formatDate(c.date)}</td>
                <td>${c.order}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="openModal(${c.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="openDelete(${c.id}, '${c.name.replace(/'/g, "\\'")}')">Eliminar</button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Error al cargar</td></tr>`;
    }
}

async function openModal(id = null) {
    editingId = id;
    document.getElementById('modalTitle').textContent = id ? 'Editar certificación' : 'Nueva certificación';
    document.getElementById('modalOverlay').classList.add('show');

    if (id) {
        const c = allCertificaciones.find(c => c.id === id);
        document.getElementById('fieldName').value = c.name;
        document.getElementById('fieldIssuer').value = c.issuer;
        document.getElementById('fieldDate').value = c.date;
        document.getElementById('fieldCredentialUrl').value = c.credential_url || '';
        document.getElementById('fieldImageUrl').value = c.image_url || '';
        document.getElementById('fieldOrder').value = c.order;
        const techs = c.technologies ? c.technologies.split(',').map(t => t.trim()) : [];
        renderTechSelector(techs);
    } else {
        document.getElementById('fieldName').value = '';
        document.getElementById('fieldIssuer').value = '';
        document.getElementById('fieldDate').value = '';
        document.getElementById('fieldCredentialUrl').value = '';
        document.getElementById('fieldImageUrl').value = '';
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
    const name = document.getElementById('fieldName').value.trim();
    const issuer = document.getElementById('fieldIssuer').value.trim();
    const date = document.getElementById('fieldDate').value;
    const credential_url = document.getElementById('fieldCredentialUrl').value.trim();
    const image_url = document.getElementById('fieldImageUrl').value.trim();
    const order = document.getElementById('fieldOrder').value || 0;
    const technologies = selectedTechs.join(', ');

    if (!name || !issuer || !date) {
        alert('Nombre, emisor y fecha son obligatorios');
        return;
    }

    const url = editingId ? `${API}/api/certifications/${editingId}` : `${API}/api/certifications`;
    const method = editingId ? 'PUT' : 'POST';

    await authFetch(url, {
        method,
        body: JSON.stringify({ name, issuer, date, credential_url, image_url, order, technologies })
    });

    closeModal();
    loadCertificaciones();
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
    await authFetch(`${API}/api/certifications/${deletingId}`, { method: 'DELETE' });
    closeDelete();
    loadCertificaciones();
}

function formatDate(dateStr) {
    const [year, month] = dateStr.split('-');
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${months[parseInt(month) - 1]} ${year}`;
}

(async () => {
    await loadTecnologias();
    await loadCertificaciones();
})();