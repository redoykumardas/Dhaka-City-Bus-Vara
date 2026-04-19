import { getAllStops } from "@/infrastructure/graph.data"
import SearchBar from "@/shared/ui/SearchBar"
import styles from "./home.module.css"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const allStops = getAllStops()

  return (
    <main className={styles.main}>
      <div className="page-bg" />

      <div className="container">
        {/* Hero */}
        <header className={styles.hero}>
          <div className={styles.heroBadge}>
            <span>🚌</span>
            <span>{allStops.length}+ stops across Dhaka</span>
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
          <p className={styles.examplesLabel}>Popular routes</p>
          <div className={styles.exampleChips}>
            {[
              { from: "Mirpur 10", to: "Motijheel" },
              { from: "Gabtoli", to: "Gulistan" },
              { from: "Uttara", to: "Farmgate" },
              { from: "Mirpur 1", to: "Sayedabad" },
            ].map((r) => (
              <a
                key={`${r.from}-${r.to}`}
                href={`/routes?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`}
                className={styles.exampleChip}
              >
                {r.from} → {r.to}
              </a>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className={styles.features}>
          {[
            { icon: "🧠", title: "Smart Routing", desc: "BFS engine finds all viable paths through the Dhaka bus network" },
            { icon: "💰", title: "BRTA Fares", desc: "Real fare data from Bangladesh Road Transport Authority charts" },
            { icon: "⏱️", title: "Time Estimates", desc: "Realistic travel time based on Dhaka's average traffic speeds" },
          ].map((f, i) => (
            <div key={i} className={`card ${styles.featureCard} fade-in fade-in-delay-${i + 1}`}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
