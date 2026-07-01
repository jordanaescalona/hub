requireAuth();

let editingId = null;
let deletingId = null;

async function loadMaterias() {
    const tbody = document.getElementById('materiasTable');
    try {
        const res = await authFetch(`${API}/api/subjects`);
        const materias = await res.json();

        if (materias.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No hay materias todavía</td></tr>`;
            return;
        }

        tbody.innerHTML = materias.map(m => `
            <tr>
                <td><span style="display:inline-block; width:18px; height:18px; border-radius:50%; background:${m.color || '#7dd3fc'};"></span></td>
                <td><strong>${m.name}</strong></td>
                <td><span class="badge badge-${m.period}">${PERIODS[m.period] || m.period}</span></td>
                <td style="color:#64748b; font-size:0.82rem">${m.slug}</td>
                <td>${m.order}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="openModal(${m.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="openDelete(${m.id}, '${m.name.replace(/'/g, "\\'")}')">Eliminar</button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Error al cargar</td></tr>`;
    }
}

async function openModal(id = null) {
    editingId = id;
    document.getElementById('modalTitle').textContent = id ? 'Editar materia' : 'Nueva materia';
    document.getElementById('modalOverlay').classList.add('show');

    if (id) {
        const res = await authFetch(`${API}/api/subjects`);
        const materias = await res.json();
        const m = materias.find(m => m.id === id);
        document.getElementById('fieldName').value = m.name;
        document.getElementById('fieldSlug').value = m.slug;
        document.getElementById('fieldPeriod').value = m.period || '1c1';
        document.getElementById('fieldDescription').value = m.description || '';
        document.getElementById('fieldColor').value = m.color || '#7dd3fc';
        document.getElementById('fieldOrder').value = m.order;
    } else {
        document.getElementById('fieldName').value = '';
        document.getElementById('fieldSlug').value = '';
        document.getElementById('fieldPeriod').value = '1c1';
        document.getElementById('fieldDescription').value = '';
        document.getElementById('fieldColor').value = '#7dd3fc';
        document.getElementById('fieldOrder').value = 0;
    }
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    editingId = null;
}

async function save() {
    const name = document.getElementById('fieldName').value.trim();
    const slug = document.getElementById('fieldSlug').value.trim();
    const period = document.getElementById('fieldPeriod').value;
    const description = document.getElementById('fieldDescription').value.trim();
    const color = document.getElementById('fieldColor').value;
    const order = document.getElementById('fieldOrder').value || 0;

    if (!name || !slug) { alert('Nombre y slug son obligatorios'); return; }

    const url = editingId ? `${API}/api/subjects/${editingId}` : `${API}/api/subjects`;
    const method = editingId ? 'PUT' : 'POST';

    await authFetch(url, {
        method,
        body: JSON.stringify({ name, slug, description, color, period, order })
    });

    closeModal();
    loadMaterias();
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
    await authFetch(`${API}/api/subjects/${deletingId}`, { method: 'DELETE' });
    closeDelete();
    loadMaterias();
}

// Auto-generar slug desde el nombre
document.getElementById('fieldName').addEventListener('input', function() {
    if (!editingId) {
        document.getElementById('fieldSlug').value = this.value
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
    }
});

loadMaterias();