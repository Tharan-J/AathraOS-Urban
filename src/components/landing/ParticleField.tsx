"use client";

import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 2000;
const CONNECTION_DISTANCE = 2.2;
const HUB_COUNT = 6;

function NeuralNetwork() {
    const pointsRef = useRef<THREE.Points>(null);
    const linesRef = useRef<THREE.LineSegments>(null);
    const hubsRef = useRef<THREE.Points>(null);
    const pulseRef = useRef<THREE.Points>(null);

    // Generate particle positions
    const { positions, velocities, colors, sizes } = useMemo(() => {
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const velocities = new Float32Array(PARTICLE_COUNT * 3);
        const colors = new Float32Array(PARTICLE_COUNT * 3);
        const sizes = new Float32Array(PARTICLE_COUNT);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            // Distribute in a sphere-like volume
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 3 + Math.random() * 12;

            positions[i3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5; // flatter
            positions[i3 + 2] = r * Math.cos(phi);

            velocities[i3] = (Math.random() - 0.5) * 0.003;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.002;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.003;

            // Cyan-blue color palette
            const colorChoice = Math.random();
            if (colorChoice < 0.6) {
                // Cyan
                colors[i3] = 0.02 + Math.random() * 0.05;
                colors[i3 + 1] = 0.7 + Math.random() * 0.3;
                colors[i3 + 2] = 0.85 + Math.random() * 0.15;
            } else if (colorChoice < 0.85) {
                // Electric blue
                colors[i3] = 0.2 + Math.random() * 0.1;
                colors[i3 + 1] = 0.4 + Math.random() * 0.2;
                colors[i3 + 2] = 0.9 + Math.random() * 0.1;
            } else {
                // Purple accent
                colors[i3] = 0.5 + Math.random() * 0.2;
                colors[i3 + 1] = 0.3 + Math.random() * 0.2;
                colors[i3 + 2] = 0.8 + Math.random() * 0.2;
            }

            sizes[i] = 0.02 + Math.random() * 0.06;
        }

        return { positions, velocities, colors, sizes };
    }, []);

    // Hub nodes (larger, brighter)
    const hubData = useMemo(() => {
        const hubPositions = new Float32Array(HUB_COUNT * 3);
        const hubColors = new Float32Array(HUB_COUNT * 3);
        const hubSizes = new Float32Array(HUB_COUNT);

        for (let i = 0; i < HUB_COUNT; i++) {
            const i3 = i * 3;
            const angle = (i / HUB_COUNT) * Math.PI * 2;
            const r = 3 + Math.random() * 4;
            hubPositions[i3] = Math.cos(angle) * r;
            hubPositions[i3 + 1] = (Math.random() - 0.5) * 3;
            hubPositions[i3 + 2] = Math.sin(angle) * r;

            hubColors[i3] = 0.02;
            hubColors[i3 + 1] = 0.84;
            hubColors[i3 + 2] = 0.95;

            hubSizes[i] = 0.15 + Math.random() * 0.1;
        }

        return { hubPositions, hubColors, hubSizes };
    }, []);

    // Connection lines buffer
    const linePositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 6), []);
    const lineColors = useMemo(() => new Float32Array(PARTICLE_COUNT * 6), []);

    // Data pulse particles
    const pulseData = useMemo(() => {
        const count = 30;
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const sz = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
            col[i * 3] = 0.02;
            col[i * 3 + 1] = 0.95;
            col[i * 3 + 2] = 1.0;
            sz[i] = 0.04;
        }
        return { pos, col, sz, count };
    }, []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        if (!pointsRef.current) return;
        const posAttr = pointsRef.current.geometry.attributes
            .position as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;
        const sizeAttr = pointsRef.current.geometry.attributes
            .size as THREE.BufferAttribute;
        const sizeArray = sizeAttr.array as Float32Array;

        // Animate particles
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            posArray[i3] += velocities[i3] + Math.sin(time * 0.3 + i * 0.01) * 0.001;
            posArray[i3 + 1] += velocities[i3 + 1] + Math.cos(time * 0.2 + i * 0.02) * 0.001;
            posArray[i3 + 2] += velocities[i3 + 2] + Math.sin(time * 0.25 + i * 0.015) * 0.001;

            // Soft boundary
            const dist = Math.sqrt(
                posArray[i3] ** 2 + posArray[i3 + 1] ** 2 + posArray[i3 + 2] ** 2
            );
            if (dist > 14) {
                velocities[i3] *= -0.95;
                velocities[i3 + 1] *= -0.95;
                velocities[i3 + 2] *= -0.95;
            }

            // Pulse sizes
            sizeArray[i] = sizes[i] * (0.8 + 0.4 * Math.sin(time * 1.5 + i * 0.5));
        }
        posAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;

        // Build connections
        let lineIndex = 0;
        const maxLines = PARTICLE_COUNT;
        for (let i = 0; i < Math.min(300, PARTICLE_COUNT); i++) {
            if (lineIndex >= maxLines * 2) break;
            for (let j = i + 1; j < Math.min(300, PARTICLE_COUNT); j++) {
                if (lineIndex >= maxLines * 2) break;
                const i3 = i * 3;
                const j3 = j * 3;
                const dx = posArray[i3] - posArray[j3];
                const dy = posArray[i3 + 1] - posArray[j3 + 1];
                const dz = posArray[i3 + 2] - posArray[j3 + 2];
                const distSq = dx * dx + dy * dy + dz * dz;

                if (distSq < CONNECTION_DISTANCE * CONNECTION_DISTANCE) {
                    const li = lineIndex * 3;
                    linePositions[li] = posArray[i3];
                    linePositions[li + 1] = posArray[i3 + 1];
                    linePositions[li + 2] = posArray[i3 + 2];
                    linePositions[li + 3] = posArray[j3];
                    linePositions[li + 4] = posArray[j3 + 1];
                    linePositions[li + 5] = posArray[j3 + 2];

                    const alpha = 1 - Math.sqrt(distSq) / CONNECTION_DISTANCE;
                    lineColors[li] = 0.02 * alpha;
                    lineColors[li + 1] = 0.84 * alpha;
                    lineColors[li + 2] = 0.95 * alpha;
                    lineColors[li + 3] = 0.02 * alpha;
                    lineColors[li + 4] = 0.84 * alpha;
                    lineColors[li + 5] = 0.95 * alpha;

                    lineIndex += 2;
                }
            }
        }

        if (linesRef.current) {
            const lineGeo = linesRef.current.geometry;
            (lineGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
            (lineGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
            lineGeo.setDrawRange(0, lineIndex);
        }

        // Animate hubs
        if (hubsRef.current) {
            const hubPosAttr = hubsRef.current.geometry.attributes.position as THREE.BufferAttribute;
            const hubArr = hubPosAttr.array as Float32Array;
            for (let i = 0; i < HUB_COUNT; i++) {
                hubArr[i * 3 + 1] += Math.sin(time * 0.5 + i) * 0.003;
            }
            hubPosAttr.needsUpdate = true;
        }

        // Animate pulses
        if (pulseRef.current) {
            const pAttr = pulseRef.current.geometry.attributes.position as THREE.BufferAttribute;
            const pArr = pAttr.array as Float32Array;
            for (let i = 0; i < pulseData.count; i++) {
                const speed = 0.02 + (i % 5) * 0.005;
                pArr[i * 3] += Math.sin(time * 2 + i * 1.3) * speed;
                pArr[i * 3 + 1] += Math.cos(time * 1.5 + i * 0.7) * speed * 0.5;
                pArr[i * 3 + 2] += Math.sin(time * 1.8 + i * 0.9) * speed;

                const d = Math.sqrt(pArr[i * 3] ** 2 + pArr[i * 3 + 1] ** 2 + pArr[i * 3 + 2] ** 2);
                if (d > 10) {
                    pArr[i * 3] *= 0.1;
                    pArr[i * 3 + 1] *= 0.1;
                    pArr[i * 3 + 2] *= 0.1;
                }
            }
            pAttr.needsUpdate = true;
        }

        // Slow scene rotation
        if (pointsRef.current.parent) {
            pointsRef.current.parent.rotation.y = time * 0.03;
        }
    });

    return (
        <group>
            {/* Main particles */}
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={PARTICLE_COUNT}
                        array={positions}
                        itemSize={3}
                        args={[positions, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        count={PARTICLE_COUNT}
                        array={colors}
                        itemSize={3}
                        args={[colors, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-size"
                        count={PARTICLE_COUNT}
                        array={sizes}
                        itemSize={1}
                        args={[sizes, 1]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.05}
                    vertexColors
                    transparent
                    opacity={0.7}
                    sizeAttenuation
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>

            {/* Connection lines */}
            <lineSegments ref={linesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={PARTICLE_COUNT * 2}
                        array={linePositions}
                        itemSize={3}
                        args={[linePositions, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        count={PARTICLE_COUNT * 2}
                        array={lineColors}
                        itemSize={3}
                        args={[lineColors, 3]}
                    />
                </bufferGeometry>
                <lineBasicMaterial
                    vertexColors
                    transparent
                    opacity={0.15}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </lineSegments>

            {/* Hub nodes */}
            <points ref={hubsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={HUB_COUNT}
                        array={hubData.hubPositions}
                        itemSize={3}
                        args={[hubData.hubPositions, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        count={HUB_COUNT}
                        array={hubData.hubColors}
                        itemSize={3}
                        args={[hubData.hubColors, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.2}
                    vertexColors
                    transparent
                    opacity={0.9}
                    sizeAttenuation
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>

            {/* Data pulses */}
            <points ref={pulseRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={pulseData.count}
                        array={pulseData.pos}
                        itemSize={3}
                        args={[pulseData.pos, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        count={pulseData.count}
                        array={pulseData.col}
                        itemSize={3}
                        args={[pulseData.col, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.08}
                    vertexColors
                    transparent
                    opacity={1}
                    sizeAttenuation
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>
        </group>
    );
}

// Orbiting ring
function OrbitalRing({ radius, speed, opacity }: { radius: number; speed: number; opacity: number }) {
    const ref = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!ref.current) return;
        ref.current.rotation.z = state.clock.getElapsedTime() * speed;
        ref.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.getElapsedTime() * 0.2) * 0.1;
    });

    return (
        <mesh ref={ref}>
            <torusGeometry args={[radius, 0.005, 16, 100]} />
            <meshBasicMaterial
                color="#06d6f2"
                transparent
                opacity={opacity}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    );
}

export default function ParticleField() {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas
                camera={{ position: [0, 0, 12], fov: 60 }}
                dpr={[1, 1.5]}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                }}
                style={{ background: "transparent" }}
            >
                <ambientLight intensity={0.1} />
                <NeuralNetwork />
                <OrbitalRing radius={6} speed={0.08} opacity={0.08} />
                <OrbitalRing radius={8} speed={-0.05} opacity={0.05} />
                <OrbitalRing radius={10} speed={0.03} opacity={0.03} />
            </Canvas>
        </div>
    );
}
