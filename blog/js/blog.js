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

loadSubjects();