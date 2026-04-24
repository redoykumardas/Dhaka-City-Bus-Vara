import fs from "fs"
import { coreSearchUseCase } from "../src/application/coreSearch.usecase"

// All stops to test - includes recently fixed names
const ALL_STOPS = [
  "Mirpur 10", "Mirpur 11", "Mirpur 12", "Mirpur 1",
  "Motijheel", "Farmgate", "Uttara", "Gabtoli",
  "Gulistan", "Mohakhali", "Sayedabad", "Shahbag",
  "Badda", "Rampura", "Jatrabari", "Mohammadpur",
  "Azimpur", "Airport", "Banani", "Gulshan 1",
  "Mogbazar", "Khilkhet", "Abdullahpur", "Kuril Bishwa Road",
  "Malibagh", "Kakrail", "Nadda", "Badda Link Road",
  "Gawsia", "Dhanmondi", "Science Lab", "New Market",
  "Agargaon", "Shyamoli", "Kalabagan",
  "Tongi", "Sadarghat", "Bashabo", "Mirpur 2"
]

// Deduplicate
const STOPS = [...new Set(ALL_STOPS)]

interface TestResult {
  from: string
  to: string
  status: "DIRECT" | "TRANSFER" | "NO_ROUTE" | "ERROR"
  fare: number
  time: number
  dist: number
  path: string
  buses: number
  error?: string
}

async function runAllTests() {
  console.log(`\n🚌 COMPREHENSIVE ROUTING ENGINE TEST`)
  console.log(`${"=".repeat(60)}`)
  console.log(`Testing ${STOPS.length} stops → ${STOPS.length * (STOPS.length - 1)} combinations\n`)

  const results: TestResult[] = []
  let directCount = 0
  let transferCount = 0
  let noRouteCount = 0
  let errorCount = 0

  for (const from of STOPS) {
    for (const to of STOPS) {
      if (from === to) continue

      try {
        const searchResult = coreSearchUseCase(from, to)
        
        if (!searchResult || searchResult.length === 0) {
          results.push({ from, to, status: "NO_ROUTE", fare: 0, time: 0, dist: 0, path: "-", buses: 0 })
          noRouteCount++
        } else {
          const best = searchResult[0]
          const status = best.type === "direct" ? "DIRECT" : "TRANSFER"
          const totalBuses = best.segments.reduce((acc, s) => acc + s.buses.length, 0)
          const pathStr = best.segments.map(s => `${s.from}→${s.to}`).join(" | ")

          results.push({
            from, to,
            status,
            fare: best.totalFare,
            time: best.totalTime,
            dist: best.totalDistanceKm,
            path: pathStr,
            buses: totalBuses
          })

          if (status === "DIRECT") directCount++
          else transferCount++
        }
      } catch (e: any) {
        results.push({ from, to, status: "ERROR", fare: 0, time: 0, dist: 0, path: "-", buses: 0, error: e.message })
        errorCount++
      }
    }
  }

  const total = results.length
  const successRate = (((directCount + transferCount) / total) * 100).toFixed(1)

  // --- Console Summary ---
  console.log(`📊 RESULTS SUMMARY`)
  console.log(`${"─".repeat(40)}`)
  console.log(`  Total Pairs Tested:  ${total}`)
  console.log(`  ✅ DIRECT Routes:    ${directCount} (${((directCount/total)*100).toFixed(1)}%)`)
  console.log(`  🔄 TRANSFER Routes:  ${transferCount} (${((transferCount/total)*100).toFixed(1)}%)`)
  console.log(`  ❌ NO ROUTE Found:   ${noRouteCount} (${((noRouteCount/total)*100).toFixed(1)}%)`)
  console.log(`  💥 ERRORS:           ${errorCount}`)
  console.log(`  🎯 Coverage:         ${successRate}%`)
  console.log()

  if (noRouteCount > 0) {
    console.log(`\n⚠️  NO ROUTE pairs (need data fix):`)
    results.filter(r => r.status === "NO_ROUTE").slice(0, 20).forEach(r => {
      console.log(`   ${r.from} ➔ ${r.to}`)
    })
    if (noRouteCount > 20) console.log(`   ... and ${noRouteCount - 20} more`)
  }

  if (errorCount > 0) {
    console.log(`\n💥 ERROR pairs:`)
    results.filter(r => r.status === "ERROR").forEach(r => {
      console.log(`   ${r.from} ➔ ${r.to}: ${r.error}`)
    })
  }

  // --- Write Full Markdown Report ---
  let md = `# 🚌 Dhaka Bus Routing Engine — Full Test Report\n\n`
  md += `**Generated:** ${new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}  \n`
  md += `**Stops Tested:** ${STOPS.length}  \n`
  md += `**Total Pairs:** ${total}  \n\n`

  md += `## 📊 Summary\n\n`
  md += `| Metric | Count | Percentage |\n`
  md += `|--------|-------|------------|\n`
  md += `| ✅ Direct Routes | ${directCount} | ${((directCount/total)*100).toFixed(1)}% |\n`
  md += `| 🔄 Transfer Routes | ${transferCount} | ${((transferCount/total)*100).toFixed(1)}% |\n`
  md += `| ❌ No Route Found | ${noRouteCount} | ${((noRouteCount/total)*100).toFixed(1)}% |\n`
  md += `| 💥 Errors | ${errorCount} | ${((errorCount/total)*100).toFixed(1)}% |\n`
  md += `| 🎯 **Coverage** | **${directCount+transferCount}** | **${successRate}%** |\n\n`

  // Direct routes table
  const directResults = results.filter(r => r.status === "DIRECT")
  md += `## ✅ Direct Routes (${directResults.length})\n\n`
  md += `| From | To | Fare (BDT) | Time (min) | Dist (km) | Buses | Path |\n`
  md += `|------|-----|-----------|-----------|----------|-------|------|\n`
  for (const r of directResults) {
    md += `| **${r.from}** | **${r.to}** | ${r.fare} | ${r.time} | ${r.dist} | ${r.buses} | ${r.path} |\n`
  }

  // Transfer routes table
  const transferResults = results.filter(r => r.status === "TRANSFER")
  md += `\n## 🔄 Transfer Routes (${transferResults.length})\n\n`
  md += `| From | To | Fare (BDT) | Time (min) | Dist (km) | Buses | Path |\n`
  md += `|------|-----|-----------|-----------|----------|-------|------|\n`
  for (const r of transferResults) {
    md += `| **${r.from}** | **${r.to}** | ${r.fare} | ${r.time} | ${r.dist} | ${r.buses} | ${r.path} |\n`
  }

  // No-route pairs
  const noRouteResults = results.filter(r => r.status === "NO_ROUTE")
  if (noRouteResults.length > 0) {
    md += `\n## ❌ No Route Found (${noRouteResults.length})\n\n`
    md += `These stop pairs need more data to be connected:\n\n`
    md += `| From | To |\n`
    md += `|------|----|\n`
    for (const r of noRouteResults) {
      md += `| ${r.from} | ${r.to} |\n`
    }
  }

  fs.writeFileSync("full_test_report.md", md)
  console.log(`\n✅ Full report written to: full_test_report.md`)
}

runAllTests()
