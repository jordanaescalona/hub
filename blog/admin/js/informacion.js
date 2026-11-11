requireAuth();

let editingId = null;
let editingCatId = null;
let allCategories = [];
let allItems = [];

function categoryOptions() {
    return allCategories.map(cat => `<option value="${cat.slug}">${cat.icon} ${cat.name}</option>`).join('');
}

// ── CATEGORÍAS ────────────────────────────────────────────────
async function loadCategories() {
    const res = await fetch(`${API}/api/info-categories`);
    allCategories = await res.json();

    const tbody = document.getElementById('categoriesTable');
    tbody.innerHTML = allCategories.length === 0
        ? `<tr><td colspan="5" class="empty-state">No hay categorías todavía</td></tr>`
        : allCategories.map(cat => `
            <tr>
                <td>${cat.icon}</td>
                <td><strong>${cat.name}</strong></td>
                <td class="muted">${cat.slug}</td>
                <td>${cat.order}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="openCatModal(${cat.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="openDeleteCat(${cat.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');

    document.getElementById('fieldCategory').innerHTML = categoryOptions();

    const filter = document.getElementById('filterCategory');
    const currentVal = filter.value;
    filter.innerHTML = `<option value="">Todas las categorías</option>` + categoryOptions();
    filter.value = currentVal;
}

function openCatModal(id = null) {
    editingCatId = id;
    const cat = allCategories.find(c => c.id === id) || {};
    document.getElementById('catModalTitle').textContent = id ? 'Editar categoría' : 'Nueva categoría';
    document.getElementById('catIcon').value = cat.icon || '';
    document.getElementById('catName').value = cat.name || '';
    document.getElementById('catSlug').value = cat.slug || '';
    document.getElementById('catOrder').value = cat.order || 0;
    openOverlay('catModalOverlay');
}

function closeCatModal() {
    closeOverlay('catModalOverlay');
    editingCatId = null;
}

async function reloadAll() {
    await loadCategories();
    await loadInfo();
}

async function saveCategory() {
    const data = {
        icon: document.getElementById('catIcon').value.trim(),
        name: document.getElementById('catName').value.trim(),
        slug: document.getElementById('catSlug').value.trim(),
        order: document.getElementById('catOrder').value || 0
    };

    if (!data.name || !data.slug) { alert('Nombre y slug son obligatorios'); return; }

    if (await saveResource('/api/info-categories', editingCatId, data)) {
        closeCatModal();
        reloadAll();
    }
}

function openDeleteCat(id) {
    const cat = allCategories.find(c => c.id === id);
    askDelete(cat.name, `/api/info-categories/${id}`, reloadAll, 'Eliminar categoría');
}

// ── INFORMACIÓN ────────────────────────────────────────────────
async function loadInfo() {
    const tbody = document.getElementById('infoTable');
    const category = document.getElementById('filterCategory').value;

    try {
        const url = category ? `${API}/api/info?category=${encodeURIComponent(category)}` : `${API}/api/info`;
        const res = await fetch(url);
        allItems = await res.json();

        if (allItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No hay información todavía</td></tr>`;
            return;
        }

        tbody.innerHTML = allItems.map(item => {
            const cat = allCategories.find(c => c.slug === item.category);
            return `
                <tr>
                    <td><strong>${item.title}</strong></td>
                    <td>${cat ? `${cat.icon} ${cat.name}` : item.category}</td>
                    <td>${item.is_pinned ? '📌 Sí' : '—'}</td>
                    <td class="muted">${item.show_date ? formatDate(item.custom_date || item.created_at) : '—'}</td>
                    <td class="actions">
                        <button class="btn btn-secondary btn-sm" onclick="openModal(${item.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="openDelete(${item.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Error al cargar</td></tr>`;
    }
}

function openModal(id = null) {
    editingId = id;
    const item = allItems.find(i => i.id === id);
    document.getElementById('modalTitle').textContent = id ? 'Editar información' : 'Nueva información';
    initEditor();

    document.getElementById('fieldCategory').value = item?.category || allCategories[0]?.slug || '';
    document.getElementById('fieldTitle').value = item?.title || '';
    setEditorContent(item?.content);
    document.getElementById('fieldIsPinned').checked = !!item?.is_pinned;
    document.getElementById('fieldShowDate').checked = item ? item.show_date !== 0 : true;
    document.getElementById('fieldDate').value = item?.custom_date || '';
    document.getElementById('fieldOrder').value = item?.order || 0;
    openOverlay('modalOverlay');
}

function closeModal() {
    closeOverlay('modalOverlay');
    editingId = null;
}

async function save() {
    const data = {
        category: document.getElementById('fieldCategory').value,
        title: document.getElementById('fieldTitle').value.trim(),
        content: getEditorContent(),
        is_pinned: document.getElementById('fieldIsPinned').checked,
        show_date: document.getElementById('fieldShowDate').checked,
        custom_date: document.getElementById('fieldDate').value || null,
        order: document.getElementById('fieldOrder').value || 0
    };

    if (!data.title || !data.content) { alert('Título y contenido son obligatorios'); return; }

    if (await saveResource('/api/info', editingId, data)) {
        closeModal();
        loadInfo();
    }
}

function openDelete(id) {
    const item = allItems.find(i => i.id === id);
    askDelete(item.title, `/api/info/${id}`, loadInfo, 'Eliminar información');
}

// ── INIT ──────────────────────────────────────────────────────
autoSlug('catName', 'catSlug', () => editingCatId);
reloadAll();
