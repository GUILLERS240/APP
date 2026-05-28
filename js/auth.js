// ========== CLAVE MAESTRA Y AUTENTICACIÓN BÁSICA ==========
const MASTER_KEY = 'ADMIN';

// ========== NUEVAS FUNCIONES PARA CLAVES DE ACCESO (REUTILIZABLES) ==========
async function validateAccessKey(accessKey) {
    try {
        const keys = await getData('access_keys');
        const keyEntry = keys.find(k => k.key === accessKey);
        if (!keyEntry) return { valid: false, reason: 'Clave no existe' };
        const now = new Date();
        const expireDate = new Date(keyEntry.expires_at);
        if (now > expireDate && keyEntry.duration_days !== 0) {
            return { valid: false, reason: 'Clave expirada' };
        }
        return { valid: true, keyEntry };
    } catch (error) {
        console.error('Error validando clave de acceso:', error);
        return { valid: false, reason: 'Error interno' };
    }
}

async function registerSession(accessKey, keyEntry) {
    try {
        const session = {
            access_key: accessKey,
            start_date: new Date().toISOString(),
            expiration_date: keyEntry.expires_at
        };
        await saveData('active_session', session);
        localStorage.setItem('activeSession', JSON.stringify(session));
    } catch (error) {
        console.error('Error registrando sesión:', error);
    }
}

async function checkActiveSession() {
    try {
        const sessions = await getData('active_session');
        if (sessions.length === 0) return false;
        const lastSession = sessions.sort((a,b) => new Date(b.start_date) - new Date(a.start_date))[0];
        const now = new Date();
        const expireDate = new Date(lastSession.expiration_date);
        if (now > expireDate) {
            await deleteData('active_session', lastSession.id);
            localStorage.removeItem('activeSession');
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error comprobando sesión activa:', error);
        return false;
    }
}

// ========== FUNCIONES ORIGINALES (MODIFICADAS) ==========
async function checkLogin(event) {
    event.preventDefault();
    const masterKeyInput = document.getElementById('masterKey');
    const accessKeyInput = document.getElementById('accessKey');
    const errorDiv = document.getElementById('errorMessage');

    if (masterKeyInput.value !== MASTER_KEY) {
        errorDiv.textContent = '❌ Clave maestra incorrecta.';
        errorDiv.classList.add('show');
        masterKeyInput.value = '';
        masterKeyInput.focus();
        setTimeout(() => errorDiv.classList.remove('show'), 3000);
        return;
    }

    const accessKey = accessKeyInput?.value.trim();
    if (!accessKey) {
        errorDiv.textContent = '❌ Debe ingresar una clave de acceso.';
        errorDiv.classList.add('show');
        setTimeout(() => errorDiv.classList.remove('show'), 3000);
        return;
    }

    const { valid, reason, keyEntry } = await validateAccessKey(accessKey);
    if (!valid) {
        errorDiv.textContent = `❌ Clave de acceso inválida: ${reason}`;
        errorDiv.classList.add('show');
        setTimeout(() => errorDiv.classList.remove('show'), 3000);
        return;
    }

    await registerSession(accessKey, keyEntry);
    sessionStorage.setItem('authenticated', 'true');
    sessionStorage.setItem('loginTime', new Date().toISOString());
    window.location.href = 'pages/dashboard.html';
}

function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('authenticated');
    if (!isAuthenticated || isAuthenticated !== 'true') {
        window.location.href = '../index.html';
        return false;
    }
    return true;
}

async function logout() {
    try {
        const sessions = await getData('active_session');
        for (const sess of sessions) {
            await deleteData('active_session', sess.id);
        }
    } catch (e) {}
    localStorage.removeItem('activeSession');
    sessionStorage.removeItem('authenticated');
    sessionStorage.removeItem('loginTime');
    window.location.href = '../index.html';
}

function checkSessionTimeout() {
    const loginTime = sessionStorage.getItem('loginTime');
    if (loginTime) {
        const elapsed = new Date() - new Date(loginTime);
        const hoursElapsed = elapsed / (1000 * 60 * 60);
        if (hoursElapsed > 8) logout();
    }
}

// Inicializar eventos
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', checkLogin);
}

// Inicialización de la BD (solo para crear clave de prueba si es necesario)
initDatabase().then(async () => {
    console.log('Base de datos inicializada correctamente');
    try {
        await insertTestKeyIfNeeded();
    } catch (e) {
        console.warn('No se pudo crear clave de prueba (posiblemente el store access_keys aún no existe)', e);
    }
}).catch(error => {
    console.error('Error al inicializar base de datos:', error);
});

async function insertTestKeyIfNeeded() {
    // Verificar que el store exista (accediendo a él)
    let keys = [];
    try {
        keys = await getData('access_keys');
    } catch (e) {
        console.warn('Store access_keys no disponible aún, se reintentará más tarde');
        return;
    }
    if (keys.length === 0) {
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        await saveData('access_keys', {
            key: 'PRUEBA123',
            duration_days: 7,
            expires_at: expires.toISOString()
        });
        console.log('🔑 Clave de prueba creada: PRUEBA123 (7 días, reutilizable)');
    }
}
// ========== VERIFICACIÓN DE EXPIRACIÓN DE SESIÓN ==========
// Obtener la sesión activa desde la base de datos
async function getActiveSession() {
    const sessions = await getData('active_session');
    if (sessions.length === 0) return null;
    // Obtener la sesión más reciente (por si hay múltiples)
    return sessions.sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];
}

// Verificar si la sesión actual ha expirado
async function isSessionExpired() {
    const session = await getActiveSession();
    if (!session) return true; // No hay sesión activa
    const now = new Date();
    const expireDate = new Date(session.expiration_date);
    return now > expireDate;
}

// Verificar y manejar expiración (redirige si es necesario)
async function checkSessionExpiration() {
    const expired = await isSessionExpired();
    if (expired) {
        // Limpiar sesión
        const session = await getActiveSession();
        if (session) await deleteData('active_session', session.id);
        sessionStorage.removeItem('authenticated');
        sessionStorage.removeItem('loginTime');
        localStorage.removeItem('activeSession');
        
        // Mostrar mensaje y redirigir
        alert('⏰ Su clave de acceso ha expirado. Debe ingresar una nueva clave para continuar.');
        window.location.href = '../index.html';
        return true;
    }
    return false;
}

// Modificar checkAuth para que también verifique expiración
async function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('authenticated');
    if (!isAuthenticated || isAuthenticated !== 'true') {
        window.location.href = '../index.html';
        return false;
    }
    // Verificar expiración
    const expired = await isSessionExpired();
    if (expired) {
        // Limpiar sesión
        const session = await getActiveSession();
        if (session) await deleteData('active_session', session.id);
        sessionStorage.removeItem('authenticated');
        sessionStorage.removeItem('loginTime');
        localStorage.removeItem('activeSession');
        alert('⏰ Su clave de acceso ha expirado. Debe ingresar una nueva clave para continuar.');
        window.location.href = '../index.html';
        return false;
    }
    return true;
}

// Iniciar el temporizador de verificación periódica (cada minuto)
function startExpirationChecker() {
    setInterval(async () => {
        if (window.location.pathname.includes('index.html')) return; // No verificar en login
        await checkSessionExpiration();
    }, 60000); // cada 60 segundos
}

// Verificar timeout de sesión cada minuto en páginas protegidas
if (window.location.pathname.includes('dashboard.html') || 
    window.location.pathname.includes('products.html') ||
    window.location.pathname.includes('sellers.html') ||
    window.location.pathname.includes('sales.html')) {
    setInterval(checkSessionTimeout, 60000);
}