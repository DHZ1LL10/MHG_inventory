"""
Script para importar datos reales del cliente desde Excel/CSV
"""
import pandas as pd
from database import SessionLocal
from models import Material
import sys
from datetime import datetime

def validar_columnas_requeridas(df):
    """Verifica que el Excel tenga las columnas mínimas necesarias"""
    requeridas = ['nombre', 'categoria', 'cantidad', 'ubicacion']
    faltantes = set(requeridas) - set(df.columns)
    
    if faltantes:
        raise ValueError(f"❌ Columnas faltantes en el archivo: {', '.join(faltantes)}")
    
    print(f"✅ Columnas requeridas presentes: {', '.join(requeridas)}")

def limpiar_datos(df):
    """Limpia y normaliza los datos antes de importar"""
    print("🧹 Limpiando datos...")
    
    # Eliminar filas vacías
    df = df.dropna(subset=['nombre'])
    
    # Quitar espacios en blanco
    for col in ['nombre', 'categoria', 'ubicacion', 'unidad']:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()
    
    # Convertir cantidad a entero (mancando decimales si existen)
    df['cantidad'] = df['cantidad'].fillna(0).astype(int)
    
    # Valores por defecto
    if 'unidad' not in df.columns:
        df['unidad'] = 'Pieza'
    
    if 'min_stock' not in df.columns:
        df['min_stock'] = 5
    
    if 'costo_unitario' not in df.columns:
        df['costo_unitario'] = 0.0
    
    if 'precio_venta' not in df.columns:
        df['precio_venta'] = 0.0
    
    if 'proveedor' not in df.columns:
        df['proveedor'] = 'Por definir'
    
    print(f"✅ {len(df)} registros válidos después de limpieza")
    return df

def importar_excel(ruta_archivo):
    """Importa materiales desde archivo Excel o CSV"""
    print("=" * 60)
    print(" 📥 IMPORTACIÓN DE DATOS DEL CLIENTE")
    print("=" * 60)
    print(f"📂 Archivo: {ruta_archivo}")
    
    # Detectar formato
    if ruta_archivo.endswith('.csv'):
        df = pd.read_csv(ruta_archivo)
    elif ruta_archivo.endswith(('.xlsx', '.xls')):
        df = pd.read_excel(ruta_archivo)
    else:
        raise ValueError("❌ Formato no soportado. Usa .xlsx, .xls o .csv")
    
    print(f"📊 {len(df)} filas detectadas en el archivo")
    
    # Validación
    validar_columnas_requeridas(df)
    df = limpiar_datos(df)
    
    # Importar a base de datos
    db = SessionLocal()
    importados = 0
    errores = 0
    
    try:
        print("\n🔄 Iniciando importación...")
        
        for idx, row in df.iterrows():
            try:
                material = Material(
                    nombre=row['nombre'],
                    categoria=row['categoria'],
                    unidad=row.get('unidad', 'Pieza'),
                    cantidad=int(row['cantidad']),
                    ubicacion=row['ubicacion'],
                    min_stock=int(row.get('min_stock', 5)),
                    costo_unitario=float(row.get('costo_unitario', 0.0)),
                    precio_venta=float(row.get('precio_venta', 0.0)),
                    proveedor=row.get('proveedor', 'Por definir'),
                    ultimo_abastecimiento=datetime.utcnow()
                )
                db.add(material)
                importados += 1
                
                if (importados % 50) == 0:
                    print(f"   ⏳ {importados} materiales procesados...")
                    
            except Exception as e:
                errores += 1
                print(f"   ⚠️  Error en fila {idx + 2}: {str(e)}")
        
        db.commit()
        print("\n" + "=" * 60)
        print(f"✅ IMPORTACIÓN COMPLETADA")
        print(f"   • Materiales importados: {importados}")
        print(f"   • Errores encontrados: {errores}")
        print("=" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ ERROR CRÍTICO: {str(e)}")
        print("⚠️  Se revirtieron todos los cambios")
        raise
    finally:
        db.close()

def generar_plantilla_excel(nombre_archivo="plantilla_inventario.xlsx"):
    """Genera un archivo Excel de plantilla con columnas correctas"""
    plantilla = pd.DataFrame({
        'nombre': ['Ejemplo: Cemento Cruz Azul 50kg'],
        'categoria': ['Obra Negra'],
        'unidad': ['Bulto'],
        'cantidad': [100],
        'ubicacion': ['Bodega Central'],
        'min_stock': [10],
        'costo_unitario': [210.00],
        'precio_venta': [260.00],
        'proveedor': ['Construrama']
    })
    
    plantilla.to_excel(nombre_archivo, index=False)
    print(f"✅ Plantilla generada: {nombre_archivo}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("=" * 60)
        print(" 🛠️  USO DEL SCRIPT DE IMPORTACIÓN")
        print("=" * 60)
        print("\n1️⃣  Generar plantilla:")
        print("   python import_cliente.py --plantilla")
        print("\n2️⃣  Importar datos:")
        print("   python import_cliente.py inventario_cliente.xlsx")
        print("\n" + "=" * 60)
        sys.exit(1)
    
    if sys.argv[1] == "--plantilla":
        generar_plantilla_excel()
    else:
        importar_excel(sys.argv[1])
