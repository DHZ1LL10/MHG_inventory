const API_URL = "http://192.168.0.49:8000"; 

// Intentamos leer el usuario guardado (simulando login) o usamos uno por defecto según la IP/Dispositivo
let usuarioActual = localStorage.getItem("usuarioNombre") || "Tablet Bodega"; 

let idMaterialSeleccionado = null;
let nombreMaterialSeleccionado = "";
let idEnEdicion = null; 
let panelActivo = null; 
let cacheMateriales = []; // IMPORTANTE: Aquí guardaremos la lista para traducir IDs a Nombres

// ==========================================
// 1. DATA: CATÁLOGO MAESTRO
// ==========================================
const CATALOGO = {
    categorias: [
        { grupo: "🏗️ Obra Negra", opciones: ["Cemento", "Arena", "Grava", "Varilla", "Ladrillo", "Block", "Yeso", "Cal", "Malla Electrosoldada"] },
        { grupo: "🎨 Acabados", opciones: ["Pintura Vinílica", "Esmalte", "Pasta Texturizada", "Azulejo", "Piso Cerámico", "Zoclo", "Impermeabilizante"] },
        { grupo: "🪵 Carpintería", opciones: ["Madera Pino", "Triplay 16mm", "Triplay 6mm", "Barniz", "Clavos", "Pegamento Blanco", "Bisagras"] },
        { grupo: "⚡ Eléctrico", opciones: ["Cable Calibre 12", "Cable Calibre 10", "Apagadores", "Contactos", "Focos LED", "Tubería Conduit"] },
        { grupo: "💧 Plomería", opciones: ["Tubo PVC", "Tubo Cobre", "Codos", "Tees", "Llaves de Paso", "Cinta Teflón", "Tinacos"] },
        { grupo: "🛠️ EPP y Consumibles", opciones: ["Discos de Corte", "Brocas", "Guantes", "Cascos", "Chalecos", "Mascarillas", "Estopa"] }
    ],
    unidades: [
        { grupo: "📦 Contenedores", opciones: ["Bulto", "Caja", "Paquete", "Cubeta", "Tambor"] },
        { grupo: "📏 Medida", opciones: ["Pieza", "Juego", "Metro (m)", "Metro Cuadrado (m²)"] },
        { grupo: "⚖️ Peso/Volumen", opciones: ["Kilogramo (kg)", "Tonelada (ton)", "Litro (L)"] }
    ]
};

// ==========================================
// 2. LOGICA VISUAL (PANEL Y SPLIT VIEW)
// ==========================================
function activarPanel(tipo) {
    const inputId = tipo === 'categoria' ? 'newCategoria' : 'newUnidad';
    panelActivo = inputId; 

    document.getElementById('newCategoria').style.borderColor = '#444';
    document.getElementById('newUnidad').style.borderColor = '#444';
    document.getElementById(inputId).style.borderColor = 'white';

    const titulo = document.getElementById('panelTitle');
    if(titulo) titulo.innerText = tipo === 'categoria' ? 'Seleccionar Categoría' : 'Seleccionar Unidad';
    document.getElementById('panelSearch').value = '';
    
    const datos = tipo === 'categoria' ? CATALOGO.categorias : CATALOGO.unidades;
    renderizarGrid(datos);
}

