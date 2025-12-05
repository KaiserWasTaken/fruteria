const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'fruteria',
    user: 'postgres',
    password: '753159',
    schema: 'fruteria'
});

async function checkIds() {
    try {
        await client.connect();
        console.log('🔍 Verificando IDs en tablas...\n');

        // Check ventas y sus IDs de empleados
        console.log('📋 IDs en tabla venta:');
        const ventas = await client.query('SELECT folio_v, id_c, id_e FROM fruteria.venta');
        ventas.rows.forEach(row => {
            console.log(`  Venta ${row.folio_v}: id_c=${row.id_c}, id_e=${row.id_e}`);
        });

        console.log('\n📋 IDs en tabla empleado:');
        const empleados = await client.query('SELECT id_e, nombre FROM fruteria.empleado LIMIT 10');
        empleados.rows.forEach(row => {
            console.log(`  Empleado ${row.id_e}: ${row.nombre}`);
        });

        console.log('\n📋 IDs en tabla cliente:');
        const clientes = await client.query('SELECT id_c, telefono FROM fruteria.cliente LIMIT 10');
        clientes.rows.forEach(row => {
            console.log(`  Cliente ${row.id_c}: ${row.telefono}`);
        });

        console.log('\n🔍 Verificando si hay IDs de ventas que no existen en empleados:');
        const problematicSales = await client.query(`
            SELECT v.folio_v, v.id_e
            FROM fruteria.venta v
            LEFT JOIN fruteria.empleado e ON v.id_e = e.id_e
            WHERE e.id_e IS NULL
        `);

        if (problematicSales.rows.length > 0) {
            console.log('❌ IDs de empleados que no existen:');
            problematicSales.rows.forEach(row => {
                console.log(`  Venta ${row.folio_v}: id_e=${row.id_e} no existe en empleados`);
            });
        } else {
            console.log('✅ Todos los IDs de empleados son válidos');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkIds();