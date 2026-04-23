const fs = require('fs');

// Simple BFS to check connectivity in the graph
function findPath(graph, start, end) {
    const queue = [[start]];
    const visited = new Set();
    while (queue.length > 0) {
        const path = queue.shift();
        const node = path[path.length - 1];
        if (node === end) return path;
        if (!visited.has(node)) {
            visited.add(node);
            const neighbors = graph[node] || [];
            for (const neighbor of neighbors) {
                queue.push([...path, neighbor.to]);
            }
        }
    }
    return null;
}

const stopsRaw = JSON.parse(fs.readFileSync('data/normalized/1_stops.json', 'utf8'));
const routeStopsRaw = JSON.parse(fs.readFileSync('data/normalized/3_route_stops.json', 'utf8'));

const idToName = {};
stopsRaw.forEach(s => idToName[s.id] = s.name_english);

const routeStopsByRoute = new Map();
for (const rs of routeStopsRaw) {
    if (!routeStopsByRoute.has(rs.route_id)) routeStopsByRoute.set(rs.route_id, []);
    routeStopsByRoute.get(rs.route_id).push(rs);
}
for (const arr of routeStopsByRoute.values()) arr.sort((a, b) => a.sequence - b.sequence);

const graph = {};
for (const [routeId, stops] of routeStopsByRoute) {
    for (let i = 0; i < stops.length - 1; i++) {
        const fromName = idToName[stops[i].stop_id];
        const toName = idToName[stops[i + 1].stop_id];
        if (!fromName || !toName) continue;
        if (!graph[fromName]) graph[fromName] = [];
        graph[fromName].push({ to: toName });
        if (!graph[toName]) graph[toName] = [];
        graph[toName].push({ to: fromName });
    }
}

const start = "Abdullahpur";
const end = "Airport";
console.log(`Searching from "${start}" to "${end}"...`);
const path = findPath(graph, start, end);
console.log('Path found:', path);
