"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Trash2, Siren, TrendingUp, Map, Calendar } from "lucide-react";

const BACKEND = "http://localhost:8001";
const LANES = ["north", "south", "east", "west"] as const;
type LaneName = typeof LANES[number];

interface LaneData {
    vehicle_count: number;
    pcu_score: number;
    breakdown: Record<string, number>;
    emergency_detected: boolean;
    is_processing: boolean;
    fps: number;
}

interface JunctionStatus {
    signals: Record<LaneName, string>;
    active_lane: LaneName | null;
    emergency_mode: boolean;
    emergency_lane: LaneName | null;
    green_duration: number;
    cycle_count: number;
    last_update: string;
    lanes: Record<LaneName, LaneData>;
}

interface Message {
    role: "user" | "assistant";
    content: string;
    thinking?: boolean;
}

const SUGGESTED_QUERIES = [
    { icon: TrendingUp, text: "Which lane has the highest traffic load right now?", color: "#06d6f2" },
    { icon: Siren, text: "What should we do if an ambulance is detected?", color: "#ef4444" },
    { icon: Map, text: "What are best practices to reduce congestion at peak hours?", color: "#a78bfa" },
    { icon: TrendingUp, text: "Explain how the PCU signal formula works", color: "#34d399" },
    { icon: Calendar, text: "If a rally of 10,000 people happens near this junction, what's the traffic impact?", color: "#fbbf24" },
    { icon: Siren, text: "Is the current intersection overloaded?", color: "#f59e0b" },
];

function MarkdownMessage({ text }: { text: string }) {
    const lines = text.split("\n");
    return (
        <div style={{ lineHeight: 1.75 }}>
            {lines.map((line, i) => {
                if (line.startsWith("### ")) return <h3 key={i} style={{ fontSize: 13, fontWeight: 700, color: "#06d6f2", margin: "12px 0 4px" }}>{line.slice(4)}</h3>;
                if (line.startsWith("## ")) return <h2 key={i} style={{ fontSize: 14, fontWeight: 800, color: "#a78bfa", margin: "16px 0 6px" }}>{line.slice(3)}</h2>;
                if (line.startsWith("- ") || line.startsWith("• ")) {
                    const raw = line.slice(2).replace(/\*\*([^*]+)\*\*/g, (_, t) => `<strong style='color:#f0f2f5'>${t}</strong>`);
                    return (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}>
                            <span style={{ color: "#06d6f2", flexShrink: 0, marginTop: 2 }}>•</span>
                            <span style={{ fontSize: 13, color: "#9ca3af" }} dangerouslySetInnerHTML={{ __html: raw }} />
                        </div>
                    );
                }
                if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
                const withBold = line.replace(/\*\*([^*]+)\*\*/g, (_, t) => `<strong style='color:#f0f2f5'>${t}</strong>`);
                return <p key={i} style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: withBold }} />;
            })}
        </div>
    );
}

function ThinkingDots() {
    return (
        <div style={{ display: "flex", gap: 4, padding: "6px 0" }}>
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                    style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa" }}
                />
            ))}
        </div>
    );
}

