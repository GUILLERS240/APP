// ========== REEMPLAZO DE EMOJIS POR ICONOS PERSONALIZADOS ==========
(function() {
    // Mapa de emojis a rutas de iconos
    const iconMap = {
        '📦': 'products.png',
        '👥': 'sellers.png',
        '💰': 'sales.png',
        '📊': 'reports.png',
        '💱': 'exchange.png',
        '💳': 'payment.png',
        '❓': 'guide.png',
        '🔓': 'logout.png',
        '🌙': 'darkmode.png',
        '☀️': 'darkmode.png',
        '🔄': 'reset.png',
        '📤': 'export.png',
        '📥': 'import.png',
        '➕': 'add.png',
        '✏️': 'edit.png',
        '🗑️': 'delete.png',
        '💵': 'commission.png',
        '💬': 'whatsapp.png',
        '🏠': 'home.png'
    };

    // Función para reemplazar emojis en un elemento por imágenes
    function replaceEmojisInElement(element) {
        if (!element || element.nodeType !== 1) return;
        // Evitar procesar elementos que ya contienen imágenes
        if (element.querySelector('img.icon-replaced')) return;
        
        // Recorrer nodos de texto dentro del elemento
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // No procesar nodos dentro de etiquetas script o style
                    if (node.parentElement.tagName === 'SCRIPT' || node.parentElement.tagName === 'STYLE') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        const nodesToReplace = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            let text = node.textContent;
            let changed = false;
            for (const [emoji, iconFile] of Object.entries(iconMap)) {
                if (text.includes(emoji)) {
                    text = text.replace(new RegExp(emoji, 'g'), '');
                    changed = true;
                }
            }
            if (changed) {
                nodesToReplace.push({ node, newText: text.trim(), emojisFound: true });
            }
        }
        
        // Reemplazar cada nodo de texto por una imagen + el texto restante
        nodesToReplace.forEach(({ node, newText }) => {
            const parent = node.parentElement;
            const originalText = node.textContent;
            let remainingText = originalText;
            
            // Crear un fragmento para reconstruir el contenido
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            
            for (const [emoji, iconFile] of Object.entries(iconMap)) {
                let idx = remainingText.indexOf(emoji);
                while (idx !== -1) {
                    // Texto antes del emoji
                    if (idx > lastIndex) {
                        const textNode = document.createTextNode(remainingText.substring(lastIndex, idx));
                        fragment.appendChild(textNode);
                    }
                    // Imagen del icono
                    const img = document.createElement('img');
                    img.src = `../images/icons/${iconFile}`;
                    img.alt = emoji;
                    img.className = 'icon-replaced';
                    img.style.cssText = 'width: 20px; height: 20px; vertical-align: middle; margin: 0 4px; display: inline-block;';
                    // Si la imagen no carga, mostrar el emoji como fallback
                    img.onerror = function() {
                        this.style.display = 'none';
                        const fallback = document.createTextNode(emoji);
                        this.parentNode.insertBefore(fallback, this.nextSibling);
                    };
                    fragment.appendChild(img);
                    
                    lastIndex = idx + emoji.length;
                    idx = remainingText.indexOf(emoji, lastIndex);
                }
            }
            // Texto restante después del último emoji
            if (lastIndex < remainingText.length) {
                fragment.appendChild(document.createTextNode(remainingText.substring(lastIndex)));
            }
            
            parent.replaceChild(fragment, node);
        });
    }

    // Reemplazar emojis en todo el documento
    function replaceAllEmojis() {
        replaceEmojisInElement(document.body);
    }

    // Escuchar cambios dinámicos (para contenido agregado después)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // elemento
                    replaceEmojisInElement(node);
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', replaceAllEmojis);
    } else {
        replaceAllEmojis();
    }
})();