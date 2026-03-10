import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const JUNCTION_CONTEXT = `
Urban Junction Baseline (AathraOS 4-Way Intersection):
- Junction capacity: ~1200 vehicles/hour under normal conditions
- Normal PCU load: 15–25 PCU across all 4 lanes
- Signal cycle interval: 5 seconds
- Green time range: 8–60 seconds per lane
- PCU weights: motorcycle/bike=0.5, car=1.0, auto/rickshaw=1.2, bus/truck=3.0
- Emergency corridor hold: 30 seconds per detection
- Connected roads: North Road, South Road, East Road, West Road
`;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
    }

    const { event } = await req.json();

    const prompt = `You are AathraOS Event Traffic Impact AI. Analyze the following urban event and predict its impact on the managed 4-way junction.

${JUNCTION_CONTEXT}

## Event Details:
- **Name**: ${event.name}
- **Date**: ${event.date}
- **Time**: ${event.startTime} – ${event.endTime}
- **Location**: ${event.location}
- **Expected Crowd**: ${event.crowd} people
- **Duration**: ${event.duration} hours
- **Event Type**: ${event.type}
- **Description**: ${event.description || "Not provided"}
- **Nearby Intersections**: ${event.intersections || "The managed 4-way junction"}

## Your Analysis Must Cover:

### 1. Traffic Impact Assessment
- Overall estimated congestion increase (%)
- Which roads (North/South/East/West) will be most impacted and why
- Vehicle volume surge estimate
- PCU load increase estimate per affected lane

### 2. Signal Timing Adjustments
- Recommended extended green times per lane (with specific values in seconds)
- Whether manual override of AI signal control is recommended
- Suggested signal pre-configuration 30 minutes before the event

### 3. Emergency Vehicle Access
- Risk to emergency corridor clearance during the event
- Recommended dedicated emergency access lane
- Coordination with emergency services

### 4. Traffic Diversion Plan
- Recommended alternate routes
- Suggested road closures or restrictions
- Police deployment points (give specific road names)

### 5. Post-Event Dispersal
- Estimated dispersal duration
- Recommended signal sequencing for dispersal
- Crowd flow management

### 6. Risk Flags
- Specific risks from this event type
- Bottleneck roads/approaches
- Conflict with peak hours

Keep the response structured, concise, and action-oriented. Use bullet points. Be specific with road directions (North/South/East/West road). Reference PCU values and signal timings where relevant.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.65, maxOutputTokens: 1400 },
    });

    return NextResponse.json({ insights: response.text ?? "" });
  } catch (err: any) {
    console.error("Event insights API error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate insights" }, { status: 500 });
  }
}
