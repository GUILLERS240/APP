// Cargar gestores al iniciar
async function loadSellers() {
    try {
        const sellers = await getData(STORES.SELLERS);
        const payments = await getData(STORES.PENDING_PAYMENTS);
        
        await displaySellers(sellers, payments);
        updateStats(sellers, payments);
    } catch (error) {
        console.error('Error loading sellers:', error);
        const grid = document.getElementById('sellersGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>❌ Error al cargar gestores</p>
                </div>
            `;
        }
    }
}

// Actualizar estadísticas
function updateStats(sellers, payments) {
    const totalSellers = sellers ? sellers.length : 0;
    const pendingPayments = payments ? payments.filter(p => !p.paid) : [];
    const paidPayments = payments ? payments.filter(p => p.paid) : [];
    
    const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const totalSellersElem = document.getElementById('totalSellers');
    const totalPendingElem = document.getElementById('totalPending');
    const totalPaidElem = document.getElementById('totalPaid');
    
    if (totalSellersElem) totalSellersElem.innerText = totalSellers;
    if (totalPendingElem) totalPendingElem.innerText = `${totalPending.toFixed(2)} CUP`;
    if (totalPaidElem) totalPaidElem.innerText = `${totalPaid.toFixed(2)} CUP`;
}

// Mostrar gestores en grid con sus comisiones
async function displaySellers(sellers, payments) {
    const grid = document.getElementById('sellersGrid');
    if (!grid) return;
    
    const currentCommission = await getCommissionPercentage();
    
    if (!sellers || sellers.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>📋 No hay gestores registrados</p>
                <button class="btn-primary" onclick="showSellerModal()" style="margin-top: 15px;">+ Agregar primer gestor</button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = sellers.map(seller => {
        const sellerPayments = payments ? payments.filter(p => p.sellerCode === seller.code) : [];
        const pendingPayments = sellerPayments.filter(p => !p.paid);
        const paidPayments = sellerPayments.filter(p => p.paid);
        const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalCommission = totalPending + totalPaid;
        const recentPayments = sellerPayments
            .sort((a, b) => (b.timestamp || new Date(b.saleDate)) - (a.timestamp || new Date(a.saleDate)))
            .slice(0, 5);
        
        return `
            <div class="seller-card">
                <div class="seller-header">
                    <div class="seller-name">${escapeHtml(seller.name)} ${escapeHtml(seller.lastname)}</div>
                    <div class="seller-code">${seller.code}</div>
                </div>
                <div class="seller-body">
                    <div class="seller-info">
                        <div class="seller-info-item">
                            <strong>📱 TELÉFONO</strong>
                            ${seller.phone}
                        </div>
                        <div class="seller-info-item">
                            <strong>💳 TARJETA</strong>
                            ${seller.cardNumber || 'No registrada'}
                        </div>
                    </div>
                    
                    <div class="commission-box">
                        <h4>💰 COMISIONES (${currentCommission}% del precio base)</h4>
                        <div class="commission-row">
                            <span>Total generado:</span>
                            <strong>${totalCommission.toFixed(2)} CUP</strong>
                        </div>
                        <div class="commission-row">
                            <span>Pendiente de pago:</span>
                            <strong class="commission-amount">${totalPending.toFixed(2)} CUP</strong>
                        </div>
                        <div class="commission-row">
                            <span>Ya pagado:</span>
                            <span>${totalPaid.toFixed(2)} CUP</span>
                        </div>
                        
                        ${totalPending > 0 ? `
                            <button class="btn-primary btn-pay" onclick="paySeller('${seller.code}', '${escapeHtml(seller.name)} ${escapeHtml(seller.lastname)}', ${totalPending})">
                                💵 Pagar ${totalPending.toFixed(2)} CUP
                            </button>
                        ` : '<button class="btn-primary btn-pay" disabled>✅ Sin pagos pendientes</button>'}
                    </div>
                    
                    <div class="payment-history">
                        <h5>📜 ÚLTIMOS MOVIMIENTOS</h5>
                        ${recentPayments.length > 0 ? recentPayments.map(p => {
                            const date = new Date(p.saleDate || p.date);
                            const dateStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                            return `
                                <div class="payment-item">
                                    <div>
                                        <div>${dateStr}</div>
                                        <small>${p.productName || 'Producto'} x${p.quantity || 1}</small>
                                    </div>
                                    <div style="text-align: right;">
                                        <div class="payment-amount">${(p.amount || 0).toFixed(2)} CUP</div>
                                        <span class="${p.paid ? 'badge-paid' : 'badge-pending'}">${p.paid ? 'Pagado' : 'Pendiente'}</span>
                                    </div>
                                </div>
                            `;
                        }).join('') : '<div style="text-align: center; color: #999; padding: 15px;">Sin ventas registradas</div>'}
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn-warning" onclick="editSeller(${seller.id})">✏️ Editar</button>
                        <button class="btn-danger" onclick="deleteSeller(${seller.id})">🗑️ Eliminar</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Pagar a un gestor
async function paySeller(sellerCode, sellerName, amount) {
    const confirmPay = confirm(`✅ Confirmar pago\n\nGestor: ${sellerName}\nMonto: ${amount.toFixed(2)} CUP\n\n¿Desea marcar todas sus comisiones como pagadas?`);
    
    if (!confirmPay) return;
    
    try {
        const payments = await getData(STORES.PENDING_PAYMENTS);
        const sellerPayments = payments.filter(p => p.sellerCode === sellerCode && !p.paid);
        
        if (sellerPayments.length === 0) {
            alert('No hay pagos pendientes para este gestor');
            return;
        }
        
        for (const payment of sellerPayments) {
            payment.paid = true;
            payment.paidDate = new Date().toISOString();
            await updateData(STORES.PENDING_PAYMENTS, payment);
        }
        
        alert(`✅ Pago realizado exitosamente a ${sellerName}\nMonto: ${amount.toFixed(2)} CUP\nTransacciones: ${sellerPayments.length}`);
        await loadSellers();
        
    } catch (error) {
        console.error('Error al procesar pago:', error);
        alert('❌ Error al procesar el pago: ' + error.message);
    }
}

// Generar código automático
function generateCode(name, lastname, phone) {
    if (!name || !lastname || !phone) return '';
    const firstLetterName = name.charAt(0).toUpperCase();
    const firstLetterLastname = lastname.charAt(0).toUpperCase();
    const phoneStr = phone.toString();
    const firstDigitPhone = phoneStr.replace(/\D/g, '').charAt(0);
    return `${firstLetterName}${firstLetterLastname}${firstDigitPhone}`;
}

// Verificar si el código ya existe
async function getUniqueCode(baseCode, excludeId = null) {
    const sellers = await getData(STORES.SELLERS);
    let finalCode = baseCode;
    let counter = 1;
    
    let existingSellers = sellers;
    if (excludeId) {
        existingSellers = sellers.filter(s => s.id !== excludeId);
    }
    
    while (existingSellers.some(s => s.code === finalCode)) {
        counter++;
        finalCode = `${baseCode}-${counter}`;
    }
    
    return finalCode;
}

// Configurar generación automática de código
function setupCodeGeneration() {
    const nameInput = document.getElementById('sellerName');
    const lastnameInput = document.getElementById('sellerLastname');
    const phoneInput = document.getElementById('sellerPhone');
    const codeInput = document.getElementById('sellerCode');
    
    if (!nameInput || !lastnameInput || !phoneInput || !codeInput) return;
    
    function updateCode() {
        const name = nameInput.value.trim();
        const lastname = lastnameInput.value.trim();
        const phone = phoneInput.value.trim();
        
        if (name && lastname && phone) {
            const baseCode = generateCode(name, lastname, phone);
            codeInput.value = baseCode;
        } else {
            codeInput.value = '';
        }
    }
    
    nameInput.addEventListener('input', updateCode);
    lastnameInput.addEventListener('input', updateCode);
    phoneInput.addEventListener('input', updateCode);
}

// Mostrar modal
async function showSellerModal(seller = null) {
    const modal = document.getElementById('sellerModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('sellerForm');
    
    if (!modal) return;
    
    form.reset();
    document.getElementById('sellerId').value = '';
    document.getElementById('sellerCode').value = '';
    
    if (seller) {
        modalTitle.textContent = 'Editar Gestor de Venta';
        document.getElementById('sellerId').value = seller.id;
        document.getElementById('sellerName').value = seller.name;
        document.getElementById('sellerLastname').value = seller.lastname;
        document.getElementById('sellerPhone').value = seller.phone;
        document.getElementById('sellerCard').value = seller.cardNumber || '';
        
        const baseCode = generateCode(seller.name, seller.lastname, seller.phone);
        const uniqueCode = await getUniqueCode(baseCode, seller.id);
        document.getElementById('sellerCode').value = uniqueCode;
    } else {
        modalTitle.textContent = 'Nuevo Gestor de Venta';
    }
    
    modal.classList.add('show');
}

function closeSellerModal() {
    const modal = document.getElementById('sellerModal');
    if (modal) modal.classList.remove('show');
    const form = document.getElementById('sellerForm');
    if (form) form.reset();
}

// Guardar gestor
async function saveSeller(event) {
    event.preventDefault();
    
    const sellerId = document.getElementById('sellerId').value;
    const name = document.getElementById('sellerName').value.trim();
    const lastname = document.getElementById('sellerLastname').value.trim();
    const phone = document.getElementById('sellerPhone').value.trim();
    const cardNumber = document.getElementById('sellerCard').value.trim();
    let code = document.getElementById('sellerCode').value.trim();
    
    if (!name) { alert('El nombre es obligatorio'); return; }
    if (!lastname) { alert('Los apellidos son obligatorios'); return; }
    if (!phone) { alert('El número de móvil es obligatorio'); return; }
    if (!code) { alert('Debe generar un código válido'); return; }
    
    const sellerData = {
        name, lastname, phone,
        cardNumber: cardNumber || null,
        code,
        updatedAt: new Date().toISOString()
    };
    
    if (sellerId) {
        sellerData.id = parseInt(sellerId);
        await updateData(STORES.SELLERS, sellerData);
        alert('✅ Gestor actualizado exitosamente');
        closeSellerModal();
        loadSellers();
    } else {
        const sellers = await getData(STORES.SELLERS);
        const codeExists = sellers.some(s => s.code === code);
        
        if (codeExists) {
            const baseCode = generateCode(name, lastname, phone);
            const uniqueCode = await getUniqueCode(baseCode);
            code = uniqueCode;
            sellerData.code = code;
            alert(`⚠️ El código ya existía. Se ha generado automáticamente: ${code}`);
        }
        
        sellerData.createdAt = new Date().toISOString();
        await addNewSeller(sellerData);
    }
}

async function addNewSeller(sellerData) {
    try {
        await saveData(STORES.SELLERS, sellerData);
        alert('✅ Gestor añadido exitosamente');
        closeSellerModal();
        loadSellers();
    } catch (error) {
        console.error('Error saving seller:', error);
        alert('❌ Error al guardar el gestor');
    }
}

async function editSeller(id) {
    try {
        const sellers = await getData(STORES.SELLERS);
        const seller = sellers.find(s => s.id === id);
        if (seller) showSellerModal(seller);
        else alert('Gestor no encontrado');
    } catch (error) {
        console.error('Error editing seller:', error);
        alert('Error al cargar el gestor');
    }
}

async function deleteSeller(id) {
    if (confirm('¿Está seguro de eliminar este gestor? Esta acción no se puede deshacer.')) {
        try {
            await deleteData(STORES.SELLERS, parseInt(id));
            alert('✅ Gestor eliminado exitosamente');
            await loadSellers();
        } catch (error) {
            console.error('Error al eliminar gestor:', error);
            alert('❌ Error al eliminar el gestor');
        }
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mostrar porcentaje de comisión actual en la interfaz de gestores
async function displayCurrentCommissionPercentage() {
    const percentage = await getCommissionPercentage();
    const commissionHint = document.querySelector('.commission-hint');
    if (commissionHint) {
        commissionHint.innerHTML = `💰 Los gestores reciben el <strong>${percentage}%</strong> del precio base en USD convertido a CUP`;
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sellers.js inicializado');
    loadSellers();
    setupCodeGeneration();
    
    const sellerForm = document.getElementById('sellerForm');
    if (sellerForm) sellerForm.addEventListener('submit', saveSeller);
    
    window.onclick = function(event) {
        const sellerModal = document.getElementById('sellerModal');
        if (event.target === sellerModal) closeSellerModal();
    };
});