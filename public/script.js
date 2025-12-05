// API Base URL
const API_BASE = '/api';

// Global state
let currentSection = 'dashboard';
let productos = [];
let clientes = [];
let empleados = [];
let proveedores = [];
let ventas = [];
let compras = [];

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    loadDashboardData();
    loadProductos();
    loadClientes();
    loadEmpleados();
    loadProveedores();
    loadVentas();
    loadCompras();

    // Set dashboard as active section
    showSection('dashboard');
}

// Navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            showSection(section);

            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionId;
    }
}

// Toast Notifications
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${iconMap[type]}"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease forwards';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}

// Modal Functions
function showModal(title, content) {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');

    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    modalOverlay.classList.add('active');
}

function closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay.classList.remove('active');
}

// Close modal when clicking outside
document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Dashboard Functions
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE}/dashboard`);
        const data = await response.json();

        document.getElementById('total-productos').textContent = data.productos;
        document.getElementById('total-clientes').textContent = data.clientes;
        document.getElementById('total-empleados').textContent = data.empleados;
        document.getElementById('total-ventas').textContent = data.ventas;
        document.getElementById('monto-ventas').textContent = parseFloat(data.ventasMes.monto || 0).toFixed(2);
        document.getElementById('total-compras').textContent = data.compras;
        document.getElementById('monto-compras').textContent = parseFloat(data.comprasMes.monto || 0).toFixed(2);

        const ganancias = parseFloat(data.ventasMes.monto || 0) - parseFloat(data.comprasMes.monto || 0);
        document.getElementById('ganancias-mes').textContent = `$${ganancias.toFixed(2)}`;

        // Color code based on profit/loss
        const gananciasElement = document.getElementById('ganancias-mes');
        if (ganancias > 0) {
            gananciasElement.style.color = 'var(--success-color)';
        } else if (ganancias < 0) {
            gananciasElement.style.color = 'var(--danger-color)';
        } else {
            gananciasElement.style.color = 'var(--dark-color)';
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error al cargar datos del dashboard', 'error');
    }
}

// Product Functions
async function loadProductos() {
    try {
        const response = await fetch(`${API_BASE}/productos`);
        productos = await response.json();
        renderProductos();
    } catch (error) {
        console.error('Error loading productos:', error);
        document.getElementById('productos-table').innerHTML = `
            <tr>
                <td colspan="8" class="loading">Error al cargar productos</td>
            </tr>
        `;
    }
}

function renderProductos(productosToRender = productos) {
    const tbody = document.getElementById('productos-table');

    if (productosToRender.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="loading">No hay productos registrados</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = productosToRender.map(producto => `
        <tr>
            <td>${producto.codigo}</td>
            <td>${producto.descripcion}</td>
            <td>${producto.categoria}</td>
            <td>${producto.unidad_medida}</td>
            <td>${producto.existencia}</td>
            <td>$${parseFloat(producto.precio_c).toFixed(2)}</td>
            <td>$${parseFloat(producto.precio_v).toFixed(2)}</td>
            <td class="table-actions">
                <button class="btn btn-sm btn-info btn-icon" onclick="editProducto(${producto.codigo})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-icon" onclick="deleteProducto(${producto.codigo})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showAddProductModal() {
    const content = `
        <form id="product-form">
            <div class="form-group">
                <label for="product-codigo">Código:</label>
                <input type="number" id="product-codigo" name="codigo" required>
            </div>
            <div class="form-group">
                <label for="product-descripcion">Descripción:</label>
                <input type="text" id="product-descripcion" name="descripcion" required>
            </div>
            <div class="form-group">
                <label for="product-categoria">Categoría:</label>
                <select id="product-categoria" name="categoria" required>
                    <option value="">Seleccionar...</option>
                    <option value="fruta">Fruta</option>
                    <option value="verdura">Verdura</option>
                    <option value="otro">Otro</option>
                </select>
            </div>
            <div class="form-group">
                <label for="product-unidad">Unidad de Medida:</label>
                <select id="product-unidad" name="unidad_medida" required>
                    <option value="">Seleccionar...</option>
                    <option value="kilogramo">Kilogramo</option>
                    <option value="pieza">Pieza</option>
                    <option value="litro">Litro</option>
                    <option value="caja">Caja</option>
                </select>
            </div>
            <div class="form-group">
                <label for="product-existencia">Existencia:</label>
                <input type="number" id="product-existencia" name="existencia" required>
            </div>
            <div class="form-group">
                <label for="product-precio-c">Precio de Compra:</label>
                <input type="number" id="product-precio-c" name="precio_c" step="0.01" required>
            </div>
            <div class="form-group">
                <label for="product-precio-v">Precio de Venta:</label>
                <input type="number" id="product-precio-v" name="precio_v" step="0.01" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
        </form>
    `;

    showModal('Nuevo Producto', content);

    document.getElementById('product-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveProducto();
    });
}

