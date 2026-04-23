const fs = require('fs');
const routeStops = JSON.parse(fs.readFileSync('data/normalized/3_route_stops.json', 'utf8'));

const abdullahpurId = 20;
const airportId = 327;

const routesWithAbdullahpur = new Set(routeStops.filter(rs => rs.stop_id === abdullahpurId).map(rs => rs.route_id));
const routesWithAirport = new Set(routeStops.filter(rs => rs.stop_id === airportId).map(rs => rs.route_id));

const commonRoutes = [...routesWithAbdullahpur].filter(id => routesWithAirport.has(id));

console.log('Routes with Abdullahpur:', routesWithAbdullahpur.size);
console.log('Routes with Airport:', routesWithAirport.size);
console.log('Common Routes:', commonRoutes);

if (commonRoutes.length > 0) {
    const routes = JSON.parse(fs.readFileSync('data/normalized/2_routes.json', 'utf8'));
    commonRoutes.forEach(rid => {
        const r = routes.find(r => r.id === rid);
        console.log(`Route ID ${rid}: ${r.route.english} (${r.route_number.english})`);
    });
}
