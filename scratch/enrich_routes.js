const fs = require('fs');

console.log("Loading datasets...");
const routeStops = JSON.parse(fs.readFileSync('data/normalized/3_route_stops.json', 'utf8'));
const busStops = JSON.parse(fs.readFileSync('data/normalized/7_bus_stops.json', 'utf8'));

// Group bus stops by bus_id into forward sequences
const busPaths = {};
busStops.forEach(bs => {
  if (!busPaths[bs.bus_id]) busPaths[bs.bus_id] = [];
  busPaths[bs.bus_id].push(bs);
});

Object.values(busPaths).forEach(arr => {
  arr.sort((a, b) => a.sequence - b.sequence);
  // We only care about forward path for interpolation to avoid confusion
  // Usually forward path is the first half
  const half = Math.floor(arr.length / 2);
  // Actually some buses might just be one way in the array if we didn't double them,
  // but since we doubled them, we can just split by half.
});

// Define Master Highway Corridors to force interpolate critical "hidden" stops
const masterCorridors = [
  // Airport Road (Northbound)
  [96, 341, 110, 327, 167, 401, 13, 141, 20], 
  // Airport Road (Southbound)
  [20, 141, 13, 401, 167, 327, 110, 341, 96],
  // Kalshi to Abdullahpur (Northbound via Khilkhet/Airport)
  [364, 365, 263, 86, 173, 110, 327, 20],
  // Abdullahpur to Kalshi (Southbound)
  [20, 327, 110, 173, 86, 263, 365, 364],
  // Mirpur Road (Southbound)
  [126, 67, 458, 454, 66, 30, 168, 65, 332, 340],
  // Mirpur Road (Northbound)
  [340, 332, 65, 168, 30, 66, 454, 458, 67, 126],
  // VIP Road / Shahbag to Motijheel
  [340, 483, 344, 348, 307, 134, 251],
  // Motijheel to Shahbag
  [251, 134, 307, 348, 344, 483, 340]
];

// Map stop pairs to forced intermediate sequences
const forcedMap = {};
masterCorridors.forEach(path => {
  for (let i = 0; i < path.length; i++) {
    for (let j = i + 2; j < path.length; j++) {
      const pairKey = `${path[i]}-${path[j]}`;
      if (!forcedMap[pairKey]) {
        forcedMap[pairKey] = path.slice(i + 1, j);
      }
    }
  }
});

// Helper: find path between u and v in any bus or forced corridor
function findIntermediateStops(u, v) {
  const pairKey = `${u}-${v}`;
  if (forcedMap[pairKey]) return forcedMap[pairKey];

  let bestPath = null;
  for (const busId in busPaths) {
    const stops = busPaths[busId];
    const uIdxs = [];
    const vIdxs = [];
    for (let i = 0; i < stops.length; i++) {
      if (stops[i].stop_id === u) uIdxs.push(i);
      if (stops[i].stop_id === v) vIdxs.push(i);
    }
    for (const ui of uIdxs) {
      for (const vi of vIdxs) {
        if (ui < vi) {
          const path = stops.slice(ui + 1, vi).map(s => s.stop_id);
          if (!bestPath || path.length < bestPath.length) {
            bestPath = path;
          }
        }
      }
    }
  }
  return bestPath || [];
}

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
    newSequence.push(stops[i].stop_id);

    // If there is a next stop, try to interpolate
    if (i < stops.length - 1) {
      const u = stops[i].stop_id;
      const v = stops[i + 1].stop_id;
      const intermediates = findIntermediateStops(u, v);
      
      // Only interpolate if there are actually missing stops (1 to 5 stops usually)
      if (intermediates.length > 0 && intermediates.length < 15) {
        // Prevent duplicate interpolation if BRTA already has them close
        intermediates.forEach(mid => newSequence.push(mid));
      }
    }
  }

  // Remove duplicates in sequence (e.g. A -> B -> B -> C)
  const uniqueSeq = [];
  for (let i = 0; i < newSequence.length; i++) {
    if (i === 0 || newSequence[i] !== newSequence[i - 1]) {
      uniqueSeq.push(newSequence[i]);
    }
  }

  // Add to final array
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
console.log(`Generated 8_enriched_route_stops.json with ${enrichedRouteStops.length} stops (was ${routeStops.length}).`);
