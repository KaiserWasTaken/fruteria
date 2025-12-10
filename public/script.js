if (!localStorage.getItem('usuario')) window.location.href = '/';

const API_BASE = '/api';
let productos=[], clientes=[], empleados=[], proveedores=[], ventas=[], compras=[], usuarios=[];
let cart = [], cartCompra = [];

document.addEventListener('DOMContentLoaded', () => { initializeApp(); setupEventListeners(); });

function initializeApp() {
    setupNavigation();
    loadDashboardData();
    loadProductos(); loadClientes(); loadEmpleados(); loadProveedores(); loadVentas(); loadCompras(); 
    loadUsuarios(); // Cargar usuarios
    const uSpan = document.querySelector('.user-info span');
    if(uSpan) uSpan.innerHTML = `<i class="fas fa-user"></i> ${localStorage.getItem('usuario')}`;
}

function setupEventListeners() {
    const forms = [
        {id:'form-cliente',a:saveCliente}, {id:'form-empleado',a:saveEmpleado},
        {id:'form-proveedor',a:saveProveedor}, {id:'form-venta',a:saveVenta}, 
        {id:'form-compra',a:saveCompra}, {id:'form-usuario',a:saveUsuario} // Nuevo listener
    ];
    forms.forEach(i=>{ const f=document.getElementById(i.id); if(f) f.addEventListener('submit', async(e)=>{ e.preventDefault(); await i.a(); }); });
    const ov=document.getElementById('modal-overlay'); if(ov) ov.addEventListener('click', (e)=>{ if(e.target===ov) closeModal(); });
    const s=document.getElementById('search-productos'); if(s) s.addEventListener('input', function(){ renderProductos(productos.filter(p=>p.descripcion.toLowerCase().includes(this.value.toLowerCase()))); });
}

// DASHBOARD
async function loadDashboardData() {
    try {
        const res = await fetch(`${API_BASE}/dashboard`); if(!res.ok)return;
        const d = await res.json();
        const set = (id, txt) => { const el = document.getElementById(id); if(el) el.textContent = txt; };
        if(d.totales) {
            ['productos','clientes','empleados','ventas','compras'].forEach(k => { set(`cnt-${k=='compras'?'proveedores':k}`, d.totales[k]); set(`total-${k}`, d.totales[k]); });
        }
        if(d.dinero) {
            const v = parseFloat(d.dinero.ventas||0), c = parseFloat(d.dinero.compras||0);
            set('dash-ventas', `$${v.toFixed(2)}`); set('dash-compras', `$${c.toFixed(2)}`); set('dash-ganancia', `$${(v-c).toFixed(2)}`);
            set('monto-ventas', v.toFixed(2)); set('monto-compras', c.toFixed(2)); set('ganancias-mes', `$${(v-c).toFixed(2)}`);
            const gEl = document.getElementById('dash-ganancia'); if(gEl) gEl.style.color = (v-c) >= 0 ? '#2ecc71' : '#e74c3c';
        }
        const tStock = document.getElementById('table-stock-bajo');
        if(tStock) tStock.innerHTML = (d.stockBajo||[]).map(i=>`<tr><td>${i.descripcion}</td><td>${i.unidad_medida}</td><td style="color:red;font-weight:bold">${i.existencia}</td></tr>`).join('') || '<tr><td colspan="3">OK</td></tr>';
        const tRec = document.getElementById('table-recent-sales');
        if(tRec) tRec.innerHTML = (d.recientes||[]).map(i=>`<tr><td>#${i.folio_v}</td><td>${i.f}</td><td style="color:green">$${parseFloat(i.t).toFixed(2)}</td></tr>`).join('') || '<tr><td colspan="3">Sin datos</td></tr>';
    } catch(e) {}
}

