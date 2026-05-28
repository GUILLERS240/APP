let salesChart = null;
let paymentChart = null;
let currentSalesData = [];
let currentPeriod = 'week';

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Reports.js inicializado');
    await initDatabase();
    await loadReports();
    
    // Configurar fechas por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('customDate').value = today;
    
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    document.getElementById('startDate').value = startOfWeek.toISOString().split('T')[0];
    
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
    document.getElementById('endDate').value = endOfWeek.toISOString().split('T')[0];
});

// Cambiar período
function changePeriod() {
    const period = document.getElementById('periodSelect').value;
    currentPeriod = period;
    const customDateGroup = document.getElementById('customDateGroup');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (period === 'custom') {
        customDateGroup.style.display = 'block';
    } else {
        customDateGroup.style.display = 'none';
    }
    
    applyFilters();
}

// Aplicar filtros
async function applyFilters() {
    const period = document.getElementById('periodSelect').value;
    let startDate = null;
    let endDate = null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (period === 'day') {
        startDate = today;
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        startDate = startOfWeek;
        endDate = new Date(startOfWeek);
        endDate.setDate(startOfWeek.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
    } else if (period === 'custom') {
        const customDate = document.getElementById('customDate').value;
        if (customDate) {
            startDate = new Date(customDate);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(customDate);
            endDate.setHours(23, 59, 59, 999);
        }
    }
    
    // Si hay fechas personalizadas manuales
    const manualStart = document.getElementById('startDate').value;
    const manualEnd = document.getElementById('endDate').value;
    if (manualStart && manualEnd) {
        startDate = new Date(manualStart);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(manualEnd);
        endDate.setHours(23, 59, 59, 999);
    }
    
    await loadReports(startDate, endDate);
}

// Cargar todos los reportes
async function loadReports(startDate = null, endDate = null) {
    try {
        const sales = await getData(STORES.SALES);
        const payments = await getData(STORES.PENDING_PAYMENTS);
        const products = await getData(STORES.PRODUCTS);
        const sellers = await getData(STORES.SELLERS);
        
        // Filtrar por fecha
        let filteredSales = sales;
        if (startDate && endDate) {
            filteredSales = sales.filter(sale => {
                const saleDate = new Date(sale.date);
                return saleDate >= startDate && saleDate <= endDate;
            });
        }
        
        currentSalesData = filteredSales;
        
        // Actualizar estadísticas
        updateStats(filteredSales, payments);
        
        // Actualizar gráficos
        updateSalesChart(filteredSales);
        updatePaymentChart(filteredSales);
        
        // Actualizar tablas
        updateTopProducts(filteredSales, products);
        updatePaymentMethodsTable(filteredSales);
        updateCommissionsTable(sellers, payments);
        
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// Actualizar tarjetas de estadísticas
function updateStats(sales, payments) {
    const totalSalesUSD = sales.reduce((sum, sale) => {
        if (sale.currency === 'USD') return sum + sale.totalAmount;
        return sum;
    }, 0);
    
    const totalProductsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    
    const pendingPayments = payments ? payments.filter(p => !p.paid) : [];
    const totalCommissions = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    document.getElementById('totalSales').innerText = `$${totalSalesUSD.toFixed(2)}`;
    document.getElementById('totalProductsSold').innerText = totalProductsSold;
    document.getElementById('totalCommissions').innerText = `${totalCommissions.toFixed(2)} CUP`;
    document.getElementById('totalTransactions').innerText = sales.length;
}

// Gráfico de ventas por día
function updateSalesChart(sales) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    // Agrupar ventas por día
    const salesByDay = {};
    sales.forEach(sale => {
        const date = new Date(sale.date).toLocaleDateString();
        const amount = sale.currency === 'USD' ? sale.totalAmount : sale.totalAmount / 320;
        salesByDay[date] = (salesByDay[date] || 0) + amount;
    });
    
    const labels = Object.keys(salesByDay);
    const data = Object.values(salesByDay);
    
    if (salesChart) salesChart.destroy();
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas (USD)',
                data: data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
}

// Gráfico de métodos de pago
function updatePaymentChart(sales) {
    const ctx = document.getElementById('paymentChart').getContext('2d');
    
    const paymentMethods = {};
    sales.forEach(sale => {
        let methodName = sale.paymentMethod;
        switch(methodName) {
            case 'USD': methodName = 'USD'; break;
            case 'CUP_Efectivo': methodName = 'CUP Efectivo'; break;
            case 'CUP_Transferencia': methodName = 'CUP Transferencia'; break;
            case 'MLC': methodName = 'MLC'; break;
            case 'PayPal': methodName = 'PayPal'; break;
            case 'Zelle': methodName = 'Zelle'; break;
            case 'TropiPay': methodName = 'TropiPay'; break;
        }
        paymentMethods[methodName] = (paymentMethods[methodName] || 0) + sale.totalAmount;
    });
    
    const labels = Object.keys(paymentMethods);
    const data = Object.values(paymentMethods);
    
    if (paymentChart) paymentChart.destroy();
    
    paymentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#667eea', '#764ba2', '#28a745', '#ffc107',
                    '#dc3545', '#17a2b8', '#6f42c1'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Top productos más vendidos
function updateTopProducts(sales, products) {
    const productSales = {};
    sales.forEach(sale => {
        productSales[sale.productName] = (productSales[sale.productName] || 0) + sale.quantity;
    });
    
    const sorted = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const tbody = document.querySelector('#topProductsTable tbody');
    if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No hay datos</td></tr>';
        return;
    }
    
    tbody.innerHTML = sorted.map(([name, quantity]) => {
        const total = sales.filter(s => s.productName === name)
            .reduce((sum, s) => sum + (s.currency === 'USD' ? s.totalAmount : s.totalAmount / 320), 0);
        return `<tr><td>${escapeHtml(name)}</td><td>${quantity}</td><td>$${total.toFixed(2)} USD</td></tr>`;
    }).join('');
}

// Tabla de métodos de pago
function updatePaymentMethodsTable(sales) {
    const paymentMethods = {};
    sales.forEach(sale => {
        let methodName = sale.paymentMethod;
        switch(methodName) {
            case 'USD': methodName = 'USD'; break;
            case 'CUP_Efectivo': methodName = 'CUP Efectivo'; break;
            case 'CUP_Transferencia': methodName = 'CUP Transferencia'; break;
            case 'MLC': methodName = 'MLC'; break;
            case 'PayPal': methodName = 'PayPal'; break;
            case 'Zelle': methodName = 'Zelle'; break;
            case 'TropiPay': methodName = 'TropiPay'; break;
        }
        if (!paymentMethods[methodName]) {
            paymentMethods[methodName] = { count: 0, total: 0 };
        }
        paymentMethods[methodName].count++;
        paymentMethods[methodName].total += sale.totalAmount;
    });
    
    const totalSales = sales.reduce((sum, s) => sum + (s.currency === 'USD' ? s.totalAmount : s.totalAmount / 320), 0);
    
    const tbody = document.querySelector('#paymentMethodsTable tbody');
    if (Object.keys(paymentMethods).length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No hay datos</td></tr>';
        return;
    }
    
    tbody.innerHTML = Object.entries(paymentMethods).map(([method, data]) => {
        const percentage = totalSales > 0 ? (data.total / totalSales * 100).toFixed(1) : 0;
        return `<tr>
            <td>${method}</td>
            <td>${data.count}</td>
            <td>${data.total.toFixed(2)} ${method.includes('CUP') ? 'CUP' : (method === 'MLC' ? 'MLC' : 'USD')}</td>
            <td>${percentage}%</td>
        </tr>`;
    }).join('');
}

// Tabla de comisiones por gestor
function updateCommissionsTable(sellers, payments) {
    if (!sellers || sellers.length === 0) {
        const tbody = document.querySelector('#commissionsTable tbody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay gestores registrados</td></tr>';
        return;
    }
    
    const sellerCommissions = sellers.map(seller => {
        const sellerPayments = payments ? payments.filter(p => p.sellerCode === seller.code) : [];
        const pending = sellerPayments.filter(p => !p.paid).reduce((sum, p) => sum + (p.amount || 0), 0);
        const paid = sellerPayments.filter(p => p.paid).reduce((sum, p) => sum + (p.amount || 0), 0);
        return {
            name: `${seller.name} ${seller.lastname}`,
            code: seller.code,
            pending: pending,
            paid: paid,
            total: pending + paid
        };
    }).sort((a, b) => b.total - a.total);
    
    const tbody = document.querySelector('#commissionsTable tbody');
    tbody.innerHTML = sellerCommissions.map(s => `
        <tr>
            <td>${escapeHtml(s.name)}</td>
            <td><strong>${s.code}</strong></td>
            <td>${s.pending.toFixed(2)} CUP</td>
            <td>${s.paid.toFixed(2)} CUP</td>
            <td>${s.total.toFixed(2)} CUP</td>
        </tr>
    `).join('');
}

// Exportar reporte a CSV
function exportReport() {
    if (currentSalesData.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    let csv = 'Fecha,Producto,Cantidad,Método de Pago,Total,Moneda,Gestor\n';
    currentSalesData.forEach(sale => {
        csv += `${sale.date},${sale.productName},${sale.quantity},${sale.paymentMethod},${sale.totalAmount},${sale.currency},${sale.sellerCode || '-'}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ Reporte exportado exitosamente');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}