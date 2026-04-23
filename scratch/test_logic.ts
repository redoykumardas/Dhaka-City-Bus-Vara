import { coreSearchUseCase } from "../src/application/coreSearch.usecase"
import { normalizeStop } from "../src/domain/stopNormalizer"

function testLogic() {
  const fromRaw = "Uttara";
  const toRaw = "Mohakhali";

  console.log(`\n======================================================`);
  console.log(`🚌 TESTING CORE SEARCH USE CASE`);
  console.log(`======================================================\n`);
  
  const from = normalizeStop(fromRaw);
  const to = normalizeStop(toRaw);

  console.log(`Searching from: [${from}] to: [${to}]\n`);

  const results = coreSearchUseCase(from, to);

  if (results.length === 0) {
    console.log("❌ No routes found.");
    return;
  }

  console.log(`✅ Found ${results.length} possible route options.\n`);
  
  const bestRoute = results[0];
  
  console.log(`--- BEST ROUTE SUMMARY ---`);
  console.log(`Type:          ${bestRoute.type.toUpperCase()}`);
  console.log(`Total Fare:    ${bestRoute.totalFare} BDT`);
  console.log(`Total Dist:    ${bestRoute.totalDistanceKm} km`);
  console.log(`Total Time:    ${bestRoute.totalTime} mins`);
  console.log(`Full Path:     ${bestRoute.path.join(" ➔ ")}`);
  console.log(`\n------------------------------------------------------\n`);

  console.log(`--- SEGMENT DETAILS ---\n`);

  bestRoute.segments.forEach((seg, i) => {
    console.log(`Segment ${i + 1}: ${seg.from} ➔ ${seg.to}`);
    console.log(`  💰 Fare: ${seg.fare} BDT`);
    console.log(`  📏 Dist: ${seg.distanceKm} km`);
    console.log(`  ⏱ Time: ${seg.estimatedMinutes} mins`);
    console.log(`  📍 Route: ${seg.routeNumber || "Unknown"} (Route ID: ${seg.routeId})`);
    
    console.log(`  🚌 Available Buses (${seg.buses.length}):`);
    if (seg.buses.length > 0) {
      seg.buses.forEach(b => {
        console.log(`     - ${b.name} (${b.serviceType})`);
      });
    } else {
      console.log(`     [!] No bus operators found for this segment.`);
    }

    console.log(`  🗺️ Segment Path:`);
    console.log(`     ${seg.path.join(" ➔ ")}`);
    console.log();
  });
}

testLogic();
