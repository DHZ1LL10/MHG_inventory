from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Material(Base):
    __tablename__ = "materiales"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    categoria = Column(String)
    unidad = Column(String)
    cantidad = Column(Integer, default=0)
    ubicacion = Column(String) # "Bodega Central", "Taller", etc.
    min_stock = Column(Integer, default=5)
    
    # --- 💰 NUEVOS CAMPOS FINANCIEROS ---
    costo_unitario = Column(Float, default=0.0) # A cómo lo compramos (Costo interno)
    precio_venta = Column(Float, default=0.0)   # A cómo lo vendemos (Público)
    proveedor = Column(String, default="Genérico") # Quién nos surte
    ultimo_abastecimiento = Column(DateTime, default=datetime.utcnow) # Cuándo llegó stock nuevo

class Movimiento(Base):
    __tablename__ = "movimientos"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materiales.id"))
    cantidad = Column(Integer)
    tipo = Column(String) # "ENTRADA" o "SALIDA"
    motivo = Column(String) # "Obra: X", "Venta", "Ajuste"
    fecha = Column(DateTime, default=datetime.utcnow)
    usuario = Column(String)
    
    # --- 💰 NUEVO CAMPO DE VALOR ---
    valor_monetario = Column(Float, default=0.0) # Cuánto dinero representó este movimiento

class Obra(Base):
    __tablename__ = "obras"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True)
    cliente = Column(String)
    direccion = Column(String)
    # --- 💰 CONTROL DE GASTOS ---
    presupuesto_asignado = Column(Float, default=0.0) # Tope de gasto (Opcional)
    gasto_actual = Column(Float, default=0.0) # Acumulado de salidas hacia esta obra

class Dispositivo(Base):
    __tablename__ = "dispositivos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    codigo_acceso = Column(String, unique=True)
    rol = Column(String)