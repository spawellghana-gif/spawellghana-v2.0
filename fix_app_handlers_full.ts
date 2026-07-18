import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\/\/ 1\. Leads[\s\S]*?\/\/ Lead Conversion Flow/g;

const replacement = `
  // 1. Leads
  const handleAddLead = async (newLead: Omit<Lead, "id" | "createdAt" | "updatedAt">) => {
    const id = "L" + String(Date.now()).slice(-6);
    const payload = {
      ...newLead,
      id,
      isDeleted: false
    };
    const saved = await createLead(payload as Lead);
    setLeads(prev => [saved, ...prev]);
  };

  const handleUpdateLead = async (id: string, updated: Partial<Lead>) => {
    await updateLeadDetails(id, updated);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
  };

  const handleDeleteLead = async (id: string) => {
    await deleteLeadRecord(id, true);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, isDeleted: true } : l));
  };

  // 2. Customers
  const handleAddCustomer = async (newC: Omit<Customer, "id" | "createdAt" | "updatedAt">) => {
    const id = "CUST-" + String(Date.now()).slice(-6);
    const payload = {
      ...newC,
      id,
      isDeleted: false
    };
    const saved = await createCustomer(payload as Customer);
    setCustomers(prev => [saved, ...prev]);
  };

  const handleUpdateCustomer = async (id: string, updated: Partial<Customer>) => {
    await updateCustomerDetails(id, updated);
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const handleDeleteCustomer = async (id: string) => {
    await deleteCustomerRecord(id, true);
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, isDeleted: true } : c));
  };

  // 3. Services
  const handleAddService = async (newS: Omit<Service, "id" | "createdAt" | "updatedAt">) => {
    const id = "SERV-" + String(Date.now()).slice(-6);
    const payload = {
      ...newS,
      id,
      isDeleted: false
    };
    const saved = await createService(payload as Service);
    setServices(prev => [saved, ...prev]);
  };

  const handleUpdateService = async (id: string, updated: Partial<Service>) => {
    await updateServiceDetails(id, updated);
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  };

  const handleDeleteService = async (id: string) => {
    await deleteServiceRecord(id, true);
    setServices(prev => prev.map(s => s.id === id ? { ...s, isDeleted: true } : s));
  };

  // 4. Bookings
  const handleAddBooking = async (newB: Omit<Booking, "id" | "createdAt" | "updatedAt"> & { id: string }) => {
    const { id, ...data } = newB;
    const payload = {
      ...data,
      id,
      isDeleted: false
    };
    const saved = await createBooking(payload as Booking);
    setBookings(prev => [saved, ...prev]);
    
    // Automatically update Customer metrics (lifetime spend, booking count, dates)
    const cust = customers.find(c => c.id === newB.customerId);
    if (cust) {
      const updatedBookingsCount = cust.totalBookings + 1;
      const updatedRevenue = cust.lifetimeRevenue + newB.finalAmount;
      const updatedFirstDate = cust.firstBookingDate || newB.appointmentDate;
      const updatedLastDate = newB.appointmentDate;
      
      await updateCustomerDetails(newB.customerId, {
        totalBookings: updatedBookingsCount,
        lifetimeRevenue: updatedRevenue,
        firstBookingDate: updatedFirstDate,
        lastBookingDate: updatedLastDate
      });
      
      setCustomers(prev => prev.map(c => c.id === newB.customerId ? {
        ...c,
        totalBookings: updatedBookingsCount,
        lifetimeRevenue: updatedRevenue,
        firstBookingDate: updatedFirstDate,
        lastBookingDate: updatedLastDate
      } : c));
    }
  };

  const handleUpdateBooking = async (id: string, updated: Partial<Booking>) => {
    await updateBookingDetails(id, updated);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
  };

  const handleDeleteBooking = async (id: string) => {
    await deleteBookingRecord(id, true);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, isDeleted: true } : b));
  };

  // 5. Employees Handlers
  const handleAddEmployee = async (newE: Omit<Employee, "id" | "createdAt" | "updatedAt">) => {
    const id = "EMP-" + String(Date.now()).slice(-6);
    const payload = {
      ...newE,
      id,
      isDeleted: false
    };
    const saved = await createEmployee(payload as Employee);
    setEmployees(prev => [saved, ...prev]);
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
    await updateEmployeeDetails(id, updates);
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleDeleteEmployee = async (id: string) => {
    await deleteEmployeeRecord(id, true);
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, isDeleted: true } : e));
  };

  // 6. Partners Handlers
  const handleAddPartner = async (newP: Omit<Partner, "id" | "createdAt" | "updatedAt">) => {
    const id = "PRT-" + String(Date.now()).slice(-6);
    const payload = {
      ...newP,
      id,
      isDeleted: false
    };
    const saved = await createPartner(payload as Partner);
    setPartners(prev => [saved, ...prev]);
  };

  const handleUpdatePartner = async (id: string, updates: Partial<Partner>) => {
    await updatePartnerDetails(id, updates);
    setPartners(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleDeletePartner = async (id: string) => {
    await deletePartnerRecord(id, true);
    setPartners(prev => prev.map(p => p.id === id ? { ...p, isDeleted: true } : p));
  };

  // Lead Conversion Flow`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', content);
