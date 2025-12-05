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

// DOM Elements & Initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    setupNavigation();
    loadDashboardData();
    // Cargar datos iniciales
    loadProductos();
    loadClientes();
    loadEmpleados();
    loadProveedores();
    loadVentas();
    loadCompras();

    // Set dashboard as active section
    showSection('dashboard');
}

function setupEventListeners() {
    // Listener para el formulario de Clientes (que ya existe en el HTML)
    const clientForm = document.getElementById('form-cliente');
    if (clientForm) {
        clientForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveCliente();
        });
    }

    // Listener para cerrar modal al hacer clic fuera
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }

    // Buscador de productos
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
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionId;
    }
}

// Toast Notifications
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

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

    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease forwards';
        setTimeout(() => {
            if (toastContainer.contains(toast)) {
                toastContainer.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Modal Functions
function showModal(title, content) {
    // Esta función se usa para modales dinámicos (como el de productos)
    const modalOverlay = document.getElementById('modal-overlay');
    const modalProducto = document.getElementById('modal-producto');
    
    // Ocultar otros modales estáticos
    document.getElementById('modal-cliente').style.display = 'none';

    // Inyectar contenido en el modal de producto
    modalProducto.innerHTML = `
        <div class="modal-header">
            <h3>${title}</h3>
            <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
            ${content}
        </div>
    `;
    
    modalProducto.style.display = 'block';
    modalOverlay.style.display = 'flex';
}

function closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay.style.display = 'none';
    
    // Ocultar todos los hijos modales
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

// --- DASHBOARD ---
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE}/dashboard`);
        const data = await response.json();

        // Actualizar contadores si existen los elementos
        if(document.getElementById('total-productos')) document.getElementById('total-productos').textContent = data.productos;
        if(document.getElementById('total-clientes')) document.getElementById('total-clientes').textContent = data.clientes;
        if(document.getElementById('total-empleados')) document.getElementById('total-empleados').textContent = data.empleados;
        if(document.getElementById('total-ventas')) document.getElementById('total-ventas').textContent = data.ventas;
        if(document.getElementById('total-compras')) document.getElementById('total-compras').textContent = data.compras;
        
        if(document.getElementById('monto-ventas')) 
            document.getElementById('monto-ventas').textContent = parseFloat(data.ventasMes?.monto || 0).toFixed(2);
        
        if(document.getElementById('monto-compras'))
            document.getElementById('monto-compras').textContent = parseFloat(data.comprasMes?.monto || 0).toFixed(2);

        const ganancias = parseFloat(data.ventasMes?.monto || 0) - parseFloat(data.comprasMes?.monto || 0);
        const gananciasEl = document.getElementById('ganancias-mes');
        if (gananciasEl) {
            gananciasEl.textContent = `$${ganancias.toFixed(2)}`;
            gananciasEl.style.color = ganancias > 0 ? 'var(--success-color)' : (ganancias < 0 ? 'var(--danger-color)' : 'var(--dark-color)');
        }

    } catch (error) {
        console.error('Error dashboard:', error);
    }
}

// --- PRODUCTOS ---
async function loadProductos() {
    try {
        const response = await fetch(`${API_BASE}/productos`);
        productos = await response.json();
        renderProductos();
    } catch (error) {
        console.error(error);
        const table = document.getElementById('productos-table');
        if(table) table.innerHTML = '<tr><td colspan="8" class="loading">Error al cargar productos</td></tr>';
    }
}

function renderProductos(list = productos) {
    const tbody = document.getElementById('productos-table');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No hay productos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(p => `
        <tr>
            <td>${p.codigo}</td>
            <td>${p.descripcion}</td>
            <td>${p.categoria}</td>
            <td>${p.unidad_medida}</td>
            <td>${p.existencia}</td>
            <td>$${parseFloat(p.precio_c).toFixed(2)}</td>
            <td>$${parseFloat(p.precio_v).toFixed(2)}</td>
            <td class="table-actions">
                <button class="btn btn-sm btn-info btn-icon" onclick="editProducto('${p.codigo}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-icon" onclick="deleteProducto('${p.codigo}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showAddProductModal() {
    const formHtml = `
        <form id="product-form">
            <div class="form-group"><label>Código:</label><input type="text" name="codigo" required></div>
            <div class="form-group"><label>Descripción:</label><input type="text" name="descripcion" required></div>
            <div class="form-group"><label>Categoría:</label>
                <select name="categoria" required>
                    <option value="fruta">Fruta</option>
                    <option value="verdura">Verdura</option>
                    <option value="otro">Otro</option>
                </select>
            </div>
            <div class="form-group"><label>Unidad:</label>
                <select name="unidad_medida" required>
                    <option value="kilogramo">Kilogramo</option>
                    <option value="pieza">Pieza</option>
                    <option value="litro">Litro</option>
                    <option value="caja">Caja</option>
                </select>
            </div>
            <div class="form-group"><label>Existencia:</label><input type="number" name="existencia" required></div>
            <div class="form-group"><label>Precio Compra:</label><input type="number" name="precio_c" step="0.01" required></div>
            <div class="form-group"><label>Precio Venta:</label><input type="number" name="precio_v" step="0.01" required></div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
        </form>
    `;

    showModal('Nuevo Producto', formHtml);

    // Agregar listener al formulario dinámico
    setTimeout(() => {
        document.getElementById('product-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveProducto();
        });
    }, 100);
}

