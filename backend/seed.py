from database import SessionLocal, engine, Base
from models import Material, Obra, Dispositivo
from sqlalchemy.orm import Session
from datetime import datetime

# Reiniciar base de datos
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
db: Session = SessionLocal()

print("🌱 Sembrando sistema con DATOS FINANCIEROS...")

# 1. OBRAS (Con presupuesto)
db.add(Obra(nombre="Torre Mitikah", cliente="Fibra Uno", direccion="CDMX", presupuesto_asignado=500000.0))
db.add(Obra(nombre="Casa Lomas", cliente="Sr. Pérez", direccion="Lomas", presupuesto_asignado=150000.0))

# 2. MATERIALES (Con Costo y Precio Venta)
# Material de alto valor (Herramienta)
db.add(Material(
    nombre="Sierra Circular Makita", 
    categoria="Herramienta", 
    unidad="Pieza", 
    cantidad=3, 
    ubicacion="Taller", 
    min_stock=1, 
    costo_unitario=2800.00,  # Nos cuesta
    precio_venta=3500.00,    # La vendemos en
    proveedor="Home Depot"
))

# Material de alto volumen (Consumible)
db.add(Material(
    nombre="Clavos 2 Pulgadas", 
    categoria="Carpintería", 
    unidad="Kg", 
    cantidad=150, 
    ubicacion="Bodega Central", 
    min_stock=50, 
    costo_unitario=45.00, 
    precio_venta=85.00,
    proveedor="Ferretería El Sol"
))

# Material de Construcción
db.add(Material(
    nombre="Cemento Gris Cruz Azul", 
    categoria="Obra Negra", 
    unidad="Bulto", 
    cantidad=40, 
    ubicacion="Bodega Central", 
    min_stock=10, 
    costo_unitario=210.00, 
    precio_venta=260.00,
    proveedor="Materiales Construrama"
))

# Material Eléctrico
db.add(Material(
    nombre="Cable Calibre 12", 
    categoria="Eléctrico", 
    unidad="Rollo 100m", 
    cantidad=15, 
    ubicacion="Taller", 
    min_stock=5, 
    costo_unitario=850.00, 
    precio_venta=1200.00,
    proveedor="Condumex"
))

# 3. DISPOSITIVOS (Roles)
db.add(Dispositivo(nombre="Tablet Admin", codigo_acceso="999999", rol="ADMIN"))
db.add(Dispositivo(nombre="Tablet Taller", codigo_acceso="111111", rol="TALLER"))
db.add(Dispositivo(nombre="Tablet Recepción", codigo_acceso="777777", rol="EXHIBICION"))

db.commit()
db.close()
print("✅ ¡Listo! Sistema cargado con dinero y materiales.")