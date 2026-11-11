// Página de una materia: datos de la materia y sus entradas.

function renderPost(p) {
    const body = p.locked
        ? `<div class="pro-locked">
               <div class="icon">🔒</div>
               <p>Este contenido es exclusivo para usuarios PRO</p>
           </div>`
        : `${p.image_url ? `<img src="${p.image_url}" alt="${p.title}">` : ''}
           <div class="post-content">${p.content}</div>`;

    return `
        <div class="post-accordion">
            <button class="post-accordion-header" onclick="toggleAccordion(this)">
                <div>
                    ${p.is_pro ? '<span class="pro-badge">⭐ PRO</span>' : ''}
                    <span class="post-accordion-title">${p.title}</span>
                </div>
                <span class="accordion-arrow">▼</span>
            </button>
            <div class="post-accordion-body">${body}</div>
        </div>`;
}

async function loadSubjectAndPosts() {
    const title = document.getElementById('subjectName');
    const list = document.getElementById('postsList');
    const slug = new URLSearchParams(window.location.search).get('slug');

    if (!slug) {
        title.textContent = 'Materia no encontrada';
        list.innerHTML = '';
        return;
    }

    try {
        const subjectRes = await fetch(`${API}/api/subjects/${encodeURIComponent(slug)}`);
        if (!subjectRes.ok) {
            title.textContent = 'Materia no encontrada';
            list.innerHTML = '';
            return;
        }
        const subject = await subjectRes.json();

        document.title = `${subject.name} — Blog Tecnicatura`;
        title.textContent = subject.name;
        document.getElementById('subjectDescription').textContent = subject.description || '';

        const postsRes = await fetch(`${API}/api/posts?subject_id=${subject.id}`);
        const posts = await postsRes.json();

        list.innerHTML = posts.length
            ? posts.map(renderPost).join('')
            : `<div class="empty-state-blog">Todavía no hay entradas en esta materia.</div>`;

    } catch (err) {
        list.innerHTML = `<div class="empty-state-blog">Error al cargar las entradas.</div>`;
    }
}

loadSubjectAndPosts();
