import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'import { Lead, Customer, Service, Booking, DealStage, PaymentStatus } from "./types";',
  'import { Lead, Customer, Service, Booking, DealStage, PaymentStatus, Employee, Partner } from "./types";'
);

content = content.replace(
  '  createBooking, updateBookingDetails, deleteBookingRecord',
  '  createBooking, updateBookingDetails, deleteBookingRecord,\n  createEmployee, updateEmployeeDetails, deleteEmployeeRecord,\n  createPartner, updatePartnerDetails, deletePartnerRecord'
);

content = content.replace(
  'import Reports from "./components/Reports";',
  'import Reports from "./components/Reports";\nimport Employees from "./components/Employees";\nimport Partners from "./components/Partners";'
);

content = content.replace(
  '  const [bookings, setBookings] = useState<Booking[]>([]);',
  '  const [bookings, setBookings] = useState<Booking[]>([]);\n  const [employees, setEmployees] = useState<Employee[]>([]);\n  const [partners, setPartners] = useState<Partner[]>([]);'
);

content = content.replace(
  '      const { leads: l, customers: c, services: s, bookings: b } = await fetchAllData();',
  '      const { leads: l, customers: c, services: s, bookings: b, employees: e, partners: p } = await fetchAllData();'
);

content = content.replace(
  '      setBookings(b);',
  '      setBookings(b);\n      setEmployees(e);\n      setPartners(p);'
);

content = content.replace(
  '    <div id="sidebar-nav"',
  `    <div id="sidebar-nav"`
);

fs.writeFileSync('src/App.tsx', content);
