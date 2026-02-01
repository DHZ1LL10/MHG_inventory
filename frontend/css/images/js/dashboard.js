const API_URL = "http://127.0.0.1:8000"; // Tu servidor FastAPI

// 1. Función para cargar la tabla
async function cargarMateriales() {
    try {
        const response = await fetch(`${API_URL}/materiales/`);
        const materiales = await response.json();
        
        const tbody = document.getElementById('tablaMateriales');
        tbody.innerHTML = ''; // Limpiar tabla actual

        materiales.forEach(mat => {
            const row = `
                <tr>
                    <td>#${mat.id}</td>
                    <td><strong>${mat.nombre}</strong></td>
                    <td>${mat.categoria}</td>
                    <td>${mat.ubicacion}</td>
                    <td>${mat.cantidad} ${mat.unidad}</td>
                    <td>
                        <span class="delete-btn" onclick="eliminarMaterial(${mat.id})">Eliminar</span>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error("Error cargando materiales:", error);
        alert("Error al conectar con el servidor backend");
    }
}

// 2. Función para guardar nuevo material
document.getElementById('materialForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que se recargue la página

    const nuevoMaterial = {
        nombre: document.getElementById('nombre').value,
        categoria: document.getElementById('categoria').value,
        unidad: document.getElementById('unidad').value,
        cantidad: parseInt(document.getElementById('cantidad').value),
        ubicacion: document.getElementById('ubicacion').value
    };

    try {
        const response = await fetch(`${API_URL}/materiales/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoMaterial)
        });

        if (response.ok) {
            alert("Material guardado correctamente");
            document.getElementById('materialForm').reset();
            cargarMateriales(); // Recargar la tabla para ver el cambio
        } else {
            alert("Error al guardar");
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

// 3. Función para eliminar (Extra)
async function eliminarMaterial(id) {
    if(!confirm("¿Seguro que quieres borrar este material?")) return;

    await fetch(`${API_URL}/materiales/${id}`, { method: 'DELETE' });
    cargarMateriales();
}

// Cargar al inicio
cargarMateriales();

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

// Inicializar Obras también al cargar la página
cargarObras();

async function llenarSelectorObras() {
    const selector = document.getElementById('ubicacion');
    // Guardamos la opción "Bodega Central" para no borrarla
    selector.innerHTML = '<option value="Bodega Central">🏠 Bodega Central</option>';

    try {
        const response = await fetch(`${API_URL}/obras/`);
        const obras = await response.json();

        obras.forEach(obra => {
            const option = document.createElement('option');
            option.value = obra.nombre; // El valor que se guardará en BD
            option.textContent = `📍 ${obra.nombre}`; // Lo que ve el usuario
            selector.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando selector:", error);
    }
}

llenarSelectorObras();