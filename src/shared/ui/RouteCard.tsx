"use client"

import Link from "next/link"
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
        <div className="stack-mobile" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "1.3rem" }}>{rankEmoji}</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="chip chip-green">💰 {route.totalFare} BDT</span>
            <span className="chip chip-blue">⏱ {route.totalTime} min</span>
            <span className="chip chip-purple">📏 {route.totalDistanceKm} km</span>
            <span className="chip chip-amber">🔄 {route.transfers} transfer{route.transfers !== 1 ? "s" : ""}</span>
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
          {Array.from(
            new Set(route.segments.flatMap((s) => s.buses.map((b) => b.name)))
          )
            .slice(0, 4)
            .map((name) => (
              <span key={name} className="chip chip-purple" style={{ fontSize: "0.75rem" }}>
                🚌 {name}
              </span>
            ))}
          {new Set(route.segments.flatMap((s) => s.buses.map((b) => b.name))).size > 4 && (
            <span className="chip" style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "none", fontSize: "0.75rem" }}>
              +{new Set(route.segments.flatMap((s) => s.buses.map((b) => b.name))).size - 4} more
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
