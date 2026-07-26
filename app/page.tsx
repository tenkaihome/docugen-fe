'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useExcelParser } from '@/hooks/useExcelParser';
import { useDocxGenerator } from '@/hooks/useDocxGenerator';
import { FileUploader } from '@/components/features/FileUploader';
import { SectionSelector } from '@/components/features/SectionSelector';
import { TemplateSelector } from '@/components/features/TemplateSelector';
import { ProcessConsole } from '@/components/features/ProcessConsole';
import { PreviewSection } from '@/components/features/PreviewSection';
import { VisualPreviewModal } from '@/components/features/VisualPreviewModal';
import { FileDown, Sparkles, Heart, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export default function Home() {
  const {
    file: excelFile,
    sections,
    selectedSections,
    isParsing,
    error: parseError,
    handleFileUpload,
    toggleSection,
    selectAllSections,
    deselectAllSections,
    clearParser,
  } = useExcelParser();

  const {
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    processState,
    isProcessing,
    generateSingleRow,
    generateSectionDocument,
    generateAllDocuments,
    getTemplateForSection,
    uploadCustomTemplate,
    removeCustomTemplate,
    productNameMappings,
    setProductNameMappings,
  } = useDocxGenerator(sections, selectedSections);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Theme state: defaults to 'light'
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme effect (force light by default)
  React.useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    }
  };

  // Dynamically generate and download a sample vertically stacked multi-section excel data source
  const downloadSampleExcel = () => {
    const wb = XLSX.utils.book_new();

    // Create a raw 2D array representation of the spreadsheet matching Image 3 structure
    const rawRows = [
      // SECTION 1: Xuan Loc Tho
      ['GIẤY ĐỀ NGHỊ CẤP PHIẾU KIỂM TRA CHẤT LƯỢNG'],
      ['(Áp dụng cho hóa đơn của CTY TNHH XUÂN LỘC THỌ)'],
      ['Số:9107 - 2026'],
      ['Kính gửi : GIÁM ĐỐC CÔNG TY'],
      ['Đề nghị Giám Đốc cấp " Phiếu kiểm tra chất lượng " cho khách hàng sau:'],
      ['Tên khách hàng : CTY TNHH THƯƠNG MẠI ĐIỆN PHÚ MINH là nhà cung cấp cho:'],
      ['CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ ĐIỆN HÙNG THUẬN'],
      ['Tên công trình: CÔNG TY CỔ PHẦN PHÁT TRIỂN CƠ ĐIỆN AN PHONG'],
      [],
      ['STT', 'Tên Hàng', 'Mã Hàng', 'ĐVT', 'Số Lượng', 'HĐxlt', '', 'HĐPM', 'Ngày ghi trên'],
      ['', '', '', '', '', 'Số', 'Ngày', 'Ngày', 'phiếu KTCL'],
      ['1', 'Đầu + khớp nối ren 32', 'E258+281/32', 'Cái', '20', '1516', '24.03.26', '19.05.26', '21.03.26'],
      ['2', 'Khớp nối trơn 32', 'E242/32', 'Cái', '30', '25178', '29.05.26', '03.06.26', '26.05.26'],
      ['3', 'Kẹp đỡ ống 32', 'E280/32', 'Cái', '50', '25178', '29.05.26', '03.06.26', '26.05.26'],
      ['4', 'Đầu + khớp nối ren 32', 'E258+281/32', 'Cái', '20', '23087', '19.05.26', '23.05.26', '16.05.26'],
      ['5', 'Chia 3 ngả Đ32', 'V240/32/3', 'Cái', '40', '25178', '29.05.26', '24.06.26', '26.05.26'],
      ['6', 'Chia 4 ngả Đ32', 'V240/32/4', 'Cái', '10', '6341', '01.10.25', '24.06.26', '30.09.25'],
      ['TC : 06 khoản'],
      [],
      ['Số lượng yêu cầu : 02 bản'],
      ['Ngày cần : 07.26'],
      ['', '', '', '', 'TP. HCM ngày 06 tháng 07 năm 2026'],
      ['', '', '', '', 'Người đề nghị'],
      [],
      [],
      ['', '', '', '', 'THẠCH KHÁNH TÂN'],
      [],
      [], // blank rows separating sections

      // SECTION 2: Phu Minh
      ['GIẤY ĐỀ NGHỊ CẤP PHIẾU KIỂM TRA CHẤT LƯỢNG'],
      ['(Áp dụng cho hóa đơn của CTY TNHH THƯƠNG MẠI ĐIỆN PHÚ MINH)'],
      ['Số:9207 - 2026'],
      ['Kính gửi : GIÁM ĐỐC CÔNG TY'],
      ['Đề nghị Giám Đốc cấp " Phiếu kiểm tra chất lượng " cho khách hàng sau:'],
      ['Tên khách hàng : CTY TNHH THƯƠNG MẠI ĐIỆN PHÚ MINH là nhà cung cấp cho:'],
      ['CÔNG TY PROJECT - PHASE 1 - CÔNG TY TNHH KINDEN VIỆT NAM'],
      ['Tên công trình: DỰ ÁN NHÀ MÁY TOYOTA BÌNH DƯƠNG'],
      [],
      ['STT', 'Tên Hàng', 'Mã Hàng', 'ĐVT', 'Số Lượng', 'HĐxlt', '', 'HĐPM', 'Ngày ghi trên'],
      ['', '', '', '', '', 'Số', 'Ngày', 'Ngày', 'phiếu KTCL'],
      ['1', 'Hộp nối 1 ngả Đ25', 'M163/25', 'Cái', '100', '23087', '19.05.26', '01.06.26', '16.05.26'],
      ['2', 'Ống luồn dây điện PVC Đ25', 'E215/25', 'Mét', '700', '23087', '19.05.26', '03.06.26', '26.05.26'],
      ['3', 'Khớp nối trơn 25', 'E242/25', 'Cái', '150', '25178', '29.05.26', '03.06.26', '26.05.26'],
      ['TC : 03 khoản'],
      [],
      ['Số lượng yêu cầu : 01 bản'],
      ['Ngày cần : 12.26'],
      ['', '', '', '', 'TP. HCM ngày 15 tháng 07 năm 2026'],
      ['', '', '', '', 'Người đề nghị'],
      [],
      [],
      ['', '', '', '', 'PHẠM VĂN NAM'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rawRows);
    XLSX.utils.book_append_sheet(wb, ws, 'DeNghiCapKTCL');
    XLSX.writeFile(wb, 'DocuGen_MultiSection_Sample.xlsx');
  };

  const hasSelectedSections = selectedSections.length > 0;
  const hasExcelData = sections.some((s) => selectedSections.includes(s.id) && s.rowCount > 0);

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-900/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                DocuGen Studio
              </h1>
              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                Tự động tách & điền mẫu Phiếu KTCL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="p-2 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border border-zinc-200/80 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              title={theme === 'light' ? 'Chuyển sang Chế độ Tối' : 'Chuyển sang Chế độ Sáng'}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSampleExcel}
              className="text-xs font-semibold rounded-xl"
            >
              <FileDown className="h-4 w-4 mr-1.5 text-violet-500" />
              Tải Excel Mẫu Nhiều Section
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Intro Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl text-white shadow-xl shadow-violet-500/10 gap-6">
          <div className="max-w-xl">
            <h2 className="text-xl font-bold mb-1.5 flex items-center gap-2">
              Xử Lý Hóa Đơn Đa Section <Sparkles className="h-5 w-5" />
            </h2>
            <p className="text-xs text-violet-100/90 leading-relaxed font-medium">
              Hệ thống tự động phát hiện nhiều Hóa đơn / Section xếp chồng liên tục trong file Excel. Tự động nhận diện công ty và trích xuất từng mặt hàng thành 1 trang chất lượng riêng, gộp chung vào duy nhất 1 file Word (.docx) gọn gàng.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shrink-0">
            <span className="text-[10px] font-semibold tracking-wider text-violet-200 uppercase">
              TỰ ĐỘNG KHỚP MẪU
            </span>
            <span className="text-xl font-bold tracking-tight text-white mt-1">
              Đa Biểu Mẫu
            </span>
          </div>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-6 w-full">
            {/* Step 1: Upload Excel File */}
            <FileUploader
              onFileSelect={handleFileUpload}
              selectedFile={excelFile}
              isParsing={isParsing}
              error={parseError}
              onClear={clearParser}
            />

            {/* Step 2: Choose Active Sections */}
            {excelFile && (
              <SectionSelector
                sections={sections}
                selectedSections={selectedSections}
                onToggleSection={toggleSection}
                onSelectAll={selectAllSections}
                onDeselectAll={deselectAllSections}
              />
            )}

          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 w-full sticky top-24 flex flex-col gap-6">
            {/* Step 3: Choose Word Template for fallbacks */}
            <TemplateSelector
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              onTemplateChange={setSelectedTemplateId}
              onUploadFile={uploadCustomTemplate}
              onRemoveTemplate={removeCustomTemplate}
              isProcessing={isProcessing}
            />

            {/* Nút Tiến hành tạo văn bản */}
            {hasExcelData && (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setIsPreviewOpen(true)}
                  disabled={selectedTemplateId === 'custom' && templates.length === 0}
                  className="w-full h-13 text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-violet-500/10 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Sparkles className="h-4.5 w-4.5" />
                  Tiến Hành Tạo Văn Bản (.docx)
                </Button>
                {selectedTemplateId === 'custom' && templates.length === 0 && (
                  <p className="text-[10px] text-center font-semibold text-rose-550 dark:text-rose-400 animate-pulse">
                    * Vui lòng tải lên ít nhất 1 file mẫu Word (.docx) để bắt đầu
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Visual Preview & Download packaging Modal */}
        <VisualPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          sections={sections}
          selectedSections={selectedSections}
          onToggleSection={toggleSection}
          onDownloadSample={(items, sec) => generateSectionDocument(sec, items)}
          onDownloadAllZip={async (itemKeys) => {
            await generateAllDocuments(itemKeys);
            setIsPreviewOpen(false);
          }}
          isProcessing={isProcessing}
          getTemplateForSection={getTemplateForSection}
          productNameMappings={productNameMappings}
          setProductNameMappings={setProductNameMappings}
        />
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-center text-xs text-zinc-500 font-medium">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <span>DocuGen Studio FE</span>
          <span className="text-zinc-300 dark:text-zinc-800">|</span>
          <span className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> by Antigravity
          </span>
        </div>
        <p className="text-[10px] text-zinc-400">
          © {new Date().getFullYear()} DocuGen System. Bảo lưu mọi quyền.
        </p>
      </footer>
    </div>
  );
}
