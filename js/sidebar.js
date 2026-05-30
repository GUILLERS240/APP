// ========== SISTEMA DE NAVEGACIÓN TOTALBIZ 2.0 ==========
// Menú superior en PC, menú inferior en móvil

// Configuración de navegación (SIN Admin Claves)
const navItems = [
    { path: 'dashboard.html', icon: '📊', label: 'Dashboard' },
    { path: 'products.html', icon: '📦', label: 'Productos' },
    { path: 'sellers.html', icon: '👥', label: 'Gestores' },
    { path: 'sales.html', icon: '💰', label: 'Ventas' },
    { path: 'reports.html', icon: '📊', label: 'Reportes' },
    { path: 'exchange.html', icon: '💱', label: 'Cambio' },
    { path: 'payment-methods.html', icon: '💳', label: 'Pagos' },
    { path: 'guide.html', icon: '❓', label: 'Guía' }
];

// Generar menú superior
function generateTopMenu() {
    const currentPage = window.location.pathname.split('/').pop();
    const menuContainer = document.getElementById('topNavMenu');
    if (!menuContainer) return;
    
    menuContainer.innerHTML = navItems.map(item => `
        <a href="${item.path}" class="nav-item ${currentPage === item.path ? 'active' : ''}">
            <span>${item.icon}</span>
            <span>${item.label}</span>
        </a>
    `).join('');
}

// Generar menú inferior (móvil)
function generateBottomMenu() {
    const currentPage = window.location.pathname.split('/').pop();
    const menuContainer = document.getElementById('bottomNavMenu');
    if (!menuContainer) return;
    
    menuContainer.innerHTML = navItems.map(item => `
        <a href="${item.path}" class="bottom-nav-item ${currentPage === item.path ? 'active' : ''}">
            <span>${item.icon}</span>
            <span>${item.label}</span>
        </a>
    `).join('');
}

// Cerrar sesión
function logout() {
    if (typeof window.logout === 'function') {
        window.logout();
    } else {
        sessionStorage.removeItem('authenticated');
        sessionStorage.removeItem('userEmail');
        sessionStorage.removeItem('userName');
        window.location.href = '../index.html';
    }
}

// Volver atrás
function goBack() {
    window.history.back();
}

// Inicializar navegación
function initNavigation() {
    generateTopMenu();
    generateBottomMenu();
    
    // Configurar botón de logout en ambas barras si existen
    const logoutTop = document.getElementById('logoutTopBtn');
    const logoutBottom = document.getElementById('logoutBottomBtn');
    
    if (logoutTop) logoutTop.addEventListener('click', logout);
    if (logoutBottom) logoutBottom.addEventListener('click', logout);
    
    // Botón de regreso si existe
    const backBtn = document.getElementById('backButton');
    if (backBtn) backBtn.addEventListener('click', goBack);
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    initNavigation();
}