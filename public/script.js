const API_BASE = '/api';

let productos = [], clientes = [], empleados = [], proveedores = [], ventas = [], compras = [];
let cart = [], cartCompra = [];

document.addEventListener('DOMContentLoaded', () => { initializeApp(); setupEventListeners(); });

function initializeApp() {
    setupNavigation();
    loadDashboardData();
    loadProductos(); loadClientes(); loadEmpleados(); loadProveedores(); loadVentas(); loadCompras();
    showSection('dashboard');
}

function setupEventListeners() {
    const forms = [
        { id: 'form-cliente', action: saveCliente }, { id: 'form-empleado', action: saveEmpleado },
        { id: 'form-proveedor', action: saveProveedor }, { id: 'form-venta', action: saveVenta },
        { id: 'form-compra', action: saveCompra }
    ];
    forms.forEach(i => { const f = document.getElementById(i.id); if(f) f.addEventListener('submit', async (e) => { e.preventDefault(); await i.action(); }); });
    const ov = document.getElementById('modal-overlay'); if(ov) ov.addEventListener('click', (e) => { if(e.target===ov) closeModal(); });
    const s = document.getElementById('search-productos'); if(s) s.addEventListener('input', function(){ renderProductos(productos.filter(p=>p.descripcion.toLowerCase().includes(this.value.toLowerCase())||p.codigo.toString().includes(this.value))); });
}

// DASHBOARD (NUEVO)
async function loadDashboardData() {
    try {
        const d = await (await fetch(`${API_BASE}/dashboard`)).json();
        
        // KPIs Totales
        const setTxt = (id, txt) => { if(document.getElementById(id)) document.getElementById(id).textContent = txt; };
        setTxt('cnt-productos', d.totales.productos);
        setTxt('cnt-clientes', d.totales.clientes);
        setTxt('cnt-empleados', d.totales.empleados);
        setTxt('cnt-ventas', d.totales.ventas);
        setTxt('cnt-proveedores', d.totales.compras); // Reutilizando para contar total transacciones o proveedores si lo ajustas

        // KPIs Dinero
        const v = parseFloat(d.dinero.ventas || 0);
        const c = parseFloat(d.dinero.compras || 0);
        setTxt('dash-ventas', `$${v.toFixed(2)}`);
        setTxt('dash-compras', `$${c.toFixed(2)}`);
        
        const g = v - c;
        const gEl = document.getElementById('dash-ganancia');
        gEl.textContent = `$${g.toFixed(2)}`;
        gEl.style.color = g >= 0 ? '#2ecc71' : '#e74c3c';

        // Tabla Stock Bajo
        const tStock = document.getElementById('table-stock-bajo');
        if(d.stockBajo.length === 0) tStock.innerHTML = '<tr><td colspan="3" style="text-align:center">Todo en orden ✅</td></tr>';
        else tStock.innerHTML = d.stockBajo.map(i => `<tr><td>${i.descripcion}</td><td>${i.unidad_medida}</td><td><span class="stock-warning">${i.existencia}</span></td></tr>`).join('');

        // Tabla Recientes
        const tRec = document.getElementById('table-recent-sales');
        if(d.recientes.length === 0) tRec.innerHTML = '<tr><td colspan="3">Sin ventas recientes</td></tr>';
        else tRec.innerHTML = d.recientes.map(i => `<tr><td>#${i.folio_v}</td><td>${i.fecha_fmt}</td><td class="price-tag">$${parseFloat(i.total).toFixed(2)}</td></tr>`).join('');

    } catch(e) { console.error(e); }
}

