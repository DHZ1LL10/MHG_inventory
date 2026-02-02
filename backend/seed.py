from database import SessionLocal, engine, Base
from models import Material, Obra, Dispositivo
from sqlalchemy.orm import Session

print("🔄 Reiniciando base de datos...")
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db: Session = SessionLocal()

print("🌱 Sembrando inventario inicial...")

# 1. CREAR DESTINOS (Solo para tener opciones en la lista)
destinos = [
    {"nombre": "Torre Mitikah", "cliente": "Fibra Uno", "direccion": "CDMX", "activa": 1},
    {"nombre": "Casa Lomas", "cliente": "Sr. Pérez", "direccion": "Lomas", "activa": 1},
    {"nombre": "Venta de Mostrador", "cliente": "Público", "direccion": "Taller", "activa": 1},
]
for d in destinos:
    db.add(Obra(**d))

# 2. INVENTARIO BODEGA Y TALLER (Lo único que importa)
inventario = [
    {"nombre": "Cemento Gris", "categoria": "Obra Negra", "unidad": "Bulto", "cantidad": 500, "ubicacion": "Bodega Central"},
    {"nombre": "Varilla 3/8", "categoria": "Aceros", "unidad": "Tonelada", "cantidad": 10, "ubicacion": "Bodega Central"},
    {"nombre": "Sierra Circular", "categoria": "Herramienta", "unidad": "Pieza", "cantidad": 3, "ubicacion": "Taller"},
    {"nombre": "Barniz Caoba", "categoria": "Carpintería", "unidad": "Litro", "cantidad": 20, "ubicacion": "Taller"},
]
for i in inventario:
    db.add(Material(**i))

db.commit()
db.close()
print("✅ ¡Listo! Sistema preparado para el Taller.")