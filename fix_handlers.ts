import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const handlersToAdd = `
  // 5. Employees Handlers
  const handleAddEmployee = async (newE: Omit<Employee, "id" | "createdAt" | "updatedAt">) => {
    const timestamp = new Date().toISOString();
    const id = "EMP-" + String(Date.now()).slice(-6);
    const payload = {
      ...newE,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
      isDeleted: false
    };
    await createEmployee(payload);
    setEmployees(prev => [payload, ...prev]);
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
    await updateEmployeeDetails(id, updates);
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e));
  };

  const handleDeleteEmployee = async (id: string) => {
    await deleteEmployeeRecord(id, true);
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, isDeleted: true } : e));
  };

  // 6. Partners Handlers
  const handleAddPartner = async (newP: Omit<Partner, "id" | "createdAt" | "updatedAt">) => {
    const timestamp = new Date().toISOString();
    const id = "PRT-" + String(Date.now()).slice(-6);
    const payload = {
      ...newP,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
      isDeleted: false
    };
    await createPartner(payload);
    setPartners(prev => [payload, ...prev]);
  };

  const handleUpdatePartner = async (id: string, updates: Partial<Partner>) => {
    await updatePartnerDetails(id, updates);
    setPartners(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
  };

  const handleDeletePartner = async (id: string) => {
    await deletePartnerRecord(id, true);
    setPartners(prev => prev.map(p => p.id === id ? { ...p, isDeleted: true } : p));
  };
`;

content = content.replace(
  '  // Lead Conversion Flow',
  handlersToAdd + '\n\n  // Lead Conversion Flow'
);

fs.writeFileSync('src/App.tsx', content);
