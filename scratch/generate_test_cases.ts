import fs from "fs"
import { ndp } from "../src/infrastructure/normalizedDataProcessor"
import { coreSearchUseCase } from "../src/application/coreSearch.usecase"

const POPULAR_STOPS = [
  "Mirpur 10", "Motijheel", "Farmgate", "Uttara", "Gabtoli", 
  "Gulistan", "Mohakhali", "Sayedabad", "Shahbagh", "Badda",
  "Rampura", "Jatrabari", "Mohammadpur", "Dhanmondi 15", "Azimpur",
  "Airport", "Banani", "Gulshan 1", "Mogbazar", "Khilkhet",
  "Abdullahpur", "Kuril Bishwa Road", "Malibagh", "Kakrail"
];

function generateTestCases() {
  console.log("Generating 100 test cases...");
  const results = [];
  let count = 0;

  // Generate 100 valid test cases
  for (let i = 0; i < POPULAR_STOPS.length; i++) {
    for (let j = 0; j < POPULAR_STOPS.length; j++) {
      if (i === j) continue;
      if (count >= 100) break;

      const from = POPULAR_STOPS[i];
      const to = POPULAR_STOPS[j];

      try {
        const searchResult = coreSearchUseCase(from, to);
        
        if (searchResult && searchResult.length > 0) {
          const bestRoute = searchResult[0];
          results.push({
            from,
            to,
            type: bestRoute.type,
            transfers: bestRoute.transfers,
            totalFare: bestRoute.totalFare,
            totalTime: bestRoute.totalTime,
            totalDistanceKm: bestRoute.totalDistanceKm,
            pathSummary: bestRoute.segments.map(seg => seg.from + "->" + seg.to).join(" [Transfer] ")
          });
          count++;
        }
      } catch (e) {
        // ignore errors
      }
    }
    if (count >= 100) break;
  }

  // Format as Markdown
  let markdown = `# 100 Test Cases for Dhaka Bus Routing Engine\n\n`;
  markdown += `| Start | Destination | Type | Fare (BDT) | Time (min) | Dist (km) | Path Summary |\n`;
  markdown += `|---|---|---|---|---|---|---|\n`;

  for (const r of results) {
    markdown += `| **${r.from}** | **${r.to}** | ${r.type} | ${r.totalFare} | ${r.totalTime} | ${r.totalDistanceKm} | ${r.pathSummary} |\n`;
  }

  fs.writeFileSync("test_cases_report.md", markdown);
  console.log(`Successfully generated test_cases_report.md with ${results.length} cases.`);
}

generateTestCases();