function renderizarGrid(datos, filtro = "") {
    const grid = document.getElementById('panelGrid');
    if(!grid) return;
    grid.innerHTML = "";
    
    let encontrados = false;
    datos.forEach(grupo => {
        const opcionesFiltradas = grupo.opciones.filter(op => op.toLowerCase().includes(filtro.toLowerCase()));
        if (opcionesFiltradas.length > 0) {
            encontrados = true;
            const titulo = document.createElement('div');
            titulo.className = 'option-group-title';
            titulo.innerText = grupo.grupo;
            grid.appendChild(titulo);

            const divGrid = document.createElement('div');
            divGrid.className = 'option-grid';
            opcionesFiltradas.forEach(opcion => {
                const card = document.createElement('div');
                card.className = 'option-card';
                card.innerText = opcion;
                card.onclick = () => seleccionarOpcion(opcion);
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
    if(tipo) renderizarGrid(CATALOGO[tipo], texto);
}

function seleccionarOpcion(valor) {
    if(!panelActivo) return;
    document.getElementById(panelActivo).value = valor;
    if(panelActivo === 'newCategoria') activarPanel('unidad');
    else {
        document.getElementById('newCantidad').focus();
        document.getElementById('newUnidad').style.borderColor = '#444';
    }
}

// ==========================================
// 3. CARGA DE DATOS E INVENTARIO
// ==========================================
async function cargarMateriales() {
    try {
        const response = await fetch(`${API_URL}/materiales/`);
        let materiales = await response.json();
        
        cacheMateriales = materiales; // GUARDAMOS EN CACHE PARA USAR NOMBRES LUEGO

        const filtroUbicacion = document.getElementById('filtroUbicacion').value;
        const buscador = document.getElementById('buscador').value.toLowerCase();
        
        let materialesVisibles = materiales;
        if (filtroUbicacion !== "Todos") materialesVisibles = materiales.filter(mat => mat.ubicacion === filtroUbicacion);
        if (buscador) materialesVisibles = materialesVisibles.filter(mat => mat.nombre.toLowerCase().includes(buscador));

        const tbody = document.getElementById('tablaMateriales');
        tbody.innerHTML = ''; 
        
        actualizarKPIs(materiales);
        cargarMovimientos(); // Cargamos la bitácora humana

        if (materialesVisibles.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 40px; color: #666;">📦 No hay materiales aquí.</td></tr>`;
            return;
        }

        materialesVisibles.forEach(mat => {
            let stockColor = 'white';
            if(mat.cantidad < 5) stockColor = '#FF6B6B';
            else if(mat.cantidad < 20) stockColor = '#FFC107';

            const row = `
                <tr>
                    <td>
                        <span class="text-main" style="font-weight:600; color:white; font-size: 1.1em;">${mat.nombre}</span>
                        <span class="text-sub" style="font-size:0.85em; color:#888;">${mat.categoria} • ${mat.unidad}</span>
                    </td>
                    <td style="color:#aaa;">
                        <span class="badge ${mat.ubicacion === 'Taller' ? 'badge-active' : 'badge-gray'}">${mat.ubicacion}</span>
                    </td>
                    <td style="text-align: center;">
                        <div class="stock-control">
                            <button class="btn-circle btn-minus" onclick="abrirSalida(${mat.id}, '${mat.nombre}')"> − </button>
                            <span class="stock-val" id="stock-qty-${mat.id}" onclick="editarStockManual(${mat.id})" style="color: ${stockColor};">${mat.cantidad}</span>
                            <button class="btn-circle btn-plus" onclick="entradaRapida(${mat.id}, 1)"> + </button>
                        </div>
                    </td>
                </tr>`;
            tbody.innerHTML += row;
        });
    } catch (error) { console.error("Error:", error); }
}

function filtrarTabla() { cargarMateriales(); }

// ==========================================
// 4. BITÁCORA HUMANIZADA (NUEVO)
// ==========================================
async function cargarMovimientos() {
    const tbody = document.getElementById('tablaMovimientos');
    if(!tbody) return;

    try {
        const response = await fetch(`${API_URL}/movimientos/?limit=8`); // Traemos los últimos 8
        const movimientos = await response.json();
        
        tbody.innerHTML = '';
        if (movimientos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#555;">La bitácora está vacía hoy.</td></tr>';
            return;
        }

        movimientos.forEach(mov => {
            // 1. Hora amigable
            const fechaObj = new Date(mov.fecha);
            const hora = fechaObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // 2. Buscar Nombre del Material (Usando cache)
            const matEncontrado = cacheMateriales.find(m => m.id === mov.material_id);
            const nombreMaterial = matEncontrado ? matEncontrado.nombre : `Producto #${mov.material_id}`;
            const unidadMaterial = matEncontrado ? matEncontrado.unidad : 'unidades';

            // 3. Icono y Rol del Usuario
            let iconoUser = "👤";
            let usuario = mov.usuario || "Desconocido";
            if(usuario.toLowerCase().includes("taller")) iconoUser = "👷‍♂️";
            if(usuario.toLowerCase().includes("bodega")) iconoUser = "🏠";
            if(usuario.toLowerCase().includes("admin")) iconoUser = "🛡️";

            // 4. Frase Humana de Acción
            let accionHtml = "";
            let colorTexto = "";
            
            if (mov.tipo === "ENTRADA") {
                accionHtml = `<span style="color:#00C853">📥 Recibió <b>${mov.cantidad} ${unidadMaterial}</b></span> de ${nombreMaterial}`;
            } else {
                accionHtml = `<span style="color:#CF6679">📤 Sacó <b>${mov.cantidad} ${unidadMaterial}</b></span> de ${nombreMaterial}`;
            }

            // 5. Destino con Icono
            let destinoHtml = mov.motivo;
            if(mov.motivo.includes("Obra:")) {
                destinoHtml = `<span style="color:#64B5F6">🏗️ ${mov.motivo.replace("Obra: ", "")}</span>`;
            } else if (mov.motivo.includes("Venta")) {
                destinoHtml = `<span style="color:#FFD54F">💰 ${mov.motivo}</span>`;
            } else {
                destinoHtml = `<span style="color:#aaa">🔧 ${mov.motivo}</span>`;
            }

            const row = `
                <tr style="border-bottom: 1px solid #2a2a2a;">
                    <td style="padding:12px 10px; color:#888;">${hora}</td>
                    <td style="padding:12px 10px; font-weight:bold; color:white;">${iconoUser} ${usuario}</td>
                    <td style="padding:12px 10px; color:#ddd;">${accionHtml}</td>
                    <td style="padding:12px 10px;">${destinoHtml}</td>
                </tr>`;
            tbody.innerHTML += row;
        });
    } catch(e) { console.log("Error cargando bitácora", e); }
}

// ==========================================
// 5. LÓGICA DE SALIDAS (BOTONES INTELIGENTES)
// ==========================================
async function abrirSalida(id, nombre) {
    idMaterialSeleccionado = id;
    nombreMaterialSeleccionado = nombre;
    
    // Resetear UI
    document.getElementById('salidaNombre').textContent = nombre;
    document.getElementById('salidaCantidad').value = "";
    
    // Limpiar botones de selección
    document.querySelectorAll('.btn-option').forEach(btn => {
        btn.style.borderColor = "#444";
        btn.style.backgroundColor = "#2A2A2A";
    });
    
    // Ocultar inputs dinámicos
    document.getElementById('inputDinamicoContainer').style.display = 'none';
    document.getElementById('salidaMotivo').value = ""; // Reset hidden input

    document.getElementById('salidaModal').style.display = 'flex';
    setTimeout(() => document.getElementById('salidaCantidad').focus(), 100);
}

// Función auxiliar para seleccionar tipo de salida (botones grandes)
async function seleccionarTipoSalida(tipo) {
    // Estilos visuales
    document.querySelectorAll('.btn-option').forEach(btn => {
        btn.style.borderColor = "#444";
        btn.style.backgroundColor = "#2A2A2A";
    });
    const btnActivo = document.getElementById(`btn${tipo}`);
    if(btnActivo) {
        btnActivo.style.borderColor = "white";
        btnActivo.style.backgroundColor = "#444";
    }

    const container = document.getElementById('inputDinamicoContainer');
    const label = document.getElementById('labelDinamico');
    const selectObra = document.getElementById('selectObraDinamico');
    const inputTexto = document.getElementById('inputTextoDinamico');
    const hiddenMotivo = document.getElementById('salidaMotivo'); // Input oculto para guardar la selección final

    container.style.display = 'block';
    selectObra.style.display = 'none';
    inputTexto.style.display = 'none';

    hiddenMotivo.value = ""; // Resetear valor final

    if (tipo === 'Obra') {
        label.innerText = "¿Para cuál obra es?";
        selectObra.style.display = 'block';
        
        // Cargar obras si está vacío
        if (selectObra.options.length === 0) {
            selectObra.innerHTML = '<option value="">Cargando obras...</option>';
            try {
                const res = await fetch(`${API_URL}/obras/`);
                const obras = await res.json();
                selectObra.innerHTML = '<option value="">Selecciona la obra...</option>';
                obras.forEach(o => selectObra.innerHTML += `<option value="Obra: ${o.nombre}">${o.nombre}</option>`);
            } catch(e) { selectObra.innerHTML = '<option>Error cargando obras</option>'; }
        }
    } else if (tipo === 'Venta') {
        label.innerText = "Referencia / Cliente:";
        inputTexto.style.display = 'block';
        inputTexto.placeholder = "Ej. Sr. Juan Pérez - Nota 123";
        inputTexto.focus();
    } else if (tipo === 'Taller') {
        label.innerText = "Detalle del uso:";
        inputTexto.style.display = 'block';
        inputTexto.placeholder = "Ej. Reparación de mueble";
        inputTexto.value = "Uso Interno Taller"; // Valor por defecto
    } else {
        label.innerText = "Especifique motivo:";
        inputTexto.style.display = 'block';
        inputTexto.placeholder = "Ej. Merma, Regalo, etc.";
        inputTexto.value = "";
    }
}

async function confirmarSalida() {
    const cantidad = parseInt(document.getElementById('salidaCantidad').value);
    
    // Construir el motivo final basado en lo que el usuario llenó
    let motivoFinal = "";
    const selectObra = document.getElementById('selectObraDinamico');
    const inputTexto = document.getElementById('inputTextoDinamico');

    if (selectObra.style.display !== 'none') {
        motivoFinal = selectObra.value;
    } else {
        // Caso Venta, Taller, Otro
        // Si es venta, agregamos el prefijo si no lo tiene
        if(document.getElementById('btnVenta').style.backgroundColor === "rgb(68, 68, 68)") { // Check chapucero de estilo activo
             motivoFinal = "Venta: " + inputTexto.value;
        } else {
             motivoFinal = inputTexto.value;
        }
    }

    if (!cantidad || cantidad <= 0) return showToast("Falta la cantidad");
    if (!motivoFinal || motivoFinal.length < 3) return showToast("Falta especificar el destino/motivo");

    // UI Optimista
    const stockElem = document.getElementById(`stock-qty-${idMaterialSeleccionado}`);
    const actual = parseInt(stockElem.innerText);
    stockElem.innerText = actual - cantidad; 

    document.getElementById('salidaModal').style.display = 'none';

    await fetch(`${API_URL}/movimientos/`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            material_id: idMaterialSeleccionado, 
            cantidad, 
            tipo: "SALIDA", 
            motivo: motivoFinal, 
            usuario: usuarioActual 
        })
    });
    
    showToast(`Registrado: Sacaron ${cantidad}`);
    setTimeout(() => cargarMateriales(), 500); 
}

// ==========================================
// 6. EDICIÓN RÁPIDA (STOCK)
// ==========================================
function editarStockManual(id) {
    idEnEdicion = id;
    document.getElementById('stockInputModal').value = document.getElementById(`stock-qty-${id}`).innerText;
    document.getElementById('stockModal').style.display = 'flex';
    document.getElementById('stockInputModal').select();
}

async function guardarStockModal() {
    const nuevo = parseInt(document.getElementById('stockInputModal').value);
    if (isNaN(nuevo) || nuevo < 0) return;
    
    const stockElem = document.getElementById(`stock-qty-${idEnEdicion}`);
    const diff = nuevo - parseInt(stockElem.innerText);
    stockElem.innerText = nuevo; // Optimista
    
    document.getElementById('stockModal').style.display = 'none';

    if(diff !== 0) {
        const tipo = diff > 0 ? "ENTRADA" : "SALIDA";
        await fetch(`${API_URL}/movimientos/`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                material_id: idEnEdicion, cantidad: Math.abs(diff), tipo, 
                motivo: "Ajuste Físico (Inventario)", usuario: usuarioActual 
            })
        });
        showToast("Inventario Ajustado");
        setTimeout(() => cargarMateriales(), 500);
    }
}

