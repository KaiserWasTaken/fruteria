const express = require('express');
const cors = require('cors');
const { Pool, Client } = require('pg');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'fruteria',
    user: 'postgres',
    password: 'admin',
    schema: 'fruteria'
});

async function getNextId(client, table, idColumn) {
    const res = await client.query(`SELECT COALESCE(MAX(${idColumn}), 0) + 1 as next_id FROM fruteria.${table}`);
    return res.rows[0].next_id;
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// --- API LOGIN ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });
    const client = new Client({ host: 'localhost', port: 5432, database: 'fruteria', user: username, password: password });
    try {
        await client.connect();
        const { rows } = await client.query(`SELECT r.rolname FROM pg_roles r JOIN pg_auth_members m ON m.roleid = r.oid JOIN pg_roles u ON u.oid = m.member WHERE u.rolname = current_user`);
        const roles = rows.map(r => r.rolname.toLowerCase());
        const validos = ['dueño', 'dueno', 'gerente', 'cajero', 'bodeguero', 'postgres'];
        const rol = roles.find(r => validos.includes(r)) || (username === 'postgres' ? 'admin' : null);
        if (!rol) return res.status(403).json({ error: 'Sin permisos' });
        res.json({ ok: true, username, rol });
    } catch (e) { res.status(401).json({ error: 'Credenciales inválidas' }); } 
    finally { client.end().catch(()=>{}); }
});

