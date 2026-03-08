import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';

// List files to find the PDF
console.log("Current dir files:", readdirSync('.').slice(0, 20));

try {
  console.log("Scripts dir:", readdirSync('./scripts'));
} catch(e) {
  console.log("No scripts dir from cwd");
}

try {
  console.log("/scripts dir:", readdirSync('/scripts'));
} catch(e) {
  console.log("No /scripts dir");
}

// Try various paths
const paths = [
  'scripts/dashboard.pdf',
  '/scripts/dashboard.pdf',
  './scripts/dashboard.pdf',
  'public/images/contractor-dashboard-full.pdf',
  '/public/images/contractor-dashboard-full.pdf',
];

for (const p of paths) {
  console.log(`${p}: ${existsSync(p)}`);
}