async function saveProducto() {
    const form = document.getElementById('product-form');
    const formData = new FormData(form);
    const producto = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_BASE}/productos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(producto)
        });

        if (response.ok) {
            showToast('Producto agregado correctamente', 'success');
            closeModal();
            loadProductos();
        } else {
            const error = await response.json();
            showToast(error.error || 'Error al agregar producto', 'error');
        }
    } catch (error) {
        console.error('Error saving producto:', error);
        showToast('Error al guardar producto', 'error');
    }
}

async function editProducto(codigo) {
    const producto = productos.find(p => p.codigo === codigo);
    if (!producto) return;

    const content = `
        <form id="product-form">
            <input type="hidden" name="codigo" value="${producto.codigo}">
            <div class="form-group">
                <label for="product-descripcion">Descripción:</label>
                <input type="text" id="product-descripcion" name="descripcion" value="${producto.descripcion}" required>
            </div>
            <div class="form-group">
                <label for="product-categoria">Categoría:</label>
                <select id="product-categoria" name="categoria" required>
                    <option value="fruta" ${producto.categoria === 'fruta' ? 'selected' : ''}>Fruta</option>
                    <option value="verdura" ${producto.categoria === 'verdura' ? 'selected' : ''}>Verdura</option>
                    <option value="otro" ${producto.categoria === 'otro' ? 'selected' : ''}>Otro</option>
                </select>
            </div>
            <div class="form-group">
                <label for="product-unidad">Unidad de Medida:</label>
                <select id="product-unidad" name="unidad_medida" required>
                    <option value="kilogramo" ${producto.unidad_medida === 'kilogramo' ? 'selected' : ''}>Kilogramo</option>
                    <option value="pieza" ${producto.unidad_medida === 'pieza' ? 'selected' : ''}>Pieza</option>
                    <option value="litro" ${producto.unidad_medida === 'litro' ? 'selected' : ''}>Litro</option>
                    <option value="caja" ${producto.unidad_medida === 'caja' ? 'selected' : ''}>Caja</option>
                </select>
            </div>
            <div class="form-group">
                <label for="product-existencia">Existencia:</label>
                <input type="number" id="product-existencia" name="existencia" value="${producto.existencia}" required>
            </div>
            <div class="form-group">
                <label for="product-precio-c">Precio de Compra:</label>
                <input type="number" id="product-precio-c" name="precio_c" step="0.01" value="${producto.precio_c}" required>
            </div>
            <div class="form-group">
                <label for="product-precio-v">Precio de Venta:</label>
                <input type="number" id="product-precio-v" name="precio_v" step="0.01" value="${producto.precio_v}" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Actualizar</button>
            </div>
        </form>
    `;

    showModal('Editar Producto', content);

    document.getElementById('product-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await updateProducto(codigo);
    });
}

async function updateProducto(codigo) {
    const form = document.getElementById('product-form');
    const formData = new FormData(form);
    const producto = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_BASE}/productos/${codigo}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(producto)
        });

        if (response.ok) {
            showToast('Producto actualizado correctamente', 'success');
            closeModal();
            loadProductos();
        } else {
            const error = await response.json();
            showToast(error.error || 'Error al actualizar producto', 'error');
        }
    } catch (error) {
        console.error('Error updating producto:', error);
        showToast('Error al actualizar producto', 'error');
    }
}

async function deleteProducto(codigo) {
    if (!confirm('¿Está seguro de que desea eliminar este producto?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/productos/${codigo}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Producto eliminado correctamente', 'success');
            loadProductos();
        } else {
            const error = await response.json();
            showToast(error.error || 'Error al eliminar producto', 'error');
        }
    } catch (error) {
        console.error('Error deleting producto:', error);
        showToast('Error al eliminar producto', 'error');
    }
}

// Client Functions
async function loadClientes() {
    try {
        const response = await fetch(`${API_BASE}/clientes`);
        clientes = await response.json();
        renderClientes();
    } catch (error) {
        console.error('Error loading clientes:', error);
        document.getElementById('clientes-table').innerHTML = `
            <tr>
                <td colspan="5" class="loading">Error al cargar clientes</td>
            </tr>
        `;
    }
}

