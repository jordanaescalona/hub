// Ayudas de interfaz compartidas por las páginas del panel.

function escapeHtml(text) {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' });
}

// "2024-03-15" -> "Mar 2024"
function formatMonthYear(dateStr) {
    const [year, month] = dateStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[parseInt(month) - 1]} ${year}`;
}

// Crea (POST) o actualiza (PUT) un recurso. Devuelve true si salió bien.
async function saveResource(endpoint, id, data) {
    const res = await authFetch(id ? `${API}${endpoint}/${id}` : `${API}${endpoint}`, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(data)
    });
    if (!res.ok) alert('Error al guardar');
    return res.ok;
}

function openOverlay(id) { document.getElementById(id).classList.add('show'); }
function closeOverlay(id) { document.getElementById(id).classList.remove('show'); }

// El botón "Subir imagen" abre el <input type="file" id="fileInput"> oculto.
function uploadImage() {
    document.getElementById('fileInput').click();
}

// Sube la imagen elegida en un <input type="file"> y la pone en el campo indicado.
async function handleImageUpload(event, fieldId = 'fieldImageUrl') {
    const file = event.target.files[0];
    if (!file) return;
    try {
        const url = await uploadFile(file);
        document.getElementById(fieldId).value = url;
        document.getElementById(fieldId).dispatchEvent(new Event('input'));
    } catch (err) {
        alert('Error al subir la imagen');
    }
    event.target.value = '';
}

// ── MODAL ELIMINAR ────────────────────────────────────────────
// Cada página tiene un modal #deleteOverlay con un <strong id="deleteName">.
let pendingDelete = null;

function askDelete(name, endpoint, onDone) {
    pendingDelete = { endpoint, onDone };
    document.getElementById('deleteName').textContent = name;
    openOverlay('deleteOverlay');
}

function closeDelete() {
    closeOverlay('deleteOverlay');
    pendingDelete = null;
}

async function confirmDelete() {
    const { endpoint, onDone } = pendingDelete;
    const res = await authFetch(`${API}${endpoint}`, { method: 'DELETE' });
    if (!res.ok) alert('Error al eliminar');
    closeDelete();
    onDone();
}

// ── TECNOLOGÍAS ───────────────────────────────────────────────
let allTecnologias = [];
let selectedTechs = [];

async function loadTecnologias() {
    const res = await fetch(`${API}/api/technologies`);
    allTecnologias = await res.json();
}

// El ícono puede ser una clase de Font Awesome, una de Devicon o un emoji.
function renderTechIcon(t) {
    if (!t.icon) return '';
    if (t.icon.startsWith('fa')) return `<i class="${t.icon}"></i>`;
    if (t.icon.startsWith('devicon')) return `<i class="${t.icon} colored"></i>`;
    return t.icon;
}

function parseTechs(str) {
    return str ? str.split(',').map(t => t.trim()).filter(Boolean) : [];
}

function renderTechSelector(selected = selectedTechs) {
    selectedTechs = selected;
    document.getElementById('techSelector').innerHTML = allTecnologias.map((t, i) => {
        const isSelected = selectedTechs.includes(t.name);
        return `
            <label class="tech-option ${isSelected ? 'selected' : ''}">
                <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleTech(${i}, this.checked)">
                ${renderTechIcon(t)} ${t.name}
            </label>`;
    }).join('');
}

function toggleTech(index, checked) {
    const name = allTecnologias[index].name;
    selectedTechs = checked
        ? [...new Set([...selectedTechs, name])]
        : selectedTechs.filter(t => t !== name);
    renderTechSelector();
}
