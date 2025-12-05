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
    password: '753159',
    schema: 'fruteria'
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err);
    } else {
        console.log('✅ Conectado a PostgreSQL:', res.rows[0].now);
    }
});

// API Routes

// PRODUCTS
app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM fruteria.producto ORDER BY descripcion');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

app.post('/api/productos', async (req, res) => {
    try {
        const { codigo, descripcion, categoria, unidad_medida, existencia, precio_c, precio_v } = req.body;
        const result = await pool.query(
            'INSERT INTO fruteria.producto (codigo, descripcion, categoria, unidad_medida, existencia, precio_c, precio_v) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [codigo, descripcion, categoria, unidad_medida, existencia, precio_c, precio_v]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

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

// CLIENTS
app.get('/api/clientes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM fruteria.cliente ORDER BY id_c');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// EMPLOYEES
app.get('/api/empleados', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM fruteria.empleado ORDER BY id_e');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener empleados' });
    }
});

// PROVIDERS
app.get('/api/proveedores', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM fruteria.proveedor ORDER BY id_p');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener proveedores' });
    }
});

// SALES
app.get('/api/ventas', async (req, res) => {
    try {
        const result = await pool.query(`
            select * from venta;
        `);
        console.log('✅ Ventas obtenidas:', result.rows.length);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error detallado al obtener ventas:', {
            message: err.message,
            code: err.code,
            detail: err.detail,
            position: err.position,
            stack: err.stack
        });
        res.status(500).json({ error: 'Error al obtener ventas', details: err.message });
    }
});

app.post('/api/ventas', async (req, res) => {
    try {
        const { fecha, id_c, id_e, detalles } = req.body;

        await pool.query('BEGIN');

        const result = await pool.query(
            'INSERT INTO fruteria.venta (fecha, id_c, id_e) VALUES ($1, $2, $3) RETURNING folio_v',
            [fecha, id_c, id_e]
        );

        const folio_v = result.rows[0].folio_v;

        for (const detalle of detalles) {
            await pool.query(
                'INSERT INTO fruteria.detalle_venta (folio_v, codigo, cantidad, observaciones) VALUES ($1, $2, $3, $4)',
                [folio_v, detalle.codigo, detalle.cantidad, detalle.observaciones || '']
            );

            // Update product inventory
            await pool.query(
                'UPDATE fruteria.producto SET existencia = existencia - $1 WHERE codigo = $2',
                [detalle.cantidad, detalle.codigo]
            );
        }

        await pool.query('COMMIT');
        res.json({ folio_v, message: 'Venta registrada correctamente' });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Error al registrar venta' });
    }
});

// PURCHASES
app.get('/api/compras', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, p.nombre as nombre_proveedor, e.nombre as nombre_empleado
            FROM fruteria.compra c
            LEFT JOIN fruteria.proveedor p ON c.id_p = p.id_p
            LEFT JOIN fruteria.empleado e ON c.id_e = e.id_e
            ORDER BY c.folio_c
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener compras' });
    }
});

// DASHBOARD
app.get('/api/dashboard', async (req, res) => {
    try {
        const [productos, clientes, empleados, ventas, compras] = await Promise.all([
            pool.query('SELECT COUNT(*) as total FROM fruteria.producto'),
            pool.query('SELECT COUNT(*) as total FROM fruteria.cliente'),
            pool.query('SELECT COUNT(*) as total FROM fruteria.empleado'),
            pool.query('SELECT COUNT(*) as total FROM fruteria.venta'),
            pool.query('SELECT COUNT(*) as total FROM fruteria.compra')
        ]);

        const [ventasMes, comprasMes] = await Promise.all([
            pool.query(`
                SELECT COUNT(*) as total, SUM(dv.cantidad * p.precio_v) as monto
                FROM fruteria.venta v
                JOIN fruteria.detalle_venta dv ON v.folio_v = dv.folio_v
                JOIN fruteria.producto p ON dv.codigo = p.codigo
                WHERE v.fecha >= CURRENT_DATE - INTERVAL '30 days'
            `),
            pool.query(`
                SELECT COUNT(*) as total, SUM(dc.cantidad * p.precio_c) as monto
                FROM fruteria.compra c
                JOIN fruteria.detalle_compra dc ON c.folio_c = dc.folio_c
                JOIN fruteria.producto p ON dc.codigo = p.codigo
                WHERE c.fecha >= CURRENT_DATE - INTERVAL '30 days'
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
            comprasMes: {
                total: comprasMes.rows[0].total || 0,
                monto: comprasMes.rows[0].monto || 0
            }
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