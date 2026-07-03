const API = 'https://hub-api.jordana-escalona.workers.dev';

// Navbar scroll — solo si existe
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.p-navbar');
    if (!navbar) return;
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.3)';
    } else {
        navbar.style.boxShadow = 'none';
    }
});
