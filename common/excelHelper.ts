import * as XLSX from 'xlsx';
import { ExcelSection, ExcelItem } from './types';

/**
 * Parses an Excel file containing vertically stacked sections representing requests.
 */
export const parseExcelFile = (file: File): Promise<ExcelSection[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Could not read file data');
        }

        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const allSections: ExcelSection[] = [];

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) continue;

          // Parse sheet into 2D array of raw values to scan vertically
          const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { 
            header: 1, 
            raw: false,
            defval: ''
          });

          let r = 0;

          while (r < rows.length) {
            const row = rows[r];
            // Check if row is a section header start
            const rowText = row.map(cell => String(cell).trim()).join(' ');
            
            if (rowText.toUpperCase().includes('GIẤY ĐỀ NGHỊ CẤP PHIẾU KIỂM TRA CHẤT LƯỢNG')) {
              // Found a new Section start!
              let companyName = 'Công ty đối tác';
              if (rowText.toUpperCase().includes('XUÂN LỘC THỌ') || rowText.toUpperCase().includes('XUAN LOC THO')) {
                companyName = 'CTY TNHH XUÂN LỘC THỌ';
              } else if (rowText.toUpperCase().includes('PHÚ MINH') || rowText.toUpperCase().includes('PHU MINH')) {
                companyName = 'CTY TNHH THƯƠNG MẠI ĐIỆN PHÚ MINH';
              }

              let companyId = 'custom';
              if (companyName.includes('XUÂN LỘC THỌ')) companyId = 'xuan-loc-tho';
              else if (companyName.includes('PHÚ MINH')) companyId = 'phu-minh';

              let so_de_nghi = '';
              let ten_khach_hang = '';
              let nha_cung_cap_cho = '';
              let ten_cong_trinh = '';
              let ngay_de_nghi = '';
              let nguoi_de_nghi = '';

              // 1. Scan metadata in the next 12 rows
              const metadataMaxRow = Math.min(r + 12, rows.length);
              let tableHeaderRowIndex = -1;

              for (let scanR = r + 1; scanR < metadataMaxRow; scanR++) {
                const scanRow = rows[scanR] || [];
                const scanRowText = scanRow.map(c => String(c).trim()).join(' ');

                // Check for 'Áp dụng cho hóa đơn của' to extract company name dynamically
                if (scanRowText.toUpperCase().includes('ÁP DỤNG CHO HÓA ĐƠN CỦA') || scanRowText.toUpperCase().includes('AP DUNG CHO HOA DON CUA')) {
                  const match = scanRowText.match(/(?:ÁP DỤNG CHO HÓA ĐƠN CỦA|AP DUNG CHO HOA DON CUA)\s+([^\)]+)/i);
                  if (match && match[1]) {
                    companyName = match[1].replace(/[:]/g, '').trim();
                    companyId = companyName.toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[đĐ]/g, 'd')
                      .replace(/[^a-z0-9]/g, '-')
                      .replace(/-+/g, '-')
                      .replace(/^-|-$/g, '');
                  }
                }

                // Check for 'Số:' or 'So:'
                if (scanRowText.toUpperCase().includes('SỐ:') || scanRowText.toUpperCase().includes('SO:')) {
                  const match = scanRowText.match(/(?:SỐ|SO)\s*:\s*([^\s]+(?:\s+-\s+[^\s]+)?)/i);
                  if (match) so_de_nghi = match[1];
                }

                // Check for 'Tên khách hàng' / 'Ten khach hang'
                if (scanRowText.toUpperCase().includes('TÊN KHÁCH HÀNG') || scanRowText.toUpperCase().includes('TEN KHACH HANG')) {
                  // Find cell containing customer name
                  const cellIndex = scanRow.findIndex(c => String(c).toUpperCase().includes('TÊN KHÁCH HÀNG') || String(c).toUpperCase().includes('TEN KHACH HANG'));
                  if (cellIndex !== -1) {
                    const cellVal = String(scanRow[cellIndex]);
                    const parts = cellVal.split(/[:]/);
                    if (parts.length > 1) {
                      ten_khach_hang = parts[1].replace(/là nhà cung cấp cho:?/i, '').replace(/la nha cung cap cho:?/i, '').trim();
                    }
                  }
                }

                // Check for 'nhà cung cấp cho' or the partner company name which usually sits under Tên khách hàng
                if (scanRowText.toUpperCase().includes('CÔNG TY TNHH') && !scanRowText.toUpperCase().includes('PHÚ MINH') && !scanRowText.toUpperCase().includes('XUÂN LỘC THỌ') && !scanRowText.toUpperCase().includes('TÊN CÔNG TRÌNH') && !scanRowText.toUpperCase().includes('KÍNH GỬI')) {
                  nha_cung_cap_cho = scanRow.map(c => String(c).trim()).filter(c => c !== '').join(' ');
                }

                // Check for 'Tên công trình' / 'Ten cong trinh'
                if (scanRowText.toUpperCase().includes('TÊN CÔNG TRÌNH') || scanRowText.toUpperCase().includes('TEN CONG TRINH')) {
                  const cellIndex = scanRow.findIndex(c => String(c).toUpperCase().includes('TÊN CÔNG TRÌNH') || String(c).toUpperCase().includes('TEN CONG TRINH'));
                  if (cellIndex !== -1) {
                    const parts = String(scanRow[cellIndex]).split(/[:]/);
                    if (parts.length > 1) {
                      ten_cong_trinh = parts[1].trim();
                    }
                  }
                }

                // Check if we hit the table header (contains 'STT' and 'Tên Hàng')
                const isHeader = scanRow.some(c => String(c).trim().toUpperCase() === 'STT') && 
                                 scanRow.some(c => String(c).trim().toUpperCase().includes('TÊN HÀNG') || String(c).trim().toUpperCase().includes('TEN HANG'));
                if (isHeader) {
                  tableHeaderRowIndex = scanR;
                  break;
                }
              }

              // If we didn't find the table header explicitly, look for standard layout indices
              if (tableHeaderRowIndex === -1) {
                tableHeaderRowIndex = r + 8; // fallback estimate
              }

              // 2. Parse table items starting below header (allow 1 line of merged header rows like Row 18)
              let itemScanIndex = tableHeaderRowIndex + 1;
              // Skip the sub-header row (e.g. cell containing 'Số', 'Ngày' under HĐxlt)
              if (rows[itemScanIndex] && rows[itemScanIndex].some(c => String(c).trim() === 'Số' || String(c).trim() === 'Ngày')) {
                itemScanIndex++;
              }

              const items: ExcelItem[] = [];
              let itemIndex = 0;

              while (itemScanIndex < rows.length) {
                const itemRow = rows[itemScanIndex];
                if (!itemRow || itemRow.length === 0) {
                  itemScanIndex++;
                  continue;
                }

                const col0 = String(itemRow[0] || '').trim();
                const col1 = String(itemRow[1] || '').trim();

                // Stop if we hit 'TC :' or 'TC' or 'Tổng cộng'
                if (col0.toUpperCase().startsWith('TC') || col1.toUpperCase().startsWith('TC') || col0.toUpperCase().includes('TỔNG CỘNG') || col1.toUpperCase().includes('TỔNG CỘNG')) {
                  break;
                }

                // We parse if STT is a number, or if there is a product name in column 1
                if (col1 !== '' && col0 !== '' && !isNaN(Number(col0))) {
                  items.push({
                    stt: col0,
                    ten_hang: col1,
                    ma_hang: String(itemRow[2] || '').trim(),
                    dvt: String(itemRow[3] || '').trim(),
                    so_luong: String(itemRow[4] || '').trim(),
                    hd_xlt_so: String(itemRow[5] || '').trim(),
                    hd_xlt_ngay: String(itemRow[6] || '').trim(),
                    hd_pm_ngay: String(itemRow[7] || '').trim(),
                    ngay_ktcl: String(itemRow[8] || '').trim(),
                    index: itemIndex++,
                  });
                }

                itemScanIndex++;
              }

              // 3. Scan signature/date section (next 10 rows after table end)
              const postTableMaxRow = Math.min(itemScanIndex + 10, rows.length);
              for (let scanR = itemScanIndex; scanR < postTableMaxRow; scanR++) {
                const scanRow = rows[scanR] || [];
                const scanRowText = scanRow.map(c => String(c).trim()).join(' ');

                // Check for Date and Location, e.g. "TP. HCM ngày 06 tháng 07 năm 2026"
                if (scanRowText.toUpperCase().includes('NGÀY') && scanRowText.toUpperCase().includes('THÁNG') && scanRowText.toUpperCase().includes('NĂM')) {
                  // Take the cell containing this date pattern
                  const dateCell = scanRow.find(c => String(c).toUpperCase().includes('NGÀY') && String(c).toUpperCase().includes('THÁNG') && String(c).toUpperCase().includes('NĂM'));
                  if (dateCell) {
                    ngay_de_nghi = String(dateCell).trim();
                  }
                }

                // Check for 'Người đề nghị' or 'Nguoi de nghi'
                if (scanRowText.toUpperCase().includes('NGƯỜI ĐỀ NGHỊ') || scanRowText.toUpperCase().includes('NGUOI DE NGHI')) {
                  // The name is typically 3-5 rows below
                  for (let nameR = scanR + 1; nameR < Math.min(scanR + 6, rows.length); nameR++) {
                    const nameRow = rows[nameR] || [];
                    const names = nameRow.map(c => String(c).trim()).filter(c => c !== '');
                    // Take the first non-empty word of length > 2 that isn't a date
                    const possibleName = names.find(n => n.length > 5 && !n.includes('ngày') && !n.includes('tháng') && !n.includes('năm'));
                    if (possibleName) {
                      nguoi_de_nghi = possibleName;
                      break;
                    }
                  }
                }
              }

              // Check if partner company was empty and resolve from adjacent cell
              if (ten_khach_hang && !nha_cung_cap_cho) {
                // Try to fallback to scan lines
                for (let scanR = r + 2; scanR < tableHeaderRowIndex; scanR++) {
                  const scanRow = rows[scanR] || [];
                  const rowCells = scanRow.map(c => String(c).trim()).filter(c => c !== '');
                  if (rowCells.some(c => c.toUpperCase().includes('CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ') || c.toUpperCase().includes('HÙNG THUẬN') || c.toUpperCase().includes('KINDEN'))) {
                    nha_cung_cap_cho = rowCells.join(' ');
                    break;
                  }
                }
              }

              // Create Section ID (ensure uniqueness with sequence index)
              const safeSheetName = sheetName.replace(/[^a-zA-Z0-9]/g, '-');
              const cleanSoDeNghi = so_de_nghi.replace(/[\s\/\\:]/g, '') || 'seq';
              const sectionId = `${safeSheetName}_${companyId}_${cleanSoDeNghi}_idx-${allSections.length}`;

              // Save Section
              allSections.push({
                id: sectionId,
                companyName,
                companyId,
                so_de_nghi,
                ten_khach_hang,
                nha_cung_cap_cho,
                ten_cong_trinh,
                ngay_de_nghi,
                nguoi_de_nghi,
                items,
                rowCount: items.length,
                sheetName,
              });

              // Fast forward r past table end
              r = itemScanIndex;
              continue;
            }

            r++;
          }
        }

        resolve(allSections);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Helper to format file size into human-readable string.
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Helper to format a Date object into DD/MM/YYYY format.
 */
export const formatDate = (date: Date | string | number): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};