async function saveProducto() {
    const form = document.getElementById('product-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
        const res = await fetch(`${API_BASE}/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (res.ok) {
            showToast('Producto guardado', 'success');
            closeModal();
            loadProductos();
        } else {
            const err = await res.json();
            showToast(err.error || 'Error', 'error');
        }
    } catch (e) { showToast('Error de conexión', 'error'); }
}

async function editProducto(codigo) {
    const p = productos.find(x => x.codigo === codigo);
    if (!p) return;

    const formHtml = `
        <form id="product-form-edit">
            <input type="hidden" name="codigo" value="${p.codigo}">
            <div class="form-group"><label>Descripción:</label><input type="text" name="descripcion" value="${p.descripcion}" required></div>
            <div class="form-group"><label>Categoría:</label>
                <select name="categoria" required>
                    <option value="fruta" ${p.categoria === 'fruta' ? 'selected' : ''}>Fruta</option>
                    <option value="verdura" ${p.categoria === 'verdura' ? 'selected' : ''}>Verdura</option>
                    <option value="otro" ${p.categoria === 'otro' ? 'selected' : ''}>Otro</option>
                </select>
            </div>
            <div class="form-group"><label>Unidad:</label>
                <select name="unidad_medida" required>
                    <option value="kilogramo" ${p.unidad_medida === 'kilogramo' ? 'selected' : ''}>Kilogramo</option>
                    <option value="pieza" ${p.unidad_medida === 'pieza' ? 'selected' : ''}>Pieza</option>
                </select>
            </div>
            <div class="form-group"><label>Existencia:</label><input type="number" name="existencia" value="${p.existencia}" required></div>
            <div class="form-group"><label>Precio Compra:</label><input type="number" name="precio_c" step="0.01" value="${p.precio_c}" required></div>
            <div class="form-group"><label>Precio Venta:</label><input type="number" name="precio_v" step="0.01" value="${p.precio_v}" required></div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Actualizar</button>
            </div>
        </form>
    `;

    showModal('Editar Producto', formHtml);
    
    setTimeout(() => {
        document.getElementById('product-form-edit').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            try {
                const res = await fetch(`${API_BASE}/productos/${codigo}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    showToast('Producto actualizado', 'success');
                    closeModal();
                    loadProductos();
                } else {
                    const err = await res.json();
                    showToast(err.error, 'error');
                }
            } catch (e) { showToast('Error de conexión', 'error'); }
        });
    }, 100);
}

