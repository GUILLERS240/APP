// Variables globales
let currentExchangeRate = 320;
let currentPercentages = {};
let currentCommissionPercentage = 5;
let products = [];
let sellers = [];
let paymentMethodsList = [];

// Cargar métodos de pago desde storage
function loadPaymentMethodsFromStorage() {
    const stored = sessionStorage.getItem('totalbiz_payment_methods_list');
    if (stored) {
        paymentMethodsList = JSON.parse(stored);
        console.log('✅ Métodos de pago cargados desde storage:', paymentMethodsList.length);
        updatePaymentMethodSelect();
        return true;
    }
    return false;
}

// Cargar datos iniciales
async function loadSalesData() {
    try {
        console.log('Cargando datos de ventas...');
        
        products = await getData(STORES.PRODUCTS);
        sellers = await getData(STORES.SELLERS);
        currentExchangeRate = await getCurrentExchangeRate();
        currentPercentages = await getCurrentPaymentPercentages();
        currentCommissionPercentage = await getCommissionPercentage();
        
        // Cargar métodos de pago
        if (!loadPaymentMethodsFromStorage()) {
            // Si no hay en storage, cargar por defecto
            paymentMethodsList = [
                { key: 'USD', name: 'USD', icon: '💵', percent: 0, currency: 'USD', isDefault: true },
                { key: 'CUP_Efectivo', name: 'CUP Efectivo', icon: '💴', percent: 0, currency: 'CUP', isDefault: true },
                { key: 'CUP_Transferencia', name: 'CUP Transferencia', icon: '🏦', percent: 15, currency: 'CUP', isDefault: true },
                { key: 'MLC', name: 'MLC', icon: '💳', percent: 0, currency: 'MLC', isDefault: true },
                { key: 'PayPal', name: 'PayPal', icon: '📧', percent: 20, currency: 'USD', isDefault: true },
                { key: 'Zelle', name: 'Zelle', icon: '🏧', percent: 20, currency: 'USD', isDefault: true },
                { key: 'TropiPay', name: 'TropiPay', icon: '📱', percent: 15, currency: 'USD', isDefault: true }
            ];
            updatePaymentMethodSelect();
        }
        
        // Cargar productos en el select
        const productSelect = document.getElementById('productSelect');
        if (productSelect) {
            if (products && products.length > 0) {
                productSelect.innerHTML = '<option value="">Seleccione un producto</option>';
                products.forEach(p => {
                    const option = document.createElement('option');
                    option.value = p.id;
                    option.setAttribute('data-price', p.price);
                    option.setAttribute('data-stock', p.stock);
                    option.textContent = `${p.name} - $${p.price} USD (Stock: ${p.stock})`;
                    productSelect.appendChild(option);
                });
            } else {
                productSelect.innerHTML = '<option value="">No hay productos disponibles</option>';
            }
        }
        
        await loadRecentSales();
        
    } catch (error) {
        console.error('Error loading sales data:', error);
    }
}

// Actualizar el selector de métodos de pago
function updatePaymentMethodSelect() {
    const paymentSelect = document.getElementById('paymentMethod');
    if (!paymentSelect) return;
    
    let options = '<option value="">Seleccione método de pago</option>';
    
    for (const method of paymentMethodsList) {
        const percentText = method.percent > 0 ? ` (+${method.percent}%)` : ' (Sin extra)';
        let currencyText = '';
        switch(method.currency) {
            case 'CUP': currencyText = ' → CUP'; break;
            case 'MLC': currencyText = ' → MLC'; break;
            default: currencyText = ' → USD';
        }
        
        options += `<option value="${method.key}" data-percent="${method.percent}" data-currency="${method.currency}">
            ${method.icon} ${method.name}${percentText}${currencyText}
        </option>`;
    }
    
    paymentSelect.innerHTML = options;
    console.log('✅ Selector actualizado con', paymentMethodsList.length, 'métodos');
}

