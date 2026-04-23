import { coreSearchUseCase } from "../src/application/coreSearch.usecase"
import { normalizeStop } from "../src/domain/stopNormalizer"
import { ndp } from "../src/infrastructure/normalizedDataProcessor"

function testDirect() {
  const from = ndp.getStopByName("Mirpur 11")?.id;
  const to = ndp.getStopByName("Badda")?.id;

  console.log(`Source: ${from}, Target: ${to}`);

  const sorted = [...ndp.routeStops].sort((a, b) => 
    a.route_id - b.route_id || a.sequence - b.sequence
  );

  const r71 = sorted.filter(r => r.route_id === 71);
  console.log(`Route 71 stops length: ${r71.length}`);
  const r71Edges = [];
  for (let i = 0; i < r71.length - 1; i++) {
    r71Edges.push(`${r71[i].stop_id} -> ${r71[i+1].stop_id}`);
  }
  console.log("Route 71 internal edges:", r71Edges);

  // Search
  console.log("Running search...");
  const results = coreSearchUseCase("Mirpur 11", "Badda");
  console.log(`Found ${results.length} results. Best is type: ${results[0]?.type}`);
}

testDirect();
