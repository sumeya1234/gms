const fs = require('fs');

console.log("Reading gms_backup.sql...");
let content = fs.readFileSync('d:\\gms\\gms_backup.sql', 'utf8');

console.log("Removing definers that block cloud imports...");
// Strip definers
content = content.replace(/DEFINER=`[^`]+`@`[^`]+`/g, '');
content = content.replace(/DEFINER='[^']+'@'[^']+'/g, '');

// Strip sys variables that block cloud imports
content = content.replace(/SET @@SESSION\.SQL_LOG_BIN= 0;/g, '');
content = content.replace(/SET @@GLOBAL\.GTID_PURGED=[^;]+;/g, '');

fs.writeFileSync('d:\\gms\\gms_clean_backup.sql', content);
console.log("Success! Cleaned up the file and saved it as: gms_clean_backup.sql");