// CRUD
async function loadProductos(){ productos = await (await fetch(`${API_BASE}/productos`)).json(); renderProductos(); }
function renderProductos(l=productos){ const t=document.getElementById('productos-table'); if(t) t.innerHTML=l.map(p=>`<tr><td>${p.codigo}</td><td>${p.descripcion}</td><td>${p.categoria}</td><td>${p.unidad_medida}</td><td>${p.existencia}</td><td>$${p.precio_c}</td><td>$${p.precio_v}</td><td><button class="btn btn-sm btn-danger" onclick="del('/productos/${p.codigo}')"><i class="fas fa-trash"></i></button></td></tr>`).join(''); }
async function loadClientes(){ clientes=await(await fetch(`${API_BASE}/clientes`)).json(); renderT('clientes',clientes,['id_c','nombre','telefono','rfc','domicilio'],'/clientes','id_c'); }
async function loadEmpleados(){ empleados=await(await fetch(`${API_BASE}/empleados`)).json(); renderT('empleados',empleados,['id_e','nombre','turno','salario'],'/empleados','id_e'); }
async function loadProveedores(){ proveedores=await(await fetch(`${API_BASE}/proveedores`)).json(); renderT('proveedores',proveedores,['id_p','nombre','ciudad','contacto','tel_contacto'],'/proveedores','id_p'); }
async function loadVentas(){ ventas=await(await fetch(`${API_BASE}/ventas`)).json(); const t=document.getElementById('ventas-table'); if(t) t.innerHTML=ventas.map(v=>`<tr><td>${v.folio_v}</td><td>${v.fecha}</td><td>${v.nombre_cliente}</td><td>${v.nombre_empleado}</td><td>$${parseFloat(v.total_venta).toFixed(2)}</td></tr>`).join(''); }
async function loadCompras(){ compras=await(await fetch(`${API_BASE}/compras`)).json(); const t=document.getElementById('compras-table'); if(t) t.innerHTML=compras.map(c=>`<tr><td>${c.folio_c}</td><td>${c.no_lote}</td><td>${c.fecha}</td><td>${c.nombre_proveedor}</td><td>${c.nombre_empleado}</td><td>$${parseFloat(c.total_compra).toFixed(2)}</td></tr>`).join(''); }
function renderT(dom,d,cols,url,idF){ const t=document.getElementById(`${dom}-table`); if(t) t.innerHTML=d.map(i=>`<tr>${cols.map(c=>`<td>${i[c]||'-'}</td>`).join('')}<td><button class="btn btn-sm btn-danger" onclick="del('${url}/${i[idF]}')"><i class="fas fa-trash"></i></button></td></tr>`).join(''); }

// USUARIOS (NUEVO)
async function loadUsuarios() {
    try {
        usuarios = await (await fetch(`${API_BASE}/usuarios`)).json();
        const t = document.getElementById('usuarios-table');
        if(t) t.innerHTML = usuarios.map(u => `
            <tr>
                <td><strong>${u.usuario}</strong></td>
                <td><span class="role-badge">${u.rol}</span></td>
                <td><span style="color:green">Activo</span></td>
            </tr>
        `).join('');
    } catch(e) {}
}
function showAddUsuarioModal() { reset('form-usuario'); openM('modal-usuario'); }
async function saveUsuario() {
    const data = {
        usuario: val('usr-nombre'),
        password: val('usr-pass'),
        rol: val('usr-rol')
    };
    if(confirm(`¿Crear usuario de base de datos "${data.usuario}" con rol "${data.rol}"?`)) {
        await post('/usuarios', data);
        loadUsuarios();
    }
}

// MODALES GENERICOS
function showAddProductModal(){ const m=document.getElementById('modal-producto'); openM('modal-producto'); m.innerHTML=`<div class="modal-header"><h3>Producto</h3><button class="modal-close" onclick="closeM()">x</button></div><div class="modal-body"><form id="pdyn"><div class="form-group"><label>Cod</label><input name="codigo" required></div><div class="form-group"><label>Desc</label><input name="descripcion"></div><div class="form-group"><label>Cat</label><input name="categoria"></div><div class="form-group"><label>Unidad</label><input name="unidad_medida"></div><div class="form-group"><label>Exist</label><input name="existencia"></div><div class="form-group"><label>$C</label><input name="precio_c"></div><div class="form-group"><label>$V</label><input name="precio_v"></div><button class="btn btn-primary">Guardar</button></form></div>`; document.getElementById('pdyn').onsubmit=async(e)=>{e.preventDefault(); await fetch(`${API_BASE}/productos`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))}); closeM(); loadProductos();}; }
function showAddClientModal(){ reset('form-cliente'); openM('modal-cliente'); }
function showAddEmpleadoModal(){ reset('form-empleado'); openM('modal-empleado'); }
function showAddProveedorModal(){ reset('form-proveedor'); openM('modal-proveedor'); }
function showAddSaleModal(){ fill('venta-cliente',clientes,'id_c','nombre'); fill('venta-empleado',empleados,'id_e','nombre'); fill('venta-producto',productos,'codigo','descripcion',true); cart=[]; renderC('venta'); openM('modal-venta'); }
function showAddCompraModal(){ fill('compra-proveedor',proveedores,'id_p','nombre'); fill('compra-empleado',empleados,'id_e','nombre'); fill('compra-producto',productos,'codigo','descripcion',false,true); cartCompra=[]; renderC('compra'); openM('modal-compra'); }

