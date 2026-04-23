const fs = require('fs');
const path = require('path');

const dataDir = "/home/redoy/Documents/Production-line/Dhaka-City-Bus-Vara/data/normalized";

const loadJson = (filename) => {
    return JSON.parse(fs.readFileSync(path.join(dataDir, filename), 'utf8'));
};

const stops = loadJson("1_stops.json");
const routes = loadJson("2_routes.json");
const routeFares = loadJson("4_route_fares.json");
const buses = loadJson("5_buses.json");
const busRoutes = loadJson("6_bus_routes.json");

const startIds = [20, 21, 460];
const endIds = [327, 13, 167];

const results = [];
for (const rf of routeFares) {
    if (startIds.includes(rf.from_stop_id) && endIds.includes(rf.to_stop_id)) {
        const rid = rf.route_id;
        const bIds = busRoutes.filter(br => br.route_id === rid).map(br => br.bus_id);
        const bNames = buses.filter(b => bIds.includes(b.id)).map(b => b.name_en);
        
        results.push({
            bus_names: bNames,
            from: stops.find(s => s.id === rf.from_stop_id).name_english,
            to: stops.find(s => s.id === rf.to_stop_id).name_english,
            fare: rf.fare,
            distance_km: rf.distance_km,
            route_id: rid
        });
    }
}

const uniqueResults = [];
const seen = new Set();
for (const res of results) {
    if (res.bus_names.length === 0) continue;
    const key = res.bus_names.sort().join('|') + res.fare;
    if (!seen.has(key)) {
        uniqueResults.push(res);
        seen.add(key);
    }
}

console.log(JSON.stringify(uniqueResults, null, 2));
