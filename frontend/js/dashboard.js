const API_URL = "http://127.0.0.1:8000";

// ==========================================
// 1. BASE DE DATOS DE OPCIONES (CATÁLOGO PRO)
// ==========================================
const CATALOGO = {
    unidades: [
        { grupo: "🌟 Más Usados", opciones: ["Pieza", "Bulto", "m²", "m³", "Juego", "Caja"] },
        { grupo: "📏 Longitud", opciones: ["Metro (m)", "Centímetro (cm)", "Metro Lineal (ml)", "Rollo", "Tramo"] },
        { grupo: "⬛ Área / Superficie", opciones: ["Metro Cuadrado (m²)", "Hectárea", "Lámina", "Placa"] },
        { grupo: "🧊 Volumen / Líquidos", opciones: ["Metro Cúbico (m³)", "Litro (L)", "Cubeta (19L)", "Galón", "Tambor (200L)", "Pipa", "Saco"] },
        { grupo: "⚖️ Peso", opciones: ["Kilogramo (kg)", "Tonelada (ton)", "Gramo (g)", "Libra (lb)"] },
        { grupo: "📦 Contenedores", opciones: ["Paquete", "Tarima", "Atado", "Camión", "Viaje"] }
    ],
    categorias: [
        { grupo: "🌟 Frecuentes", opciones: ["Obra Negra", "Acabados", "Eléctrico", "Hidrosanitario"] },
        { grupo: "🏗️ Estructura", opciones: ["Aceros", "Concretos", "Cimentación", "Muros", "Techumbres"] },
        { grupo: "🎨 Acabados", opciones: ["Pisos y Recubrimientos", "Pinturas", "Carpintería", "Cancelería", "Vidrios", "Impermeabilización"] },
        { grupo: "💡 Instalaciones", opciones: ["Iluminación", "Cableado", "Tuberías", "Gas", "Voz y Datos", "Aire Acondicionado"] },
        { grupo: "🚽 Baños y Cocina", opciones: ["Grifería", "Muebles de Baño", "Tarjas", "Accesorios"] },
        { grupo: "🛠️ Otros", opciones: ["Herramienta Menor", "Equipo de Seguridad (EPP)", "Limpieza", "Papelería/Oficina"] }
    ]
};

let inputActivo = null; // Para saber qué input estamos llenando

// ==========================================
// 2. SISTEMA DE NOTIFICACIONES (TOASTS)
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✔' : '✖'}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    
    // Auto eliminar después de 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// 3. LÓGICA DEL SELECTOR INTELIGENTE (MODAL)
// ==========================================
function abrirSelector(tipo) {
    inputActivo = tipo; // 'unidad' o 'categoria'
    const modal = document.getElementById('selectorModal');
    const titulo = document.getElementById('modalTitle');
    const search = document.getElementById('modalSearch');

    // Configurar Modal
    modal.style.display = 'flex';
    titulo.textContent = tipo === 'unidad' ? 'Seleccionar Unidad' : 'Seleccionar Categoría';
    search.value = '';
    search.focus();

    // Renderizar Opciones iniciales
    renderizarOpciones(tipo);
}

function renderizarOpciones(tipo, filtroText = '') {
    const grid = document.getElementById('modalGrid');
    grid.innerHTML = '';
    
    const datos = CATALOGO[tipo === 'unidad' ? 'unidades' : 'categorias'];
    let hayResultados = false;

    datos.forEach(grupo => {
        // Filtrar opciones dentro del grupo
        const opcionesFiltradas = grupo.opciones.filter(op => 
            op.toLowerCase().includes(filtroText.toLowerCase())
        );

        if (opcionesFiltradas.length > 0) {
            hayResultados = true;
            
            // Crear Título del Grupo
            const groupTitle = document.createElement('div');
            groupTitle.className = 'option-group-title';
            groupTitle.textContent = grupo.grupo;
            grid.appendChild(groupTitle);

            // Crear Grid de Botones
            const groupGrid = document.createElement('div');
            groupGrid.className = 'option-grid';
            
            opcionesFiltradas.forEach(opcion => {
                const btn = document.createElement('div');
                btn.className = 'option-btn';
                // Resaltar los grupos populares
                if (grupo.grupo.includes("Más") || grupo.grupo.includes("Frecuentes")) {
                    btn.classList.add('featured'); 
                }
                btn.textContent = opcion;
                btn.onclick = () => seleccionarOpcion(opcion);
                groupGrid.appendChild(btn);
            });
            grid.appendChild(groupGrid);
        }
    });

    if (!hayResultados) {
        grid.innerHTML = `
            <div style="text-align:center; color:#666; padding:20px;">
                No encontrado. <br> 
                <button class="btn-primary" onclick="seleccionarOpcion('${filtroText}')" style="margin-top:10px; width:auto; display:inline-block;">
                    Usar "${filtroText}"
                </button>
            </div>`;
    }
}