function renderClientes() {
    const tbody = document.getElementById('clientes-table');

    if (clientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="loading">No hay clientes registrados</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = clientes.map(cliente => `
        <tr>
            <td>${cliente.id_c}</td>
            <td>${cliente.telefono}</td>
            <td>${cliente.rfc}</td>
            <td>${cliente.domicilio}</td>
            <td class="table-actions">
                <button class="btn btn-sm btn-info btn-icon" onclick="editCliente(${cliente.id_c})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-icon" onclick="deleteCliente(${cliente.id_c})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Employee Functions
async function loadEmpleados() {
    try {
        const response = await fetch(`${API_BASE}/empleados`);
        empleados = await response.json();
        renderEmpleados();
    } catch (error) {
        console.error('Error loading empleados:', error);
        document.getElementById('empleados-table').innerHTML = `
            <tr>
                <td colspan="5" class="loading">Error al cargar empleados</td>
            </tr>
        `;
    }
}

function renderEmpleados() {
    const tbody = document.getElementById('empleados-table');

    if (empleados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="loading">No hay empleados registrados</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = empleados.map(empleado => `
        <tr>
            <td>${empleado.id_e}</td>
            <td>${empleado.nombre}</td>
            <td>${empleado.turno}</td>
            <td>$${parseFloat(empleado.salario).toFixed(2)}</td>
            <td class="table-actions">
                <button class="btn btn-sm btn-info btn-icon" onclick="editEmpleado(${empleado.id_e})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-icon" onclick="deleteEmpleado(${empleado.id_e})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Provider Functions
async function loadProveedores() {
    try {
        const response = await fetch(`${API_BASE}/proveedores`);
        proveedores = await response.json();
        renderProveedores();
    } catch (error) {
        console.error('Error loading proveedores:', error);
        document.getElementById('proveedores-table').innerHTML = `
            <tr>
                <td colspan="6" class="loading">Error al cargar proveedores</td>
            </tr>
        `;
    }
}

function renderProveedores() {
    const tbody = document.getElementById('proveedores-table');

    if (proveedores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="loading">No hay proveedores registrados</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = proveedores.map(proveedor => `
        <tr>
            <td>${proveedor.id_p}</td>
            <td>${proveedor.nombre}</td>
            <td>${proveedor.ciudad}</td>
            <td>${proveedor.contacto}</td>
            <td>${proveedor.tel_contacto}</td>
            <td class="table-actions">
                <button class="btn btn-sm btn-info btn-icon" onclick="editProveedor(${proveedor.id_p})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-icon" onclick="deleteProveedor(${proveedor.id_p})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Sales Functions
async function loadVentas() {
    try {
        const response = await fetch(`${API_BASE}/ventas`);
        ventas = await response.json();
        renderVentas();
    } catch (error) {
        console.error('Error loading ventas:', error);
        document.getElementById('ventas-table').innerHTML = `
            <tr>
                <td colspan="5" class="loading">Error al cargar ventas</td>
            </tr>
        `;
    }
}

function renderVentas() {
    const tbody = document.getElementById('ventas-table');

    if (ventas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="loading">No hay ventas registradas</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = ventas.map(venta => `
        <tr>
            <td>${venta.folio_v}</td>
            <td>${new Date(venta.fecha).toLocaleDateString('es-MX')}</td>
            <td>${venta.telefono_cliente || 'Tel: ' + venta.id_c}</td>
            <td>${venta.nombre_empleado || 'ID: ' + venta.id_e}</td>
            <td class="table-actions">
                <button class="btn btn-sm btn-info btn-icon" onclick="viewVenta(${venta.folio_v})">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Purchase Functions
async function loadCompras() {
    try {
        const response = await fetch(`${API_BASE}/compras`);
        compras = await response.json();
        renderCompras();
    } catch (error) {
        console.error('Error loading compras:', error);
        document.getElementById('compras-table').innerHTML = `
            <tr>
                <td colspan="6" class="loading">Error al cargar compras</td>
            </tr>
        `;
    }
}

function renderCompras() {
    const tbody = document.getElementById('compras-table');

    if (compras.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="loading">No hay compras registradas</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = compras.map(compra => `
        <tr>
            <td>${compra.folio_c}</td>
            <td>${compra.no_lote}</td>
            <td>${new Date(compra.fecha).toLocaleDateString('es-MX')}</td>
            <td>${compra.nombre_proveedor || 'ID: ' + compra.id_p}</td>
            <td>${compra.nombre_empleado || 'ID: ' + compra.id_e}</td>
            <td class="table-actions">
                <button class="btn btn-sm btn-info btn-icon" onclick="viewCompra(${compra.folio_c})">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchProductos = document.getElementById('search-productos');
    if (searchProductos) {
        searchProductos.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filteredProductos = productos.filter(producto =>
                producto.descripcion.toLowerCase().includes(searchTerm) ||
                producto.categoria.toLowerCase().includes(searchTerm) ||
                producto.codigo.toString().includes(searchTerm)
            );
            renderProductos(filteredProductos);
        });
    }
});

// Utility functions
function showAddClientModal() {
    showToast('Función de agregar cliente en desarrollo', 'info');
}

function showAddSaleModal() {
    showToast('Función de agregar venta en desarrollo', 'info');
}

function editCliente(id) {
    showToast('Función de editar cliente en desarrollo', 'info');
}

function editEmpleado(id) {
    showToast('Función de editar empleado en desarrollo', 'info');
}

function editProveedor(id) {
    showToast('Función de editar proveedor en desarrollo', 'info');
}

function deleteCliente(id) {
    showToast('Función de eliminar cliente en desarrollo', 'info');
}

function deleteEmpleado(id) {
    showToast('Función de eliminar empleado en desarrollo', 'info');
}

function deleteProveedor(id) {
    showToast('Función de eliminar proveedor en desarrollo', 'info');
}

function viewVenta(folio) {
    showToast('Función de ver detalles de venta en desarrollo', 'info');
}

function viewCompra(folio) {
    showToast('Función de ver detalles de compra en desarrollo', 'info');
}