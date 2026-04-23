const fs = require('fs');

const stopsFile = 'data/normalized/1_stops.json';
const stops = JSON.parse(fs.readFileSync(stopsFile, 'utf8'));

// Fixes
const fixes = {
  "Gawsia/Nilkhet": { en: "Gawsia", bn: "গাউছিয়া" },
  "Demra Staff Quarter / New Jailkhana": { en: "Demra Staff Quarter", bn: "ডেমরা স্টাফ কোয়ার্টার" },
  "Nadda/Fashion": { en: "Nadda", bn: "নর্দ্দা" },
  "Badda Link Road/Madhya Badda": { en: "Badda Link Road", bn: "বাড্ডা লিংক রোড" }
};

let count = 0;
stops.forEach(s => {
  const oldName = s.name_english;
  if (fixes[oldName]) {
    console.log(`Fixing: ${oldName} -> ${fixes[oldName].en}`);
    s.name_english = fixes[oldName].en;
    if (fixes[oldName].bn) {
      s.name_bangla = fixes[oldName].bn;
    }
    count++;
  }
});

if (count > 0) {
  fs.writeFileSync(stopsFile, JSON.stringify(stops, null, 2));
  console.log(`Fixed ${count} slashed stop names in 1_stops.json`);
} else {
  console.log("No slashed names found to fix.");
}
