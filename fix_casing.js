const fs = require('fs');
const path = require('path');

const tables = [
    'Users', 'Garages', 'Customers', 'SuperAdmins', 'GarageManagers', 'GarageOwners',
    'Mechanics', 'Accountants', 'Vehicles', 'ServiceRequests', 'Inventory',
    'ServiceItems', 'MechanicAssignments', 'GarageServices', 'InventoryRequests',
    'Payments', 'Reviews', 'Complaints', 'ComplaintMessages', 'Notifications',
    'PushTokens', 'PasswordResets', 'SystemConfigs'
];

function getAllFiles(dirPath, arrayOfFiles) {
    let files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
            }
        } else {
            if (file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.sql')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });
    return arrayOfFiles;
}

const files = getAllFiles('d:\\gms\\garage-backend');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    tables.forEach(table => {
        // Replace as whole word, but also handle backticks (MySQL) and quotes
        // Matches word boundaries or backticks
        const regex = new RegExp(`\\b${table}\\b`, 'g');
        content = content.replace(regex, table.toLowerCase());
    });

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
