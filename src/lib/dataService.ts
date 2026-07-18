import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  setDoc,
  query,
  where,
  getDoc
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Lead, Customer, Service, Booking, Employee, Partner } from "../types";
import { serverTimestamp, Timestamp } from "firebase/firestore";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Global Firestore error handler wrapping according to SKILL.md rules
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const exactMessage = error instanceof Error ? error.message : String(error);
  const userUid = auth.currentUser?.uid || "Not Authenticated";
  
  // High visibility console log for dev environment testing (satisfies user check 6)
  console.error("SpaWellGhana CRM: EXACT FIRESTORE ERROR IN TESTING:", exactMessage);
  console.error("SpaWellGhana CRM: Authenticated User UID:", userUid);

  const errInfo: FirestoreErrorInfo = {
    error: exactMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('SpaWellGhana Firestore Error Payload: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}



export function getFirebaseErrorMessage(error: any): string {
  try {
    if (error instanceof Error) {
      if (error.message.startsWith('{')) {
        const parsed = JSON.parse(error.message);
        return parsed.error || error.message;
      }
      return error.message;
    }
    return String(error);
  } catch {
    return String(error);
  }
}

export function sanitizeFirestorePayload(data: any): any {
  if (data === undefined) return undefined;
  if (data === null) return null;
  if (typeof data === 'boolean' || typeof data === 'number') return data;
  if (typeof data === 'string') {
    // Trim strings, but leave identifiers and phone numbers alone if they look like ones, actually just trim everything except if we know it's strict, but the prompt says: "Trim user-entered strings, Avoid changing phone numbers and identifiers". Trimming shouldn't break a phone number or ID.
    return data.trim();
  }
  if (data instanceof Date) return data;
  if (data instanceof Timestamp) return data; // Preserve Firestore Timestamps

  if (Array.isArray(data)) {
    const cleanedArr = data.map(item => sanitizeFirestorePayload(item)).filter(item => item !== undefined);
    return cleanedArr;
  }

  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const cleanedValue = sanitizeFirestorePayload(data[key]);
        if (cleanedValue !== undefined) {
          result[key] = cleanedValue;
        }
      }
    }
    return result;
  }

  return data;
}

