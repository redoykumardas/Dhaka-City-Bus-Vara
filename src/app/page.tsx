import { getNormalizedStops } from "@/infrastructure/graph.normalized"
import SearchBar from "@/shared/ui/SearchBar"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const allStops = getNormalizedStops()

  return (
    <div className="container animate-in">

      {/* ── Compact Hero + Search (fused into one block) ── */}
      <div className="hero-search-block">
        {/* Mini title row */}
        <div className="hero-top-row">
          <h1 className="hero-inline-title">
            Find your bus in{" "}
            <span style={{ color: "var(--brand-primary)" }}>Dhaka City</span>
          </h1>
          <div className="route-badge hero-badge-inline">
            <span>🚌 {allStops.length} stops</span>
          </div>
        </div>

        {/* Search card — immediately under the title */}
        <div className="glass-card search-card-hero">
          <SearchBar allStops={allStops} />
        </div>

        {/* Quick links below search */}
        <div className="quick-routes-row">
          {[
            { from: "Mirpur 10", to: "Motijheel" },
            { from: "Gabtoli",   to: "Gulistan"  },
            { from: "Uttara",    to: "Farmgate"  },
            { from: "Abdullahpur", to: "Airport" },
          ].map((r) => (
            <a
              key={`${r.from}-${r.to}`}
              href={`/routes?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`}
              className="quick-route-chip"
            >
              {r.from} ➔ {r.to}
            </a>
          ))}
        </div>
      </div>

      {/* ── Feature cards ── */}
      <section className="features-grid">
        {[
          { icon: "🧠", title: "Smart Routing",  desc: "All viable paths through Dhaka's bus network" },
          { icon: "💰", title: "BRTA Fares",     desc: "Official 2024 Bangladesh transport fare data"  },
          { icon: "🗺️", title: "Full Paths",     desc: "Every stop with transfer points shown"         },
        ].map((f, i) => (
          <div key={i} className="glass-card feature-card">
            <span className="feature-icon">{f.icon}</span>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="page-footer">
        <p>🚌 Dhaka City Bus Finder © 2026 · ঢাকা সিটি বাস ফাইন্ডার</p>
      </footer>
    </div>
  )
}
