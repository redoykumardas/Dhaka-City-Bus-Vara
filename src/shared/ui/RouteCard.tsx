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
      <article className="route-card animate-in">
        <div className="route-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.5rem" }}>{rankEmoji}</span>
            {route.label && <span className="route-badge">{route.label}</span>}
            {route.primaryRouteNumber && (
              <span className="route-badge" style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>
                Route {route.primaryRouteNumber}
              </span>
            )}
          </div>
          <div className="fare-tag">
            {route.totalFare} <span>BDT</span>
          </div>
        </div>

        <div className="route-timeline">
          {route.segments.map((seg, i) => (
            <div key={i} style={{ display: "contents" }}>
              <span className="timeline-stop">{seg.from}</span>
              <div className="timeline-line"></div>
              {i === route.segments.length - 1 && (
                <span className="timeline-stop">{seg.to}</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            <span>⏱ {route.totalTime} mins</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            <span>📏 {route.totalDistanceKm} km</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            <span>🔄 {route.transfers} transfer{route.transfers !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="bus-list">
            {route.segments[0]?.buses.slice(0, 3).map((b, i) => (
              <span key={i} className="bus-tag">{b.name}</span>
            ))}
            {route.segments[0]?.buses.length > 3 && (
              <span className="bus-tag" style={{ border: "none", background: "none", padding: 0, opacity: 0.6 }}>
                +{route.segments[0].buses.length - 3} more
              </span>
            )}
          </div>
          <div style={{ color: "var(--brand-primary)", fontWeight: 700, fontSize: "0.9rem" }}>
            View Details ➔
          </div>
        </div>
      </article>
    </Link>
  )
}
