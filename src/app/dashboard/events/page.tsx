"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar, MapPin, Users, Clock, AlertTriangle,
    Zap, ChevronRight, RefreshCw, CheckCircle,
} from "lucide-react";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as never } } };

interface EventForm {
    name: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    crowd: string;
    duration: string;
    type: string;
    description: string;
    intersections: string;
}

const EVENT_TYPES = ["Procession / Rally", "Festival / Fair", "Sports Event", "Exhibition / Trade Show", "Concert / Cultural", "Political Event", "Religious Ceremony", "Market / Mela"];

const PRESETS = [
    {
        name: "Ganesh Chaturthi Procession",
        type: "Religious Ceremony",
        crowd: "8000",
        duration: "4",
        location: "Market Road Junction",
        description: "Annual procession passing through main junction",
    },
    {
        name: "Diwali Traffic Surge",
        type: "Festival / Fair",
        crowd: "15000",
        duration: "8",
        location: "Central Avenue Junction",
        description: "Festival shopping surge expected across all roads",
    },
    {
        name: "IPL Stadium Match",
        type: "Sports Event",
        crowd: "45000",
        duration: "5",
        location: "Stadium Road Intersection",
        description: "Major cricket match at nearby stadium",
    },
    {
        name: "Trade Exhibition",
        type: "Exhibition / Trade Show",
        crowd: "5000",
        duration: "8",
        location: "Convention Centre Road",
        description: "4-day trade exhibition with steady delegate flow",
    },
];

function MarkdownRenderer({ text }: { text: string }) {
    const lines = text.split("\n");
    return (
        <div style={{ lineHeight: 1.7 }}>
            {lines.map((line, i) => {
                if (line.startsWith("### ")) {
                    return <h3 key={i} style={{ fontSize: 13, fontWeight: 700, color: "#06d6f2", marginTop: 16, marginBottom: 4 }}>{line.slice(4)}</h3>;
                }
                if (line.startsWith("## ")) {
                    return <h2 key={i} style={{ fontSize: 14, fontWeight: 800, color: "#a78bfa", marginTop: 20, marginBottom: 6 }}>{line.slice(3)}</h2>;
                }
                if (line.startsWith("**") && line.endsWith("**")) {
                    return <p key={i} style={{ fontSize: 12, fontWeight: 700, color: "#f0f2f5", marginBottom: 4 }}>{line.slice(2, -2)}</p>;
                }
                if (line.startsWith("- ") || line.startsWith("• ")) {
                    const content = line.slice(2);
                    const bold = content.replace(/\*\*([^*]+)\*\*/g, (_, t) => `<strong style="color:#f0f2f5">${t}</strong>`);
                    return <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#9ca3af", marginBottom: 3 }}>
                        <span style={{ color: "#06d6f2", flexShrink: 0 }}>•</span>
                        <span dangerouslySetInnerHTML={{ __html: bold }} />
                    </div>;
                }
                if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
                const withBold = line.replace(/\*\*([^*]+)\*\*/g, (_, t) => `<strong style="color:#f0f2f5">${t}</strong>`);
                return <p key={i} style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: withBold }} />;
            })}
        </div>
    );
}

