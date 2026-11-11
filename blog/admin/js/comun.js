// Ayudas de interfaz compartidas por las páginas del panel.

const PERIODS = {
    '1c1': '1° Año - 1° Cuatrimestre',
    '1c2': '1° Año - 2° Cuatrimestre',
    '2c1': '2° Año - 1° Cuatrimestre',
    '2c2': '2° Año - 2° Cuatrimestre'
};

function escapeHtml(text) {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

// Completa el slug a partir del nombre mientras se crea un elemento nuevo.
function autoSlug(nameId, slugId, isEditing) {
    document.getElementById(nameId).addEventListener('input', function () {
        if (!isEditing()) document.getElementById(slugId).value = slugify(this.value);
    });
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function materiaOptions(materias) {
    return materias.map(m => `<option value="${m.id}">${m.name} — ${PERIODS[m.period] || m.period}</option>`).join('');
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

// ── MODAL ELIMINAR ────────────────────────────────────────────
// Cada página tiene un modal #deleteOverlay con un <strong id="deleteName">
// y, si hay más de un tipo de elemento para eliminar, un título #deleteTitle.
let pendingDelete = null;

function askDelete(name, endpoint, onDone, title) {
    pendingDelete = { endpoint, onDone };
    document.getElementById('deleteName').textContent = name;
    if (title) document.getElementById('deleteTitle').textContent = title;
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
