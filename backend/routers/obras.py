from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database

router = APIRouter(prefix="/obras", tags=["Obras"])

# Ver todas las obras
@router.get("/", response_model=List[schemas.ObraResponse])
def leer_obras(db: Session = Depends(database.get_db)):
    return db.query(models.Obra).all()

# Crear nueva obra
@router.post("/", response_model=schemas.ObraResponse)
def crear_obra(obra: schemas.ObraCreate, db: Session = Depends(database.get_db)):
    db_obra = models.Obra(**obra.dict())
    db.add(db_obra)
    db.commit()
    db.refresh(db_obra)
    return db_obra