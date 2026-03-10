"use client";

import { motion } from "framer-motion";
import {
    Car,
    ShieldAlert,
    Activity,
    ArrowUpRight,
    ChevronRight,
    Siren,
    TrafficCone,
    Radio,
    Clock,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
};

const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as never } },
};

const BACKEND = process.env.NEXT_PUBLIC_JUNCTION_API_URL ?? "http://localhost:8001";
const WS_URL = BACKEND.replace(/^http/, "ws") + "/ws/junction";
const LANES = ["north", "south", "east", "west"] as const;
type LaneName = typeof LANES[number];
type SignalColor = "RED" | "YELLOW" | "GREEN";

interface LaneData {
    vehicle_count: number;
    pcu_score: number;
    breakdown: Record<string, number>;
    emergency_detected: boolean;
    is_processing: boolean;
    fps: number;
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

const LANE_ICONS: Record<LaneName, string> = {
    north: "↑", south: "↓", east: "→", west: "←",
};

function SignalDot({ color }: { color: SignalColor }) {
    const c = { RED: "#ef4444", YELLOW: "#f59e0b", GREEN: "#22c55e" }[color];
    return (
        <span
            style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: c,
                boxShadow: `0 0 8px ${c}`,
                flexShrink: 0,
            }}
        />
    );
}

