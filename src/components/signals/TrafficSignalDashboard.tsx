"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ────────────────────────────────────────────────────────────────────
type SignalColor = "RED" | "YELLOW" | "GREEN";
type LaneName = "north" | "south" | "east" | "west";

interface LaneData {
  vehicle_count: number;
  pcu_score: number;
  breakdown: Record<string, number>;
  emergency_detected: boolean;
  is_processing: boolean;
  fps: number;         // infer fps
  display_fps?: number; // reader capture fps
  frame_b64?: string | null; // piggybacked from WS
}

interface JunctionStatus {
  signals: Record<LaneName, SignalColor>;
  active_lane: LaneName | null;
  emergency_mode: boolean;
  emergency_lane: LaneName | null;
  green_duration: number;
  cycle_count: number;
  last_update: string;
  lanes: Record<LaneName, LaneData>;
}

const LANES: LaneName[] = ["north", "south", "east", "west"];
const BACKEND = process.env.NEXT_PUBLIC_JUNCTION_API_URL ?? "http://localhost:8001";
const WS_URL  = BACKEND.replace(/^http/, "ws") + "/ws/junction";

const LANE_ICONS: Record<LaneName, string> = {
  north: "↑",
  south: "↓",
  east:  "→",
  west:  "←",
};

const PCU_CLASS_COLOR: Record<string, string> = {
  car:        "#06d6f2",
  truck:      "#f59e0b",
  bus:        "#a78bfa",
  motorcycle: "#34d399",
  bicycle:    "#22d3ee",
  person:     "#f87171",
};

// ── Signal Light Component ───────────────────────────────────────────────────
function SignalLight({ lane, color, emergency, active }: {
  lane: LaneName;
  color: SignalColor;
  emergency: boolean;
  active: boolean;
}) {
  const colors = {
    RED:    { on: "#ef4444", glow: "rgba(239,68,68,0.5)",   off: "#3f1f1f" },
    YELLOW: { on: "#f59e0b", glow: "rgba(245,158,11,0.5)",  off: "#3f2e0a" },
    GREEN:  { on: "#22c55e", glow: "rgba(34,197,94,0.5)",   off: "#0f2a12" },
  };

  const c = colors[color];
  const isGreen = color === "GREEN";

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-1">
        {LANE_ICONS[lane]} {lane}
      </span>
      {/* Housing */}
      <div
        style={{
          background: "linear-gradient(180deg, #1c1c28 0%, #12121a 100%)",
          border: emergency ? "1px solid rgba(239,68,68,0.6)" : "1px solid rgba(255,255,255,0.07)",
          borderRadius: "12px",
          padding: "10px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          boxShadow: emergency ? "0 0 20px rgba(239,68,68,0.3)" : "none",
          position: "relative",
        }}
      >
        {(["RED", "YELLOW", "GREEN"] as SignalColor[]).map((c2) => {
          const lit = c2 === color;
          const ch = colors[c2];
          return (
            <motion.div
              key={c2}
              animate={lit ? { opacity: [0.85, 1, 0.85], scale: [1, 1.04, 1] } : {}}
              transition={lit ? { duration: 1.5, repeat: Infinity } : {}}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: lit ? ch.on : ch.off,
                boxShadow: lit ? `0 0 18px ${ch.glow}, 0 0 40px ${ch.glow}` : "none",
              }}
            />
          );
        })}
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: emergency ? "#ef4444" : "#22c55e",
              boxShadow: `0 0 10px ${emergency ? "#ef4444" : "#22c55e"}`,
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── PCU Bar Chart ────────────────────────────────────────────────────────────
function PCUBar({ lane, pcu, maxPcu, active }: {
  lane: LaneName;
  pcu: number;
  maxPcu: number;
  active: boolean;
}) {
  const pct = maxPcu > 0 ? (pcu / maxPcu) * 100 : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-xs uppercase tracking-wider text-gray-400 font-mono">
          {LANE_ICONS[lane]} {lane}
        </span>
        <span className={`text-xs font-mono font-bold ${active ? "text-green-400" : "text-gray-300"}`}>
          {pcu.toFixed(1)} PCU
        </span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 8, overflow: "hidden" }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{
            height: "100%",
            borderRadius: 4,
            background: active
              ? "linear-gradient(90deg, #22c55e, #06d6f2)"
              : "linear-gradient(90deg, #334155, #475569)",
            boxShadow: active ? "0 0 8px rgba(34,197,94,0.4)" : "none",
          }}
        />
      </div>
    </div>
  );
}

