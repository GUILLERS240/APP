// ========== SISTEMA DE AUTENTICACIÓN TOTALBIZ 2.0 ==========
// Registro e inicio de sesión con email/contraseña

// ========== FUNCIONES DE USUARIO ==========

// Registrar nuevo usuario
async function registerNewUser(name, email, password) {
    try {
        // Validar que la base de datos esté lista
        if (typeof getData === 'undefined' || typeof saveData === 'undefined') {
            return { success: false, message: 'Base de datos no disponible. Recargue la página.' };
        }
        
        // Obtener usuarios existentes
        let users = [];
        try {
            users = await getData('users');
        } catch (e) {
            console.log('Store users no existe aún, se creará al guardar');
            users = [];
        }
        
        // Verificar si el email ya está registrado
        const emailExists = users.some(user => user.email === email);
        if (emailExists) {
            return { success: false, message: 'Este correo ya está registrado.' };
        }
        
        // Crear nuevo usuario
        const newUser = {
            name: name,
            email: email,
            password: password, // En una versión real se debería hashear
            createdAt: new Date().toISOString(),
            role: 'user' // 'admin' se puede asignar manualmente si es necesario
        };
        
        const userId = await saveData('users', newUser);
        console.log('Usuario registrado exitosamente con ID:', userId);
        
        return { success: true, message: 'Registro exitoso. Ahora puede iniciar sesión.' };
        
    } catch (error) {
        console.error('Error en registerNewUser:', error);
        return { success: false, message: 'Error al registrar usuario: ' + error.message };
    }
}

// Iniciar sesión
async function loginUser(email, password) {
    try {
        if (typeof getData === 'undefined') {
            return { success: false, message: 'Base de datos no disponible. Recargue la página.' };
        }
        
        // Obtener usuarios
        let users = [];
        try {
            users = await getData('users');
        } catch (e) {
            console.log('Store users no existe aún');
            users = [];
        }
        
        // Buscar usuario por email
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return { success: false, message: 'Usuario no encontrado.' };
        }
        
        if (user.password !== password) {
            return { success: false, message: 'Contraseña incorrecta.' };
        }
        
        // Guardar sesión activa
        const session = {
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
            loginTime: new Date().toISOString()
        };
        
        // Limpiar sesiones anteriores del mismo usuario
        const existingSessions = await getData('active_sessions');
        for (const sess of existingSessions) {
            if (sess.userId === user.id) {
                await deleteData('active_sessions', sess.id);
            }
        }
        
        await saveData('active_sessions', session);
        localStorage.setItem('activeSession', JSON.stringify(session));
        
        return { 
            success: true, 
            message: 'Login exitoso',
            userName: user.name,
            userId: user.id
        };
        
    } catch (error) {
        console.error('Error en loginUser:', error);
        return { success: false, message: 'Error al iniciar sesión: ' + error.message };
    }
}

// Verificar autenticación en páginas protegidas
async function checkAuth() {
    // Primero verificar sessionStorage (rápido)
    const isAuthenticated = sessionStorage.getItem('authenticated');
    const userEmail = sessionStorage.getItem('userEmail');
    
    if (!isAuthenticated || isAuthenticated !== 'true') {
        window.location.href = '../index.html';
        return false;
    }
    
    // Verificar que la sesión en la base de datos aún sea válida
    try {
        const sessions = await getData('active_sessions');
        const currentSession = sessions.find(s => s.userEmail === userEmail);
        
        if (!currentSession) {
            // Sesión expirada o eliminada
            sessionStorage.removeItem('authenticated');
            sessionStorage.removeItem('userEmail');
            sessionStorage.removeItem('userName');
            window.location.href = '../index.html';
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('Error verificando sesión:', error);
        // Si hay error, asumimos que no está autenticado
        window.location.href = '../index.html';
        return false;
    }
}

// Cerrar sesión
async function logout() {
    try {
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
            const sessions = await getData('active_sessions');
            for (const sess of sessions) {
                if (sess.userEmail === userEmail) {
                    await deleteData('active_sessions', sess.id);
                }
            }
        }
    } catch (e) {
        console.error('Error al cerrar sesión:', e);
    }
    
    sessionStorage.removeItem('authenticated');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userName');
    localStorage.removeItem('activeSession');
    window.location.href = '../index.html';
}

// Obtener usuario actual
async function getCurrentUser() {
    const userEmail = sessionStorage.getItem('userEmail');
    if (!userEmail) return null;
    
    try {
        const users = await getData('users');
        return users.find(u => u.email === userEmail);
    } catch (error) {
        console.error('Error obteniendo usuario actual:', error);
        return null;
    }
}

// Verificar si hay sesión activa (para mantener login al recargar)
async function restoreSession() {
    const savedSession = localStorage.getItem('activeSession');
    if (!savedSession) return false;
    
    try {
        const session = JSON.parse(savedSession);
        const sessions = await getData('active_sessions');
        const validSession = sessions.find(s => s.userEmail === session.userEmail);
        
        if (validSession) {
            sessionStorage.setItem('authenticated', 'true');
            sessionStorage.setItem('userEmail', validSession.userEmail);
            sessionStorage.setItem('userName', validSession.userName);
            return true;
        }
    } catch (error) {
        console.error('Error restaurando sesión:', error);
    }
    
    return false;
}

// Inicializar verificación de sesión al cargar páginas protegidas
if (window.location.pathname.includes('pages/')) {
    // Esperar a que database.js cargue
    setTimeout(async () => {
        if (typeof getData !== 'undefined') {
            await restoreSession();
        }
    }, 100);
}

// Verificar expiración de sesión cada minuto
if (window.location.pathname.includes('dashboard.html') || 
    window.location.pathname.includes('products.html') ||
    window.location.pathname.includes('sellers.html') ||
    window.location.pathname.includes('sales.html') ||
    window.location.pathname.includes('reports.html') ||
    window.location.pathname.includes('exchange.html') ||
    window.location.pathname.includes('payment-methods.html') ||
    window.location.pathname.includes('guide.html')) {
    
    setInterval(async () => {
        const authenticated = sessionStorage.getItem('authenticated');
        if (authenticated === 'true') {
            const isValid = await checkAuth();
            if (!isValid) {
                alert('⏰ Su sesión ha expirado. Por favor inicie sesión nuevamente.');
            }
        }
    }, 60000); // cada minuto
}