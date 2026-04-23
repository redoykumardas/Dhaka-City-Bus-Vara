import { getNormalizedStops } from "@/infrastructure/graph.normalized"
import SearchBar from "@/shared/ui/SearchBar"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const allStops = getNormalizedStops()

  return (
    <div className="container animate-in">
      {/* Hero Section */}
      <section style={{ textAlign: "center", padding: "60px 0 40px" }}>
        <div className="route-badge" style={{ display: "inline-flex", marginBottom: 16 }}>
          <span>🚌 {allStops.length} stops active</span>
        </div>
        <h1 style={{ fontSize: "3.5rem", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 20 }}>
          Find your way in <br />
          <span style={{ color: "var(--brand-primary)" }}>Dhaka City</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: 500, margin: "0 auto 40px" }}>
          The ultimate bus route finder for Dhaka. Compare fares, explore paths, and find the best operator for your commute.
        </p>
      </section>

      {/* Search Card */}
      <div className="glass-card" style={{ marginBottom: 60 }}>
        <SearchBar allStops={allStops} />
      </div>

      {/* Popular Routes */}
      <section style={{ marginBottom: 80 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Popular Searches</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {[
            { from: "Mirpur 10", to: "Motijheel" },
            { from: "Gabtoli", to: "Gulistan" },
            { from: "Uttara", to: "Farmgate" },
            { from: "Abdullahpur", to: "Airport" },
          ].map((r) => (
            <a
              key={`${r.from}-${r.to}`}
              href={`/routes?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`}
              className="glass-card"
              style={{ textDecoration: "none", padding: "16px", textAlign: "center", fontSize: "0.9rem", fontWeight: 600 }}
            >
              {r.from} ➔ {r.to}
            </a>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 100 }}>
        {[
          { icon: "🧠", title: "Smart Routing", desc: "Finds all viable paths through the complex bus network" },
          { icon: "💰", title: "BRTA Fares", desc: "Real fare data from official 2024 transport charts" },
          { icon: "🗺️", title: "Full Paths", desc: "See every stop along your journey with transfer points" },
        ].map((f, i) => (
          <div key={i} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: "2rem" }}>{f.icon}</span>
            <h3 style={{ fontWeight: 700 }}>{f.title}</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>{f.desc}</p>
          </div>
        ))}
      </section>

      <footer style={{ padding: "40px 0", textAlign: "center", borderTop: "1px solid var(--border-subtle)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Dhaka City Bus Finder © 2026. Premium Transit Data Solutions.
        </p>
      </footer>
    </div>
  )
}
