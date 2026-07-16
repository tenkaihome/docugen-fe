const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

try {
  const filePath = path.join(__dirname, '..', 'public', 'templates', 'phu-minh.docx');
  console.log('Checking file:', filePath);
  const data = fs.readFileSync(filePath);
  const zip = new PizZip(data);
  console.log('Zip file entries:', Object.keys(zip.files));
} catch (err) {
  console.error('Error reading zip:', err);
}
