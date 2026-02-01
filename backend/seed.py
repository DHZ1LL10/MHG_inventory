from database import SessionLocal, engine, Base
from models import Material, Obra
from sqlalchemy.orm import Session

# Reiniciamos la base de datos para empezar limpio
print("🔄 Reiniciando base de datos...")
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db: Session = SessionLocal()

print("🌱 Sembrando datos...")

# 1. CREAR OBRAS
obras_data = [
    {"nombre": "Torre Mitikah", "cliente": "Fibra Uno", "direccion": "Av. Churubusco 601", "presupuesto": 1500000},
    {"nombre": "Residencial Bosques", "cliente": "Familia Hdz", "direccion": "Bosques de las Lomas", "presupuesto": 300000},
    {"nombre": "Plaza Andares", "cliente": "Grupo Sordo", "direccion": "Zapopan, Jalisco", "presupuesto": 800000},
]

for obra in obras_data:
    db_obra = Obra(**obra)
    db.add(db_obra)

print(f"✅ {len(obras_data)} Obras creadas.")

# 2. CREAR MATERIALES
materiales_data = [
    # Bodega Central
    {"nombre": "Cemento Gris Tolteca", "categoria": "Obra Negra", "unidad": "Bulto 50kg", "cantidad": 200, "ubicacion": "Bodega Central"},
    {"nombre": "Varilla Corrugada 3/8", "categoria": "Acero", "unidad": "Tonelada", "cantidad": 15, "ubicacion": "Bodega Central"},
    {"nombre": "Ladrillo Rojo Recocido", "categoria": "Muros", "unidad": "Millar", "cantidad": 5000, "ubicacion": "Bodega Central"},
    {"nombre": "Arena de Río", "categoria": "Áridos", "unidad": "m3", "cantidad": 12, "ubicacion": "Bodega Central"},
    {"nombre": "Casco de Seguridad", "categoria": "EPP", "unidad": "Pieza", "cantidad": 30, "ubicacion": "Bodega Central"},
    
    # Torre Mitikah
    {"nombre": "Cemento Gris Tolteca", "categoria": "Obra Negra", "unidad": "Bulto 50kg", "cantidad": 450, "ubicacion": "Torre Mitikah"},
    {"nombre": "Piso Porcelanato 60x60", "categoria": "Acabados", "unidad": "m2", "cantidad": 120, "ubicacion": "Torre Mitikah"},
    {"nombre": "Pintura Vinimex Blanca", "categoria": "Acabados", "unidad": "Cubeta 19L", "cantidad": 25, "ubicacion": "Torre Mitikah"},

    # Residencial Bosques
    {"nombre": "Impermeabilizante Rojo", "categoria": "Impermeabilización", "unidad": "Cubeta", "cantidad": 10, "ubicacion": "Residencial Bosques"},
    {"nombre": "Yeso Supremo", "categoria": "Acabados", "unidad": "Bulto", "cantidad": 40, "ubicacion": "Residencial Bosques"},
]

for mat in materiales_data:
    db_mat = Material(**mat)
    db.add(db_mat)

print(f"✅ {len(materiales_data)} Materiales creados.")

db.commit()
db.close()
print("🚀 ¡Base de datos lista para la demo!")