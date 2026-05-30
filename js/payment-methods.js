// ========== MÉTODOS DE PAGO - VERSIÓN MEJORADA ==========

const DEFAULT_METHODS_CONFIG = {
    USD: { name: 'USD', icon: '💵', defaultPercent: 0, currency: 'USD', isDefault: true },
    CUP_Efectivo: { name: 'CUP Efectivo', icon: '💴', defaultPercent: 0, currency: 'CUP', isDefault: true },
    CUP_Transferencia: { name: 'CUP Transferencia', icon: '🏦', defaultPercent: 15, currency: 'CUP', isDefault: true },
    MLC: { name: 'MLC', icon: '💳', defaultPercent: 0, currency: 'MLC', isDefault: true },
    PayPal: { name: 'PayPal', icon: '📧', defaultPercent: 20, currency: 'USD', isDefault: true },
    Zelle: { name: 'Zelle', icon: '🏧', defaultPercent: 20, currency: 'USD', isDefault: true },
    TropiPay: { name: 'TropiPay', icon: '📱', defaultPercent: 15, currency: 'USD', isDefault: true }
};

let currentPercentages = {};
let customMethodsList = [];

// Guardar métodos de pago en storage
function savePaymentMethodsToStorage() {
    const methodsForSales = [];
    
    // Métodos por defecto
    for (const [key, method] of Object.entries(DEFAULT_METHODS_CONFIG)) {
        methodsForSales.push({
            key: key,
            name: method.name,
            icon: method.icon,
            percent: currentPercentages[key] || method.defaultPercent,
            currency: method.currency,
            isDefault: true
        });
    }
    
    // Métodos personalizados
    for (const method of customMethodsList) {
        methodsForSales.push({
            key: method.key,
            name: method.name,
            icon: method.icon || '💳',
            percent: currentPercentages[method.key] || 0,
            currency: method.currency || 'USD',
            isDefault: false
        });
    }
    
    sessionStorage.setItem('totalbiz_payment_methods_list', JSON.stringify(methodsForSales));
    console.log('✅ Métodos de pago guardados en storage:', methodsForSales.length);
}

// Función global para añadir método personalizado
window.addCustomMethod = async function(name, icon, percent, currency) {
    const key = name.toUpperCase().replace(/\s/g, '_');
    
    // Verificar si ya existe
    if (DEFAULT_METHODS_CONFIG[key] || customMethodsList.some(m => m.key === key)) {
        throw new Error('Ya existe un método con ese nombre');
    }
    
    const newMethod = {
        key: key,
        name: name,
        icon: icon || '💳',
        percent: percent,
        currency: currency,
        isDefault: false,
        createdAt: new Date().toISOString()
    };
    
    customMethodsList.push(newMethod);
    currentPercentages[key] = percent;
    
    // Guardar en base de datos
    const configData = {
        percentages: currentPercentages,
        customMethods: customMethodsList,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Administrador'
    };
    
    const existing = await getData(STORES.PAYMENT_METHODS);
    if (existing && existing.length > 0) {
        const latest = existing.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
        configData.id = latest.id;
        await updateData(STORES.PAYMENT_METHODS, configData);
    } else {
        await saveData(STORES.PAYMENT_METHODS, configData);
    }
    
    // Actualizar storage
    savePaymentMethodsToStorage();
    
    return newMethod;
};

// Cargar porcentajes guardados
async function loadPercentages() {
    try {
        const savedData = await getData(STORES.PAYMENT_METHODS);
        
        if (savedData && savedData.length > 0) {
            const latestConfig = savedData.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
            currentPercentages = latestConfig.percentages || {};
            customMethodsList = latestConfig.customMethods || [];
            
            // Asegurar que los métodos por defecto existen
            for (const [key, method] of Object.entries(DEFAULT_METHODS_CONFIG)) {
                if (currentPercentages[key] === undefined) {
                    currentPercentages[key] = method.defaultPercent;
                }
            }
        } else {
            // Valores por defecto
            for (const [key, method] of Object.entries(DEFAULT_METHODS_CONFIG)) {
                currentPercentages[key] = method.defaultPercent;
            }
            customMethodsList = [];
        }
        
        // Guardar en storage para ventas
        savePaymentMethodsToStorage();
        
        if (typeof displayMethods === 'function') {
            displayMethods();
        }
        
    } catch (error) {
        console.error('Error loading percentages:', error);
        for (const [key, method] of Object.entries(DEFAULT_METHODS_CONFIG)) {
            currentPercentages[key] = method.defaultPercent;
        }
        customMethodsList = [];
        savePaymentMethodsToStorage();
        if (typeof displayMethods === 'function') {
            displayMethods();
        }
    }
}

