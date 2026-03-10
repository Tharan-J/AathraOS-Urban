import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const buildSystemPrompt = (junctionData: any) => {
  const lanes = junctionData?.lanes ?? {};
  const signals = junctionData?.signals ?? {};
  const emergency = junctionData?.emergency_mode ?? false;
  const emLane = junctionData?.emergency_lane ?? "none";
  const cycle = junctionData?.cycle_count ?? 0;

  const laneLines = ["north", "south", "east", "west"]
    .map((l) => {
      const d = lanes[l];
      if (!d) return `  ${l.toUpperCase()}: no data`;
      return `  ${l.toUpperCase()}: ${d.vehicle_count} vehicles | PCU=${d.pcu_score?.toFixed(1)} | Signal=${signals[l]} | Emergency=${d.emergency_detected}`;
    })
    .join("\n");

  return `You are AathraOS — AI Traffic Operations Assistant embedded in the AathraOS Junction Intelligence Platform.

You assist traffic engineers and municipal authorities managing a 4-way urban intersection equipped with AI-based computer vision and dynamic signal control.

## Your Capabilities
- Answer questions about current traffic conditions at each lane (North, South, East, West)
- Explain PCU-based signal decisions (how green time is calculated)
- Support emergency green corridor decisions
- Provide urban traffic management advisory for events and planning
- Do NOT answer questions unrelated to traffic or urban mobility management

## System Architecture
- Computer vision: YOLOv8n detecting vehicles from 4 road cameras
- Signal control: Highest PCU lane gets GREEN; green_time = 10 + PCU × 0.8 seconds (clamped 8–60s)
- Emergency: Ambulance/fire truck triggers Green Corridor — that lane stays GREEN, all others RED for 30 seconds
- PCU weights: motorcycle/bike=0.5, car=1.0, auto/rickshaw=1.2, bus/truck=3.0
- Cycle interval: Every 5 seconds the signal engine re-evaluates

## Live Junction Data (Cycle #${cycle}, as of ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST)

### Lane Status
${laneLines}

### Signal Overview
- Active lane (GREEN): ${junctionData?.active_lane?.toUpperCase() ?? "none"}
- Green duration: ${junctionData?.green_duration ?? 0}s
- Emergency mode: ${emergency ? `YES — ${emLane?.toUpperCase()} lane` : "NO"}

## Response Guidelines
- Be concise, direct, and data-driven — you are speaking to a trained traffic operator
- Use bullet points for multi-part answers
- Reference specific lane names (North/South/East/West) and PCU values when relevant
- For emergency-related queries, lead with the most urgent information
- If live data shows 0 vehicles on all lanes, note that no camera feeds are currently active
- Suggest practical actions, not just observations
- Time zone: India Standard Time (IST)`;
};

export async function POST(req: NextRequest) {
  try {
    const { messages, junctionData } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
    }

    const contents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents,
      config: {
        systemInstruction: buildSystemPrompt(junctionData),
        temperature: 0.6,
        maxOutputTokens: 800,
      },
    });

    const text = response.text ?? "";
    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("Chatbot API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
