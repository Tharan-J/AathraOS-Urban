"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    TrafficCone,
    BarChart3,
    Calendar,
    Bot,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

const coreNav = [
    { label: "Command Center", href: "/dashboard", icon: LayoutDashboard },
    { label: "Traffic Signals", href: "/dashboard/signals", icon: TrafficCone },
];

const analyticsNav = [
    { label: "Audit & Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { label: "Event Simulation", href: "/dashboard/events", icon: Calendar },
    { label: "AI Assistant", href: "/dashboard/assistant", icon: Bot },
];

const systemNav = [
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    const NavItem = ({ item }: { item: { label: string; href: string; icon: React.ComponentType<{ size?: number; className?: string }> } }) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        const isAI = item.href === "/dashboard/assistant";

        return (
            <Link
                href={item.href}
                className={`
          group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative
          ${isActive
                        ? "bg-cyan/10 text-cyan"
                        : isAI
                            ? "text-accent-purple/80 hover:bg-accent-purple/5 hover:text-accent-purple"
                            : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                    }
        `}
                title={collapsed ? item.label : undefined}
            >
                {isActive && (
                    <motion.div
                        layoutId="activeTab"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan rounded-r-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                )}
                <Icon
                    size={18}
                    className={
                        isActive
                            ? "text-cyan"
                            : isAI
                                ? "text-accent-purple/70 group-hover:text-accent-purple"
                                : "text-text-muted group-hover:text-text-secondary"
                    }
                />
                <AnimatePresence>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="whitespace-nowrap overflow-hidden"
                        >
                            {item.label}
                        </motion.span>
                    )}
                </AnimatePresence>
            </Link>
        );
    };

    const SectionLabel = ({ label }: { label: string }) => (
        <AnimatePresence>
            {!collapsed && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 pt-6 pb-2"
                >
                    <span className="text-[10px] font-semibold tracking-[2px] uppercase text-text-muted/50">
                        {label}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <motion.aside
            animate={{ width: collapsed ? 72 : 240 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 top-0 bottom-0 z-40 bg-surface/80 backdrop-blur-xl border-r border-border flex flex-col"
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-5 border-b border-border gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan/20 to-blue/10 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#06d6f2" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M2 17L12 22L22 17" stroke="#06d6f2" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M2 12L12 17L22 12" stroke="#06d6f2" strokeWidth="1.5" strokeLinejoin="round" opacity="0.6" />
                    </svg>
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col"
                        >
                            <span className="text-sm font-semibold text-text-primary whitespace-nowrap">
                                Aathra<span className="text-cyan ml-0.5 font-light">OS</span>
                            </span>
                            <span className="text-[9px] text-text-muted/60 uppercase tracking-widest font-mono whitespace-nowrap">
                                Junction Intelligence
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
                <SectionLabel label="Control" />
                {coreNav.map((item) => (
                    <NavItem key={item.href} item={item} />
                ))}

                <SectionLabel label="Analytics & AI" />
                {analyticsNav.map((item) => (
                    <NavItem key={item.href} item={item} />
                ))}

                <SectionLabel label="System" />
                {systemNav.map((item) => (
                    <NavItem key={item.href} item={item} />
                ))}
            </div>

            {/* Status footer */}
            <AnimatePresence>
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-4 py-3 border-t border-border"
                    >
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-elevated/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                            <span className="text-[10px] text-text-muted font-mono">CV ENGINE READY</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Collapse toggle + Exit */}
            <div className="border-t border-border p-3 space-y-1">
                <Link
                    href="/"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-danger hover:bg-danger/5 transition-all"
                    title={collapsed ? "Exit Dashboard" : undefined}
                >
                    <LogOut size={18} />
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="whitespace-nowrap"
                            >
                                Exit Dashboard
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Link>

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center py-2 rounded-lg text-text-muted hover:bg-surface-elevated transition-colors"
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>
        </motion.aside>
    );
}