// Calcular precio
async function calculatePrice() {
    const productSelect = document.getElementById('productSelect');
    const quantity = parseInt(document.getElementById('quantity').value) || 0;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const sellerCode = document.getElementById('sellerCode').value.trim();
    
    if (!productSelect.value || quantity === 0 || !paymentMethod) {
        document.getElementById('basePrice').innerText = '$0.00 USD';
        document.getElementById('surcharge').innerText = '0%';
        document.getElementById('totalPrice').innerText = '$0.00';
        document.getElementById('commissionInfo').style.display = 'none';
        return;
    }
    
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const basePriceUSD = parseFloat(selectedOption.getAttribute('data-price'));
    const product = products.find(p => p.id === parseInt(productSelect.value));
    
    if (product && quantity > product.stock) {
        alert(`Stock insuficiente. Solo quedan ${product.stock} unidades.`);
        document.getElementById('quantity').value = product.stock;
        calculatePrice();
        return;
    }
    
    const subtotalUSD = basePriceUSD * quantity;
    
    const selectedMethod = paymentMethodsList.find(m => m.key === paymentMethod);
    const surchargePercent = selectedMethod ? selectedMethod.percent : 0;
    const isCUP = selectedMethod?.currency === 'CUP';
    const isMLC = selectedMethod?.currency === 'MLC';
    
    const totalUSD = subtotalUSD * (1 + surchargePercent / 100);
    let totalFormatted = '';
    let totalAmount = 0;
    
    if (isCUP) {
        totalAmount = totalUSD * currentExchangeRate;
        totalFormatted = `${totalAmount.toFixed(2)} CUP`;
    } else if (isMLC) {
        totalAmount = totalUSD;
        totalFormatted = `${totalUSD.toFixed(2)} MLC`;
    } else {
        totalAmount = totalUSD;
        totalFormatted = `${totalUSD.toFixed(2)} USD`;
    }
    
    document.getElementById('basePrice').innerText = `$${subtotalUSD.toFixed(2)} USD`;
    document.getElementById('surcharge').innerText = `${surchargePercent}%`;
    document.getElementById('totalPrice').innerText = totalFormatted;
    
    // Comisión
    if (sellerCode && sellers) {
        const seller = sellers.find(s => s.code === sellerCode);
        if (seller) {
            const commissionUSD = subtotalUSD * (currentCommissionPercentage / 100);
            const commissionCUP = commissionUSD * currentExchangeRate;
            document.getElementById('commissionAmount').innerHTML = `${commissionCUP.toFixed(2)} CUP (${commissionUSD.toFixed(2)} USD) - ${currentCommissionPercentage}%`;
            document.getElementById('commissionInfo').style.display = 'block';
        } else {
            document.getElementById('commissionInfo').style.display = 'none';
        }
    } else {
        document.getElementById('commissionInfo').style.display = 'none';
    }
}

