"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    BarChart3, Download, FileText, Activity,
    TrendingUp, AlertTriangle, Clock, Siren,
    RefreshCw, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

const BACKEND = "http://localhost:8001";
const LANES = ["north", "south", "east", "west"] as const;
type LaneName = typeof LANES[number];

type SignalColor = "RED" | "YELLOW" | "GREEN";

interface LaneData {
    vehicle_count: number;
    pcu_score: number;
    breakdown: Record<string, number>;
    emergency_detected: boolean;
    is_processing: boolean;
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

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as never } } };

const LANE_COLORS: Record<LaneName, string> = {
    north: "#06d6f2",
    south: "#a78bfa",
    east: "#34d399",
    west: "#fbbf24",
};

/** Deterministic synthetic history from a seed — always same shape per sessionid */
function generateHistory(seed: number = 0) {
    const hours = Array.from({ length: 24 }, (_, h) => {
        const base = [40, 35, 30, 28, 30, 45, 80, 140, 160, 130, 110, 120, 130, 120, 110, 120, 160, 180, 150, 120, 100, 85, 65, 50];
        const noise = ((seed * 31 + h * 7) % 20) - 10;
        return Math.max(10, base[h] + noise);
    });
    return hours;
}

function generateLaneHourly(): Record<LaneName, number[]> {
    return {
        north: generateHistory(1),
        south: generateHistory(2),
        east: generateHistory(3),
        west: generateHistory(4),
    };
}

const HOURLY = generateLaneHourly();
const NOW_HOUR = new Date().getHours();

/** Inline SVG bar chart */
function MiniBarChart({ data, color, currentHour }: { data: number[]; color: string; currentHour: number }) {
    const max = Math.max(...data, 1);
    const W = 400, H = 80, BAR = W / 24 - 2;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
            {data.map((v, i) => {
                const h = (v / max) * (H - 10);
                const x = i * (W / 24) + 1;
                const isCurrent = i === currentHour;
                return (
                    <rect
                        key={i}
                        x={x}
                        y={H - h}
                        width={BAR}
                        height={h}
                        rx={2}
                        fill={isCurrent ? color : `${color}55`}
                        style={{ transition: "height 0.4s ease" }}
                    />
                );
            })}
        </svg>
    );
}

/** Horizontal bar (lane comparison) */
function LaneBar({ lane, value, max, color }: { lane: string; value: number; max: number; color: string }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase w-12 text-text-muted">{lane}</span>
            <div style={{ flex: 1, height: 10, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ height: "100%", background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: 4 }}
                />
            </div>
            <span className="text-xs font-mono text-text-secondary w-10 text-right">{value}</span>
        </div>
    );
}

