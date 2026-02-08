from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional
from datetime import datetime

# --- ESQUEMA DE LOGIN ---
class LoginRequest(BaseModel):
    codigo: str

# --- ESQUEMAS DE MATERIAL ---
class MaterialBase(BaseModel):
    nombre: str
    categoria: str
    unidad: str
    cantidad: int
    ubicacion: str
    min_stock: int
    costo_unitario: float = 0.0
    precio_venta: float = 0.0
    proveedor: str = "Genérico"

    # ✅ VALIDACIONES AUTOMÁTICAS
    @field_validator('cantidad', 'min_stock')
    @classmethod
    def validar_positivos_enteros(cls, v):
        if v < 0:
            raise ValueError('No puede ser negativo')
        return v

    @field_validator('costo_unitario', 'precio_venta')
    @classmethod
    def validar_dinero(cls, v):
        if v < 0:
            raise ValueError('El precio no puede ser negativo')
        return v
    
    @field_validator('nombre')
    @classmethod
    def validar_nombre(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El nombre no puede estar vacío')
        return v.strip()

class MaterialCreate(MaterialBase):
    pass

class Material(MaterialBase):
    id: int
    ultimo_abastecimiento: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- ESQUEMAS DE MOVIMIENTO ---
class MovimientoBase(BaseModel):
    material_id: int
    cantidad: int
    tipo: str # ENTRADA o SALIDA
    motivo: str
    usuario: str

    @field_validator('cantidad')
    @classmethod
    def cantidad_positiva(cls, v):
        if v <= 0:
            raise ValueError('La cantidad del movimiento debe ser mayor a 0')
        return v

class MovimientoCreate(MovimientoBase):
    pass

class Movimiento(MovimientoBase):
    id: int
    fecha: datetime
    valor_monetario: float = 0.0

    model_config = ConfigDict(from_attributes=True)

# --- ESQUEMAS DE OBRA ---
class ObraBase(BaseModel):
    nombre: str
    cliente: str
    direccion: str
    presupuesto_asignado: float = 0.0

class ObraCreate(ObraBase):
    pass

class Obra(ObraBase):
    id: int
    gasto_actual: float = 0.0

    model_config = ConfigDict(from_attributes=True)

# --- ESQUEMAS DE DISPOSITIVO ---
class DispositivoBase(BaseModel):
    nombre: str
    codigo_acceso: str
    rol: str

class DispositivoCreate(DispositivoBase):
    pass

class Dispositivo(DispositivoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)