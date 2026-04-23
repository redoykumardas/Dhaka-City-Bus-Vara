import { coreSearchUseCase } from "../src/application/coreSearch.usecase"
import { normalizeStop } from "../src/domain/stopNormalizer"
import { ndp } from "../src/infrastructure/normalizedDataProcessor"

function testLogic() {
  console.log("Checking route 88 in ndp...");
  const route88Buses = ndp.busesForRoute.get(88);
  console.log(`Buses for route 88: ${route88Buses ? route88Buses.length : 'undefined'}`);
  
  if (route88Buses && route88Buses.length > 0) {
    console.log("First bus:", route88Buses[0].name_en);
  }

  // Check what's in busRoutes for route 88
  const mappings = ndp.busRoutes.filter(br => br.route_id === 88);
  console.log(`Raw mappings for route 88:`, mappings);

  console.log("\nSearching...");
  const from = normalizeStop("Uttara");
  const to = normalizeStop("Mohakhali");
  const results = coreSearchUseCase(from, to);
  
  if (results.length > 0) {
    const bestRoute = results[0];
    console.log(`Best route uses Route ID: ${bestRoute.segments[0].routeId}`);
    console.log(`Buses array length: ${bestRoute.segments[0].buses.length}`);
  }
}

testLogic();
