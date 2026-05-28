// Configuración de métodos de pago
const PAYMENT_METHODS_CONFIG = {
    USD: { name: 'USD', icon: '💵', defaultPercent: 0, description: 'Dólar americano' },
    CUP_Efectivo: { name: 'CUP Efectivo', icon: '💴', defaultPercent: 0, description: 'Peso cubano en efectivo' },
    CUP_Transferencia: { name: 'CUP Transferencia', icon: '🏦', defaultPercent: 15, description: 'Transferencia bancaria en CUP' },
    MLC: { name: 'MLC', icon: '💳', defaultPercent: 0, description: 'Moneda Libremente Convertible' },
    PayPal: { name: 'PayPal', icon: '📧', defaultPercent: 20, description: 'Pago por PayPal' },
    Zelle: { name: 'Zelle', icon: '🏧', defaultPercent: 20, description: 'Pago por Zelle' },
    TropiPay: { name: 'TropiPay', icon: '📱', defaultPercent: 15, description: 'Pago por TropiPay' }
};

let currentPercentages = {};

// Cargar porcentajes guardados
async function loadPercentages() {
    try {
        const savedData = await getData(STORES.PAYMENT_METHODS);
        
        if (savedData && savedData.length > 0) {
            const latestConfig = savedData.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
            currentPercentages = latestConfig.percentages;
        } else {
            for (const [key, method] of Object.entries(PAYMENT_METHODS_CONFIG)) {
                currentPercentages[key] = method.defaultPercent;
            }
        }
        
        displayMethods();
        updateExampleCalculation();
        
    } catch (error) {
        console.error('Error loading percentages:', error);
        for (const [key, method] of Object.entries(PAYMENT_METHODS_CONFIG)) {
            currentPercentages[key] = method.defaultPercent;
        }
        displayMethods();
        updateExampleCalculation();
    }
}

// Mostrar métodos de pago
function displayMethods() {
    const grid = document.getElementById('methodsGrid');
    if (!grid) return;
    
    grid.innerHTML = Object.entries(PAYMENT_METHODS_CONFIG).map(([key, method]) => `
        <div class="method-item">
            <div class="method-name">
                <span class="method-icon">${method.icon}</span>
                <span>${method.name}</span>
            </div>
            <div class="method-percentage">
                <label>Porcentaje de recargo (%)</label>
                <div class="percentage-input">
                    <input type="number" 
                           id="percent_${key}" 
                           value="${currentPercentages[key]}" 
                           step="0.5" 
                           min="0" 
                           max="100"
                           onchange="updatePercentage('${key}', this.value)">
                    <span>%</span>
                </div>
            </div>
            <div class="method-example">
                <strong>Ejemplo:</strong> Producto de $100 USD → 
                <span id="example_${key}">$${(100 * (1 + currentPercentages[key] / 100)).toFixed(2)}</span>
            </div>
        </div>
    `).join('');
    
    Object.keys(PAYMENT_METHODS_CONFIG).forEach(key => {
        updateMethodExample(key);
    });
}

function updatePercentage(methodKey, value) {
    const percent = parseFloat(value);
    if (!isNaN(percent) && percent >= 0 && percent <= 100) {
        currentPercentages[methodKey] = percent;
        updateMethodExample(methodKey);
        updateExampleCalculation();
    }
}

function updateMethodExample(methodKey) {
    const exampleSpan = document.getElementById(`example_${methodKey}`);
    if (exampleSpan) {
        const basePrice = 100;
        const finalPrice = basePrice * (1 + currentPercentages[methodKey] / 100);
        exampleSpan.innerText = `${finalPrice.toFixed(2)} ${methodKey.includes('CUP') ? 'CUP' : 'USD'}`;
    }
}

function updateExampleCalculation() {
    const exampleDiv = document.getElementById('exampleResults');
    if (!exampleDiv) return;
    
    const basePrice = 100;
    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr style="background: #f8f9fa;"><th>Método de Pago</th><th>Precio Final</th><th>Recargo</th></tr></thead><tbody>';
    
    for (const [key, method] of Object.entries(PAYMENT_METHODS_CONFIG)) {
        const percent = currentPercentages[key];
        const finalPrice = basePrice * (1 + percent / 100);
        const currency = key.includes('CUP') ? 'CUP' : (key === 'MLC' ? 'MLC' : 'USD');
        
        html += `
            <tr>
                <td>${method.icon} ${method.name}</td>
                <td><strong>${finalPrice.toFixed(2)} ${currency}</strong></td>
                <td>${percent > 0 ? `+${percent}%` : 'Sin recargo'}</td>
            </tr>
        `;
    }
    
    html += '</tbody></table>';
    exampleDiv.innerHTML = html;
}

async function saveAllPercentages() {
    const confirmSave = confirm('¿Está seguro de guardar estos porcentajes?\n\nLos cambios afectarán a todas las ventas futuras.');
    if (!confirmSave) return;
    
    try {
        for (const [key, value] of Object.entries(currentPercentages)) {
            if (value < 0 || value > 100) {
                alert(`❌ El porcentaje de ${PAYMENT_METHODS_CONFIG[key].name} debe estar entre 0 y 100`);
                return;
            }
        }
        
        const configData = {
            percentages: currentPercentages,
            updatedAt: new Date().toISOString(),
            updatedBy: 'Administrador'
        };
        
        await saveData(STORES.PAYMENT_METHODS, configData);
        alert('✅ Porcentajes guardados exitosamente!');
        await loadPercentages();
        
    } catch (error) {
        console.error('Error saving percentages:', error);
        alert('❌ Error al guardar los porcentajes: ' + error.message);
    }
}

async function resetToDefault() {
    const confirmReset = confirm('⚠️ ¿Está seguro de restablecer todos los porcentajes a sus valores por defecto?');
    if (!confirmReset) return;
    
    for (const [key, method] of Object.entries(PAYMENT_METHODS_CONFIG)) {
        currentPercentages[key] = method.defaultPercent;
    }
    
    for (const [key] of Object.entries(PAYMENT_METHODS_CONFIG)) {
        const input = document.getElementById(`percent_${key}`);
        if (input) {
            input.value = currentPercentages[key];
        }
        updateMethodExample(key);
    }
    
    updateExampleCalculation();
    alert('✅ Porcentajes restablecidos a valores por defecto.');
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Payment Methods.js inicializado');
    await loadPercentages();
    
    const saveBtn = document.querySelector('.save-all-btn');
    const resetBtn = document.querySelector('.reset-btn');
    
    if (saveBtn) saveBtn.onclick = saveAllPercentages;
    if (resetBtn) resetBtn.onclick = resetToDefault;
});