const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'fruteria',
    user: 'postgres',
    password: '753159',
    schema: 'fruteria'
});

async function testConnection() {
    try {
        await client.connect();
        console.log('✅ Conexión exitosa a la base de datos PostgreSQL');

        // Get information about the database
        const result = await client.query(`
            SELECT table_name, table_schema
            FROM information_schema.tables
            WHERE table_schema = 'fruteria' OR table_schema = 'public'
            ORDER BY table_schema, table_name;
        `);

        console.log('\n📋 Tablas encontradas:');
        if (result.rows.length > 0) {
            result.rows.forEach(row => {
                console.log(`  - ${row.table_schema}.${row.table_name}`);
            });
        } else {
            console.log('  No se encontraron tablas. Explorando esquemas disponibles...');

            const schemas = await client.query(`
                SELECT schema_name
                FROM information_schema.schemata
                WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
                ORDER BY schema_name;
            `);

            console.log('Esquemas disponibles:');
            schemas.rows.forEach(schema => {
                console.log(`  - ${schema.schema_name}`);
            });
        }

    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:');
        console.error('Código:', error.code);
        console.error('Mensaje:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Sugerencia: Asegúrate de que PostgreSQL esté instalado y ejecutándose');
        } else if (error.code === '28P01') {
            console.log('\n💡 Sugerencia: Verifica el nombre de usuario o contraseña');
        } else if (error.code === '3D000') {
            console.log('\n💡 Sugerencia: La base de datos "fruteria" no existe');
        }
    } finally {
        await client.end();
    }
}

testConnection();