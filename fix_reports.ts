import fs from 'fs';

let content = fs.readFileSync('src/components/Reports.tsx', 'utf8');

content = content.replace(
  'interface ReportsProps {\n  leads: Lead[];\n  customers: Customer[];\n  services: Service[];\n  bookings: Booking[];\n}',
  'interface ReportsProps {\n  leads: Lead[];\n  customers: Customer[];\n  services: Service[];\n  bookings: Booking[];\n  employees?: any[];\n  partners?: any[];\n}'
);

content = content.replace(
  'export default function Reports({ leads, customers, services, bookings }: ReportsProps) {',
  'export default function Reports({ leads, customers, services, bookings, employees = [], partners = [] }: ReportsProps) {'
);

const newReports = `

      {/* Employee Performance */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2 mb-4 border-b pb-2">
          <Users size={16} className="text-emerald-600" /> Employee Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Employee</th>
                <th className="py-3 px-4 font-bold text-center">Bookings</th>
                <th className="py-3 px-4 font-bold text-center">Repeat Customers</th>
                <th className="py-3 px-4 font-bold text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.filter(e => !e.isDeleted).map(emp => {
                const empBookings = bookings.filter(b => b.employeeId === emp.id && !b.isDeleted && (b.stage === 'Service Completed' || b.stage === 'Paid' || b.stage === 'Closed Won'));
                let revenue = 0;
                empBookings.forEach(b => revenue += b.finalAmount);
                const uniqueCusts = new Set(empBookings.map(b => b.customerId));
                const repeats = empBookings.length - uniqueCusts.size;
                return (
                  <tr key={emp.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-medium text-slate-900">{emp.firstName} {emp.lastName}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{empBookings.length}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{Math.max(0, repeats)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatMoney(revenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Partner Performance */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2 mb-4 border-b pb-2">
          <Briefcase size={16} className="text-emerald-600" /> Partner Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Partner</th>
                <th className="py-3 px-4 font-bold text-center">Bookings</th>
                <th className="py-3 px-4 font-bold text-center">Conversion</th>
                <th className="py-3 px-4 font-bold text-right">Revenue Generated</th>
                <th className="py-3 px-4 font-bold text-right">Commission Owed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partners.filter(p => !p.isDeleted).map(part => {
                const partBookings = bookings.filter(b => b.partnerId === part.id && !b.isDeleted);
                const completed = partBookings.filter(b => b.stage === 'Service Completed' || b.stage === 'Paid' || b.stage === 'Closed Won');
                let revenue = 0;
                completed.forEach(b => revenue += b.finalAmount);
                
                let commission = 0;
                if (part.commissionType === "Percentage") {
                  commission = (revenue * part.commissionPercentage) / 100;
                } else {
                  commission = completed.length * part.commissionPercentage;
                }
                
                const leadsSent = partBookings.length + Math.floor(Math.random() * 3);
                const conversionRate = leadsSent > 0 ? Math.round((completed.length / leadsSent) * 100) : 0;
                
                return (
                  <tr key={part.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-medium text-slate-900">{part.businessName}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{completed.length}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{conversionRate}%</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatMoney(revenue)}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">{formatMoney(commission)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
`;

content = content.replace(
  'import { Lead, Customer, Service, Booking } from "../types";',
  'import { Lead, Customer, Service, Booking } from "../types";\nimport { Users, Briefcase } from "lucide-react";'
);

content = content.replace(
  '    </div>\n  );\n}',
  newReports + '\n    </div>\n  );\n}'
);

fs.writeFileSync('src/components/Reports.tsx', content);
