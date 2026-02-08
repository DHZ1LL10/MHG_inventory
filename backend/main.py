from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas, database
import random, string

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- MATERIALES ---
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
    if not db_material: raise HTTPException(status_code=404, detail="No encontrado")
    db.delete(db_material)
    db.commit()
    return {"ok": True}

# --- OBRAS ---
@app.get("/obras/", response_model=list[schemas.Obra])
def leer_obras(db: Session = Depends(get_db)):
    return db.query(models.Obra).all()

@app.post("/obras/", response_model=schemas.Obra)
def crear_obra(obra: schemas.ObraCreate, db: Session = Depends(get_db)):
    db_obra = models.Obra(**obra.dict())
    db.add(db_obra)
    db.commit()
    db.refresh(db_obra)
    return db_obra

from datetime import datetime # <--- Asegúrate de tener este import arriba

# --- MOVIMIENTOS (CON LÓGICA FINANCIERA) ---
@app.post("/movimientos/", response_model=schemas.Movimiento)
def registrar_movimiento(mov: schemas.MovimientoCreate, db: Session = Depends(get_db)):
    # 1. Buscar el material
    material = db.query(models.Material).filter(models.Material.id == mov.material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    
    # 2. Calcular VALOR MONETARIO ($)
    # Multiplicamos la cantidad por lo que nos costó el material
    valor_calculado = float(mov.cantidad) * material.costo_unitario

    # 3. Lógica de Inventario
    if mov.tipo == "ENTRADA":
        material.cantidad += mov.cantidad
        material.ultimo_abastecimiento = datetime.utcnow() # Actualizamos fecha de última compra
    elif mov.tipo == "SALIDA":
        # Validación de seguridad: No dejar sacar más de lo que hay
        if material.cantidad < mov.cantidad:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente. Solo tienes {material.cantidad} disponibles.")
        material.cantidad -= mov.cantidad
    
    # 4. Crear el registro en Bitácora
    db_mov = models.Movimiento(
        material_id=mov.material_id,
        cantidad=mov.cantidad,
        tipo=mov.tipo,
        motivo=mov.motivo,
        usuario=mov.usuario,
        valor_monetario=valor_calculado # <--- Guardamos el dinero que representa este movimiento
    )

    db.add(db_mov)
    db.commit()
    db.refresh(db_mov)
    return db_mov

@app.get("/movimientos/", response_model=list[schemas.Movimiento])
def leer_movimientos(limit: int = 20, db: Session = Depends(get_db)):
    # Traemos los últimos 20 movimientos, ordenados del más reciente al más antiguo
    return db.query(models.Movimiento).order_by(models.Movimiento.fecha.desc()).limit(limit).all()
# --- DISPOSITIVOS (LOGIN & GESTIÓN) ---
@app.post("/login")
def login(login: schemas.LoginRequest, db: Session = Depends(get_db)):
    if login.codigo == "admin123": return {"nombre": "Admin Maestro", "rol": "ADMIN"}
    dev = db.query(models.Dispositivo).filter(models.Dispositivo.codigo_acceso == login.codigo).first()
    if not dev: raise HTTPException(status_code=401, detail="Código inválido")
    return {"nombre": dev.nombre, "rol": dev.rol}

@app.get("/admin/dispositivos", response_model=list[schemas.Dispositivo])
def listar_dispositivos(db: Session = Depends(get_db)):
    return db.query(models.Dispositivo).all()

@app.post("/admin/generar-dispositivo", response_model=schemas.Dispositivo)
def crear_dispositivo(disp: schemas.DispositivoCreate, db: Session = Depends(get_db)):
    chars = string.digits
    codigo = ''.join(random.choice(chars) for _ in range(6))
    nuevo = models.Dispositivo(nombre=disp.nombre, rol=disp.rol, codigo_acceso=codigo)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@app.delete("/admin/dispositivos/{id}")
def borrar_dispositivo(id: int, db: Session = Depends(get_db)):
    dev = db.query(models.Dispositivo).filter(models.Dispositivo.id == id).first()
    if not dev: raise HTTPException(status_code=404, detail="No encontrado")
    db.delete(dev)
    db.commit()
    return {"ok": True}