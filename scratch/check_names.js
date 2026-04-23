const fs = require('fs');
const stops = JSON.parse(fs.readFileSync('data/normalized/1_stops.json', 'utf8'));
const names = stops.map(s => s.name_english).filter(n => n && (n.includes('Abdullahpur') || n.includes('Airport')));
console.log(names);
