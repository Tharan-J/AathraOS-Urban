"use client";

import { motion, Variants } from "framer-motion";
import { useRef, useState } from "react";

const domains = [
    {
        title: "Mobility Intelligence",
        shortDesc: "Predict · Optimize · Route",
        gradient: "from-cyan via-cyan/80 to-blue",
        glowColor: "rgba(6, 214, 242, 0.15)",
        borderGlow: "hover:shadow-[0_0_60px_rgba(6,214,242,0.1)]",
        icon: (
            <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
                {/* Flow arrows */}
                <path d="M16 32 Q24 22 32 32 Q40 42 48 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                <path d="M12 38 Q22 28 32 38 Q42 48 52 38" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
                <path d="M14 26 Q24 18 34 26 Q44 34 54 26" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
                {/* Nodes */}
                <circle cx="16" cy="32" r="2.5" fill="currentColor" opacity="0.9" />
                <circle cx="32" cy="32" r="3" fill="currentColor" />
                <circle cx="48" cy="32" r="2.5" fill="currentColor" opacity="0.9" />
                <circle cx="24" cy="27" r="1.5" fill="currentColor" opacity="0.5" />
                <circle cx="40" cy="37" r="1.5" fill="currentColor" opacity="0.5" />
            </svg>
        ),
        stats: [
            { label: "Flow Prediction", value: "94%" },
            { label: "Route Efficiency", value: "3.2x" },
        ],
    },
    {
        title: "Safety Immune System",
        shortDesc: "Detect · Prevent · Protect",
        gradient: "from-accent-purple via-accent-purple/80 to-accent-pink",
        glowColor: "rgba(167, 139, 250, 0.15)",
        borderGlow: "hover:shadow-[0_0_60px_rgba(167,139,250,0.1)]",
        icon: (
            <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
                {/* Shield shape */}
                <path d="M32 8 L52 18 V36 C52 48 32 56 32 56 C32 56 12 48 12 36 V18 L32 8Z"
                    stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
                <path d="M32 14 L46 22 V34 C46 43 32 49 32 49 C32 49 18 43 18 34 V22 L32 14Z"
                    stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                {/* Check / eye */}
                <circle cx="32" cy="30" r="6" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                <circle cx="32" cy="30" r="2" fill="currentColor" opacity="0.8" />
                {/* Scan lines */}
                <line x1="20" y1="26" x2="44" y2="26" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                <line x1="20" y1="34" x2="44" y2="34" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
            </svg>
        ),
        stats: [
            { label: "Threat Detection", value: "99.2%" },
            { label: "Response Time", value: "<8s" },
        ],
    },
    {
        title: "Behavioral Nudging",
        shortDesc: "Influence · Guide · Adapt",
        gradient: "from-neon-green via-neon-green/80 to-success",
        glowColor: "rgba(34, 211, 238, 0.15)",
        borderGlow: "hover:shadow-[0_0_60px_rgba(34,211,238,0.1)]",
        icon: (
            <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
                {/* Brain-like network */}
                <circle cx="32" cy="22" r="3" fill="currentColor" opacity="0.8" />
                <circle cx="20" cy="32" r="2.5" fill="currentColor" opacity="0.6" />
                <circle cx="44" cy="32" r="2.5" fill="currentColor" opacity="0.6" />
                <circle cx="24" cy="44" r="2" fill="currentColor" opacity="0.5" />
                <circle cx="40" cy="44" r="2" fill="currentColor" opacity="0.5" />
                <circle cx="32" cy="36" r="2" fill="currentColor" opacity="0.4" />
                {/* Connections */}
                <line x1="32" y1="22" x2="20" y2="32" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                <line x1="32" y1="22" x2="44" y2="32" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                <line x1="20" y1="32" x2="24" y2="44" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <line x1="44" y1="32" x2="40" y2="44" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <line x1="20" y1="32" x2="32" y2="36" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                <line x1="44" y1="32" x2="32" y2="36" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                {/* Waves */}
                <path d="M14 50 Q22 44 32 50 Q42 56 50 50" stroke="currentColor" strokeWidth="0.8" opacity="0.25" strokeLinecap="round" />
                <path d="M18 54 Q26 48 32 54 Q38 60 46 54" stroke="currentColor" strokeWidth="0.5" opacity="0.15" strokeLinecap="round" />
            </svg>
        ),
        stats: [
            { label: "Adoption Rate", value: "67%" },
            { label: "Behavior Shift", value: "+18%" },
        ],
    },
    {
        title: "Predictive Planning",
        shortDesc: "Simulate · Forecast · Build",
        gradient: "from-electric via-electric/80 to-blue",
        glowColor: "rgba(96, 165, 250, 0.15)",
        borderGlow: "hover:shadow-[0_0_60px_rgba(96,165,250,0.1)]",
        icon: (
            <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
                {/* Isometric cube / digital twin */}
                <path d="M32 14 L50 24 L50 44 L32 54 L14 44 L14 24 Z" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                <path d="M32 14 L32 34 L50 24" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                <path d="M32 34 L14 24" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                <path d="M32 34 L32 54" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                {/* Inner structure */}
                <path d="M32 24 L42 30 L42 40 L32 46 L22 40 L22 30 Z" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                {/* Prediction dots */}
                <circle cx="32" cy="14" r="2" fill="currentColor" opacity="0.8" />
                <circle cx="50" cy="24" r="1.5" fill="currentColor" opacity="0.5" />
                <circle cx="14" cy="24" r="1.5" fill="currentColor" opacity="0.5" />
                <circle cx="32" cy="54" r="1.5" fill="currentColor" opacity="0.5" />
            </svg>
        ),
        stats: [
            { label: "Sim. Accuracy", value: "91%" },
            { label: "Scenarios / hr", value: "340" },
        ],
    },
];

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.15 } },
};

