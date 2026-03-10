"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const steps = [
    {
        num: "01",
        title: "Sense",
        subtitle: "Data Ingestion",
        description:
            "IoT sensors, cameras, and environmental monitors stream real-time telemetry into the Aathra data fabric across the entire campus.",
        color: "#06d6f2",
        metrics: "12,400 sensors · 847 nodes",
    },
    {
        num: "02",
        title: "Predict",
        subtitle: "AI Forecasting",
        description:
            "Deep learning models forecast crowd surges, traffic bottlenecks, and safety risks up to 60 minutes ahead with 94% accuracy.",
        color: "#a78bfa",
        metrics: "94% accuracy · 60 min horizon",
    },
    {
        num: "03",
        title: "Decide",
        subtitle: "Optimization Engine",
        description:
            "Multi-objective optimization weighs safety, efficiency, comfort, and sustainability to generate optimal real-time action plans.",
        color: "#3b82f6",
        metrics: "340 decisions/sec",
    },
    {
        num: "04",
        title: "Act",
        subtitle: "Autonomous Execution",
        description:
            "Route suggestions pushed, shuttles rerouted, HVAC adjusted, signage updated — automated commands dispatched within milliseconds.",
        color: "#22d3ee",
        metrics: "<12ms execution latency",
    },
    {
        num: "05",
        title: "Learn",
        subtitle: "Continuous Evolution",
        description:
            "Feedback loops capture outcomes. Models retrain automatically, improving prediction accuracy with each cycle.",
        color: "#34d399",
        metrics: "↑ 2.3% weekly improvement",
    },
];