// --- NUEVO: GESTIÓN DE USUARIOS DE BASE DE DATOS ---
app.get('/api/usuarios', async (req, res) => {
    try {
        // Obtenemos usuarios y sus roles (excluyendo los del sistema)
        const result = await pool.query(`
            SELECT u.rolname as usuario, r.rolname as rol
            FROM pg_roles u
            JOIN pg_auth_members m ON m.member = u.oid
            JOIN pg_roles r ON m.roleid = r.oid
            WHERE r.rolname IN ('dueno', 'gerente', 'cajero', 'bodeguero', 'contador', 'proveedor_rol', 'cliente_rol')
            ORDER BY u.rolname
        `);
        res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/usuarios', async (req, res) => {
    const { usuario, password, rol } = req.body;
    if(!usuario || !password || !rol) return res.status(400).json({error:'Faltan datos'});
    
    // Lista blanca de roles para evitar inyección o creación de superusuarios
    const rolesPermitidos = ['dueno', 'gerente', 'cajero', 'bodeguero', 'contador', 'proveedor_rol', 'cliente_rol'];
    if(!rolesPermitidos.includes(rol)) return res.status(400).json({error:'Rol no válido'});

    try {
        // IMPORTANTE: En Postgres no se pueden pasar identificadores (nombres de usuario/rol) como parámetros ($1).
        // Se deben sanitizar o concatenar con mucho cuidado. Aquí asumimos input simple alfanumérico.
        // ADVERTENCIA: Esto es para un taller académico. En producción usar librerías de formateo seguro (pg-format).
        await pool.query(`CREATE USER "${usuario}" WITH PASSWORD '${password}' IN ROLE "${rol}"`);
        // Dar permiso de conexión explícito (opcional, pero buena práctica)
        await pool.query(`GRANT CONNECT ON DATABASE fruteria TO "${usuario}"`);
        
        res.json({ message: 'Usuario creado correctamente' });
    } catch (e) { 
        res.status(500).json({ error: 'Error creando usuario: ' + e.message }); 
    }
});

// --- DASHBOARD ---
app.get('/api/dashboard', async (req, res) => {
    try {
        const counts = await Promise.all([
            pool.query('SELECT COUNT(*) FROM fruteria.producto'),
            pool.query('SELECT COUNT(*) FROM fruteria.cliente'),
            pool.query('SELECT COUNT(*) FROM fruteria.empleado'),
            pool.query('SELECT COUNT(*) FROM fruteria.venta'),
            pool.query('SELECT COUNT(*) FROM fruteria.compra')
        ]);
        const ventasMes = await pool.query(`SELECT COALESCE(SUM(dv.cantidad * p.precio_v), 0) as monto FROM fruteria.venta v JOIN fruteria.detalle_venta dv ON v.folio_v = dv.folio_v JOIN fruteria.producto p ON dv.codigo = p.codigo WHERE v.fecha >= CURRENT_DATE - INTERVAL '30 days'`);
        const comprasMes = await pool.query(`SELECT COALESCE(SUM(dc.cantidad * p.precio_c), 0) as monto FROM fruteria.compra c JOIN fruteria.detalle_compra dc ON c.folio_c = dc.folio_c JOIN fruteria.producto p ON dc.codigo = p.codigo WHERE c.fecha >= CURRENT_DATE - INTERVAL '30 days'`);
        const stockBajo = await pool.query(`SELECT descripcion, existencia, unidad_medida FROM fruteria.producto WHERE existencia <= 10 ORDER BY existencia ASC LIMIT 5`);
        const recientes = await pool.query(`SELECT v.folio_v, TO_CHAR(v.fecha, 'DD/MM/YYYY') as f, (SELECT COALESCE(SUM(dv.cantidad * p.precio_v), 0) FROM fruteria.detalle_venta dv JOIN fruteria.producto p ON dv.codigo = p.codigo WHERE dv.folio_v = v.folio_v) as t FROM fruteria.venta v ORDER BY v.folio_v DESC LIMIT 5`);

        res.json({
            totales: {
                productos: counts[0].rows[0].count, clientes: counts[1].rows[0].count,
                empleados: counts[2].rows[0].count, ventas: counts[3].rows[0].count,
                compras: counts[4].rows[0].count
            },
            dinero: { ventas: ventasMes.rows[0].monto, compras: comprasMes.rows[0].monto },
            stockBajo: stockBajo.rows, recientes: recientes.rows
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- API REST ---
app.get('/api/productos', async (req, res) => { const r = await pool.query('SELECT * FROM fruteria.producto ORDER BY descripcion'); res.json(r.rows); });
app.post('/api/productos', async (req, res) => { try { const {codigo,descripcion,categoria,unidad_medida,existencia,precio_c,precio_v}=req.body; await pool.query('INSERT INTO fruteria.producto VALUES ($1,$2,$3,$4,$5,$6,$7)', [parseInt(codigo),descripcion,categoria,unidad_medida,parseInt(existencia),parseFloat(precio_c),parseFloat(precio_v)]); res.json({message:'OK'}); } catch(e){res.status(500).json(e)} });
app.delete('/api/productos/:code', async (req, res) => { try { await pool.query('DELETE FROM fruteria.producto WHERE codigo=$1', [parseInt(req.params.code)]); res.json({message:'OK'}); } catch(e){res.status(500).json(e)} });

app.get('/api/clientes', async (req, res) => { const r = await pool.query(`SELECT c.id_c, c.telefono, c.rfc, c.domicilio, COALESCE(pf.nombre, pm.razon_social) as nombre FROM fruteria.cliente c LEFT JOIN fruteria.p_fisica pf ON c.id_c=pf.id_c LEFT JOIN fruteria.p_moral pm ON c.id_c=pm.id_c`); res.json(r.rows); });
app.post('/api/clientes', async (req, res) => { const c = await pool.connect(); try { await c.query('BEGIN'); const id=await getNextId(c,'cliente','id_c'); await c.query('INSERT INTO fruteria.cliente VALUES ($1,$2,$3,$4)',[id,req.body.telefono,req.body.rfc,req.body.domicilio]); await c.query('INSERT INTO fruteria.p_fisica VALUES ($1,$2)',[id,req.body.nombre]); await c.query('COMMIT'); res.json({msg:'OK'}); } catch(e){await c.query('ROLLBACK');res.status(500).json(e)} finally{c.release()} });

app.get('/api/empleados', async (req, res) => { const r = await pool.query('SELECT * FROM fruteria.empleado'); res.json(r.rows); });
app.post('/api/empleados', async (req, res) => { try { const id=await getNextId(pool,'empleado','id_e'); await pool.query('INSERT INTO fruteria.empleado VALUES ($1,$2,$3,$4)',[id,req.body.nombre,req.body.turno,req.body.salario]); res.json({msg:'OK'}); } catch(e){res.status(500).json(e)} });

app.get('/api/proveedores', async (req, res) => { const r = await pool.query('SELECT * FROM fruteria.proveedor'); res.json(r.rows); });
app.post('/api/proveedores', async (req, res) => { try { const id=await getNextId(pool,'proveedor','id_p'); await pool.query('INSERT INTO fruteria.proveedor VALUES ($1,$2,$3,$4,$5)',[id,req.body.nombre,req.body.ciudad,req.body.contacto,req.body.telefono]); res.json({msg:'OK'}); } catch(e){res.status(500).json(e)} });

app.get('/api/ventas', async (req, res) => { const r=await pool.query(`SELECT v.folio_v, v.fecha, COALESCE(pf.nombre, pm.razon_social,'Cliente') as nombre_cliente, e.nombre as nombre_empleado, (SELECT COALESCE(SUM(dv.cantidad*p.precio_v),0) FROM fruteria.detalle_venta dv JOIN fruteria.producto p ON dv.codigo=p.codigo WHERE dv.folio_v=v.folio_v) as total_venta FROM fruteria.venta v LEFT JOIN fruteria.cliente c ON v.id_c=c.id_c LEFT JOIN fruteria.p_fisica pf ON c.id_c=pf.id_c LEFT JOIN fruteria.p_moral pm ON c.id_c=pm.id_c LEFT JOIN fruteria.empleado e ON v.id_e=e.id_e ORDER BY v.folio_v DESC LIMIT 50`); res.json(r.rows); });
app.post('/api/ventas', async (req, res) => { const c = await pool.connect(); try { await c.query('BEGIN'); const f=await getNextId(c,'venta','folio_v'); await c.query('INSERT INTO fruteria.venta VALUES ($1,NOW(),$2,$3)',[f,req.body.id_c,req.body.id_e]); for(const d of req.body.detalles){ await c.query('INSERT INTO fruteria.detalle_venta VALUES ($1,$2,$3,$4)',[d.codigo,f,'Venta',d.cantidad]); await c.query('UPDATE fruteria.producto SET existencia=existencia-$1 WHERE codigo=$2',[d.cantidad,d.codigo]); } await c.query('COMMIT'); res.json({msg:'OK'}); } catch(e){await c.query('ROLLBACK');res.status(500).json(e)} finally{c.release()} });

app.get('/api/compras', async (req, res) => { const r=await pool.query(`SELECT c.folio_c,c.no_lote,c.fecha,p.nombre as nombre_proveedor,e.nombre as nombre_empleado,(SELECT COALESCE(SUM(dc.cantidad*prod.precio_c),0) FROM fruteria.detalle_compra dc JOIN fruteria.producto prod ON dc.codigo=prod.codigo WHERE dc.folio_c=c.folio_c) as total_compra FROM fruteria.compra c LEFT JOIN fruteria.proveedor p ON c.id_p=p.id_p LEFT JOIN fruteria.empleado e ON c.id_e=e.id_e ORDER BY c.folio_c DESC LIMIT 50`); res.json(r.rows); });
app.post('/api/compras', async (req, res) => { const c = await pool.connect(); try { await c.query('BEGIN'); const f=await getNextId(c,'compra','folio_c'); await c.query('INSERT INTO fruteria.compra VALUES ($1,$2,NOW(),$3,$4)',[f,req.body.lote||0,req.body.id_p,req.body.id_e]); for(const d of req.body.detalles){ await c.query('INSERT INTO fruteria.detalle_compra VALUES ($1,$2,$3)',[f,d.codigo,d.cantidad]); await c.query('UPDATE fruteria.producto SET existencia=existencia+$1 WHERE codigo=$2',[d.cantidad,d.codigo]); } await c.query('COMMIT'); res.json({msg:'OK'}); } catch(e){await c.query('ROLLBACK');res.status(500).json(e)} finally{c.release()} });

app.listen(port, () => console.log(`🚀 http://localhost:${port}`));