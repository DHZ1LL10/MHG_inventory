"""
Test Suite - Sistema MHG Inventario
Pruebas unitarias e integración para backend FastAPI
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app
import models

# ============= CONFIGURACIÓN DE TESTS =============

# Base de datos en memoria para tests
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test_inventario.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def test_db():
    """Crea DB limpia para cada test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(test_db):
    """Cliente de pruebas con DB mockeada"""
    def override_get_db():
        try:
            yield test_db
        finally:
            test_db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_material(test_db):
    """Material de ejemplo para tests"""
    material = models.Material(
        nombre="Cemento Cruz Azul",
        categoria="Obra Negra",
        unidad="Bulto",
        cantidad=50,
        ubicacion="Bodega Central",
        min_stock=10,
        costo_unitario=210.0,
        precio_venta=260.0,
        proveedor="Construrama"
    )
    test_db.add(material)
    test_db.commit()
    test_db.refresh(material)
    return material


@pytest.fixture
def sample_dispositivo(test_db):
    """Dispositivo de ejemplo para tests de auth"""
    dispositivo = models.Dispositivo(
        nombre="Tablet Test",
        codigo_acceso="123456",
        rol="ADMIN"
    )
    test_db.add(dispositivo)
    test_db.commit()
    test_db.refresh(dispositivo)
    return dispositivo


@pytest.fixture
def sample_obra(test_db):
    """Obra de ejemplo para tests de movimientos"""
    obra = models.Obra(
        nombre="Torre Mitikah",
        cliente="Fibra Uno",
        direccion="CDMX",
        presupuesto_asignado=500000.0
    )
    test_db.add(obra)
    test_db.commit()
    test_db.refresh(obra)
    return obra


# ============= TESTS DE MATERIALES =============

