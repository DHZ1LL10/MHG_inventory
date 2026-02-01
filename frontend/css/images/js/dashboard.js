const API_URL = "http://127.0.0.1:8000"; // Tu servidor FastAPI

async function cargarObras() {
    try {
        const response = await fetch(`${API_URL}/obras/`);
        const obras = await response.json();
        
        const contenedor = document.getElementById('listaObras');
        contenedor.innerHTML = ''; // Limpiar

        obras.forEach(obra => {
            // Creamos una "tarjeta" simple para cada obra
            const card = `
                <div style="background: #333; padding: 10px; border-radius: 5px; font-size: 0.9em;">
                    <strong style="color: #2196F3;">${obra.nombre}</strong><br>
                    <small>${obra.cliente}</small>
                </div>
            `;
            contenedor.innerHTML += card;
        });
    } catch (error) {
        console.error("Error cargando obras:", error);
    }
}

// Evento para crear nueva Obra
document.getElementById('obraForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nuevaObra = {
        nombre: document.getElementById('obraNombre').value,
        cliente: document.getElementById('obraCliente').value,
        direccion: document.getElementById('obraDireccion').value,
        presupuesto: 0 // Por ahora en 0
    };

    try {
        const response = await fetch(`${API_URL}/obras/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaObra)
        });

        if (response.ok) {
            alert("Obra creada con éxito");
            document.getElementById('obraForm').reset();
            cargarObras(); // Recargar la lista visual
        } else {
            alert("Error al crear obra");
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

cargarObras();

// 1. Llenamos AMBOS selectores (el del formulario y el del filtro)
async function llenarSelectorObras() {
    const selectorForm = document.getElementById('ubicacion');
    const selectorFiltro = document.getElementById('filtroUbicacion');
    
    // Limpiamos y ponemos los defaults
    selectorForm.innerHTML = '<option value="Bodega Central">🏠 Bodega Central</option>';
    
    // En el filtro guardamos lo que haya seleccionado el usuario actualmente para no resetearlo de golpe
    const filtroActual = selectorFiltro.value;
    selectorFiltro.innerHTML = '<option value="Todos">🏗️ Ver Todo</option><option value="Bodega Central">🏠 Bodega Central</option>';

    try {
        const response = await fetch(`${API_URL}/obras/`);
        const obras = await response.json();

        obras.forEach(obra => {
            // Opción para el Formulario (Crear)
            const option1 = document.createElement('option');
            option1.value = obra.nombre;
            option1.textContent = `📍 ${obra.nombre}`;
            selectorForm.appendChild(option1);

            // Opción para el Filtro (Ver)
            const option2 = document.createElement('option');
            option2.value = obra.nombre;
            option2.textContent = `📍 ${obra.nombre}`;
            selectorFiltro.appendChild(option2);
        });

        // Restaurar selección del filtro si existía
        selectorFiltro.value = filtroActual;

    } catch (error) {
        console.error("Error cargando selectores:", error);
    }
}

// 2. Cargamos materiales aplicando el filtro
async function cargarMateriales() {
    try {
        const response = await fetch(`${API_URL}/materiales/`);
        let materiales = await response.json();
        
        // --- LÓGICA DE FILTRADO NUEVA ---
        const filtro = document.getElementById('filtroUbicacion').value;
        if (filtro !== "Todos") {
            materiales = materiales.filter(mat => mat.ubicacion === filtro);
        }
        // --------------------------------

        const tbody = document.getElementById('tablaMateriales');
        tbody.innerHTML = ''; 

        if (materiales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #888;">No hay materiales en esta ubicación</td></tr>';
            return;
        }

        materiales.forEach(mat => {
            const row = `
                <tr>
                    <td>#${mat.id}</td>
                    <td><strong>${mat.nombre}</strong></td>
                    <td>${mat.categoria}</td>
                    <td>
                        <span style="background: ${mat.ubicacion === 'Bodega Central' ? '#444' : '#2196F3'}; padding: 2px 6px; border-radius: 4px; font-size: 0.85em;">
                            ${mat.ubicacion}
                        </span>
                    </td>
                    <td>${mat.cantidad} ${mat.unidad}</td>
                    <td>
                        <span class="delete-btn" onclick="eliminarMaterial(${mat.id})">🗑️</span>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error("Error cargando materiales:", error);
    }
}