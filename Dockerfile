FROM python:3.10-slim

WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copier le requirements depuis le sous-dossier
COPY ocr_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier tout le contenu du dossier ocr_service dans l'image
COPY ocr_service /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PORT 8080

CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app
