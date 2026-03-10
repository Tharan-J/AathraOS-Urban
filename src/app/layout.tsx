import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AathraOS — AI Traffic Signal Management System",
  description:
    "AathraOS is an AI-powered traffic signal control system that uses computer vision and real-time YOLO detection to manage 4-way urban junctions, dynamically optimize signal timing using PCU models, and prioritize emergency vehicles with automated Green Corridor activation.",
  keywords: [
    "traffic signal control",
    "AI traffic management",
    "emergency vehicle prioritization",
    "green corridor",
    "PCU traffic model",
    "YOLOv8 vehicle detection",
    "smart junction",
    "urban traffic",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
