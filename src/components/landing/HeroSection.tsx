"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const ParticleField = dynamic(() => import("./ParticleField"), { ssr: false });

const bootSequence = [
    { text: "AATHRA KERNEL v2.4.1 initializing...", delay: 300 },
    { text: "Loading neural mesh [847 nodes detected]", delay: 600 },
    { text: "Mobility intelligence module .............. ONLINE", delay: 400 },
    { text: "Safety immune system ...................... ONLINE", delay: 350 },
    { text: "Behavioral nudging engine ................. ONLINE", delay: 300 },
    { text: "Predictive planning core .................. ONLINE", delay: 350 },
    { text: "Digital twin sync ......................... 100%", delay: 300 },
    { text: "Campus neural link ........................ ACTIVE", delay: 250 },
    { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", delay: 200 },
    { text: "SYSTEM READY — All subsystems operational.", delay: 400 },
];

const orbitalData = [
    { label: "MOBILITY", value: "ACTIVE", angle: -60, distance: 280, color: "#06d6f2" },
    { label: "SAFETY", value: "SHIELD UP", angle: 0, distance: 310, color: "#a78bfa" },
    { label: "NUDGING", value: "67% ADOPT", angle: 60, distance: 280, color: "#22d3ee" },
    { label: "PLANNING", value: "SIM READY", angle: 130, distance: 290, color: "#60a5fa" },
    { label: "ENERGY", value: "2.34 MW", angle: -130, distance: 290, color: "#34d399" },
];

export default function HeroSection() {
    const [bootLines, setBootLines] = useState<string[]>([]);
    const [bootComplete, setBootComplete] = useState(false);
    const [coreVisible, setCoreVisible] = useState(false);

    useEffect(() => {
        let lineIndex = 0;
        let timeAccum = 800; // initial delay

        const timers: ReturnType<typeof setTimeout>[] = [];

        // Start core visualization early
        timers.push(setTimeout(() => setCoreVisible(true), 400));

        bootSequence.forEach((line, i) => {
            timeAccum += line.delay;
            timers.push(
                setTimeout(() => {
                    setBootLines((prev) => [...prev, line.text]);
                    if (i === bootSequence.length - 1) {
                        setTimeout(() => setBootComplete(true), 600);
                    }
                }, timeAccum)
            );
        });

        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <section className="relative min-h-screen flex flex-col overflow-hidden bg-background">
            {/* Three.js Background — behind everything */}
            <div className="absolute inset-0 z-0 opacity-60">
                <ParticleField />
            </div>

            {/* Gradient overlays */}
            <div className="absolute inset-0 z-[1] pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/40 to-background" />
                <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />
            </div>

            {/* ═══════════ TOP STATUS BAR ═══════════ */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="relative z-10 flex items-center justify-between px-8 pt-24 pb-4"
            >
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
                        <span className="text-[10px] font-mono text-cyan/70 tracking-widest">
                            AATHRA://KERNEL
                        </span>
                    </div>
                    <span className="text-[10px] font-mono text-text-muted/30">│</span>
                    <span className="text-[10px] font-mono text-text-muted/40">
                        SESSION 0x7F2A · PID 1
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-text-muted/40">
                        LAT 13.0827° N · LNG 80.2707° E
                    </span>
                    <span className="text-[10px] font-mono text-text-muted/30">│</span>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute h-full w-full rounded-full bg-success opacity-50" />
                            <span className="relative rounded-full h-1.5 w-1.5 bg-success" />
                        </span>
                        <span className="text-[10px] font-mono text-success/70">NOMINAL</span>
                    </div>
                </div>
            </motion.div>

            {/* ═══════════ MAIN CONTENT ═══════════ */}
            <div className="relative z-10 flex-1 flex items-center">
                <div className="w-full max-w-[1400px] mx-auto px-8">
                    <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 items-center">

                        {/* ──── LEFT: Identity + CTA ──── */}
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            animate={{ opacity: coreVisible ? 1 : 0, x: coreVisible ? 0 : -40 }}
                            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-8"
                        >
                            {/* Product identity */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-6 h-px bg-gradient-to-r from-cyan to-transparent" />
                                    <span className="text-[10px] font-mono text-cyan/60 tracking-[4px] uppercase">
                                        Urban Operating System
                                    </span>
                                </div>

                                <h1 className="text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
                                    <span className="text-text-primary block">Aathra</span>
                                    <span className="block mt-1 bg-gradient-to-r from-cyan via-electric to-accent-purple bg-clip-text text-transparent">
                                        OS
                                    </span>
                                </h1>

                                <p className="mt-6 text-sm text-text-secondary/60 leading-relaxed max-w-sm font-light">
                                    The sentient kernel that transforms urban campuses into
                                    self-orchestrating intelligent environments. One system
                                    that senses, predicts, decides, and evolves.
                                </p>
                            </div>

                            {/* CTA — styled as system commands */}
                            <div className="space-y-3">
                                <Link
                                    href="/dashboard"
                                    className="group flex items-center gap-4 w-fit"
                                >
                                    <span className="text-[10px] font-mono text-cyan/40 group-hover:text-cyan/70 transition-colors">
                                        $
                                    </span>
                                    <span className="relative px-6 py-3 rounded-lg overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan/10 to-cyan/5 border border-cyan/15 rounded-lg group-hover:border-cyan/30 group-hover:bg-cyan/15 transition-all duration-500" />
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[0_0_30px_rgba(6,214,242,0.15)]" />
                                        <span className="relative text-sm font-medium text-cyan flex items-center gap-3">
                                            enter --command-center
                                            <motion.span
                                                animate={{ x: [0, 4, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="text-cyan/50"
                                            >
                                                →
                                            </motion.span>
                                        </span>
                                    </span>
                                </Link>

                                <Link
                                    href="#architecture"
                                    className="group flex items-center gap-4 w-fit"
                                >
                                    <span className="text-[10px] font-mono text-text-muted/30 group-hover:text-text-muted/50 transition-colors">
                                        $
                                    </span>
                                    <span className="px-6 py-3 text-sm text-text-muted/50 hover:text-text-secondary/70 transition-colors font-mono">
                                        view --architecture
                                    </span>
                                </Link>
                            </div>

                            {/* Inline metrics */}
                            <div className="flex gap-8 pt-4 border-t border-white/[0.03]">
                                {[
                                    { label: "UPTIME", value: "99.97%" },
                                    { label: "LATENCY", value: "<12ms" },
                                    { label: "NODES", value: "847" },
                                ].map((m) => (
                                    <motion.div
                                        key={m.label}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 2.5 }}
                                    >
                                        <div className="text-lg font-bold font-mono text-text-primary/80 tracking-tight">
                                            {m.value}
                                        </div>
                                        <div className="text-[9px] font-mono text-text-muted/30 tracking-[2px] mt-0.5">
                                            {m.label}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* ──── CENTER: Neural Core ──── */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{
                                opacity: coreVisible ? 1 : 0,
                                scale: coreVisible ? 1 : 0.5,
                            }}
                            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                            className="relative flex items-center justify-center"
                            style={{ width: 420, height: 420 }}
                        >
                            {/* Outer ring pulse */}
                            <motion.div
                                animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 rounded-full border border-cyan/10"
                            />
                            <motion.div
                                animate={{ scale: [1, 1.08, 1], opacity: [0.05, 0.12, 0.05] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute -inset-6 rounded-full border border-accent-purple/5"
                            />

                            {/* Core glow */}
                            <div className="absolute inset-[60px] rounded-full bg-gradient-to-b from-cyan/[0.04] to-transparent blur-xl" />
                            <div className="absolute inset-[100px] rounded-full bg-gradient-to-b from-cyan/[0.06] to-transparent blur-2xl" />

                            {/* Core ring structure */}
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 420 420" fill="none">
                                {/* Outer orbit */}
                                <circle cx="210" cy="210" r="195" stroke="rgba(6,214,242,0.06)" strokeWidth="0.5" />
                                <circle cx="210" cy="210" r="170" stroke="rgba(6,214,242,0.04)" strokeWidth="0.5" />
                                <circle cx="210" cy="210" r="140" stroke="rgba(167,139,250,0.04)" strokeWidth="0.5" />
                                <circle cx="210" cy="210" r="105" stroke="rgba(6,214,242,0.06)" strokeWidth="0.5" />
                                <circle cx="210" cy="210" r="65" stroke="rgba(6,214,242,0.08)" strokeWidth="0.5" />

                                {/* Rotating arc indicators */}
                                <g>
                                    <animateTransform attributeName="transform" type="rotate" from="0 210 210" to="360 210 210" dur="20s" repeatCount="indefinite" />
                                    <path d="M210 15 A195 195 0 0 1 370 100" stroke="rgba(6,214,242,0.15)" strokeWidth="1" strokeLinecap="round" />
                                </g>
                                <g>
                                    <animateTransform attributeName="transform" type="rotate" from="180 210 210" to="-180 210 210" dur="30s" repeatCount="indefinite" />
                                    <path d="M210 40 A170 170 0 0 1 350 130" stroke="rgba(167,139,250,0.1)" strokeWidth="0.8" strokeLinecap="round" />
                                </g>
                                <g>
                                    <animateTransform attributeName="transform" type="rotate" from="90 210 210" to="450 210 210" dur="15s" repeatCount="indefinite" />
                                    <path d="M210 70 A140 140 0 0 1 320 145" stroke="rgba(52,211,153,0.08)" strokeWidth="0.8" strokeLinecap="round" />
                                </g>

                                {/* Center kernel */}
                                <circle cx="210" cy="210" r="28" fill="rgba(6,214,242,0.03)" stroke="rgba(6,214,242,0.15)" strokeWidth="0.5" />
                                <circle cx="210" cy="210" r="8" fill="rgba(6,214,242,0.3)">
                                    <animate attributeName="r" values="6;10;6" dur="3s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
                                </circle>

                                {/* Data points on orbits */}
                                {[
                                    { orbit: 195, angle: 45, size: 3, color: "6,214,242" },
                                    { orbit: 195, angle: 200, size: 2.5, color: "167,139,250" },
                                    { orbit: 170, angle: 120, size: 2.5, color: "6,214,242" },
                                    { orbit: 170, angle: 310, size: 2, color: "52,211,153" },
                                    { orbit: 140, angle: 70, size: 2, color: "96,165,250" },
                                    { orbit: 140, angle: 250, size: 2.5, color: "6,214,242" },
                                    { orbit: 105, angle: 30, size: 2, color: "167,139,250" },
                                    { orbit: 105, angle: 180, size: 2, color: "6,214,242" },
                                ].map((pt, i) => {
                                    const rad = (pt.angle * Math.PI) / 180;
                                    const cx = 210 + Math.cos(rad) * pt.orbit;
                                    const cy = 210 + Math.sin(rad) * pt.orbit;
                                    return (
                                        <g key={i}>
                                            <circle cx={cx} cy={cy} r={pt.size * 3} fill={`rgba(${pt.color},0.06)`} />
                                            <circle cx={cx} cy={cy} r={pt.size} fill={`rgba(${pt.color},0.7)`}>
                                                <animate attributeName="opacity" values="0.4;1;0.4" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                                            </circle>
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Core label */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: bootComplete ? 1 : 0 }}
                                    transition={{ duration: 1 }}
                                    className="text-center"
                                >
                                    <div className="text-[9px] font-mono text-cyan/40 tracking-[4px] uppercase">KERNEL</div>
                                    <div className="text-[9px] font-mono text-cyan/25 tracking-[2px] mt-1">ACTIVE</div>
                                </motion.div>
                            </div>

                            {/* Orbital labels */}
                            <AnimatePresence>
                                {bootComplete &&
                                    orbitalData.map((item, i) => {
                                        const rad = (item.angle * Math.PI) / 180;
                                        const x = Math.cos(rad) * (item.distance * 0.5);
                                        const y = Math.sin(rad) * (item.distance * 0.5);
                                        return (
                                            <motion.div
                                                key={item.label}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.12, duration: 0.5 }}
                                                className="absolute pointer-events-none"
                                                style={{
                                                    left: `calc(50% + ${x}px)`,
                                                    top: `calc(50% + ${y}px)`,
                                                    transform: "translate(-50%, -50%)",
                                                }}
                                            >
                                                <div
                                                    className="px-2.5 py-1.5 rounded-md border backdrop-blur-sm"
                                                    style={{
                                                        borderColor: `${item.color}20`,
                                                        backgroundColor: `${item.color}06`,
                                                    }}
                                                >
                                                    <div
                                                        className="text-[8px] font-mono font-bold tracking-[2px]"
                                                        style={{ color: `${item.color}90` }}
                                                    >
                                                        {item.label}
                                                    </div>
                                                    <div
                                                        className="text-[9px] font-mono mt-0.5"
                                                        style={{ color: `${item.color}50` }}
                                                    >
                                                        {item.value}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                            </AnimatePresence>
                        </motion.div>

                        {/* ──── RIGHT: System Boot Log ──── */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: coreVisible ? 1 : 0, x: coreVisible ? 0 : 40 }}
                            transition={{ duration: 1, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-6"
                        >
                            {/* System log */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-[10px] font-mono text-text-muted/30 tracking-[2px]">
                                        SYSTEM LOG
                                    </span>
                                    <div className="flex-1 h-px bg-white/[0.03]" />
                                </div>

                                <div className="font-mono text-[11px] leading-[1.8] space-y-0 max-h-[280px] overflow-hidden">
                                    {bootLines.map((line, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className={`flex items-start gap-2 ${line.includes("ONLINE")
                                                    ? "text-success/60"
                                                    : line.includes("ACTIVE") || line.includes("100%")
                                                        ? "text-cyan/60"
                                                        : line.includes("READY")
                                                            ? "text-cyan/80"
                                                            : line.includes("━")
                                                                ? "text-white/[0.06]"
                                                                : "text-text-muted/35"
                                                }`}
                                        >
                                            {!line.includes("━") && (
                                                <span className="text-text-muted/15 select-none shrink-0">
                                                    {String(i).padStart(2, "0")}
                                                </span>
                                            )}
                                            <span>{line}</span>
                                        </motion.div>
                                    ))}
                                    {/* Blinking cursor */}
                                    {!bootComplete && (
                                        <motion.span
                                            animate={{ opacity: [1, 0, 1] }}
                                            transition={{ duration: 0.8, repeat: Infinity }}
                                            className="inline-block w-1.5 h-3.5 bg-cyan/40 ml-6"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Post-boot system status */}
                            <AnimatePresence>
                                {bootComplete && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6 }}
                                        className="space-y-3 pt-4 border-t border-white/[0.03]"
                                    >
                                        <div className="text-[10px] font-mono text-text-muted/30 tracking-[2px] mb-3">
                                            SUBSYSTEM STATUS
                                        </div>
                                        {[
                                            { name: "Neural Mesh", status: "SYNCHRONIZED", color: "text-success/60" },
                                            { name: "Data Fabric", status: "STREAMING", color: "text-cyan/60" },
                                            { name: "Decision Engine", status: "340 ops/s", color: "text-accent-purple/60" },
                                            { name: "Campus Link", status: "2.4M evt/s", color: "text-electric/60" },
                                        ].map((sys, i) => (
                                            <motion.div
                                                key={sys.name}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 * i }}
                                                className="flex items-center justify-between"
                                            >
                                                <span className="text-[10px] font-mono text-text-muted/35">
                                                    {sys.name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-mono ${sys.color}`}>
                                                        {sys.status}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-success/60" />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ═══════════ BOTTOM STRIP ═══════════ */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: bootComplete ? 1 : 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 px-8 py-5 flex items-center justify-between border-t border-white/[0.02]"
            >
                <div className="flex items-center gap-6">
                    <span className="text-[9px] font-mono text-text-muted/20 tracking-[2px]">
                        AATHRA OS v2.4.1
                    </span>
                    <span className="w-px h-3 bg-white/[0.04]" />
                    <span className="text-[9px] font-mono text-text-muted/20">
                        © 2026 AATHRA SYSTEMS
                    </span>
                </div>

                <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex flex-col items-center gap-1"
                >
                    <div className="w-4 h-6 rounded-full border border-white/[0.06] flex justify-center pt-1">
                        <div className="w-0.5 h-1 rounded-full bg-cyan/30" />
                    </div>
                </motion.div>

                <div className="flex items-center gap-6">
                    <span className="text-[9px] font-mono text-text-muted/20">
                        {orbitalData.length} MODULES ACTIVE
                    </span>
                    <span className="w-px h-3 bg-white/[0.04]" />
                    <span className="text-[9px] font-mono text-text-muted/20 tracking-[2px]">
                        SECURE CHANNEL
                    </span>
                </div>
            </motion.div>
        </section>
    );
}
