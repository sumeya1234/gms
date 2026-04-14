const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') && !fullPath.includes('Login.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Regex to remove any tailwind class starting with 'dark:'
      // Includes subsequent modifiers like dark:hover:bg-slate-700
      let newContent = content.replace(/\s*dark:[a-zA-Z0-9\-\/:]+\s*/g, ' ');
      // Fix extra spacing
      newContent = newContent.replace(/ +/g, ' ');

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

// Process components and pages in super admin web
processDir('d:/gms/garage-super-admin-web/src/pages');
processDir('d:/gms/garage-super-admin-web/src/components');

console.log('Color fixes applied successfully.');
