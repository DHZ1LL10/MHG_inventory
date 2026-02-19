// --- GESTIÓN DE CONFIGURACIÓN CENTRALIZADA ---

const CONFIG = {
    // 1. Obtener la URL de la API
    getApiUrl() {
        // Primero: Busca si el usuario guardó una manual
        const manualIp = localStorage.getItem('mhg_api_url');
        if (manualIp) return manualIp;

        // Segundo: Si estamos en localhost, usa localhost
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8000';
        }

        // Tercero: Intenta adivinar (fallback)
        return `http://${hostname}:8000`;
    },

    // 2. Inicializar
    init() {
        this.API_BASE_URL = this.getApiUrl();
        console.log('🔌 MHG Configurado en:', this.API_BASE_URL);
    }
};

// Inicializamos de inmediato
CONFIG.init();

// --- LÓGICA DE LA PANTALLA DE CONFIGURACIÓN (Solo funciona si existe el formulario) ---
document.addEventListener("DOMContentLoaded", () => {
    const configForm = document.getElementById('configForm');

    if (configForm) {
        const inputUrl = document.getElementById('apiUrlInput');
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');

        // Poner el valor actual en el input
        inputUrl.value = CONFIG.API_BASE_URL;

        // Función para probar conexión real
        async function probarConexion(url) {
            statusText.innerText = "Probando conexión...";
            statusText.style.color = "#FFD700"; // Amarillo
            statusDot.style.backgroundColor = "#FFD700";

            try {
                // Intentamos conectar al endpoint de documentación (es ligero)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seg timeout

                const res = await fetch(`${url}/docs`, {
                    method: 'HEAD',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    statusDot.style.backgroundColor = "#00C853"; // Verde
                    statusText.innerText = "¡Conexión Exitosa!";
                    statusText.style.color = "#00C853";
                    return true;
                }
            } catch (e) {
                console.error("Fallo conexión:", e);
            }

            statusDot.style.backgroundColor = "#FF5252"; // Rojo
            statusText.innerText = "No se encuentra el servidor";
            statusText.style.color = "#FF5252";
            return false;
        }

        // Evento del botón Guardar
        configForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            let url = inputUrl.value.trim().replace(/\/$/, ""); // Quitar espacios y slash final

            if (!url.startsWith("http")) {
                url = "http://" + url;
            }

            const exito = await probarConexion(url);

            if (exito) {
                localStorage.setItem("mhg_api_url", url); // Guardamos la nueva IP
                alert("✅ Configuración Guardada. Redirigiendo...");
                window.location.href = "index.html";
            } else {
                if (confirm("⚠️ No pudimos conectar con esa IP. ¿Guardar de todos modos?")) {
                    localStorage.setItem("mhg_api_url", url);
                    window.location.href = "index.html";
                }
            }
        });

        // Probar conexión automáticamente al abrir la página
        probarConexion(inputUrl.value);
    }
});