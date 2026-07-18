import fs from 'fs';

const files = ['Leads.tsx', 'Customers.tsx', 'Services.tsx', 'Bookings.tsx'];

for (const file of files) {
  const path = `src/components/${file}`;
  let content = fs.readFileSync(path, 'utf8');

  // Find handleSave or handleSubmit
  content = content.replace(
    /(const (?:handleSave|handleSubmit) = async \(.*?\) => \{\n\s*e\.preventDefault\(\);\n\s*setValidationError\(null\);)/,
    '$1\n    setIsSaving(true);'
  );
  
  if (!content.includes('setIsSaving(true);')) {
    content = content.replace(
      /(const (?:handleSave|handleSubmit) = async \(.*?\) => \{\n\s*e\.preventDefault\(\);)/,
      '$1\n    setValidationError(null);\n    setIsSaving(true);'
    );
  }

  content = content.replace(
    /(\} catch \(err: any\) \{[\s\S]*?\n\s*\})(\n\s*};)/,
    '$1 finally {\n      setIsSaving(false);\n    }$2'
  );

  fs.writeFileSync(path, content);
}
