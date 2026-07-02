const API = 'https://hub-api.jordana-escalona.workers.dev';
let blogInfoCategories = [];

async function loadInfoCategories() {
    const res = await fetch(`${API}/api/info-categories`);
    blogInfoCategories = await res.json();
}

function getBlogCategoryLabel(slug) {
    const cat = blogInfoCategories.find(c => c.slug === slug);
    return cat ? `${cat.icon} ${cat.name}` : slug;
}

async function loadSubjects() {
    const grid = document.getElementById('subjectsGrid');
    try {
        const res = await fetch(`${API}/api/subjects`);
        const subjects = await res.json();

        if (subjects.length === 0) {
            grid.innerHTML = `<div class="loading-blog">Próximamente habrá materias acá.</div>`;
            return;
        }

        grid.innerHTML = subjects.map(s => `
            <a href="materia.html?slug=${s.slug}" class="subject-card" style="border-top: 4px solid ${s.color || '#7dd3fc'};">
                <div class="icon" style="color:${s.color || '#7dd3fc'}">📘</div>
                <h3>${s.name}</h3>
                <p>${s.description || 'Ver entradas de esta materia'}</p>
                <span class="subject-link" style="color:${s.color || '#7dd3fc'}">Ver entradas →</span>
            </a>
        `).join('');

    } catch (err) {
        grid.innerHTML = `<div class="loading-blog">Error al cargar las materias.</div>`;
    }
}

async function loadNovedades() {
    const list = document.getElementById('novedadesList');
    try {
        const res = await fetch(`${API}/api/info`);
        const items = await res.json();

        const latest = items.slice(0, 5);

        if (latest.length === 0) {
            list.innerHTML = `<div class="loading-blog">No hay novedades todavía.</div>`;
            return;
        }

        list.innerHTML = latest.map(item => `
            <div class="post-accordion">
                <button class="post-accordion-header" onclick="toggleNovedadAccordion(${item.id})">
                    <div>
                        <span style="background:#e0f2fe; color:#0369a1; padding:0.2rem 0.6rem; border-radius:20px; font-size:0.75rem; font-weight:600;">${getBlogCategoryLabel(item.category)}</span>
                        ${item.is_pinned ? '<span class="pinned-badge">📌 Destacado</span>' : ''}
                        <span class="post-accordion-title">${item.title}</span>
                        ${item.show_date !== 0 ? `<div class="post-date">${formatInfoDate(item)}</div>` : ''}
                    </div>
                    <span class="accordion-arrow" id="nav-arrow-${item.id}">▼</span>
                </button>
                <div class="post-accordion-body" id="nav-body-${item.id}" style="display:none">
                    <div class="post-content">${item.content}</div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        list.innerHTML = `<div class="loading-blog">Error al cargar las novedades.</div>`;
    }
}

function toggleNovedadAccordion(id) {
    const body = document.getElementById(`nav-body-${id}`);
    const arrow = document.getElementById(`nav-arrow-${id}`);
    const isOpen = body.style.display === 'block';
    body.style.display = isOpen ? 'none' : 'block';
    arrow.textContent = isOpen ? '▼' : '▲';
    if (!isOpen) addPdfDownloadButtons();
}

function formatInfoDate(item) {
    const dateStr = item.custom_date || item.created_at;
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function addPdfDownloadButtons() {
    document.querySelectorAll('.post-content iframe').forEach(iframe => {
        if (iframe.nextElementSibling?.classList.contains('pdf-download-btn')) return;
        const url = iframe.src.split('#')[0];
        const btn = document.createElement('a');
        btn.href = url;
        btn.target = '_blank';
        btn.download = '';
        btn.className = 'pdf-download-btn';
        btn.innerHTML = '⬇️ Descargar PDF';
        btn.style.cssText = 'display:inline-block; margin-top:0.5rem; padding:0.5rem 1.2rem; background:#2563eb; color:#fff; border-radius:6px; text-decoration:none; font-size:0.85rem; font-weight:600;';
        iframe.insertAdjacentElement('afterend', btn);
    });
}

async function init() {
    await loadInfoCategories();
    loadSubjects();
    loadNovedades();
}

init();