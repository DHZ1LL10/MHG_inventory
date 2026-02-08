// FORZAMOS LOCALHOST PARA EVITAR ERRORES DE RED
const API_URL = "http://localhost:8000";

// --- 1. SEGURIDAD Y SESIÓN ---
const usuarioRol = localStorage.getItem("usuarioRol");
const usuarioNombre = localStorage.getItem("usuarioNombre");

if (!usuarioRol || !usuarioNombre) {
    window.location.href = "index.html";
}

let usuarioActual = usuarioNombre;
let idMaterialSeleccionado = null;
let nombreMaterialSeleccionado = "";
let idEnEdicion = null;
let panelActivo = null;
let cacheMateriales = [];

// --- 2. DATA: CATÁLOGO PARA SPLIT VIEW ---
const CATALOGO = {
    categorias: [
        { grupo: "🏗️ Obra Negra", opciones: ["Cemento", "Arena", "Grava", "Varilla", "Ladrillo", "Block", "Yeso", "Cal"] },
        { grupo: "🎨 Acabados", opciones: ["Pintura", "Esmalte", "Pasta", "Azulejo", "Piso", "Zoclo", "Impermeabilizante"] },
        { grupo: "🪵 Carpintería", opciones: ["Madera Pino", "Triplay", "Barniz", "Clavos", "Pegamento", "Bisagras"] },
        { grupo: "⚡ Eléctrico", opciones: ["Cable", "Apagadores", "Contactos", "Focos LED", "Tubería Conduit"] },
        { grupo: "💧 Plomería", opciones: ["Tubo PVC", "Tubo Cobre", "Codos", "Tees", "Llaves", "Tinacos"] },
        { grupo: "🛠️ Consumibles", opciones: ["Discos de Corte", "Brocas", "Guantes", "Cascos", "Chalecos", "Estopa"] },
        { grupo: "🔧 Herramienta", opciones: ["Martillo", "Taladro", "Sierra", "Desarmador", "Llave Inglesa"] }
    ],
    unidades: [
        { grupo: "📦 Contenedores", opciones: ["Bulto", "Caja", "Paquete", "Cubeta", "Tambor"] },
        { grupo: "📏 Medida", opciones: ["Pieza", "Juego", "Metro (m)", "Metro Cuadrado (m²)"] },
        { grupo: "⚖️ Peso/Volumen", opciones: ["Kg", "Tonelada", "Litro", "Galón"] }
    ]
};

// --- 3. PERMISOS Y ROLES (SEGURIDAD) ---
function aplicarPermisos() {
    console.log("🔒 Aplicando permisos para rol:", usuarioRol);

    const btnAdd = document.getElementById('btnNuevoMaterial');
    const btnAdmin = document.getElementById('btnAdminPanel');
    const seccionBitacora = document.getElementById('cardBitacora');

    // --- ESCENARIO 1: ES ADMIN ---
    if (usuarioRol === "ADMIN") {
        if (btnAdd) btnAdd.style.display = 'block';
        if (btnAdmin) btnAdmin.style.display = 'block';
        if (seccionBitacora) seccionBitacora.style.display = 'block';
    }
    // --- ESCENARIO 2: NO ES ADMIN ---
    else {
        if (btnAdd) btnAdd.style.display = 'none';
        if (btnAdmin) btnAdmin.style.display = 'none';
        if (seccionBitacora) {
            seccionBitacora.style.display = 'none';
            seccionBitacora.innerHTML = ''; // Vaciar por seguridad
        }
    }
}

// --- 4. PANEL DIVIDIDO (NUEVO MATERIAL) ---
function activarPanel(tipo) {
    const inputId = tipo === 'categoria' ? 'newCategoria' : 'newUnidad';
    panelActivo = inputId;

    document.getElementById('newCategoria').style.borderColor = '#444';
    document.getElementById('newUnidad').style.borderColor = '#444';
    document.getElementById(inputId).style.borderColor = 'white';

    document.getElementById('panelTitle').innerText = tipo === 'categoria' ? 'Seleccionar Categoría' : 'Seleccionar Unidad';
    document.getElementById('panelSearch').value = '';

    const datos = tipo === 'categoria' ? CATALOGO.categorias : CATALOGO.unidades;
    renderizarGrid(datos);
}

