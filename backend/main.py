from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import materiales
from .routers import materiales, obras  

# Crea las tablas en la BD automáticamente al iniciar
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MHG Arquitectos API")

# Configurar CORS (IMPORTANTE: permite que tu frontend hable con el backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción se cambia por la URL real
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir los routers
app.include_router(materiales.router)
app.include_router(obras.router)

@app.get("/")
def root():
    return {"mensaje": "Sistema de Inventario MHG Arquitectos - API Activa"}