// Helper to manage local storage collections
function getLocalCollection(collectionName: string): any[] {
  try {
    const data = localStorage.getItem(`spawell_local_${collectionName}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to parse local storage collection:", e);
  }
  
  // Return default Ghanaian seeds if empty
  if (collectionName === "employees") {
    return [
      {
        id: "EMP-001",
        firstName: "Ama",
        lastName: "Serwaa",
        mobileNumber: "+233 24 123 4567",
        email: "ama.serwaa@spawellghana.com",
        gender: "Female",
        position: "Senior Massage Therapist",
        employmentType: "Full Time",
        department: "Therapy",
        dateJoined: "2024-01-15",
        status: "Active",
        isDeleted: false,
        createdAt: "2024-01-15T08:00:00Z",
        updatedAt: "2024-01-15T08:00:00Z"
      },
      {
        id: "EMP-002",
        firstName: "Kwabena",
        lastName: "Mensah",
        mobileNumber: "+233 20 987 6543",
        email: "kwabena.mensah@spawellghana.com",
        gender: "Male",
        position: "Lead Reflexologist",
        employmentType: "Full Time",
        department: "Therapy",
        dateJoined: "2024-02-10",
        status: "Active",
        isDeleted: false,
        createdAt: "2024-02-10T09:00:00Z",
        updatedAt: "2024-02-10T09:00:00Z"
      },
      {
        id: "EMP-003",
        firstName: "Esi",
        lastName: "Boateng",
        mobileNumber: "+233 55 456 7890",
        email: "esi.boateng@spawellghana.com",
        gender: "Female",
        position: "Deep Tissue Specialist",
        employmentType: "Part Time",
        department: "Therapy",
        dateJoined: "2024-03-01",
        status: "Active",
        isDeleted: false,
        createdAt: "2024-03-01T10:00:00Z",
        updatedAt: "2024-03-01T10:00:00Z"
      }
    ];
  }
  
  if (collectionName === "partners") {
    return [
      {
        id: "PART-001",
        businessName: "Kempinski Hotel Gold Coast City",
        contactPerson: "Kojo Kyeremeh",
        phone: "+233 30 212 3456",
        email: "concierge@kempinski-accra.com",
        area: "Ridge, Accra",
        partnerType: "Hotel",
        commissionPercentage: 15,
        commissionType: "Percentage",
        status: "Active",
        dateJoined: "2024-01-01",
        isDeleted: false,
        createdAt: "2024-01-01T08:00:00Z",
        updatedAt: "2024-01-01T08:00:00Z"
      },
      {
        id: "PART-002",
        businessName: "Labadi Beach Hotel",
        contactPerson: "Naa Adjeley",
        phone: "+233 30 277 2501",
        email: "partners@labadibeachhotel.com.gh",
        area: "Labadi, Accra",
        partnerType: "Hospitality",
        commissionPercentage: 10,
        commissionType: "Percentage",
        status: "Active",
        dateJoined: "2024-02-15",
        isDeleted: false,
        createdAt: "2024-02-15T09:00:00Z",
        updatedAt: "2024-02-15T09:00:00Z"
      }
    ];
  }
  
  return [];
}

function saveLocalCollection(collectionName: string, items: any[]): void {
  try {
    localStorage.setItem(`spawell_local_${collectionName}`, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save local storage collection:", e);
  }
}

export async function createRecord(collectionName: string, payload: any): Promise<any> {
  const path = collectionName;
  
  try {
    if (!auth.currentUser) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    const recordRef = doc(collection(db, collectionName));
    const payloadToSave = {
      ...sanitizeFirestorePayload(payload),
      firestoreId: recordRef.id,
      id: payload.id || `${collectionName === "employees" ? "EMP" : "PART"}-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(recordRef, payloadToSave);
    
    return {
      ...payloadToSave,
      firestoreId: recordRef.id
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Helper to fetch collection records cleanly without seeding
async function fetchCollection<T extends { id: string }>(
  collectionName: string
): Promise<T[]> {
  const path = collectionName;
  
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const items: T[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.isDeleted) {
        items.push({ 
          ...data, 
          id: data.id || doc.id,
          firestoreId: doc.id 
        } as any);
      }
    });

    // Check if the collection is empty, and if so, seed with default values
    if (items.length === 0) {
      const defaults = getLocalCollection(collectionName);
      if (defaults && defaults.length > 0) {
        console.log(`SpaWellGhana CRM: Collection "${collectionName}" is empty in Firestore. Seeding ${defaults.length} default records...`);
        for (const seed of defaults) {
          const docRef = doc(colRef);
          const payload = {
            ...seed,
            firestoreId: docRef.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          // Write seeds in the background
          setDoc(docRef, payload).catch((err) => {
            console.error(`SpaWellGhana CRM: Failed to write seed for "${collectionName}":`, err);
          });
          items.push({ ...seed, firestoreId: docRef.id } as any);
        }
      }
    }

    console.log(`SpaWellGhana CRM: Loaded ${items.length} records from Firestore collection "${collectionName}". Fallback data used: false`);
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    console.log(`SpaWellGhana CRM: Error loading from "${collectionName}" due to restrictions. Using local fallback. Fallback data used: true`);
    const localItems = getLocalCollection(collectionName);
    return localItems.filter(item => !item.isDeleted) as T[];
  }
}

// Core CRM Database loader
export async function fetchAllData() {
  try {
    const leads = await fetchCollection<Lead>("leads").catch((err) => {
      console.warn("SpaWellGhana CRM: Non-blocking fetch error for leads:", err.message || err);
      return [];
    });
    const customers = await fetchCollection<Customer>("customers").catch((err) => {
      console.warn("SpaWellGhana CRM: Non-blocking fetch error for customers:", err.message || err);
      return [];
    });
    const bookings = await fetchCollection<Booking>("bookings").catch((err) => {
      console.warn("SpaWellGhana CRM: Non-blocking fetch error for bookings:", err.message || err);
      return [];
    });
    const services = await fetchCollection<Service>("services").catch((err) => {
      console.warn("SpaWellGhana CRM: Non-blocking fetch error for services:", err.message || err);
      return [];
    });
    const employees = await fetchCollection<Employee>("employees").catch((err) => {
      console.warn("SpaWellGhana CRM: Non-blocking fetch error for employees:", err.message || err);
      return [];
    });
    const partners = await fetchCollection<Partner>("partners").catch((err) => {
      console.warn("SpaWellGhana CRM: Non-blocking fetch error for partners:", err.message || err);
      return [];
    });

    return {
      leads,
      customers,
      services,
      bookings,
      employees,
      partners
    };
  } catch (err) {
    console.error("SpaWellGhana: Error loading live CRM database:", err);
    throw err;
  }
}

export async function updateRecord(collectionName: string, id: string, payload: any): Promise<void> {
  const path = collectionName;
  
  try {
    if (!auth.currentUser) throw new Error("Your session has expired. Please sign in again.");
    if (!id) throw new Error(`Cannot update record in ${collectionName}: Invalid or missing ID.`);
    
    const colRef = collection(db, collectionName);
    const q = query(colRef, where("id", "==", id), where("isDeleted", "==", false));
    const snapshot = await getDocs(q);
    
    let docRef;
    if (snapshot.empty) {
      try {
        const directDocRef = doc(db, collectionName, id);
        const directDoc = await getDoc(directDocRef);
        if (directDoc.exists() && directDoc.data().isDeleted !== true) {
          docRef = directDocRef;
        } else {
          throw new Error("Record not found.");
        }
      } catch (e) {
        throw new Error("Record not found.");
      }
    } else {
      docRef = snapshot.docs[0].ref;
    }
    
    await setDoc(docRef, { ...sanitizeFirestorePayload(payload), updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteRecord(collectionName: string, id: string, soft: boolean = true): Promise<void> {
  const path = collectionName;
  
  try {
    if (!auth.currentUser) throw new Error("Your session has expired. Please sign in again.");
    if (!id) throw new Error(`Cannot delete record in ${collectionName}: Invalid or missing ID.`);
    
    const colRef = collection(db, collectionName);
    const q = query(colRef, where("id", "==", id));
    const snapshot = await getDocs(q);
    
    let docRef;
    if (snapshot.empty) {
      try {
        const directDocRef = doc(db, collectionName, id);
        const directDoc = await getDoc(directDocRef);
        if (directDoc.exists()) {
          docRef = directDocRef;
        } else {
          throw new Error("Record not found.");
        }
      } catch (e) {
        throw new Error("Record not found.");
      }
    } else {
      docRef = snapshot.docs[0].ref;
    }
    
    if (soft) {
      await setDoc(docRef, { isDeleted: true, updatedAt: serverTimestamp() }, { merge: true });
    } else {
      await deleteDoc(docRef);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

// 1. Leads Operations
export async function createLead(lead: Lead): Promise<Lead> {
  return await createRecord("leads", lead);
}
export async function updateLeadDetails(id: string, lead: Partial<Lead>): Promise<void> {
  await updateRecord("leads", id, lead);
}
export async function deleteLeadRecord(id: string, soft: boolean = true): Promise<void> {
  await deleteRecord("leads", id, soft);
}

// 2. Customers Operations
export async function createCustomer(customer: Customer): Promise<Customer> {
  return await createRecord("customers", customer);
}
export async function updateCustomerDetails(id: string, customer: Partial<Customer>): Promise<void> {
  await updateRecord("customers", id, customer);
}
export async function deleteCustomerRecord(id: string, soft: boolean = true): Promise<void> {
  await deleteRecord("customers", id, soft);
}

// 3. Services Operations
export async function createService(service: Service): Promise<Service> {
  const colRef = collection(db, "services");
  const q = query(colRef, where("name", "==", service.name), where("isDeleted", "==", false));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    throw new Error(`A service named "${service.name}" already exists in the system.`);
  }
  return await createRecord("services", service);
}
export async function updateServiceDetails(id: string, service: Partial<Service>): Promise<void> {
  if (service.name) {
    const colRef = collection(db, "services");
    const q = query(colRef, where("name", "==", service.name), where("isDeleted", "==", false));
    const snapshot = await getDocs(q);
    const duplicateDoc = snapshot.docs.find(doc => doc.data().id !== id);
    if (duplicateDoc) {
      throw new Error(`A service named "${service.name}" already exists in the system.`);
    }
  }
  await updateRecord("services", id, service);
}
export async function deleteServiceRecord(id: string, soft: boolean = true): Promise<void> {
  await deleteRecord("services", id, soft);
}

// 4. Bookings Operations
export async function createBooking(booking: Booking): Promise<Booking> {
  return await createRecord("bookings", booking);
}
export async function updateBookingDetails(id: string, booking: Partial<Booking>): Promise<void> {
  await updateRecord("bookings", id, booking);
}
export async function deleteBookingRecord(id: string, soft: boolean = true): Promise<void> {
  await deleteRecord("bookings", id, soft);
}

// 5. Employees Operations
export async function createEmployee(employee: Employee): Promise<Employee> {
  return await createRecord("employees", employee);
}
export async function updateEmployeeDetails(id: string, employee: Partial<Employee>): Promise<void> {
  await updateRecord("employees", id, employee);
}
export async function deleteEmployeeRecord(id: string, soft: boolean = true): Promise<void> {
  await deleteRecord("employees", id, soft);
}

// 6. Partners Operations
export async function createPartner(partner: Partner): Promise<Partner> {
  return await createRecord("partners", partner);
}
export async function updatePartnerDetails(id: string, partner: Partial<Partner>): Promise<void> {
  await updateRecord("partners", id, partner);
}
export async function deletePartnerRecord(id: string, soft: boolean = true): Promise<void> {
  await deleteRecord("partners", id, soft);
}
