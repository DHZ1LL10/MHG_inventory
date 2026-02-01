# Usamos una imagen ligera de Python oficial
FROM python:3.9-slim

# Evita que Python genere archivos .pyc y guarda logs en tiempo real
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los requisitos e instalamos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos todo el código del backend
COPY . .

# Exponemos el puerto 8000
EXPOSE 8000

# Comando para iniciar la app (ajustado para Docker)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]