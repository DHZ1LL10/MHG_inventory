#  Sistema de Inventario - MHG Arquitectos

Sistema de gestión de inventarios y control de materiales para proyectos de arquitectura y construcción. Permite la administración en tiempo real de insumos, asignación a obras específicas y auditoría de stock.

##  Tecnologías

* **Frontend:** HTML5, CSS3 (Dark Mode UI), JavaScript Vanilla (Fetch API).
* **Backend:** Python 3.9, FastAPI.
* **Base de Datos:** SQLite (SQLAlchemy ORM).
* **DevOps:** Docker & Docker Compose.

##  Requisitos Previos

* [Docker Desktop](https://www.docker.com/products/docker-desktop) instalado.
* Navegador Web Moderno (Chrome/Edge/Firefox).

##  Instalación y Despliegue

Este proyecto está contenerizado para facilitar su despliegue en cualquier entorno.

1.  **Clonar el repositorio:**
    ```bash
    git clone <tu-repo-url>
    cd mhg-inventario
    ```

2.  **Iniciar el servidor (Backend):**
    ```bash
    docker compose up --build
    ```
    *El servidor API iniciará en: `http://localhost:8000`*

3.  **Acceder al Sistema:**
    * Abre el archivo `frontend/index.html` directamente en tu navegador.
    * Para ver la documentación de la API, visita: `http://localhost:8000/docs`

##  Funcionalidades Principales

1.  **Dashboard de Obras:** Alta de nuevos proyectos (Torres, Residencias) con cliente y ubicación.
2.  **Control de Inventario:** CRUD completo de materiales (Cemento, Acabados, etc.).
3.  **Asignación Dinámica:** Mover materiales entre Bodega Central y Obras específicas.
4.  **Filtros Inteligentes:** Visualización de stock por ubicación específica.

---
**Desarrollado por:** Diego Herrera Zilli