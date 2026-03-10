# AathraOS Junction Signal API — Backend
# =======================================
# HuggingFace Spaces deployment (Docker SDK)

## Overview
This is the Python backend for AathraOS, an AI-powered traffic signal management system.  
It runs a 4-lane junction intelligence engine using YOLOv8 for real-time vehicle detection,  
PCU-based signal timing, and automated emergency green corridor activation.

## Files
| File | Purpose |
|---|---|
| `junction_api.py` | Main FastAPI application — all junction logic |
| `yolov8n.pt` | YOLOv8n model weights |
| `Dockerfile` | HuggingFace Spaces container definition |
| `requirements.txt` | Python dependencies |

## API Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/junction/status` | Full junction state (signals, PCU, emergency) |
| POST | `/junction/upload/{lane}` | Upload MP4 video feed for a lane |
| POST | `/junction/stop/{lane}` | Stop a lane's feed |
| WebSocket | `/ws/junction` | Real-time stream (frames + signal states) |

## Local Development
```bash
uvicorn junction_api:app --host 0.0.0.0 --port 8001 --reload
```

## HuggingFace Deployment
Push this directory as a HuggingFace Space using the Docker SDK.  
The container listens on port **7860** (HF Spaces default).

Environment variables set automatically by Dockerfile:
- `YOLO_CONFIG_DIR=/tmp/Ultralytics`  
- `YOLO_VERBOSE=False`
- `PORT=7860`

## Signal Control Logic
- **PCU Weights**: motorcycle/bike=0.5, car=1.0, auto=1.2, bus/truck=3.0
- **Green Time Formula**: `green_time = clamp(10 + PCU × 0.8, 8s, 60s)`
- **Emergency Corridor**: When ambulance/fire truck detected → target lane GREEN, all others RED for 30s
- **Cycle Interval**: Signal engine re-evaluates every 5 seconds