const cardAnim: Variants = {
    hidden: { opacity: 0, y: 40 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7 },
    },
};

export default function OpportunityDomains() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <section id="vision" className="py-32 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 gradient-mesh opacity-30" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-light bg-white/[0.02] backdrop-blur-sm mb-6">
                        <span className="w-1 h-1 rounded-full bg-cyan" />
                        <span className="text-[10px] font-semibold text-text-muted tracking-[3px] uppercase">
                            System Pillars
                        </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-4">
                        Four Intelligence Layers
                    </h2>
                    <p className="text-base text-text-secondary/70 max-w-lg mx-auto">
                        Each layer operates autonomously yet converges into
                        a unified urban intelligence kernel.
                    </p>
                </motion.div>

                {/* Cards */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid md:grid-cols-2 lg:grid-cols-4 gap-5"
                >
                    {domains.map((domain, i) => (
                        <motion.div
                            key={domain.title}
                            variants={cardAnim}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className={`group relative rounded-2xl cursor-pointer transition-all duration-500 ${domain.borderGlow}`}
                        >
                            {/* Card background */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-surface/80 to-surface-light/30 backdrop-blur-md border border-white/[0.04] group-hover:border-white/[0.08] transition-all duration-500" />

                            {/* Glow effect on hover */}
                            <div
                                className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                                style={{
                                    background: `radial-gradient(300px at 50% 0%, ${domain.glowColor}, transparent 70%)`,
                                }}
                            />

                            <div className="relative z-10 p-6 flex flex-col h-full">
                                {/* Icon */}
                                <div
                                    className={`w-20 h-20 mb-6 text-transparent bg-gradient-to-br ${domain.gradient} bg-clip-text transition-transform duration-500 group-hover:scale-110`}
                                    style={{ color: hoveredIndex === i ? undefined : undefined }}
                                >
                                    <div className={`bg-gradient-to-br ${domain.gradient} bg-clip-text`} style={{ color: 'inherit' }}>
                                        <div className={`text-cyan ${i === 1 ? "text-accent-purple" : i === 2 ? "text-neon-green" : i === 3 ? "text-electric" : ""
                                            }`}>
                                            {domain.icon}
                                        </div>
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="text-base font-bold text-text-primary mb-1.5">
                                    {domain.title}
                                </h3>

                                {/* Short descriptor */}
                                <p className="text-xs text-text-muted font-mono tracking-wider mb-5">
                                    {domain.shortDesc}
                                </p>

                                {/* Stats */}
                                <div className="mt-auto pt-5 border-t border-white/[0.04] grid grid-cols-2 gap-3">
                                    {domain.stats.map((stat) => (
                                        <div key={stat.label}>
                                            <div className="text-lg font-bold text-text-primary font-mono">
                                                {stat.value}
                                            </div>
                                            <div className="text-[9px] text-text-muted tracking-wider uppercase mt-0.5">
                                                {stat.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
