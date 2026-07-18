import fs from 'fs';

// Fix Leads.tsx
let leadsContent = fs.readFileSync('src/components/Leads.tsx', 'utf8');
leadsContent = leadsContent.replace(/setSource\(".*?"\);/, 'setSource("WhatsApp");'); // User requested acquisitionChannel="WhatsApp", the code has source & channel. Let's fix both to avoid issues.
leadsContent = leadsContent.replace(/setChannel\(".*?"\);/, 'setChannel("WhatsApp");');
leadsContent = leadsContent.replace(/setStatus\(".*?"\);/, 'setStatus("New Enquiry");');
leadsContent = leadsContent.replace(/setNotes\(".*?"\);/, 'setNotes("");');
fs.writeFileSync('src/components/Leads.tsx', leadsContent);

// Fix Customers.tsx
let custContent = fs.readFileSync('src/components/Customers.tsx', 'utf8');
custContent = custContent.replace(/setNotes\(".*?"\);/, 'setNotes("");');
fs.writeFileSync('src/components/Customers.tsx', custContent);

// Fix Services.tsx
let servContent = fs.readFileSync('src/components/Services.tsx', 'utf8');
servContent = servContent.replace(/setIsActive\(.*?\);/, 'setIsActive(true);');
servContent = servContent.replace(/setDescription\(".*?"\);/, 'setDescription("");');
fs.writeFileSync('src/components/Services.tsx', servContent);

// Fix Employees.tsx
let empContent = fs.readFileSync('src/components/Employees.tsx', 'utf8');
empContent = empContent.replace(/setStatus\(".*?"\);/, 'setStatus("Active");');
fs.writeFileSync('src/components/Employees.tsx', empContent);

// Fix Partners.tsx
let partContent = fs.readFileSync('src/components/Partners.tsx', 'utf8');
partContent = partContent.replace(/setStatus\(".*?"\);/, 'setStatus("Active");');
fs.writeFileSync('src/components/Partners.tsx', partContent);

// Fix Bookings.tsx
let bookContent = fs.readFileSync('src/components/Bookings.tsx', 'utf8');
bookContent = bookContent.replace(/setPaymentStatus\(".*?"\);/, 'setPaymentStatus("Unpaid");');
bookContent = bookContent.replace(/setAmountPaid\(.*?\);/, 'setAmountPaid(0);');
fs.writeFileSync('src/components/Bookings.tsx', bookContent);
