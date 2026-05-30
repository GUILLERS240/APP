// ========== SOPORTE TÉCNICO Y TÉRMINOS LEGALES ==========
// El botón de WhatsApp SOLO aparece en la página de login (index.html)

(function() {
    console.log('Support.js: inicializando...');

    // Configuración
    const WHATSAPP_NUMBER = '5355822230';
    const WHATSAPP_MESSAGE = 'HOLA ES EL SOPORTE DE TOTALBIZ EN QUE LE PODEMOS AYUDAR';
    const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

    // Verificar si estamos en la página de login
    function isLoginPage() {
        const path = window.location.pathname;
        // Está en index.html o en la raíz
        return path === '/' || path === '/index.html' || path.endsWith('index.html') || 
               (path === '' || path === '/') || document.getElementById('loginForm') !== null;
    }

    // 1. Crear botón de WhatsApp SOLO en login
    function createWhatsAppButton() {
        // Solo crear si estamos en la página de login
        if (!isLoginPage()) {
            console.log('WhatsApp button: no se muestra en páginas internas');
            return;
        }

        if (document.querySelector('.whatsapp-float')) {
            console.log('WhatsApp button already exists');
            return;
        }

        const btn = document.createElement('a');
        btn.className = 'whatsapp-float';
        btn.href = WHATSAPP_URL;
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        btn.innerHTML = '💬';
        btn.title = 'Soporte por WhatsApp';
        
        // Estilos en línea con alta prioridad
        btn.style.cssText = `
            position: fixed !important;
            bottom: 20px !important;
            left: 20px !important;
            width: 55px !important;
            height: 55px !important;
            border-radius: 50% !important;
            background: #25D366 !important;
            color: white !important;
            font-size: 28px !important;
            text-decoration: none !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3) !important;
            z-index: 9999 !important;
            transition: transform 0.3s !important;
            font-family: sans-serif !important;
        `;
        
        btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
        btn.onmouseleave = () => btn.style.transform = 'scale(1)';
        
        document.body.appendChild(btn);
        console.log('WhatsApp button created in login page');
    }

    // 2. Añadir enlace de términos al footer (en todas las páginas)
    function addTermsLinkToFooter() {
        let footer = document.querySelector('.copyright-footer');
        if (!footer) {
            footer = document.querySelector('.footer, .copyright, footer');
            if (!footer) {
                footer = document.createElement('div');
                footer.className = 'copyright-footer';
                footer.style.cssText = 'text-align: center; padding: 10px; background: rgba(0,0,0,0.7); color: white; font-size: 12px; position: fixed; bottom: 0; width: 100%; z-index: 1000;';
                document.body.appendChild(footer);
                console.log('Footer creado automáticamente');
            }
        }

        if (footer.querySelector('.terms-link')) return;

        const link = document.createElement('a');
        link.href = '#';
        link.className = 'terms-link';
        link.textContent = 'Términos y Condiciones';
        link.style.cssText = `
            color: #ffd966 !important;
            text-decoration: underline !important;
            margin-left: 15px !important;
            cursor: pointer !important;
        `;
        link.onclick = (e) => {
            e.preventDefault();
            showTermsModal();
        };

        const firstP = footer.querySelector('p');
        if (firstP) {
            firstP.appendChild(document.createTextNode(' | '));
            firstP.appendChild(link);
        } else {
            const originalHTML = footer.innerHTML;
            footer.innerHTML = `<p>${originalHTML} | </p>`;
            footer.querySelector('p').appendChild(link);
        }
        console.log('Términos link added to footer');
    }

    // 3. Modal de términos y condiciones
    function showTermsModal() {
        if (document.getElementById('termsModal')) {
            document.getElementById('termsModal').style.display = 'flex';
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'termsModal';
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        modal.innerHTML = `
            <div class="modal-content" style="background: white; border-radius: 15px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; padding: 20px;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; margin-bottom: 15px;">
                    <h2 style="color: #667eea;">Términos y Condiciones</h2>
                    <span class="close-modal" style="font-size: 28px; cursor: pointer;">&times;</span>
                </div>
                <div class="modal-body" style="padding: 10px;">
                    <h3>1. Aceptación de los términos</h3>
                    <p>Al utilizar el sistema TotalBiz, usted acepta estos términos y condiciones en su totalidad.</p>

                    <h3>2. Uso del sistema</h3>
                    <p>El sistema TotalBiz es una herramienta de gestión de ventas proporcionada "tal cual". El usuario es responsable del uso que haga del mismo.</p>

                    <h3>3. Manipulación del código</h3>
                    <p>Queda estrictamente prohibido modificar, descompilar, realizar ingeniería inversa o alterar el código fuente del sistema sin autorización expresa. En caso de manipulación, el desarrollador no se hace responsable por pérdida de datos, fallos de seguridad o mal funcionamiento.</p>

                    <h3>4. Responsabilidad sobre los datos</h3>
                    <p>El usuario es el único responsable de la veracidad, integridad y seguridad de los datos ingresados en el sistema. Se recomienda realizar copias de seguridad periódicas.</p>

                    <h3>5. Limitación de responsabilidad</h3>
                    <p>El desarrollador no será responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso del sistema, incluida la pérdida de beneficios o datos.</p>

                    <h3>6. Cambios en los términos</h3>
                    <p>El desarrollador se reserva el derecho de modificar estos términos en cualquier momento. Se notificará a los usuarios mediante la interfaz del sistema.</p>

                    <h3>7. Contacto</h3>
                    <p>Para cualquier consulta sobre estos términos, puede contactar a través del botón de WhatsApp disponible en la página de inicio.</p>

                    <p style="margin-top: 20px;"><strong>© 2026 TotalBiz - GUILLERMO RAMOS SANTOS</strong></p>
                </div>
                <div class="form-actions" style="margin-top: 20px; text-align: center;">
                    <button class="btn-primary close-terms-btn" style="background: #667eea; color: white; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer;">Cerrar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.close-modal');
        const closeBtn2 = modal.querySelector('.close-terms-btn');
        const closeModal = () => modal.remove();

        closeBtn.onclick = closeModal;
        closeBtn2.onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    }

    // Inicialización
    function initSupport() {
        console.log('Support.js: ejecutando initSupport');
        createWhatsAppButton(); // Solo se crea si es login
        addTermsLinkToFooter();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupport);
    } else {
        initSupport();
    }
})();