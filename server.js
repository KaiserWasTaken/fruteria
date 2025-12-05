const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'fruteria',
    user: 'postgres',
    password: 'admin',
});

// --- API ROUTES ---

// 1. DASHBOARD (MEJORADO)
app.get('/api/dashboard', async (req, res) => {
    try {
        // Contadores básicos
        const counts = await Promise.all([
            pool.query('SELECT COUNT(*) FROM fruteria.producto'),
            pool.query('SELECT COUNT(*) FROM fruteria.cliente'),
            pool.query('SELECT COUNT(*) FROM fruteria.empleado'),
            pool.query('SELECT COUNT(*) FROM fruteria.venta'),
            pool.query('SELECT COUNT(*) FROM fruteria.compra')
        ]);
        
        // Dinero del mes (Ventas y Compras)
        const ventasMes = await pool.query(`
            SELECT COALESCE(SUM(dv.cantidad * p.precio_v), 0) as monto
            FROM fruteria.venta v
            JOIN fruteria.detalle_venta dv ON v.folio_v = dv.folio_v
            JOIN fruteria.producto p ON dv.codigo = p.codigo
            WHERE v.fecha >= CURRENT_DATE - INTERVAL '30 days'
        `);

        const comprasMes = await pool.query(`
            SELECT COALESCE(SUM(dc.cantidad * p.precio_c), 0) as monto
            FROM fruteria.compra c
            JOIN fruteria.detalle_compra dc ON c.folio_c = dc.folio_c
            JOIN fruteria.producto p ON dc.codigo = p.codigo
            WHERE c.fecha >= CURRENT_DATE - INTERVAL '30 days'
        `);

        // Alerta de Stock Bajo (Menos de 10 unidades)
        const stockBajo = await pool.query(`
            SELECT codigo, descripcion, existencia, unidad_medida 
            FROM fruteria.producto 
            WHERE existencia <= 10 
            ORDER BY existencia ASC LIMIT 5
        `);

        // Últimas 5 Ventas
        const ultimasVentas = await pool.query(`
            SELECT v.folio_v, TO_CHAR(v.fecha, 'DD/MM HH24:MI') as fecha_fmt, 
                   COALESCE(SUM(dv.cantidad * p.precio_v), 0) as total
            FROM fruteria.venta v
            LEFT JOIN fruteria.detalle_venta dv ON v.folio_v = dv.folio_v
            LEFT JOIN fruteria.producto p ON dv.codigo = p.codigo
            GROUP BY v.folio_v, v.fecha
            ORDER BY v.folio_v DESC LIMIT 5
        `);

        res.json({
            totales: {
                productos: counts[0].rows[0].count,
                clientes: counts[1].rows[0].count,
                empleados: counts[2].rows[0].count,
                ventas: counts[3].rows[0].count,
                compras: counts[4].rows[0].count
            },
            dinero: {
                ventas: ventasMes.rows[0].monto,
                compras: comprasMes.rows[0].monto
            },
            stockBajo: stockBajo.rows,
            recientes: ultimasVentas.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 2. PRODUCTOS
app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM fruteria.producto ORDER BY descripcion');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/productos', async (req, res) => {
    try {
        const { codigo, descripcion, categoria, unidad_medida, existencia, precio_c, precio_v } = req.body;
        const result = await pool.query(
            'INSERT INTO fruteria.producto (codigo, descripcion, categoria, unidad_medida, existencia, precio_c, precio_v) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [codigo, descripcion, categoria, unidad_medida, existencia, precio_c, precio_v]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/productos/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { descripcion, categoria, unidad_medida, existencia, precio_c, precio_v } = req.body;
        const result = await pool.query(
            'UPDATE fruteria.producto SET descripcion=$1, categoria=$2, unidad_medida=$3, existencia=$4, precio_c=$5, precio_v=$6 WHERE codigo=$7 RETURNING *',
            [descripcion, categoria, unidad_medida, existencia, precio_c, precio_v, codigo]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/productos/:codigo', async (req, res) => {
    try {
        await pool.query('DELETE FROM fruteria.producto WHERE codigo = $1', [req.params.codigo]);
        res.json({ message: 'Eliminado' });
    } catch (err) { res.status(500).json({ error: 'No se puede eliminar' }); }
});

// 3. CLIENTES
app.get('/api/clientes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM fruteria.cliente ORDER BY id_c ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/clientes', async (req, res) => {
    try {
        const { nombre, telefono, rfc, domicilio, correo } = req.body;
        await pool.query('INSERT INTO fruteria.cliente (nombre, telefono, rfc, domicilio, correo) VALUES ($1, $2, $3, $4, $5)', [nombre, telefono, rfc, domicilio, correo]);
        res.json({ message: 'Guardado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/clientes/:id', async (req, res) => {
    try {
        const { nombre, telefono, rfc, domicilio, correo } = req.body;
        await pool.query('UPDATE fruteria.cliente SET nombre=$1, telefono=$2, rfc=$3, domicilio=$4, correo=$5 WHERE id_c=$6', [nombre, telefono, rfc, domicilio, correo, req.params.id]);
        res.json({ message: 'Actualizado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/clientes/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM fruteria.cliente WHERE id_c = $1', [req.params.id]);
        res.json({ message: 'Eliminado' });
    } catch (err) { res.status(500).json({ error: 'Error al eliminar' }); }
});

// 4. EMPLEADOS
app.get('/api/empleados', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM fruteria.empleado ORDER BY id_e ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/empleados', async (req, res) => {
    try {
        const { nombre, puesto, turno, salario, telefono } = req.body;
        await pool.query('INSERT INTO fruteria.empleado (nombre, puesto, turno, salario, telefono) VALUES ($1, $2, $3, $4, $5)', [nombre, puesto, turno, salario, telefono]);
        res.json({ message: 'Guardado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/empleados/:id', async (req, res) => {
    try {
        const { nombre, puesto, turno, salario, telefono } = req.body;
        await pool.query('UPDATE fruteria.empleado SET nombre=$1, puesto=$2, turno=$3, salario=$4, telefono=$5 WHERE id_e=$6', [nombre, puesto, turno, salario, telefono, req.params.id]);
        res.json({ message: 'Actualizado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/empleados/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM fruteria.empleado WHERE id_e = $1', [req.params.id]);
        res.json({ message: 'Eliminado' });
    } catch (err) { res.status(500).json({ error: 'Error al eliminar' }); }
});

// 5. PROVEEDORES
app.get('/api/proveedores', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM fruteria.proveedor ORDER BY id_p ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/proveedores', async (req, res) => {
    try {
        const { nombre, contacto, telefono, direccion } = req.body;
        await pool.query('INSERT INTO fruteria.proveedor (nombre, contacto, telefono, direccion) VALUES ($1, $2, $3, $4)', [nombre, contacto, telefono, direccion]);
        res.json({ message: 'Guardado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/proveedores/:id', async (req, res) => {
    try {
        const { nombre, contacto, telefono, direccion } = req.body;
        await pool.query('UPDATE fruteria.proveedor SET nombre=$1, contacto=$2, telefono=$3, direccion=$4 WHERE id_p=$5', [nombre, contacto, telefono, direccion, req.params.id]);
        res.json({ message: 'Actualizado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/proveedores/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM fruteria.proveedor WHERE id_p = $1', [req.params.id]);
        res.json({ message: 'Eliminado' });
    } catch (err) { res.status(500).json({ error: 'Error al eliminar' }); }
});

// 6. VENTAS
app.get('/api/ventas', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT v.folio_v, v.fecha, c.nombre as nombre_cliente, e.nombre as nombre_empleado,
                   (SELECT COALESCE(SUM(dv.cantidad * p.precio_v),0) 
                    FROM fruteria.detalle_venta dv 
                    JOIN fruteria.producto p ON dv.codigo = p.codigo 
                    WHERE dv.folio_v = v.folio_v) as total_venta
            FROM fruteria.venta v
            LEFT JOIN fruteria.cliente c ON v.id_c = c.id_c
            LEFT JOIN fruteria.empleado e ON v.id_e = e.id_e
            ORDER BY v.folio_v DESC LIMIT 50`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ventas', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id_c, id_e, detalles } = req.body;
        await client.query('BEGIN');
        const ventaRes = await client.query('INSERT INTO fruteria.venta (id_c, id_e) VALUES ($1, $2) RETURNING folio_v', [id_c, id_e]);
        const folioVenta = ventaRes.rows[0].folio_v;

        for (const item of detalles) {
            const prodRes = await client.query('SELECT existencia FROM fruteria.producto WHERE codigo = $1', [item.codigo]);
            if (prodRes.rows[0].existencia < item.cantidad) throw new Error(`Stock insuficiente: ${item.codigo}`);
            await client.query('INSERT INTO fruteria.detalle_venta (folio_v, codigo, cantidad) VALUES ($1, $2, $3)', [folioVenta, item.codigo, item.cantidad]);
            await client.query('UPDATE fruteria.producto SET existencia = existencia - $1 WHERE codigo = $2', [item.cantidad, item.codigo]);
        }
        await client.query('COMMIT');
        res.json({ message: 'Venta registrada' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally { client.release(); }
});

// 7. COMPRAS
app.get('/api/compras', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.folio_c, c.fecha, c.lote, p.nombre as nombre_proveedor, e.nombre as nombre_empleado,
                   (SELECT COALESCE(SUM(dc.cantidad * prod.precio_c),0) 
                    FROM fruteria.detalle_compra dc 
                    JOIN fruteria.producto prod ON dc.codigo = prod.codigo 
                    WHERE dc.folio_c = c.folio_c) as total_compra
            FROM fruteria.compra c
            LEFT JOIN fruteria.proveedor p ON c.id_p = p.id_p
            LEFT JOIN fruteria.empleado e ON c.id_e = e.id_e
            ORDER BY c.folio_c DESC LIMIT 50`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/compras', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id_p, id_e, lote, detalles } = req.body;
        await client.query('BEGIN');
        const compraRes = await client.query('INSERT INTO fruteria.compra (id_p, id_e, lote) VALUES ($1, $2, $3) RETURNING folio_c', [id_p, id_e, lote]);
        const folioCompra = compraRes.rows[0].folio_c;

        for (const item of detalles) {
            await client.query('INSERT INTO fruteria.detalle_compra (folio_c, codigo, cantidad, costo_unitario) VALUES ($1, $2, $3, $4)', [folioCompra, item.codigo, item.cantidad, item.costo]);
            await client.query('UPDATE fruteria.producto SET existencia = existencia + $1 WHERE codigo = $2', [item.cantidad, item.codigo]);
        }
        await client.query('COMMIT');
        res.json({ message: 'Compra registrada' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally { client.release(); }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});