// ── Camera Feed Card ─────────────────────────────────────────────────────────
function CameraCard({
  lane,
  data,
  frame,
  signal,
  onUpload,
  uploading,
}: {
  lane: LaneName;
  data: LaneData;
  frame: string | null;
  signal: SignalColor;
  onUpload: (lane: LaneName, file: File) => void;
  uploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const signalColors = { RED: "#ef4444", YELLOW: "#f59e0b", GREEN: "#22c55e" };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(18,18,26,0.9) 0%, rgba(26,26,38,0.6) 100%)",
        border: data.emergency_detected
          ? "1px solid rgba(239,68,68,0.5)"
          : `1px solid rgba(255,255,255,0.06)`,
        borderRadius: 12,
        overflow: "hidden",
        backdropFilter: "blur(20px)",
        boxShadow: data.emergency_detected
          ? "0 0 30px rgba(239,68,68,0.2)"
          : data.is_processing
          ? "0 0 20px rgba(6,214,242,0.07)"
          : "none",
        transition: "all 0.4s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: signalColors[signal],
              boxShadow: `0 0 8px ${signalColors[signal]}`,
              display: "inline-block",
            }}
          />
          <span className="text-sm font-semibold text-white uppercase tracking-wider">
            {LANE_ICONS[lane]} {lane}
          </span>
          {data.emergency_detected && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-xs font-bold text-red-400 ml-2"
            >
              🚨 EMERGENCY
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
          {data.is_processing && (
            <span className="text-cyan-400" title="infer fps / capture fps">
              {data.fps}↑ {data.display_fps ? `${data.display_fps}↓` : ""}
            </span>
          )}
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: data.is_processing ? "#22c55e" : "#475569",
              boxShadow: data.is_processing ? "0 0 6px #22c55e" : "none",
            }}
          />
        </div>
      </div>

      {/* Video area */}
      <div style={{ aspectRatio: "16/9", background: "#080810", position: "relative", overflow: "hidden" }}>
        {frame ? (
          <img
            src={`data:image/jpeg;base64,${frame}`}
            alt={`${lane} camera`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div style={{ opacity: 0.3 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(6,214,242,0.6)" strokeWidth="1.5">
                <path d="M15 10l4.553-2.274A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            {!uploading ? (
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  background: "rgba(6,214,242,0.1)",
                  border: "1px solid rgba(6,214,242,0.3)",
                  borderRadius: 8,
                  padding: "6px 16px",
                  color: "#06d6f2",
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(6,214,242,0.2)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "rgba(6,214,242,0.1)")}
              >
                Upload Feed
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #06d6f2", borderTopColor: "transparent" }}
                />
                <span className="text-xs text-cyan-400">Processing…</span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(lane, f);
                e.target.value = "";
              }}
            />
          </div>
        )}
        {/* Overlay HUD */}
        {frame && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: 8, left: 8, fontSize: 11, fontFamily: "monospace", color: "rgba(6,214,242,0.8)" }}>
              CAM_{lane.toUpperCase()} ● LIVE
            </div>
            <div style={{ position: "absolute", bottom: 8, left: 8, fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.7)" }}>
              {data.vehicle_count} VEH | {data.pcu_score.toFixed(1)} PCU
            </div>
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div style={{ padding: "10px 14px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div className="text-xs text-gray-500 mb-0.5">Vehicles</div>
          <div className="text-sm font-bold text-white font-mono">{data.vehicle_count}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-0.5">PCU Load</div>
          <div className="text-sm font-bold font-mono" style={{ color: "#06d6f2" }}>{data.pcu_score.toFixed(1)}</div>
        </div>
        {Object.entries(data.breakdown).slice(0, 3).map(([cls, cnt]) => (
          <div key={cls}>
            <div className="text-xs text-gray-500 mb-0.5 capitalize">{cls}</div>
            <div className="text-sm font-bold text-white font-mono">{cnt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Junction Diagram ─────────────────────────────────────────────────────────
function JunctionDiagram({ signals, emergency_mode, active_lane, emergency_lane }: {
  signals: Record<LaneName, SignalColor>;
  emergency_mode: boolean;
  active_lane: LaneName | null;
  emergency_lane: LaneName | null;
}) {
  const signalDot = (lane: LaneName) => {
    const color = signals[lane];
    const colors = { RED: "#ef4444", YELLOW: "#f59e0b", GREEN: "#22c55e" };
    return colors[color];
  };

  return (
    <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto" }}>
      {/* Road lines */}
      {/* Vertical road */}
      <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 48, transform: "translateX(-50%)", background: "rgba(30,30,46,0.9)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "repeating-linear-gradient(to bottom, rgba(255,255,180,0.3) 0px, rgba(255,255,180,0.3) 8px, transparent 8px, transparent 18px)" }} />
      </div>
      {/* Horizontal road */}
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 48, transform: "translateY(-50%)", background: "rgba(30,30,46,0.9)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "repeating-linear-gradient(to right, rgba(255,255,180,0.3) 0px, rgba(255,255,180,0.3) 8px, transparent 8px, transparent 18px)" }} />
      </div>
      {/* Center box */}
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 48, height: 48, transform: "translate(-50%,-50%)", background: "rgba(26,26,40,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2 }}>
        {/* AOS logo */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#06d6f2", letterSpacing: 0.5 }}>
          AOS
        </div>
      </div>

      {/* Signal dots */}
      {/* North */}
      <motion.div animate={{ scale: signals.north === "GREEN" ? [1, 1.3, 1] : 1 }} transition={{ duration: 1, repeat: Infinity }}
        style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 14, height: 14, borderRadius: "50%", background: signalDot("north"), boxShadow: `0 0 12px ${signalDot("north")}` }} />
      {/* South */}
      <motion.div animate={{ scale: signals.south === "GREEN" ? [1, 1.3, 1] : 1 }} transition={{ duration: 1, repeat: Infinity }}
        style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", width: 14, height: 14, borderRadius: "50%", background: signalDot("south"), boxShadow: `0 0 12px ${signalDot("south")}` }} />
      {/* West */}
      <motion.div animate={{ scale: signals.west === "GREEN" ? [1, 1.3, 1] : 1 }} transition={{ duration: 1, repeat: Infinity }}
        style={{ position: "absolute", top: "50%", left: 8, transform: "translateY(-50%)", width: 14, height: 14, borderRadius: "50%", background: signalDot("west"), boxShadow: `0 0 12px ${signalDot("west")}` }} />
      {/* East */}
      <motion.div animate={{ scale: signals.east === "GREEN" ? [1, 1.3, 1] : 1 }} transition={{ duration: 1, repeat: Infinity }}
        style={{ position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)", width: 14, height: 14, borderRadius: "50%", background: signalDot("east"), boxShadow: `0 0 12px ${signalDot("east")}` }} />

      {/* Emergency corridor lines */}
      {emergency_mode && emergency_lane && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{
            position: "absolute",
            inset: 0,
            border: "2px solid rgba(239,68,68,0.5)",
            borderRadius: 4,
            boxShadow: "inset 0 0 30px rgba(239,68,68,0.1)",
          }}
        />
      )}
    </div>
  );
}

// ── Timer countdown ──────────────────────────────────────────────────────────
function GreenTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setRemaining(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemaining((r) => (r <= 0 ? 0 : +(r - 0.1).toFixed(1)));
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [seconds]);

  const pct = seconds > 0 ? (remaining / seconds) * 100 : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="flex justify-between text-xs text-gray-400 font-mono">
        <span>Green Timer</span>
        <span className="text-green-400 font-bold">{remaining.toFixed(1)}s</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 6 }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          style={{
            height: "100%",
            borderRadius: 4,
            background: "linear-gradient(90deg, #22c55e, #06d6f2)",
            boxShadow: "0 0 8px rgba(34,197,94,0.5)",
          }}
        />
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export function TrafficSignalDashboard() {
  const [status, setStatus] = useState<JunctionStatus | null>(null);
  // Frames are now delivered via WebSocket — no separate REST poll needed
  const [frames, setFrames] = useState<Record<LaneName, string | null>>({
    north: null, south: null, east: null, west: null,
  });
  const [uploading, setUploading] = useState<Record<LaneName, boolean>>({
    north: false, south: false, east: false, west: false,
  });
  const [connected, setConnected] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((msg: string) => {
    setEventLog((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 49),
    ]);
  }, []);

  // Poll status (fallback when WS not connected)
  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/junction/status`);
      if (res.ok) {
        const data: JunctionStatus = await res.json();
        setStatus(data);
        setBackendError(false);
      } else {
        setBackendError(true);
      }
    } catch {
      setBackendError(true);
    }
  }, []);

  // WebSocket — frames are piggybacked in the same message, no extra REST poll
  useEffect(() => {
    let ws: WebSocket;
    let retryTimeout: NodeJS.Timeout;

    function connect() {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setBackendError(false);
        addLog("WebSocket connected — frames streaming via WS");
      };
      ws.onmessage = (e) => {
        try {
          const data: JunctionStatus = JSON.parse(e.data);

          // Extract frames piggybacked in lane data
          const newFrames: Record<LaneName, string | null> = {
            north: null, south: null, east: null, west: null,
          };
          for (const ln of ["north", "south", "east", "west"] as LaneName[]) {
            const f = data.lanes?.[ln]?.frame_b64;
            newFrames[ln] = f ?? null;
          }
          setFrames(newFrames);

          setStatus((prev) => {
            if (prev && data.emergency_mode && !prev.emergency_mode) {
              addLog(`🚨 EMERGENCY: Green corridor for ${data.emergency_lane?.toUpperCase()}`);
            }
            if (prev && data.active_lane !== prev.active_lane && data.active_lane) {
              addLog(`Signal switched → ${data.active_lane?.toUpperCase()} GREEN (${data.green_duration}s)`);
            }
            return data;
          });
        } catch { }
      };
      ws.onerror = () => setBackendError(true);
      ws.onclose = () => {
        setConnected(false);
        retryTimeout = setTimeout(connect, 3000);
      };
    }
    connect();

    // Lightweight fallback status poll (no frames) when WS drops
    pollRef.current = setInterval(pollStatus, 6000);

    return () => {
      ws?.close();
      clearTimeout(retryTimeout);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [addLog, pollStatus]);

  const handleUpload = useCallback(async (lane: LaneName, file: File) => {
    setUploading((p) => ({ ...p, [lane]: true }));
    addLog(`Uploading ${file.name} for ${lane.toUpperCase()} lane…`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${BACKEND}/junction/upload/${lane}`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        addLog(`✅ ${lane.toUpperCase()} feed active — CV pipeline running`);
      } else {
        addLog(`❌ Upload failed for ${lane}: ${res.statusText}`);
      }
    } catch (err) {
      addLog(`❌ Cannot reach backend at ${BACKEND} — check HuggingFace Space status`);
      setBackendError(true);
    } finally {
      setUploading((p) => ({ ...p, [lane]: false }));
    }
  }, [addLog]);

  // Demo mode: if no backend, simulate data
  const [demoMode, setDemoMode] = useState(false);
  const [demoStatus, setDemoStatus] = useState<JunctionStatus>(() => ({
    signals: { north: "GREEN", south: "RED", east: "RED", west: "RED" },
    active_lane: "north",
    emergency_mode: false,
    emergency_lane: null,
    green_duration: 28,
    cycle_count: 0,
    last_update: new Date().toISOString(),
    lanes: {
      north: { vehicle_count: 14, pcu_score: 22.5, breakdown: { car: 10, truck: 2, motorcycle: 2 }, emergency_detected: false, is_processing: true, fps: 8 },
      south: { vehicle_count: 7, pcu_score: 11.0, breakdown: { car: 5, bus: 1, motorcycle: 1 }, emergency_detected: false, is_processing: true, fps: 8 },
      east:  { vehicle_count: 20, pcu_score: 31.5, breakdown: { car: 14, truck: 3, bus: 1, motorcycle: 2 }, emergency_detected: false, is_processing: true, fps: 8 },
      west:  { vehicle_count: 4, pcu_score: 5.0, breakdown: { car: 3, bicycle: 2 }, emergency_detected: false, is_processing: true, fps: 8 },
    },
  }));

  useEffect(() => {
    if (!demoMode) return;
    const cycleMap: LaneName[] = ["north", "east", "south", "west"];
    let idx = 0;
    const t = setInterval(() => {
      idx = (idx + 1) % 4;
      const active = cycleMap[idx];
      const pcu = { north: 22.5, south: 11, east: 31.5, west: 5 };
      const sigs: Record<LaneName, SignalColor> = { north: "RED", south: "RED", east: "RED", west: "RED" };
      sigs[active] = "GREEN";
      const newStatus: JunctionStatus = {
        signals: sigs,
        active_lane: active,
        emergency_mode: idx === 2 && Math.random() > 0.7,
        emergency_lane: idx === 2 && Math.random() > 0.7 ? "south" : null,
        green_duration: Math.max(8, pcu[active] * 0.8 + 10),
        cycle_count: demoStatus.cycle_count + 1,
        last_update: new Date().toISOString(),
        lanes: demoStatus.lanes,
      };
      setDemoStatus(newStatus);
      addLog(`[DEMO] Signal → ${active.toUpperCase()} GREEN (${newStatus.green_duration.toFixed(1)}s)`);
    }, 5000);
    return () => clearInterval(t);
  }, [demoMode, addLog, demoStatus.cycle_count, demoStatus.lanes]);

  const displayStatus = demoMode ? demoStatus : status;
  const maxPcu = displayStatus
    ? Math.max(...LANES.map((l) => displayStatus.lanes[l]?.pcu_score ?? 0), 1)
    : 1;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #08080f 0%, #0c0c18 50%, #08080f 100%)",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Grid bg */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(6,214,242,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(6,214,242,0.015) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

      {/* Emergency overlay */}
      <AnimatePresence>
        {displayStatus?.emergency_mode && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50,
              background: "linear-gradient(180deg, rgba(239,68,68,0.06) 0%, transparent 30%)",
              border: "1px solid rgba(239,68,68,0.1)",
            }}
          />
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#06d6f2", boxShadow: "0 0 10px #06d6f2" }} />
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "#06d6f2", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                AathraOS · Junction Intelligence
              </span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -0.5, lineHeight: 1 }}>
              Traffic Signal{" "}
              <span style={{ background: "linear-gradient(135deg, #06d6f2, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Control Center
              </span>
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
              Real-time AI-driven 4-way junction optimization with emergency vehicle prioritization
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Backend status */}
            <div style={{
              background: connected ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${connected ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
              borderRadius: 8,
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: connected ? "#22c55e" : "#ef4444",
              fontFamily: "monospace",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "#22c55e" : "#ef4444", boxShadow: connected ? "0 0 6px #22c55e" : "none" }} />
              {connected ? "LIVE" : "OFFLINE"}
            </div>

            {/* Demo toggle */}
            <button
              onClick={() => {
                setDemoMode((d) => !d);
                addLog(demoMode ? "Switched to Live mode" : "Demo mode activated");
              }}
              style={{
                background: demoMode ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.05)",
                border: demoMode ? "1px solid rgba(167,139,250,0.4)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "6px 14px",
                color: demoMode ? "#a78bfa" : "#9ca3af",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "monospace",
                transition: "all 0.2s",
              }}
            >
              {demoMode ? "● DEMO" : "DEMO MODE"}
            </button>

            {displayStatus && (
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                fontFamily: "monospace",
                color: "#6b7280",
              }}>
                Cycle #{displayStatus.cycle_count}
              </div>
            )}
          </div>
        </div>

        {/* Emergency Alert Banner */}
        <AnimatePresence>
          {displayStatus?.emergency_mode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{
                background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: 10,
                padding: "14px 20px",
                marginBottom: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div className="flex items-center gap-3">
                <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
                  <span style={{ fontSize: 22 }}>🚨</span>
                </motion.div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444", letterSpacing: "0.05em" }}>
                    EMERGENCY GREEN CORRIDOR ACTIVATED
                  </div>
                  <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 2 }}>
                    All signals cleared for {displayStatus.emergency_lane?.toUpperCase()} lane — Emergency vehicle in transit
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "monospace", color: "#ef4444" }}>
                {displayStatus.emergency_lane?.toUpperCase()} ●
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
          {/* Left: Camera feeds */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Camera grid 2x2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {LANES.map((lane) => (
                <CameraCard
                  key={lane}
                  lane={lane}
                  data={displayStatus?.lanes[lane] ?? { vehicle_count: 0, pcu_score: 0, breakdown: {}, emergency_detected: false, is_processing: false, fps: 0 }}
                  frame={frames[lane]}
                  signal={displayStatus?.signals[lane] ?? "RED"}
                  onUpload={handleUpload}
                  uploading={uploading[lane]}
                />
              ))}
            </div>

            {/* PCU Density Panel */}
            <div style={{
              background: "linear-gradient(135deg, rgba(18,18,26,0.9), rgba(26,26,38,0.6))",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "16px 20px",
              backdropFilter: "blur(20px)",
            }}>
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#06d6f2", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  PCU Traffic Density
                </span>
                <span style={{ fontSize: 11, color: "#4b5563", marginLeft: 8 }}>Passenger Car Units · weighted load score</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {LANES.map((lane) => (
                  <PCUBar
                    key={lane}
                    lane={lane}
                    pcu={displayStatus?.lanes[lane]?.pcu_score ?? 0}
                    maxPcu={maxPcu}
                    active={displayStatus?.active_lane === lane}
                  />
                ))}
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[{ label: "bike/motorcycle", val: "0.5 PCU" }, { label: "car", val: "1.0 PCU" }, { label: "auto/rickshaw", val: "1.2 PCU" }, { label: "bus/truck", val: "3.0 PCU" }].map((item) => (
                  <div key={item.label} style={{ fontSize: 11, color: "#6b7280" }}>
                    <span style={{ color: "#9ca3af" }}>{item.label}</span>
                    <span style={{ color: "#06d6f2", marginLeft: 6, fontFamily: "monospace" }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Control Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Signal Lights */}
            <div style={{
              background: "linear-gradient(135deg, rgba(18,18,26,0.95), rgba(26,26,38,0.7))",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "16px 20px",
              backdropFilter: "blur(20px)",
            }}>
              <div style={{ marginBottom: 16, fontSize: 11, fontFamily: "monospace", color: "#06d6f2", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Signal States
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {LANES.map((lane) => (
                  <SignalLight
                    key={lane}
                    lane={lane}
                    color={displayStatus?.signals[lane] ?? "RED"}
                    emergency={displayStatus?.emergency_mode === true && displayStatus.emergency_lane === lane}
                    active={displayStatus?.active_lane === lane}
                  />
                ))}
              </div>
              {displayStatus?.active_lane && (
                <div style={{ marginTop: 16 }}>
                  <GreenTimer seconds={displayStatus.green_duration} />
                </div>
              )}
            </div>

            {/* Junction Diagram */}
            <div style={{
              background: "linear-gradient(135deg, rgba(18,18,26,0.95), rgba(26,26,38,0.7))",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "16px 20px",
              backdropFilter: "blur(20px)",
            }}>
              <div style={{ marginBottom: 12, fontSize: 11, fontFamily: "monospace", color: "#06d6f2", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Junction Overview
              </div>
              <JunctionDiagram
                signals={displayStatus?.signals ?? { north: "RED", south: "RED", east: "RED", west: "RED" }}
                emergency_mode={displayStatus?.emergency_mode ?? false}
                active_lane={displayStatus?.active_lane ?? null}
                emergency_lane={displayStatus?.emergency_lane ?? null}
              />
              {displayStatus?.active_lane && (
                <div style={{ marginTop: 12, textAlign: "center" }}>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>Active: </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e", fontFamily: "monospace", textTransform: "uppercase" }}>
                    {displayStatus.active_lane}
                  </span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}> → {displayStatus.green_duration}s green</span>
                </div>
              )}
            </div>

            {/* Decision Logic */}
            <div style={{
              background: "linear-gradient(135deg, rgba(18,18,26,0.95), rgba(26,26,38,0.7))",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "16px 20px",
              backdropFilter: "blur(20px)",
            }}>
              <div style={{ marginBottom: 12, fontSize: 11, fontFamily: "monospace", color: "#a78bfa", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                AI Decision Engine
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>
                  green_time = base + (PCU × factor)
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>
                  base = 10s · factor = 0.8
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "4px 0" }} />
                {displayStatus && LANES.map((lane) => {
                  const pcu = displayStatus.lanes[lane]?.pcu_score ?? 0;
                  const gt = Math.max(8, Math.min(60, 10 + pcu * 0.8));
                  return (
                    <div key={lane} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "monospace" }}>
                      <span style={{ color: "#6b7280", textTransform: "uppercase" }}>{LANE_ICONS[lane]} {lane}</span>
                      <span style={{ color: displayStatus.active_lane === lane ? "#22c55e" : "#475569" }}>
                        {pcu.toFixed(1)} PCU → {gt.toFixed(0)}s
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event Log */}
            <div style={{
              background: "linear-gradient(135deg, rgba(18,18,26,0.95), rgba(26,26,38,0.7))",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "16px 20px",
              backdropFilter: "blur(20px)",
              maxHeight: 220,
              overflow: "hidden",
            }}>
              <div style={{ marginBottom: 10, fontSize: 11, fontFamily: "monospace", color: "#f59e0b", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Event Log
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 170, overflowY: "auto" }}>
                {eventLog.length === 0 ? (
                  <div style={{ fontSize: 11, color: "#4b5563", fontFamily: "monospace" }}>Waiting for events…</div>
                ) : (
                  eventLog.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{
                        fontSize: 11,
                        fontFamily: "monospace",
                        color: msg.includes("EMERGENCY") ? "#fca5a5" : msg.includes("✅") ? "#86efac" : msg.includes("❌") ? "#fca5a5" : "#6b7280",
                        lineHeight: 1.5,
                      }}
                    >
                      {msg}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Backend offline helper */}
        {backendError && !demoMode && (
          <div style={{
            marginTop: 20,
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10,
            padding: "14px 20px",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#ef4444", marginBottom: 6 }}>Backend Not Reachable</div>
            <div style={{ fontSize: 12, color: "#9ca3af", fontFamily: "monospace" }}>
              Connecting to: <code style={{ color: "#fbbf24" }}>{BACKEND}</code><br />
              Check the HuggingFace Space is awake at{" "}
              <a href="https://tharanj-aathraos.hf.space" target="_blank" rel="noreferrer" style={{ color: "#06d6f2" }}>tharanj-aathraos.hf.space</a>
            </div>
            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => { setDemoMode(true); addLog("Demo mode activated (no backend)"); }}
                style={{
                  background: "rgba(167,139,250,0.15)",
                  border: "1px solid rgba(167,139,250,0.3)",
                  borderRadius: 6,
                  padding: "5px 14px",
                  color: "#a78bfa",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Or run in Demo Mode →
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "#374151", fontFamily: "monospace" }}>
          AathraOS Junction Intelligence · YOLOv8 · ByteTrack · PCU Signal Engine
        </div>
      </div>
    </div>
  );
}