// Registrar venta
async function registerSale(event) {
    event.preventDefault();
    
    const productId = parseInt(document.getElementById('productSelect').value);
    const quantity = parseInt(document.getElementById('quantity').value);
    const paymentMethod = document.getElementById('paymentMethod').value;
    const sellerCode = document.getElementById('sellerCode').value.trim() || null;
    
    if (!productId || !quantity || !paymentMethod) {
        alert('Complete todos los campos');
        return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) {
        alert('Producto no encontrado');
        return;
    }
    
    if (quantity > product.stock) {
        alert(`Stock insuficiente. Quedan ${product.stock} unidades.`);
        return;
    }
    
    const basePriceUSD = product.price;
    const subtotalUSD = basePriceUSD * quantity;
    
    const selectedMethod = paymentMethodsList.find(m => m.key === paymentMethod);
    const surchargePercent = selectedMethod ? selectedMethod.percent : 0;
    const currency = selectedMethod ? selectedMethod.currency : 'USD';
    
    const totalUSD = subtotalUSD * (1 + surchargePercent / 100);
    let finalAmount = totalUSD;
    let displayCurrency = 'USD';
    
    if (currency === 'CUP') {
        finalAmount = totalUSD * currentExchangeRate;
        displayCurrency = 'CUP';
    } else if (currency === 'MLC') {
        finalAmount = totalUSD;
        displayCurrency = 'MLC';
    } else {
        finalAmount = totalUSD;
        displayCurrency = 'USD';
    }
    
    let commissionCUP = null;
    let sellerId = null;
    
    if (sellerCode && sellers) {
        const seller = sellers.find(s => s.code === sellerCode);
        if (seller) {
            sellerId = seller.id;
            const commissionUSD = subtotalUSD * (currentCommissionPercentage / 100);
            commissionCUP = commissionUSD * currentExchangeRate;
            
            await saveData(STORES.PENDING_PAYMENTS, {
                sellerCode: sellerCode,
                sellerId: sellerId,
                sellerName: `${seller.name} ${seller.lastname}`,
                amount: commissionCUP,
                currency: 'CUP',
                saleDate: new Date().toISOString(),
                paid: false,
                productName: product.name,
                productId: productId,
                quantity: quantity,
                commissionPercentage: currentCommissionPercentage,
                timestamp: Date.now()
            });
        }
    }
    
    const saleData = {
        productId: productId,
        productName: product.name,
        quantity: quantity,
        basePriceUSD: basePriceUSD,
        subtotalUSD: subtotalUSD,
        surchargePercent: surchargePercent,
        totalAmount: finalAmount,
        currency: displayCurrency,
        paymentMethod: paymentMethod,
        paymentMethodName: selectedMethod ? selectedMethod.name : paymentMethod,
        sellerCode: sellerCode,
        sellerId: sellerId,
        commissionCUP: commissionCUP,
        commissionPercentage: currentCommissionPercentage,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    try {
        await saveData(STORES.SALES, saleData);
        product.stock = product.stock - quantity;
        await updateData(STORES.PRODUCTS, product);
        
        let successMessage = `✅ Venta registrada!\n\n`;
        successMessage += `Producto: ${product.name}\n`;
        successMessage += `Cantidad: ${quantity}\n`;
        successMessage += `Método: ${selectedMethod ? selectedMethod.name : paymentMethod}\n`;
        successMessage += `Total: ${finalAmount.toFixed(2)} ${displayCurrency}\n`;
        
        if (commissionCUP) {
            successMessage += `\n💰 Comisión gestor: ${commissionCUP.toFixed(2)} CUP`;
        }
        
        alert(successMessage);
        resetForm();
        await loadSalesData();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al registrar la venta');
    }
}

function resetForm() {
    document.getElementById('saleForm')?.reset();
    document.getElementById('productSelect').value = '';
    document.getElementById('quantity').value = '1';
    document.getElementById('paymentMethod').value = '';
    document.getElementById('sellerCode').value = '';
    document.getElementById('basePrice').innerText = '$0.00 USD';
    document.getElementById('surcharge').innerText = '0%';
    document.getElementById('totalPrice').innerText = '$0.00';
    document.getElementById('commissionInfo').style.display = 'none';
}

async function loadRecentSales() {
    try {
        const sales = await getData(STORES.SALES);
        const tbody = document.getElementById('recentSalesList');
        if (!tbody) return;
        
        if (!sales || sales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay ventas registradas</td></tr>';
            return;
        }
        
        const recentSales = sales.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
        tbody.innerHTML = recentSales.map(sale => {
            const date = new Date(sale.date);
            return `
                <tr>
                    <td>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</td>
                    <td>${escapeHtml(sale.productName)}</td>
                    <td>${sale.quantity}</td>
                    <td>${sale.paymentMethodName || sale.paymentMethod}</td>
                    <td>${sale.totalAmount.toFixed(2)} ${sale.currency}</td>
                    <td>${sale.sellerCode || '-'}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading recent sales:', error);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Eventos
document.addEventListener('DOMContentLoaded', async () => {
    await initDatabase();
    await loadSalesData();
    
    const saleForm = document.getElementById('saleForm');
    if (saleForm) saleForm.addEventListener('submit', registerSale);
    
    document.getElementById('productSelect')?.addEventListener('change', calculatePrice);
    document.getElementById('quantity')?.addEventListener('input', calculatePrice);
    document.getElementById('paymentMethod')?.addEventListener('change', calculatePrice);
    document.getElementById('sellerCode')?.addEventListener('input', calculatePrice);
});