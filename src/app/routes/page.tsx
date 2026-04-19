import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { buildRoutesUseCase } from "@/application/buildRoutes.usecase"
import { dijkstraAdapter } from "@/modules/routing/dijkstra.adapter"
import { staticBusAdapter } from "@/modules/buses/staticBus.adapter"
import { simpleFareAdapter } from "@/modules/fare/simpleFare.adapter"
import { simpleTimeAdapter, buildTimeTable } from "@/modules/time/simpleTime.adapter"
import { getGraph, getBusDB, getAllStops } from "@/infrastructure/graph.data"
import { getFareTable } from "@/infrastructure/fare.data"
import { normalizeStop } from "@/domain/stopNormalizer"
import { RouteResult, SortKey } from "@/domain/types"
import SearchBar from "@/shared/ui/SearchBar"
import RouteCard from "@/shared/ui/RouteCard"
import SortTabs from "@/shared/ui/SortTabs"
import styles from "./routes.module.css"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; sort?: string }>
}

export default async function RoutesPage({ searchParams }: PageProps) {
  const { from: rawFrom, to: rawTo, sort: rawSort } = await searchParams

  if (!rawFrom || !rawTo) redirect("/")

  const from = normalizeStop(rawFrom)
  const to = normalizeStop(rawTo)
  const sortBy = (rawSort as SortKey) || "fare"

  const graph = getGraph()
  const busDB = getBusDB()
  const fareTable = getFareTable()
  const timeTable = buildTimeTable(fareTable)
  const allStops = getAllStops()

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
    sortBy,
  })

  return (
    <main className={styles.main}>
      <div className="page-bg" />
      <div className="container">

        {/* Top nav */}
        <nav className={styles.nav}>
          <Link href="/" className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </Link>
        </nav>

        {/* Inline search bar */}
        <div className={`card ${styles.searchCard}`}>
          <SearchBar allStops={allStops} defaultFrom={from} defaultTo={to} />
        </div>

        {/* Results header */}
        {routes.length > 0 ? (
          <>
            <div className={styles.resultsHeader}>
              <div>
                <h1 className={styles.resultsTitle}>
                  {from} <span className={styles.arrow}>→</span> {to}
                </h1>
                <p className={styles.resultsCount}>
                  {routes.length} route{routes.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <SortTabs current={sortBy} from={from} to={to} />
            </div>

            {/* Route cards */}
            <div className={styles.routeList}>
              {routes.map((route, i) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  rank={i + 1}
                  from={from}
                  to={to}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state fade-in">
            <span className="empty-state-icon">🚫</span>
            <h3>No direct routes found</h3>
            <p>
              We couldn&apos;t find a bus connection between <strong>{from}</strong> and <strong>{to}</strong>.
              Try nearby stops or check spelling.
            </p>
            <div style={{ marginTop: 24 }}>
              <Link href="/" className="btn btn-primary">
                Try Another Search
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
