const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'fruteria',
    user: 'postgres',
    password: 'admin',
    schema: 'fruteria'
});

async function testFixedQuery() {
    try {
        await client.connect();
        console.log('🔍 Probando la consulta corregida...\n');

        // Test the exact query from server.js
        const result = await client.query(`
            SELECT v.*,
                   c.telefono as telefono_cliente,
                   COALESCE(e.nombre, 'Empleado ID: ' || v.id_e) as nombre_empleado
            FROM fruteria.venta v
            LEFT JOIN fruteria.cliente c ON v.id_c = c.id_c
            LEFT JOIN fruteria.empleado e ON v.id_e = e.id_e
            ORDER BY v.folio_v
            LIMIT 5
        `);

        console.log('\n✅ Resultado de la consulta corregida:');
        result.rows.forEach(row => {
            console.log('  ', JSON.stringify(row));
        });

    } catch (error) {
        console.error('❌ Error en la consulta corregida:', error.message);
        console.error('Código:', error.code);
        console.error('Detalle:', error.detail);
        console.error('Posición:', error.position);
    } finally {
        await client.end();
    }
}

testFixedQuery();