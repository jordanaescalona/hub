/*
 * Dibuja las tarjetas de juegos dentro de cualquier contenedor con la clase "games-grid".
 * Necesita que antes se cargue juegos-data.js (la lista JUEGOS).
 *
 * El atributo data-base indica dónde está la carpeta /games respecto de la página
 * y data-blog dónde está la raíz del blog (para enlazar a la materia):
 *   - desde blog/index.html       -> data-base="games/" data-blog=""
 *   - desde blog/games/index.html -> data-base=""       data-blog="../"
 * El atributo data-max (opcional) limita cuántos juegos se muestran.
 */
function tarjetaJuego(juego, base, blog) {
    const materia = juego.materiaSlug
        ? `<a class="game-materia" href="${blog}materia.html?slug=${juego.materiaSlug}">📘 ${juego.materia}</a>`
        : `<span class="game-materia">📘 ${juego.materia}</span>`;

    // "Jugar →" es el enlace al juego; con CSS cubre toda la tarjeta.
    const jugar = juego.listo
        ? `<a class="game-play" href="${base}${juego.carpeta}/">Jugar →</a>`
        : `<span class="game-play">Próximamente</span>`;

    return `
        <div class="game-card ${juego.listo ? '' : 'game-card--soon'}">
            <span class="game-emoji">${juego.emoji}</span>
            ${materia}
            <h3 class="game-title">${juego.titulo}</h3>
            <p class="game-desc">${juego.descripcion}</p>
            ${jugar}
        </div>`;
}

document.querySelectorAll('.games-grid').forEach(grid => {
    const base = grid.dataset.base || '';
    const blog = grid.dataset.blog || '';
    const max = Number(grid.dataset.max) || JUEGOS.length;
    grid.innerHTML = JUEGOS.slice(0, max).map(j => tarjetaJuego(j, base, blog)).join('');
});
