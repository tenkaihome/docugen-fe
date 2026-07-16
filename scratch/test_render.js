const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

try {
  const filePath = path.join(__dirname, '..', 'public', 'templates', 'phu-minh.docx');
  const data = fs.readFileSync(filePath);
  const zip = new PizZip(data);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  const items = [
    {
      stt: '1',
      ten_hang: 'Ổ cắm điện Lioa 3D',
      ma_hang: 'LIOA-3D',
      dvt: 'Cái',
      so_luong: '10',
      hd_xlt_so: '999',
      hd_xlt_ngay: '12.03.26',
      hd_pm_ngay: '15.03.26',
      ngay_ktcl: '18.03.26',
      TEN_KHACH_HANG: 'CONG TY PHU MINH',
      NHA_CUNG_CAP_CHO: 'KHACH HANG A',
      TEN_CONG_TRINH: 'CONG TRINH B',
      page_break_xml: ''
    }
  ];

  doc.render({
    items,
    so_de_nghi: '9107',
    TEN_KHACH_HANG: 'CONG TY PHU MINH',
    NHA_CUNG_CAP_CHO: 'KHACH HANG A',
    TEN_CONG_TRINH: 'CONG TRINH B',
  });

  const text = doc.getZip().file('word/document.xml').asText();
  console.log('Rendered document.xml content snippet:');
  console.log(text.slice(0, 1000));
} catch (err) {
  console.error('Error rendering:', err);
}
