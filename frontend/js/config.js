// config.js - Configuración centralizada del sistema MHG
// Coloca este archivo en: frontend/js/config.js

const CONFIG = {
    // 🎯 CONFIGURACIÓN AUTOMÁTICA DE API
    getApiUrl() {
        // 1. Intenta obtener la IP guardada
        const savedIp = localStorage.getItem('mhg_backend_ip');
        if (savedIp) {
            return `http://${savedIp}:8000`;
        }
        
        // 2. Detecta automáticamente según el hostname
        const hostname = window.location.hostname;
        
        // Si estamos en localhost, usa la IP de red local por defecto
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://192.168.0.49:8000';
        }
        
        // Si estamos en una tablet en red local, usa esa IP
        if (hostname.startsWith('192.168.') || hostname.startsWith('10.0.')) {
            return `http://${hostname}:8000`;
        }
        
        // Fallback a tu IP actual
        return 'http://192.168.0.49:8000';
    },
    
    // 🔐 Configuración de autenticación
    AUTH_STORAGE_KEY: 'mhg_user_session',
    PIN_LENGTH: 6,
    
    // ⚙️ Configuración de solicitudes HTTP
    REQUEST_TIMEOUT: 10000,
    
    // 🎨 Configuración de UI
    TOAST_DURATION: 3000,
    
    // 📊 Configuración de inventario
    DEFAULT_MIN_STOCK: 5,
    
    // 🔄 Inicializar
    init() {
        this.API_BASE_URL = this.getApiUrl();
        console.log('✅ Sistema MHG inicializado');
        console.log('📡 Backend configurado en:', this.API_BASE_URL);
    },
    
    // 🛠️ Cambiar IP del backend manualmente
    setBackendIp(ip) {
        localStorage.setItem('mhg_backend_ip', ip);
        this.API_BASE_URL = `http://${ip}:8000`;
        console.log('✅ IP del backend actualizada:', this.API_BASE_URL);
        return this.API_BASE_URL;
    },
    
    // 🧪 Probar conexión con el backend
    async testConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.API_BASE_URL}/materiales/`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                console.log('✅ Conexión exitosa con el backend');
                return { success: true, message: 'Conectado correctamente' };
            } else {
                console.error('❌ Error HTTP:', response.status);
                return { success: false, message: `Error HTTP ${response.status}` };
            }
        } catch (error) {
            console.error('❌ Error de conexión:', error.message);
            return { 
                success: false, 
                message: error.name === 'AbortError' ? 'Timeout' : 'Sin conexión'
            };
        }
    }
};

// Inicializar automáticamente
CONFIG.init();

// Exportar globalmente
window.CONFIG = CONFIG;

// 🔍 Herramientas de diagnóstico (para la consola del navegador)
window.mhgDiag = {
    info() {
        console.log('═══════════════════════════════════════');
        console.log('📊 DIAGNÓSTICO DEL SISTEMA MHG');
        console.log('═══════════════════════════════════════');
        console.log('🌐 URL actual:', window.location.href);
        console.log('🖥️  Hostname:', window.location.hostname);
        console.log('📡 Backend URL:', CONFIG.API_BASE_URL);
        console.log('💾 IP guardada:', localStorage.getItem('mhg_backend_ip'));
        console.log('👤 Usuario:', localStorage.getItem('usuarioNombre'));
        console.log('🔐 Rol:', localStorage.getItem('usuarioRol'));
        console.log('═══════════════════════════════════════');
    },
    
    async probar() {
        console.log('🧪 Probando conexión con el backend...');
        const result = await CONFIG.testConnection();
        console.log(result.success ? '✅' : '❌', result.message);
        return result;
    },
    
    cambiarIp(nuevaIp) {
        console.log('🔄 Cambiando IP del backend...');
        CONFIG.setBackendIp(nuevaIp);
        console.log('✅ Nueva IP configurada:', nuevaIp);
        console.log('🔄 Recarga la página para aplicar los cambios');
    },
    
    ayuda() {
        console.log('═══════════════════════════════════════');
        console.log('🆘 COMANDOS DISPONIBLES');
        console.log('═══════════════════════════════════════');
        console.log('mhgDiag.info()           - Ver configuración actual');
        console.log('mhgDiag.probar()         - Probar conexión al backend');
        console.log('mhgDiag.cambiarIp("IP")  - Cambiar IP del backend');
        console.log('mhgDiag.reset()          - Restablecer configuración');
        console.log('═══════════════════════════════════════');
    },
    
    reset() {
        localStorage.removeItem('mhg_backend_ip');
        console.log('✅ Configuración restablecida');
        console.log('🔄 Recarga la página');
    }
};

// Mostrar ayuda en la consola
console.log('💡 Escribe mhgDiag.ayuda() para ver comandos de diagnóstico');