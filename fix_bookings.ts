import fs from 'fs';

let content = fs.readFileSync('src/components/Bookings.tsx', 'utf8');

// We need to add employees and partners as props
content = content.replace(
  'interface BookingsProps {\n  bookings: Booking[];\n  customers: Customer[];\n  services: Service[];',
  'interface BookingsProps {\n  bookings: Booking[];\n  customers: Customer[];\n  services: Service[];\n  employees?: any[];\n  partners?: any[];'
);

content = content.replace(
  'export default function Bookings({ bookings, customers, services, onAdd, onUpdate, onDelete }: BookingsProps) {',
  'export default function Bookings({ bookings, customers, services, employees = [], partners = [], onAdd, onUpdate, onDelete }: BookingsProps) {'
);

// We need to change Therapist field to use Employees, and add Partner field
content = content.replace(
  'const THERAPISTS = ["Comfort Osei", "Kofi Asante", "Mavis Mensah", "Rita Addo", "Unassigned"];',
  ''
);

// Form States addition
content = content.replace(
  '  const [therapist, setTherapist] = useState("Unassigned");',
  '  const [therapist, setTherapist] = useState("Unassigned");\n  const [employeeId, setEmployeeId] = useState("");\n  const [partnerId, setPartnerId] = useState("");'
);

// handleOpenAdd
content = content.replace(
  '    setTherapist("Unassigned");',
  '    setTherapist("Unassigned");\n    setEmployeeId("");\n    setPartnerId("");'
);

// handleOpenEdit
content = content.replace(
  '    setTherapist(b.therapist || "Unassigned");',
  '    setTherapist(b.therapist || "Unassigned");\n    setEmployeeId(b.employeeId || "");\n    setPartnerId(b.partnerId || "");'
);

// Handle save
content = content.replace(
  '        therapist,',
  '        therapist,\n        employeeId,\n        partnerId,'
);

// Handle save therapist name sync
content = content.replace(
  'const serviceName = services.find(s => s.id === selectedServiceId)?.name || "";',
  'const serviceName = services.find(s => s.id === selectedServiceId)?.name || "";\n    const emp = employees.find(e => e.id === employeeId);\n    const selectedTherapistName = emp ? `${emp.firstName} ${emp.lastName}` : "Unassigned";\n    if (employeeId) { therapist = selectedTherapistName; }'
);

// Form fields rendering - Replace Therapist select
const oldTherapistSelect = `                    <select 
                      value={therapist}
                      onChange={(e) => setTherapist(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      {THERAPISTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>`;

const newTherapistSelect = `                    <select 
                      value={employeeId}
                      onChange={(e) => {
                        setEmployeeId(e.target.value);
                        const emp = employees.find(emp => emp.id === e.target.value);
                        if (emp) setTherapist(\`\${emp.firstName} \${emp.lastName}\`);
                        else setTherapist("Unassigned");
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="">-- Select Employee --</option>
                      {employees.filter(e => !e.isDeleted).map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                    </select>`;

content = content.replace(oldTherapistSelect, newTherapistSelect);

// Add Partner select before Stage
const partnerSelect = `
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Referral Partner (Optional)</label>
                    <select 
                      value={partnerId}
                      onChange={(e) => setPartnerId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="">-- No Partner --</option>
                      {partners.filter(p => !p.isDeleted).map(p => <option key={p.id} value={p.id}>{p.businessName}</option>)}
                    </select>
                  </div>
`;

content = content.replace(
  '                  <div>\n                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Stage</label>',
  partnerSelect + '                  <div>\n                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Stage</label>'
);

fs.writeFileSync('src/components/Bookings.tsx', content);
