const fs = require('fs');
const routeStops = JSON.parse(fs.readFileSync('data/normalized/3_route_stops.json', 'utf8'));

const abdullahpurId = 20;
const airportId = 327;

const routesWithBoth = [];
const routes = new Set(routeStops.map(rs => rs.route_id));

routes.forEach(rid => {
    const stops = routeStops.filter(rs => rs.route_id === rid).sort((a, b) => a.sequence - b.sequence);
    const abdIdx = stops.findIndex(s => s.stop_id === abdullahpurId);
    const airIdx = stops.findIndex(s => s.stop_id === airportId);
    
    if (abdIdx !== -1 && airIdx !== -1) {
        console.log(`Route ${rid}: Abdullahpur at seq ${stops[abdIdx].sequence}, Airport at seq ${stops[airIdx].sequence}`);
        if (Math.abs(abdIdx - airIdx) === 1) {
            console.log(`  -> CONSECUTIVE!`);
        }
    }
});
