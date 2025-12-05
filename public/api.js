// Configuración base
const API_URL = 'http://localhost:3000/api';

// --- FUNCIÓN GENÉRICA PARA ENVIAR DATOS ---
async function enviarDatos(endpoint, datos) {
    try {
        const respuesta = await fetch(`${API_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        if (!respuesta.ok) throw new Error('Error en la petición');
        
        const resultado = await respuesta.json();
        console.log(`✅ Éxito en ${endpoint}:`, resultado);
        alert('Registro guardado correctamente');
        return resultado;

    } catch (error) {
        console.error(`❌ Error en ${endpoint}:`, error);
        alert('Hubo un error al guardar los datos');
    }
}

// --- 1. AGREGAR PRODUCTO (Ya tenías el endpoint en server.js) ---
function agregarProducto() {
    // Aquí normalmente tomarías los valores de inputs del HTML
    // Ejemplo: document.getElementById('inputNombre').value
    const nuevoProducto = {
        codigo: "MAN-001", // Ejemplo
        descripcion: "Manzana Golden",
        categoria: "Frutas",
        unidad_medida: "kg",
        existencia: 100,
        precio_c: 15.50,
        precio_v: 25.00
    };

    enviarDatos('productos', nuevoProducto);
}

// --- 2. AGREGAR CLIENTE ---
function agregarCliente() {
    const nuevoCliente = {
        nombre: "Maria Perez",
        telefono: "555-0199",
        direccion: "Av. Siempre Viva 123",
        correo: "maria@email.com"
    };

    enviarDatos('clientes', nuevoCliente);
}

// --- 3. AGREGAR EMPLEADO ---
function agregarEmpleado() {
    const nuevoEmpleado = {
        nombre: "Juan Mostrador",
        puesto: "Vendedor",
        salario: 1200.00,
        telefono: "555-9988"
    };

    enviarDatos('empleados', nuevoEmpleado);
}

// --- 4. AGREGAR PROVEEDOR (ETC) ---
function agregarProveedor() {
    const nuevoProveedor = {
        nombre: "Frutas del Campo SA",
        contacto: "Pedro Agricultor",
        telefono: "555-7777",
        direccion: "Carretera Central Km 50"
    };

    enviarDatos('proveedores', nuevoProveedor);
}