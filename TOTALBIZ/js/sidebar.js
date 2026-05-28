// Control de la barra lateral
let sidebarCollapsed = false;

// Función para toggle de la barra lateral
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar && mainContent) {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        
        // Guardar estado en localStorage
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }
}

// Función para inicializar el estado de la barra lateral
function initSidebar() {
    const savedState = localStorage.getItem('sidebarCollapsed');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (savedState === 'true' && sidebar && mainContent) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
        sidebarCollapsed = true;
    }
}

// Función para volver atrás
function goBack() {
    window.history.back();
}

// Resaltar menú activo según la página actual
function highlightActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop();
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Función para móvil: toggle del menú
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
}

// Cerrar menú móvil al hacer clic fuera
function setupMobileMenuClose() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggleBtn');
    
    if (!sidebar || !menuToggle) return;
    
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
            }
        }
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    highlightActiveMenu();
    setupMobileMenuClose();
    
    // Botón toggle sidebar
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }
    
    // Botón toggle móvil
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Botón regreso
    const backBtn = document.getElementById('backButton');
    if (backBtn) {
        backBtn.addEventListener('click', goBack);
    }
});