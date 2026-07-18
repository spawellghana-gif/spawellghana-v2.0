import fs from 'fs';

let content = fs.readFileSync('src/components/Customers.tsx', 'utf8');

content = content.replace(
  '    } finally {\n      setSyncingContactId(null);\n    } finally {\n      setIsSaving(false);\n    }',
  '    } finally {\n      setSyncingContactId(null);\n    }'
);

fs.writeFileSync('src/components/Customers.tsx', content);
