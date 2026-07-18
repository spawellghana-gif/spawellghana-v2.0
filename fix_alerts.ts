import fs from 'fs';

const files = ['Leads.tsx', 'Customers.tsx', 'Services.tsx', 'Bookings.tsx'];

for (const file of files) {
  const path = `src/components/${file}`;
  let content = fs.readFileSync(path, 'utf8');

  // Add getFirebaseErrorMessage import
  if (!content.includes('getFirebaseErrorMessage')) {
    content = content.replace(
      'import {', 
      'import { getFirebaseErrorMessage } from "../lib/dataService";\nimport {'
    );
  }

  // Add validationError and isSaving states if not present
  if (!content.includes('const [validationError')) {
    content = content.replace(
      'const [isModalOpen, setIsModalOpen] = useState(false);',
      'const [isModalOpen, setIsModalOpen] = useState(false);\n  const [validationError, setValidationError] = useState<string | null>(null);\n  const [isSaving, setIsSaving] = useState(false);\n  const [successMsg, setSuccessMsg] = useState<string | null>(null);'
    );
  }

  // Replace alert in handleSave/handleSubmit
  content = content.replace(
    /alert\("Error saving .*?: " \+ (.*?)\);/g,
    'setValidationError(getFirebaseErrorMessage($1));'
  );
  content = content.replace(
    /alert\((.*?)\);/g,
    'setValidationError(getFirebaseErrorMessage($1));'
  );

  // Add validationError render inside form
  if (!content.includes('{validationError && (')) {
    content = content.replace(
      /<form onSubmit=\{.*?\} className=".*?">/,
      '$&\n              {validationError && (\n                <div className="p-3 mb-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold">\n                  {validationError}\n                </div>\n              )}'
    );
  }
  
  // Show success message container outside modal
  if (!content.includes('successMsg &&')) {
    content = content.replace(
      /<div className="space-y-6">/,
      '<div className="space-y-6">\n      {successMsg && (\n        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold animate-pulse">\n          {successMsg}\n        </div>\n      )}'
    );
    content = content.replace(
      /<div id=".*?-tab-container" className="space-y-6">/,
      '$&\n      {successMsg && (\n        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold animate-pulse">\n          {successMsg}\n        </div>\n      )}'
    );
  }

  // Update handleAdd / handleSave to clear errors and set success
  // We need to find the save function, it's either handleSave or handleSubmit
  content = content.replace(
    /setIsModalOpen\(false\);(\s*)\} catch/g,
    'setIsModalOpen(false);\n      setSuccessMsg("Record saved successfully!");\n      setTimeout(() => setSuccessMsg(null), 3000);$1} catch'
  );

  // Remove window.confirm
  content = content.replace(
    /const isConfirmed = window\.confirm\(.*?\);/g,
    'const isConfirmed = true; // Confirmation removed per requirements'
  );

  // Disable submit button while saving
  content = content.replace(
    /type="submit"\s*className="/,
    'type="submit"\n                    disabled={isSaving}\n                    className="'
  );

  fs.writeFileSync(path, content);
}

// Fix Partners and Employees too
const newFiles = ['Partners.tsx', 'Employees.tsx'];
for (const file of newFiles) {
  const path = `src/components/${file}`;
  let content = fs.readFileSync(path, 'utf8');
  if (!content.includes('getFirebaseErrorMessage')) {
    content = content.replace(
      'import {', 
      'import { getFirebaseErrorMessage } from "../lib/dataService";\nimport {'
    );
  }
  if (!content.includes('successMsg')) {
    content = content.replace(
      'const [validationError, setValidationError] = useState<string | null>(null);',
      'const [validationError, setValidationError] = useState<string | null>(null);\n  const [successMsg, setSuccessMsg] = useState<string | null>(null);'
    );
    content = content.replace(
      /<div id=".*?-tab-container" className="space-y-6">/,
      '$&\n      {successMsg && (\n        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold animate-pulse">\n          {successMsg}\n        </div>\n      )}'
    );
    content = content.replace(
      /setIsModalOpen\(false\);(\s*)\} catch/g,
      'setIsModalOpen(false);\n      setSuccessMsg("Record saved successfully!");\n      setTimeout(() => setSuccessMsg(null), 3000);$1} catch'
    );
  }
  content = content.replace(
    /setValidationError\(err\.message \|\| ".*?"\);/g,
    'setValidationError(getFirebaseErrorMessage(err));'
  );
  content = content.replace(
    /const isConfirmed = window\.confirm\(.*?\);/g,
    'const isConfirmed = true;'
  );
  fs.writeFileSync(path, content);
}
