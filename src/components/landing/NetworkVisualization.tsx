"use client";

import { useEffect, useRef } from "react";

interface Node {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    type: "hub" | "node" | "endpoint";
}

export default function NetworkVisualization() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const width = 500;
        const height = 500;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        // Create nodes
        const nodes: Node[] = [];
        // Hubs
        for (let i = 0; i < 4; i++) {
            nodes.push({
                x: 100 + Math.random() * 300,
                y: 100 + Math.random() * 300,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                radius: 5,
                type: "hub",
            });
        }
        // Regular nodes
        for (let i = 0; i < 20; i++) {
            nodes.push({
                x: 50 + Math.random() * 400,
                y: 50 + Math.random() * 400,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: 2.5,
                type: "node",
            });
        }
        // Endpoints
        for (let i = 0; i < 15; i++) {
            nodes.push({
                x: 30 + Math.random() * 440,
                y: 30 + Math.random() * 440,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                radius: 1.5,
                type: "endpoint",
            });
        }

        let time = 0;

        const animate = () => {
            time += 0.005;
            ctx.clearRect(0, 0, width, height);

            // Update positions
            nodes.forEach((node) => {
                node.x += node.vx;
                node.y += node.vy;
                if (node.x < 20 || node.x > width - 20) node.vx *= -1;
                if (node.y < 20 || node.y > height - 20) node.vy *= -1;
            });

            // Draw connections
            const connectionDist = 120;
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < connectionDist) {
                        const opacity = (1 - dist / connectionDist) * 0.25;
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.strokeStyle = `rgba(6, 214, 242, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();

                        // Animated data packets along connections
                        if (Math.random() < 0.002) {
                            const t = (Math.sin(time * 3 + i + j) + 1) / 2;
                            const px = nodes[i].x + (nodes[j].x - nodes[i].x) * t;
                            const py = nodes[i].y + (nodes[j].y - nodes[i].y) * t;
                            ctx.beginPath();
                            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                            ctx.fillStyle = `rgba(6, 214, 242, 0.8)`;
                            ctx.fill();
                        }
                    }
                }
            }

            // Draw outer glow ring
            const cx = width / 2;
            const cy = height / 2;
            const ringRadius = 200 + Math.sin(time * 2) * 10;
            ctx.beginPath();
            ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(6, 214, 242, 0.05)";
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw nodes
            nodes.forEach((node) => {
                // Glow
                if (node.type === "hub") {
                    const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 20);
                    grad.addColorStop(0, "rgba(6, 214, 242, 0.15)");
                    grad.addColorStop(1, "rgba(6, 214, 242, 0)");
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.fill();
                }

                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle =
                    node.type === "hub"
                        ? "#06d6f2"
                        : node.type === "node"
                            ? "rgba(6, 214, 242, 0.6)"
                            : "rgba(6, 214, 242, 0.3)";
                ctx.fill();
            });

            animRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => cancelAnimationFrame(animRef.current);
    }, []);

    return (
        <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 via-transparent to-blue/5 rounded-2xl" />
            <canvas
                ref={canvasRef}
                className="relative z-10"
                style={{ width: 500, height: 500 }}
            />
            {/* Label overlays */}
            <div className="absolute top-8 left-8 text-[10px] uppercase tracking-[2px] text-text-muted z-20">
                Live Network Graph
            </div>
            <div className="absolute bottom-8 right-8 flex items-center gap-2 z-20">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] text-text-muted">39 Nodes Active</span>
            </div>
        </div>
    );
}
