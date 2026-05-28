// Variables globales
let currentExchangeRate = 320;
let currentPercentages = {};
let products = [];
let sellers = [];

// Cargar datos iniciales
async function loadSalesData() {
    try {
        console.log('Cargando datos de ventas...');
        
        // Cargar productos
        products = await getData(STORES.PRODUCTS);
        console.log('Productos cargados:', products);
        
        const productSelect = document.getElementById('productSelect');
        if (!productSelect) {
            console.error('Elemento productSelect no encontrado');
            return;
        }
        
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
            console.log(`Se cargaron ${products.length} productos en el selector`);
        } else {
            productSelect.innerHTML = '<option value="">No hay productos disponibles - Cree productos primero</option>';
            console.warn('No hay productos en la base de datos');
        }
        
        // Cargar gestores
        sellers = await getData(STORES.SELLERS);
        console.log('Gestores cargados:', sellers.length);
        
        // Cargar tipo de cambio
        currentExchangeRate = await getCurrentExchangeRate();
        console.log(`Tipo de cambio actual: 1 USD = ${currentExchangeRate} CUP`);
        
        // Cargar porcentajes de métodos de pago
        currentPercentages = await getCurrentPaymentPercentages();
        console.log('Porcentajes de métodos de pago cargados:', currentPercentages);
        
        // Cargar ventas recientes
        await loadRecentSales();
        
    } catch (error) {
        console.error('Error loading sales data:', error);
        alert('Error al cargar los datos: ' + error.message);
    }
}

// Calcular precio según método de pago
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
    const productId = parseInt(productSelect.value);
    const product = products.find(p => p.id === productId);
    
    // Verificar stock
    if (product && quantity > product.stock) {
        alert(`Stock insuficiente. Solo quedan ${product.stock} unidades.`);
        document.getElementById('quantity').value = product.stock;
        calculatePrice();
        return;
    }
    
    const subtotalUSD = basePriceUSD * quantity;
    
    // Obtener porcentaje del método de pago
    let surchargePercent = currentPercentages[paymentMethod] || 0;
    let currencySymbol = 'USD';
    let isCUP = false;
    
    switch(paymentMethod) {
        case 'USD':
            currencySymbol = 'USD';
            break;
        case 'CUP_Efectivo':
            currencySymbol = 'CUP';
            isCUP = true;
            break;
        case 'CUP_Transferencia':
            currencySymbol = 'CUP';
            isCUP = true;
            break;
        case 'MLC':
            currencySymbol = 'MLC';
            break;
        case 'PayPal':
            currencySymbol = 'USD';
            break;
        case 'Zelle':
            currencySymbol = 'USD';
            break;
        case 'TropiPay':
            currencySymbol = 'USD';
            break;
        default:
            currencySymbol = 'USD';
    }
    
    const totalUSD = subtotalUSD * (1 + surchargePercent / 100);
    let totalFormatted = '';
    let totalAmount = 0;
    
    if (isCUP) {
        totalAmount = totalUSD * currentExchangeRate;
        totalFormatted = `${totalAmount.toFixed(2)} CUP`;
    } else {
        totalAmount = totalUSD;
        totalFormatted = `${totalUSD.toFixed(2)} ${currencySymbol}`;
    }
    
    // Mostrar desglose
    document.getElementById('basePrice').innerText = `$${subtotalUSD.toFixed(2)} USD`;
    document.getElementById('surcharge').innerText = `${surchargePercent}%`;
    document.getElementById('totalPrice').innerText = totalFormatted;
    
    // Calcular comisión para gestor (5% del precio base en USD convertido a CUP)
    if (sellerCode && sellers) {
        const seller = sellers.find(s => s.code === sellerCode);
        if (seller) {
            const commissionUSD = subtotalUSD * 0.05;
            const commissionCUP = commissionUSD * currentExchangeRate;
            document.getElementById('commissionAmount').innerHTML = `${commissionCUP.toFixed(2)} CUP (${commissionUSD.toFixed(2)} USD al cambio ${currentExchangeRate})`;
            document.getElementById('commissionInfo').style.display = 'block';
        } else {
            document.getElementById('commissionInfo').style.display = 'none';
            if (sellerCode) {
                console.log(`Gestor con código ${sellerCode} no encontrado`);
            }
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
    
    // Validaciones
    if (!productId) {
        alert('Seleccione un producto');
        return;
    }
    if (!quantity || quantity < 1) {
        alert('Ingrese una cantidad válida');
        return;
    }
    if (!paymentMethod) {
        alert('Seleccione un método de pago');
        return;
    }
    
    // Obtener producto
    const product = products.find(p => p.id === productId);
    if (!product) {
        alert('Producto no encontrado');
        return;
    }
    
    // Verificar stock
    if (quantity > product.stock) {
        alert(`Stock insuficiente. Solo quedan ${product.stock} unidades.`);
        return;
    }
    
    // Calcular precios
    const basePriceUSD = product.price;
    const subtotalUSD = basePriceUSD * quantity;
    
    // Obtener porcentaje dinámico
    let surchargePercent = currentPercentages[paymentMethod] || 0;
    
    const totalUSD = subtotalUSD * (1 + surchargePercent / 100);
    let finalAmount = totalUSD;
    let currency = 'USD';
    
    if (paymentMethod.includes('CUP')) {
        finalAmount = totalUSD * currentExchangeRate;
        currency = 'CUP';
    } else if (paymentMethod === 'MLC') {
        currency = 'MLC';
    }
    
    // Calcular comisión (5% del precio base en USD convertido a CUP)
    let commissionCUP = null;
    let sellerId = null;
    
    if (sellerCode && sellers) {
        const seller = sellers.find(s => s.code === sellerCode);
        if (seller) {
            sellerId = seller.id;
            const commissionUSD = subtotalUSD * 0.05;
            commissionCUP = commissionUSD * currentExchangeRate;
            
            // Guardar pago pendiente
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
                timestamp: Date.now()
            });
            console.log(`Comisión guardada para ${seller.code}: ${commissionCUP} CUP`);
        } else {
            console.warn(`Gestor con código ${sellerCode} no encontrado, no se guardó comisión`);
        }
    }
    
    // Guardar venta
    const saleData = {
        productId: productId,
        productName: product.name,
        quantity: quantity,
        basePriceUSD: basePriceUSD,
        subtotalUSD: subtotalUSD,
        surchargePercent: surchargePercent,
        totalAmount: finalAmount,
        currency: currency,
        paymentMethod: paymentMethod,
        sellerCode: sellerCode,
        sellerId: sellerId,
        commissionCUP: commissionCUP,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    try {
        // Guardar venta
        await saveData(STORES.SALES, saleData);
        
        // Actualizar stock del producto
        product.stock = product.stock - quantity;
        await updateData(STORES.PRODUCTS, product);
        
        // Mostrar mensaje de éxito
        let successMessage = `✅ Venta registrada exitosamente!\n\n`;
        successMessage += `Producto: ${product.name}\n`;
        successMessage += `Cantidad: ${quantity}\n`;
        successMessage += `Precio base: $${basePriceUSD} USD\n`;
        successMessage += `Recargo: ${surchargePercent}%\n`;
        successMessage += `Total: ${finalAmount.toFixed(2)} ${currency}\n`;
        
        if (commissionCUP) {
            successMessage += `\n💰 Comisión gestor: ${commissionCUP.toFixed(2)} CUP`;
        }
        
        successMessage += `\n\n📦 Stock restante: ${product.stock} unidades`;
        
        alert(successMessage);
        
        // Resetear formulario
        resetForm();
        
        // Recargar datos
        await loadSalesData();
        
    } catch (error) {
        console.error('Error registering sale:', error);
        alert('❌ Error al registrar la venta: ' + error.message);
    }
}