export default function AIAssistantPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hello! I'm the AathraOS AI Traffic Assistant, powered by Gemini.\n\nI can help you with:\n- **Live junction status** — vehicle counts, PCU loads, signal states\n- **Emergency decision support** — green corridor activation, clearance\n- **Traffic management advisory** — signal timing, congestion analysis\n- **Event impact simulation** — crowd and vehicle flow predictions\n\nWhat would you like to know about the junction?",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [junctionData, setJunctionData] = useState<JunctionStatus | null>(null);
    const [connected, setConnected] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Fetch live junction data for context
    const fetchJunction = useCallback(async () => {
        try {
            const res = await fetch(`${BACKEND}/junction/status`);
            if (res.ok) { setJunctionData(await res.json()); setConnected(true); }
            else setConnected(false);
        } catch { setConnected(false); }
    }, []);

    useEffect(() => {
        fetchJunction();
        const t = setInterval(fetchJunction, 5000);
        return () => clearInterval(t);
    }, [fetchJunction]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage(text?: string) {
        const userText = (text ?? input).trim();
        if (!userText || loading) return;
        setInput("");

        const newMessages: Message[] = [
            ...messages.filter((m) => !m.thinking),
            { role: "user", content: userText },
        ];
        setMessages([...newMessages, { role: "assistant", content: "", thinking: true }]);
        setLoading(true);

        try {
            const res = await fetch("/api/chatbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMessages,
                    junctionData,
                }),
            });
            const data = await res.json();
            const reply = data.text || data.error || "Sorry, I couldn't process that request.";
            setMessages([...newMessages, { role: "assistant", content: reply }]);
        } catch {
            setMessages([...newMessages, { role: "assistant", content: "⚠️ Unable to reach the AI service. Please check your internet connection." }]);
        }
        setLoading(false);
    }

    function handleKey(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    }

    const totalVehicles = junctionData ? LANES.reduce((s, l) => s + (junctionData.lanes[l]?.vehicle_count ?? 0), 0) : 0;
    const totalPCU = junctionData ? LANES.reduce((s, l) => s + (junctionData.lanes[l]?.pcu_score ?? 0), 0) : 0;

    return (
        <div className="flex gap-5" style={{ height: "calc(100vh - 112px)" }}>
            {/* Left Sidebar — context + suggestions */}
            <div
                className="flex-shrink-0 flex flex-col gap-4"
                style={{ width: 260 }}
            >
                {/* Junction Context */}
                <div className="glass-card rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <span className="text-[11px] font-mono text-cyan uppercase tracking-wider">Live Junction Context</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-success animate-pulse" : "bg-danger"}`} />
                    </div>
                    <div className="p-4 space-y-3">
                        {[
                            { label: "Total Vehicles", value: totalVehicles.toString(), color: "#06d6f2" },
                            { label: "PCU Load", value: totalPCU.toFixed(1), color: "#fbbf24" },
                            { label: "Active Lane", value: junctionData?.active_lane?.toUpperCase() ?? "—", color: "#22c55e" },
                            { label: "Emergency", value: junctionData?.emergency_mode ? "ACTIVE" : "Clear", color: junctionData?.emergency_mode ? "#ef4444" : "#34d399" },
                            { label: "Signal Cycles", value: junctionData?.cycle_count?.toString() ?? "—", color: "#a78bfa" },
                        ].map((s) => (
                            <div key={s.label} className="flex items-center justify-between">
                                <span style={{ fontSize: 11, color: "#6b7280" }}>{s.label}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: s.color }}>{s.value}</span>
                            </div>
                        ))}
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 8, fontSize: 9, color: "#4b5563", fontFamily: "monospace" }}>
                            {connected ? "✓ Live data feeding Gemini context" : "✗ Backend offline — using general knowledge"}
                        </div>
                    </div>
                </div>

                {/* Suggested Questions */}
                <div className="glass-card rounded-xl overflow-hidden flex-1">
                    <div className="px-4 py-3 border-b border-border">
                        <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider">Suggested Questions</span>
                    </div>
                    <div className="p-3 space-y-1.5">
                        {SUGGESTED_QUERIES.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(q.text)}
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    textAlign: "left",
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px solid rgba(255,255,255,0.04)",
                                    borderRadius: 8,
                                    padding: "8px 10px",
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 8,
                                }}
                                onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.borderColor = `${q.color}30`; }}
                                onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.02)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.04)"; }}
                            >
                                <q.icon size={12} style={{ color: q.color, marginTop: 1, flexShrink: 0 }} />
                                <span style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }}>{q.text}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col glass-card rounded-xl overflow-hidden">
                {/* Header */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div className="flex items-center gap-3">
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.05))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Bot size={18} style={{ color: "#a78bfa" }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f2f5" }}>AathraOS AI Assistant</div>
                            <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>Gemini 2.5 Flash · Junction Intelligence</div>
                        </div>
                    </div>
                    <button
                        onClick={() => setMessages([messages[0]])}
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6b7280", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}
                    >
                        <Trash2 size={12} /> Clear chat
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{ display: "flex", gap: 12, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                                    background: msg.role === "user" ? "rgba(6,214,242,0.12)" : "rgba(167,139,250,0.12)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    border: `1px solid ${msg.role === "user" ? "rgba(6,214,242,0.2)" : "rgba(167,139,250,0.2)"}`,
                                }}>
                                    {msg.role === "user"
                                        ? <User size={15} style={{ color: "#06d6f2" }} />
                                        : <Bot size={15} style={{ color: "#a78bfa" }} />}
                                </div>
                                {/* Bubble */}
                                <div style={{
                                    maxWidth: "80%",
                                    background: msg.role === "user"
                                        ? "linear-gradient(135deg, rgba(6,214,242,0.08), rgba(6,214,242,0.04))"
                                        : "linear-gradient(135deg, rgba(18,18,26,0.9), rgba(26,26,38,0.5))",
                                    border: `1px solid ${msg.role === "user" ? "rgba(6,214,242,0.15)" : "rgba(255,255,255,0.05)"}`,
                                    borderRadius: msg.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                                    padding: "12px 16px",
                                }}>
                                    {msg.thinking ? <ThinkingDots /> : (
                                        msg.role === "assistant"
                                            ? <MarkdownMessage text={msg.content} />
                                            : <p style={{ fontSize: 13, color: "#f0f2f5", lineHeight: 1.6 }}>{msg.content}</p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{
                        display: "flex", gap: 10, alignItems: "flex-end",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 12, padding: "10px 14px",
                    }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Ask about traffic conditions, signal logic, emergency corridors…"
                            rows={1}
                            style={{
                                flex: 1, background: "none", border: "none", outline: "none",
                                resize: "none", fontSize: 13, color: "#f0f2f5",
                                fontFamily: "var(--font-inter), sans-serif",
                                maxHeight: 120, lineHeight: 1.5,
                            }}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={loading || !input.trim()}
                            style={{
                                width: 34, height: 34, borderRadius: 8, border: "none", cursor: "pointer",
                                background: loading || !input.trim()
                                    ? "rgba(255,255,255,0.05)"
                                    : "linear-gradient(135deg, #a78bfa, #7c3aed)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s", flexShrink: 0,
                            }}
                        >
                            <Send size={15} style={{ color: loading || !input.trim() ? "#4b5563" : "#fff" }} />
                        </button>
                    </div>
                    <div style={{ fontSize: 10, color: "#374151", marginTop: 6, textAlign: "center", fontFamily: "monospace" }}>
                        Press Enter to send · Shift+Enter for new line · Powered by Gemini 2.5 Flash
                    </div>
                </div>
            </div>
        </div>
    );
}