/** Simple inline SVG junction map showing congestion overlay */
function JunctionMap({ impactLevel }: { impactLevel: string }) {
    const roadColor = impactLevel === "Critical" ? "#ef4444" : impactLevel === "High" ? "#f59e0b" : impactLevel === "Medium" ? "#fbbf24" : "#34d399";
    const glow = impactLevel === "Critical" ? "rgba(239,68,68,0.3)" : impactLevel === "High" ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.2)";
    return (
        <svg viewBox="0 0 300 300" style={{ width: "100%", maxWidth: 300, height: 300 }}>
            {/* Background */}
            <rect width="300" height="300" fill="#0c0c18" rx="8" />
            {/* Grid */}
            {Array.from({ length: 6 }, (_, i) => (
                <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="300" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 60} x2="300" y2={i * 60} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            ))}
            {/* Vertical road */}
            <rect x="128" y="0" width="44" height="300" fill="rgba(30,30,46,0.95)" />
            {/* Horizontal road */}
            <rect x="0" y="128" width="300" height="44" fill="rgba(30,30,46,0.95)" />
            {/* Road markings */}
            <line x1="150" y1="0" x2="150" y2="120" stroke="rgba(255,255,180,0.3)" strokeDasharray="10,14" strokeWidth="2" />
            <line x1="150" y1="180" x2="150" y2="300" stroke="rgba(255,255,180,0.3)" strokeDasharray="10,14" strokeWidth="2" />
            <line x1="0" y1="150" x2="120" y2="150" stroke="rgba(255,255,180,0.3)" strokeDasharray="10,14" strokeWidth="2" />
            <line x1="180" y1="150" x2="300" y2="150" stroke="rgba(255,255,180,0.3)" strokeDasharray="10,14" strokeWidth="2" />
            {/* Center box */}
            <rect x="128" y="128" width="44" height="44" fill="rgba(18,18,30,0.98)" />
            <text x="150" y="152" textAnchor="middle" style={{ fill: "#06d6f2", fontSize: 8, fontWeight: 700, fontFamily: "monospace" }}>AOS</text>
            {/* Congestion overlay per road */}
            <rect x="128" y="0" width="44" height="120" fill={`${roadColor}22`} />
            <rect x="128" y="180" width="44" height="120" fill={`${roadColor}22`} />
            <rect x="0" y="128" width="120" height="44" fill={`${roadColor}22`} />
            <rect x="180" y="128" width="120" height="44" fill={`${roadColor}22`} />
            {/* Crowd icon (event) */}
            <circle cx="60" cy="60" r="28" fill={`${roadColor}18`} stroke={roadColor} strokeWidth="1" />
            <text x="60" y="55" textAnchor="middle" style={{ fontSize: 18 }}>🎪</text>
            <text x="60" y="74" textAnchor="middle" style={{ fill: roadColor, fontSize: 8, fontFamily: "monospace" }}>EVENT</text>
            {/* Signal dots */}
            {[
                { cx: 150, cy: 20 },
                { cx: 150, cy: 280 },
                { cx: 20, cy: 150 },
                { cx: 280, cy: 150 },
            ].map((dot, i) => (
                <circle key={i} cx={dot.cx} cy={dot.cy} r="7" fill={roadColor} style={{ filter: `drop-shadow(0 0 4px ${glow})` }} />
            ))}
            {/* Arrow — crowd flow */}
            <path d="M 70 80 L 120 140" stroke={roadColor} strokeWidth="1.5" strokeDasharray="5,5" markerEnd="url(#arrow)" opacity="0.7" />
            <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill={roadColor} />
                </marker>
            </defs>
            {/* Labels */}
            <text x="150" y="14" textAnchor="middle" style={{ fill: "#9ca3af", fontSize: 8, fontFamily: "monospace" }}>NORTH</text>
            <text x="150" y="296" textAnchor="middle" style={{ fill: "#9ca3af", fontSize: 8, fontFamily: "monospace" }}>SOUTH</text>
            <text x="8" y="153" style={{ fill: "#9ca3af", fontSize: 8, fontFamily: "monospace" }}>W</text>
            <text x="286" y="153" style={{ fill: "#9ca3af", fontSize: 8, fontFamily: "monospace" }}>E</text>
        </svg>
    );
}

