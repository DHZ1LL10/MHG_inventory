from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Materiales ---
class MaterialBase(BaseModel):
    nombre: str
    categoria: str
    unidad: str
    cantidad: int
    ubicacion: str

class MaterialCreate(MaterialBase):
    pass

class Material(MaterialBase):
    id: int
    class Config:
        from_attributes = True

# --- Obras ---
class ObraBase(BaseModel):
    nombre: str
    cliente: str
    direccion: str

class ObraCreate(ObraBase):
    pass

class Obra(ObraBase):
    id: int
    activa: int
    class Config:
        from_attributes = True

# --- Movimientos (NUEVO) ---
class MovimientoCreate(BaseModel):
    material_id: int
    cantidad: int
    tipo: str # ENTRADA o SALIDA
    motivo: str # Nombre de la Obra o Razón
    usuario: str # Nombre del dispositivo

class Movimiento(MovimientoCreate):
    id: int
    fecha: datetime
    class Config:
        from_attributes = True

# --- Auth Dispositivos (NUEVO) ---
class LoginRequest(BaseModel):
    codigo: str

class DispositivoCreate(BaseModel):
    nombre: str
    rol: str

class Dispositivo(DispositivoCreate):
    id: int
    codigo_acceso: str
    class Config:
        from_attributes = True