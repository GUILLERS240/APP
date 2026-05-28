// Configuración de la base de datos
const DB_NAME = 'POSSystemDB';
const DB_VERSION = 4;

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
    ADMIN_CREDENTIALS: 'admin_credentials'
};

let db = null;

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

// Inicializar base de datos
async function initDatabase() {
    // Si ya está abierta y es la correcta, devolverla
    if (db && db.name === DB_NAME) {
        return db;
    }

    // Intentar abrir la base de datos
    const openDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = async (event) => {
                console.error('Error opening database:', event.target.error);
                // Si el error es por versión, eliminamos y recreamos
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
                console.log('Database opened successfully');
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('Upgrading database to version', DB_VERSION);

                // Crear stores si no existen
                for (const [key, storeName] of Object.entries(STORES)) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        let store;
                        if (key === 'ACCESS_KEYS') {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('key', 'key', { unique: true });
                            store.createIndex('expires_at', 'expires_at', { unique: false });
                        } else if (key === 'PRODUCTS') {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('name', 'name', { unique: false });
                            store.createIndex('price', 'price', { unique: false });
                        } else if (key === 'SALES') {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('date', 'date', { unique: false });
                            store.createIndex('productId', 'productId', { unique: false });
                            store.createIndex('sellerCode', 'sellerCode', { unique: false });
                            store.createIndex('timestamp', 'timestamp', { unique: false });
                        } else if (key === 'SELLERS') {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('code', 'code', { unique: true });
                            store.createIndex('name', 'name', { unique: false });
                        } else if (key === 'EXCHANGE_RATES') {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('date', 'date', { unique: false });
                        } else if (key === 'PENDING_PAYMENTS') {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('sellerCode', 'sellerCode', { unique: false });
                            store.createIndex('paid', 'paid', { unique: false });
                            store.createIndex('date', 'date', { unique: false });
                        } else if (key === 'PAYMENT_METHODS') {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('updatedAt', 'updatedAt', { unique: false });
                        } else {
                            store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                        }
                        console.log(`Store ${storeName} created`);
                    }
                }

                // Insertar datos iniciales si es necesario
                const exchangeStore = db.objectStoreNames.contains(STORES.EXCHANGE_RATES) 
                    ? event.target.transaction.objectStore(STORES.EXCHANGE_RATES) 
                    : null;
                if (exchangeStore && event.oldVersion < 1) {
                    exchangeStore.add({
                        rate: 320,
                        date: new Date().toISOString(),
                        description: 'Tipo de cambio inicial'
                    });
                }

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
                }
            };
        });
    };

    try {
        db = await openDB();
        return db;
    } catch (error) {
        console.error('Fatal error initializing database:', error);
        throw new Error('No se pudo inicializar la base de datos. Recarga la página.');
    }
}

// Función auxiliar para obtener datos
async function getData(storeName) {
    const database = await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Función auxiliar para guardar datos
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

// Función auxiliar para actualizar datos
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

// Función auxiliar para eliminar datos
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

// Funciones auxiliares existentes (tipo de cambio, porcentajes)
async function getCurrentExchangeRate() {
    try {
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