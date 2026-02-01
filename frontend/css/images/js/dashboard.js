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