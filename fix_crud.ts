import fs from 'fs';

let content = fs.readFileSync('src/lib/dataService.ts', 'utf8');

const crudFunctions = `
export async function updateRecord(collectionName: string, id: string, payload: any): Promise<void> {
  if (!auth.currentUser) throw new Error("Your session has expired. Please sign in again.");
  const colRef = collection(db, collectionName);
  const q = query(colRef, where("id", "==", id), where("isDeleted", "==", false));
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error("Record not found.");
  const docRef = snapshot.docs[0].ref;
  await setDoc(docRef, { ...sanitizeFirestorePayload(payload), updatedAt: serverTimestamp() }, { merge: true });
}

export async function deleteRecord(collectionName: string, id: string, soft: boolean = true): Promise<void> {
  if (!auth.currentUser) throw new Error("Your session has expired. Please sign in again.");
  const colRef = collection(db, collectionName);
  const q = query(colRef, where("id", "==", id));
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error("Record not found.");
  const docRef = snapshot.docs[0].ref;
  
  if (soft) {
    await setDoc(docRef, { isDeleted: true, updatedAt: serverTimestamp() }, { merge: true });
  } else {
    await deleteDoc(docRef);
  }
}

// 1. Leads Operations
export async function createLead(lead: Lead): Promise<string> {
  await createRecord("leads", lead);
  return lead.id;
}
export async function updateLeadDetails(id: string, lead: Partial<Lead>): Promise<void> {
  await updateRecord("leads", id, lead);
}
export async function deleteLeadRecord(id: string, soft: boolean = true): Promise<void> {
  await deleteRecord("leads", id, soft);
}

// 2. Customers Operations
export async function createCustomer(customer: Customer): Promise<string> {
  await createRecord("customers", customer);
  return customer.id;
}
export async function updateCustomerDetails(id: string, customer: Partial<Customer>): Promise<void> {
  await updateRecord("customers", id, customer);
}
export async function deleteCustomerRecord(id: string, soft: boolean = true): Promise<void> {
  await deleteRecord("customers", id, soft);
}

// 3. Services Operations
export async function createService(service: Service): Promise<string> {
  const colRef = collection(db, "services");
  const q = query(colRef, where("name", "==", service.name), where("isDeleted", "==", false));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    throw new Error(\`A service named "\${service.name}" already exists in the system.\`);
  }
  await createRecord("services", service);
  return service.id;
}
export async function updateServiceDetails(id: string, service: Partial<Service>): Promise<void> {
  if (service.name) {
    const colRef = collection(db, "services");
    const q = query(colRef, where("name", "==", service.name), where("isDeleted", "==", false));
    const snapshot = await getDocs(q);
    const duplicateDoc = snapshot.docs.find(doc => doc.data().id !== id);
    if (duplicateDoc) {
      throw new Error(\`A service named "\${service.name}" already exists in the system.\`);
    }
  }
  await updateRecord("services", id, service);
}
export async function deleteServiceRecord(id: string, soft: boolean = true): Promise<void> {
  await deleteRecord("services", id, soft);
}

// 4. Bookings Operations
export async function createBooking(booking: Booking): Promise<string> {
  await createRecord("bookings", booking);
  return booking.id;
}
export async function updateBookingDetails(id: string, booking: Partial<Booking>): Promise<void> {
  await updateRecord("bookings", id, booking);
}
export async function deleteBookingRecord(id: string, soft: boolean = true): Promise<void> {
  await deleteRecord("bookings", id, soft);
}

// 5. Employees Operations
export async function createEmployee(employee: Employee): Promise<string> {
  await createRecord("employees", employee);
  return employee.id;
}
export async function updateEmployeeDetails(id: string, employee: Partial<Employee>): Promise<void> {
  await updateRecord("employees", id, employee);
}
export async function deleteEmployeeRecord(id: string, soft: boolean = true): Promise<void> {
  await deleteRecord("employees", id, soft);
}

// 6. Partners Operations
export async function createPartner(partner: Partner): Promise<string> {
  await createRecord("partners", partner);
  return partner.id;
}
export async function updatePartnerDetails(id: string, partner: Partial<Partner>): Promise<void> {
  await updateRecord("partners", id, partner);
}
export async function deletePartnerRecord(id: string, soft: boolean = true): Promise<void> {
  await deleteRecord("partners", id, soft);
}
`;

// Replace everything from // 1. Leads Operations to the end of the file
content = content.replace(/\/\/ 1\. Leads Operations[\s\S]*$/, crudFunctions);

fs.writeFileSync('src/lib/dataService.ts', content);
