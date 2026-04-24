const fs = require('fs');

console.log("Loading datasets...");
const routeStops = JSON.parse(fs.readFileSync('data/normalized/3_route_stops.json', 'utf8'));

// Define Master Corridors (sequences of stop IDs)
const corridors = [
  // Airport Road Corridor (Northbound)
  [96, 110, 327, 167, 401, 13, 20], 
  // Airport Road Corridor (Southbound)
  [20, 13, 401, 167, 327, 110, 96],
  // Kalshi to Abdullahpur (Northbound via Khilkhet/Airport)
  [86, 172, 110, 327, 20],
  // Abdullahpur to Kalshi (Southbound)
  [20, 327, 110, 172, 86],
  // Mirpur Road (Southbound)
  [126, 67, 458, 454, 66, 30, 65, 332, 340],
  // Mirpur Road (Northbound)
  [340, 332, 65, 30, 66, 454, 458, 67, 126]
];

// Map stop pairs to intermediate sequences
const masterMap = {};
corridors.forEach(path => {
  for (let i = 0; i < path.length; i++) {
    for (let j = i + 2; j < path.length; j++) {
      const pairKey = `${path[i]}-${path[j]}`;
      if (!masterMap[pairKey]) {
        masterMap[pairKey] = path.slice(i + 1, j);
      }
    }
  }
});

console.log(`Master map built with ${Object.keys(masterMap).length} forced intermediate sequences.`);

// Group route stops by route_id
const routePaths = {};
routeStops.forEach(rs => {
  if (!routePaths[rs.route_id]) routePaths[rs.route_id] = [];
  routePaths[rs.route_id].push(rs);
});

const enrichedRouteStops = [];
let globalId = 1;

for (const routeId in routePaths) {
  const stops = routePaths[routeId].sort((a, b) => a.sequence - b.sequence);
  const newSequence = [];

  for (let i = 0; i < stops.length; i++) {
    const currentStopId = stops[i].stop_id;
    newSequence.push(currentStopId);

    if (i < stops.length - 1) {
      const nextStopId = stops[i + 1].stop_id;
      const pairKey = `${currentStopId}-${nextStopId}`;
      
      if (masterMap[pairKey]) {
        // console.log(`Enriching Route ${routeId}: ${currentStopId} -> ${nextStopId} with [${masterMap[pairKey]}]`);
        masterMap[pairKey].forEach(mid => newSequence.push(mid));
      }
    }
  }

  // Remove potential duplicates (A -> B -> B -> C)
  const uniqueSeq = [];
  for (let i = 0; i < newSequence.length; i++) {
    if (i === 0 || newSequence[i] !== newSequence[i - 1]) {
      uniqueSeq.push(newSequence[i]);
    }
  }

  uniqueSeq.forEach((stopId, idx) => {
    enrichedRouteStops.push({
      id: globalId++,
      route_id: parseInt(routeId),
      stop_id: stopId,
      sequence: idx + 1
    });
  });
}

fs.writeFileSync('data/normalized/8_enriched_route_stops.json', JSON.stringify(enrichedRouteStops, null, 2));
console.log(`Enrichment complete! Generated 8_enriched_route_stops.json with ${enrichedRouteStops.length} stops.`);