function renderizarGrid(datos, filtro = "") {
    const grid = document.getElementById('panelGrid');
    if (!grid) return;
    grid.innerHTML = "";

    let encontrados = false;
    datos.forEach(grupo => {
        const opciones = grupo.opciones.filter(op => op.toLowerCase().includes(filtro.toLowerCase()));
        if (opciones.length > 0) {
            encontrados = true;
            const titulo = document.createElement('div');
            titulo.className = 'option-group-title';
            titulo.innerText = grupo.grupo;
            grid.appendChild(titulo);

            const divGrid = document.createElement('div');
            divGrid.className = 'option-grid';
            opciones.forEach(op => {
                const card = document.createElement('div');
                card.className = 'option-card';
                card.innerText = op;
                card.onclick = () => seleccionarOpcion(op);
                divGrid.appendChild(card);
            });
            grid.appendChild(divGrid);
        }
    });
    if (!encontrados) grid.innerHTML = `<div style="text-align:center; padding:20px; color:#666;">Sin resultados.</div>`;
}

function filtrarPanel() {
    const texto = document.getElementById('panelSearch').value;
    const tipo = panelActivo === 'newCategoria' ? 'categorias' : 'unidades';
    if (tipo) renderizarGrid(CATALOGO[tipo], texto);
}

function seleccionarOpcion(valor) {
    if (!panelActivo) return;
    document.getElementById(panelActivo).value = valor;
    if (panelActivo === 'newCategoria') activarPanel('unidad');
    else {
        document.getElementById('newCantidad').focus();
        document.getElementById('newUnidad').style.borderColor = '#444';
    }
}

