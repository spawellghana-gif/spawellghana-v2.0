import fs from 'fs';

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace(
  'interface DashboardProps {\n  leads: Lead[];\n  customers: Customer[];\n  services: Service[];\n  bookings: Booking[];\n  setActiveTab: (tab: string) => void;\n}',
  'interface DashboardProps {\n  leads: Lead[];\n  customers: Customer[];\n  services: Service[];\n  bookings: Booking[];\n  employees?: any[];\n  partners?: any[];\n  setActiveTab: (tab: string) => void;\n}'
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
