import { getNormalizedStops } from "@/infrastructure/graph.normalized"
import SearchBar from "@/shared/ui/SearchBar"
import styles from "./home.module.css"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const allStops = getNormalizedStops()

  return (
    <main className={styles.main}>
      <div className="page-bg" />

      <div className="container">
        {/* Hero */}
        <header className={styles.hero}>
          <div className={styles.heroBadge}>
            <span>🚌</span>
            <span id="data-count">{allStops.length > 0 ? `${allStops.length} stops loaded` : "Loading data..."}</span>
          </div>

          <h1 className={styles.heroTitle}>
            Dhaka City
            <span className={styles.heroTitleAccent}> Bus Finder</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Find the best bus routes, fares & travel times across Dhaka city.
            Powered by real BRTA fare data.
          </p>
        </header>

        {/* Search Card */}
        <div className={`card ${styles.searchCard}`}>
          <h2 className={styles.searchLabel}>Where are you going?</h2>
          <SearchBar allStops={allStops} />
        </div>

        {/* Quick examples */}
        <section className={styles.examples}>
          <p className={styles.examplesLabel}>Popular Search</p>
          <div className={styles.exampleChips}>
            {[
              { from: "Mirpur 10", to: "Motijheel" },
              { from: "Gabtoli", to: "Gulistan" },
              { from: "Uttara", to: "Farmgate" },
              { from: "Abdullahpur", to: "Airport" },
            ].map((r) => (
              <a
                key={`${r.from}-${r.to}`}
                href={`/routes?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`}
                className={styles.exampleChip}
              >
                {r.from} to {r.to}
              </a>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className={styles.features}>
          {[
            { icon: "🧠", title: "Smart Routing", desc: "Finds all viable paths through the complex bus network" },
            { icon: "💰", title: "BRTA Fares", desc: "Real fare data from official 2024 transport charts" },
            { icon: "🗺️", title: "Full Paths", desc: "See every stop along your journey with transfer points" },
          ].map((f, i) => (
            <div key={i} className={`card ${styles.featureCard} fade-in fade-in-delay-${i + 1}`}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </section>

        <footer style={{ marginTop: 80, paddingBottom: 40, textAlign: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: 40 }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Dhaka City Bus Finder © 2026. Data sourced from BRTA.
          </p>
        </footer>
      </div>
    </main>
  )
}
