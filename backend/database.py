from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 1. Obtener la URL desde Docker (o usar SQLite si fallara, por seguridad)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./inventario.db")

# 2. Configurar el motor según la base de datos
if "sqlite" in DATABASE_URL:
    # Configuración para SQLite (archivo local)
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Configuración para PostgreSQL (Producción) 🐘
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()