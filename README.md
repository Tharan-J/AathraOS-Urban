# AathraOS — AI Traffic Signal Management System

> **AI-powered 4-way junction intelligence** using computer vision, PCU-based signal optimization, and automated emergency green corridor activation.

---

## System Overview

AathraOS is a real-time urban traffic management platform designed for city traffic engineers and municipal authorities. It uses YOLOv8 computer vision to detect vehicles from road cameras, computes Passenger Car Unit (PCU) density per lane, and dynamically adjusts traffic signal timings. When an emergency vehicle is detected, the system automatically activates a Green Corridor — clearing all conflicting signals.

---

## Architecture

```
aathraos/
├── src/                          # Next.js 16 frontend
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout + metadata
│   │   ├── globals.css           # Global design system
│   │   ├── api/
│   │   │   ├── chatbot/          # Gemini AI assistant endpoint
│   │   │   └── event-insights/   # Gemini event simulation endpoint
│   │   └── dashboard/
│   │       ├── page.tsx          # Traffic Command Center
│   │       ├── signals/          # Traffic Signal Control Dashboard
│   │       ├── analytics/        # Audit & Infrastructure Analytics
│   │       ├── events/           # Event Simulation & Planning
│   │       ├── assistant/        # AI Traffic Assistant (Gemini)
│   │       └── settings/         # System settings
│   └── components/
│       ├── dashboard/
│       │   ├── Sidebar.tsx       # Navigation sidebar
│       │   └── TopBar.tsx        # Top status bar
│       └── signals/
│           └── TrafficSignalDashboard.tsx  # Core signal UI
│
├── traffic_crowd_prediction/     # Python FastAPI backend
│   ├── junction_api.py           # Main API — all junction logic
│   ├── yolov8n.pt                # YOLOv8n model weights
│   ├── Dockerfile                # HuggingFace Spaces deployment
│   ├── requirements.txt          # Python dependencies
│   └── data/                    # Uploaded video feeds (git-ignored)
│
├── .env.local                   # Local environment variables (not committed)
├── next.config.ts               # Next.js config + junction API proxy
└── package.json                 # Frontend dependencies
```

---

## Modules

| Module | Route | Description |
|---|---|---|
| **Traffic Command Center** | `/dashboard` | Live signal states, PCU stats, system overview |
| **Traffic Signals** | `/dashboard/signals` | 4-camera upload, real-time signal control, demo mode |
| **Audit & Analytics** | `/dashboard/analytics` | Hourly charts, PCU distribution, signal performance, CSV export |
| **Event Simulation** | `/dashboard/events` | Gemini-powered event impact analysis for city events |
| **AI Assistant** | `/dashboard/assistant` | Gemini chatbot with live junction context |
| **Settings** | `/dashboard/settings` | System configuration |

---

## Signal Control Logic

| Parameter | Value |
|---|---|
| PCU weights | bike=0.5, car=1.0, auto=1.2, bus/truck=3.0 |
| Green time formula | `clamp(10 + PCU × 0.8, 8s, 60s)` |
| Signal cycle interval | 5 seconds |
| Emergency hold duration | 30 seconds |
| Inference resolution | 320 × 192 @ 6 FPS per lane |
| YOLO model | YOLOv8n |

**Emergency Green Corridor**: When YOLO detects `ambulance` or `fire truck` in any lane, that lane receives GREEN and all others switch to RED immediately. The corridor is held for 30 seconds after detection.

---

## Local Development

### Frontend
```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev
```

### Backend
```bash
cd traffic_crowd_prediction

# Install Python dependencies
pip install -r requirements.txt

# Start junction API (http://localhost:8001)
uvicorn junction_api:app --host 0.0.0.0 --port 8001 --reload
```

### Environment Variables (`.env.local`)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
JUNCTION_API_URL=http://localhost:8001   # or HuggingFace Space URL in production
```

---

## Production Deployment

### Backend → HuggingFace Spaces (Docker)
1. Create a new HuggingFace Space with SDK: **Docker**
2. Push the `traffic_crowd_prediction/` directory as the Space repository
3. HuggingFace will build and run the Dockerfile automatically
4. The API will be available at `https://your-username-your-space.hf.space`

### Frontend → Vercel / any Node host
1. Set environment variables:
   - `GEMINI_API_KEY` — your Gemini API key
   - `JUNCTION_API_URL` — your HuggingFace backend URL
2. Deploy with `npm run build && npm start`

---

## API Reference

### Backend (`junction_api.py`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/junction/status` | Full junction state (signals, PCU, lanes, emergency) |
| `POST` | `/junction/upload/{lane}` | Upload MP4 video feed (north/south/east/west) |
| `POST` | `/junction/stop/{lane}` | Stop a specific lane's feed |
| `WS` | `/ws/junction` | WebSocket — real-time frames + signal state |

### Frontend API Routes (Next.js)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chatbot` | Gemini AI traffic assistant chat |
| `POST` | `/api/event-insights` | Gemini event traffic impact analysis |

---

## Technology Stack

**Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide React  
**AI**: Google Gemini 2.5 Flash (`@google/genai`)  
**Backend**: FastAPI, Uvicorn, Python 3.10  
**Computer Vision**: YOLOv8n (Ultralytics), OpenCV  
**Deployment**: Vercel (frontend) + HuggingFace Spaces Docker (backend)
