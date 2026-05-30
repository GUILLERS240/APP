// Cargar productos al iniciar
async function loadProducts() {
    try {
        const products = await getData(STORES.PRODUCTS);
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsGrid').innerHTML = `
            <div class="product-card">
                <div class="product-info" style="text-align: center; padding: 40px;">
                    <p>Error al cargar productos</p>
                </div>
            </div>
        `;
    }
}

// Mostrar productos en el grid
function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    
    if (!products || products.length === 0) {
        grid.innerHTML = `
            <div class="product-card">
                <div class="product-info" style="text-align: center; padding: 40px;">
                    <p>No hay productos registrados</p>
                    <button class="btn-primary" onclick="showProductModal()" style="margin-top: 10px;">Agregar primer producto</button>
                </div>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="product-card">
            ${product.imageUrl ? `<img src="${product.imageUrl}" class="product-image" alt="${product.name}">` : '<div class="product-image" style="display: flex; align-items: center; justify-content: center; background: #f0f0f0;"><span style="color: #999;">📷 Sin imagen</span></div>'}
            <div class="product-info">
                <div class="product-name">${escapeHtml(product.name)}</div>
                <div class="product-description">${escapeHtml(product.description || 'Sin descripción')}</div>
                <div class="product-price">$${product.price} USD</div>
                <div class="product-stock">Stock: ${product.stock} unidades</div>
                <div class="product-actions">
                    <button class="btn-warning" onclick="editProduct(${product.id})">✏️ Editar</button>
                    <button class="btn-danger" onclick="deleteProduct(${product.id})">🗑️ Eliminar</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mostrar modal para nuevo/editar producto
function showProductModal(product = null) {
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('productForm');
    
    form.reset();
    document.getElementById('productId').value = '';
    document.getElementById('currentImage').style.display = 'none';
    
    if (product) {
        modalTitle.textContent = 'Editar Producto';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        
        if (product.imageUrl) {
            document.getElementById('currentImagePreview').src = product.imageUrl;
            document.getElementById('currentImage').style.display = 'block';
        }
    } else {
        modalTitle.textContent = 'Nuevo Producto';
    }
    
    modal.classList.add('show');
}

// Cerrar modal de producto
function closeProductModal() {
    document.getElementById('productModal').classList.remove('show');
    document.getElementById('productForm').reset();
}

// Guardar producto (sin clave)
async function saveProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const imageFile = document.getElementById('productImage').files[0];
    
    // Validaciones
    if (!name) {
        alert('El nombre del producto es obligatorio');
        return;
    }
    if (isNaN(price) || price <= 0) {
        alert('El precio debe ser mayor a 0');
        return;
    }
    if (isNaN(stock) || stock < 0) {
        alert('El stock no puede ser negativo');
        return;
    }
    
    let imageUrl = null;
    
    // Procesar imagen si se seleccionó
    if (imageFile) {
        if (imageFile.size > 2 * 1024 * 1024) {
            alert('La imagen no puede superar los 2MB');
            return;
        }
        
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(imageFile.type)) {
            alert('Formato de imagen no válido. Use JPG, PNG o GIF');
            return;
        }
        
        imageUrl = await saveImageToLocal(imageFile);
    } else if (productId) {
        // Si es edición y no se subió nueva imagen, mantener la anterior
        const existingProduct = await getProductById(parseInt(productId));
        if (existingProduct && existingProduct.imageUrl) {
            imageUrl = existingProduct.imageUrl;
        }
    }
    
    const productData = {
        name,
        description,
        price,
        stock,
        imageUrl,
        updatedAt: new Date().toISOString()
    };
    
    if (productId) {
        // Editar producto existente - SIN CLAVE
        productData.id = parseInt(productId);
        await updateData(STORES.PRODUCTS, productData);
        alert('✅ Producto actualizado exitosamente');
        closeProductModal();
        loadProducts();
    } else {
        // Nuevo producto
        productData.createdAt = new Date().toISOString();
        await addNewProduct(productData);
    }
}

// Añadir nuevo producto
async function addNewProduct(productData) {
    try {
        await saveData(STORES.PRODUCTS, productData);
        alert('✅ Producto añadido exitosamente');
        closeProductModal();
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        alert('❌ Error al guardar el producto');
    }
}

// Obtener producto por ID
async function getProductById(id) {
    const products = await getData(STORES.PRODUCTS);
    return products.find(p => p.id === id);
}

// Guardar imagen en localStorage
function saveImageToLocal(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Editar producto
async function editProduct(id) {
    try {
        const products = await getData(STORES.PRODUCTS);
        const product = products.find(p => p.id === id);
        if (product) {
            showProductModal(product);
        } else {
            alert('Producto no encontrado');
        }
    } catch (error) {
        console.error('Error editing product:', error);
        alert('Error al cargar el producto');
    }
}

// Eliminar producto - SIN CLAVE
async function deleteProduct(id) {
    if (confirm('¿Está seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
        try {
            const idToDelete = parseInt(id);
            console.log('Intentando eliminar producto con ID:', idToDelete);
            
            const products = await getData(STORES.PRODUCTS);
            const productExists = products.find(p => p.id === idToDelete);
            
            if (!productExists) {
                alert('⚠️ El producto ya no existe o no se encontró');
                return;
            }
            
            await deleteData(STORES.PRODUCTS, idToDelete);
            console.log('Producto eliminado exitosamente');
            alert('✅ Producto eliminado exitosamente');
            await loadProducts();
            
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            alert('❌ Error al eliminar el producto: ' + error.message);
        }
    }
}

// Inicializar eventos
document.addEventListener('DOMContentLoaded', () => {
    console.log('Products.js inicializado - Sin clave de seguridad');
    loadProducts();
    
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', saveProduct);
    }
    
    // Cerrar modal al hacer clic fuera
    window.onclick = function(event) {
        const productModal = document.getElementById('productModal');
        if (event.target === productModal) {
            closeProductModal();
        }
    };
});