// --- 5. CARGA DE INVENTARIO (TABLA O GRID) ---
async function cargarMateriales() {
    try {
        const response = await fetch(`${API_URL}/materiales/`);
        let materiales = await response.json();
        cacheMateriales = materiales;

        const filtroUbicacion = document.getElementById('filtroUbicacion').value;
        const buscador = document.getElementById('buscador').value.toLowerCase();

        let materialesVisibles = materiales;
        if (filtroUbicacion !== "Todos") materialesVisibles = materiales.filter(m => m.ubicacion === filtroUbicacion);
        if (buscador) materialesVisibles = materialesVisibles.filter(m => m.nombre.toLowerCase().includes(buscador));

        actualizarKPIs(materiales);

        // Solo Admin ve bitácora y finanzas
        if (usuarioRol === "ADMIN") {
            cargarMovimientos();
            actualizarFinanzasAdmin(materiales);
        }

        const tbody = document.getElementById('tablaMateriales');
        const tableContainer = document.querySelector('table');
        const gridContainer = document.getElementById('gridMateriales');

        // LIMPIEZA
        tbody.innerHTML = '';
        if (gridContainer) gridContainer.innerHTML = '';

        // --- MODO ADMIN (TABLA CLÁSICA) ---
        if (usuarioRol === "ADMIN") {
            tableContainer.style.display = 'table';
            if (gridContainer) gridContainer.style.display = 'none';

            materialesVisibles.forEach(mat => {
                let stockColor = 'white';
                if (mat.cantidad <= mat.min_stock) stockColor = '#FF6B6B';
                else if (mat.cantidad <= mat.min_stock * 2) stockColor = '#FFC107';

                const row = `
                    <tr>
                        <td>
                            <span style="font-weight:600; color:white; font-size: 1.1em; display:block;">${mat.nombre}</span>
                            <span style="font-size:0.85em; color:#888;">${mat.categoria} • ${mat.unidad}</span>
                        </td>
                        <td><span class="badge ${mat.ubicacion === 'Taller' ? 'badge-active' : 'badge-gray'}">${mat.ubicacion}</span></td>
                        <td style="text-align: center;">
                            <div class="stock-control">
                                <button class="btn-circle btn-minus" onclick="abrirSalida(${mat.id}, '${mat.nombre}')"> − </button>
                                <span class="stock-val" id="stock-qty-${mat.id}" onclick="editarStockManual(${mat.id})" style="color: ${stockColor};">${mat.cantidad}</span>
                                <button class="btn-circle btn-plus" onclick="abrirEntrada(${mat.id}, '${mat.nombre}')"> + </button>
                            </div>
                        </td>
                    </tr>`;
                tbody.innerHTML += row;
            });
        }

        // --- MODO OPERATIVO (TARJETAS GRANDES) ---
        else {
            tableContainer.style.display = 'none';
            if (gridContainer) gridContainer.style.display = 'grid';

            materialesVisibles.forEach(mat => {
                let bordeColor = '#444';
                if (mat.cantidad <= mat.min_stock) bordeColor = '#FF6B6B'; // Rojo si falta

                let centroContenido = '';

                if (usuarioRol === "EXHIBICION") {
                    // Muestra PRECIO
                    const precio = mat.precio_venta ? `$${mat.precio_venta}` : 'N/A';
                    centroContenido = `
                        <div style="font-size:0.8em; color:#888; text-align:center;">Precio Público</div>
                        <div class="card-price">${precio}</div>
                        <div style="font-size:0.9em; color:white; text-align:center; margin-top:5px;">Disp: ${mat.cantidad}</div>
                    `;
                } else {
                    // Muestra STOCK (Taller)
                    centroContenido = `
                        <div class="card-qty-big" style="color: ${mat.cantidad <= mat.min_stock ? '#FF6B6B' : 'white'}">${mat.cantidad}</div>
                        <div style="text-align:center; color:#888; font-size:0.8em;">${mat.unidad}</div>
                    `;
                }

                const card = `
                    <div class="material-card" style="border-top: 4px solid ${bordeColor};">
                        <span class="card-badge">${mat.ubicacion}</span>
                        <div style="margin-bottom: 10px;">
                            <h3 style="margin:0; font-size:1.1em; color:white;">${mat.nombre}</h3>
                            <small style="color:#666;">${mat.categoria}</small>
                        </div>
                        ${centroContenido}
                        <div class="stock-control" style="margin-top:15px; justify-content: space-between;">
                            <button class="btn-circle btn-minus" style="width:40px; height:40px;" onclick="abrirSalida(${mat.id}, '${mat.nombre}')"> − </button>
                            <button class="btn-circle btn-plus" style="width:40px; height:40px;" onclick="abrirEntrada(${mat.id}, '${mat.nombre}')"> + </button>
                        </div>
                    </div>`;
                gridContainer.innerHTML += card;
            });
        }
    } catch (error) {
        console.error("Error cargando materiales:", error);
        showToast("Error de conexión con el servidor");
    }
}