// Actualizar un porcentaje específico
async function updatePercentage(methodKey, value) {
    const percent = parseFloat(value);
    if (!isNaN(percent) && percent >= 0 && percent <= 100) {
        currentPercentages[methodKey] = percent;
        savePaymentMethodsToStorage();
        
        // Actualizar ejemplo visual
        const exampleSpan = document.getElementById(`example_${methodKey}`);
        if (exampleSpan) {
            let methodInfo = DEFAULT_METHODS_CONFIG[methodKey];
            if (!methodInfo) {
                const customMethod = customMethodsList.find(m => m.key === methodKey);
                if (customMethod) {
                    methodInfo = { name: customMethod.name, currency: customMethod.currency || 'USD' };
                } else {
                    methodInfo = { name: methodKey, currency: 'USD' };
                }
            }
            const finalPrice = 100 * (1 + percent / 100);
            exampleSpan.innerText = `${finalPrice.toFixed(2)} ${methodInfo.currency}`;
        }
        
        if (typeof updateExampleCalculation === 'function') {
            updateExampleCalculation();
        }
    }
}

// Guardar todos los porcentajes
async function saveAllPercentages() {
    const confirmSave = confirm('¿Está seguro de guardar estos porcentajes?\n\nLos cambios afectarán a todas las ventas futuras.');
    if (!confirmSave) return;
    
    try {
        for (const [key, value] of Object.entries(currentPercentages)) {
            if (value < 0 || value > 100) {
                alert(`❌ El porcentaje de ${key} debe estar entre 0 y 100`);
                return;
            }
        }
        
        const configData = {
            percentages: currentPercentages,
            customMethods: customMethodsList,
            updatedAt: new Date().toISOString(),
            updatedBy: 'Administrador',
            description: 'Actualización de porcentajes'
        };
        
        const existing = await getData(STORES.PAYMENT_METHODS);
        if (existing && existing.length > 0) {
            const latest = existing.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
            configData.id = latest.id;
            await updateData(STORES.PAYMENT_METHODS, configData);
        } else {
            await saveData(STORES.PAYMENT_METHODS, configData);
        }
        
        savePaymentMethodsToStorage();
        alert('✅ Porcentajes guardados exitosamente!');
        
    } catch (error) {
        console.error('Error saving percentages:', error);
        alert('❌ Error al guardar los porcentajes: ' + error.message);
    }
}

// Restablecer a valores por defecto
async function resetToDefault() {
    const confirmReset = confirm('⚠️ ¿Está seguro de restablecer todos los porcentajes a sus valores por defecto?\n\nLos métodos personalizados se mantendrán pero con porcentaje 0%.');
    if (!confirmReset) return;
    
    for (const [key, method] of Object.entries(DEFAULT_METHODS_CONFIG)) {
        currentPercentages[key] = method.defaultPercent;
    }
    
    for (const method of customMethodsList) {
        if (currentPercentages[method.key] === undefined) {
            currentPercentages[method.key] = 0;
        }
    }
    
    savePaymentMethodsToStorage();
    
    for (const [key] of Object.entries(DEFAULT_METHODS_CONFIG)) {
        const input = document.getElementById(`percent_${key}`);
        if (input) {
            input.value = currentPercentages[key];
        }
        if (typeof updateMethodExample === 'function') {
            updateMethodExample(key);
        }
    }
    
    for (const method of customMethodsList) {
        const input = document.getElementById(`percent_${method.key}`);
        if (input) {
            input.value = currentPercentages[method.key] || 0;
        }
    }
    
    if (typeof updateExampleCalculation === 'function') {
        updateExampleCalculation();
    }
    
    alert('✅ Porcentajes restablecidos a valores por defecto.');
}

// Función para obtener métodos para ventas (global)
window.getPaymentMethodsForSales = function() {
    const stored = sessionStorage.getItem('totalbiz_payment_methods_list');
    if (stored) {
        return JSON.parse(stored);
    }
    // Fallback
    return [
        { key: 'USD', name: 'USD', icon: '💵', percent: 0, currency: 'USD', isDefault: true },
        { key: 'CUP_Efectivo', name: 'CUP Efectivo', icon: '💴', percent: 0, currency: 'CUP', isDefault: true },
        { key: 'CUP_Transferencia', name: 'CUP Transferencia', icon: '🏦', percent: 15, currency: 'CUP', isDefault: true },
        { key: 'MLC', name: 'MLC', icon: '💳', percent: 0, currency: 'MLC', isDefault: true },
        { key: 'PayPal', name: 'PayPal', icon: '📧', percent: 20, currency: 'USD', isDefault: true },
        { key: 'Zelle', name: 'Zelle', icon: '🏧', percent: 20, currency: 'USD', isDefault: true },
        { key: 'TropiPay', name: 'TropiPay', icon: '📱', percent: 15, currency: 'USD', isDefault: true }
    ];
};