export default function HowItWorks() {
    const [activeStep, setActiveStep] = useState(0);

    return (
        <section id="architecture" className="py-32 relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-15" />

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
                        <span className="w-1 h-1 rounded-full bg-accent-purple" />
                        <span className="text-[10px] font-semibold text-text-muted tracking-[3px] uppercase">
                            System Architecture
                        </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-4">
                        The Intelligence Loop
                    </h2>
                    <p className="text-base text-text-secondary/70 max-w-lg mx-auto">
                        A continuous cycle where the city learns, adapts,
                        and optimizes itself autonomously.
                    </p>
                </motion.div>

                {/* Interactive Flow */}
                <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
                    {/* Step Selector */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="space-y-1"
                    >
                        {steps.map((step, i) => (
                            <button
                                key={step.num}
                                onClick={() => setActiveStep(i)}
                                className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-300 group relative ${activeStep === i
                                        ? "bg-white/[0.03]"
                                        : "hover:bg-white/[0.02]"
                                    }`}
                            >
                                {/* Active indicator */}
                                {activeStep === i && (
                                    <motion.div
                                        layoutId="activeStepIndicator"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-r-full"
                                        style={{ backgroundColor: step.color }}
                                        transition={{ type: "spring", stiffness: 350, damping: 35 }}
                                    />
                                )}

                                <div className="flex items-center gap-4">
                                    {/* Number */}
                                    <span
                                        className={`text-xs font-mono font-bold tracking-wider transition-colors duration-300 ${activeStep === i ? "" : "text-text-muted/40"
                                            }`}
                                        style={{ color: activeStep === i ? step.color : undefined }}
                                    >
                                        {step.num}
                                    </span>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`text-sm font-semibold transition-colors duration-300 ${activeStep === i ? "text-text-primary" : "text-text-muted"
                                                    }`}
                                            >
                                                {step.title}
                                            </span>
                                            <span
                                                className={`text-[10px] transition-colors duration-300 ${activeStep === i ? "text-text-muted" : "text-text-muted/40"
                                                    }`}
                                            >
                                                {step.subtitle}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Dot and connector */}
                                    <div className="relative">
                                        <div
                                            className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${activeStep === i
                                                    ? "scale-125"
                                                    : "border-text-muted/20"
                                                }`}
                                            style={{
                                                borderColor: activeStep === i ? step.color : undefined,
                                                backgroundColor: activeStep === i ? step.color : "transparent",
                                                boxShadow: activeStep === i ? `0 0 12px ${step.color}40` : "none",
                                            }}
                                        />
                                    </div>
                                </div>
                            </button>
                        ))}

                        {/* Progress line */}
                        <div className="ml-[72px] mt-3 flex items-center gap-2 text-[10px] text-text-muted/40 font-mono">
                            <div className="flex-1 h-px bg-gradient-to-r from-cyan/20 via-accent-purple/20 via-blue/20 via-neon-green/20 to-success/20" />
                            <span>∞ loop</span>
                        </div>
                    </motion.div>

                    {/* Detail Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.div
                            key={activeStep}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="rounded-2xl border border-white/[0.04] bg-surface/40 backdrop-blur-md overflow-hidden"
                        >
                            {/* Visual header */}
                            <div className="relative h-48 overflow-hidden">
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        background: `radial-gradient(ellipse at 50% 100%, ${steps[activeStep].color}12, transparent 70%)`,
                                    }}
                                />

                                {/* Animated visualization per step */}
                                <svg className="w-full h-full" viewBox="0 0 600 200" fill="none">
                                    {/* Background grid */}
                                    {Array.from({ length: 15 }, (_, i) => (
                                        <line key={`v${i}`} x1={i * 42 + 10} y1="0" x2={i * 42 + 10} y2="200"
                                            stroke={`${steps[activeStep].color}`} strokeWidth="0.3" opacity="0.06" />
                                    ))}
                                    {Array.from({ length: 6 }, (_, i) => (
                                        <line key={`h${i}`} x1="0" y1={i * 40 + 10} x2="600" y2={i * 40 + 10}
                                            stroke={`${steps[activeStep].color}`} strokeWidth="0.3" opacity="0.06" />
                                    ))}

                                    {/* Step number watermark */}
                                    <text x="500" y="160" fill={steps[activeStep].color}
                                        fontSize="120" fontWeight="900" fontFamily="Inter" opacity="0.04">
                                        {steps[activeStep].num}
                                    </text>

                                    {/* Flow visualization */}
                                    {[0, 1, 2, 3, 4].map((j) => (
                                        <circle
                                            key={j}
                                            cx={100 + j * 100}
                                            cy={100 + Math.sin(j * 1.2 + activeStep) * 30}
                                            r={activeStep === j ? 6 : 3}
                                            fill={steps[activeStep].color}
                                            opacity={activeStep === j ? 0.7 : 0.15}
                                        >
                                            <animate attributeName="opacity"
                                                values={activeStep === j ? "0.5;0.9;0.5" : "0.1;0.2;0.1"}
                                                dur="2s" repeatCount="indefinite" begin={`${j * 0.3}s`} />
                                        </circle>
                                    ))}
                                    {[0, 1, 2, 3].map((j) => (
                                        <line
                                            key={`l${j}`}
                                            x1={100 + j * 100}
                                            y1={100 + Math.sin(j * 1.2 + activeStep) * 30}
                                            x2={200 + j * 100}
                                            y2={100 + Math.sin((j + 1) * 1.2 + activeStep) * 30}
                                            stroke={steps[activeStep].color}
                                            strokeWidth="1"
                                            opacity="0.15"
                                            strokeDasharray="4 4"
                                        >
                                            <animate attributeName="stroke-dashoffset" values="8;0" dur="1s" repeatCount="indefinite" />
                                        </line>
                                    ))}
                                </svg>
                            </div>

                            {/* Content */}
                            <div className="p-8 border-t border-white/[0.04]">
                                <div className="flex items-center gap-3 mb-4">
                                    <span
                                        className="text-xs font-mono font-bold px-2 py-1 rounded-lg"
                                        style={{
                                            color: steps[activeStep].color,
                                            backgroundColor: `${steps[activeStep].color}10`,
                                        }}
                                    >
                                        STAGE {steps[activeStep].num}
                                    </span>
                                    <h3 className="text-xl font-bold text-text-primary">
                                        {steps[activeStep].title}
                                    </h3>
                                </div>

                                <p className="text-sm text-text-secondary/80 leading-relaxed mb-6 max-w-md">
                                    {steps[activeStep].description}
                                </p>

                                <div
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider"
                                    style={{
                                        color: steps[activeStep].color,
                                        backgroundColor: `${steps[activeStep].color}08`,
                                        border: `1px solid ${steps[activeStep].color}15`,
                                    }}
                                >
                                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: steps[activeStep].color }} />
                                    {steps[activeStep].metrics}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
