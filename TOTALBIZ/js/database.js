// Configuración de la base de datos
const DB_NAME = 'POSSystemDB';
const DB_VERSION = 2; // Actualizado a versión 2 para nuevos stores

// Tablas (stores)
const STORES = {
    PRODUCTS: 'products',
    SALES: 'sales',
    SELLERS: 'sellers',
    EXCHANGE_RATES: 'exchange_rates',
    PENDING_PAYMENTS: 'pending_payments',
    PAYMENT_METHODS: 'payment_methods'  // Nuevo store para métodos de pago
};

let db = null;

// Inicializar base de datos
function initDatabase() {
    return new Promise((resolve, reject) => {
        if (db && db.name === DB_NAME) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = function(event) {
            console.error('Error opening database:', event.target.error);
            reject('No se pudo abrir la base de datos');
        };

        request.onsuccess = function(event) {
            db = event.target.result;
            console.log('Database opened successfully');
            resolve(db);
        };

        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            
            // Crear store de productos
            if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
                const productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id', autoIncrement: true });
                productStore.createIndex('name', 'name', { unique: false });
                productStore.createIndex('price', 'price', { unique: false });
                console.log('Products store created');
            }

            // Crear store de ventas
            if (!db.objectStoreNames.contains(STORES.SALES)) {
                const saleStore = db.createObjectStore(STORES.SALES, { keyPath: 'id', autoIncrement: true });
                saleStore.createIndex('date', 'date', { unique: false });
                saleStore.createIndex('productId', 'productId', { unique: false });
                saleStore.createIndex('sellerCode', 'sellerCode', { unique: false });
                saleStore.createIndex('timestamp', 'timestamp', { unique: false });
                console.log('Sales store created');
            }

            // Crear store de gestores
            if (!db.objectStoreNames.contains(STORES.SELLERS)) {
                const sellerStore = db.createObjectStore(STORES.SELLERS, { keyPath: 'id', autoIncrement: true });
                sellerStore.createIndex('code', 'code', { unique: true });
                sellerStore.createIndex('name', 'name', { unique: false });
                console.log('Sellers store created');
            }

            // Crear store de tasas de cambio
            if (!db.objectStoreNames.contains(STORES.EXCHANGE_RATES)) {
                const exchangeStore = db.createObjectStore(STORES.EXCHANGE_RATES, { keyPath: 'id', autoIncrement: true });
                exchangeStore.createIndex('date', 'date', { unique: false });
                console.log('Exchange rates store created');
                
                // Insertar valor inicial de cambio (1 USD = 320 CUP)
                exchangeStore.add({
                    rate: 320,
                    date: new Date().toISOString(),
                    description: 'Tipo de cambio inicial'
                });
            }

            // Crear store de pagos pendientes
            if (!db.objectStoreNames.contains(STORES.PENDING_PAYMENTS)) {
                const paymentStore = db.createObjectStore(STORES.PENDING_PAYMENTS, { keyPath: 'id', autoIncrement: true });
                paymentStore.createIndex('sellerCode', 'sellerCode', { unique: false });
                paymentStore.createIndex('paid', 'paid', { unique: false });
                paymentStore.createIndex('date', 'date', { unique: false });
                console.log('Pending payments store created');
            }

            // Crear store de métodos de pago (NUEVO)
            if (!db.objectStoreNames.contains(STORES.PAYMENT_METHODS)) {
                const paymentMethodsStore = db.createObjectStore(STORES.PAYMENT_METHODS, { keyPath: 'id', autoIncrement: true });
                paymentMethodsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                console.log('Payment methods store created');
                
                // Insertar valores por defecto
                const defaultPercentages = {
                    USD: 0,
                    CUP_Efectivo: 0,
                    CUP_Transferencia: 15,
                    MLC: 0,
                    PayPal: 20,
                    Zelle: 20,
                    TropiPay: 15
                };
                
                paymentMethodsStore.add({
                    percentages: defaultPercentages,
                    updatedAt: new Date().toISOString(),
                    updatedBy: 'Sistema',
                    description: 'Configuración inicial'
                });
            }
        };
    });
}

// Función auxiliar para obtener datos
async function getData(storeName) {
    await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Función auxiliar para guardar datos
async function saveData(storeName, data) {
    await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Función auxiliar para actualizar datos
async function updateData(storeName, data) {
    await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Función auxiliar para eliminar datos
async function deleteData(storeName, id) {
    await initDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
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

// Función para obtener el tipo de cambio actual
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
    return 320; // Valor por defecto
}

// Función para obtener los porcentajes de métodos de pago actuales
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
    
    // Valores por defecto
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