async function entradaRapida(id, cant) {
    const el = document.getElementById(`stock-qty-${id}`);
    el.innerText = parseInt(el.innerText) + cant;
    el.style.color = "#00C853";
    
    await fetch(`${API_URL}/movimientos/`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            material_id: id, cantidad: cant, tipo: "ENTRADA", 
            motivo: "Compra / Reabastecimiento", usuario: usuarioActual 
        })
    });
    setTimeout(() => cargarMateriales(), 500);
}

// ==========================================
// 7. UTILIDADES
// ==========================================
function actualizarKPIs(mat) {
    document.getElementById('kpiMateriales').innerText = mat.reduce((a,m)=>a+m.cantidad,0);
    document.getElementById('kpiAlertas').innerText = mat.filter(m=>m.cantidad<5).length;
}
function showToast(msg) {
    const d = document.createElement('div'); d.className='toast'; d.innerText=msg;
    document.getElementById('toast-container').appendChild(d);
    setTimeout(()=>d.remove(), 3000);
}
function verificarEnterStock(e){ if(e.key==="Enter") guardarStockModal(); }

// Guardar nuevo material
const formMat = document.getElementById('materialForm');
if(formMat) {
    formMat.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            nombre: document.getElementById('newNombre').value,
            categoria: document.getElementById('newCategoria').value,
            unidad: document.getElementById('newUnidad').value,
            cantidad: parseInt(document.getElementById('newCantidad').value),
            ubicacion: document.getElementById('newUbicacion').value
        };
        await fetch(`${API_URL}/materiales/`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        document.getElementById('addModal').style.display = 'none';
        document.getElementById('materialForm').reset();
        cargarMateriales(); showToast("Material Agregado");
    });
}

// INICIO
window.onload = function() {
    cargarMateriales();
};