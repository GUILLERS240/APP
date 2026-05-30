// ========== ADMINISTRACIÓN DE CLAVES DE ACCESO ==========
console.log("admin-keys.js cargado");

// Generador aleatorio de cadenas
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Crear o recuperar credenciales de administrador
async function getOrCreateAdminCredentials() {
    try {
        const credsStore = await getData('admin_credentials');
        if (credsStore && credsStore.length > 0) {
            return credsStore[0];
        } else {
            const username = generateRandomString(6);
            const password = generateRandomString(10);
            const newCreds = { username, password, created_at: new Date().toISOString() };
            await saveData('admin_credentials', newCreds);
            console.log(`🔐 CREDENCIALES DE ADMINISTRADOR:\nUsuario: ${username}\nContraseña: ${password}`);
            alert(`🔐 CREDENCIALES DE ADMINISTRADOR (guárdelas):\n\nUsuario: ${username}\nContraseña: ${password}\n\nSe muestran solo una vez.`);
            return newCreds;
        }
    } catch (err) {
        console.error("Error al obtener/crear credenciales:", err);
        return null;
    }
}

// Validar credenciales
async function validateAdminCredentials(username, password) {
    const creds = await getOrCreateAdminCredentials();
    return creds && creds.username === username && creds.password === password;
}

// Generar clave aleatoria (12 caracteres)
function generateRandomKey() {
    return generateRandomString(12);
}

function getExpirationDate(days) {
    if (days === 0) return null;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
}

async function saveNewKey(key, durationDays, expiresAt) {
    const keyData = {
        key: key,
        duration_days: durationDays,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
    };
    await saveData('access_keys', keyData);
}

async function loadKeysList() {
    const container = document.getElementById('keysList');
    if (!container) return;
    const keys = await getData('access_keys');
    if (!keys || keys.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay claves generadas aún.</div>';
        return;
    }
    keys.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    let html = '';
    for (const k of keys) {
        const isExpired = k.expires_at ? new Date() > new Date(k.expires_at) : false;
        const status = isExpired ? '🔴 Expirada' : (k.expires_at ? '🟢 Vigente' : '♾️ Ilimitada');
        const expireDate = k.expires_at ? new Date(k.expires_at).toLocaleDateString() : 'Nunca';
        html += `
            <div class="key-card">
                <div>
                    <div class="key-code">${k.key}</div>
                    <div class="key-info">
                        Duración: ${k.duration_days === 0 ? 'Ilimitado' : k.duration_days + ' días'} | 
                        Expira: ${expireDate} | 
                        Estado: ${status}
                    </div>
                </div>
                <button class="btn-danger btn-small" data-id="${k.id}">🗑️ Eliminar</button>
            </div>
        `;
    }
    container.innerHTML = html;
    document.querySelectorAll('.btn-small[data-id]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            if (confirm('¿Eliminar esta clave permanentemente?')) {
                await deleteData('access_keys', id);
                loadKeysList();
            }
        });
    });
}

async function generateNewKey() {
    const durationSelect = document.getElementById('durationSelect');
    if (!durationSelect) return;
    const days = parseInt(durationSelect.value);
    const newKey = generateRandomKey();
    const expiresAt = getExpirationDate(days);
    const existing = await getData('access_keys');
    if (existing.some(k => k.key === newKey)) {
        return generateNewKey(); // colisión casi imposible
    }
    await saveNewKey(newKey, days, expiresAt);
    alert(`✅ Clave generada: ${newKey}\nDuración: ${days === 0 ? 'Ilimitado' : days + ' días'}`);
    loadKeysList();
}

// Cambiar credenciales de administrador
async function changeAdminCredentials(currentUser, currentPass, newUser, newPass) {
    if (!currentUser || !currentPass || !newUser || !newPass) {
        return { success: false, message: 'Todos los campos son obligatorios.' };
    }
    if (newUser.length < 3) {
        return { success: false, message: 'El nuevo usuario debe tener al menos 3 caracteres.' };
    }
    if (newPass.length < 4) {
        return { success: false, message: 'La nueva contraseña debe tener al menos 4 caracteres.' };
    }

    const creds = await getData('admin_credentials');
    if (!creds || creds.length === 0) {
        return { success: false, message: 'No hay credenciales registradas. Contacte al administrador.' };
    }
    const currentCreds = creds[0];

    if (currentCreds.username !== currentUser || currentCreds.password !== currentPass) {
        return { success: false, message: 'Usuario o contraseña actual incorrectos.' };
    }

    currentCreds.username = newUser;
    currentCreds.password = newPass;
    currentCreds.updated_at = new Date().toISOString();
    await updateData('admin_credentials', currentCreds);
    return { success: true, message: 'Credenciales actualizadas correctamente.' };
}

// Inicializar eventos del formulario de cambio de credenciales
function initChangeCredentialsForm() {
    const changeBtn = document.getElementById('changeCredsBtn');
    if (!changeBtn) return;

    changeBtn.addEventListener('click', async () => {
        const currentUser = document.getElementById('currentUser').value.trim();
        const currentPass = document.getElementById('currentPass').value.trim();
        const newUser = document.getElementById('newUser').value.trim();
        const newPass = document.getElementById('newPass').value.trim();
        const msgDiv = document.getElementById('changeCredsMessage');

        const result = await changeAdminCredentials(currentUser, currentPass, newUser, newPass);
        msgDiv.textContent = result.message;
        msgDiv.style.display = 'block';
        msgDiv.className = result.success ? 'success-message' : 'error-message';
        if (result.success) {
            document.getElementById('currentUser').value = '';
            document.getElementById('currentPass').value = '';
            document.getElementById('newUser').value = '';
            document.getElementById('newPass').value = '';
        }
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 3000);
    });
}

// Inicialización: esperar a que el DOM y la base de datos estén listos
async function initAdminPanel() {
    console.log("Inicializando admin panel...");
    await initDatabase();
    console.log("Base de datos lista");

    const authPanel = document.getElementById('authPanel');
    const adminPanel = document.getElementById('adminPanel');
    const authError = document.getElementById('authError');
    const authBtn = document.getElementById('authAdminBtn');
    const userInput = document.getElementById('adminUserInput');
    const passInput = document.getElementById('adminPassInput');

    if (!authBtn) {
        console.error("No se encontró el botón de autenticación. ¿El HTML tiene el id correcto?");
        return;
    }

    authBtn.addEventListener('click', async () => {
        const username = userInput.value.trim();
        const password = passInput.value.trim();
        if (!username || !password) {
            authError.textContent = '❌ Complete ambos campos';
            authError.classList.add('show');
            setTimeout(() => authError.classList.remove('show'), 2000);
            return;
        }
        const valid = await validateAdminCredentials(username, password);
        if (valid) {
            authPanel.style.display = 'none';
            adminPanel.style.display = 'block';
            loadKeysList();
            initChangeCredentialsForm(); // Activar formulario de cambio de credenciales
        } else {
            authError.textContent = '❌ Usuario o contraseña incorrectos';
            authError.classList.add('show');
            setTimeout(() => authError.classList.remove('show'), 2000);
        }
    });

    const generateBtn = document.getElementById('generateKeyBtn');
    if (generateBtn) generateBtn.addEventListener('click', generateNewKey);
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPanel);
} else {
    initAdminPanel();
}