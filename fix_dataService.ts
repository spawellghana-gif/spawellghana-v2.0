import fs from 'fs';

let content = fs.readFileSync('src/lib/dataService.ts', 'utf8');

// Replace the sanitizeData function and add new utilities
const newUtilities = `
import { serverTimestamp, Timestamp } from "firebase/firestore";

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

export async function createRecord(collectionName: string, payload: any): Promise<any> {
  if (!auth.currentUser) {
    throw new Error("Your session has expired. Please sign in again.");
  }
  const path = collectionName;
  try {
    const recordRef = doc(collection(db, collectionName));
    const payloadToSave = {
      ...sanitizeFirestorePayload(payload),
      firestoreId: recordRef.id,
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
`;

content = content.replace(/import { SEED_SERVICES } from "\.\.\/data\/seedData";/, 'import { SEED_SERVICES } from "../data/seedData";\nimport { serverTimestamp, Timestamp } from "firebase/firestore";');

content = content.replace(
  /\/\/ Helper to recursively remove undefined properties from objects to prevent Firestore exceptions[\s\S]*?return result;\n\}/,
  newUtilities.replace('import { serverTimestamp, Timestamp } from "firebase/firestore";\n', '')
);

content = content.replace(/sanitizeData/g, 'sanitizeFirestorePayload');

fs.writeFileSync('src/lib/dataService.ts', content);
