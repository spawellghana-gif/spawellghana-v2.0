import fs from 'fs';

let content = fs.readFileSync('src/lib/dataService.ts', 'utf8');

content = content.replace(
  'const services = await seedCollectionIfEmpty<Service>("services", SEED_SERVICES);',
  'const services = await fetchCollection<Service>("services");'
);

fs.writeFileSync('src/lib/dataService.ts', content);
