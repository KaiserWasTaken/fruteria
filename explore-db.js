const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'fruteria',
    user: 'postgres',
    password: '753159',
    schema: 'fruteria'
});

async function exploreDatabase() {
    try {
        await client.connect();
        console.log('🔍 Explorando estructura de la base de datos fruteria...\n');

        // Get table structure
        const tables = [
            'producto', 'proveedor', 'cliente', 'empleado',
            'venta', 'compra', 'detalle_venta', 'detalle_compra'
        ];

        for (const table of tables) {
            try {
                console.log(`📋 Tabla: ${table.toUpperCase()}`);

                // Get column information
                const columnsQuery = `
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_schema = 'fruteria' AND table_name = $1
                    ORDER BY ordinal_position;
                `;

                const columns = await client.query(columnsQuery, [table]);
                columns.rows.forEach(col => {
                    console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' (NOT NULL)' : ''}`);
                });

                // Get sample data
                const sampleQuery = `SELECT * FROM fruteria.${table} LIMIT 3;`;
                const sample = await client.query(sampleQuery);

                if (sample.rows.length > 0) {
                    console.log(`  📄 Muestra de datos (${sample.rows.length} registros):`);
                    sample.rows.forEach(row => {
                        console.log(`    ${JSON.stringify(row)}`);
                    });
                } else {
                    console.log(`  📄 Sin datos registrados`);
                }
                console.log('');

            } catch (error) {
                console.log(`  ❌ Error explorando tabla ${table}: ${error.message}\n`);
            }
        }

    } catch (error) {
        console.error('❌ Error explorando la base de datos:', error.message);
    } finally {
        await client.end();
    }
}

exploreDatabase();