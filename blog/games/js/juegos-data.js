/*
 * Lista de juegos del blog.
 * La usan la portada de juegos (games/index.html) y el apartado Juegos del blog (index.html).
 *
 * Para sumar un juego:
 *   1. Creá su carpeta dentro de /games (por ejemplo games/mi-juego/ con su index.html, css/ y js/).
 *   2. Agregá un objeto a esta lista con "carpeta" igual al nombre de esa carpeta.
 *      "materiaSlug" es el slug de la materia en el blog (el de materia.html?slug=...);
 *      si se completa, la etiqueta de la materia lleva a su página.
 *   Con listo: false aparece como "Próximamente" y no se puede abrir.
 */
const JUEGOS = [
    {
        carpeta: 'detective-de-datos',
        emoji: '🕵️',
        titulo: 'Detective de Datos',
        descripcion: 'Resolvé 13 casos investigando datos: medidas de resumen, correlación, regresión, distribuciones, intervalos y pruebas de hipótesis.',
        materia: 'Probabilidad y Estadística',
        materiaSlug: 'pye',
        listo: true
    }
];
