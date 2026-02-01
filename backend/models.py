from sqlalchemy import Column, Integer, String
from database import Base

class Material(Base):
    __tablename__ = "materiales"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)      # Ej: Cemento Cruz Azul
    categoria = Column(String)               # Ej: Obra Negra, Acabados
    unidad = Column(String)                  # Ej: Bulto, Metro, Pieza
    cantidad = Column(Integer, default=0)    # Stock actual
    ubicacion = Column(String, default="Bodega Central") # Dónde está

class Obra(Base):
    __tablename__ = "obras"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)        # Ej: Casa Lomas
    cliente = Column(String)                   # Ej: Sr. Pérez
    direccion = Column(String)                 # Ej: Av. Reforma 123
    presupuesto = Column(Integer, default=0)   # Opcional para apantallar