async function cargarMovimientos() {
    const tbody = document.getElementById('tablaMovimientos');
    if (!tbody) return;
    try {
        const response = await fetch(`${API_URL}/movimientos/?limit=15`);
        const movimientos = await response.json();
        tbody.innerHTML = '';
        movimientos.forEach(mov => {
            const fecha = new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const mat = cacheMateriales.find(m => m.id === mov.material_id);
            const nombreMat = mat ? mat.nombre : `ID ${mov.material_id}`;
            const color = mov.tipo === "ENTRADA" ? "#00C853" : "#FF6B6B";
            const icono = mov.usuario.includes("Taller") ? "👷‍♂️" : "🛡️";

            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #2a2a2a;">
                    <td style="padding:10px; color:#888;">${fecha}</td>
                    <td style="padding:10px; color:white;">${icono} ${mov.usuario}</td>
                    <td style="padding:10px;"><span style="color:${color}"><b>${mov.tipo === "ENTRADA" ? '📥 Recibió' : '📤 Sacó'} ${mov.cantidad}</b></span> de ${nombreMat}</td>
                    <td style="padding:10px; color:#aaa;">${mov.motivo}</td>
                </tr>`;
        });
    } catch (e) {
        console.error("Error cargando movimientos:", e);
    }
}

// --- 6. SALIDAS Y ENTRADAS INTELIGENTES (BLINDADAS) ---
async function seleccionarTipoSalida(tipo) {
    document.querySelectorAll('#salidaModal .btn-option').forEach(btn => { btn.style.borderColor = "#444"; btn.style.backgroundColor = "#2A2A2A"; });
    document.getElementById(`btn${tipo}`).style.borderColor = "white";
    document.getElementById(`btn${tipo}`).style.backgroundColor = "#444";

    const container = document.getElementById('inputDinamicoContainer');
    const label = document.getElementById('labelDinamico');
    const select = document.getElementById('selectObraDinamico');
    const input = document.getElementById('inputTextoDinamico');

    container.style.display = 'block';
    select.style.display = tipo === 'Obra' ? 'block' : 'none';
    input.style.display = tipo === 'Obra' ? 'none' : 'block';
    label.innerText = tipo === 'Obra' ? "¿Para qué obra?" : "Detalle:";

    if (tipo === 'Obra' && select.options.length <= 0) {
        const res = await fetch(`${API_URL}/obras/`);
        const obras = await res.json();
        select.innerHTML = '<option value="">Seleccionar...</option>';
        obras.forEach(o => select.innerHTML += `<option value="Obra: ${o.nombre}">🏗️ ${o.nombre}</option>`);
    }
}

async function abrirSalida(id, nombre) {
    idMaterialSeleccionado = id;
    document.getElementById('salidaNombre').textContent = nombre;
    document.getElementById('salidaCantidad').value = "";
    document.getElementById('inputDinamicoContainer').style.display = 'none';
    document.getElementById('salidaModal').style.display = 'flex';
}

async function confirmarSalida() {
    let cantidadInput = document.getElementById('salidaCantidad').value;
    let cantidad = parseInt(cantidadInput);

    if (!cantidad || cantidad <= 0) return showToast("⚠️ Error: La cantidad debe ser mayor a 0");

    // Validar Stock
    const materialActual = cacheMateriales.find(m => m.id === idMaterialSeleccionado);
    if (materialActual && cantidad > materialActual.cantidad) {
        return showToast(`⚠️ Error: Solo tienes ${materialActual.cantidad} disponibles`);
    }

    const select = document.getElementById('selectObraDinamico');
    const input = document.getElementById('inputTextoDinamico');

    if (select.style.display === 'none' && input.style.display === 'none') {
        return showToast("⚠️ Error: Selecciona el destino");
    }

    let motivo = "";
    if (select.style.display !== 'none') {
        if (!select.value) return showToast("⚠️ Error: Selecciona la Obra");
        motivo = select.value;
    } else {
        const btnActivo = document.querySelector('#salidaModal .btn-option[style*="border-color: white"]');
        const tipoAccion = btnActivo ? btnActivo.innerText : "Salida";
        if (!input.value.trim()) return showToast("⚠️ Error: Escribe el detalle");
        motivo = `${tipoAccion}: ${input.value}`;
    }

    await fetch(`${API_URL}/movimientos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            material_id: idMaterialSeleccionado,
            cantidad: Math.abs(cantidad),
            tipo: "SALIDA",
            motivo: motivo,
            usuario: usuarioActual
        })
    });

    document.getElementById('salidaModal').style.display = 'none';
    cargarMateriales();
    showToast("📤 Salida Registrada");
}

async function abrirEntrada(id, nombre) {
    idMaterialSeleccionado = id;
    document.getElementById('entradaNombre').textContent = nombre;
    document.getElementById('entradaCantidad').value = "";
    document.getElementById('inputEntradaContainer').style.display = 'none';
    document.getElementById('entradaModal').style.display = 'flex';
}

