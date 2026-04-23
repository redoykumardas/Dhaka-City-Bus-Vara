const fs = require('fs');
const path = require('path');

// Paths
const STOPS_FILE = 'data/normalized/1_stops.json';
const MASTER_FILE = 'data/master_bus_list.json';
const OUTPUT_FILE = 'data/normalized/7_bus_stops.json';

// Load stops
const stops = JSON.parse(fs.readFileSync(STOPS_FILE, 'utf8'));
const stopMap = new Map();

// Helper to normalize names
const normalize = (name) => {
  if (!name || typeof name !== 'string') return "";
  return name.toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\(.*?\)/g, '') // Remove (Uttara) etc
    .trim();
};

// Index stops by name
stops.forEach(s => {
  stopMap.set(normalize(s.name_english), s.id);
});

// Load master list
const master = JSON.parse(fs.readFileSync(MASTER_FILE, 'utf8'));
const busStops = [];
let idCounter = 1;

master.forEach(bus => {
  const busId = bus.id;
  const rawStops = bus.stops || [];
  
  // Forward sequence
  const forwardMapped = [];
  rawStops.forEach((stopObj) => {
    const stopName = stopObj.en;
    const sId = stopMap.get(normalize(stopName));
    if (sId) {
      forwardMapped.push(sId);
    }
  });

  // Add forward sequence
  forwardMapped.forEach((sId, index) => {
    busStops.push({
      id: idCounter++,
      bus_id: busId,
      stop_id: sId,
      sequence: index + 1
    });
  });

  // Add REVERSE sequence
  const reverseMapped = [...forwardMapped].reverse();
  const reverseOffset = forwardMapped.length;
  
  reverseMapped.forEach((sId, index) => {
    busStops.push({
      id: idCounter++,
      bus_id: busId,
      stop_id: sId,
      sequence: reverseOffset + index + 1
    });
  });
});

console.log(`Generated ${busStops.length} bus-stop mappings (including return trips).`);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(busStops, null, 2));
