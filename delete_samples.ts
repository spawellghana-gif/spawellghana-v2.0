import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBJb75e64P4CFamYPC-wjyP-mA8GFFTlnU",
  authDomain: "grand-device-rthgf.firebaseapp.com",
  projectId: "grand-device-rthgf",
  storageBucket: "grand-device-rthgf.firebasestorage.app",
  messagingSenderId: "1081421461163",
  appId: "1:1081421461163:web:48cc724325ca8dd189e9ee"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-06da014c-1040-4638-8415-8d37f8fdd5fe");

async function run() {
  const collections = ["customers", "leads", "bookings"];
  for (const name of collections) {
    const colRef = collection(db, name);
    const snap = await getDocs(colRef);
    let deleted = 0;
    for (const d of snap.docs) {
      const data = d.data();
      let isSample = false;
      const id = d.id;
      
      if (name === "leads" && ["ld-1", "ld-2", "ld-3", "ld-4", "ld-5"].includes(id)) isSample = true;
      if (name === "customers" && ["CUST-1001", "CUST-1002", "CUST-1003", "CUST-4ABT", "CUST-CCE8", "CUST-ZCXS", "CUST-ELZK", "CUST-GPYA", "CUST-GU9J", "CUST-ISR3", "CUST-O2QF", "CUST-SJD6"].includes(id)) isSample = true;
      
      const firstName = (data.firstName || data.customerFirstName || "").toUpperCase();
      const lastName = (data.lastName || data.customerLastName || "").toUpperCase();
      
      if (firstName.includes("MODY") || lastName.includes("WILLIAM") || firstName.includes("NUEL") || lastName.includes("WILLIAMS") || firstName.includes("GRACIA") || lastName.includes("GHANA")) {
        isSample = true;
      }
      
      if (name === "bookings" && ["CUST-1001", "CUST-1002", "CUST-1003", "CUST-4ABT", "CUST-CCE8", "CUST-ZCXS"].includes(data.customerId)) {
        isSample = true;
      }

      if (isSample) {
        console.log(`Deleting ${name} ${id} - ${firstName} ${lastName}`);
        await deleteDoc(doc(db, name, id));
        deleted++;
      }
    }
    console.log(`Deleted ${deleted} from ${name}`);
  }
}

run().catch(console.error);
