import fs from 'fs';

let content = fs.readFileSync('src/lib/dataService.ts', 'utf8');

// Remove import
content = content.replace(/import \{ SEED_SERVICES \} from "\.\.\/data\/seedData";\n/, '');

// Remove seedCollectionIfEmpty
content = content.replace(/\/\/ Helper to seed a collection if empty \(only for services\)[\s\S]*?\} catch \(error\) \{[\s\S]*?\}\n\}/, '');

fs.writeFileSync('src/lib/dataService.ts', content);

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/import \{ SEED_SERVICES \} from "\.\/data\/seedData";\n/, '');
fs.writeFileSync('src/App.tsx', appContent);
