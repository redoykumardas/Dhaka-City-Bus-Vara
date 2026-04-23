import fs from "fs"
import path from "path"
import { redirect } from "next/navigation"
import Link from "next/link"
import { normalizeStop } from "@/domain/stopNormalizer"
import { coreSearchUseCase } from "@/application/coreSearch.usecase"
import FareImage from "@/shared/ui/FareImage"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string; to?: string; path?: string }>
}

export default async function RouteDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { from: rawFrom, to: rawTo, path: rawPath } = await searchParams

  if (!rawFrom || !rawTo) redirect("/")

  const from = normalizeStop(rawFrom)
  const to = normalizeStop(rawTo)

  const routes = coreSearchUseCase(from, to)
  
  let route = routes.find(r => r.id === id)
  if (!route && rawPath) {
     route = routes.find(r => r.path.join(",") === rawPath)
  }
  if (!route) route = routes[0]

  if (!route) redirect(`/routes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)

  return (
    <div className="container animate-in">
      {/* Navigation */}
      <div style={{ marginBottom: 24 }}>
        <Link href={`/routes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`} 
              style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span>←</span> Back to Search Results
        </Link>
      </div>

      {/* Hero Header */}
      <section className="glass-card" style={{ marginBottom: 40, borderLeft: "6px solid var(--brand-primary)" }}>
        <h1 style={{ fontSize: "2.4rem", fontWeight: 900, marginBottom: 16, letterSpacing: "-0.03em" }}>
          Journey Plan
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <span className="timeline-stop" style={{ fontSize: "1.2rem" }}>{from}</span>
          <span style={{ color: "var(--text-muted)", fontSize: "1.5rem" }}>➔</span>
          <span className="timeline-stop" style={{ fontSize: "1.2rem" }}>{to}</span>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16 }}>
          <div style={{ padding: "12px", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 4 }}>Total Fare</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>💰 {route.totalFare} <span style={{ fontSize: "0.8rem" }}>BDT</span></div>
          </div>
          <div style={{ padding: "12px", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 4 }}>Distance</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>📏 {route.totalDistanceKm} <span style={{ fontSize: "0.8rem" }}>KM</span></div>
          </div>
          <div style={{ padding: "12px", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 4 }}>Travel Time</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>⏱ {route.totalTime} <span style={{ fontSize: "0.8rem" }}>MIN</span></div>
          </div>
          <div style={{ padding: "12px", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 4 }}>Transfers</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>🔄 {route.transfers}</div>
          </div>
        </div>
      </section>

      {/* NEW: Full Journey Path Summary */}
      <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <span>🚩</span> Full Journey Path
      </h2>
      <div className="glass-card" style={{ marginBottom: 48, padding: "24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {route.path.map((stop, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ 
                padding: "6px 12px", 
                background: i === 0 || i === route!.path.length - 1 ? "var(--brand-primary-glow)" : "var(--bg-base)",
                border: "1px solid",
                borderColor: i === 0 || i === route!.path.length - 1 ? "var(--brand-primary)" : "var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.9rem",
                fontWeight: i === 0 || i === route!.path.length - 1 ? 700 : 500,
                color: i === 0 || i === route!.path.length - 1 ? "var(--brand-primary)" : "var(--text-primary)"
              }}>
                {stop}
              </div>
              {i < route!.path.length - 1 && <span style={{ color: "var(--text-muted)" }}>→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Segments - Timeline Style */}
      <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
        <span>🗺️</span> Segment Details
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 32, marginBottom: 80, position: "relative" }}>
        {/* Vertical line connecting segments */}
        <div style={{ position: "absolute", left: "20px", top: "20px", bottom: "20px", width: "2px", background: "dashed var(--border-default)", zIndex: 0 }} />

        {route.segments.map((seg, i) => (
          <div key={i} className="animate-in" style={{ paddingLeft: "50px", position: "relative", zIndex: 1, animationDelay: `${i * 0.15}s` }}>
            {/* Timeline indicator */}
            <div style={{ 
              position: "absolute", left: "8px", top: "24px", width: "26px", height: "26px", 
              borderRadius: "50%", background: "var(--brand-primary)", border: "4px solid var(--bg-base)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "white", fontWeight: 800
            }}>
              {i + 1}
            </div>

            <div className="glass-card" style={{ transition: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: 4 }}>{seg.from} ➔ {seg.to}</h3>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: "0.85rem" }}>
                    <span style={{ color: "var(--brand-primary)", fontWeight: 700 }}>💰 {seg.fare} BDT</span>
                    <span style={{ color: "var(--text-secondary)" }}>📏 {seg.distanceKm} km</span>
                    <span style={{ color: "var(--text-secondary)" }}>⏱ ~{seg.estimatedMinutes} mins</span>
                  </div>
                </div>
                {seg.routeNumber && (
                  <span className="route-badge" style={{ background: "var(--bg-overlay)", color: "var(--text-primary)" }}>
                    Route {seg.routeNumber}
                  </span>
                )}
              </div>

              {/* Bus Operators */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12, letterSpacing: "0.05em" }}>
                  Available Bus Operators
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {seg.buses.map((bus, bi) => (
                    <div key={bi} className="bus-tag" style={{ padding: "10px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "1.2rem" }}>🚌</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{bus.name}</div>
                          <div style={{ fontSize: "0.7rem", opacity: 0.7 }}>{bus.serviceType || "Standard Service"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Path Sequence for this segment */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12, letterSpacing: "0.05em" }}>
                  Segment Path ({seg.from} to {seg.to})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, background: "var(--bg-base)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  {seg.path.map((stop, si) => (
                    <div key={si} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ 
                        fontSize: "0.85rem", fontWeight: 600, color: si === 0 || si === seg.path.length - 1 ? "var(--brand-primary)" : "var(--text-primary)"
                      }}>
                        {stop}
                      </span>
                      {si < seg.path.length - 1 && <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>➔</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fare Chart Image */}
              {seg.routeId && fs.existsSync(path.join(process.cwd(), "public", "route-images", `${seg.routeId}.jpg`)) && (
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12, letterSpacing: "0.05em" }}>
                    Fare Chart Verification
                  </div>
                  <FareImage 
                    src={`/route-images/${seg.routeId}.jpg`} 
                    alt={`Fare chart for route ${seg.routeNumber}`}
                    routeNumber={seg.routeNumber}
                  />
                </div>
              )}
            </div>

            {/* Transfer Indicator */}
            {i < route.segments.length - 1 && (
              <div style={{ margin: "16px 0", paddingLeft: "24px", color: "var(--brand-warn)", fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                <span>🔄</span>
                <span>Transfer at {seg.to} to continue</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div style={{ textAlign: "center", paddingBottom: 80 }}>
        <Link href="/" className="btn btn-primary" style={{ minWidth: "240px" }}>
          🔍 Start New Search
        </Link>
      </div>
    </div>
  )
}