// Display methods (para la interfaz)
window.displayMethods = function() {
    const grid = document.getElementById('methodsGrid');
    if (!grid) return;
    
    let html = '';
    
    for (const [key, percent] of Object.entries(currentPercentages)) {
        let methodInfo = DEFAULT_METHODS_CONFIG[key];
        let isDefault = !!methodInfo;
        let displayName = key;
        let icon = '💳';
        let currency = 'USD';
        
        if (methodInfo) {
            displayName = methodInfo.name;
            icon = methodInfo.icon;
            currency = methodInfo.currency;
        } else {
            const customMethod = customMethodsList.find(m => m.key === key);
            if (customMethod) {
                displayName = customMethod.name;
                icon = customMethod.icon || '💳';
                currency = customMethod.currency || 'USD';
            }
        }
        
        const finalPrice = 100 * (1 + percent / 100);
        
        html += `
            <div class="method-card" data-method="${key}">
                ${isDefault ? '<div class="method-badge">📌 Por defecto</div>' : '<div class="method-badge">✨ Personalizado</div>'}
                <div class="method-card-header">
                    <div class="method-card-title">
                        <div class="method-icon">${icon}</div>
                        <div>
                            <div class="method-name">${displayName}</div>
                            <small style="color: var(--text-muted);">${currency}</small>
                        </div>
                    </div>
                    <div class="method-actions">
                        <button class="method-action-btn edit-btn" onclick="window.editMethodModal('${key}', '${displayName}', '${icon}', ${percent}, '${currency}')" title="Editar">
                            ✏️
                        </button>
                        ${!isDefault ? `<button class="method-action-btn delete-btn" onclick="window.deleteCustomMethod('${key}')" title="Eliminar">🗑️</button>` : ''}
                    </div>
                </div>
                <div class="method-percentage">
                    <label class="percentage-label">Porcentaje de recargo</label>
                    <div class="percentage-input-group">
                        <input type="number" id="percent_${key}" value="${percent}" step="0.5" min="0" max="100" onchange="updatePercentage('${key}', this.value)">
                        <span class="percentage-unit">%</span>
                    </div>
                </div>
                <div class="method-example">
                    💡 Ejemplo: Producto de $100 USD → <span>${finalPrice.toFixed(2)} ${currency}</span>
                </div>
            </div>
        `;
    }
    
    grid.innerHTML = html;
};

// Editar método
window.editMethodModal = function(key, name, icon, percent, currency) {
    document.getElementById('editMethodKey').value = key;
    document.getElementById('editMethodName').value = name;
    document.getElementById('editMethodIcon').value = icon;
    document.getElementById('editMethodPercent').value = percent;
    document.getElementById('editMethodCurrency').value = currency;
    document.getElementById('editMethodModal').classList.add('show');
};

// Eliminar método personalizado
window.deleteCustomMethod = async function(key) {
    const confirmDelete = confirm(`⚠️ ¿Eliminar el método "${key}"?\n\nEsta acción no se puede deshacer.`);
    if (!confirmDelete) return;
    
    const methodIndex = customMethodsList.findIndex(m => m.key === key);
    if (methodIndex !== -1) {
        customMethodsList.splice(methodIndex, 1);
    }
    delete currentPercentages[key];
    
    const configData = {
        percentages: currentPercentages,
        customMethods: customMethodsList,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Administrador'
    };
    
    const existing = await getData(STORES.PAYMENT_METHODS);
    if (existing && existing.length > 0) {
        const latest = existing.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
        configData.id = latest.id;
        await updateData(STORES.PAYMENT_METHODS, configData);
    }
    
    savePaymentMethodsToStorage();
    alert(`✅ Método "${key}" eliminado`);
    location.reload();
};

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Payment Methods.js inicializado');
    await loadPercentages();
    
    const saveBtn = document.querySelector('.save-all-btn');
    const resetBtn = document.querySelector('.reset-btn');
    
    if (saveBtn) saveBtn.onclick = saveAllPercentages;
    if (resetBtn) resetBtn.onclick = resetToDefault;
});