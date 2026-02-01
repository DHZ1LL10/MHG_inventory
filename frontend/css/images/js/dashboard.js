const API_URL = "http://127.0.0.1:8000";

// ==========================================
// 1. GESTIÓN DE OBRAS
// ==========================================
async function cargarObras() {
    try {
        const response = await fetch(`${API_URL}/obras/`);
        const obras = await response.json();
        
        // 1.1 Llenar la lista visual de tarjetas
        const contenedor = document.getElementById('listaObras');
        contenedor.innerHTML = ''; 

        // 1.2 Llenar los selectores (Formulario y Filtro)
        const selectorForm = document.getElementById('ubicacion');
        const selectorFiltro = document.getElementById('filtroUbicacion');
        
        // Guardamos selección actual del filtro
        const filtroActual = selectorFiltro.value;

        // Resetear selectores
        selectorForm.innerHTML = '<option value="Bodega Central">🏠 Bodega Central</option>';
        selectorFiltro.innerHTML = '<option value="Todos">🏗️ Ver Todo el Inventario</option><option value="Bodega Central">🏠 Solo Bodega Central</option>';

        obras.forEach(obra => {
            // Tarjeta visual
            const card = `
                <div style="background: #2C2C2C; padding: 10px 15px; border-radius: 4px; border: 1px solid #333; min-width: 150px;">
                    <div style="color: #2196F3; font-weight: bold; font-size: 0.9em;">${obra.nombre}</div>
                    <div style="color: #888; font-size: 0.8em;">${obra.cliente}</div>
                </div>
            `;
            contenedor.innerHTML += card;

            // Opción en Selectores
            const optionHTML = `<option value="${obra.nombre}">📍 ${obra.nombre}</option>`;
            selectorForm.insertAdjacentHTML('beforeend', optionHTML);
            selectorFiltro.insertAdjacentHTML('beforeend', optionHTML);
        });

        // Restaurar filtro
        selectorFiltro.value = filtroActual;

    } catch (error) {
        console.error("Error cargando obras:", error);
    }
}

document.getElementById('obraForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuevaObra = {
        nombre: document.getElementById('obraNombre').value,
        cliente: document.getElementById('obraCliente').value,
        direccion: document.getElementById('obraDireccion').value,
        presupuesto: 0
    };

    try {
        const response = await fetch(`${API_URL}/obras/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaObra)
        });

        if (response.ok) {
            document.getElementById('obraForm').reset();
            cargarObras(); // Recarga visual y selectores
        } else {
            alert("Error al crear obra");
        }
    } catch (error) { console.error(error); }
});

// ==========================================
// 2. GESTIÓN DE MATERIALES
// ==========================================
async function cargarMateriales() {
    try {
        const response = await fetch(`${API_URL}/materiales/`);
        let materiales = await response.json();
        
        // Filtrado
        const filtro = document.getElementById('filtroUbicacion').value;
        if (filtro !== "Todos") {
            materiales = materiales.filter(mat => mat.ubicacion === filtro);
        }

        const tbody = document.getElementById('tablaMateriales');
        tbody.innerHTML = ''; 

        if (materiales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px; color: #666;">No hay materiales en esta ubicación</td></tr>';
            return;
        }

        materiales.forEach(mat => {
            // Estilo dinámico para ubicación
            const badgeClass = mat.ubicacion === 'Bodega Central' ? 'badge-gray' : 'badge-blue';
            const icon = mat.ubicacion === 'Bodega Central' ? '🏠' : '📍';

            const row = `
                <tr>
                    <td style="color: #666;">#${mat.id}</td>
                    <td><strong style="color: white;">${mat.nombre}</strong></td>
                    <td>${mat.categoria}</td>
                    <td>
                        <span class="badge ${badgeClass}">${icon} ${mat.ubicacion}</span>
                    </td>
                    <td>
                        <div class="stock-control">
                            <button class="btn-mini btn-minus" onclick="cambiarStock(${mat.id}, ${mat.cantidad}, -1)">−</button>
                            <span class="stock-number">${mat.cantidad}</span>
                            <button class="btn-mini btn-plus" onclick="cambiarStock(${mat.id}, ${mat.cantidad}, 1)">+</button>
                            <span style="font-size: 0.8em; color: #888; margin-left: 5px;">${mat.unidad}</span>
                        </div>
                    </td>
                    <td style="text-align: right;">
                        <span class="btn-delete" onclick="eliminarMaterial(${mat.id})" title="Eliminar">🗑️</span>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error("Error:", error);
    }
}

// Crear Material
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
    cargarMateriales();
});

// Actualizar Stock (Lógica Backend)
async function cambiarStock(id, cantidadActual, cambio) {
    const nuevaCantidad = cantidadActual + cambio;
    if (nuevaCantidad < 0) return; // Evitar negativos

    await fetch(`${API_URL}/materiales/${id}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad: nuevaCantidad })
    });
    cargarMateriales(); // Recarga solo la tabla
}

// Eliminar
async function eliminarMaterial(id) {
    if(!confirm("¿Eliminar este material?")) return;
    await fetch(`${API_URL}/materiales/${id}`, { method: 'DELETE' });
    cargarMateriales();
}

// Inicialización
cargarObras();      // Primero obras para llenar los selectores
cargarMateriales(); // Luego la tabla