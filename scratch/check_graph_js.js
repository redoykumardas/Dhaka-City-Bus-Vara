const fs = require('fs');

const stopsRaw = JSON.parse(fs.readFileSync('data/normalized/1_stops.json', 'utf8'));
const routeStopsRaw = JSON.parse(fs.readFileSync('data/normalized/3_route_stops.json', 'utf8'));

const routeStopsByRoute = new Map();
for (const rs of routeStopsRaw) {
    if (!routeStopsByRoute.has(rs.route_id)) routeStopsByRoute.set(rs.route_id, []);
    routeStopsByRoute.get(rs.route_id).push(rs);
}
for (const arr of routeStopsByRoute.values()) arr.sort((a, b) => a.sequence - b.sequence);

const graph = {};
for (const [routeId, stops] of routeStopsByRoute) {
    for (let i = 0; i < stops.length - 1; i++) {
        const fromId = stops[i].stop_id;
        const toId = stops[i + 1].stop_id;
        if (!graph[fromId]) graph[fromId] = [];
        graph[fromId].push({ to: toId, routeId });
        if (!graph[toId]) graph[toId] = [];
        graph[toId].push({ to: fromId, routeId });
    }
}

const abdullahpurId = 20;
const airportId = 327;
console.log('Abdullahpur edges count:', graph[abdullahpurId]?.length);
const edgesToAirport = graph[abdullahpurId]?.filter(e => e.to === airportId) || [];
console.log('Edges to Airport:', edgesToAirport);