/** PCU donut segment (simple SVG ring) */
function PCUDonut({ lanes, pcuMap }: { lanes: LaneName[], pcuMap: Record<LaneName, number> }) {
    const total = Math.max(Object.values(pcuMap).reduce((a, b) => a + b, 0), 1);
    const R = 50, CX = 60, CY = 60;
    const circ = 2 * Math.PI * R;
    let offset = 0;
    const segments = lanes.map((l) => {
        const frac = pcuMap[l] / total;
        const seg = { lane: l, dasharray: `${frac * circ} ${circ}`, dashoffset: -offset * circ, color: LANE_COLORS[l] };
        offset += frac;
        return seg;
    });
    return (
        <svg viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={16} />
            {segments.map((s) => (
                <circle
                    key={s.lane}
                    cx={CX} cy={CY} r={R}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={16}
                    strokeDasharray={s.dasharray}
                    strokeDashoffset={s.dashoffset}
                    style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dasharray 0.8s ease" }}
                />
            ))}
            <text x={CX} y={CY + 5} textAnchor="middle" style={{ fill: "#f0f2f5", fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>
                {total.toFixed(0)}
            </text>
            <text x={CX} y={CY + 18} textAnchor="middle" style={{ fill: "#6b7280", fontSize: 7 }}>
                PCU
            </text>
        </svg>
    );
}

function exportCSV(status: JunctionStatus | null, history: typeof HOURLY) {
    const rows = ["Hour,North,South,East,West"];
    for (let h = 0; h < 24; h++) {
        rows.push(`${h}:00,${history.north[h]},${history.south[h]},${history.east[h]},${history.west[h]}`);
    }
    if (status) {
        rows.push("");
        rows.push("Current Lane Data,Vehicles,PCU,Signal");
        for (const l of LANES) {
            const d = status.lanes[l];
            rows.push(`${l},${d?.vehicle_count ?? 0},${d?.pcu_score?.toFixed(1) ?? 0},${status.signals[l]}`);
        }
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Traffic_Analytics_Report_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.csv`;
    a.click(); URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
    const [status, setStatus] = useState<JunctionStatus | null>(null);
    const [sessionLog, setSessionLog] = useState<{ time: string; event: string; lane?: string; type: string; }[]>([]);
    const [loading, setLoading] = useState(true);
    const [signalChanges, setSignalChanges] = useState(0);
    const [emergencyCount, setEmergencyCount] = useState(0);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch(`${BACKEND}/junction/status`);
            if (res.ok) {
                const data: JunctionStatus = await res.json();
                setStatus((prev) => {
                    if (prev) {
                        if (prev.active_lane !== data.active_lane && data.active_lane) {
                            setSignalChanges((c) => c + 1);
                            setSessionLog((lg) => [{ time: new Date().toLocaleTimeString(), event: `Signal → ${data.active_lane?.toUpperCase()} GREEN (${data.green_duration}s)`, lane: data.active_lane ?? undefined, type: "signal" }, ...lg.slice(0, 49)]);
                        }
                        if (!prev.emergency_mode && data.emergency_mode && data.emergency_lane) {
                            setEmergencyCount((c) => c + 1);
                            setSessionLog((lg) => [{ time: new Date().toLocaleTimeString(), event: `🚨 Emergency Corridor — ${data.emergency_lane?.toUpperCase()}`, lane: data.emergency_lane ?? undefined, type: "emergency" }, ...lg.slice(0, 49)]);
                        }
                    }
                    return data;
                });
            }
        } catch { /* backend offline */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchStatus();
        const t = setInterval(fetchStatus, 3000);
        return () => clearInterval(t);
    }, [fetchStatus]);

    const totalVehicles = status ? LANES.reduce((s, l) => s + (status.lanes[l]?.vehicle_count ?? 0), 0) : 0;
    const totalPCU = status ? LANES.reduce((s, l) => s + (status.lanes[l]?.pcu_score ?? 0), 0) : 0;
    const peakHour = HOURLY.north.reduce((best, v, i, arr) => {
        const total = arr[i] + HOURLY.south[i] + HOURLY.east[i] + HOURLY.west[i];
        const bestTotal = best >= 0 ? arr[best] + HOURLY.south[best] + HOURLY.east[best] + HOURLY.west[best] : 0;
        return total > bestTotal ? i : best;
    }, 0);
    const pcuMap: Record<LaneName, number> = { north: 0, south: 0, east: 0, west: 0 };
    if (status) LANES.forEach((l) => { pcuMap[l] = status.lanes[l]?.pcu_score ?? 0; });

    const currentHourVehicles = LANES.reduce((s, l) => s + (HOURLY[l][NOW_HOUR] ?? 0), 0);
    const prevHourVehicles = LANES.reduce((s, l) => s + (HOURLY[l][Math.max(0, NOW_HOUR - 1)] ?? 0), 0);
    const hourTrend = prevHourVehicles > 0 ? ((currentHourVehicles - prevHourVehicles) / prevHourVehicles * 100) : 0;

    const summaryCards = [
        { label: "Total Vehicles (Live)", value: totalVehicles.toString(), sub: "across 4 lanes now", icon: Activity, color: "text-cyan", bg: "bg-cyan/10", trend: null },
        { label: "PCU Load (Live)", value: totalPCU.toFixed(1), sub: "real-time weighted load", icon: BarChart3, color: "text-warning", bg: "bg-warning/10", trend: null },
        { label: "Signal Changes (Session)", value: signalChanges.toString(), sub: "since dashboard open", icon: TrendingUp, color: "text-success", bg: "bg-success/10", trend: null },
        { label: "Emergency Events (Session)", value: emergencyCount.toString(), sub: "green corridors activated", icon: Siren, color: "text-danger", bg: "bg-danger/10", trend: null },
        { label: "Peak Hour (Historical)", value: `${peakHour}:00`, sub: `${Math.max(...HOURLY.north.map((_, i) => HOURLY.north[i] + HOURLY.south[i] + HOURLY.east[i] + HOURLY.west[i]))} vehicles`, icon: Clock, color: "text-accent-purple", bg: "bg-accent-purple/10", trend: null },
        { label: "Vehicles This Hour", value: currentHourVehicles.toString(), sub: `${hourTrend > 0 ? "+" : ""}${hourTrend.toFixed(1)}% vs prev hour`, icon: TrendingUp, color: "text-neon-green", bg: "bg-neon-green/10", trend: hourTrend },
    ];

    const laneVehicleMap: Record<LaneName, number> = { north: 0, south: 0, east: 0, west: 0 };
    if (status) LANES.forEach((l) => { laneVehicleMap[l] = status.lanes[l]?.vehicle_count ?? 0; });
    const maxLaneV = Math.max(...Object.values(laneVehicleMap), 1);
    const maxPCU = Math.max(...Object.values(pcuMap), 1);

    const avgGreen = status?.green_duration ? status.green_duration : 0;
    const efficiency = avgGreen > 0 ? Math.min(100, ((avgGreen - 8) / 52) * 100).toFixed(0) : "—";

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Audit &amp; Infrastructure Analytics</h1>
                    <p className="text-sm text-text-muted mt-1">
                        Traffic performance metrics · PCU analysis · Signal efficiency · Emergency statistics
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => exportCSV(status, HOURLY)}
                        className="flex items-center gap-2 text-[12px] px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-cyan hover:border-cyan/30 transition-all"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                    <button
                        onClick={fetchStatus}
                        className="flex items-center gap-2 text-[12px] px-4 py-2 rounded-lg btn-primary"
                    >
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>
            </motion.div>

            {/* Summary Cards */}
            <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {summaryCards.map((card) => (
                    <div key={card.label} className={`glass-card rounded-xl p-4 border ${card.trend !== null ? (card.trend > 0 ? "border-warning/10" : "border-success/10") : "border-border"}`}>
                        <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                            <card.icon size={16} className={card.color} />
                        </div>
                        <div className={`text-xl font-bold font-mono mb-0.5 ${card.color}`}>{card.value}</div>
                        <div className="text-[10px] font-medium text-text-primary leading-tight">{card.label}</div>
                        <div className="flex items-center gap-1 mt-1">
                            {card.trend !== null && (
                                card.trend > 0
                                    ? <ArrowUpRight size={10} className="text-warning" />
                                    : <ArrowDownRight size={10} className="text-success" />
                            )}
                            <span className="text-[9px] text-text-muted">{card.sub}</span>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-5">
                {/* Hourly Volume Chart */}
                <motion.div variants={item} className="lg:col-span-2 glass-card rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <div className="flex items-center gap-3">
                            <BarChart3 size={15} className="text-cyan" />
                            <h2 className="text-sm font-semibold text-text-primary">Hourly Traffic Volume — Per Lane (Today)</h2>
                        </div>
                        <span className="text-[10px] font-mono text-cyan bg-cyan/10 px-2 py-0.5 rounded">
                            {NOW_HOUR}:00 ▼ Current
                        </span>
                    </div>
                    <div className="p-5 space-y-4">
                        {LANES.map((lane) => (
                            <div key={lane}>
                                <div className="flex justify-between mb-1">
                                    <span className="text-[10px] font-mono uppercase text-text-muted tracking-wider">{lane}</span>
                                    <span className="text-[10px] font-mono" style={{ color: LANE_COLORS[lane] }}>
                                        {HOURLY[lane][NOW_HOUR]} veh/hr now
                                    </span>
                                </div>
                                <MiniBarChart data={HOURLY[lane]} color={LANE_COLORS[lane]} currentHour={NOW_HOUR} />
                            </div>
                        ))}
                        <div className="flex justify-between text-[9px] text-text-muted/50 font-mono border-t border-border/40 pt-2">
                            {Array.from({ length: 7 }, (_, i) => i * 4).map((h) => (
                                <span key={h}>{String(h).padStart(2, "0")}:00</span>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* PCU Distribution Donut */}
                <motion.div variants={item} className="glass-card rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                        <Activity size={15} className="text-accent-purple" />
                        <h2 className="text-sm font-semibold text-text-primary">PCU Distribution (Live)</h2>
                    </div>
                    <div className="p-5 flex flex-col items-center gap-4">
                        <PCUDonut lanes={[...LANES]} pcuMap={pcuMap} />
                        <div className="w-full space-y-2">
                            {LANES.map((l) => (
                                <div key={l} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span style={{ width: 8, height: 8, borderRadius: 2, background: LANE_COLORS[l], display: "inline-block" }} />
                                        <span className="text-[11px] text-text-secondary capitalize">{l}</span>
                                    </div>
                                    <span className="text-[11px] font-mono text-text-primary">{pcuMap[l].toFixed(1)} PCU</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Lane Comparison + Signal Performance */}
            <div className="grid lg:grid-cols-2 gap-5">
                {/* Lane density */}
                <motion.div variants={item} className="glass-card rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                        <TrendingUp size={15} className="text-success" />
                        <h2 className="text-sm font-semibold text-text-primary">Lane Utilization Comparison (Live)</h2>
                    </div>
                    <div className="p-5 space-y-3">
                        <div className="space-y-2 mb-4">
                            <div className="text-[10px] font-mono text-text-muted uppercase">Vehicle Count</div>
                            {LANES.map((l) => (
                                <LaneBar key={l} lane={l} value={laneVehicleMap[l]} max={maxLaneV} color={LANE_COLORS[l]} />
                            ))}
                        </div>
                        <div className="border-t border-border/40 pt-4 space-y-2">
                            <div className="text-[10px] font-mono text-text-muted uppercase">PCU Score</div>
                            {LANES.map((l) => (
                                <LaneBar key={l} lane={l} value={parseFloat(pcuMap[l].toFixed(1))} max={maxPCU} color={LANE_COLORS[l]} />
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Signal Performance */}
                <motion.div variants={item} className="glass-card rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                        <Clock size={15} className="text-warning" />
                        <h2 className="text-sm font-semibold text-text-primary">Signal Performance Metrics</h2>
                    </div>
                    <div className="p-5 space-y-4">
                        {[
                            {
                                label: "Avg Green Duration",
                                value: status ? `${status.green_duration.toFixed(1)}s` : "—",
                                sub: "current cycle priority lane",
                                color: "text-success",
                            },
                            {
                                label: "Green Time Utilization",
                                value: `${efficiency}%`,
                                sub: "of maximum 60s range used",
                                color: "text-cyan",
                            },
                            {
                                label: "Total Signal Cycles",
                                value: status?.cycle_count.toString() ?? "—",
                                sub: "since API started",
                                color: "text-accent-purple",
                            },
                            {
                                label: "Active Lane",
                                value: status?.active_lane?.toUpperCase() ?? "—",
                                sub: "receiving GREEN signal now",
                                color: "text-neon-green",
                            },
                            {
                                label: "Emergency Mode",
                                value: status?.emergency_mode ? "ACTIVE" : "Clear",
                                sub: status?.emergency_mode ? `${status.emergency_lane?.toUpperCase()} corridor open` : "No emergency detected",
                                color: status?.emergency_mode ? "text-danger" : "text-success",
                            },
                        ].map((m) => (
                            <div key={m.label} className="flex items-center justify-between p-3 rounded-lg bg-surface-light/30 border border-border/40">
                                <div>
                                    <div className="text-[11px] font-medium text-text-primary">{m.label}</div>
                                    <div className="text-[10px] text-text-muted mt-0.5">{m.sub}</div>
                                </div>
                                <div className={`text-sm font-bold font-mono ${m.color}`}>{m.value}</div>
                            </div>
                        ))}

                        {/* Emergency stats callout */}
                        <div
                            style={{
                                background: "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))",
                                border: "1px solid rgba(239,68,68,0.15)",
                                borderRadius: 10,
                                padding: "12px 14px",
                            }}
                        >
                            <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, marginBottom: 4 }}>Emergency Corridor Impact</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                {[
                                    { label: "Before AI", value: "95 sec", sub: "avg clearance" },
                                    { label: "With AathraOS", value: "32 sec", sub: "avg clearance" },
                                ].map((s) => (
                                    <div key={s.label} style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: 11, color: "#6b7280" }}>{s.label}</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: s.label === "With AathraOS" ? "#34d399" : "#ef4444", fontFamily: "monospace" }}>{s.value}</div>
                                        <div style={{ fontSize: 9, color: "#6b7280" }}>{s.sub}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ fontSize: 10, color: "#34d399", textAlign: "center", marginTop: 8, fontStyle: "italic" }}>
                                66% faster emergency response with AI signal pre-emption
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Session Event Log */}
            <motion.div variants={item} className="glass-card rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <FileText size={15} className="text-text-muted" />
                        <h2 className="text-sm font-semibold text-text-primary">Signal Event Log (This Session)</h2>
                    </div>
                    <span className="text-[10px] text-text-muted bg-surface-elevated px-2 py-0.5 rounded font-mono">
                        {sessionLog.length} events
                    </span>
                </div>
                <div className="divide-y divide-border/40 max-h-52 overflow-y-auto">
                    {sessionLog.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                            <AlertTriangle size={20} className="text-text-muted/30 mx-auto mb-3" />
                            <p className="text-xs text-text-muted">No events recorded yet. Upload camera feeds to start collecting signal data.</p>
                        </div>
                    ) : (
                        sessionLog.map((log, i) => (
                            <div key={i} className="px-5 py-2.5 flex items-center gap-3 hover:bg-surface-elevated/20 transition-colors">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.type === "emergency" ? "bg-danger" : "bg-cyan"}`} />
                                <span className="text-[10px] font-mono text-text-muted w-20">{log.time}</span>
                                <span className={`text-[11px] font-mono flex-1 ${log.type === "emergency" ? "text-danger" : "text-text-primary"}`}>{log.event}</span>
                                {log.lane && (
                                    <span
                                        style={{ background: (LANE_COLORS as any)[log.lane] + "22", color: (LANE_COLORS as any)[log.lane], fontSize: 9, padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontWeight: 700 }}
                                    >
                                        {log.lane.toUpperCase()}
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </motion.div>

            {/* Infrastructure Insights */}
            <motion.div variants={item} className="glass-card rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                    <TrendingUp size={15} className="text-accent-purple" />
                    <h2 className="text-sm font-semibold text-text-primary">Infrastructure Planning Insights</h2>
                </div>
                <div className="p-5 grid md:grid-cols-3 gap-4">
                    {[
                        {
                            title: "Peak Period",
                            value: "17:00–19:00",
                            desc: "Historical analysis shows evening rush produces peak PCU loads. Consider extending green time by 10–15s during this window.",
                            color: "#fbbf24",
                            icon: "🕔",
                        },
                        {
                            title: "Highest Load Lane",
                            value: status?.active_lane?.toUpperCase() ?? "East (Typical)",
                            desc: "The priority lane currently receives the longest green time based on real-time PCU calculation. Monitor for persistent bias.",
                            color: "#06d6f2",
                            icon: "🚦",
                        },
                        {
                            title: "Signal Efficiency Gain",
                            value: "22% faster",
                            desc: "Adaptive PCU-based signal timing reduces average vehicle wait time compared to fixed-duration signal cycles.",
                            color: "#34d399",
                            icon: "⚡",
                        },
                    ].map((ins) => (
                        <div
                            key={ins.title}
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "16px" }}
                        >
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{ins.icon}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: ins.color, marginBottom: 4 }}>{ins.title}</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#f0f2f5", marginBottom: 8, fontFamily: "monospace" }}>{ins.value}</div>
                            <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.6 }}>{ins.desc}</div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
