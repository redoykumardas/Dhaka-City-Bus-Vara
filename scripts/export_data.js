const fs = require('fs');
const path = require('path');

// Load raw data
const busListRaw = JSON.parse(fs.readFileSync('./src/infrastructure/data/dhaka_bus_list.json', 'utf8'));
const fareData1 = JSON.parse(fs.readFileSync('./data/fare_chart_data1.json', 'utf8'));
const fareData2 = JSON.parse(fs.readFileSync('./data/fare_chart_data2.json', 'utf8'));
const fareData3 = JSON.parse(fs.readFileSync('./data/fare_chart_data3.json', 'utf8'));
const fareData4 = JSON.parse(fs.readFileSync('./data/fare_chart_data4.json', 'utf8'));
const fareData5 = JSON.parse(fs.readFileSync('./data/fare_chart_data5.json', 'utf8'));

// Helper for normalization (simplified for this script)
function normalizeStop(name) {
  return name.trim().replace(/-/g, ' ');
}

function extractEnglishName(name) {
  const match = name.match(/\(([^)]+)\)/);
  return match ? match[1].trim() : name.trim();
}

const buses = [];
const stops = [];
const routes = [];
const routeStops = [];
const routeBusList = [];
const fareSegments = [];

const stopMap = new Map();
let busCounter = 0;
let routeCounter = 0;
let stopCounter = 0;

function getStopId(rawName) {
  const normalized = normalizeStop(rawName);
  if (stopMap.has(normalized)) return stopMap.get(normalized);
  
  const id = ++stopCounter;
  stopMap.set(normalized, id);
  stops.push({ id, stop_id: id, stop_name: normalized });
  return id;
}

// 1. Process Bus & Routes
busListRaw.forEach(raw => {
  const busId = ++busCounter;
  const routeId = ++routeCounter;

  const firstStop = raw.stops[0]?.en || '';
  const lastStop = raw.stops[raw.stops.length - 1]?.en || '';
  const generatedRouteName = firstStop && lastStop ? `${firstStop} - ${lastStop}` : raw.operator;

  buses.push({ id: busId, bus_id: busId, bus_name: raw.operator });
  routes.push({ id: routeId, route_name: generatedRouteName });
  routeBusList.push({ 
    route_id: routeId, 
    bus_id: busId,
    route_name: generatedRouteName
  });

  raw.stops.forEach((stop, index) => {
    const stopId = getStopId(stop.en);
    routeStops.push({
      route_id: routeId,
      stop_id: stopId,
      stop_order: index + 1
    });
  });
});

// 2. Process Fares
const allFareData = [fareData1, fareData2, fareData3, fareData4, fareData5];
allFareData.forEach((data, dataIndex) => {
  const matrices = [];
  
  if (data.fare_chart_data?.fare_matrix) {
    const segments = [];
    data.fare_chart_data.fare_matrix.forEach(entry => {
      const to = extractEnglishName(entry.stop_name);
      for (const [fromRaw, fare] of Object.entries(entry.fares_taka || {})) {
        segments.push({ from: extractEnglishName(fromRaw), to, fare });
      }
    });
    matrices.push({
      route_name: data.fare_chart_data.route,
      route_number: data.fare_chart_data.route_number,
      segments
    });
  }

  const charts = data.fare_charts || data.bus_fare_charts || [];
  charts.forEach(chart => {
    const s = chart.stops || chart.major_stops || [];
    const segments = [];
    for (let i = 0; i < s.length; i++) {
      for (let j = i + 1; j < s.length; j++) {
        const from = extractEnglishName(s[i].stop_name);
        const to = extractEnglishName(s[j].stop_name);
        const fareB = s[j].fare_from_start ?? s[j].fare_from_start_taka ?? 0;
        const fareA = s[i].fare_from_start ?? s[i].fare_from_start_taka ?? 0;
        segments.push({ from, to, fare: Math.max(fareB - fareA, 10) });
      }
    }
    matrices.push({
      route_name: chart.route || chart.route_name,
      route_number: chart.route_number || chart.route_id,
      segments
    });
  });

  matrices.forEach(item => {
    const routeId = ++routeCounter;
    routes.push({ 
      id: routeId, 
      route_name: item.route_name,
      route_number: item.route_number
    });
    
    // For specialized fare routes, we might not have a specific bus_id associated directly here
    // but we can add an entry to routeBusList if needed, or leave it for routes.json
    routeBusList.push({
      route_id: routeId,
      route_name: item.route_name,
      route_number: item.route_number
    });

    item.segments.forEach(segment => {
      fareSegments.push({
        route_id: routeId,
        from_stop: getStopId(segment.from),
        to_stop: getStopId(segment.to),
        fare: segment.fare
      });
    });
  });
});


// Write files
const outputDir = './data/normalized';
fs.writeFileSync(path.join(outputDir, 'buses.json'), JSON.stringify(buses, null, 2));
fs.writeFileSync(path.join(outputDir, 'stops.json'), JSON.stringify(stops, null, 2));
fs.writeFileSync(path.join(outputDir, 'routes.json'), JSON.stringify(routes, null, 2));
fs.writeFileSync(path.join(outputDir, 'route_stops.json'), JSON.stringify(routeStops, null, 2));
fs.writeFileSync(path.join(outputDir, 'route_bus.json'), JSON.stringify(routeBusList, null, 2));
fs.writeFileSync(path.join(outputDir, 'fare_segments.json'), JSON.stringify(fareSegments, null, 2));

console.log('Normalized data exported to ./data/normalized/');
