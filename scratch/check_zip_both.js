const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

function checkFile(name) {
  const filePath = path.join(__dirname, '..', 'public', 'templates', name);
  console.log('--- Checking:', name);
  try {
    const data = fs.readFileSync(filePath);
    const zip = new PizZip(data);
    console.log('Entries:', Object.keys(zip.files));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkFile('phu-minh.docx');
checkFile('xuan-loc-tho.docx');
