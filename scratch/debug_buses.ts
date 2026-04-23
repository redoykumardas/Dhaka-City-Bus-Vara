import { ndp } from "../src/infrastructure/normalizedDataProcessor"

function testDirect() {
  const fromId = ndp.getStopByName("Mirpur 11")?.id!;
  const toId = ndp.getStopByName("Badda")?.id!;
  
  const busesSeg = ndp.getBusesForSegment(fromId, toId);
  console.log(`Buses for segment: ${busesSeg.length}`);
  
  const busesRoute = ndp.busesForRoute.get(71) || [];
  console.log(`Buses for route 71 fallback: ${busesRoute.length}`);
}

testDirect();
