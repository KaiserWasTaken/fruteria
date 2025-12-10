const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

/**
 * POST /api/login
 * Body: { username, password }
 * Valida contra PostgreSQL y devuelve { ok, username, rol } si es correcto.
 */
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
        return res.status(400).json({ error: 'Faltan datos' });

    // Conexión con el usuario que intenta iniciar sesión
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'fruteria',
        user: username,
        password: password
    });

    try {
        await client.connect(); // si falla → usuario/contraseña incorrectos

        // Obtener roles asignados a este usuario
        const rolQuery = `
            SELECT r.rolname
            FROM pg_roles r
            JOIN pg_auth_members m ON m.roleid = r.oid
            JOIN pg_roles u ON u.oid = m.member
            WHERE u.rolname = current_user;
        `;

        const { rows } = await client.query(rolQuery);
        const roles = rows.map(r => r.rolname.toLowerCase());

        // Filtrar solo roles que nos interesan (según tu matriz)
        const rolValido = roles.find(r =>
            [
                'dueño', 'dueno',   // por si usaste n o ñ
                'dba',
                'gerente',
                'cajero',
                'bodeguero',
                'contador',
                'proveedor_rol',
                'cliente_rol'
            ].includes(r)
        );

        if (!rolValido) {
            return res.status(403).json({ error: 'Usuario sin rol válido' });
        }

        return res.json({
            ok: true,
            username,
            rol: rolValido
        });

    } catch (err) {
        console.error('Error en login:', err.message);
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    } finally {
        client.end().catch(() => {});
    }
});

/**
 * GET /login
 * Devuelve una página HTML sencilla con el formulario de login
 * y el JavaScript embebido que llama a /api/login.
 */
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Login - Frutería</title>
    <style>
        body { font-family: Arial, sans-serif; background:#f5f5f5; display:flex; justify-content:center; align-items:center; height:100vh; margin:0; }
        .login-card { background:#fff; padding:20px 30px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.15); width:300px; }
        .login-card h1 { margin-top:0; font-size:20px; text-align:center; }
        .login-card input { width:100%; padding:8px; margin:8px 0; box-sizing:border-box; }
        .login-card button { width:100%; padding:10px; background:#27ae60; color:#fff; border:none; border-radius:4px; cursor:pointer; }
        .login-card button:hover { background:#219150; }
        #error { color:red; font-size:0.9em; min-height:1em; }
    </style>
</head>
<body>
    <div class="login-card">
        <h1>Frutería - Login</h1>
        <form id="form-login">
            <input type="text" id="username" placeholder="Usuario" required>
            <input type="password" id="password" placeholder="Contraseña" required>
            <button type="submit">Entrar</button>
            <p id="error"></p>
        </form>
    </div>

    <script>
        document.getElementById('form-login').addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            const errEl = document.getElementById('error');

            if (!res.ok || !data.ok) {
                errEl.textContent = data.error || 'Error de autenticación';
                return;
            }

            // Guardar datos básicos en localStorage (para usarlos luego en tu app)
            localStorage.setItem('username', data.username);
            localStorage.setItem('rol', data.rol);

            // Redirigir a la app principal (ajusta si tu index está en otra ruta)
            window.location.href = '/';
        });
    </script>
</body>
</html>`);
});

// Ruta raíz opcional (puedes cambiarla o quitarla si ya tienes otra app)
app.get('/', (req, res) => {
    res.send('<h2>Servidor de login de Frutería corriendo. Ve a <a href="/login">/login</a></h2>');
});

app.listen(port, () => {
    console.log(`🚀 Servidor de login escuchando en http://localhost:${port}`);
});
