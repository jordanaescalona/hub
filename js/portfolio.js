// ── PROYECTOS ─────────────────────────────────────────────────
async function loadProjects() {
    const grid = document.getElementById('projectsGrid');
    try {
        const res = await fetch(`${API}/api/projects`);
        const projects = await res.json();

        if (projects.length === 0) {
            grid.innerHTML = `<div class="loading">Próximamente habrá proyectos acá.</div>`;
            return;
        }

        grid.innerHTML = projects.map(p => `
            <div class="project-card">
                ${p.image_url
                    ? `<img src="${p.image_url}" alt="${p.title}">`
                    : `<div class="project-placeholder">💻</div>`
                }
                <div class="project-body">
                    <h3>${p.title}</h3>
                    <p>${p.description}</p>
                    <div class="tech-tags">
                        ${p.technologies.split(',').map(t => `<span class="tech-tag">${t.trim()}</span>`).join('')}
                    </div>
                    <div class="project-links">
                        ${p.repo_url ? `<a href="${p.repo_url}" target="_blank" class="project-link">→ Repositorio</a>` : ''}
                        ${p.demo_url ? `<a href="${p.demo_url}" target="_blank" class="project-link">→ Ver demo</a>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        grid.innerHTML = `<div class="loading">Error al cargar los proyectos.</div>`;
    }
}

// ── CERTIFICACIONES ───────────────────────────────────────────
async function loadCertifications() {
    const grid = document.getElementById('certificationsGrid');
    try {
        const res = await fetch(`${API}/api/certifications`);
        const certifications = await res.json();

        if (certifications.length === 0) {
            grid.innerHTML = `<div class="loading">Próximamente habrá certificaciones acá.</div>`;
            return;
        }

        grid.innerHTML = certifications.map(c => `
            <div class="cert-card" onclick="openCertModal(${c.id})">
                ${c.image_url
                    ? `<img src="${c.image_url}" alt="${c.name}">`
                    : `<div class="cert-placeholder">🏆</div>`
                }
                <div class="cert-body">
                    <div class="cert-issuer">${c.issuer}</div>
                    <h3>${c.name}</h3>
                    <div class="cert-date">${formatDate(c.date)}</div>
                </div>
            </div>
        `).join('');

        window._certifications = certifications;

    } catch (err) {
        grid.innerHTML = `<div class="loading">Error al cargar las certificaciones.</div>`;
    }
}

// ── MODAL CERTIFICACIÓN ───────────────────────────────────────
function openCertModal(id) {
    const c = window._certifications.find(c => c.id === id);
    if (!c) return;

    const img = document.getElementById('certModalImage');
    const placeholder = document.getElementById('certModalPlaceholder');

    if (c.image_url) {
        img.src = c.image_url;
        img.alt = c.name;
        img.style.display = 'block';
        img.onclick = () => openLightbox(c.image_url, c.name);
        placeholder.style.display = 'none';
    } else {
        img.style.display = 'none';
        placeholder.style.display = 'flex';
    }

    document.getElementById('certModalIssuer').textContent = c.issuer;
    document.getElementById('certModalName').textContent = c.name;
    document.getElementById('certModalDate').textContent = formatDate(c.date);

    const link = document.getElementById('certModalLink');
    if (c.credential_url) {
        link.href = c.credential_url;
        link.style.display = 'inline-block';
    } else {
        link.style.display = 'none';
    }

    document.getElementById('certModalOverlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeCertModal() {
    document.getElementById('certModalOverlay').classList.remove('show');
    document.body.style.overflow = '';
}

// ── LIGHTBOX ──────────────────────────────────────────────────
function openLightbox(src, alt) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightboxImg').alt = alt;
    document.getElementById('lightboxOverlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightboxOverlay').classList.remove('show');
    document.body.style.overflow = '';
}

// ── CONTACTO ──────────────────────────────────────────────────
async function sendMessage() {
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !message) {
        showAlert('alertError', 'Por favor completá todos los campos');
        return;
    }

    try {
        const res = await fetch(`${API}/api/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message })
        });

        if (!res.ok) {
            showAlert('alertError', 'Error al enviar el mensaje');
            return;
        }

        document.getElementById('contactName').value = '';
        document.getElementById('contactEmail').value = '';
        document.getElementById('contactMessage').value = '';
        showAlert('alertSuccess', '¡Mensaje enviado! Te respondo a la brevedad.');

    } catch (err) {
        showAlert('alertError', 'Error al conectar con el servidor');
    }
}

// ── HELPERS ───────────────────────────────────────────────────
function showAlert(id, message) {
    const el = document.getElementById(id);
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 5000);
}

function formatDate(dateStr) {
    const [year, month] = dateStr.split('-');
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${months[parseInt(month) - 1]} ${year}`;
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    loadCertifications();

    document.getElementById('certModalOverlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('certModalOverlay')) closeCertModal();
    });

    document.getElementById('lightboxOverlay').addEventListener('click', (e) => {
        if (e.target !== document.getElementById('lightboxImg')) closeLightbox();
    });
});