export default function DashboardOverview() {
    const [status, setStatus] = useState<JunctionStatus | null>(null);
    const [connected, setConnected] = useState(false);
    const [eventLog, setEventLog] = useState<{ text: string; type: string; time: string }[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

    const addLog = (text: string, type: "info" | "emergency" | "success" | "warn") => {
        setEventLog((prev) => [
            { text, type, time: new Date().toLocaleTimeString() },
            ...prev.slice(0, 19),
        ]);
    };

    useEffect(() => {
        let ws: WebSocket;
        let retry: ReturnType<typeof setTimeout>;

        function connect() {
            ws = new WebSocket(WS_URL);
            wsRef.current = ws;
            ws.onopen = () => { setConnected(true); addLog("WebSocket connected — live junction data streaming", "success"); };
            ws.onmessage = (e) => {
                try {
                    const data: JunctionStatus = JSON.parse(e.data);
                    setStatus((prev) => {
                        if (prev && data.emergency_mode && !prev.emergency_mode) {
                            addLog(`🚨 EMERGENCY: Green corridor activated for ${data.emergency_lane?.toUpperCase()}`, "emergency");
                        }
                        if (prev && data.active_lane !== prev.active_lane && data.active_lane) {
                            addLog(`Signal switched → ${data.active_lane?.toUpperCase()} GREEN (${data.green_duration}s)`, "info");
                        }
                        return data;
                    });
                } catch { /* ignore parse errors */ }
            };
            ws.onerror = () => setConnected(false);
            ws.onclose = () => { setConnected(false); retry = setTimeout(connect, 3000); };
        }

        connect();
        return () => { ws?.close(); clearTimeout(retry); };
    }, []);

    // Fallback REST poll when WS is down
    useEffect(() => {
        if (connected) return;
        const t = setInterval(async () => {
            try {
                const res = await fetch(`${BACKEND}/junction/status`);
                if (res.ok) setStatus(await res.json());
            } catch { /* backend offline */ }
        }, 4000);
        return () => clearInterval(t);
    }, [connected]);

    const totalVehicles = status ? LANES.reduce((s, l) => s + (status.lanes[l]?.vehicle_count ?? 0), 0) : 0;
    const totalPCU = status ? LANES.reduce((s, l) => s + (status.lanes[l]?.pcu_score ?? 0), 0) : 0;
    const activeLanes = status ? LANES.filter((l) => status.lanes[l]?.is_processing).length : 0;

    const statusCards = [
        {
            label: "Total Vehicles",
            value: totalVehicles.toString(),
            sub: "across all 4 lanes",
            icon: Car,
            color: "text-cyan",
            bgColor: "bg-cyan/10",
            borderColor: "border-cyan/10",
        },
        {
            label: "PCU Load",
            value: totalPCU.toFixed(1),
            sub: "passenger car units",
            icon: Activity,
            color: "text-warning",
            bgColor: "bg-warning/10",
            borderColor: "border-warning/10",
        },
        {
            label: "Emergency Status",
            value: status?.emergency_mode ? "ACTIVE" : "Clear",
            sub: status?.emergency_mode ? `Corridor → ${status.emergency_lane?.toUpperCase()}` : "No emergency detected",
            icon: Siren,
            color: status?.emergency_mode ? "text-danger" : "text-success",
            bgColor: status?.emergency_mode ? "bg-danger/10" : "bg-success/10",
            borderColor: status?.emergency_mode ? "border-danger/20" : "border-success/10",
        },
        {
            label: "Active Cameras",
            value: `${activeLanes} / 4`,
            sub: "processing live feeds",
            icon: Radio,
            color: "text-accent-purple",
            bgColor: "bg-accent-purple/10",
            borderColor: "border-accent-purple/10",
        },
    ];

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <motion.div variants={item} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Traffic Command Center</h1>
                    <p className="text-sm text-text-muted mt-1">
                        AI-driven 4-way junction management · Real-time PCU optimization · Emergency Green Corridor
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        style={{
                            background: connected ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                            border: `1px solid ${connected ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                            borderRadius: 8,
                            padding: "4px 12px",
                            fontSize: 11,
                            fontFamily: "monospace",
                            color: connected ? "#22c55e" : "#ef4444",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                        className="flex items-center"
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-success animate-pulse" : "bg-danger"}`} />
                        {connected ? "LIVE" : "OFFLINE"}
                    </span>
                    {status && (
                        <span className="text-[10px] font-mono text-text-muted px-2 py-1 rounded bg-surface-elevated">
                            Cycle #{status.cycle_count}
                        </span>
                    )}
                </div>
            </motion.div>

            {/* Emergency Banner */}
            {status?.emergency_mode && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    style={{
                        background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))",
                        border: "1px solid rgba(239,68,68,0.4)",
                        borderRadius: 10,
                        padding: "14px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div className="flex items-center gap-3">
                        <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: Infinity }} style={{ fontSize: 22 }}>🚨</motion.span>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444", letterSpacing: "0.05em" }}>
                                EMERGENCY GREEN CORRIDOR ACTIVATED
                            </div>
                            <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 2 }}>
                                All signals cleared for {status.emergency_lane?.toUpperCase()} lane · Emergency vehicle in transit
                            </div>
                        </div>
                    </div>
                    <Link href="/dashboard/signals" className="btn-outline text-[11px] py-1.5 px-3 border-danger/40 text-danger hover:bg-danger/10">
                        View Signals →
                    </Link>
                </motion.div>
            )}

            {/* Status Cards */}
            <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statusCards.map((card) => (
                    <div
                        key={card.label}
                        className={`glass-card rounded-xl p-5 group cursor-pointer border ${card.borderColor}`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                                <card.icon size={18} className={card.color} />
                            </div>
                            <ArrowUpRight size={14} className="text-text-muted/40 group-hover:text-text-muted transition-colors" />
                        </div>
                        <div className={`text-2xl font-bold mb-1 ${card.color}`}>{card.value}</div>
                        <div className="text-xs font-medium text-text-primary">{card.label}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">{card.sub}</div>
                    </div>
                ))}
            </motion.div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Signal State Panel */}
                <motion.div variants={item} className="lg:col-span-2">
                    <div className="glass-card rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <TrafficCone size={16} className="text-cyan" />
                                <h2 className="text-sm font-semibold text-text-primary">Live Signal States · 4-Way Junction</h2>
                            </div>
                            <Link
                                href="/dashboard/signals"
                                className="text-[10px] font-medium text-text-muted px-2 py-1 rounded border border-border hover:border-cyan/20 hover:text-cyan transition-all flex items-center gap-1"
                            >
                                Full Dashboard <ChevronRight size={10} />
                            </Link>
                        </div>
                        <div className="p-5">
                            <div className="grid grid-cols-2 gap-4">
                                {LANES.map((lane) => {
                                    const laneData = status?.lanes[lane];
                                    const signal = status?.signals[lane] ?? "RED";
                                    const isActive = status?.active_lane === lane;
                                    const isEmergency = status?.emergency_lane === lane;
                                    return (
                                        <div
                                            key={lane}
                                            style={{
                                                background: isEmergency
                                                    ? "rgba(239,68,68,0.07)"
                                                    : isActive
                                                        ? "rgba(34,197,94,0.05)"
                                                        : "rgba(255,255,255,0.02)",
                                                border: isEmergency
                                                    ? "1px solid rgba(239,68,68,0.25)"
                                                    : isActive
                                                        ? "1px solid rgba(34,197,94,0.2)"
                                                        : "1px solid rgba(255,255,255,0.05)",
                                                borderRadius: 10,
                                                padding: "14px 16px",
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <SignalDot color={signal} />
                                                    <span className="text-xs font-semibold text-text-primary uppercase tracking-widest font-mono">
                                                        {LANE_ICONS[lane]} {lane}
                                                    </span>
                                                </div>
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        fontFamily: "monospace",
                                                        fontWeight: 700,
                                                        color: signal === "GREEN" ? "#22c55e" : signal === "YELLOW" ? "#f59e0b" : "#ef4444",
                                                        background: signal === "GREEN" ? "rgba(34,197,94,0.1)" : signal === "YELLOW" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                                                        padding: "2px 8px",
                                                        borderRadius: 4,
                                                    }}
                                                >
                                                    {signal}
                                                </span>
                                            </div>
                                            <div className="flex gap-4 text-[11px] text-text-muted font-mono">
                                                <span><span className="text-text-secondary">{laneData?.vehicle_count ?? 0}</span> vehicles</span>
                                                <span><span className="text-cyan">{laneData?.pcu_score?.toFixed(1) ?? "0.0"}</span> PCU</span>
                                            </div>
                                            {/* PCU mini bar */}
                                            <div style={{ marginTop: 8, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                                                <div
                                                    style={{
                                                        height: "100%",
                                                        width: `${Math.min(100, ((laneData?.pcu_score ?? 0) / 40) * 100)}%`,
                                                        background: isActive
                                                            ? "linear-gradient(90deg, #22c55e, #06d6f2)"
                                                            : "linear-gradient(90deg, #334155, #475569)",
                                                        borderRadius: 2,
                                                        transition: "width 0.6s ease",
                                                    }}
                                                />
                                            </div>
                                            {laneData?.emergency_detected && (
                                                <div className="mt-2 text-[10px] text-danger font-mono font-bold animate-pulse">
                                                    🚨 EMERGENCY VEHICLE
                                                </div>
                                            )}
                                            {isActive && !isEmergency && (
                                                <div className="mt-2 text-[10px] text-success font-mono">
                                                    ● Active green · {status?.green_duration?.toFixed(0)}s
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* PCU Legend */}
                            <div className="mt-4 pt-4 border-t border-border/50 flex gap-4 flex-wrap">
                                {[
                                    { label: "bike", val: "0.5" },
                                    { label: "car", val: "1.0" },
                                    { label: "auto", val: "1.2" },
                                    { label: "bus/truck", val: "3.0" },
                                ].map((w) => (
                                    <div key={w.label} className="text-[10px] text-text-muted flex items-center gap-1">
                                        <span className="text-text-secondary">{w.label}</span>
                                        <span className="text-cyan font-mono">{w.val} PCU</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Event Log */}
                <motion.div variants={item}>
                    <div className="glass-card rounded-xl overflow-hidden h-full">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <Clock size={16} className="text-warning" />
                                <h2 className="text-sm font-semibold text-text-primary">System Event Log</h2>
                            </div>
                            <span className="text-[10px] font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                                {eventLog.length} Events
                            </span>
                        </div>
                        <div className="divide-y divide-border/50 max-h-[380px] overflow-y-auto">
                            {eventLog.length === 0 ? (
                                <div className="px-5 py-8 text-center">
                                    <p className="text-xs text-text-muted font-mono">Waiting for junction events…</p>
                                    <p className="text-[10px] text-text-muted/50 mt-2">
                                        Start backend or upload camera feeds
                                    </p>
                                </div>
                            ) : (
                                eventLog.map((log, i) => (
                                    <div key={i} className="px-5 py-3 hover:bg-surface-elevated/20 transition-colors">
                                        <div className="flex items-start gap-2">
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${log.type === "emergency"
                                                    ? "bg-danger"
                                                    : log.type === "success"
                                                        ? "bg-success"
                                                        : log.type === "warn"
                                                            ? "bg-warning"
                                                            : "bg-cyan"
                                                    }`}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] text-text-primary leading-relaxed font-mono">{log.text}</p>
                                                <p className="text-[10px] text-text-muted mt-0.5">{log.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Quick Launch to Traffic Signal Dashboard */}
            <motion.div variants={item}>
                <div className="glass-card rounded-xl p-5 flex items-center justify-between border border-cyan/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center">
                            <TrafficCone size={22} className="text-cyan" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-text-primary">Traffic Signal Control Dashboard</div>
                            <div className="text-xs text-text-muted mt-0.5">
                                Upload camera feeds · View live bounding boxes · Monitor emergency green corridor
                            </div>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/signals"
                        className="btn-primary text-[12px] py-2 px-5 flex items-center gap-2"
                    >
                        Open Dashboard <ChevronRight size={14} />
                    </Link>
                </div>
            </motion.div>

            {/* Backend offline helper */}
            {!connected && (
                <motion.div variants={item}>
                    <div
                        style={{
                            background: "rgba(239,68,68,0.04)",
                            border: "1px solid rgba(239,68,68,0.15)",
                            borderRadius: 10,
                            padding: "14px 20px",
                        }}
                    >
                        <div className="text-xs font-semibold text-danger mb-2">Junction API Not Reachable</div>
                        <div className="text-[11px] text-text-muted font-mono">
                            Start the backend:
                            <code className="ml-2 text-warning bg-surface-elevated px-2 py-0.5 rounded">
                                cd traffic_crowd_prediction &amp;&amp; uvicorn junction_api:app --port 8001 --reload
                            </code>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
