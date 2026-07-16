const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

// Create public/templates directory
const templatesDir = path.join(__dirname, 'public', 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

function createLoopBasedDocx(title) {
  const zip = new PizZip();
  
  // 1. [Content_Types].xml
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  // 2. _rels/.rels
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  // 3. word/document.xml with Loop items and raw XML page break
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>{#items}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:r><w:t>==================================================</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>     PHIẾU KIỂM TRA CHẤT LƯỢNG / TEST REPORT      </w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>     ĐƠN VỊ PHÁT HÀNH: ${title}                   </w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>==================================================</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:r><w:t>Số Phiếu Đề Nghị: {so_de_nghi}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Khách Hàng / Customer: {TEN_KHACH_HANG}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Là Nhà Cung Cấp Cho: {NHA_CUNG_CAP_CHO}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Tên Công Trình: {TEN_CONG_TRINH}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>--------------------------------------------------</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:r><w:t>CHI TIẾT VẬT TƯ:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Thứ tự (STT): {stt}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Tên Hàng Hóa / Product Name: {ten_hang}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Mã Hàng / Product Code: {ma_hang}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Đơn Vị Tính / Unit: {dvt}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Số Lượng / Quantity: {so_luong}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>HĐxlt Số: {hd_xlt_so} (Ngày: {hd_xlt_ngay})</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>HĐPM Ngày: {hd_pm_ngay}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Ngày ghi trên phiếu KTCL: {ngay_ktcl}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Kết quả kiểm tra: ĐẠT TIÊU CHUẨN NHẬP KHO</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>--------------------------------------------------</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:r><w:t>Ngày Đề Nghị: {ngay_de_nghi}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Người Đề Nghị: {nguoi_de_nghi}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Chữ ký người đề nghị: [ Đã xác nhận ]</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:r><w:t>{@page_break_xml}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:r><w:t>{/items}</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', docXml);
  return zip.generate({ type: 'nodebuffer' });
}

// Generate Phu Minh Template
const phuMinhBuffer = createLoopBasedDocx('CTY TNHH THUONG MAI DIEN PHU MINH');
fs.writeFileSync(path.join(templatesDir, 'phu-minh.docx'), phuMinhBuffer);
console.log('Created loop-based phu-minh.docx successfully.');

// Generate Xuan Loc Tho Template
const xuanLocThoBuffer = createLoopBasedDocx('CTY TNHH XUAN LOC THO');
fs.writeFileSync(path.join(templatesDir, 'xuan-loc-tho.docx'), xuanLocThoBuffer);
console.log('Created loop-based xuan-loc-tho.docx successfully.');
