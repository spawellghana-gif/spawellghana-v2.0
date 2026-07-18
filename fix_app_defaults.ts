import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Leads defaults
content = content.replace(
  /const handleAddLead = async \(newLead: .*?\) => \{\n\s*const id = .*?;\n\s*const payload = \{([\s\S]*?)\};/m,
  'const handleAddLead = async (newLead: Omit<Lead, "id" | "createdAt" | "updatedAt">) => {\n    const id = "L" + String(Date.now()).slice(-6);\n    const payload = {\n      status: "New Enquiry",\n      acquisitionChannel: "WhatsApp",\n      notes: "",\n      ...newLead,\n      id,\n      isDeleted: false\n    };'
);

// Customers defaults
content = content.replace(
  /const handleAddCustomer = async \(newC: .*?\) => \{\n\s*const id = .*?;\n\s*const payload = \{([\s\S]*?)\};/m,
  'const handleAddCustomer = async (newC: Omit<Customer, "id" | "createdAt" | "updatedAt">) => {\n    const id = "CUST-" + String(Date.now()).slice(-6);\n    const payload = {\n      totalBookings: 0,\n      lifetimeRevenue: 0,\n      firstBookingDate: null,\n      lastBookingDate: null,\n      notes: "",\n      ...newC,\n      id,\n      isDeleted: false\n    };'
);

// Services defaults
content = content.replace(
  /const handleAddService = async \(newS: .*?\) => \{\n\s*const id = .*?;\n\s*const payload = \{([\s\S]*?)\};/m,
  'const handleAddService = async (newS: Omit<Service, "id" | "createdAt" | "updatedAt">) => {\n    const id = "SERV-" + String(Date.now()).slice(-6);\n    const payload = {\n      active: true,\n      description: "",\n      ...newS,\n      id,\n      isDeleted: false\n    };'
);

// Employees defaults
content = content.replace(
  /const handleAddEmployee = async \(newE: .*?\) => \{\n\s*const id = .*?;\n\s*const payload = \{([\s\S]*?)\};/m,
  'const handleAddEmployee = async (newE: Omit<Employee, "id" | "createdAt" | "updatedAt">) => {\n    const id = "EMP-" + String(Date.now()).slice(-6);\n    const payload = {\n      status: "Active",\n      totalBookings: 0,\n      completedBookings: 0,\n      revenueGenerated: 0,\n      ...newE,\n      id,\n      isDeleted: false\n    };'
);

// Partners defaults
content = content.replace(
  /const handleAddPartner = async \(newP: .*?\) => \{\n\s*const id = .*?;\n\s*const payload = \{([\s\S]*?)\};/m,
  'const handleAddPartner = async (newP: Omit<Partner, "id" | "createdAt" | "updatedAt">) => {\n    const id = "PRT-" + String(Date.now()).slice(-6);\n    const payload = {\n      status: "Active",\n      leadsSent: 0,\n      bookingsGenerated: 0,\n      revenueGenerated: 0,\n      commissionEarned: 0,\n      ...newP,\n      id,\n      isDeleted: false\n    };'
);

// Bookings defaults
// Wait, booking needs `outstandingBalance`. But it depends on `finalAmount` and `amountPaid`.
// We can compute `outstandingBalance` in `handleAddBooking`.
content = content.replace(
  /const handleAddBooking = async \(newB: .*?\) => \{\n\s*const \{ id, \.\.\.data \} = newB;\n\s*const payload = \{([\s\S]*?)\};/m,
  'const handleAddBooking = async (newB: Omit<Booking, "id" | "createdAt" | "updatedAt"> & { id: string }) => {\n    const { id, ...data } = newB;\n    const amountPaid = data.amountPaid || 0;\n    const payload = {\n      amountPaid,\n      paymentStatus: "Unpaid",\n      outstandingBalance: data.finalAmount - amountPaid,\n      ...data,\n      id,\n      isDeleted: false\n    };'
);

fs.writeFileSync('src/App.tsx', content);
