let weeklyChart = null;
let paymentChartDashboard = null;

// Cargar datos del dashboard
async function loadDashboard() {
    try {
        const sales = await getData(STORES.SALES);
        const products = await getData(STORES.PRODUCTS);
        const sellers = await getData(STORES.SELLERS);
        const payments = await getData(STORES.PENDING_PAYMENTS);
        const exchangeRates = await getData(STORES.EXCHANGE_RATES);
        
        // Calcular ventas de hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= today;
        });
        const todayTotal = todaySales.reduce((sum, sale) => {
            if (sale.currency === 'USD') return sum + sale.totalAmount;
            return sum;
        }, 0);
        
        // Calcular ventas del mes
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= startOfMonth;
        });
        const monthTotal = monthSales.reduce((sum, sale) => {
            if (sale.currency === 'USD') return sum + sale.totalAmount;
            return sum;
        }, 0);
        
        // Stock total
        const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
        
        // Comisiones pendientes
        const pendingPayments = payments ? payments.filter(p => !p.paid) : [];
        const pendingTotal = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        // Tipo de cambio actual
        let exchangeRate = 320;
        if (exchangeRates && exchangeRates.length > 0) {
            const latestRate = exchangeRates.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            exchangeRate = latestRate.rate;
        }
        
        // Verificar stock bajo
        const lowStockProducts = products.filter(p => p.stock < 5 && p.stock > 0);
        const stockAlert = document.getElementById('stockAlert');
        if (lowStockProducts.length > 0) {
            stockAlert.style.display = 'flex';
        } else {
            stockAlert.style.display = 'none';
        }
        
        // Actualizar estadísticas
        document.getElementById('todaySales').innerHTML = `$${todayTotal.toFixed(2)}`;
        document.getElementById('monthSales').innerHTML = `$${monthTotal.toFixed(2)}`;
        document.getElementById('activeSellers').innerHTML = sellers ? sellers.length : 0;
        document.getElementById('totalStock').innerHTML = totalStock;
        document.getElementById('pendingCommissions').innerHTML = pendingTotal.toFixed(2);
        document.getElementById('exchangeRate').innerHTML = exchangeRate;
        
        // Actualizar gráficos
        updateWeeklyChart(sales);
        updatePaymentChartDashboard(sales);
        
        // Actualizar tabla de últimas ventas
        updateRecentSalesTable(sales);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Gráfico de ventas semanales
function updateWeeklyChart(sales) {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    
    // Obtener últimos 7 días
    const days = [];
    const salesData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dayName = date.toLocaleDateString('es', { weekday: 'short' });
        days.push(dayName);
        
        const daySales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= date && saleDate < new Date(date.getTime() + 86400000);
        });
        
        const total = daySales.reduce((sum, sale) => {
            if (sale.currency === 'USD') return sum + sale.totalAmount;
            return sum;
        }, 0);
        
        salesData.push(total);
    }
    
    if (weeklyChart) weeklyChart.destroy();
    
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Ventas (USD)',
                data: salesData,
                backgroundColor: 'rgba(102, 126, 234, 0.7)',
                borderRadius: 8
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
function updatePaymentChartDashboard(sales) {
    const ctx = document.getElementById('paymentChartDashboard').getContext('2d');
    
    const paymentMethods = {};
    sales.forEach(sale => {
        let methodName = sale.paymentMethod;
        switch(methodName) {
            case 'USD': methodName = 'USD'; break;
            case 'CUP_Efectivo': methodName = 'CUP'; break;
            case 'CUP_Transferencia': methodName = 'CUP Transf'; break;
            case 'MLC': methodName = 'MLC'; break;
            case 'PayPal': methodName = 'PayPal'; break;
            case 'Zelle': methodName = 'Zelle'; break;
            case 'TropiPay': methodName = 'TropiPay'; break;
        }
        paymentMethods[methodName] = (paymentMethods[methodName] || 0) + 1;
    });
    
    if (paymentChartDashboard) paymentChartDashboard.destroy();
    
    paymentChartDashboard = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(paymentMethods),
            datasets: [{
                data: Object.values(paymentMethods),
                backgroundColor: ['#667eea', '#764ba2', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1']
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

// Tabla de últimas ventas
function updateRecentSalesTable(sales) {
    const tbody = document.getElementById('recentSalesTable');
    const recentSales = sales.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
    
    if (recentSales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay ventas registradas</td></tr>';
        return;
    }
    
    tbody.innerHTML = recentSales.map(sale => {
        const date = new Date(sale.date);
        const dateFormatted = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        let methodName = '';
        switch(sale.paymentMethod) {
            case 'USD': methodName = 'USD'; break;
            case 'CUP_Efectivo': methodName = 'CUP Efec'; break;
            case 'CUP_Transferencia': methodName = 'CUP Transf'; break;
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
                <td><span style="background: #e8eef9; padding: 4px 8px; border-radius: 12px; font-size: 11px;">${methodName}</span></td>
                <td><strong>${sale.totalAmount.toFixed(2)} ${sale.currency}</strong></td>
                <td>${sale.sellerCode || '-'}</td>
            </tr>
        `;
    }).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-refresh cada 30 segundos
let refreshInterval = null;

function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        loadDashboard();
    }, 30000);
}

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard.js inicializado');
    await initDatabase();
    await loadDashboard();
    startAutoRefresh();
});