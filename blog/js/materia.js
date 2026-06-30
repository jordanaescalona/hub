const API = 'https://hub-api.jordana-escalona.workers.dev';

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

loadSubjectAndPosts();

function openLightbox(src, alt) {
    const overlay = document.getElementById('lightboxOverlay');
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightboxImg').alt = alt;
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightboxOverlay').style.display = 'none';
    document.body.style.overflow = '';
}

// Cerrar al hacer clic fuera de la imagen
document.getElementById('lightboxOverlay').addEventListener('click', function(e) {
    if (e.target !== document.getElementById('lightboxImg')) closeLightbox();
});

// Hacer clickeables las imágenes del contenido
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'IMG' && e.target.closest('.post-content')) {
        openLightbox(e.target.src, e.target.alt);
    }
});