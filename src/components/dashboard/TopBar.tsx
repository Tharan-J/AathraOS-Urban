"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, User, Clock, ChevronDown, X } from "lucide-react";

export default function TopBar() {
    const [searchOpen, setSearchOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    const dateStr = now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <header className="h-16 glass border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
            {/* Left: Status */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
                    </span>
                    <span className="text-xs font-medium text-success">System Online</span>
                </div>
                <span className="w-px h-4 bg-border-light hidden sm:block" />
                <div className="hidden sm:flex items-center gap-2 text-xs text-text-muted">
                    <Clock size={12} />
                    <span className="font-mono">{timeStr}</span>
                    <span>·</span>
                    <span>{dateStr}</span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                    <button
                        onClick={() => setSearchOpen(!searchOpen)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-elevated transition-all"
                    >
                        <Search size={16} />
                    </button>

                    <AnimatePresence>
                        {searchOpen && (
                            <motion.div
                                initial={{ opacity: 0, width: 0, x: 20 }}
                                animate={{ opacity: 1, width: 280, x: 0 }}
                                exit={{ opacity: 0, width: 0, x: 20 }}
                                className="absolute right-0 top-0 h-9 overflow-hidden"
                            >
                                <div className="flex items-center h-full bg-surface-elevated border border-border-light rounded-lg">
                                    <Search size={14} className="text-text-muted ml-3 flex-shrink-0" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Search commands..."
                                        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted/50 px-2 py-2 focus:outline-none"
                                    />
                                    <button
                                        onClick={() => setSearchOpen(false)}
                                        className="px-2 text-text-muted hover:text-text-secondary"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-elevated transition-all relative"
                    >
                        <Bell size={16} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger" />
                    </button>

                    <AnimatePresence>
                        {notifOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-12 w-80 glass-card rounded-xl overflow-hidden shadow-2xl shadow-black/40"
                            >
                                <div className="px-4 py-3 border-b border-border">
                                    <span className="text-sm font-semibold text-text-primary">Notifications</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {[
                                        { text: "Emergency Green Corridor activated — North lane", type: "danger", time: "just now" },
                                        { text: "PCU spike detected — East road (31.5 PCU)", type: "warning", time: "2m ago" },
                                        { text: "Signal cycle optimized — 4 lanes balanced", type: "success", time: "5m ago" },
                                        { text: "Ambulance detected in South feed", type: "danger", time: "8m ago" },
                                    ].map((n, i) => (
                                        <div key={i} className="px-4 py-3 border-b border-border/50 hover:bg-surface-elevated/50 transition-colors cursor-pointer">
                                            <div className="flex items-start gap-3">
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.type === "warning" ? "bg-warning" : n.type === "danger" ? "bg-danger" : "bg-success"
                                                        }`}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-text-primary">{n.text}</p>
                                                    <span className="text-[10px] text-text-muted">{n.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Profile */}
                <div className="relative ml-2">
                    <button
                        onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-elevated transition-all"
                    >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan/30 to-accent-purple/30 flex items-center justify-center">
                            <User size={14} className="text-text-primary" />
                        </div>
                        <div className="hidden sm:block text-left">
                            <div className="text-xs font-medium text-text-primary">Admin</div>
                            <div className="text-[10px] text-text-muted">Operator</div>
                        </div>
                        <ChevronDown size={12} className="text-text-muted hidden sm:block" />
                    </button>

                    <AnimatePresence>
                        {profileOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-12 w-48 glass-card rounded-xl overflow-hidden shadow-2xl shadow-black/40"
                            >
                                {["Profile", "Settings", "Help", "Logout"].map((item) => (
                                    <button
                                        key={item}
                                        className="w-full text-left px-4 py-2.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
