# ─────────────────────────────────────────────────────────────────────────────
# AathraOS  —  Junction Signal API
# Deployment target: Hugging Face Spaces (Docker SDK)
#
# HF Spaces assigns a random UID at runtime and mounts /data writable.
# The app MUST listen on port 7860.
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.10-slim

# ── System dependencies ───────────────────────────────────────────────────────
# libglib2.0-0  — required by OpenCV
# libgl1        — required by OpenCV headless on slim images
RUN apt-get update && apt-get install -y --no-install-recommends \
        libglib2.0-0 \
        libgl1 \
    && rm -rf /var/lib/apt/lists/*

# ── Working directory ─────────────────────────────────────────────────────────
WORKDIR /code

# ── Python dependencies ───────────────────────────────────────────────────────
# Copy requirements first for Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Application source ────────────────────────────────────────────────────────
COPY junction_api.py .
COPY yolov8n.pt .

# ── Writable directories ──────────────────────────────────────────────────────
# /tmp/Ultralytics  — YOLO config store (writable on HF Spaces)
# /code/data        — uploaded video feed temp storage
RUN mkdir -p /tmp/Ultralytics /code/data \
    && chmod -R 777 /tmp/Ultralytics /code/data

# ── Environment variables ─────────────────────────────────────────────────────
ENV YOLO_CONFIG_DIR="/tmp/Ultralytics" \
    YOLO_VERBOSE="False" \
    YOLO_UPDATE_CHECK="False" \
    YOLO_VERSION_CHECK="False" \
    ULTRALYTICS_ENV="True" \
    PORT=7860

# ── Port ──────────────────────────────────────────────────────────────────────
# HuggingFace Spaces requires port 7860
EXPOSE 7860

# ── Entrypoint ────────────────────────────────────────────────────────────────
CMD ["uvicorn", "junction_api:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
