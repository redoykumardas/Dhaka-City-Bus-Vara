"use client"

import Link from "next/link"
import Image from "next/image"
import { RouteResult } from "@/domain/types"

interface RouteCardProps {
  route: RouteResult
  rank: number
  from: string
  to: string
}

const rankLabels = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"]

export default function RouteCard({ route, rank, from, to }: RouteCardProps) {
  const rankEmoji = rankLabels[rank - 1] ?? `${rank}.`

  return (
    <Link
      href={`/route/${encodeURIComponent(route.id)}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&path=${encodeURIComponent(route.path.join(","))}`}
      style={{ textDecoration: "none" }}
    >
      <article className="route-card fade-in">
        {/* Header row */}
        <div className="stack-mobile" style={{ display: "flex", gap: 16, marginBottom: 14 }}>
          {route.primaryRouteId && (
            <div style={{ position: "relative", width: 80, height: 60, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid var(--border-default)" }}>
              <Image 
                src={`/route-images/${route.primaryRouteId}.jpg`} 
                alt={`Route ${route.primaryRouteNumber}`}
                fill
                style={{ objectFit: "cover", opacity: 0.8 }}
              />
              <div style={{ 
                position: "absolute", 
                inset: 0, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                background: "rgba(0,0,0,0.3)",
                fontSize: "0.5rem",
                color: "white",
                fontWeight: 700,
                textTransform: "uppercase"
              }}>
                Preview
              </div>
            </div>
          )}
          
          <div style={{ flex: 1 }}>
            <div className="stack-mobile" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "1.3rem" }}>{rankEmoji}</span>
                {route.primaryRouteNumber && <span className="chip chip-blue">{route.primaryRouteNumber}</span>}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className="chip chip-green">💰 {route.totalFare} BDT</span>
                <span className="chip chip-blue">⏱ {route.totalTime} min</span>
                <span className="chip chip-amber">🔄 {route.transfers} transfer{route.transfers !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Segment path */}
        <div className="stop-path" style={{ 
          marginBottom: 14, 
          overflowX: "auto", 
          whiteSpace: "nowrap",
          paddingBottom: 4,
          scrollbarWidth: "none",
          msOverflowStyle: "none"
        }}>
          {route.segments.map((seg, si) => (
            <div key={si} style={{ display: "inline-flex", alignItems: "center" }}>
              <span
                className="stop-name"
                style={
                  si === 0
                    ? { borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }
                    : {}
                }
              >
                {seg.from}
              </span>
              <span className="stop-arrow" style={{ opacity: 0.5, margin: "0 4px" }}>→</span>
              {si === route.segments.length - 1 && (
                <span
                  className="stop-name"
                  style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}
                >
                  {seg.to}
                </span>
              )}
            </div>
          ))}
        </div>


        {/* Buses summary */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {route.segments.flatMap(s => s.buses).reduce((acc, bus) => {
            if (!acc.find(b => b.name === bus.name)) acc.push(bus)
            return acc
          }, [] as import("@/domain/types").BusOperator[])
            .slice(0, 4)
            .map((bus) => (
              <span key={bus.name} className="chip chip-purple" style={{ fontSize: "0.72rem" }}>
                🚌 {bus.name} {bus.serviceType?.includes("AC") ? "❄️" : bus.serviceType ? "🪑" : ""}
              </span>
            ))}
          {new Set(route.segments.flatMap((s) => s.buses.map((b) => b.name))).size > 4 && (
            <span className="chip" style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "none", fontSize: "0.72rem" }}>
              +{new Set(route.segments.flatMap((s) => s.buses.map((b) => b.name))).size - 4}
            </span>
          )}
          {route.segments.every((s) => s.buses.length === 0) && (
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Bus info not available</span>
          )}
        </div>

        {/* Expand prompt */}
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 12, textAlign: "right" }}>
          Tap to see full details →
        </p>
      </article>
    </Link>
  )
}
