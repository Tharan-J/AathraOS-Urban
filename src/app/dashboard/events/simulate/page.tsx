"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play, Pause, RotateCcw, Users, Car, Zap, ShieldCheck,
    AlertTriangle, Sparkles, ChevronLeft, Activity, Loader2,
    MapPin, Clock, Radio, CheckCircle2, ArrowUpRight, ArrowDownRight,
    Siren, TrendingUp, Battery, Thermometer,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type Phase = "pre-event" | "arrival" | "peak" | "event" | "dispersal" | "complete";

interface SimMetrics {
    population: number;
    populationDelta: number;
    vehicles: number;
    gateBLoad: number;
    zoneRisk: string;
    energy: number;
    shuttleUtil: number;
    parking: number;
}

interface Advisory {
    text: string;
    phase: Phase;
    timestamp: Date;
}

interface ZoneState {
    name: string;
    density: number; // 0–100
    risk: "low" | "medium" | "high" | "critical";
    crowdCount: number;
}

// ── Phase config ──────────────────────────────────────────────────────────────
const PHASES: { id: Phase; label: string; duration: number; description: string }[] = [
    { id: "pre-event", label: "Pre-Event (T-60 min)", duration: 8000, description: "Infrastructure preparation, HVAC pre-cooling, shuttle positioning" },
    { id: "arrival", label: "Arrival Surge", duration: 10000, description: "Attendees arriving, gate surge, parking filling" },
    { id: "peak", label: "Peak Occupancy", duration: 8000, description: "Maximum crowd density, full vehicle load" },
    { id: "event", label: "Event In Progress", duration: 10000, description: "Sustained crowd at venue, utilities at peak" },
    { id: "dispersal", label: "Post-Event Dispersal", duration: 10000, description: "Mass exit, shuttle surge, gate management" },
    { id: "complete", label: "Simulation Complete", duration: 0, description: "All clear. Campus returning to normal." },
];

// ── Metric interpolator per phase ─────────────────────────────────────────────
function metricsForPhase(phase: Phase, attendees: number, progress: number): SimMetrics {
    const base = 12847;
    const peak = base + attendees;
    const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * Math.min(t, 1));
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

    switch (phase) {
        case "pre-event":
            return { population: lerp(base, base + attendees * 0.1, progress), populationDelta: 1.2, vehicles: lerp(450, 520, progress), gateBLoad: lerp(35, 55, progress), zoneRisk: "Medium", energy: parseFloat((2.4 + progress * 0.4).toFixed(1)), shuttleUtil: lerp(40, 65, progress), parking: lerp(42, 60, progress) };
        case "arrival":
            return { population: lerp(base + attendees * 0.1, peak * 0.8, progress), populationDelta: clamp(8 + progress * 6, 0, 20), vehicles: lerp(520, 650, progress), gateBLoad: lerp(55, 88, progress), zoneRisk: progress > 0.6 ? "High" : "Medium", energy: parseFloat((2.8 + progress * 0.5).toFixed(1)), shuttleUtil: lerp(65, 90, progress), parking: lerp(60, 85, progress) };
        case "peak":
            return { population: lerp(peak * 0.8, peak, progress), populationDelta: clamp(14 + progress * 2, 0, 18), vehicles: lerp(650, 680, progress), gateBLoad: lerp(88, 94, progress), zoneRisk: "Critical", energy: parseFloat((3.3 + progress * 0.2).toFixed(1)), shuttleUtil: lerp(90, 98, progress), parking: lerp(85, 97, progress) };
        case "event":
            return { population: lerp(peak, peak * 0.95, progress), populationDelta: clamp(12 - progress * 4, 0, 14), vehicles: lerp(680, 640, progress), gateBLoad: lerp(94, 72, progress), zoneRisk: progress > 0.5 ? "Medium" : "High", energy: parseFloat((3.5 - progress * 0.3).toFixed(1)), shuttleUtil: lerp(95, 80, progress), parking: lerp(97, 90, progress) };
        case "dispersal":
            return { population: lerp(peak * 0.95, base, progress), populationDelta: -clamp(progress * 18, 0, 20), vehicles: lerp(640, 480, progress), gateBLoad: lerp(72, 40, progress), zoneRisk: progress > 0.7 ? "Low" : "Medium", energy: parseFloat((3.2 - progress * 0.9).toFixed(1)), shuttleUtil: lerp(80, 55, progress), parking: lerp(90, 45, progress) };
        case "complete":
            return { population: base, populationDelta: 0, vehicles: 450, gateBLoad: 32, zoneRisk: "Low", energy: 2.4, shuttleUtil: 42, parking: 41 };
        default:
            return { population: base, populationDelta: 0, vehicles: 450, gateBLoad: 35, zoneRisk: "Low", energy: 2.4, shuttleUtil: 40, parking: 42 };
    }
}

