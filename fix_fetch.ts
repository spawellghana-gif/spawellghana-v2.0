import fs from 'fs';
let content = fs.readFileSync('src/lib/dataService.ts', 'utf8');

content = content.replace(
  'items.push({ id: doc.id, ...data } as any);',
  'items.push({ ...data, firestoreId: doc.id } as any);'
);

content = content.replace(
  'const { id, ...dataWithoutId } = item;',
  'const { ...dataWithoutId } = item;'
);

content = content.replace(
  'await setDoc(doc(db, collectionName, id), sanitizeFirestorePayload(dataWithoutId));',
  'const newRef = doc(collection(db, collectionName));\n        await setDoc(newRef, { ...sanitizeFirestorePayload(dataWithoutId), firestoreId: newRef.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });'
);

fs.writeFileSync('src/lib/dataService.ts', content);
