const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

try {
  const filePath = path.join(__dirname, 'curl_out_xlt.docx');
  const data = fs.readFileSync(filePath);
  const zip = new PizZip(data);
  console.log('Curl XLT output zip entries:', Object.keys(zip.files));
} catch (err) {
  console.error('Error reading curl XLT output zip:', err.message);
}
