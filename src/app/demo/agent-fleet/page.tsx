import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./agent-fleet.css";
import { DemoApp } from "./DemoApp";

const afSans = Inter({
  subsets: ["latin"],
  variable: "--font-af-sans",
  display: "swap",
});

const afMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-af-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "iceKore Mission Control · Demo",
  description:
    "A replica of the mission control for iceKore's AI agent team: 12 autonomous agents, live status, standing deliverables, and a decision queue. Example data.",
  openGraph: {
    title: "iceKore Mission Control · Demo",
    description:
      "The dashboard where 12 AI agents run iceKore's marketing. Demo replica with example data.",
    type: "website",
  },
};

export default function AgentFleetDemoPage() {
  return (
    <main className={`af ${afSans.variable} ${afMono.variable}`}>
      <DemoApp />
    </main>
  );
}