async function seleccionarTipoEntrada(tipo) {
    document.querySelectorAll('#entradaModal .btn-option').forEach(btn => { btn.style.borderColor = "#444"; btn.style.backgroundColor = "#2A2A2A"; });
    document.getElementById(`btn${tipo}`).style.borderColor = "white";
    document.getElementById(`btn${tipo}`).style.backgroundColor = "#444";

    const container = document.getElementById('inputEntradaContainer');
    const select = document.getElementById('selectObraEntrada');
    const input = document.getElementById('inputTextoEntrada');

    container.style.display = 'block';
    select.style.display = tipo === 'Devolucion' ? 'block' : 'none';
    input.style.display = tipo === 'Devolucion' ? 'none' : 'block';

    if (tipo === 'Devolucion' && select.options.length <= 0) {
        const res = await fetch(`${API_URL}/obras/`);
        const obras = await res.json();
        select.innerHTML = '<option value="">Seleccionar Obra...</option>';
        obras.forEach(o => select.innerHTML += `<option value="Retorno: ${o.nombre}">🏗️ ${o.nombre}</option>`);
    }
}

async function confirmarEntrada() {
    let cantidadInput = document.getElementById('entradaCantidad').value;
    let cantidad = parseInt(cantidadInput);

    if (!cantidad || cantidad <= 0) return showToast("⚠️ Error: La cantidad debe ser mayor a 0");

    const select = document.getElementById('selectObraEntrada');
    const input = document.getElementById('inputTextoEntrada');

    if (select.style.display === 'none' && input.style.display === 'none') {
        return showToast("⚠️ Error: Selecciona el origen");
    }

    let motivo = "";
    if (select.style.display !== 'none') {
        if (!select.value) return showToast("⚠️ Error: Selecciona la Obra");
        motivo = select.value;
    } else {
        if (!input.value.trim()) return showToast("⚠️ Error: Escribe el detalle");
        motivo = "Compra: " + input.value;
    }

    await fetch(`${API_URL}/movimientos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            material_id: idMaterialSeleccionado,
            cantidad: Math.abs(cantidad),
            tipo: "ENTRADA",
            motivo: motivo,
            usuario: usuarioActual
        })
    });

    document.getElementById('entradaModal').style.display = 'none';
    cargarMateriales();
    showToast("✅ Entrada Registrada");
}

// --- 7. AJUSTE MANUAL Y ADMIN ---
function editarStockManual(id) {
    if (usuarioRol !== "ADMIN") return;
    idEnEdicion = id;
    const stockSpan = document.getElementById(`stock-qty-${id}`);
    if (stockSpan) document.getElementById('stockInputModal').value = stockSpan.innerText;
    document.getElementById('stockModal').style.display = 'flex';
}

async function guardarStockModal() {
    const nuevo = parseInt(document.getElementById('stockInputModal').value);
    const stockSpan = document.getElementById(`stock-qty-${idEnEdicion}`);
    const actual = parseInt(stockSpan ? stockSpan.innerText : 0);

    const diff = nuevo - actual;
    if (diff === 0) return document.getElementById('stockModal').style.display = 'none';

    await fetch(`${API_URL}/movimientos/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material_id: idEnEdicion, cantidad: Math.abs(diff), tipo: diff > 0 ? "ENTRADA" : "SALIDA", motivo: "Ajuste Manual Inventario", usuario: usuarioActual })
    });
    document.getElementById('stockModal').style.display = 'none';
    cargarMateriales();
}

async function abrirAdminPanel() {
    document.getElementById('adminModal').style.display = 'flex';
    cargarDispositivos();
}

async function cargarDispositivos() {
    const res = await fetch(`${API_URL}/admin/dispositivos`);
    const devs = await res.json();
    const tbody = document.getElementById('tablaDispositivos');
    tbody.innerHTML = '';
    devs.forEach(d => {
        tbody.innerHTML += `<tr><td style="padding:10px; color:white;">${d.nombre}</td><td style="color:#888;">${d.rol}</td><td style="color:white; font-family:monospace;">${d.codigo_acceso}</td><td><span onclick="borrarDispositivo(${d.id})" style="cursor:pointer; color:#CF6679;">🗑️</span></td></tr>`;
    });
}