async function saveCliente(){ await post('/clientes', {nombre:val('cli-nombre'),telefono:val('cli-tel'),rfc:val('cli-rfc'),domicilio:val('cli-dom')}); loadClientes(); }
async function saveEmpleado(){ await post('/empleados', {nombre:val('emp-nombre'),turno:val('emp-turno'),salario:val('emp-salario')}); loadEmpleados(); }
async function saveProveedor(){ await post('/proveedores', {nombre:val('prov-nombre'),ciudad:val('prov-direccion'),contacto:val('prov-contacto'),telefono:val('prov-telefono')}); loadProveedores(); }
async function saveVenta(){ await post('/ventas', {id_c:val('venta-cliente'),id_e:val('venta-empleado'),detalles:cart}); loadVentas(); loadDashboardData(); loadProductos(); }
async function saveCompra(){ await post('/compras', {id_p:val('compra-proveedor'),id_e:val('compra-empleado'),lote:val('compra-lote'),detalles:cartCompra}); loadCompras(); loadDashboardData(); loadProductos(); }

// UTILS
async function post(u,d){ const r=await fetch(`${API_BASE}${u}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}); const j=await r.json(); if(r.ok){ showToast('Guardado'); closeM(); }else{alert(j.error);} }
async function del(u){ if(confirm('¿Borrar?')){ await fetch(`${API_BASE}${u}`,{method:'DELETE'}); location.reload(); } }
function val(id){ return document.getElementById(id).value; }
function reset(id){ document.getElementById(id).reset(); }
function openM(id){ document.getElementById('modal-overlay').style.display='flex'; document.getElementById(id).style.display='block'; }
function closeM(){ document.getElementById('modal-overlay').style.display='none'; document.querySelectorAll('.modal').forEach(m=>m.style.display='none'); }
function fill(id,arr,v,t,s,b){ document.getElementById(id).innerHTML='<option value="">Select</option>'+arr.map(i=>`<option value="${i[v]}" data-p="${s?i.precio_v:b?i.precio_c:0}">${i[t]}</option>`).join(''); }
function addToCart(){ addC('venta',cart); } function addToPurchaseCart(){ addC('compra',cartCompra); }
function addC(t,a){ const s=document.getElementById(`${t}-producto`); const q=parseFloat(document.getElementById(`${t}-cantidad`).value); if(!s.value)return; a.push({codigo:s.value, n:s.options[s.selectedIndex].text, cantidad:q, p:s.options[s.selectedIndex].dataset.p}); renderC(t); }
function renderC(t){ const a=t==='venta'?cart:cartCompra; let tot=0; document.getElementById(`${t}-carrito`).innerHTML=a.map((i,x)=>{ tot+=i.cantidad*i.p; return `<tr><td>${i.n}</td><td>${i.cantidad}</td><td>$${(i.cantidad*i.p).toFixed(2)}</td><td>x</td></tr>` }).join(''); document.getElementById(`${t}-total`).textContent=tot.toFixed(2); }
function setupNavigation(){ document.querySelectorAll('.nav-link').forEach(l=>l.addEventListener('click',e=>{e.preventDefault(); showSection(l.dataset.section);})); }
function showSection(id){ document.querySelectorAll('.section').forEach(s=>s.classList.remove('active')); document.getElementById(id).classList.add('active'); }
function showToast(m){ const c=document.getElementById('toast-container'); const d=document.createElement('div'); d.className=`toast success`; d.innerHTML=`<span>${m}</span>`; c.appendChild(d); setTimeout(()=>d.remove(),3000); }