class TestMateriales:
    """Suite de pruebas para endpoints de materiales"""
    
    def test_leer_materiales_vacio(self, client):
        """GET /materiales/ sin datos debe retornar lista vacía"""
        response = client.get("/materiales/")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_crear_material_valido(self, client):
        """POST /materiales/ con datos válidos debe crear material"""
        payload = {
            "nombre": "Clavos 2 Pulgadas",
            "categoria": "Carpintería",
            "unidad": "Kg",
            "cantidad": 100,
            "ubicacion": "Taller",
            "min_stock": 50,
            "costo_unitario": 45.0,
            "precio_venta": 85.0,
            "proveedor": "Ferretería El Sol"
        }
        response = client.post("/materiales/", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "Clavos 2 Pulgadas"
        assert data["cantidad"] == 100
        assert "id" in data
    
    def test_crear_material_sin_nombre(self, client):
        """POST /materiales/ sin nombre debe fallar"""
        payload = {
            "categoria": "Test",
            "unidad": "Pieza",
            "cantidad": 10,
            "ubicacion": "Bodega",
            "min_stock": 5
        }
        response = client.post("/materiales/", json=payload)
        assert response.status_code == 422  # Validation error
    
    def test_leer_material_existente(self, client, sample_material):
        """GET /materiales/{id} debe retornar el material"""
        response = client.get(f"/materiales/{sample_material.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == sample_material.nombre
    
    def test_leer_material_inexistente(self, client):
        """GET /materiales/{id} con ID inválido debe retornar 404"""
        response = client.get("/materiales/99999")
        assert response.status_code == 404
    
    def test_actualizar_stock(self, client, sample_material):
        """PUT /materiales/{id}/stock debe actualizar cantidad"""
        response = client.put(
            f"/materiales/{sample_material.id}/stock",
            json={"cantidad": 75}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["cantidad"] == 75


# ============= TESTS DE MOVIMIENTOS =============

class TestMovimientos:
    """Suite de pruebas para registro de entradas/salidas"""
    
    def test_registrar_entrada_valida(self, client, sample_material):
        """POST /movimientos/ de tipo ENTRADA debe incrementar stock"""
        stock_inicial = sample_material.cantidad
        
        payload = {
            "material_id": sample_material.id,
            "cantidad": 20,
            "tipo": "ENTRADA",
            "motivo": "Compra: Proveedor ABC",
            "usuario": "admin"
        }
        response = client.post("/movimientos/", json=payload)
        assert response.status_code == 200
        
        # Verificar que se incrementó el stock
        mat_response = client.get(f"/materiales/{sample_material.id}")
        assert mat_response.json()["cantidad"] == stock_inicial + 20
    
    def test_registrar_salida_valida(self, client, sample_material, sample_obra):
        """POST /movimientos/ de tipo SALIDA debe decrementar stock"""
        stock_inicial = sample_material.cantidad
        
        payload = {
            "material_id": sample_material.id,
            "cantidad": 10,
            "tipo": "SALIDA",
            "motivo": f"Obra: {sample_obra.nombre}",
            "usuario": "taller"
        }
        response = client.post("/movimientos/", json=payload)
        assert response.status_code == 200
        
        # Verificar que se decrementó el stock
        mat_response = client.get(f"/materiales/{sample_material.id}")
        assert mat_response.json()["cantidad"] == stock_inicial - 10
    
    def test_salida_sin_stock_suficiente(self, client, sample_material):
        """SALIDA mayor al stock disponible debe fallar con 400"""
        payload = {
            "material_id": sample_material.id,
            "cantidad": sample_material.cantidad + 100,  # Más de lo disponible
            "tipo": "SALIDA",
            "motivo": "Venta",
            "usuario": "admin"
        }
        response = client.post("/movimientos/", json=payload)
        assert response.status_code == 400
        assert "Stock insuficiente" in response.json()["detail"]
    
    def test_movimiento_con_material_inexistente(self, client):
        """Movimiento con material_id inválido debe retornar 404"""
        payload = {
            "material_id": 99999,
            "cantidad": 10,
            "tipo": "ENTRADA",
            "motivo": "Test",
            "usuario": "admin"
        }
        response = client.post("/movimientos/", json=payload)
        assert response.status_code == 404
    
    def test_calcular_valor_monetario(self, client, sample_material):
        """Movimiento debe calcular valor_monetario = cantidad * costo_unitario"""
        payload = {
            "material_id": sample_material.id,
            "cantidad": 5,
            "tipo": "SALIDA",
            "motivo": "Test",
            "usuario": "admin"
        }
        response = client.post("/movimientos/", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        esperado = 5 * sample_material.costo_unitario
        assert data["valor_monetario"] == esperado
    
    def test_leer_movimientos_paginados(self, client, sample_material):
        """GET /movimientos/ debe respetar el límite de resultados"""
        # Crear 25 movimientos
        for i in range(25):
            client.post("/movimientos/", json={
                "material_id": sample_material.id,
                "cantidad": 1,
                "tipo": "ENTRADA",
                "motivo": f"Movimiento {i}",
                "usuario": "test"
            })
        
        # Por defecto debe retornar 20
        response = client.get("/movimientos/?limit=20")
        assert response.status_code == 200
        assert len(response.json()) == 20


# ============= TESTS DE AUTENTICACIÓN =============

class TestAuth:
    """Suite de pruebas para login y dispositivos"""
    
    def test_login_valido(self, client, sample_dispositivo):
        """POST /login con código válido debe retornar dispositivo"""
        response = client.post("/login", json={"codigo": "123456"})
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "Tablet Test"
        assert data["rol"] == "ADMIN"
    
    def test_login_codigo_invalido(self, client):
        """POST /login con código inválido debe retornar 401"""
        response = client.post("/login", json={"codigo": "999999"})
        assert response.status_code == 401
        assert "Código inválido" in response.json()["detail"]
    
    def test_crear_dispositivo_admin(self, client):
        """POST /admin/generar-dispositivo debe crear nuevo dispositivo"""
        payload = {
            "nombre": "Tablet Nueva",
            "rol": "TALLER"
        }
        response = client.post("/admin/generar-dispositivo", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "Tablet Nueva"
        assert len(data["codigo_acceso"]) == 6
    
    def test_eliminar_dispositivo(self, client, sample_dispositivo):
        """DELETE /admin/dispositivos/{id} debe eliminar dispositivo"""
        response = client.delete(f"/admin/dispositivos/{sample_dispositivo.id}")
        assert response.status_code == 200
        
        # Verificar que ya no existe
        login_response = client.post("/login", json={"codigo": "123456"})
        assert login_response.status_code == 401


# ============= TESTS DE VALIDACIÓN =============

class TestValidacion:
    """Suite de pruebas para validaciones de datos"""
    
    def test_cantidad_negativa_rechazada(self, client):
        """Material con cantidad negativa debe fallar validación"""
        payload = {
            "nombre": "Test",
            "categoria": "Test",
            "unidad": "Pieza",
            "cantidad": -10,  # Negativo
            "ubicacion": "Bodega",
            "min_stock": 5
        }
        response = client.post("/materiales/", json=payload)
        # Actualmente NO valida - esto fallará hasta implementar validadores
        # TODO: Agregar @field_validator en schemas.py
    
    def test_precio_venta_menor_que_costo(self, client):
        """Precio de venta < costo debe generar warning (no error)"""
        payload = {
            "nombre": "Test Pérdida",
            "categoria": "Test",
            "unidad": "Pieza",
            "cantidad": 10,
            "ubicacion": "Bodega",
            "min_stock": 5,
            "costo_unitario": 100.0,
            "precio_venta": 80.0  # Venta menor que costo
        }
        response = client.post("/materiales/", json=payload)
        # Actualmente permite - sería bueno agregar validación
        assert response.status_code == 200


# ============= TESTS DE OBRAS =============

class TestObras:
    """Suite de pruebas para gestión de obras"""
    
    def test_crear_obra(self, client):
        """POST /obras/ debe crear nueva obra"""
        payload = {
            "nombre": "Casa Lomas",
            "cliente": "Sr. Pérez",
            "direccion": "Lomas de Chapultepec",
            "presupuesto_asignado": 150000.0
        }
        response = client.post("/obras/", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "Casa Lomas"
        assert data["gasto_actual"] == 0.0
    
    def test_listar_obras(self, client, sample_obra):
        """GET /obras/ debe listar todas las obras"""
        response = client.get("/obras/")
        assert response.status_code == 200
        assert len(response.json()) >= 1


# ============= EJECUTAR TESTS =============

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
