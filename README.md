# Frutería "La Frescura" - Sistema de Gestión

Una aplicación web completa para la gestión de una frutería con base de datos PostgreSQL.

## 🚀 Características

### Módulos Principales
- **🏠 Dashboard**: Panel de control con estadísticas en tiempo real
- **🍎 Productos**: Gestión completa del inventario de productos
- **👥 Clientes**: Registro y gestión de clientes
- **👨‍💼 Empleados**: Administración del personal
- **🚛 Proveedores**: Gestión de proveedores
- **💰 Ventas**: Registro y seguimiento de ventas
- **📦 Compras**: Gestión de compras y proveedores

### Funcionalidades
- ✅ Conexión a base de datos PostgreSQL
- ✅ API REST completa
- ✅ Interfaz moderna y responsiva
- ✅ Dashboard con estadísticas
- ✅ Gestión CRUD de productos
- ✅ Búsqueda y filtrado
- ✅ Notificaciones en tiempo real
- ✅ Diseño móvil-friendly

## 📋 Requisitos

- Node.js 14+
- PostgreSQL 12+
- Navegador web moderno

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repositorio>
   cd fruteria
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar base de datos**
   - Asegúrate de que PostgreSQL esté corriendo
   - La conexión está configurada para:
     - Host: localhost
     - Port: 5432
     - Database: fruteria
     - User: postgres
     - Password: 753159
     - Schema: fruteria

4. **Iniciar la aplicación**
   ```bash
   npm start
   ```

5. **Acceder a la aplicación**
   - Abre tu navegador y visita: http://localhost:3000

## 📂 Estructura del Proyecto

```
fruteria/
├── public/
│   ├── index.html      # HTML principal
│   ├── styles.css      # Estilos CSS
│   └── script.js       # JavaScript frontend
├── server.js           # Servidor Node.js + Express
├── package.json        # Dependencias y scripts
├── test-db-connection.js # Prueba de conexión a BD
├── explore-db.js       # Explorador de estructura BD
└── README.md           # Este archivo
```

## 🗄️ Estructura de la Base de Datos

La aplicación utiliza las siguientes tablas del esquema `fruteria`:

### Tablas Principales
- **producto**: Catálogo de productos (frutas, verduras)
- **cliente**: Información de clientes
- **empleado**: Datos de empleados
- **proveedor**: Catálogo de proveedores
- **venta**: Registro de ventas
- **compra**: Registro de compras

### Tablas de Detalle
- **detalle_venta**: Detalle de productos vendidos
- **detalle_compra**: Detalle de productos comprados

### Tablas de Auditoría
- **auditoria**: Registro de cambios
- **supervisor**: Gestión de supervisores

## 🔧 Configuración

### Variables de Entorno
Puedes modificar la configuración de la base de datos en `server.js`:

```javascript
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'fruteria',
    user: 'postgres',
    password: '753159',
    schema: 'fruteria'
});
```

### Puerto del Servidor
Por defecto, la aplicación corre en el puerto 3000. Puedes cambiarlo en `server.js`:

```javascript
const port = process.env.PORT || 3000;
```

## 📱 Uso de la Aplicación

### 1. Dashboard
- Muestra estadísticas generales del negocio
- Total de productos, clientes, empleados
- Ventas y compras del mes
- Ganancias estimadas

### 2. Gestión de Productos
- Agregar nuevos productos
- Editar productos existentes
- Eliminar productos
- Búsqueda por descripción o categoría

### 3. Secciones Adicionales
- Clientes: Ver y gestionar información de clientes
- Empleados: Gestión de personal y salarios
- Proveedores: Catálogo de proveedores
- Ventas: Registro de transacciones de venta
- Compras: Gestión de compras a proveedores

## 🔌 API Endpoints

### Productos
- `GET /api/productos` - Obtener todos los productos
- `POST /api/productos` - Crear nuevo producto
- `PUT /api/productos/:codigo` - Actualizar producto
- `DELETE /api/productos/:codigo` - Eliminar producto

### Clientes
- `GET /api/clientes` - Obtener todos los clientes

### Empleados
- `GET /api/empleados` - Obtener todos los empleados

### Proveedores
- `GET /api/proveedores` - Obtener todos los proveedores

### Ventas
- `GET /api/ventas` - Obtener todas las ventas
- `POST /api/ventas` - Crear nueva venta

### Compras
- `GET /api/compras` - Obtener todas las compras

### Dashboard
- `GET /api/dashboard` - Obtener estadísticas generales

## 🎨 Diseño y Estilos

La aplicación utiliza un diseño moderno con:
- **Colores del tema**: Verde fresco, rojo manzana, naranja
- **Iconos**: Font Awesome 6.0
- **Responsive**: Adaptable a dispositivos móviles
- **Animaciones**: Transiciones suaves
- **Modales**: Formularios modales para operaciones CRUD

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error de conexión a la base de datos**
   - Verifica que PostgreSQL esté corriendo
   - Confirma las credenciales en `server.js`
   - Asegúrate de que la base de datos `fruteria` exista

2. **Puerto en uso**
   - Cambia el puerto en `server.js`
   - O detén el proceso que usa el puerto 3000

3. **Dependencias faltantes**
   - Ejecuta `npm install` para instalar todas las dependencias

### Logs y Depuración
- El servidor muestra logs en la consola
- Las operaciones de base de datos tienen manejo de errores
- Las notificaciones del sistema aparecen como toast en la interfaz

## 🚀 Despliegue

Para producción:
1. Configura las variables de entorno
2. Usa un proceso manager como PM2
3. Configura un proxy inverso (nginx)
4. Habilita HTTPS

## 📝 Licencia

Este proyecto es de uso educativo y demostrativo.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el repositorio
2. Crea una rama para tu feature
3. Realiza un commit con tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Contacto

Para soporte o preguntas, contacta al administrador del sistema.

---

**Frutería "La Frescura"** - Sistema de Gestión v1.0