async function crearDispositivo() {
    const nombre = document.getElementById('newDevNombre').value;
    const rol = document.getElementById('newDevRol').value;
    if (!nombre) return showToast("Escribe un nombre");
    await fetch(`${API_URL}/admin/generar-dispositivo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre, rol }) });
    cargarDispositivos();
}

async function borrarDispositivo(id) {
    if (confirm("¿Eliminar acceso?")) { await fetch(`${API_URL}/admin/dispositivos/${id}`, { method: 'DELETE' }); cargarDispositivos(); }
}

// --- 8. UTILIDADES ---
function actualizarKPIs(mat) {
    document.getElementById('kpiMateriales').innerText = mat.reduce((a, m) => a + m.cantidad, 0);
    document.getElementById('kpiAlertas').innerText = mat.filter(m => m.cantidad <= m.min_stock).length;
}

function showToast(msg) {
    const d = document.createElement('div'); d.className = 'toast'; d.innerText = msg;
    document.getElementById('toast-container').appendChild(d);
    setTimeout(() => d.remove(), 3000);
}

function filtrarTabla() { cargarMateriales(); }

// --- 9. GRÁFICAS Y FINANZAS ---
let chartCat = null;
let chartTop = null;

function actualizarFinanzasAdmin(materiales) {
    if (usuarioRol !== "ADMIN") return;

    document.getElementById('kpiDineroCard').style.display = 'block';
    const chartContainer = document.getElementById('adminCharts');
    chartContainer.style.display = 'flex';

    let valorTotal = 0;
    const valorPorCategoria = {};

    materiales.forEach(m => {
        const costo = m.costo_unitario || 0;
        const valorMaterial = m.cantidad * costo;
        valorTotal += valorMaterial;
        if (!valorPorCategoria[m.categoria]) valorPorCategoria[m.categoria] = 0;
        valorPorCategoria[m.categoria] += valorMaterial;
    });

    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    document.getElementById('kpiValorTotal').innerText = formatter.format(valorTotal);

    renderizarGraficas(valorPorCategoria, materiales);
}

function renderizarGraficas(datosCategoria, todosMateriales) {
    const ctxCat = document.getElementById('chartCategorias').getContext('2d');
    const labelsCat = Object.keys(datosCategoria);
    const dataCat = Object.values(datosCategoria);

    if (chartCat) chartCat.destroy();

    chartCat = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: labelsCat,
            datasets: [{
                data: dataCat,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: 'white' } }
            }
        }
    });

    const top5 = todosMateriales
        .map(m => ({ nombre: m.nombre, valor: m.cantidad * (m.costo_unitario || 0) }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5);

    const ctxTop = document.getElementById('chartTopMateriales').getContext('2d');
    if (chartTop) chartTop.destroy();

    chartTop = new Chart(ctxTop, {
        type: 'bar',
        data: {
            labels: top5.map(m => m.nombre),
            datasets: [{
                label: 'Valor ($)',
                data: top5.map(m => m.valor),
                backgroundColor: '#00C853',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { ticks: { color: '#888' }, grid: { color: '#333' } },
                x: { ticks: { color: '#aaa' }, grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// INICIALIZACIÓN
document.getElementById('materialForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nombre: document.getElementById('newNombre').value,
        categoria: document.getElementById('newCategoria').value,
        unidad: document.getElementById('newUnidad').value,
        cantidad: parseInt(document.getElementById('newCantidad').value),
        min_stock: parseInt(document.getElementById('newMinStock').value),
        ubicacion: document.getElementById('newUbicacion').value
    };
    await fetch(`${API_URL}/materiales/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    document.getElementById('addModal').style.display = 'none';
    cargarMateriales(); showToast("Material Creado");
});

window.onload = function () {
    document.querySelector('header h1').innerHTML += ` <span style="font-size:0.4em; color:#666; font-weight:normal">| ${usuarioNombre}</span>`;
    aplicarPermisos();
    cargarMateriales();
};

document.querySelector('.logout').addEventListener('click', () => { localStorage.clear(); window.location.href = "index.html"; });