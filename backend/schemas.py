from pydantic import BaseModel

# Esquema para crear un material (lo que recibes)
class MaterialCreate(BaseModel):
    nombre: str
    categoria: str
    unidad: str
    cantidad: int
    ubicacion: str

# Esquema para leer un material (lo que respondes)
class MaterialResponse(MaterialCreate):
    id: int

    class Config:
        from_attributes = True # Antes 'orm_mode'

class ObraCreate(BaseModel):
    nombre: str
    cliente: str
    direccion: str
    presupuesto: int

class ObraResponse(ObraCreate):
    id: int
    class Config:
        from_attributes = True