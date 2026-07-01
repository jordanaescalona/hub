const API = 'https://hub-api.jordana-escalona.workers.dev';

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
            <a href="materia.html?slug=${s.slug}" class="subject-card">
                <div class="icon">📘</div>
                <h3>${s.name}</h3>
                <p>${s.description || 'Ver entradas de esta materia'}</p>
                <span class="subject-link">Ver entradas</span>
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

        const categoryLabel = {
            examen: '📅 Examen',
            faq: '❓ FAQ',
            documento: '📄 Documento',
            noticia: '📢 Noticia'
        };

        list.innerHTML = latest.map(item => `
            <div class="post-accordion">
                <button class="post-accordion-header" onclick="toggleNovedadAccordion(${item.id})">
                    <div>
                        <span class="info-category-badge badge-${item.category}">${categoryLabel[item.category] || item.category}</span>
                        ${item.is_pinned ? '<span class="pinned-badge">📌 Destacado</span>' : ''}
                        <span class="post-accordion-title">${item.title}</span>
                        <div class="post-date">${formatInfoDate(item.created_at)}</div>
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
}

function formatInfoDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
}

loadSubjects();
loadNovedades();