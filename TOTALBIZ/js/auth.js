// Clave maestra (única para acceso al sistema)
const MASTER_KEY = 'ADMIN';

// Verificar login
function checkLogin(event) {
    event.preventDefault();
    
    const masterKeyInput = document.getElementById('masterKey');
    const errorDiv = document.getElementById('errorMessage');
    
    if (masterKeyInput.value === MASTER_KEY) {
        // Login exitoso
        sessionStorage.setItem('authenticated', 'true');
        sessionStorage.setItem('loginTime', new Date().toISOString());
        window.location.href = 'pages/dashboard.html';
    } else {
        // Login fallido
        errorDiv.textContent = 'Clave incorrecta. Acceso denegado.';
        errorDiv.classList.add('show');
        masterKeyInput.value = '';
        masterKeyInput.focus();
        
        // Ocultar mensaje después de 3 segundos
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 3000);
    }
}

// Verificar si el usuario está autenticado (para páginas protegidas)
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('authenticated');
    if (!isAuthenticated || isAuthenticated !== 'true') {
        window.location.href = '../index.html';
        return false;
    }
    return true;
}

// Cerrar sesión
function logout() {
    sessionStorage.removeItem('authenticated');
    sessionStorage.removeItem('loginTime');
    window.location.href = '../index.html';
}

// Verificar tiempo de sesión (opcional: cerrar después de 8 horas)
function checkSessionTimeout() {
    const loginTime = sessionStorage.getItem('loginTime');
    if (loginTime) {
        const elapsed = new Date() - new Date(loginTime);
        const hoursElapsed = elapsed / (1000 * 60 * 60);
        if (hoursElapsed > 8) {
            logout();
        }
    }
}

// Inicializar eventos cuando el DOM esté listo
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', checkLogin);
}

// Inicializar la base de datos al cargar cualquier página
initDatabase().then(() => {
    console.log('Base de datos inicializada correctamente');
}).catch(error => {
    console.error('Error al inicializar base de datos:', error);
});

// Verificar timeout de sesión cada minuto
if (window.location.pathname.includes('dashboard.html') || 
    window.location.pathname.includes('products.html') ||
    window.location.pathname.includes('sellers.html') ||
    window.location.pathname.includes('sales.html')) {
    setInterval(checkSessionTimeout, 60000);
}