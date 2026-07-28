export interface ExcelItem {
  stt: string;
  ten_hang: string;
  ma_hang: string;
  dvt: string;
  so_luong: string;
  hd_xlt_so: string;
  hd_xlt_ngay: string;
  hd_pm_ngay: string;
  ngay_ktcl: string;
  // Index of this item in the list
  index: number;
  // Parent reference fields
  so_de_nghi?: string;
  ten_khach_hang?: string;
  nha_cung_cap_cho?: string;
  ten_cong_trinh?: string;
  dia_chi?: string;
  ngay_de_nghi?: string;
  nguoi_de_nghi?: string;
  [key: string]: any;
}

export interface ExcelSection {
  id: string; // Unique section identifier
  companyName: string; // Raw name found in sheet e.g. "CTY TNHH XUÂN LỘC THỌ"
  companyId: string; // Mapped template ID: "xuan-loc-tho" | "phu-minh" | "custom"
  so_de_nghi: string;
  ten_khach_hang: string;
  nha_cung_cap_cho: string;
  ten_cong_trinh: string;
  dia_chi: string;
  ngay_de_nghi: string;
  nguoi_de_nghi: string;
  items: ExcelItem[];
  rowCount: number; // Number of items in this section
  sheetName?: string; // Excel sheet/tab name where this section is located
}

export interface EnterpriseTemplate {
  id: string;
  name: string;
  fileUrl: string;
  mappingSchema: string[]; // Variables expected inside the template loop
}

export type ProcessState = 'IDLE' | 'PARSING' | 'MAPPING' | 'GENERATING' | 'SUCCESS' | 'ERROR';

export interface ProcessLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
