// Función para restablecer todo el sistema
async function resetSystem() {
    // Solicitar clave ADMIN
    const adminKey = prompt('🔐 Para restablecer todo el sistema, ingrese la clave maestra ADMIN:');
    
    if (adminKey !== 'ADMIN') {
        alert('❌ Clave incorrecta. Acción cancelada por seguridad.');
        return;
    }
    
    // Confirmación adicional
    const confirmReset = confirm(
        '⚠️ ¡ADVERTENCIA! ⚠️\n\n' +
        'Esta acción ELIMINARÁ TODOS LOS DATOS del sistema:\n\n' +
        '• Todos los productos\n' +
        '• Todas las ventas registradas\n' +
        '• Todos los gestores de venta\n' +
        '• Historial de comisiones\n' +
        '• Configuración de tipo de cambio\n' +
        '• Configuración de métodos de pago\n\n' +
        'Esta acción NO SE PUEDE DESHACER.\n\n' +
        '¿Está ABSOLUTAMENTE SEGURO de que desea continuar?'
    );
    
    if (!confirmReset) {
        alert('✅ Restablecimiento cancelado.');
        return;
    }
    
    // Segunda confirmación para mayor seguridad
    const finalConfirm = confirm(
        'ÚLTIMA ADVERTENCIA:\n\n' +
        'Se eliminarán TODOS los datos permanentemente.\n' +
        'El sistema volverá a su estado inicial de fábrica.\n\n' +
        '¿Confirmar restablecimiento TOTAL?'
    );
    
    if (!finalConfirm) {
        alert('✅ Restablecimiento cancelado.');
        return;
    }
    
    try {
        // Mostrar mensaje de carga
        showResetLoading();
        
        // Limpiar todas las tablas de la base de datos
        await clearAllStores();
        
        // Restablecer valores por defecto
        await resetDefaultValues();
        
        // Mostrar mensaje de éxito
        alert('✅ ¡Sistema restablecido exitosamente!\n\nTodos los datos han sido eliminados.\nLa página se recargará para aplicar los cambios.');
        
        // Recargar la página
        window.location.reload();
        
    } catch (error) {
        console.error('Error al restablecer sistema:', error);
        alert('❌ Error al restablecer el sistema: ' + error.message);
        hideResetLoading();
    }
}

// Mostrar loading mientras se restablece
function showResetLoading() {
    let loadingDiv = document.getElementById('resetLoadingOverlay');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'resetLoadingOverlay';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            font-size: 18px;
        `;
        loadingDiv.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; text-align: center; color: #333;">
                <div style="font-size: 50px; margin-bottom: 20px;">🔄</div>
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Restableciendo sistema...</div>
                <div style="font-size: 14px; color: #666;">Por favor espere, esto puede tomar unos segundos</div>
                <div style="margin-top: 20px;">
                    <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loadingDiv);
    }
    loadingDiv.style.display = 'flex';
}

// Ocultar loading
function hideResetLoading() {
    const loadingDiv = document.getElementById('resetLoadingOverlay');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

// Limpiar todas las tablas
async function clearAllStores() {
    const stores = ['products', 'sales', 'sellers', 'exchange_rates', 'pending_payments', 'payment_methods'];
    
    for (const store of stores) {
        try {
            const data = await getData(store);
            if (data && data.length > 0) {
                for (const item of data) {
                    await deleteData(store, item.id);
                }
            }
            console.log(`Store ${store} limpiado`);
        } catch (error) {
            console.error(`Error limpiando ${store}:`, error);
        }
    }
}

// Restablecer valores por defecto
async function resetDefaultValues() {
    // 1. Tipo de cambio por defecto (1 USD = 320 CUP)
    await saveData(STORES.EXCHANGE_RATES, {
        rate: 320,
        date: new Date().toISOString(),
        description: 'Tipo de cambio inicial (restablecido)'
    });
    
    // 2. Métodos de pago por defecto
    const defaultPercentages = {
        USD: 0,
        CUP_Efectivo: 0,
        CUP_Transferencia: 15,
        MLC: 0,
        PayPal: 20,
        Zelle: 20,
        TropiPay: 15
    };
    
    await saveData(STORES.PAYMENT_METHODS, {
        percentages: defaultPercentages,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Sistema (restablecimiento)',
        description: 'Configuración por defecto'
    });
    
    console.log('Valores por defecto restablecidos');
}