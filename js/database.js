// ========== BASE DE DATOS TOTALBIZ 2.0 ==========

const DB_NAME = 'TotalBizDB';
const DB_VERSION = 6; // Incrementado para agregar store 'commission_settings'

// Tablas (stores)
const STORES = {
    PRODUCTS: 'products',
    SALES: 'sales',
    SELLERS: 'sellers',
    EXCHANGE_RATES: 'exchange_rates',
    PENDING_PAYMENTS: 'pending_payments',
    PAYMENT_METHODS: 'payment_methods',
    ACCESS_KEYS: 'access_keys',
    ACTIVE_SESSION: 'active_session',
    ADMIN_CREDENTIALS: 'admin_credentials',
    ACTIVE_SESSIONS: 'active_sessions',
    USERS: 'users',
    COMMISSION_SETTINGS: 'commission_settings'
};

let db = null;
let dbInitPromise = null; // Para evitar inicializaciones múltiples

// Función para eliminar la base de datos (si es necesario)
async function deleteDatabase() {
    return new Promise((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onsuccess = () => {
            console.log('Base de datos eliminada correctamente');
            resolve();
        };
        deleteRequest.onerror = (event) => {
            console.error('Error al eliminar la base de datos:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Inicializar base de datos (con singleton para evitar múltiples inicializaciones)
async function initDatabase() {
    // Si ya está inicializada y abierta, devolverla
    if (db && db.name === DB_NAME) {
        return db;
    }
    
    // Si ya hay una promesa de inicialización en curso, esperarla
    if (dbInitPromise) {
        return dbInitPromise;
    }

    const openDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = async (event) => {
                console.error('Error opening database:', event.target.error);
                if (event.target.error.name === 'VersionError') {
                    console.log('Versión incorrecta, eliminando base de datos antigua...');
                    try {
                        await deleteDatabase();
                        console.log('Base de datos eliminada, reintentando...');
                        const newDB = await openDB();
                        resolve(newDB);
                    } catch (err) {
                        reject('No se pudo eliminar la base de datos: ' + err);
                    }
                } else {
                    reject('No se pudo abrir la base de datos: ' + event.target.error);
                }
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                console.log('Database opened successfully, version:', DB_VERSION);
                resolve(db);
            };

            request.onupgradeneeded = async (event) => {
                const db = event.target.result;
                console.log('Upgrading database to version', DB_VERSION);

                const storesToCreate = [
                    STORES.PRODUCTS, STORES.SALES, STORES.SELLERS,
                    STORES.EXCHANGE_RATES, STORES.PENDING_PAYMENTS,
                    STORES.PAYMENT_METHODS, STORES.ACCESS_KEYS,
                    STORES.ACTIVE_SESSION, STORES.ADMIN_CREDENTIALS,
                    STORES.ACTIVE_SESSIONS, STORES.USERS,
                    STORES.COMMISSION_SETTINGS
                ];

                for (const storeName of storesToCreate) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        let store;
                        
                        if (storeName === STORES.PRODUCTS) {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('name', 'name', { unique: false });
                            store.createIndex('price', 'price', { unique: false });
                        } 
                        else if (storeName === STORES.SALES) {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('date', 'date', { unique: false });
                            store.createIndex('productId', 'productId', { unique: false });
                            store.createIndex('sellerCode', 'sellerCode', { unique: false });
                            store.createIndex('timestamp', 'timestamp', { unique: false });
                        } 
                        else if (storeName === STORES.SELLERS) {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('code', 'code', { unique: true });
                            store.createIndex('name', 'name', { unique: false });
                        } 
                        else if (storeName === STORES.EXCHANGE_RATES) {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('date', 'date', { unique: false });
                        } 
                        else if (storeName === STORES.PENDING_PAYMENTS) {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('sellerCode', 'sellerCode', { unique: false });
                            store.createIndex('paid', 'paid', { unique: false });
                            store.createIndex('date', 'date', { unique: false });
                        } 
                        else if (storeName === STORES.PAYMENT_METHODS) {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('updatedAt', 'updatedAt', { unique: false });
                        }
                        else if (storeName === STORES.ACCESS_KEYS) {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('key', 'key', { unique: true });
                            store.createIndex('expires_at', 'expires_at', { unique: false });
                        }
                        else if (storeName === STORES.ACTIVE_SESSION) {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                        }
                        else if (storeName === STORES.ADMIN_CREDENTIALS) {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                        }
                        else if (storeName === STORES.ACTIVE_SESSIONS) {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('userEmail', 'userEmail', { unique: false });
                        }
                        else if (storeName === STORES.USERS) {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('email', 'email', { unique: true });
                            store.createIndex('name', 'name', { unique: false });
                        }
                        else if (storeName === STORES.COMMISSION_SETTINGS) {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('updatedAt', 'updatedAt', { unique: false });
                        }
                        else {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                        }
                        console.log(`Store ${storeName} created`);
                    }
                }

                // Insertar datos iniciales - Tipo de cambio
                const exchangeStore = db.objectStoreNames.contains(STORES.EXCHANGE_RATES) 
                    ? event.target.transaction.objectStore(STORES.EXCHANGE_RATES) 
                    : null;
                if (exchangeStore && event.oldVersion < 1) {
                    exchangeStore.add({
                        rate: 320,
                        date: new Date().toISOString(),
                        description: 'Tipo de cambio inicial'
                    });
                    console.log('Tipo de cambio inicial creado: 320 CUP/USD');
                }

                // Insertar datos iniciales - Métodos de pago
                const paymentMethodsStore = db.objectStoreNames.contains(STORES.PAYMENT_METHODS)
                    ? event.target.transaction.objectStore(STORES.PAYMENT_METHODS)
                    : null;
                if (paymentMethodsStore && event.oldVersion < 1) {
                    paymentMethodsStore.add({
                        percentages: {
                            USD: 0,
                            CUP_Efectivo: 0,
                            CUP_Transferencia: 15,
                            MLC: 0,
                            PayPal: 20,
                            Zelle: 20,
                            TropiPay: 15
                        },
                        updatedAt: new Date().toISOString(),
                        updatedBy: 'Sistema',
                        description: 'Configuración inicial'
                    });
                    console.log('Configuración de métodos de pago inicial creada');
                }
                
                // Insertar datos iniciales - Comisión de gestores (5%)
                const commissionStore = db.objectStoreNames.contains(STORES.COMMISSION_SETTINGS)
                    ? event.target.transaction.objectStore(STORES.COMMISSION_SETTINGS)
                    : null;
                if (commissionStore) {
                    // Verificar si ya existe configuración
                    const existingSettings = await new Promise((resolve) => {
                        const getRequest = commissionStore.getAll();
                        getRequest.onsuccess = () => resolve(getRequest.result);
                        getRequest.onerror = () => resolve([]);
                    });
                    
                    if (existingSettings.length === 0) {
                        commissionStore.add({
                            percentage: 5,
                            updatedAt: new Date().toISOString(),
                            updatedBy: 'Sistema',
                            description: 'Comisión por defecto para gestores (5% del precio base en USD)'
                        });
                        console.log('Configuración de comisión creada: 5%');
                    } else {
                        console.log('Configuración de comisión ya existe, omitiendo creación');
                    }
                }
                
                // Crear usuario administrador por defecto (si no existe)
                const usersStore = db.objectStoreNames.contains(STORES.USERS)
                    ? event.target.transaction.objectStore(STORES.USERS)
                    : null;
                if (usersStore) {
                    const getUserRequest = usersStore.getAll();
                    getUserRequest.onsuccess = () => {
                        if (getUserRequest.result.length === 0) {
                            usersStore.add({
                                name: 'Administrador',
                                email: 'admin@totalbiz.com',
                                password: 'admin123',
                                createdAt: new Date().toISOString(),
                                role: 'admin'
                            });
                            console.log('Usuario administrador por defecto creado: admin@totalbiz.com / admin123');
                        } else {
                            console.log('Usuario administrador ya existe, omitiendo creación');
                        }
                    };
                }
            };
        });
    };

    try {
        dbInitPromise = openDB();
        db = await dbInitPromise;
        dbInitPromise = null;
        return db;
    } catch (error) {
        console.error('Fatal error initializing database:', error);
        dbInitPromise = null;
        throw new Error('No se pudo inicializar la base de datos. Recarga la página.');
    }
}

