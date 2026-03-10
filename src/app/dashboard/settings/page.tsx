"use client";

import { motion } from "framer-motion";
import { Settings, User, Bell, Shield, Palette, Database, Globe, Key } from "lucide-react";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const anim = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const settingsSections = [
    {
        title: "Profile",
        icon: User,
        items: [
            { label: "Display Name", value: "Admin Operator", type: "text" },
            { label: "Email", value: "admin@aathra.sys", type: "text" },
            { label: "Role", value: "System Administrator", type: "badge" },
        ],
    },
    {
        title: "Notifications",
        icon: Bell,
        items: [
            { label: "Critical Alerts", value: true, type: "toggle" },
            { label: "Predictive Warnings", value: true, type: "toggle" },
            { label: "System Updates", value: false, type: "toggle" },
            { label: "Report Generation", value: true, type: "toggle" },
        ],
    },
    {
        title: "Security",
        icon: Shield,
        items: [
            { label: "Two-Factor Authentication", value: true, type: "toggle" },
            { label: "Session Timeout", value: "30 minutes", type: "text" },
            { label: "API Key", value: "ak_****_7x9m", type: "text" },
        ],
    },
];

export default function SettingsPage() {
    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-4xl">
            <motion.div variants={anim}>
                <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                    <Settings size={24} className="text-text-secondary" />
                    Settings
                </h1>
                <p className="text-sm text-text-muted mt-1">Junction API configuration and system preferences</p>
            </motion.div>

            {settingsSections.map((section) => (
                <motion.div key={section.title} variants={anim}>
                    <div className="glass-card rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                            <section.icon size={16} className="text-cyan" />
                            <h2 className="text-sm font-semibold text-text-primary">{section.title}</h2>
                        </div>
                        <div className="divide-y divide-border/50">
                            {section.items.map((item) => (
                                <div key={item.label} className="px-5 py-4 flex items-center justify-between">
                                    <span className="text-xs text-text-secondary">{item.label}</span>
                                    {item.type === "toggle" ? (
                                        <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${item.value ? "bg-cyan/30" : "bg-surface-elevated"
                                            }`}>
                                            <div className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${item.value ? "right-0.5 bg-cyan" : "left-0.5 bg-text-muted"
                                                }`} />
                                        </div>
                                    ) : item.type === "badge" ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan/10 text-cyan font-medium">
                                            {String(item.value)}
                                        </span>
                                    ) : (
                                        <span className="text-xs font-mono text-text-primary">{String(item.value)}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            ))}

            {/* System Info */}
            <motion.div variants={anim}>
                <div className="glass-card rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                        <Database size={16} className="text-text-muted" />
                        <h2 className="text-sm font-semibold text-text-primary">System Information</h2>
                    </div>
                    <div className="p-5 grid sm:grid-cols-2 gap-4">
                        {[
                            { label: "AathraOS Version", value: "v1.0.0" },
                            { label: "Junction API port", value: ":8001" },
                            { label: "YOLO Model", value: "YOLOv8n.pt" },
                            { label: "Inference FPS Target", value: "6 FPS / lane" },
                            { label: "Cycle Interval", value: "5 seconds" },
                            { label: "Emergency Hold", value: "30 seconds" },
                        ].map((info) => (
                            <div key={info.label} className="flex justify-between p-3 rounded-lg bg-surface-light/30">
                                <span className="text-[10px] text-text-muted">{info.label}</span>
                                <span className="text-[10px] font-mono text-text-secondary">{info.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
