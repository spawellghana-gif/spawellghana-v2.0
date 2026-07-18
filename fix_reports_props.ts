import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '                <Reports \n                  leads={leads}\n                  customers={customers}\n                  services={services}\n                  bookings={bookings}\n                />',
  '                <Reports \n                  leads={leads}\n                  customers={customers}\n                  services={services}\n                  bookings={bookings}\n                  employees={employees}\n                  partners={partners}\n                />'
);

fs.writeFileSync('src/App.tsx', content);
