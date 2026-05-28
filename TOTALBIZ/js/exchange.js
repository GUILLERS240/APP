// Variable global para el tipo de cambio actual
let currentExchangeRate = 320;

// Cargar tipo de cambio actual
async function loadExchangeRate() {
    try {
        const rates = await getData(STORES.EXCHANGE_RATES);
        
        if (rates && rates.length > 0) {
            // Obtener el rate más reciente
            const latestRate = rates.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            currentExchangeRate = latestRate.rate;
            updateDisplayedRate(currentExchangeRate);
        } else {
            // Crear rate por defecto si no existe
            currentExchangeRate = 320;
            await saveData(STORES.EXCHANGE_RATES, {
                rate: currentExchangeRate,
                date: new Date().toISOString(),
                description: 'Tipo de cambio inicial'
            });
            updateDisplayedRate(currentExchangeRate);
        }
        
        // Cargar historial
        await loadRateHistory();
        
    } catch (error) {
        console.error('Error loading exchange rate:', error);
        currentExchangeRate = 320;
        updateDisplayedRate(currentExchangeRate);
    }
}

// Actualizar display del rate
function updateDisplayedRate(rate) {
    const currentRateSpan = document.getElementById('currentRate');
    const rateDisplaySpan = document.getElementById('rateDisplay');
    
    if (currentRateSpan) currentRateSpan.innerText = rate.toFixed(2);
    if (rateDisplaySpan) rateDisplaySpan.innerText = rate.toFixed(2);
}

// Actualizar tipo de cambio
async function updateExchangeRate() {
    const newRateInput = document.getElementById('newRate');
    const newRate = parseFloat(newRateInput.value);
    
    if (!newRateInput.value) {
        alert('⚠️ Por favor, ingrese un valor para el tipo de cambio');
        return;
    }
    
    if (isNaN(newRate) || newRate <= 0) {
        alert('⚠️ Por favor, ingrese un valor válido mayor a 0');
        return;
    }
    
    // Confirmar cambio
    const confirmChange = confirm(`¿Está seguro de cambiar el tipo de cambio?\n\nActual: 1 USD = ${currentExchangeRate.toFixed(2)} CUP\nNuevo: 1 USD = ${newRate.toFixed(2)} CUP\n\nEste cambio afectará todas las ventas futuras en CUP.`);
    
    if (!confirmChange) return;
    
    try {
        // Guardar nuevo rate
        const rateData = {
            rate: newRate,
            date: new Date().toISOString(),
            description: `Actualizado manualmente por administrador`
        };
        
        await saveData(STORES.EXCHANGE_RATES, rateData);
        
        // Actualizar variable global
        currentExchangeRate = newRate;
        updateDisplayedRate(currentExchangeRate);
        
        // Limpiar input
        newRateInput.value = '';
        
        // Recargar historial
        await loadRateHistory();
        
        alert(`✅ Tipo de cambio actualizado exitosamente\n\n1 USD = ${newRate.toFixed(2)} CUP`);
        
    } catch (error) {
        console.error('Error updating exchange rate:', error);
        alert('❌ Error al actualizar el tipo de cambio');
    }
}

// Cargar historial de cambios
async function loadRateHistory() {
    try {
        const rates = await getData(STORES.EXCHANGE_RATES);
        const tbody = document.getElementById('rateHistory');
        
        if (!rates || rates.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No hay historial disponible</td></tr>';
            return;
        }
        
        // Ordenar por fecha descendente
        const sortedRates = rates.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        tbody.innerHTML = sortedRates.map(rate => {
            const date = new Date(rate.date);
            const dateFormatted = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            return `
                <tr>
                    <td>${dateFormatted}</td>
                    <td><strong>${rate.rate.toFixed(2)} CUP</strong></td>
                    <td>${rate.description || 'Actualización de tipo de cambio'}</td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading rate history:', error);
    }
}

// Convertir USD a CUP
function convertUSDtoCUP() {
    const usdInput = document.getElementById('usdAmount');
    const resultSpan = document.getElementById('usdToCupResult');
    
    if (!usdInput.value) {
        resultSpan.innerText = '= 0.00 CUP';
        return;
    }
    
    const usd = parseFloat(usdInput.value);
    if (isNaN(usd)) {
        resultSpan.innerText = '= 0.00 CUP';
        return;
    }
    
    const cup = usd * currentExchangeRate;
    resultSpan.innerText = `= ${cup.toFixed(2)} CUP`;
}

// Convertir CUP a USD
function convertCUPtoUSD() {
    const cupInput = document.getElementById('cupAmount');
    const resultSpan = document.getElementById('cupToUsdResult');
    
    if (!cupInput.value) {
        resultSpan.innerText = '= 0.00 USD';
        return;
    }
    
    const cup = parseFloat(cupInput.value);
    if (isNaN(cup)) {
        resultSpan.innerText = '= 0.00 USD';
        return;
    }
    
    const usd = cup / currentExchangeRate;
    resultSpan.innerText = `= ${usd.toFixed(2)} USD`;
}

// Obtener el tipo de cambio actual (para usar en otros archivos)
function getCurrentExchangeRate() {
    return currentExchangeRate;
}

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Exchange.js inicializado');
    await loadExchangeRate();
});