function zonesForPhase(phase: Phase, progress: number, venue: string): ZoneState[] {
    const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * Math.min(t, 1));
    const risk = (d: number): "low" | "medium" | "high" | "critical" => d > 85 ? "critical" : d > 65 ? "high" : d > 40 ? "medium" : "low";

    const dVenue = phase === "pre-event" ? lerp(15, 40, progress) :
        phase === "arrival" ? lerp(40, 90, progress) :
            phase === "peak" ? lerp(90, 98, progress) :
                phase === "event" ? lerp(95, 92, progress) :
                    phase === "dispersal" ? lerp(92, 10, progress) : 10;

    const dGateB = phase === "pre-event" ? lerp(35, 50, progress) :
        phase === "arrival" ? lerp(50, 88, progress) :
            phase === "peak" ? lerp(88, 94, progress) :
                phase === "event" ? lerp(94, 72, progress) :
                    phase === "dispersal" ? lerp(72, 85, progress) : 32;

    const dZoneA = phase === "arrival" ? lerp(38, 56, progress) :
        phase === "peak" ? lerp(56, 62, progress) :
            phase === "dispersal" ? lerp(58, 30, progress) : 35;

    const dZoneC7 = phase === "peak" ? lerp(45, 78, progress) :
        phase === "event" ? lerp(78, 65, progress) :
            phase === "dispersal" ? lerp(65, 30, progress) : 28;

    const dParking = phase === "arrival" ? lerp(42, 85, progress) :
        phase === "peak" ? lerp(85, 97, progress) :
            phase === "dispersal" ? lerp(97, 45, progress) : 42;

    return [
        { name: venue.slice(0, 16), density: dVenue, risk: risk(dVenue), crowdCount: Math.round(dVenue * 32) },
        { name: "Gate B", density: dGateB, risk: risk(dGateB), crowdCount: Math.round(dGateB * 9) },
        { name: "Zone A", density: dZoneA, risk: risk(dZoneA), crowdCount: Math.round(dZoneA * 28) },
        { name: "Zone C-7", density: dZoneC7, risk: risk(dZoneC7), crowdCount: Math.round(dZoneC7 * 11) },
        { name: "Parking Lot", density: dParking, risk: risk(dParking), crowdCount: Math.round(dParking * 6.5) },
    ];
}

// ── Risk colours ───────────────────────────────────────────────────────────────
const riskColor = { low: "#34d399", medium: "#fbbf24", high: "#f87171", critical: "#f87171" };
const riskBg = { low: "rgba(52,211,153,0.1)", medium: "rgba(251,191,36,0.1)", high: "rgba(248,113,113,0.1)", critical: "rgba(248,113,113,0.15)" };

function renderAdvisory(text: string) {
    return text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan">$1</strong>');
        return (
            <div key={i} className="flex items-start gap-2 py-1">
                <span className="w-1 h-1 rounded-full bg-cyan/50 mt-[7px] flex-shrink-0" />
                <p className="text-[11px] text-text-secondary leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
            </div>
        );
    });
}