async function deleteProducto(codigo) {
    if (!confirm('¿Eliminar producto?')) return;
    try {
        const res = await fetch(`${API_BASE}/productos/${codigo}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Producto eliminado', 'success');
            loadProductos();
        } else {
            showToast('Error al eliminar', 'error');
        }
    } catch (e) { showToast('Error de conexión', 'error'); }
}

// --- CLIENTES ---
async function loadClientes() {
    try {
        const response = await fetch(`${API_BASE}/clientes`);
        clientes = await response.json();
        renderClientes();
    } catch (error) {
        console.error('Error cargando clientes:', error);
    }
}

function renderClientes() {
    const tbody = document.getElementById('clientes-table');
    if (!tbody) return;

    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No hay clientes registrados</td></tr>';
        return;
    }

    tbody.innerHTML = clientes.map(c => `
        <tr>
            <td>${c.id_c}</td>
            <td><strong>${c.nombre || 'Sin nombre'}</strong></td>
            <td>${c.telefono}</td>
            <td>${c.rfc || '-'}</td>
            <td>${c.domicilio || '-'}</td>
            <td class="table-actions">
                <button class="btn btn-sm btn-info btn-icon" onclick="editCliente(${c.id_c})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-icon" onclick="deleteCliente(${c.id_c})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showAddClientModal() {
    // Limpiar formulario
    document.getElementById('form-cliente').reset();
    document.getElementById('cli-id').value = '';
    document.getElementById('modal-title-cliente').textContent = 'Nuevo Cliente';
    
    // Mostrar modal estático
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('modal-cliente').style.display = 'block';
    // Ocultar modal de producto por si acaso
    document.getElementById('modal-producto').style.display = 'none';
}

async function saveCliente() {
    const id = document.getElementById('cli-id').value;
    const datos = {
        nombre: document.getElementById('cli-nombre').value,
        telefono: document.getElementById('cli-tel').value,
        correo: document.getElementById('cli-correo').value,
        rfc: document.getElementById('cli-rfc').value,
        domicilio: document.getElementById('cli-dom').value
    };

    const url = id ? `${API_BASE}/clientes/${id}` : `${API_BASE}/clientes`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            showToast(id ? 'Cliente actualizado' : 'Cliente registrado', 'success');
            closeModal();
            loadClientes();
        } else {
            const err = await res.json();
            showToast(err.error || 'Error', 'error');
        }
    } catch (error) { showToast('Error de conexión', 'error'); }
}

function editCliente(id) {
    const c = clientes.find(x => x.id_c === id);
    if (!c) return;

    document.getElementById('cli-id').value = c.id_c;
    document.getElementById('cli-nombre').value = c.nombre || '';
    document.getElementById('cli-tel').value = c.telefono || '';
    document.getElementById('cli-correo').value = c.correo || '';
    document.getElementById('cli-rfc').value = c.rfc || '';
    document.getElementById('cli-dom').value = c.domicilio || '';

    document.getElementById('modal-title-cliente').textContent = 'Editar Cliente';
    
    document.getElementById('modal-overlay').style.display = 'flex';
    document.getElementById('modal-cliente').style.display = 'block';
    document.getElementById('modal-producto').style.display = 'none';
}

async function deleteCliente(id) {
    if (!confirm('¿Eliminar cliente?')) return;
    try {
        const res = await fetch(`${API_BASE}/clientes/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Cliente eliminado', 'success');
            loadClientes();
        } else {
            const err = await res.json();
            showToast(err.error, 'error');
        }
    } catch (e) { showToast('Error al eliminar', 'error'); }
}

// --- UTILITIES FOR OTHER SECTIONS (SOLO LAS QUE FALTAN) ---
function showAddSaleModal() { showToast('Función de venta en desarrollo', 'info'); }
function editEmpleado(id) { showToast('Función de empleado en desarrollo', 'info'); }
function editProveedor(id) { showToast('Función de proveedor en desarrollo', 'info'); }
function deleteEmpleado(id) { showToast('Función de empleado en desarrollo', 'info'); }
function deleteProveedor(id) { showToast('Función de proveedor en desarrollo', 'info'); }
function viewVenta(folio) { showToast('Detalle de venta en desarrollo', 'info'); }
function viewCompra(folio) { showToast('Detalle de compra en desarrollo', 'info'); }

// Cargar listas vacías para que no de error la consola
async function loadEmpleados() { /* Ya implementado o dejar vacío funcional */ }
async function loadProveedores() { /* ... */ }
async function loadVentas() { /* ... */ }
async function loadCompras() { /* ... */ }