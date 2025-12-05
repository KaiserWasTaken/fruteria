const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'fruteria',
    user: 'postgres',
    password: 'admin',
    // No especificamos schema aquí para poder crearlo desde cero
});

const createTablesQuery = `
    -- 1. Reiniciar el esquema (Borrón y cuenta nueva)
    DROP SCHEMA IF EXISTS fruteria CASCADE;
    CREATE SCHEMA fruteria;
    SET search_path TO fruteria;

    -- 2. Tabla PRODUCTO
    CREATE TABLE producto (
        codigo VARCHAR(50) PRIMARY KEY,
        descripcion VARCHAR(200) NOT NULL,
        categoria VARCHAR(100),
        unidad_medida VARCHAR(20),
        existencia DECIMAL(10, 2) DEFAULT 0,
        precio_c DECIMAL(10, 2) NOT NULL, -- Precio Compra
        precio_v DECIMAL(10, 2) NOT NULL  -- Precio Venta
    );

    -- 3. Tabla CLIENTE
    CREATE TABLE cliente (
        id_c SERIAL PRIMARY KEY,
        nombre VARCHAR(150),
        telefono VARCHAR(20),
        rfc VARCHAR(20),
        domicilio TEXT,
        correo VARCHAR(100)
    );

    -- 4. Tabla EMPLEADO
    CREATE TABLE empleado (
        id_e SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        puesto VARCHAR(100),
        turno VARCHAR(50),
        salario DECIMAL(10, 2),
        telefono VARCHAR(20)
    );

    -- 5. Tabla PROVEEDOR
    CREATE TABLE proveedor (
        id_p SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        contacto VARCHAR(150),
        telefono VARCHAR(20),
        direccion TEXT
    );

    -- 6. Tabla VENTA (Cabecera)
    CREATE TABLE venta (
        folio_v SERIAL PRIMARY KEY,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        id_c INTEGER REFERENCES cliente(id_c),
        id_e INTEGER REFERENCES empleado(id_e)
    );

    -- 7. Tabla DETALLE_VENTA
    CREATE TABLE detalle_venta (
        id_dv SERIAL PRIMARY KEY,
        folio_v INTEGER REFERENCES venta(folio_v),
        codigo VARCHAR(50) REFERENCES producto(codigo),
        cantidad DECIMAL(10, 2) NOT NULL,
        observaciones TEXT
    );

    -- 8. Tabla COMPRA (Cabecera)
    CREATE TABLE compra (
        folio_c SERIAL PRIMARY KEY,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        id_p INTEGER REFERENCES proveedor(id_p),
        id_e INTEGER REFERENCES empleado(id_e),
        lote VARCHAR(50)
    );

    -- 9. Tabla DETALLE_COMPRA
    CREATE TABLE detalle_compra (
        id_dc SERIAL PRIMARY KEY,
        folio_c INTEGER REFERENCES compra(folio_c),
        codigo VARCHAR(50) REFERENCES producto(codigo),
        cantidad DECIMAL(10, 2) NOT NULL,
        costo_unitario DECIMAL(10, 2) -- Opcional, para registrar a cuánto se compró esa vez
    );

    -- DATOS DE PRUEBA (Opcional: Para que no esté vacío al iniciar)
    INSERT INTO producto (codigo, descripcion, categoria, unidad_medida, existencia, precio_c, precio_v) VALUES 
    ('MAN-ROJ', 'Manzana Roja', 'Frutas', 'kg', 50, 20.00, 35.00),
    ('PLA-TAB', 'Plátano Tabasco', 'Frutas', 'kg', 100, 12.00, 22.00);

    INSERT INTO empleado (nombre, puesto, turno, salario) VALUES 
    ('Juan Pérez', 'Vendedor', 'Matutino', 1200.00);

    INSERT INTO cliente (nombre, telefono) VALUES 
    ('Cliente Mostrador', '000-000-0000');
`;

async function initDB() {
    try {
        await client.connect();
        console.log('🔌 Conectado a PostgreSQL...');
        
        console.log('🛠️ Creando tablas y estructura...');
        await client.query(createTablesQuery);
        
        console.log('✅ ¡Base de datos "fruteria" creada exitosamente!');
        console.log('   Tablas creadas: producto, cliente, empleado, proveedor, venta, compra, detalles.');

    } catch (error) {
        console.error('❌ Error al crear la base de datos:', error);
    } finally {
        await client.end();
    }
}

initDB();