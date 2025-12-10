const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'fruteria',
    user: 'postgres',
    password: 'admin',
    schema: 'fruteria'
});

async function checkTableStructure() {
    try {
        await client.connect();

        console.log('📋 Estructura de las tablas que causan error:\n');

        // Check cliente table
        console.log('Tabla CLIENTE:');
        const clienteColumns = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'fruteria' AND table_name = 'cliente'
            ORDER BY ordinal_position;
        `);

        clienteColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
        });

        // Check empleado table
        console.log('\nTabla EMPLEADO:');
        const empleadoColumns = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'fruteria' AND table_name = 'empleado'
            ORDER BY ordinal_position;
        `);

        empleadoColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
        });

        // Check proveedor table
        console.log('\nTabla PROVEEDOR:');
        const proveedorColumns = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'fruteria' AND table_name = 'proveedor'
            ORDER BY ordinal_position;
        `);

        proveedorColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

checkTableStructure();