function filtrarOpcionesModal() {
    const texto = document.getElementById('modalSearch').value;
    renderizarOpciones(inputActivo, texto);
}

function seleccionarOpcion(valor) {
    if (!valor) return;
    document.getElementById(inputActivo).value = valor;
    cerrarSelector();
}

function cerrarSelector(e) {
    if (e && e.target.id !== 'selectorModal' && !e.target.classList.contains('close-modal')) return;
    document.getElementById('selectorModal').style.display = 'none';
}

// ==========================================
// 4. LÓGICA DE NEGOCIO Y KPIs
// ==========================================

function actualizarKPIs(obras, materiales) {
    // 1. Obras Activas
    document.getElementById('kpiObras').textContent = obras.length;

    // 2. Total Materiales
    const totalStock = materiales.reduce((acc, curr) => acc + curr.cantidad, 0);
    document.getElementById('kpiMateriales').textContent = totalStock;

    // 3. Alertas (Stock < 10)
    const lowStockItems = materiales.filter(m => m.cantidad < 10);
    const alertaCount = lowStockItems.length;
    document.getElementById('kpiAlertas').textContent = alertaCount;

    // Mostrar/Ocultar Sección de Alertas
    const section = document.getElementById('alertaSection');
    if (alertaCount > 0) {
        section.style.display = 'block';
        section.innerHTML = `
            <div class="alert-box">
                <div class="alert-title">
                    ⚠️ Stock Crítico: ${alertaCount} materiales por agotarse
                </div>
                <span style="color: #ddd; font-size: 0.9em; cursor: pointer; text-decoration: underline;" onclick="filtrarPorBajoStock()">
                    Ver lista
                </span>
            </div>
        `;
    } else {
        section.style.display = 'none';
    }
}

function filtrarPorBajoStock() {
    // Resetear filtro visual y buscar manualmente en la tabla
    document.getElementById('buscador').value = "";
    const filas = document.querySelectorAll('#tablaMateriales tr');
    
    filas.forEach(fila => {
        const stockElement = fila.querySelector('.text-stock');
        if (stockElement) {
            const stock = parseInt(stockElement.innerText);
            if (stock < 10) {
                fila.style.display = '';
                fila.style.background = 'rgba(207, 102, 121, 0.1)';
            } else {
                fila.style.display = 'none';
            }
        }
    });
    showToast("Filtrando materiales críticos", "error");
}

// ==========================================
// 5. CARGA DE DATOS Y CRUD
// ==========================================