export default function EventSimulationPage() {
    const today = new Date().toISOString().split("T")[0];
    const [form, setForm] = useState<EventForm>({
        name: "", date: today, startTime: "10:00", endTime: "14:00",
        location: "", crowd: "", duration: "", type: "Festival / Fair",
        description: "", intersections: "",
    });
    const [loading, setLoading] = useState(false);
    const [insights, setInsights] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [impactLevel, setImpactLevel] = useState<string>("—");

    function applyPreset(preset: (typeof PRESETS)[0]) {
        setForm((f) => ({
            ...f,
            name: preset.name,
            type: preset.type,
            crowd: preset.crowd,
            duration: preset.duration,
            location: preset.location,
            description: preset.description,
        }));
        setInsights(null);
        setError(null);
    }

    async function handleAnalyze() {
        if (!form.name || !form.crowd || !form.location) {
            setError("Please fill in at least Event Name, Location, and Expected Crowd.");
            return;
        }
        setLoading(true);
        setInsights(null);
        setError(null);
        try {
            const res = await fetch("/api/event-insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: form }),
            });
            const data = await res.json();
            if (data.insights) {
                setInsights(data.insights);
                // Parse impact level from response
                if (data.insights.includes("Critical")) setImpactLevel("Critical");
                else if (data.insights.includes("High")) setImpactLevel("High");
                else if (data.insights.includes("Medium")) setImpactLevel("Medium");
                else setImpactLevel("Low");
            } else {
                setError(data.error || "Failed to generate insights.");
            }
        } catch {
            setError("Cannot reach the AI service. Check your network connection.");
        }
        setLoading(false);
    }

    const IMPACT_COLORS: Record<string, string> = {
        Critical: "#ef4444", High: "#f59e0b", Medium: "#fbbf24", Low: "#34d399", "—": "#6b7280",
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <motion.div variants={item}>
                <h1 className="text-2xl font-bold text-text-primary">Event Simulation &amp; Traffic Planning</h1>
                <p className="text-sm text-text-muted mt-1">
                    Predict traffic impact of large public events · AI-powered signal adjustment recommendations · Gemini-driven crowd management
                </p>
            </motion.div>

            {/* Presets */}
            <motion.div variants={item}>
                <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-3">Quick Presets</div>
                <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                        <button
                            key={p.name}
                            onClick={() => applyPreset(p)}
                            className="text-[11px] px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:border-cyan/30 hover:text-cyan transition-all"
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            </motion.div>

            <div className="grid lg:grid-cols-5 gap-5">
                {/* Form */}
                <motion.div variants={item} className="lg:col-span-2 glass-card rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                        <Calendar size={15} className="text-cyan" />
                        <h2 className="text-sm font-semibold text-text-primary">Event Details</h2>
                    </div>
                    <div className="p-5 space-y-4">
                        {/* Event Name */}
                        <div>
                            <label className="text-[10px] font-mono text-text-muted uppercase mb-1 block">Event Name *</label>
                            <input
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. Ganesh Chaturthi Procession"
                                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#f0f2f5", outline: "none" }}
                            />
                        </div>
                        {/* Event Type */}
                        <div>
                            <label className="text-[10px] font-mono text-text-muted uppercase mb-1 block">Event Type</label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                                style={{ width: "100%", background: "rgba(18,18,26,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#f0f2f5", outline: "none" }}
                            >
                                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        {/* Location */}
                        <div>
                            <label className="text-[10px] font-mono text-text-muted uppercase mb-1 block">Location / Junction *</label>
                            <div className="relative">
                                <MapPin size={13} style={{ position: "absolute", left: 10, top: 9, color: "#6b7280" }} />
                                <input
                                    value={form.location}
                                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                                    placeholder="e.g. Market Road Junction"
                                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px 8px 30px", fontSize: 13, color: "#f0f2f5", outline: "none" }}
                                />
                            </div>
                        </div>
                        {/* Crowd + Duration */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-mono text-text-muted uppercase mb-1 block flex items-center gap-1"><Users size={10} /> Crowd *</label>
                                <input
                                    value={form.crowd}
                                    onChange={(e) => setForm((f) => ({ ...f, crowd: e.target.value }))}
                                    placeholder="8000"
                                    type="number"
                                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#f0f2f5", outline: "none" }}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-mono text-text-muted uppercase mb-1 block flex items-center gap-1"><Clock size={10} /> Hours</label>
                                <input
                                    value={form.duration}
                                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                                    placeholder="4"
                                    type="number"
                                    style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#f0f2f5", outline: "none" }}
                                />
                            </div>
                        </div>
                        {/* Date + Times */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] font-mono text-text-muted uppercase mb-1 block">Date</label>
                                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                                    style={{ width: "100%", background: "rgba(18,18,26,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 8px", fontSize: 12, color: "#f0f2f5", outline: "none" }} />
                            </div>
                            <div>
                                <label className="text-[10px] font-mono text-text-muted uppercase mb-1 block">Start</label>
                                <input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                                    style={{ width: "100%", background: "rgba(18,18,26,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 8px", fontSize: 12, color: "#f0f2f5", outline: "none" }} />
                            </div>
                            <div>
                                <label className="text-[10px] font-mono text-text-muted uppercase mb-1 block">End</label>
                                <input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                                    style={{ width: "100%", background: "rgba(18,18,26,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 8px", fontSize: 12, color: "#f0f2f5", outline: "none" }} />
                            </div>
                        </div>
                        {/* Description */}
                        <div>
                            <label className="text-[10px] font-mono text-text-muted uppercase mb-1 block">Description (optional)</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                rows={2}
                                placeholder="Additional context about the event..."
                                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f0f2f5", outline: "none", resize: "none" }}
                            />
                        </div>
                        {/* Nearby Intersections */}
                        <div>
                            <label className="text-[10px] font-mono text-text-muted uppercase mb-1 block">Nearby Intersections (optional)</label>
                            <input
                                value={form.intersections}
                                onChange={(e) => setForm((f) => ({ ...f, intersections: e.target.value }))}
                                placeholder="e.g. MG Road crossing, Central Ave junction"
                                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#f0f2f5", outline: "none" }}
                            />
                        </div>
                        {error && (
                            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#fca5a5" }}>
                                {error}
                            </div>
                        )}
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="w-full btn-primary flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #0a0a0f", borderTopColor: "transparent" }} />
                                    Analyzing with Gemini…
                                </>
                            ) : (
                                <>
                                    <Zap size={14} /> Run AI Simulation
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* Right — Map + Results */}
                <div className="lg:col-span-3 flex flex-col gap-5">
                    {/* Junction Map */}
                    <motion.div variants={item} className="glass-card rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MapPin size={15} className="text-cyan" />
                                <h2 className="text-sm font-semibold text-text-primary">Junction Congestion Map</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span style={{ fontSize: 10, color: IMPACT_COLORS[impactLevel], background: `${IMPACT_COLORS[impactLevel]}18`, padding: "3px 10px", borderRadius: 6, fontFamily: "monospace", fontWeight: 700 }}>
                                    {impactLevel === "—" ? "No simulation yet" : `${impactLevel} Impact`}
                                </span>
                            </div>
                        </div>
                        <div className="p-5 flex justify-center">
                            <JunctionMap impactLevel={impactLevel} />
                        </div>
                    </motion.div>

                    {/* AI Insights */}
                    <AnimatePresence>
                        {(insights || loading) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="glass-card rounded-xl overflow-hidden"
                            >
                                <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a78bfa", boxShadow: "0 0 8px #a78bfa" }} />
                                    <h2 className="text-sm font-semibold text-text-primary">
                                        Gemini AI Traffic Management Plan
                                    </h2>
                                    {insights && (
                                        <span className="ml-auto flex items-center gap-1 text-[10px] text-success">
                                            <CheckCircle size={11} /> Analysis complete
                                        </span>
                                    )}
                                </div>
                                <div className="p-5 max-h-[500px] overflow-y-auto">
                                    {loading ? (
                                        <div className="flex flex-col items-center gap-4 py-8">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(167,139,250,0.3)", borderTopColor: "#a78bfa" }}
                                            />
                                            <p className="text-xs text-text-muted font-mono">Gemini is analyzing traffic impact…</p>
                                        </div>
                                    ) : insights ? (
                                        <MarkdownRenderer text={insights} />
                                    ) : null}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Quick impact estimator (static, shown before analysis) */}
                    {!insights && !loading && (
                        <motion.div variants={item} className="glass-card rounded-xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                                <AlertTriangle size={15} className="text-warning" />
                                <h2 className="text-sm font-semibold text-text-primary">Quick Impact Estimator</h2>
                            </div>
                            <div className="p-5 grid grid-cols-2 gap-3">
                                {[
                                    { crowd: "< 1,000", impact: "Low", desc: "Minimal signal adjustment needed", color: "#34d399" },
                                    { crowd: "1,000–5,000", impact: "Medium", desc: "+10–20% congestion increase", color: "#fbbf24" },
                                    { crowd: "5,000–20,000", impact: "High", desc: "+30–50% congestion, diversion needed", color: "#f59e0b" },
                                    { crowd: "> 20,000", impact: "Critical", desc: "Full traffic management plan required", color: "#ef4444" },
                                ].map((level) => (
                                    <div key={level.impact} style={{ background: `${level.color}08`, border: `1px solid ${level.color}22`, borderRadius: 8, padding: 12 }}>
                                        <div style={{ fontSize: 11, color: level.color, fontWeight: 700 }}>{level.impact}</div>
                                        <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>Crowd: {level.crowd}</div>
                                        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>{level.desc}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-5 pb-4 text-center">
                                <div style={{ fontSize: 11, color: "#4b5563", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                    <ChevronRight size={11} />
                                    Fill the form and click <strong style={{ color: "#a78bfa", marginLeft: 4 }}> Run AI Simulation</strong> for a full Gemini analysis
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
