// Portada del blog: últimas novedades y listado de materias.

async function loadSubjects() {
    const grid = document.getElementById('subjectsGrid');
    try {
        const res = await fetch(`${API}/api/subjects`);
        const subjects = await res.json();

        if (subjects.length === 0) {
            grid.innerHTML = `<div class="loading-blog">Próximamente habrá materias acá.</div>`;
            return;
        }

        grid.innerHTML = subjects.map(s => {
            const color = s.color || '#7dd3fc';
            return `
                <a href="materia.html?slug=${s.slug}" class="subject-card" style="border-top-color:${color}">
                    <div class="icon" style="color:${color}">📘</div>
                    <h3>${s.name}</h3>
                    <p>${s.description || 'Ver entradas de esta materia'}</p>
                    <span class="subject-link" style="color:${color}">Ver entradas →</span>
                </a>`;
        }).join('');

    } catch (err) {
        grid.innerHTML = `<div class="loading-blog">Error al cargar las materias.</div>`;
    }
}

async function loadNovedades() {
    const list = document.getElementById('novedadesList');
    try {
        const res = await fetch(`${API}/api/info`);
        const latest = (await res.json()).slice(0, 5);

        if (latest.length === 0) {
            list.innerHTML = `<div class="loading-blog">No hay novedades todavía.</div>`;
            return;
        }

        list.innerHTML = latest.map(renderInfoItem).join('');

    } catch (err) {
        list.innerHTML = `<div class="loading-blog">Error al cargar las novedades.</div>`;
    }
}

(async () => {
    loadSubjects();
    try { await loadInfoCategories(); } catch (err) { /* sin categorías se muestra el slug */ }
    loadNovedades();
})();
