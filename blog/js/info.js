// Página de información: filtros por categoría y listado de avisos.

function renderFilterButtons() {
    document.getElementById('filterButtons').innerHTML =
        `<button class="filter-btn active" onclick="filterInfo('', this)">Todo</button>` +
        infoCategories.map(cat => `
            <button class="filter-btn" onclick="filterInfo('${cat.slug}', this)">${cat.icon} ${cat.name}</button>
        `).join('');
}

async function loadInfo(category = '') {
    const list = document.getElementById('infoList');
    list.innerHTML = '<div class="loading-blog">Cargando...</div>';

    try {
        const url = category ? `${API}/api/info?category=${encodeURIComponent(category)}` : `${API}/api/info`;
        const res = await fetch(url);
        const items = await res.json();

        if (items.length === 0) {
            list.innerHTML = `<div class="empty-state-blog">No hay información en esta categoría todavía.</div>`;
            return;
        }

        list.innerHTML = items.map(renderInfoItem).join('');

    } catch (err) {
        list.innerHTML = `<div class="empty-state-blog">Error al cargar la información.</div>`;
    }
}

function filterInfo(category, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadInfo(category);
}

(async () => {
    try {
        await loadInfoCategories();
        renderFilterButtons();
    } catch (err) { /* sin categorías queda solo el filtro "Todo" */ }
    loadInfo();
})();
