const { ndp } = require('./src/infrastructure/normalizedDataProcessor');
const graph = ndp.buildGraph();
const abdullahpurId = 20;
const airportId = 327;

console.log('Abdullahpur edges:', graph[abdullahpurId]);
if (graph[abdullahpurId]) {
    const toAirport = graph[abdullahpurId].filter(e => e.to === airportId);
    console.log('Edges to Airport:', toAirport);
}