// NAVEGACION Y UI
function setupNavigation() { document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', (e) => { e.preventDefault(); showSection(l.dataset.section); document.querySelectorAll('.nav-link').forEach(x => x.classList.remove('active')); l.classList.add('active'); })); }
function showSection(id) { document.querySelectorAll('.section').forEach(s => s.classList.remove('active')); document.getElementById(id).classList.add('active'); }
function showToast(m, t='success') { const c = document.getElementById('toast-container'); const d = document.createElement('div'); d.className=`toast ${t}`; d.innerHTML=`<span>${m}</span>`; c.appendChild(d); setTimeout(()=>d.remove(), 3000); }
function closeModal() { document.getElementById('modal-overlay').style.display='none'; document.querySelectorAll('.modal').forEach(m=>m.style.display='none'); }
function openStaticModal(id) { closeModal(); document.getElementById(id).style.display='block'; document.getElementById('modal-overlay').style.display='flex'; }

// CARGADORES DE DATOS
async function loadProductos() { productos = await (await fetch(`${API_BASE}/productos`)).json(); renderProductos(); }
function renderProductos(l=productos) { 
    const t=document.getElementById('productos-table'); if(!t)return; 
    t.innerHTML = l.length ? l.map(p=>`<tr><td>${p.codigo}</td><td>${p.descripcion}</td><td>${p.categoria}</td><td>${p.unidad_medida}</td><td>${p.existencia}</td><td>$${p.precio_c}</td><td>$${p.precio_v}</td><td><button class="btn btn-sm btn-info" onclick="editGeneric()"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-danger" onclick="deleteGeneric('${API_BASE}/productos/${p.codigo}', loadProductos)"><i class="fas fa-trash"></i></button></td></tr>`).join('') : '<tr><td colspan="8">Vacío</td></tr>'; 
}
async function loadClientes() { clientes = await (await fetch(`${API_BASE}/clientes`)).json(); renderTable('clientes', clientes, ['id_c','nombre','telefono','rfc','domicilio'], 'clientes', loadClientes); }
async function loadEmpleados() { empleados = await (await fetch(`${API_BASE}/empleados`)).json(); renderTable('empleados', empleados, ['id_e','nombre','turno','salario'], 'empleados', loadEmpleados); }
async function loadProveedores() { proveedores = await (await fetch(`${API_BASE}/proveedores`)).json(); renderTable('proveedores', proveedores, ['id_p','nombre','contacto','telefono','direccion'], 'proveedores', loadProveedores); }
async function loadVentas() { ventas = await (await fetch(`${API_BASE}/ventas`)).json(); const t=document.getElementById('ventas-table'); if(t) t.innerHTML=ventas.map(v=>`<tr><td>${v.folio_v}</td><td>${new Date(v.fecha).toLocaleDateString()}</td><td>${v.nombre_cliente}</td><td>${v.nombre_empleado}</td><td>$${parseFloat(v.total_venta).toFixed(2)}</td><td>-</td></tr>`).join(''); }
async function loadCompras() { compras = await (await fetch(`${API_BASE}/compras`)).json(); const t=document.getElementById('compras-table'); if(t) t.innerHTML=compras.map(c=>`<tr><td>${c.folio_c}</td><td>${c.lote}</td><td>${new Date(c.fecha).toLocaleDateString()}</td><td>${c.nombre_proveedor}</td><td>${c.nombre_empleado}</td><td>$${parseFloat(c.total_compra).toFixed(2)}</td></tr>`).join(''); }

// HELPERS TABLA
function renderTable(id, data, cols, endpoint, reload) {
    const t = document.getElementById(`${id}-table`); if(!t) return;
    t.innerHTML = data.length ? data.map(i => `<tr>${cols.map(c=>`<td>${i[c]||'-'}</td>`).join('')}<td><button class="btn btn-sm btn-danger" onclick="deleteGeneric('${API_BASE}/${endpoint}/${i[cols[0]]}', ${reload.name})"><i class="fas fa-trash"></i></button></td></tr>`).join('') : `<tr><td colspan="${cols.length+1}">Vacío</td></tr>`;
}

// MODALES
function showAddProductModal() { /* Lógica producto dinámico */ const ov=document.getElementById('modal-overlay'); const mo=document.getElementById('modal-producto'); closeModal(); mo.innerHTML=`<div class="modal-header"><h3>Producto</h3><button class="modal-close" onclick="closeModal()">x</button></div><div class="modal-body"><form id="prod-dyn"><div class="form-group"><label>Cod</label><input name="codigo" required></div><div class="form-group"><label>Desc</label><input name="descripcion" required></div><div class="form-group"><label>Cat</label><select name="categoria"><option>Fruta</option><option>Verdura</option></select></div><div class="form-group"><label>Uni</label><select name="unidad_medida"><option>kg</option><option>pz</option></select></div><div class="form-group"><label>Exist</label><input type="number" name="existencia"></div><div class="form-group"><label>$Compra</label><input type="number" step="0.01" name="precio_c"></div><div class="form-group"><label>$Venta</label><input type="number" step="0.01" name="precio_v"></div><button class="btn btn-primary">Guardar</button></form></div>`; mo.style.display='block'; ov.style.display='flex'; document.getElementById('prod-dyn').addEventListener('submit', async(e)=>{e.preventDefault(); await fetch(`${API_BASE}/productos`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))}); showToast('Listo'); closeModal(); loadProductos(); loadDashboardData();}); }
function showAddClientModal() { resetForm('form-cliente', 'cli-id'); openStaticModal('modal-cliente'); }
function showAddEmpleadoModal() { resetForm('form-empleado', 'emp-id'); openStaticModal('modal-empleado'); }
function showAddProveedorModal() { resetForm('form-proveedor', 'prov-id'); openStaticModal('modal-proveedor'); }
function resetForm(fid, iid) { document.getElementById(fid).reset(); document.getElementById(iid).value=''; }

