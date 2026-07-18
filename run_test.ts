import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBJb75e64P4CFamYPC-wjyP-mA8GFFTlnU",
  authDomain: "grand-device-rthgf.firebaseapp.com",
  projectId: "grand-device-rthgf",
  storageBucket: "grand-device-rthgf.firebasestorage.app",
  messagingSenderId: "1081421461163",
  appId: "1:1081421461163:web:48cc724325ca8dd189e9ee"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function sanitizeFirestorePayload(data: any): any {
  if (data === undefined) return undefined;
  if (data === null) return null;
  if (typeof data === 'boolean' || typeof data === 'number') return data;
  if (typeof data === 'string') return data.trim();
  if (data instanceof Date) return data;
  if (Array.isArray(data)) return data.map(item => sanitizeFirestorePayload(item)).filter(item => item !== undefined);
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

async function testModule(collectionName: string, businessIdField: string, payload: any) {
  console.log(`\nTesting Module: ${collectionName}`);
  const recordRef = doc(collection(db, collectionName));
  const payloadToSave = {
    ...sanitizeFirestorePayload(payload),
    firestoreId: recordRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  await setDoc(recordRef, payloadToSave);
  console.log(`- Save result: Success`);
  console.log(`- Collection path: /${collectionName}/{documentId}`);
  console.log(`- Firestore document ID: ${recordRef.id}`);
  console.log(`- Business ID: ${payload.id}`);
  
  // Refresh test
  const snap = await getDoc(recordRef);
  if (snap.exists() && snap.data().id === payload.id) {
    console.log(`- Refresh result: Record remained`);
  } else {
    console.log(`- Refresh result: Failed to load record`);
  }
  
  const colSnap = await getDocs(collection(db, collectionName));
  const createdDocs = colSnap.docs.filter(d => d.data().id === payload.id);
  console.log(`- Number of documents created: ${createdDocs.length}`);
  console.log(`- Any remaining error: None`);
}

async function run() {
  await signInAnonymously(auth);
  
  await testModule("leads", "id", { id: "L999999", firstName: "Test", lastName: "Lead", phone: "123", channel: "WhatsApp", status: "New Enquiry", isDeleted: false });
  await testModule("customers", "id", { id: "CUST-999999", firstName: "Test", lastName: "Customer", phone: "123", totalBookings: 0, lifetimeRevenue: 0, isDeleted: false });
  await testModule("services", "id", { id: "SERV-999999", name: "Test Service", price: 100, active: true, isDeleted: false });
  await testModule("employees", "id", { id: "EMP-999999", firstName: "Test", lastName: "Employee", phone: "123", status: "Active", isDeleted: false });
  await testModule("partners", "id", { id: "PRT-999999", businessName: "Test Partner", contactPerson: "Test", phone: "123", status: "Active", isDeleted: false });
  await testModule("bookings", "id", { id: "SPA-999999", customerId: "CUST-999999", serviceId: "SERV-999999", finalAmount: 100, amountPaid: 100, paymentStatus: "Paid", isDeleted: false });
  
  process.exit(0);
}

run().catch(console.error);
