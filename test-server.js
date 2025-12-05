const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3001;

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

// Simple test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// VENTAS endpoint
app.get('/ventas', async (req, res) => {
    try {
        console.log('🔍 Iniciando consulta de ventas...');
        const result = await pool.query(`
            SELECT v.*,
                   c.telefono as telefono_cliente,
                   COALESCE(e.nombre, 'Empleado ID: ' || v.id_e) as nombre_empleado
            FROM fruteria.venta v
            LEFT JOIN fruteria.cliente c ON v.id_c = c.id_c
            LEFT JOIN fruteria.empleado e ON v.id_e = e.id_e
            ORDER BY v.folio_v
        `);
        console.log('✅ Ventas obtenidas:', result.rows.length);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error al obtener ventas:', err);
        res.status(500).json({ error: 'Error al obtener ventas', details: err.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 Test server corriendo en http://localhost:${port}`);
});