// Resetear formulario
function resetForm() {
    const form = document.getElementById('saleForm');
    if (form) form.reset();
    
    const productSelect = document.getElementById('productSelect');
    if (productSelect) productSelect.value = '';
    
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) quantityInput.value = '1';
    
    const paymentMethod = document.getElementById('paymentMethod');
    if (paymentMethod) paymentMethod.value = '';
    
    const sellerCode = document.getElementById('sellerCode');
    if (sellerCode) sellerCode.value = '';
    
    document.getElementById('basePrice').innerText = '$0.00 USD';
    document.getElementById('surcharge').innerText = '0%';
    document.getElementById('totalPrice').innerText = '$0.00';
    document.getElementById('commissionInfo').style.display = 'none';
}

// Cargar ventas recientes
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
            const dateFormatted = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            let methodName = '';
            switch(sale.paymentMethod) {
                case 'USD': methodName = 'USD'; break;
                case 'CUP_Efectivo': methodName = 'CUP Efectivo'; break;
                case 'CUP_Transferencia': methodName = 'CUP Transferencia'; break;
                case 'MLC': methodName = 'MLC'; break;
                case 'PayPal': methodName = 'PayPal'; break;
                case 'Zelle': methodName = 'Zelle'; break;
                case 'TropiPay': methodName = 'TropiPay'; break;
                default: methodName = sale.paymentMethod;
            }
            
            return `
                <tr>
                    <td>${dateFormatted}</td>
                    <td>${escapeHtml(sale.productName)}</td>
                    <td>${sale.quantity}</td>
                    <td><span class="badge badge-info">${methodName}</span></td>
                    <td><span class="badge badge-success">${sale.totalAmount.toFixed(2)} ${sale.currency}</span></td>
                    <td>${sale.sellerCode || '-'}</td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading recent sales:', error);
    }
}

// Escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Verificar que haya productos antes de cargar la página
async function checkProducts() {
    const products = await getData(STORES.PRODUCTS);
    if (!products || products.length === 0) {
        console.warn('No hay productos en la base de datos. Por favor cree productos primero.');
        const productSelect = document.getElementById('productSelect');
        if (productSelect) {
            productSelect.innerHTML = '<option value="">⚠️ No hay productos - Vaya a Productos primero</option>';
        }
    }
}

// Inicializar eventos
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Sales.js inicializado');
    
    // Esperar a que la base de datos esté lista
    await initDatabase();
    
    // Cargar datos
    await loadSalesData();
    await checkProducts();
    
    const saleForm = document.getElementById('saleForm');
    if (saleForm) {
        saleForm.addEventListener('submit', registerSale);
    }
    
    const productSelect = document.getElementById('productSelect');
    const quantityInput = document.getElementById('quantity');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const sellerCodeInput = document.getElementById('sellerCode');
    
    if (productSelect) productSelect.addEventListener('change', () => calculatePrice());
    if (quantityInput) quantityInput.addEventListener('input', () => calculatePrice());
    if (paymentMethodSelect) paymentMethodSelect.addEventListener('change', () => calculatePrice());
    if (sellerCodeInput) sellerCodeInput.addEventListener('input', () => calculatePrice());
});