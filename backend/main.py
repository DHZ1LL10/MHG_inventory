from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas, database
import random, string

# 1. Crear tablas
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# 2. PERMITIR CONEXIÓN DESDE TABLETS (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # ¡Importante! Permite todas las IPs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- RUTAS DE OBRAS (DESTINOS) ---
@app.get("/obras/", response_model=list[schemas.Obra])
def leer_obras(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Obra).offset(skip).limit(limit).all()

@app.post("/obras/", response_model=schemas.Obra)
def crear_obra(obra: schemas.ObraCreate, db: Session = Depends(get_db)):
    db_obra = models.Obra(**obra.dict())
    db.add(db_obra)
    db.commit()
    db.refresh(db_obra)
    return db_obra

# --- RUTAS DE MATERIALES (INVENTARIO) ---
@app.get("/materiales/", response_model=list[schemas.Material])
def leer_materiales(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Material).offset(skip).limit(limit).all()

@app.post("/materiales/", response_model=schemas.Material)
def crear_material(material: schemas.MaterialCreate, db: Session = Depends(get_db)):
    db_material = models.Material(**material.dict())
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material

@app.delete("/materiales/{material_id}")
def eliminar_material(material_id: int, db: Session = Depends(get_db)):
    db_material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="No encontrado")
    db.delete(db_material)
    db.commit()
    return {"mensaje": "Eliminado"}

# --- RUTAS DE MOVIMIENTOS (HISTORIAL) ---
@app.post("/movimientos/", response_model=schemas.Movimiento)
def registrar_movimiento(mov: schemas.MovimientoCreate, db: Session = Depends(get_db)):
    # 1. Buscar material
    material = db.query(models.Material).filter(models.Material.id == mov.material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    
    # 2. Modificar Stock (Solo Bodega/Taller)
    if mov.tipo == "ENTRADA":
        material.cantidad += mov.cantidad
    elif mov.tipo == "SALIDA":
        if material.cantidad < mov.cantidad:
            raise HTTPException(status_code=400, detail="Stock insuficiente")
        material.cantidad -= mov.cantidad
    
    # 3. Guardar en Historial (Aquí queda registrado a dónde se fue)
    db_mov = models.Movimiento(
        material_id=mov.material_id,
        cantidad=mov.cantidad,
        tipo=mov.tipo,
        motivo=mov.motivo, # Aquí va el nombre de la obra
        usuario=mov.usuario
    )
    db.add(db_mov)
    db.commit()
    db.refresh(db_mov)
    return db_mov

@app.get("/movimientos/", response_model=list[schemas.Movimiento])
def leer_movimientos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Movimiento).order_by(models.Movimiento.fecha.desc()).offset(skip).limit(limit).all()