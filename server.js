const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'fruteria',
    user: 'postgres',
    password: 'admin',
    // Quitamos 'schema' de aquí porque lo especificaremos en cada consulta
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err);
    } else {
        console.log('✅ Conectado a PostgreSQL:', res.rows[0].now);
    }
});

// --- API ROUTES ---

// 1. PRODUCTOS
// Obtener todos (GET)
app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM fruteria.producto ORDER BY descripcion');
        res.json(result.rows);
    } catch (err) {
        console.error('Error GET productos:', err);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// Crear nuevo (POST) - ¡NUEVO!
app.post('/api/productos', async (req, res) => {
    try {
        const { codigo, descripcion, categoria, unidad_medida, existencia, precio_c, precio_v } = req.body;
        
        // Validación básica
        if (!codigo || !descripcion || !precio_v) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const result = await pool.query(
            'INSERT INTO fruteria.producto (codigo, descripcion, categoria, unidad_medida, existencia, precio_c, precio_v) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [codigo, descripcion, categoria, unidad_medida, existencia || 0, precio_c || 0, precio_v]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error POST productos:', err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'El código del producto ya existe' });
        }
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

// Actualizar (PUT)
app.put('/api/productos/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { descripcion, categoria, unidad_medida, existencia, precio_c, precio_v } = req.body;
        const result = await pool.query(
            'UPDATE fruteria.producto SET descripcion = $1, categoria = $2, unidad_medida = $3, existencia = $4, precio_c = $5, precio_v = $6 WHERE codigo = $7 RETURNING *',
            [descripcion, categoria, unidad_medida, existencia, precio_c, precio_v, codigo]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

// Eliminar (DELETE)
app.delete('/api/productos/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        await pool.query('DELETE FROM fruteria.producto WHERE codigo = $1', [codigo]);
        res.json({ message: 'Producto eliminado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

// --- PEGAR EN SERVER.JS (Reemplazando la sección actual de CLIENTES) ---

// Obtener todos
app.get('/api/clientes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM fruteria.cliente ORDER BY id_c ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// Crear nuevo
app.post('/api/clientes', async (req, res) => {
    try {
        // Ahora aceptamos nombre y correo también
        const { nombre, telefono, rfc, domicilio, correo } = req.body;
        
        const result = await pool.query(
            'INSERT INTO fruteria.cliente (nombre, telefono, rfc, domicilio, correo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nombre, telefono, rfc, domicilio, correo]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al guardar cliente' });
    }
});

// Actualizar (PUT) - ¡NUEVO!
app.put('/api/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, rfc, domicilio, correo } = req.body;
        
        const result = await pool.query(
            'UPDATE fruteria.cliente SET nombre=$1, telefono=$2, rfc=$3, domicilio=$4, correo=$5 WHERE id_c=$6 RETURNING *',
            [nombre, telefono, rfc, domicilio, correo, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
});

// Eliminar (DELETE) - ¡NUEVO!
app.delete('/api/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM fruteria.cliente WHERE id_c = $1', [id]);
        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (err) {
        console.error(err);
        // El error 23503 pasa si intentas borrar un cliente que ya tiene ventas registradas
        if (err.code === '23503') {
            return res.status(400).json({ error: 'No se puede eliminar: El cliente tiene ventas registradas.' });
        }
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
});

// 3. EMPLEADOS
app.get('/api/empleados', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM fruteria.empleado ORDER BY id_e');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener empleados' });
    }
});

app.post('/api/empleados', async (req, res) => {
    try {
        const { nombre, turno, salario } = req.body;
        await pool.query(
            'INSERT INTO fruteria.empleado (nombre, turno, salario) VALUES ($1, $2, $3)',
            [nombre, turno, salario]
        );
        res.json({ message: 'Empleado guardado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. PROVEEDORES
app.get('/api/proveedores', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM fruteria.proveedor ORDER BY id_p');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener proveedores' });
    }
});

// 5. VENTAS (CORREGIDO EL ERROR 500)
app.get('/api/ventas', async (req, res) => {
    try {
        // CORRECCIÓN: Agregamos 'fruteria.' antes de las tablas
        const result = await pool.query(`
            SELECT v.*, 
                   c.telefono as telefono_cliente,
                   e.nombre as nombre_empleado
            FROM fruteria.venta v
            LEFT JOIN fruteria.cliente c ON v.id_c = c.id_c
            LEFT JOIN fruteria.empleado e ON v.id_e = e.id_e
            ORDER BY v.folio_v DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error detallado al obtener ventas:', err);
        res.status(500).json({ error: 'Error al obtener ventas', details: err.message });
    }
});

// 6. COMPRAS
app.get('/api/compras', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, p.nombre as nombre_proveedor, e.nombre as nombre_empleado
            FROM fruteria.compra c
            LEFT JOIN fruteria.proveedor p ON c.id_p = p.id_p
            LEFT JOIN fruteria.empleado e ON c.id_e = e.id_e
            ORDER BY c.folio_c DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener compras' });
    }
});

// 7. DASHBOARD
app.get('/api/dashboard', async (req, res) => {
    try {
        const [productos, clientes, empleados, ventas, compras] = await Promise.all([
            pool.query('SELECT COUNT(*) as total FROM fruteria.producto'),
            pool.query('SELECT COUNT(*) as total FROM fruteria.cliente'),
            pool.query('SELECT COUNT(*) as total FROM fruteria.empleado'),
            pool.query('SELECT COUNT(*) as total FROM fruteria.venta'),
            pool.query('SELECT COUNT(*) as total FROM fruteria.compra')
        ]);

        const [ventasMes] = await Promise.all([
            pool.query(`
                SELECT COUNT(*) as total, COALESCE(SUM(dv.cantidad * p.precio_v), 0) as monto
                FROM fruteria.venta v
                JOIN fruteria.detalle_venta dv ON v.folio_v = dv.folio_v
                JOIN fruteria.producto p ON dv.codigo = p.codigo
                WHERE v.fecha >= CURRENT_DATE - INTERVAL '30 days'
            `)
        ]);

        res.json({
            productos: productos.rows[0].total,
            clientes: clientes.rows[0].total,
            empleados: empleados.rows[0].total,
            ventas: ventas.rows[0].total,
            compras: compras.rows[0].total,
            ventasMes: {
                total: ventasMes.rows[0].total || 0,
                monto: ventasMes.rows[0].monto || 0
            },
            comprasMes: { total: 0, monto: 0 } // Placeholder simple
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener datos del dashboard' });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});