// GUARDAR GENERICO
async function saveGeneric(url, data, reload) { await fetch(url, {method:data.id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); showToast('Guardado'); closeModal(); reload(); loadDashboardData(); }
async function saveCliente() { await saveGeneric(`${API_BASE}/clientes/${val('cli-id')}`, { nombre:val('cli-nombre'), telefono:val('cli-tel'), correo:val('cli-correo'), rfc:val('cli-rfc'), domicilio:val('cli-dom') }, loadClientes); }
async function saveEmpleado() { await saveGeneric(`${API_BASE}/empleados/${val('emp-id')}`, { nombre:val('emp-nombre'), puesto:val('emp-puesto'), turno:val('emp-turno'), telefono:val('emp-telefono'), salario:val('emp-salario') }, loadEmpleados); }
async function saveProveedor() { await saveGeneric(`${API_BASE}/proveedores/${val('prov-id')}`, { nombre:val('prov-nombre'), contacto:val('prov-contacto'), telefono:val('prov-telefono'), direccion:val('prov-direccion') }, loadProveedores); }
function val(id) { return document.getElementById(id).value; }

// BORRAR GENERICO
async function deleteGeneric(url, reload) { if(confirm('¿Eliminar?')) { await fetch(url, {method:'DELETE'}); reload(); loadDashboardData(); } }
function editGeneric() { showToast('Edición disponible borrando y creando de nuevo por ahora', 'info'); }

// VENTAS Y COMPRAS LOGICA
function showAddSaleModal() { fillSel('venta-cliente',clientes,'id_c','nombre'); fillSel('venta-empleado',empleados,'id_e','nombre'); fillSel('venta-producto',productos,'codigo','descripcion',true); cart=[]; renderCart('venta'); openStaticModal('modal-venta'); }
function showAddCompraModal() { fillSel('compra-proveedor',proveedores,'id_p','nombre'); fillSel('compra-empleado',empleados,'id_e','nombre'); fillSel('compra-producto',productos,'codigo','descripcion',false,true); cartCompra=[]; renderCart('compra'); openStaticModal('modal-compra'); }

function fillSel(id, arr, val, txt, isSale, isBuy) { document.getElementById(id).innerHTML='<option value="">Seleccionar...</option>'+arr.map(i=>`<option value="${i[val]}" data-p="${isSale?i.precio_v:isBuy?i.precio_c:0}">${i[txt]}</option>`).join(''); }

function addToCart() { addC('venta', cart); }
function addToPurchaseCart() { addC('compra', cartCompra); }

function addC(type, arr) {
    const sel=document.getElementById(`${type}-producto`); const cant=parseFloat(document.getElementById(`${type}-cantidad`).value);
    if(!sel.value) return;
    arr.push({ c:sel.value, n:sel.options[sel.selectedIndex].text, q:cant, p:parseFloat(sel.options[sel.selectedIndex].dataset.p) });
    renderCart(type);
}

function renderCart(type) {
    const arr = type==='venta'?cart:cartCompra;
    let tot=0; document.getElementById(`${type}-carrito`).innerHTML=arr.map((i,x)=>{ tot+=i.q*i.p; return `<tr><td>${i.n}</td><td>${i.q}</td><td>$${(i.q*i.p).toFixed(2)}</td><td><button type="button" onclick="delC('${type}',${x})">x</button></td></tr>`; }).join('');
    document.getElementById(`${type}-total`).textContent=tot.toFixed(2);
}
function delC(t,x) { (t==='venta'?cart:cartCompra).splice(x,1); renderCart(t); }

async function saveVenta() { 
    await fetch(`${API_BASE}/ventas`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id_c:val('venta-cliente'),id_e:val('venta-empleado'),detalles:cart.map(i=>({codigo:i.c,cantidad:i.q}))})}); 
    showToast('Venta OK'); closeModal(); loadVentas(); loadProductos(); loadDashboardData(); 
}
async function saveCompra() { 
    await fetch(`${API_BASE}/compras`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id_p:val('compra-proveedor'),id_e:val('compra-empleado'),lote:val('compra-lote'),detalles:cartCompra.map(i=>({codigo:i.c,cantidad:i.q,costo:i.p}))})}); 
    showToast('Compra OK'); closeModal(); loadCompras(); loadProductos(); loadDashboardData(); 
}