function filtrarTabla() {
    const texto = document.getElementById('buscador').value.toLowerCase();
    const filas = document.querySelectorAll('#tablaMateriales tr');

    filas.forEach(fila => {
        if (fila.classList.contains('empty-row')) return;
        
        // Buscamos en Nombre y Categoría
        const contenido = fila.innerText.toLowerCase();
        
        if (contenido.includes(texto)) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}

async function cargarMateriales() {
    try {
        const response = await fetch(`${API_URL}/materiales/`);
        let materiales = await response.json();
        
        // Memoria del filtro (Igual que antes)
        const selectorFiltro = document.getElementById('filtroUbicacion');
        const filtroGuardado = localStorage.getItem('ultimoFiltro');
        if (filtroGuardado && selectorFiltro.value === 'Todos' && !window.filtroAplicado) {
            selectorFiltro.value = filtroGuardado;
            window.filtroAplicado = true;
        }
        const filtroActual = selectorFiltro.value;
        localStorage.setItem('ultimoFiltro', filtroActual);

        let materialesVisibles = materiales;
        if (filtroActual !== "Todos") {
            materialesVisibles = materiales.filter(mat => mat.ubicacion === filtroActual);
        }

        const tbody = document.getElementById('tablaMateriales');
        tbody.innerHTML = ''; 

        if (materialesVisibles.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="5">
                        <div class="empty-state">
                            <div class="empty-icon">📦</div>
                            <h3>Sin materiales aquí</h3>
                            <p>Esta ubicación está limpia. Agrega material arriba.</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        materialesVisibles.forEach(mat => {
            const isBodega = mat.ubicacion === 'Bodega Central';
            const badgeClass = isBodega ? 'badge-gray' : 'badge-active';
            const icon = isBodega ? '' : '📍';
            const stockColor = mat.cantidad < 10 ? '#FF6B6B' : 'white';

            const row = `
                <tr>
                    <td class="text-id">#${mat.id}</td>
                    <td>
                        <span class="text-main">${mat.nombre}</span>
                        <span class="text-sub">${mat.categoria} • ${mat.unidad}</span>
                    </td>
                    <td>
                        <span class="badge ${badgeClass}">
                            ${icon} ${mat.ubicacion}
                        </span>
                    </td>
                    <td style="text-align: center;">
                        <div class="stock-control" style="justify-content: center;">
                            <button class="btn-mini btn-minus" onclick="cambiarStock(${mat.id}, -1, event)">−</button>
                            
                            <span class="text-stock" 
                                  id="stock-qty-${mat.id}"
                                  onclick="editarStockManual(${mat.id})" 
                                  title="Clic para editar manual"
                                  style="color: ${stockColor}">
                                ${mat.cantidad}
                            </span>
                            
                            <button class="btn-mini btn-plus" onclick="cambiarStock(${mat.id}, 1, event)">+</button>
                        </div>
                    </td>
                    <td style="text-align: right;">
                        <span class="btn-delete" onclick="eliminarMaterial(${mat.id})">🗑️</span>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        
        filtrarTabla();

    } catch (error) { console.error("Error:", error); }
}

async function cargarObras() {
    try {
        const response = await fetch(`${API_URL}/obras/`);
        const obras = await response.json();
        
        // Actualizar KPIs (Fetch global de materiales para tener datos reales)
        const matResponse = await fetch(`${API_URL}/materiales/`);
        const todosMateriales = await matResponse.json();
        actualizarKPIs(obras, todosMateriales);

        // Llenar Lista de Proyectos
        const contenedor = document.getElementById('listaObras');
        contenedor.innerHTML = ''; 

        const selectorForm = document.getElementById('ubicacion');
        const selectorFiltro = document.getElementById('filtroUbicacion');
        
        // Guardar valores actuales
        const formVal = selectorForm.value;
        const filtroVal = selectorFiltro.value;

        // Limpiar opciones dinámicas (mantener las fijas)
        selectorForm.innerHTML = '<option value="Bodega Central"> Bodega Central</option>';
        while (selectorFiltro.options.length > 2) { selectorFiltro.remove(2); }

        obras.forEach(obra => {
            // Tarjeta
            const card = `
                <div style="background: #2C2C2C; padding: 12px 18px; border-radius: 6px; border: 1px solid #333; min-width: 160px; display: flex; flex-direction: column;">
                    <span style="color: var(--accent); font-weight: 700;">${obra.nombre}</span>
                    <span style="color: #888; font-size: 0.85em;">👤 ${obra.cliente}</span>
                </div>
            `;
            contenedor.innerHTML += card;

            // Selectores
            const optionHTML = `<option value="${obra.nombre}">📍 ${obra.nombre}</option>`;
            selectorForm.insertAdjacentHTML('beforeend', optionHTML);
            selectorFiltro.insertAdjacentHTML('beforeend', optionHTML);
        });

        // Restaurar selección
        selectorForm.value = formVal;
        selectorFiltro.value = filtroVal;

    } catch (error) { console.error("Error cargando obras:", error); }
}

// --- CREAR OBRA ---
document.getElementById('obraForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuevaObra = {
        nombre: document.getElementById('obraNombre').value,
        cliente: document.getElementById('obraCliente').value,
        direccion: document.getElementById('obraDireccion').value,
        presupuesto: 0
    };

    await fetch(`${API_URL}/obras/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaObra)
    });
    
    document.getElementById('obraForm').reset();
    showToast(`Proyecto "${nuevaObra.nombre}" creado`);
    cargarObras();
});

// --- CREAR MATERIAL ---
document.getElementById('materialForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuevoMaterial = {
        nombre: document.getElementById('nombre').value,
        categoria: document.getElementById('categoria').value,
        unidad: document.getElementById('unidad').value,
        cantidad: parseInt(document.getElementById('cantidad').value),
        ubicacion: document.getElementById('ubicacion').value
    };

    await fetch(`${API_URL}/materiales/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoMaterial)
    });
    
    document.getElementById('materialForm').reset();
    showToast("Material registrado exitosamente");
    cargarMateriales();
    cargarObras(); // Refresh KPIs
});

// --- ACTUALIZAR STOCK ---
// --- ACTUALIZAR STOCK (OPTIMISTA E INSTANTÁNEO) ---
async function cambiarStock(id, direccion, event) {
    // 1. Detectar si presionó Shift (Multiplicador x10)
    let multiplicador = 1;
    if (event && event.shiftKey) {
        multiplicador = 10;
    }
    
    const cambio = direccion * multiplicador;

    // 2. Obtener el elemento HTML del número
    const stockElement = document.getElementById(`stock-qty-${id}`);
    if (!stockElement) return; // Seguridad

    // 3. Leer valor actual del HTML
    const cantidadActual = parseInt(stockElement.innerText);
    const nuevaCantidad = cantidadActual + cambio;

    // 4. Validar negativos
    if (nuevaCantidad < 0) {
        showToast("No hay suficiente stock", "error");
        return;
    }

    // 5. ACTUALIZACIÓN VISUAL INSTANTÁNEA (Sin esperar al servidor)
    stockElement.innerText = nuevaCantidad;
    
    // Animación visual de cambio (Flash)
    stockElement.style.color = cambio > 0 ? '#00C853' : '#FF6B6B'; // Verde o Rojo momentáneo
    setTimeout(() => {
        // Regresar al color original (o rojo si es bajo stock)
        stockElement.style.color = nuevaCantidad < 10 ? '#FF6B6B' : 'white';
    }, 300);

    // Actualizar KPI de Materiales localmente (truco visual)
    const kpiMat = document.getElementById('kpiMateriales');
    kpiMat.innerText = parseInt(kpiMat.innerText) + cambio;


    // 6. ENVIAR AL SERVIDOR (En segundo plano)
    try {
        const response = await fetch(`${API_URL}/materiales/${id}/stock`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cantidad: nuevaCantidad })
        });

        if (!response.ok) {
            throw new Error("Error en servidor");
        }
        // Si todo sale bien, no hacemos nada más, ya actualizamos la UI.
        
    } catch (error) {
        // 7. SI FALLA: REVERTIMOS EL CAMBIO (Rollback)
        stockElement.innerText = cantidadActual; // Volver al anterior
        kpiMat.innerText = parseInt(kpiMat.innerText) - cambio;
        showToast("Error de conexión. Cambio deshecho.", "error");
    }
}
// --- EDICIÓN TURBO ---
let idEnEdicion = null; // Variable para recordar qué material estamos editando

// 1. ABRIR EL MODAL BONITO
function editarStockManual(id) {
    idEnEdicion = id; // Guardamos el ID
    const stockElement = document.getElementById(`stock-qty-${id}`);
    const cantidadActual = parseInt(stockElement.innerText);
    
    const modal = document.getElementById('stockModal');
    const input = document.getElementById('stockInputModal');
    
    modal.style.display = 'flex'; // Mostrar modal
    input.value = cantidadActual; // Poner valor actual
    input.select(); // Seleccionar texto para escribir encima rápido
    input.focus();
}

// 2. GUARDAR EL CAMBIO
async function guardarStockModal() {
    const input = document.getElementById('stockInputModal');
    const nuevaCantidadStr = input.value;
    const modal = document.getElementById('stockModal');

    if (nuevaCantidadStr === "") return;

    const nuevaCantidad = parseInt(nuevaCantidadStr);
    if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
        showToast("Cantidad inválida", "error");
        return;
    }

    // Cerrar modal
    modal.style.display = 'none';

    // --- AQUI VA LA LÓGICA DE ACTUALIZACIÓN (IGUAL QUE ANTES) ---
    
    // Actualizar UI primero (Optimista)
    const stockElement = document.getElementById(`stock-qty-${idEnEdicion}`);
    const cantidadAnterior = parseInt(stockElement.innerText);
    
    stockElement.innerText = nuevaCantidad;
    stockElement.style.color = nuevaCantidad < 10 ? '#FF6B6B' : 'white';

    // Actualizar KPI visualmente
    const kpiMat = document.getElementById('kpiMateriales');
    const diferencia = nuevaCantidad - cantidadAnterior;
    kpiMat.innerText = parseInt(kpiMat.innerText) + diferencia;

    // Enviar al Backend
    try {
        await fetch(`${API_URL}/materiales/${idEnEdicion}/stock`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cantidad: nuevaCantidad })
        });
        showToast("Inventario ajustado");
        cargarObras(); // Para asegurar consistencia en BD
    } catch (error) {
        // Revertir si falla
        stockElement.innerText = cantidadAnterior;
        showToast("Error de conexión", "error");
    }
}

// 3. CERRAR MODAL
function cerrarStockModal() {
    document.getElementById('stockModal').style.display = 'none';
    idEnEdicion = null;
}

// 4. DETECTAR ENTER (Para que sea rápido)
function verificarEnterStock(event) {
    if (event.key === 'Enter') {
        guardarStockModal();
    }
    if (event.key === 'Escape') {
        cerrarStockModal();
    }
}// --- ELIMINAR ---
async function eliminarMaterial(id) {
    if(!confirm("¿Estás seguro de eliminar este material?")) return;
    
    await fetch(`${API_URL}/materiales/${id}`, { method: 'DELETE' });
    showToast("Material eliminado", "error");
    cargarMateriales();
    cargarObras();
}

// INICIALIZACIÓN
cargarObras();      
cargarMateriales();