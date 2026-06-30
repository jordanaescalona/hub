const API = 'https://hub-api.jordana-escalona.workers.dev';

let currentZoom = 1;
let isDragging = false;
let startX, startY, scrollLeft, scrollTop;

function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('slug');
}

async function loadSubjectAndPosts() {
    const slug = getSlugFromUrl();
    if (!slug) {
        document.getElementById('subjectName').textContent = 'Materia no encontrada';
        return;
    }

    try {
        const subjectRes = await fetch(`${API}/api/subjects/${slug}`);
        if (!subjectRes.ok) {
            document.getElementById('subjectName').textContent = 'Materia no encontrada';
            return;
        }
        const subject = await subjectRes.json();

        document.title = `${subject.name} — Blog Tecnicatura`;
        document.getElementById('subjectName').textContent = subject.name;
        document.getElementById('subjectDescription').textContent = subject.description || '';

        const postsRes = await fetch(`${API}/api/posts?subject_id=${subject.id}`);
        const posts = await postsRes.json();

        const list = document.getElementById('postsList');

        if (posts.length === 0) {
            list.innerHTML = `<div class="empty-state-blog">Todavía no hay entradas en esta materia.</div>`;
            return;
        }

        list.innerHTML = posts.map(p => `
            <div class="post-accordion">
                <button class="post-accordion-header" onclick="toggleAccordion(${p.id})">
                    <div>
                        ${p.is_pro ? '<span class="pro-badge">⭐ PRO</span>' : ''}
                        <span class="post-accordion-title">${p.title}</span>
                        <div class="post-date">${formatDate(p.created_at)}</div>
                    </div>
                    <span class="accordion-arrow" id="arrow-${p.id}">▼</span>
                </button>
                <div class="post-accordion-body" id="body-${p.id}" style="display:none">
                    ${p.locked
                        ? `<div class="pro-locked">
                             <div class="icon">🔒</div>
                             <p>Este contenido es exclusivo para usuarios PRO</p>
                           </div>`
                        : `${p.image_url ? `<img src="${p.image_url}" alt="${p.title}">` : ''}
                           <div class="post-content">${p.content}</div>`
                    }
                </div>
            </div>
        `).join('');

    } catch (err) {
        document.getElementById('postsList').innerHTML = `<div class="empty-state-blog">Error al cargar las entradas.</div>`;
    }
}

function toggleAccordion(id) {
    const body = document.getElementById(`body-${id}`);
    const arrow = document.getElementById(`arrow-${id}`);
    const isOpen = body.style.display === 'block';

    body.style.display = isOpen ? 'none' : 'block';
    arrow.textContent = isOpen ? '▼' : '▲';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── LIGHTBOX ──────────────────────────────────────────────────
function openLightbox(src, alt) {
    const overlay = document.getElementById('lightboxOverlay');
    const img = document.getElementById('lightboxImg');
    img.src = src;
    img.alt = alt;
    img.style.transform = 'scale(1)';
    img.style.maxWidth = '90vw';
    img.style.maxHeight = '90vh';
    img.style.width = 'auto';
    img.style.cursor = 'zoom-in';
    currentZoom = 1;
    overlay.scrollTop = 0;
    overlay.scrollLeft = 0;
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
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
        img.style.maxWidth = 'none';
        img.style.maxHeight = 'none';
        img.style.width = `${90 * currentZoom}vw`;
        img.style.cursor = 'grab';
        overlay.style.alignItems = 'flex-start';
        overlay.style.justifyContent = 'flex-start';
        overlay.style.padding = '4rem 2rem 5rem';
    } else {
        img.style.maxWidth = '90vw';
        img.style.maxHeight = '90vh';
        img.style.width = 'auto';
        img.style.cursor = 'zoom-in';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '0';
    }
}

function initDrag() {
    const overlay = document.getElementById('lightboxOverlay');

    overlay.addEventListener('mousedown', (e) => {
        if (currentZoom <= 1) return;
        if (e.target.tagName === 'BUTTON') return;
        isDragging = true;
        startX = e.pageX - overlay.offsetLeft;
        startY = e.pageY - overlay.offsetTop;
        scrollLeft = overlay.scrollLeft;
        scrollTop = overlay.scrollTop;
        overlay.style.cursor = 'grabbing';
    });

    overlay.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - overlay.offsetLeft;
        const y = e.pageY - overlay.offsetTop;
        overlay.scrollLeft = scrollLeft - (x - startX);
        overlay.scrollTop = scrollTop - (y - startY);
    });

    overlay.addEventListener('mouseup', () => {
        isDragging = false;
        overlay.style.cursor = currentZoom > 1 ? 'grab' : 'zoom-out';
    });

    overlay.addEventListener('mouseleave', () => {
        isDragging = false;
    });
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    initDrag();

    document.getElementById('lightboxOverlay').addEventListener('click', function(e) {
        if (e.target !== document.getElementById('lightboxImg') &&
            e.target.tagName !== 'BUTTON' &&
            !isDragging) {
            closeLightbox();
        }
    });

    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'IMG' && e.target.closest('.post-content')) {
            openLightbox(e.target.src, e.target.alt);
        }
    });
});

loadSubjectAndPosts();