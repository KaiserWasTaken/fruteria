const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'fruteria',
    user: 'postgres',
    password: '753159',
    schema: 'fruteria'
});

async function testVentasQuery() {
    try {
        await client.connect();
        console.log('🔍 Probando consulta para ventas...\n');

        // First, let's check what's in the venta table
        console.log('📋 Datos en tabla venta:');
        const ventasData = await client.query('SELECT * FROM fruteria.venta LIMIT 3');
        ventasData.rows.forEach(row => {
            console.log('  ', JSON.stringify(row));
        });

        console.log('\n📋 Datos en tabla cliente:');
        const clientesData = await client.query('SELECT * FROM fruteria.cliente LIMIT 3');
        clientesData.rows.forEach(row => {
            console.log('  ', JSON.stringify(row));
        });

        console.log('\n📋 Datos en tabla empleado:');
        const empleadosData = await client.query('SELECT * FROM fruteria.empleado LIMIT 3');
        empleadosData.rows.forEach(row => {
            console.log('  ', JSON.stringify(row));
        });

        console.log('\n🔍 Probando consulta JOIN:');
        // Test the exact query from server.js
        const result = await client.query(`
            SELECT v.*, c.telefono as telefono_cliente, e.nombre as nombre_empleado
            FROM fruteria.venta v
            LEFT JOIN fruteria.cliente c ON v.id_c = c.id_c
            LEFT JOIN fruteria.empleado e ON v.id_e = e.id_e
            ORDER BY v.folio_v
            LIMIT 5
        `);

        console.log('\n✅ Resultado de la consulta:');
        result.rows.forEach(row => {
            console.log('  ', JSON.stringify(row));
        });

    } catch (error) {
        console.error('❌ Error en la consulta:', error.message);
        console.error('Código:', error.code);
        console.error('Detalle:', error.detail);
        console.error('Posición:', error.position);
    } finally {
        await client.end();
    }
}

testVentasQuery();