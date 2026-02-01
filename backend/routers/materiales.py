from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models import Material 
import models, schemas, database
from schemas import MaterialCreate, MaterialResponse # etc...
from database import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/materiales", tags=["Materiales"])

# 1. Obtener todos los materiales
@router.get("/", response_model=List[schemas.MaterialResponse])
def leer_materiales(db: Session = Depends(database.get_db)):
    materiales = db.query(models.Material).all()
    return materiales

# 2. Crear un nuevo material
@router.post("/", response_model=schemas.MaterialResponse)
def crear_material(material: schemas.MaterialCreate, db: Session = Depends(database.get_db)):
    db_material = models.Material(**material.dict())
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material

# 3. Eliminar material (útil para pruebas)
@router.delete("/{material_id}")
def eliminar_material(material_id: int, db: Session = Depends(database.get_db)):
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    db.delete(material)
    db.commit()
    return {"mensaje": "Material eliminado"}
class StockUpdate(BaseModel):
    cantidad: int

# PUT /materiales/{id}/stock
@router.put("/{material_id}/stock", response_model=schemas.MaterialResponse)
def actualizar_stock(material_id: int, stock: StockUpdate, db: Session = Depends(database.get_db)):
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    
    material.cantidad = stock.cantidad
    db.commit()
    db.refresh(material)
    return material