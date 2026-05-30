// ========== COPIA DE SEGURIDAD (EXPORTAR/IMPORTAR) - VERSIÓN CON ESTILOS UNIFICADOS ==========

(function() {
    // Lista de stores a respaldar
    const STORES_TO_BACKUP = [
        'products',
        'sales',
        'sellers',
        'exchange_rates',
        'pending_payments',
        'payment_methods'
    ];

    // Esperar a que la base de datos esté lista
    function waitForDatabase() {
        return new Promise((resolve) => {
            if (typeof getData !== 'undefined' && typeof saveData !== 'undefined' && typeof deleteData !== 'undefined') {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (typeof getData !== 'undefined' && typeof saveData !== 'undefined' && typeof deleteData !== 'undefined') {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    // Obtener todos los datos
    async function getAllData() {
        const allData = {};
        for (const store of STORES_TO_BACKUP) {
            try {
                const data = await getData(store);
                allData[store] = data || [];
            } catch (e) {
                console.warn(`Error al leer store ${store}:`, e);
                allData[store] = [];
            }
        }
        return allData;
    }

    // Exportar backup
    async function exportBackup() {
        try {
            const allData = await getAllData();
            const backup = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                data: allData
            };
            const jsonStr = JSON.stringify(backup, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `totalbiz_backup_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('✅ Copia de seguridad exportada correctamente.');
        } catch (error) {
            console.error(error);
            alert('❌ Error al exportar la copia de seguridad.');
        }
    }

    // Limpiar stores
    async function clearAllStores() {
        for (const store of STORES_TO_BACKUP) {
            try {
                const items = await getData(store);
                for (const item of items) {
                    if (item.id !== undefined) {
                        await deleteData(store, item.id);
                    }
                }
            } catch (e) {
                console.warn(`No se pudo limpiar ${store}:`, e);
            }
        }
    }

    // Importar backup
    async function importBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    if (!backup.data || typeof backup.data !== 'object') {
                        throw new Error('Archivo no válido: falta "data".');
                    }
                    alert('Restaurando datos...');
                    await clearAllStores();
                    for (const store of STORES_TO_BACKUP) {
                        const storeData = backup.data[store];
                        if (Array.isArray(storeData)) {
                            for (const item of storeData) {
                                const { id, ...newItem } = item;
                                await saveData(store, newItem);
                            }
                        }
                    }
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Error al leer archivo'));
            reader.readAsText(file);
        });
    }

    // Disparar importación
    function triggerImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!confirm('⚠️ Se reemplazarán TODOS los datos. ¿Desea continuar?')) return;
            try {
                await importBackup(file);
                alert('✅ Importación exitosa. La página se recargará.');
                window.location.reload();
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        };
        input.click();
    }

    // Inyectar estilos comunes para todos los botones del header
    function injectUnifiedButtonStyles() {
        if (document.getElementById('unified-btn-styles')) return;
        const style = document.createElement('style');
        style.id = 'unified-btn-styles';
        style.textContent = `
            /* Estilos unificados para todos los botones dentro de .header-actions */
            .header-actions button,
            .header-actions .dark-mode-toggle,
            .header-actions .reset-btn,
            .header-actions .logout-btn,
            .header-actions .backup-export-btn,
            .header-actions .backup-import-btn {
                background: #f8f9fa;
                border: 1px solid #ddd;
                color: #333;
                padding: 8px 16px;
                border-radius: 30px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                width: auto;
                margin: 0 4px;
            }
            /* Colores específicos para cada tipo (opcional) */
            .header-actions .backup-export-btn {
                background: #28a745;
                color: white;
                border-color: #28a745;
            }
            .header-actions .backup-import-btn {
                background: #17a2b8;
                color: white;
                border-color: #17a2b8;
            }
            .header-actions .reset-btn {
                background: #dc3545;
                color: white;
                border-color: #dc3545;
            }
            .header-actions .logout-btn {
                background: #6c757d;
                color: white;
                border-color: #6c757d;
            }
            .header-actions .dark-mode-toggle {
                background: #f8f9fa;
                color: #333;
                border-color: #ddd;
            }
            .header-actions .dark-mode-toggle.active {
                background: #667eea;
                color: white;
                border-color: #667eea;
            }
            /* Hover */
            .header-actions button:hover {
                transform: translateY(-2px);
                opacity: 0.9;
            }
            /* Modo oscuro */
            body.dark-mode .header-actions button {
                background: #2a2a3a;
                color: #eee;
                border-color: #3a3a4a;
            }
            body.dark-mode .header-actions .backup-export-btn {
                background: #2c6e2c;
            }
            body.dark-mode .header-actions .backup-import-btn {
                background: #1a7a8a;
            }
            body.dark-mode .header-actions .reset-btn {
                background: #a71d2a;
            }
            body.dark-mode .header-actions .logout-btn {
                background: #4a525a;
            }
            body.dark-mode .header-actions .dark-mode-toggle {
                background: #2a2a3a;
                color: #eee;
            }
            body.dark-mode .header-actions .dark-mode-toggle.active {
                background: #667eea;
                color: white;
            }
        `;
        document.head.appendChild(style);
    }

    // Agregar botones de backup al header
    function addBackupButtonsToHeader() {
        let headerActions = document.querySelector('.header-actions');
        if (!headerActions) {
            const header = document.querySelector('.dashboard-header');
            if (header) {
                headerActions = document.createElement('div');
                headerActions.className = 'header-actions';
                header.appendChild(headerActions);
            }
        }
        if (!headerActions) return;
        if (document.querySelector('.backup-export-btn')) return;

        // Inyectar estilos comunes
        injectUnifiedButtonStyles();

        const exportBtn = document.createElement('button');
        exportBtn.className = 'backup-export-btn';
        exportBtn.innerHTML = '📤 Exportar Copia';
        exportBtn.onclick = exportBackup;

        const importBtn = document.createElement('button');
        importBtn.className = 'backup-import-btn';
        importBtn.innerHTML = '📥 Importar Copia';
        importBtn.onclick = triggerImport;

        // Insertar antes del botón de modo oscuro (si existe) o al inicio
        const darkModeBtn = headerActions.querySelector('.dark-mode-toggle, .dark-mode-btn');
        if (darkModeBtn) {
            headerActions.insertBefore(importBtn, darkModeBtn);
            headerActions.insertBefore(exportBtn, importBtn);
        } else {
            headerActions.insertBefore(importBtn, headerActions.firstChild);
            headerActions.insertBefore(exportBtn, importBtn);
        }
    }

    // Botón flotante para páginas sin header
    function addFloatingBackupButton() {
        if (document.querySelector('.floating-backup-container')) return;
        if (document.querySelector('.header-actions')) return;
        const container = document.createElement('div');
        container.className = 'floating-backup-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 80px;
            display: flex;
            gap: 10px;
            z-index: 999;
        `;
        const exportBtn = document.createElement('button');
        exportBtn.innerHTML = '📤';
        exportBtn.title = 'Exportar copia';
        exportBtn.onclick = exportBackup;
        exportBtn.style.cssText = `
            width: 45px; height: 45px; border-radius: 50%;
            background: #28a745; color: white; border: none;
            font-size: 20px; cursor: pointer;
        `;
        const importBtn = document.createElement('button');
        importBtn.innerHTML = '📥';
        importBtn.title = 'Importar copia';
        importBtn.onclick = triggerImport;
        importBtn.style.cssText = `
            width: 45px; height: 45px; border-radius: 50%;
            background: #17a2b8; color: white; border: none;
            font-size: 20px; cursor: pointer;
        `;
        container.appendChild(exportBtn);
        container.appendChild(importBtn);
        document.body.appendChild(container);
    }

    // Inicialización
    async function initBackup() {
        await waitForDatabase();
        setTimeout(() => {
            addBackupButtonsToHeader();
            addFloatingBackupButton();
        }, 300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBackup);
    } else {
        initBackup();
    }
})();