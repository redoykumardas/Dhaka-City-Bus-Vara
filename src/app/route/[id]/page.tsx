import { redirect } from "next/navigation"
import Link from "next/link"
import { buildRoutesUseCase } from "@/application/buildRoutes.usecase"
import { dijkstraAdapter } from "@/modules/routing/dijkstra.adapter"
import { staticBusAdapter } from "@/modules/buses/staticBus.adapter"
import { simpleFareAdapter } from "@/modules/fare/simpleFare.adapter"
import { simpleTimeAdapter, buildTimeTable } from "@/modules/time/simpleTime.adapter"
import { getGraph, getBusDB, expandRoutePath, getFareForRoute } from "@/infrastructure/graph.data"
import { getFareTable } from "@/infrastructure/fare.data"
import { normalizeStop } from "@/domain/stopNormalizer"
import { RouteResult } from "@/domain/types"
import styles from "./route.module.css"

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

  const graph = getGraph()
  const busDB = getBusDB()
  const fareTable = getFareTable()
  const timeTable = buildTimeTable(fareTable)

  const routes = buildRoutesUseCase({
    routing: dijkstraAdapter,
    bus: staticBusAdapter,
    fare: simpleFareAdapter,
    time: simpleTimeAdapter,
    graph,
    busDB,
    fareTable,
    timeTable,
    from,
    to,
    maxPaths: 5,
    expandPath: expandRoutePath,
    getFare: getFareForRoute,
  })

  // Find the right route by matching path if given, else by id
  let route: RouteResult | undefined
  if (rawPath) {
    const pathStops = rawPath.split(",").map(decodeURIComponent)
    route = routes.find((r) => r.path.join(",") === pathStops.join(","))
  }
  if (!route) {
    route = routes.find((r) => r.id === decodeURIComponent(id)) ?? routes[0]
  }

  if (!route) redirect(`/routes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)

  return (
    <main className={styles.main}>
      <div className="page-bg" />
      <div className="container">

        {/* Nav */}
        <nav className={styles.nav}>
          <Link
            href={`/routes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
            className={styles.backLink}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to results
          </Link>
        </nav>

        {/* Route header */}
        <div className={`card ${styles.routeHeader}`}>
          <h1 className={styles.routeTitle}>
            {from} <span className={styles.arrow}>→</span> {to}
          </h1>
          <div className={styles.routeChips}>
            <span className="chip chip-green">💰 Total: {route.totalFare} BDT</span>
            <span className="chip chip-blue">⏱ {route.totalTime} min</span>
            <span className="chip chip-purple">📏 {route.totalDistanceKm} km</span>
            <span className="chip chip-amber">🔄 {route.transfers} transfer{route.transfers !== 1 ? "s" : ""}</span>
            <span className="chip" style={{ background: "var(--bg-overlay)" }}>📍 {route.path.length} stops</span>
          </div>

          {/* Full path display */}
          <div className={`stop-path ${styles.pathDisplay}`}>
            {route.path.map((stop, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  className="stop-name"
                  style={
                    i === 0 || i === route!.path.length - 1
                      ? { borderColor: "var(--brand-primary)", color: "var(--brand-primary)", fontWeight: 700 }
                      : {}
                  }
                >
                  {stop}
                </span>
                {i < route!.path.length - 1 && <span className="stop-arrow">→</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Segment breakdown */}
        <h2 className={styles.segmentsTitle}>Segment Breakdown</h2>

        <div className="segment-timeline">
          {route.segments.map((seg, i) => (
            <div key={i}>
              {/* Transfer indicator */}
              {i > 0 && (
                <div className={styles.transfer}>
                  <div className={styles.transferIcon}>🔄</div>
                  <div>
                    <p className={styles.transferText}>Change at <strong>{seg.from}</strong></p>
                    <p className={styles.transferSub}>Board the next bus to continue your journey</p>
                  </div>
                </div>
              )}

              <div className={`card ${styles.segmentCard}`} style={{ marginBottom: 16 }}>
                <div className="segment-dot" />

                <div className={styles.segmentHeader}>
                  <div>
                    <span className={styles.segmentStops}>
                      {seg.from} <span className={styles.arrow}>→</span> {seg.to}
                    </span>
                    <p className={styles.segmentSub}>Segment {i + 1} of {route!.segments.length}</p>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span className="chip chip-green">💰 {seg.fare} BDT</span>
                    <span className="chip chip-blue">⏱ {seg.estimatedMinutes} min</span>
                    <span className="chip chip-purple">📏 {seg.distanceKm} km</span>
                  </div>
                </div>

                {/* Stops in this segment */}
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Stops In This Segment
                  </p>
                  <div className={styles.subPath}>
                    {seg.path.map((stop, si) => (
                      <span key={si} className={styles.subStop}>
                        {stop}
                        {si < seg.path.length - 1 && <span className={styles.subArrow}>→</span>}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="divider" style={{ margin: "16px 0" }} />

                {/* Buses for this segment */}
                {seg.buses.length > 0 ? (
                  <div>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Available Buses
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {seg.buses.map((bus) => (
                        <div key={bus.name} className={styles.busTag}>
                          <span className={styles.busEmoji}>🚌</span>
                          <div>
                            <p className={styles.busName}>{bus.name}</p>
                            {bus.name_bn && <p className={styles.busNameBn}>{bus.name_bn}</p>}
                          </div>
                          {bus.serviceType && (
                            <span className={`chip ${styles.serviceChip}`}>
                              {bus.serviceType.includes("AC") ? "❄️ AC" : "🪑 Semi"}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    🚌 Bus info not available for this segment — try adjacent stops
                  </p>
                )}
              </div>
            </div>
          ))}

        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Link
            href={`/routes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
            className="btn btn-ghost"
          >
            ← See Other Routes
          </Link>
          <Link href="/" className="btn btn-primary">
            🔍 New Search
          </Link>
        </div>
      </div>
    </main>
  )
}