// ── Campus SVG Map  (live density overlay) ────────────────────────────────────
function CampusMap({ zones, phase }: { zones: ZoneState[]; phase: Phase }) {
    const venueZone = zones[0];
    const gateBZone = zones[1];
    const zoneAZone = zones[2];
    const zoneC7Zone = zones[3];
    const parkingZone = zones[4];

    const pulse = (z: ZoneState) => z.risk === "critical" || z.risk === "high";

    return (
        <svg className="w-full h-full" viewBox="0 0 800 420" fill="none">
            {/* Grid */}
            {Array.from({ length: 16 }, (_, i) => (
                <line key={`v${i}`} x1={50 + i * 47} y1={20} x2={50 + i * 47} y2={400} stroke="rgba(6,214,242,0.025)" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 10 }, (_, i) => (
                <line key={`h${i}`} x1={50} y1={20 + i * 42} x2={780} y2={20 + i * 42} stroke="rgba(6,214,242,0.025)" strokeWidth="0.5" />
            ))}

            {/* --- Venue (Hub Central / whatever event venue) --- */}
            <rect x="280" y="80" width="160" height="100" rx="4"
                fill={`rgba(${venueZone.density > 80 ? "248,113,113" : venueZone.density > 50 ? "251,191,36" : "6,214,242"},${0.04 + venueZone.density / 300})`}
                stroke={`rgba(${venueZone.density > 80 ? "248,113,113" : venueZone.density > 50 ? "251,191,36" : "6,214,242"},${0.1 + venueZone.density / 200})`}
                strokeWidth="1.5"
            />
            {pulse(venueZone) && <rect x="280" y="80" width="160" height="100" rx="4" fill="none" stroke="rgba(248,113,113,0.3)" strokeWidth="1">
                <animate attributeName="stroke-opacity" values="0.3;0.8;0.3" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="stroke-width" values="1;3;1" dur="1.2s" repeatCount="indefinite" />
            </rect>}
            <text x="360" y="128" fill="rgba(255,255,255,0.7)" fontSize="9" textAnchor="middle" fontFamily="Inter" fontWeight="600">
                {venueZone.name}
            </text>
            <text x="360" y="142" fill={riskColor[venueZone.risk]} fontSize="8" textAnchor="middle" fontFamily="monospace">
                {venueZone.density}% · {venueZone.crowdCount}
            </text>

            {/* --- Gate B --- */}
            <rect x="620" y="160" width="90" height="55" rx="3"
                fill={`rgba(${gateBZone.density > 80 ? "248,113,113" : "251,191,36"},${0.04 + gateBZone.density / 300})`}
                stroke={`rgba(${gateBZone.density > 80 ? "248,113,113" : "251,191,36"},${0.15 + gateBZone.density / 200})`}
                strokeWidth="1.5"
            />
            {pulse(gateBZone) && <rect x="620" y="160" width="90" height="55" rx="3" fill="none" stroke="rgba(248,113,113,0.3)" strokeWidth="1">
                <animate attributeName="stroke-opacity" values="0.2;0.7;0.2" dur="1.5s" repeatCount="indefinite" />
            </rect>}
            <text x="665" y="185" fill="rgba(255,255,255,0.7)" fontSize="8" textAnchor="middle" fontFamily="Inter" fontWeight="600">Gate B</text>
            <text x="665" y="198" fill={riskColor[gateBZone.risk]} fontSize="8" textAnchor="middle" fontFamily="monospace">{gateBZone.density}%</text>

            {/* --- Zone A --- */}
            <rect x="80" y="120" width="120" height="80" rx="3"
                fill={`rgba(52,211,153,${0.03 + zoneAZone.density / 400})`}
                stroke={`rgba(52,211,153,${0.08 + zoneAZone.density / 250})`}
                strokeWidth="1"
            />
            <text x="140" y="158" fill="rgba(255,255,255,0.6)" fontSize="8" textAnchor="middle" fontFamily="Inter">Zone A</text>
            <text x="140" y="170" fill={riskColor[zoneAZone.risk]} fontSize="8" textAnchor="middle" fontFamily="monospace">{zoneAZone.density}%</text>

            {/* --- Zone C-7 --- */}
            <rect x="500" y="280" width="100" height="65" rx="3"
                fill={`rgba(${zoneC7Zone.density > 60 ? "248,113,113" : "167,139,250"},${0.04 + zoneC7Zone.density / 300})`}
                stroke={`rgba(${zoneC7Zone.density > 60 ? "248,113,113" : "167,139,250"},${0.1 + zoneC7Zone.density / 200})`}
                strokeWidth="1.2"
            />
            {pulse(zoneC7Zone) && <rect x="500" y="280" width="100" height="65" rx="3" fill="none" stroke="rgba(248,113,113,0.35)" strokeWidth="1.5">
                <animate attributeName="stroke-opacity" values="0.2;0.8;0.2" dur="1s" repeatCount="indefinite" />
            </rect>}
            <text x="550" y="311" fill="rgba(255,255,255,0.6)" fontSize="8" textAnchor="middle" fontFamily="Inter">Zone C-7</text>
            <text x="550" y="323" fill={riskColor[zoneC7Zone.risk]} fontSize="8" textAnchor="middle" fontFamily="monospace">{zoneC7Zone.density}%</text>

            {/* --- Parking --- */}
            <rect x="90" y="280" width="130" height="70" rx="3"
                fill={`rgba(96,165,250,${0.03 + parkingZone.density / 400})`}
                stroke={`rgba(96,165,250,${0.06 + parkingZone.density / 250})`}
                strokeWidth="1"
            />
            <text x="155" y="313" fill="rgba(255,255,255,0.5)" fontSize="8" textAnchor="middle" fontFamily="Inter">Parking</text>
            <text x="155" y="325" fill={riskColor[parkingZone.risk]} fontSize="8" textAnchor="middle" fontFamily="monospace">{parkingZone.density}%</text>

            {/* routes */}
            <path d="M200 160 Q250 170 280 130" stroke="rgba(6,214,242,0.12)" strokeWidth="1.5" strokeDasharray="5 4" fill="none" />
            <path d="M440 130 Q530 145 620 187" stroke="rgba(251,191,36,0.15)" strokeWidth="1.5" strokeDasharray="5 4" fill="none" />
            <path d="M360 180 Q400 260 500 310" stroke="rgba(167,139,250,0.1)" strokeWidth="1" strokeDasharray="4 4" fill="none" />
            <path d="M220 280 Q240 240 280 200" stroke="rgba(96,165,250,0.1)" strokeWidth="1" strokeDasharray="4 4" fill="none" />

            {/* Animated shuttle dots */}
            {(phase === "arrival" || phase === "peak" || phase === "event" || phase === "dispersal") && (
                <>
                    <circle r="4" fill="#06d6f2" opacity="0.8">
                        <animateMotion dur="3s" repeatCount="indefinite" path="M200 160 Q250 170 280 180" />
                    </circle>
                    <circle r="4" fill="#06d6f2" opacity="0.6">
                        <animateMotion dur="4s" repeatCount="indefinite" begin="1s" path="M440 130 Q530 145 620 187" />
                    </circle>
                    <circle r="3" fill="#34d399" opacity="0.7">
                        <animateMotion dur="5s" repeatCount="indefinite" begin="2s" path="M220 280 Q240 240 280 200" />
                    </circle>
                </>
            )}

            {/* Legend */}
            <g transform="translate(630,350)">
                {[{ c: "#34d399", l: "Low" }, { c: "#fbbf24", l: "Med" }, { c: "#f87171", l: "High" }].map((l, i) => (
                    <g key={l.l} transform={`translate(${i * 52},0)`}>
                        <rect width="10" height="10" rx="2" fill={`${l.c}30`} stroke={l.c} strokeWidth="0.8" />
                        <text x="14" y="9" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="Inter">{l.l}</text>
                    </g>
                ))}
            </g>
        </svg>
    );
}

