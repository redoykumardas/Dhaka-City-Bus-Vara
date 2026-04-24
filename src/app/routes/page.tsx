import { redirect } from "next/navigation"
import Link from "next/link"
import { getNormalizedStops } from "@/infrastructure/graph.normalized"
import { normalizeStop } from "@/domain/stopNormalizer"
import { SortKey } from "@/domain/types"
import { coreSearchUseCase } from "@/application/coreSearch.usecase"
import SearchBar from "@/shared/ui/SearchBar"
import RouteCard from "@/shared/ui/RouteCard"
import SortTabs from "@/shared/ui/SortTabs"

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

  const allStops = getNormalizedStops()
  const routes = coreSearchUseCase(from, to)

  return (
    <div className="container animate-in">
      {/* Back Link */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/" className="back-link">
          <span>←</span> Back to home
        </Link>
      </div>

      {/* Header Card */}
      <div className="glass-card" style={{ marginBottom: 40 }}>
        <SearchBar allStops={allStops} defaultFrom={from} defaultTo={to} />
      </div>

      {routes.length > 0 ? (
        <>
          <div className="results-header">
            <div className="results-header-info">
              <div className="route-badge" style={{ marginBottom: 12 }}>{routes.length} paths found</div>
              <h1 className="results-title">
                {from} <span className="results-title-arrow">→</span> {to}
              </h1>
            </div>
            <SortTabs current={sortBy} from={from} to={to} />
          </div>

          <div className="results-grid">
            {routes.map((route, i) => (
              <RouteCard key={route.id} route={route} rank={i + 1} from={from} to={to} />
            ))}
          </div>
        </>
      ) : (
        <div className="glass-card" style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ fontSize: "4rem", marginBottom: 20 }}>🔍</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 12 }}>No Routes Found</h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: 400, margin: "0 auto 32px" }}>
            We couldn&apos;t find a direct or 1-transfer connection between <b>{from}</b> and <b>{to}</b>. 
            Try checking the stop names or searching for nearby major hubs.
          </p>
          <Link href="/" className="btn btn-primary">
            Refine Search
          </Link>
        </div>
      )}

      <div style={{ height: 100 }} />
    </div>
  )
}
