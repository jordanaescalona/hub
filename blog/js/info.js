const API = 'https://hub-api.jordana-escalona.workers.dev';
let allInfoItems = [];
let currentZoom = 1;
let isDragging = false;
let startX, startY, scrollLeft, scrollTop;
let infoCategories = [];

async function loadCategories() {
    const res = await fetch(`${API}/api/info-categories`);
    infoCategories = await res.json();

    const filterSelect = document.getElementById('filterCategory');
    if (filterSelect) {
        filterSelect.innerHTML = `<option value="">Todo</option>` +
            infoCategories.map(cat => `<option value="${cat.slug}">${cat.icon} ${cat.name}</option>`).join('');
    }
}

function getCategoryLabel(slug) {
    const cat = infoCategories.find(c => c.slug === slug);
    return cat ? `${cat.icon} ${cat.name}` : slug;
}

async function loadInfo() {
    const list = document.getElementById('infoList');
    list.innerHTML = '<div class="loading-blog">Cargando...</div>';

    const category = document.getElementById('filterCategory').value;

    try {
        const url = category
            ? `${API}/api/info?category=${category}`
            : `${API}/api/info`;

        const res = await fetch(url);
        allInfoItems = await res.json();

        if (allInfoItems.length === 0) {
            list.innerHTML = `<div class="empty-state-blog">No hay información en esta categoría todavía.</div>`;
            return;
        }

        list.innerHTML = allInfoItems.map(item => `
            <div class="post-accordion" data-category="${item.category}">
                <button class="post-accordion-header" onclick="toggleAccordion(${item.id})">
                    <div>
                        <span class="info-category-badge" style="background:#e0f2fe; color:#0369a1; padding:0.2rem 0.6rem; border-radius:20px; font-size:0.75rem; font-weight:600;">${getCategoryLabel(item.category)}</span>
                        ${item.is_pinned ? '<span class="pinned-badge">📌 Destacado</span>' : ''}
                        <span class="post-accordion-title">${item.title}</span>
                        ${item.show_date !== 0 ? `<div class="post-date">${formatInfoDate(item)}</div>` : ''}
                    </div>
                    <span class="accordion-arrow" id="arrow-${item.id}">▼</span>
                </button>
                <div class="post-accordion-body" id="body-${item.id}" style="display:none">
                    <div class="post-content">${item.content}</div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        list.innerHTML = `<div class="empty-state-blog">Error al cargar la información.</div>`;
    }
}

function toggleAccordion(id) {
    const body = document.getElementById(`body-${id}`);
    const arrow = document.getElementById(`arrow-${id}`);
    const isOpen = body.style.display === 'block';
    body.style.display = isOpen ? 'none' : 'block';
    arrow.textContent = isOpen ? '▼' : '▲';
}

function formatInfoDate(item) {
    const dateStr = item.custom_date || item.created_at;
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── LIGHTBOX ──────────────────────────────────────────────────
function openLightbox(src, alt) {
    const overlay = document.getElementById('lightboxOverlay');
    const img = document.getElementById('lightboxImg');
    img.src = src; img.alt = alt;
    img.style.maxWidth = '90vw'; img.style.maxHeight = '90vh';
    img.style.width = 'auto'; img.style.cursor = 'zoom-in';
    currentZoom = 1;
    overlay.scrollTop = 0; overlay.scrollLeft = 0;
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    document.body.style.overflow = 'hidden';
}

function closeLightbox(e) {
    if (e) e.stopPropagation();
    document.getElementById('lightboxOverlay').style.display = 'none';
    document.body.style.overflow = '';
    currentZoom = 1;
}

function zoomIn(e) {
    e.stopPropagation();
    currentZoom = Math.min(currentZoom + 0.5, 4);
    applyZoom();
}

function zoomOut(e) {
    e.stopPropagation();
    currentZoom = Math.max(currentZoom - 0.5, 0.5);
    applyZoom();
}

function resetZoom(e) {
    e.stopPropagation();
    currentZoom = 1;
    applyZoom();
}

function applyZoom() {
    const img = document.getElementById('lightboxImg');
    const overlay = document.getElementById('lightboxOverlay');
    if (currentZoom > 1) {
        img.style.maxWidth = 'none'; img.style.maxHeight = 'none';
        img.style.width = `${90 * currentZoom}vw`; img.style.cursor = 'grab';
        overlay.style.alignItems = 'flex-start'; overlay.style.justifyContent = 'flex-start';
        overlay.style.padding = '4rem 2rem 5rem';
    } else {
        img.style.maxWidth = '90vw'; img.style.maxHeight = '90vh';
        img.style.width = 'auto'; img.style.cursor = 'zoom-in';
        overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
        overlay.style.padding = '0';
    }
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
    await loadCategories();
    loadInfo();

    document.getElementById('filterCategory').addEventListener('change', loadInfo);

    document.getElementById('lightboxOverlay').addEventListener('click', function (e) {
        if (e.target !== document.getElementById('lightboxImg') &&
            e.target.tagName !== 'BUTTON' && !isDragging) {
            closeLightbox(e);
        }
    });

    document.addEventListener('click', function (e) {
        if (e.target.tagName === 'IMG' && e.target.closest('.post-content')) {
            openLightbox(e.target.src, e.target.alt);
        }
    });
});