// Obtener configuración actual de comisión (con valor por defecto seguro)
async function getCommissionPercentage() {
    try {
        // Asegurar que la base de datos está inicializada
        await initDatabase();
        
        const settings = await getData(STORES.COMMISSION_SETTINGS);
        if (settings && settings.length > 0) {
            const latest = settings.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
            // Validar que el porcentaje sea un número válido
            const percentage = parseFloat(latest.percentage);
            if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
                return percentage;
            }
        }
    } catch (error) {
        console.error('Error getting commission percentage:', error);
    }
    return 5; // valor por defecto 5%
}

// Actualizar porcentaje de comisión
async function updateCommissionPercentage(percentage, updatedBy = 'Administrador') {
    // Validaciones
    const numPercentage = parseFloat(percentage);
    if (isNaN(numPercentage)) {
        throw new Error('El porcentaje debe ser un número válido');
    }
    if (numPercentage < 0 || numPercentage > 100) {
        throw new Error('El porcentaje debe estar entre 0 y 100');
    }
    
    // Asegurar que la base de datos está inicializada
    await initDatabase();
    
    const setting = {
        percentage: numPercentage,
        updatedAt: new Date().toISOString(),
        updatedBy: updatedBy,
        description: `Comisión actualizada al ${numPercentage}%`
    };
    
    const newId = await saveData(STORES.COMMISSION_SETTINGS, setting);
    console.log(`Comisión actualizada a ${numPercentage}% por ${updatedBy}, ID: ${newId}`);
    return setting;
}

// Función auxiliar para obtener datos
async function getData(storeName) {
    const database = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

async function getDataById(storeName, id) {
    const database = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveData(storeName, data) {
    const database = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateData(storeName, data) {
    const database = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteData(storeName, id) {
    const database = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => {
            console.log(`Registro con ID ${id} eliminado de ${storeName}`);
            resolve(true);
        };
        request.onerror = (event) => {
            console.error(`Error eliminando de ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

async function getCurrentExchangeRate() {
    try {
        await initDatabase();
        const rates = await getData(STORES.EXCHANGE_RATES);
        if (rates && rates.length > 0) {
            const latestRate = rates.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            return latestRate.rate;
        }
    } catch (error) {
        console.error('Error getting exchange rate:', error);
    }
    return 320;
}

async function getCurrentPaymentPercentages() {
    try {
        await initDatabase();
        const paymentMethods = await getData(STORES.PAYMENT_METHODS);
        if (paymentMethods && paymentMethods.length > 0) {
            const latestConfig = paymentMethods.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
            return latestConfig.percentages;
        }
    } catch (error) {
        console.error('Error getting payment percentages:', error);
    }
    return {
        USD: 0,
        CUP_Efectivo: 0,
        CUP_Transferencia: 15,
        MLC: 0,
        PayPal: 20,
        Zelle: 20,
        TropiPay: 15
    };
}

// Inicialización automática (sin bloquear)
initDatabase().catch(console.error);