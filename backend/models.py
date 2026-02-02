from database import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
import enum

# Enums para estandarizar
class TipoMovimiento(str, enum.Enum):
    ENTRADA = "ENTRADA"  # Compra de material
    SALIDA = "SALIDA"    # Uso en obra, venta o taller

class RolDispositivo(str, enum.Enum):
    ADMIN = "ADMIN"           # Tu primo (Todo)
    TALLER = "TALLER"         # Carpinteros (Solo restar stock)
    EXHIBICION = "EXHIBICION" # Ventas (Solo restar stock y ver precios)

# --- TABLAS ---

class Dispositivo(Base):
    __tablename__ = "dispositivos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)  # Ej: "Tablet Carpintería 1"
    codigo_acceso = Column(String, unique=True) # El PIN de 6 dígitos
    rol = Column(String) # ADMIN, TALLER, EXHIBICION
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

class Material(Base):
    __tablename__ = "materiales"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    categoria = Column(String)
    unidad = Column(String)
    cantidad = Column(Integer, default=0)
    ubicacion = Column(String) # Bodega o Taller

class Obra(Base):
    __tablename__ = "obras"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    cliente = Column(String)
    direccion = Column(String)
    activa = Column(Integer, default=1) # 1 = Activa, 0 = Terminada

class Movimiento(Base):
    __tablename__ = "movimientos"
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materiales.id"))
    cantidad = Column(Integer)
    tipo = Column(String) # ENTRADA o SALIDA
    motivo = Column(String) # Ej: "Para Torre Mitikah", "Venta Mostrador", "Uso Interno Taller"
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    usuario = Column(String) # Quién hizo el movimiento (Ej: "Tablet Taller")