// ── Main simulation component ─────────────────────────────────────────────────
function SimulationContent() {
    const router = useRouter();
    const params = useSearchParams();

    const eventRaw = params.get("event");
    const event = eventRaw ? JSON.parse(decodeURIComponent(eventRaw)) : null;

    const [phaseIdx, setPhaseIdx] = useState(0);
    const [phaseProgress, setPhaseProgress] = useState(0);
    const [running, setRunning] = useState(false);
    const [advisories, setAdvisories] = useState<Advisory[]>([]);
    const [loadingAdvisory, setLoadingAdvisory] = useState(false);
    const [lastAdvisoryPhase, setLastAdvisoryPhase] = useState<Phase | null>(null);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const advisoryLock = useRef(false);

    const currentPhaseDef = PHASES[Math.min(phaseIdx, PHASES.length - 1)];
    const phase = currentPhaseDef.id;
    const metrics = metricsForPhase(phase, event?.attendees ?? 1000, phaseProgress);
    const zones = zonesForPhase(phase, phaseProgress, event?.venue ?? "Venue");
    const isComplete = phase === "complete";

    // Advance simulation
    const tick = useCallback(() => {
        setPhaseProgress(prev => {
            const next = prev + 0.025;
            if (next >= 1) {
                setPhaseIdx(p => {
                    const nextIdx = Math.min(p + 1, PHASES.length - 1);
                    if (nextIdx === PHASES.length - 1) setRunning(false);
                    return nextIdx;
                });
                return 0;
            }
            return next;
        });
    }, []);

    useEffect(() => {
        if (running) {
            timerRef.current = setInterval(tick, 200);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [running, tick]);

    // Fetch AI advisory when phase changes
    useEffect(() => {
        if (!running || !event) return;
        if (phase === lastAdvisoryPhase || advisoryLock.current) return;
        if (phase === "complete") return;

        advisoryLock.current = true;
        setLastAdvisoryPhase(phase);
        setLoadingAdvisory(true);

        fetch("/api/simulation-advisory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event, phase, currentMetrics: metrics }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.advisory) {
                    setAdvisories(prev => [{ text: data.advisory, phase, timestamp: new Date() }, ...prev].slice(0, 10));
                }
            })
            .finally(() => {
                setLoadingAdvisory(false);
                advisoryLock.current = false;
            });
    }, [phase, running]); // eslint-disable-line

    function resetSim() {
        if (timerRef.current) clearInterval(timerRef.current);
        setRunning(false);
        setPhaseIdx(0);
        setPhaseProgress(0);
        setAdvisories([]);
        setLastAdvisoryPhase(null);
    }

    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                <AlertTriangle size={40} className="text-warning opacity-50" />
                <p className="text-text-muted">No event data provided.</p>
                <button onClick={() => router.push("/dashboard/events")} className="btn-primary text-sm py-2 px-4">
                    ← Back to Events
                </button>
            </div>
        );
    }

    const impactColor: Record<string, string> = { low: "#34d399", medium: "#fbbf24", high: "#f87171", critical: "#f87171" };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push("/dashboard/events")}
                        className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-all">
                        <ChevronLeft size={16} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Radio size={14} className={running ? "text-success animate-pulse" : "text-text-muted"} />
                            <h1 className="text-xl font-bold text-text-primary">{event.name}</h1>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ color: impactColor[event.impact], background: `${impactColor[event.impact]}15`, border: `1px solid ${impactColor[event.impact]}30` }}>
                                {event.impact?.toUpperCase()} IMPACT
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-text-muted mt-0.5">
                            <span className="flex items-center gap-1"><Clock size={9} /> {event.startTime} – {event.endTime}</span>
                            <span className="flex items-center gap-1"><MapPin size={9} /> {event.venue}</span>
                            <span className="flex items-center gap-1"><Users size={9} /> {parseInt(event.attendees).toLocaleString()} attendees</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={resetSim} disabled={running}
                        className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-all disabled:opacity-40">
                        <RotateCcw size={15} />
                    </button>
                    <button
                        id="sim-play-pause"
                        onClick={() => setRunning(r => !r)}
                        disabled={isComplete}
                        className="flex items-center gap-2 btn-primary text-xs py-2.5 px-5 disabled:opacity-50"
                    >
                        {running ? <><Pause size={13} /> Pause</> : isComplete ? <><CheckCircle2 size={13} /> Complete</> : <><Play size={13} /> {phaseIdx === 0 && phaseProgress === 0 ? "Run Simulation" : "Resume"}</>}
                    </button>
                </div>
            </div>

            {/* Phase progress bar */}
            <div className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Activity size={13} className={running ? "text-success animate-pulse" : "text-text-muted"} />
                        <span className="text-xs font-semibold text-text-primary">{currentPhaseDef.label}</span>
                    </div>
                    <span className="text-[10px] text-text-muted">{currentPhaseDef.description}</span>
                </div>
                {/* Phase stepper */}
                <div className="flex items-center gap-1">
                    {PHASES.map((p, i) => (
                        <div key={p.id} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full h-1.5 rounded-full overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.06)" }}>
                                <motion.div className="h-full rounded-full"
                                    animate={{ width: i < phaseIdx ? "100%" : i === phaseIdx ? `${phaseProgress * 100}%` : "0%" }}
                                    style={{ background: i < phaseIdx ? "#34d399" : "#06d6f2" }}
                                    transition={{ duration: 0.2 }}
                                />
                            </div>
                            <span className={`text-[8px] text-center leading-tight ${i === phaseIdx ? "text-cyan" : i < phaseIdx ? "text-success/60" : "text-text-muted/30"}`}>
                                {p.label.split(" ")[0]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main grid */}
            <div className="grid lg:grid-cols-3 gap-5">
                {/* Live map */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="glass-card rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-cyan" />
                                <span className="text-sm font-semibold text-text-primary">Live Campus Density Map</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-text-muted">
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                    {running ? "Simulation Live" : "Paused"}
                                </span>
                            </div>
                        </div>
                        <div className="aspect-[16/9] bg-[#080810]">
                            <CampusMap zones={zones} phase={phase} />
                        </div>
                    </div>

                    {/* Zone grid */}
                    <div className="grid grid-cols-5 gap-2">
                        {zones.map(z => (
                            <div key={z.name} className="rounded-xl p-3 text-center"
                                style={{ background: riskBg[z.risk], border: `1px solid ${riskColor[z.risk]}25` }}>
                                <div className="text-[9px] font-medium text-text-muted mb-1 truncate">{z.name}</div>
                                <div className="text-base font-bold" style={{ color: riskColor[z.risk] }}>{z.density}%</div>
                                <div className="text-[8px] text-text-muted mt-0.5">{z.crowdCount}</div>
                                {/* Bar */}
                                <div className="w-full h-0.5 rounded-full mt-1.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                                    <motion.div className="h-full rounded-full" animate={{ width: `${z.density}%` }}
                                        style={{ background: riskColor[z.risk] }} transition={{ duration: 0.5 }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Metrics row */}
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { icon: Users, label: "Population", value: metrics.population.toLocaleString(), delta: metrics.populationDelta, color: "text-cyan", bg: "bg-cyan/10" },
                            { icon: Car, label: "Vehicles", value: metrics.vehicles.toString(), delta: null, color: "text-warning", bg: "bg-warning/10" },
                            { icon: Zap, label: "Energy", value: `${metrics.energy} MW`, delta: null, color: "text-accent-purple", bg: "bg-accent-purple/10" },
                            { icon: Activity, label: "Shuttle Use", value: `${metrics.shuttleUtil}%`, delta: null, color: "text-success", bg: "bg-success/10" },
                        ].map(m => (
                            <div key={m.label} className="glass-card rounded-xl p-4">
                                <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center mb-2`}>
                                    <m.icon size={14} className={m.color} />
                                </div>
                                <div className="text-lg font-bold text-text-primary">{m.value}</div>
                                <div className="flex items-center justify-between mt-0.5">
                                    <span className="text-[9px] text-text-muted">{m.label}</span>
                                    {m.delta !== null && (
                                        <span className={`text-[9px] font-bold flex items-center gap-0.5 ${m.delta > 0 ? "text-success" : m.delta < 0 ? "text-danger" : "text-text-muted"}`}>
                                            {m.delta > 0 ? <ArrowUpRight size={9} /> : m.delta < 0 ? <ArrowDownRight size={9} /> : null}
                                            {Math.abs(m.delta).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Advisory panel */}
                <div className="space-y-4">
                    {/* Live advisory */}
                    <div className="glass-card rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-cyan" />
                                <span className="text-xs font-semibold text-text-primary">AI Live Advisory</span>
                            </div>
                            {loadingAdvisory && <Loader2 size={12} className="text-cyan animate-spin" />}
                        </div>
                        <div className="p-4 min-h-[180px]">
                            <AnimatePresence mode="wait">
                                {advisories.length > 0 ? (
                                    <motion.div key={advisories[0].phase}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-cyan/60">{advisories[0].phase}</span>
                                            <span className="text-[9px] text-text-muted/50">
                                                {advisories[0].timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                            </span>
                                        </div>
                                        <div>{renderAdvisory(advisories[0].text)}</div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center h-32 gap-3 text-center">
                                        {running ? (
                                            <>
                                                <Loader2 size={20} className="text-cyan/40 animate-spin" />
                                                <p className="text-[11px] text-text-muted">Generating advisory…</p>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={20} className="text-cyan/20" />
                                                <p className="text-[11px] text-text-muted">Start the simulation to receive live AI guidance</p>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Gate + Parking status */}
                    <div className="glass-card rounded-xl p-4 space-y-3">
                        <div className="text-[10px] font-bold tracking-widest uppercase text-text-muted/50 mb-2">Gate & Parking</div>
                        <div className="space-y-2">
                            {[
                                { label: "Gate B Load", value: metrics.gateBLoad, warn: 75 },
                                { label: "Parking Usage", value: metrics.parking, warn: 80 },
                            ].map(g => (
                                <div key={g.label}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-text-muted">{g.label}</span>
                                        <span className="text-[10px] font-mono font-bold" style={{ color: g.value > g.warn ? "#f87171" : g.value > g.warn * 0.8 ? "#fbbf24" : "#34d399" }}>
                                            {g.value}%
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                                        <motion.div className="h-full rounded-full"
                                            animate={{ width: `${g.value}%` }}
                                            style={{ background: g.value > g.warn ? "#f87171" : g.value > g.warn * 0.8 ? "#fbbf24" : "#34d399" }}
                                            transition={{ duration: 0.4 }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Advisory history */}
                    {advisories.length > 1 && (
                        <div className="glass-card rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-border">
                                <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted/50">Advisory History</span>
                            </div>
                            <div className="divide-y divide-border/40 max-h-[240px] overflow-y-auto">
                                {advisories.slice(1).map((a, i) => (
                                    <div key={i} className="px-4 py-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted/50">{a.phase}</span>
                                            <span className="text-[9px] text-text-muted/30">
                                                {a.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-text-muted/60 leading-relaxed line-clamp-2">{a.text.slice(0, 120)}…</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Complete banner */}
                    {isComplete && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="rounded-xl p-4 text-center"
                            style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
                            <CheckCircle2 size={24} className="text-success mx-auto mb-2" />
                            <p className="text-sm font-bold text-success">Simulation Complete</p>
                            <p className="text-[10px] text-text-muted mt-1">{advisories.length} AI advisories generated</p>
                            <button onClick={resetSim} className="mt-3 text-[11px] text-cyan hover:underline flex items-center gap-1 mx-auto">
                                <RotateCcw size={10} /> Run again
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default function SimulatePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={24} className="text-cyan animate-spin" />
            </div>
        }>
            <SimulationContent />
        </Suspense>
    );
}
