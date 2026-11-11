/*
 * Dibuja las tarjetas de juegos dentro de cualquier contenedor con la clase "games-grid".
 * Necesita que antes se cargue juegos-data.js (la lista JUEGOS).
 *
 * El atributo data-base indica dónde está la carpeta /games respecto de la página:
 *   - desde blog/index.html       -> data-base="games/"
 *   - desde blog/games/index.html -> data-base=""
 * El atributo data-max (opcional) limita cuántos juegos se muestran.
 */
function tarjetaJuego(juego, base) {
    const contenido = `
        <span class="game-emoji">${juego.emoji}</span>
        <h3 class="game-title">${juego.titulo}</h3>
        <p class="game-desc">${juego.descripcion}</p>
        <span class="game-meta">${juego.materia}</span>
        <span class="game-play">${juego.listo ? 'Jugar →' : 'Próximamente'}</span>`;

    return juego.listo
        ? `<a class="game-card" href="${base}${juego.carpeta}/">${contenido}</a>`
        : `<div class="game-card game-card--soon">${contenido}</div>`;
}

document.querySelectorAll('.games-grid').forEach(grid => {
    const base = grid.dataset.base || '';
    const max = Number(grid.dataset.max) || JUEGOS.length;
    grid.innerHTML = JUEGOS.slice(0, max).map(j => tarjetaJuego(j, base)).join('');
});
