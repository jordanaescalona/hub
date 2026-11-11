let allTechnologies = [];
let allCertifications = [];

async function loadTechnologies() {
    try {
        const res = await fetch(`${API}/api/technologies`);
        allTechnologies = await res.json();
    } catch (err) {
        allTechnologies = [];
    }
}

function renderTechTags(technologiesStr) {
    if (!technologiesStr) return '';
    return technologiesStr.split(',').map(techName => {
        const t = allTechnologies.find(t => t.name.trim() === techName.trim());
        let icon = '';
        if (t && t.icon) {
            if (t.icon.startsWith('fa')) icon = `<i class="${t.icon}"></i> `;
            else if (t.icon.startsWith('devicon')) icon = `<i class="${t.icon} colored"></i> `;
            else icon = t.icon + ' ';
        }
        return `<span class="tech-tag-p">${icon}${techName.trim()}</span>`;
    }).join('');
}

// ── PROYECTOS ─────────────────────────────────────────────────
async function loadProjects() {
    const grid = document.getElementById('projectsGridP');
    if (!grid) return;
    try {
        const res = await fetch(`${API}/api/projects`);
        const projects = await res.json();
        if (projects.length === 0) {
            grid.innerHTML = `<div class="loading-p">Próximamente habrá proyectos acá.</div>`;
            return;
        }
        grid.innerHTML = projects.map(p => `
            <div class="project-card-p">
                ${p.image_url
                    ? `<img src="${p.image_url}" alt="${p.title}">`
                    : `<div class="project-placeholder-p">💻</div>`
                }
                <div class="project-body-p">
                    ${p.featured ? `<span class="featured-badge-p">⭐ Destacado</span>` : ''}
                    <h3>${p.title}</h3>
                    <p>${p.description}</p>
                    <div class="tech-tags-p">
                        ${renderTechTags(p.technologies)}
                    </div>
                    <div class="project-links-p">
                        ${p.repo_url ? `<a href="${p.repo_url}" target="_blank" class="project-link-p">→ Repositorio</a>` : ''}
                        ${p.demo_url ? `<a href="${p.demo_url}" target="_blank" class="project-link-p">→ Ver demo</a>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        grid.innerHTML = `<div class="loading-p">Error al cargar los proyectos.</div>`;
    }
}

// ── CERTIFICACIONES ───────────────────────────────────────────
async function loadCertifications() {
    const grid = document.getElementById('certGrid');
    if (!grid) return;
    try {
        const res = await fetch(`${API}/api/certifications`);
        allCertifications = await res.json();
        if (allCertifications.length === 0) {
            grid.innerHTML = `<div class="loading-p">Próximamente habrá certificaciones acá.</div>`;
            return;
        }
        grid.innerHTML = allCertifications.map(c => `
            <div class="cert-card-p" onclick="openCertModal(${c.id})">
                ${c.image_url
                    ? `<img src="${c.image_url}" alt="${c.name}">`
                    : `<div class="cert-placeholder-p">🏆</div>`
                }
                <div class="cert-body-p">
                    <div class="cert-issuer-p">${c.issuer}</div>
                    <h3>${c.name}</h3>
                    <div class="cert-date-p">${formatDate(c.date)}</div>
                    ${c.technologies ? `<div class="tech-tags-p" style="margin-top:0.5rem">${renderTechTags(c.technologies)}</div>` : ''}
                </div>
            </div>
        `).join('');
    } catch (err) {
        grid.innerHTML = `<div class="loading-p">Error al cargar las certificaciones.</div>`;
    }
}

// ── MODAL CERTIFICACIÓN ───────────────────────────────────────
function openCertModal(id) {
    const c = allCertifications.find(c => c.id === id);
    if (!c) return;
    const img = document.getElementById('certModalImage');
    const placeholder = document.getElementById('certModalPlaceholder');
    if (c.image_url) {
        img.src = c.image_url;
        img.alt = c.name;
        img.style.display = 'block';
        img.style.cursor = 'zoom-in';
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
        showAlertP('alertError', 'Por favor completá todos los campos');
        return;
    }
    try {
        const res = await fetch(`${API}/api/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message })
        });
        if (!res.ok) { showAlertP('alertError', 'Error al enviar el mensaje'); return; }
        document.getElementById('contactName').value = '';
        document.getElementById('contactEmail').value = '';
        document.getElementById('contactMessage').value = '';
        showAlertP('alertSuccess', '¡Mensaje enviado! Te respondo a la brevedad.');
    } catch (err) {
        showAlertP('alertError', 'Error al conectar con el servidor');
    }
}

// ── HELPERS ───────────────────────────────────────────────────
function showAlertP(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 5000);
}

function formatDate(dateStr) {
    const [year, month] = dateStr.split('-');
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${months[parseInt(month) - 1]} ${year}`;
}

// ── MENÚ HAMBURGUESA ──────────────────────────────────────────
function toggleMenu() {
    document.getElementById('pNavbar').classList.toggle('open');
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadTechnologies();
    loadProjects();
    loadCertifications();

    const certModalOverlay = document.getElementById('certModalOverlay');
    if (certModalOverlay) {
        certModalOverlay.addEventListener('click', (e) => {
            if (e.target === certModalOverlay) closeCertModal();
        });
    }
    const lightboxOverlay = document.getElementById('lightboxOverlay');
    if (lightboxOverlay) {
        lightboxOverlay.addEventListener('click', (e) => {
            if (e.target !== document.getElementById('lightboxImg')) closeLightbox();
        });
    }
});