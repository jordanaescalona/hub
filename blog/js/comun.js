/*
 * Funciones compartidas por las páginas públicas del blog (index, info y materia).
 * Se carga antes que el script propio de cada página.
 */
const API = 'https://hub-api.jordana-escalona.workers.dev';

// ── CATEGORÍAS DE INFORMACIÓN ─────────────────────────────────
let infoCategories = [];

async function loadInfoCategories() {
    const res = await fetch(`${API}/api/info-categories`);
    infoCategories = await res.json();
}

function getCategoryLabel(slug) {
    const cat = infoCategories.find(c => c.slug === slug);
    return cat ? `${cat.icon} ${cat.name}` : slug;
}

// ── FECHAS ────────────────────────────────────────────────────
function formatInfoDate(item) {
    const date = new Date(item.custom_date || item.created_at);
    return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── ACORDEÓN ──────────────────────────────────────────────────
function renderInfoItem(item) {
    return `
        <div class="post-accordion">
            <button class="post-accordion-header" onclick="toggleAccordion(this)">
                <div>
                    <span class="info-category-badge">${getCategoryLabel(item.category)}</span>
                    ${item.is_pinned ? '<span class="pinned-badge">📌 Destacado</span>' : ''}
                    <span class="post-accordion-title">${item.title}</span>
                    ${item.show_date !== 0 ? `<div class="post-date">${formatInfoDate(item)}</div>` : ''}
                </div>
                <span class="accordion-arrow">▼</span>
            </button>
            <div class="post-accordion-body">
                <div class="post-content">${item.content}</div>
            </div>
        </div>`;
}

function toggleAccordion(header) {
    const body = header.nextElementSibling;
    const isOpen = body.classList.toggle('open');
    header.querySelector('.accordion-arrow').textContent = isOpen ? '▲' : '▼';
    if (isOpen) addPdfDownloadButtons(body);
}

// Agrega un botón "Descargar PDF" debajo de cada PDF embebido.
function addPdfDownloadButtons(container) {
    container.querySelectorAll('.post-content iframe').forEach(iframe => {
        if (iframe.nextElementSibling?.classList.contains('pdf-download-btn')) return;
        const btn = document.createElement('a');
        btn.href = iframe.src.split('#')[0];
        btn.target = '_blank';
        btn.download = '';
        btn.className = 'pdf-download-btn';
        btn.textContent = '⬇️ Descargar PDF';
        iframe.insertAdjacentElement('afterend', btn);
    });
}

// ── LIGHTBOX ──────────────────────────────────────────────────
// Al hacer clic en una imagen de una entrada se abre ampliada, con zoom y arrastre.
const lightbox = { zoom: 1, dragging: false, moved: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 };

function createLightbox() {
    const overlay = document.createElement('div');
    overlay.id = 'lightboxOverlay';
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
        <button class="lightbox-btn lightbox-close" data-action="close" aria-label="Cerrar">✕</button>
        <div class="lightbox-controls">
            <button class="lightbox-btn" data-action="in" aria-label="Acercar">+</button>
            <button class="lightbox-btn" data-action="out" aria-label="Alejar">−</button>
            <button class="lightbox-btn" data-action="reset" aria-label="Tamaño original">↺</button>
        </div>
        <img id="lightboxImg" src="" alt="">`;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => {
        const action = e.target.dataset.action;
        if (action === 'close') closeLightbox();
        else if (action === 'in') setZoom(lightbox.zoom + 0.5);
        else if (action === 'out') setZoom(lightbox.zoom - 0.5);
        else if (action === 'reset') setZoom(1);
        else if (e.target.id !== 'lightboxImg' && !lightbox.moved) closeLightbox();
    });

    overlay.addEventListener('mousedown', e => {
        if (lightbox.zoom <= 1 || e.target.tagName === 'BUTTON') return;
        lightbox.dragging = true;
        lightbox.moved = false;
        lightbox.startX = e.pageX;
        lightbox.startY = e.pageY;
        lightbox.scrollLeft = overlay.scrollLeft;
        lightbox.scrollTop = overlay.scrollTop;
        overlay.classList.add('dragging');
    });

    overlay.addEventListener('mousemove', e => {
        if (!lightbox.dragging) return;
        e.preventDefault();
        lightbox.moved = true;
        overlay.scrollLeft = lightbox.scrollLeft - (e.pageX - lightbox.startX);
        overlay.scrollTop = lightbox.scrollTop - (e.pageY - lightbox.startY);
    });

    const stopDrag = () => {
        lightbox.dragging = false;
        overlay.classList.remove('dragging');
        // Se resetea después del click para que soltar tras arrastrar no cierre el lightbox.
        setTimeout(() => { lightbox.moved = false; }, 0);
    };
    overlay.addEventListener('mouseup', stopDrag);
    overlay.addEventListener('mouseleave', stopDrag);

    document.addEventListener('click', e => {
        if (e.target.tagName === 'IMG' && e.target.closest('.post-content')) {
            openLightbox(e.target.src, e.target.alt);
        }
    });
}

function openLightbox(src, alt) {
    const overlay = document.getElementById('lightboxOverlay');
    const img = document.getElementById('lightboxImg');
    img.src = src;
    img.alt = alt;
    setZoom(1);
    overlay.scrollTop = 0;
    overlay.scrollLeft = 0;
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightboxOverlay').classList.remove('show');
    document.body.style.overflow = '';
}

function setZoom(zoom) {
    lightbox.zoom = Math.min(Math.max(zoom, 0.5), 4);
    const overlay = document.getElementById('lightboxOverlay');
    const img = document.getElementById('lightboxImg');
    const zoomed = lightbox.zoom > 1;
    overlay.classList.toggle('zoomed', zoomed);
    img.style.width = zoomed ? `${90 * lightbox.zoom}vw` : '';
}

document.addEventListener('DOMContentLoaded', createLightbox);
