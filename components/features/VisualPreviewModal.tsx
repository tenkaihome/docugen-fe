import React, { useState, useEffect } from 'react';
import { Eye, FileDown, FolderArchive, HelpCircle, Check, Building2, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ExcelSection, ExcelItem } from '@/common/types';

const formatSoDocx = (soDeNghi: string, hdXltSo: string): string => {
  const cleanSo = String(soDeNghi || '').trim();
  const parts = cleanSo.split('-');
  const firstPart = parts[0] ? parts[0].trim() : '';
  const cleanHdXltSo = String(hdXltSo || '').trim();
  if (firstPart && cleanHdXltSo) {
    return `${firstPart}/${cleanHdXltSo}`;
  }
  return cleanHdXltSo || firstPart || '---';
};

const calculateNgayXuatXuong = (hdXltNgay: string, section: ExcelSection): string => {
  const companyName = section.ten_khach_hang || section.companyName || '';
  const companyId = section.companyId || '';
  const isNamHaThanh = 
    companyName.toUpperCase().includes('NAM HÀ THÀNH') || 
    companyName.toUpperCase().includes('NAM HA THANH') || 
    companyId.includes('nam-ha-thanh');

  const parseVietnameseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const clean = dateStr.trim();
    if (!clean) return null;

    if (clean.includes('.')) {
      const parts = clean.split('.');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return new Date(year, month - 1, day);
        }
      }
    }

    const parsed = Date.parse(clean);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }

    if (clean.includes('/')) {
      const parts = clean.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return new Date(year, month - 1, day);
        }
      }
    }
    return null;
  };

  const parsedDate = parseVietnameseDate(hdXltNgay);
  if (!parsedDate) {
    return section.ngay_de_nghi || '---';
  }

  if (!isNamHaThanh) {
    parsedDate.setDate(parsedDate.getDate() - 3);
  }

  const day = String(parsedDate.getDate()).padStart(2, '0');
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const year = String(parsedDate.getFullYear());
  return `${day}/${month}/${year}`;
};

interface VisualPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: ExcelSection[];
  selectedSections: string[];
  onToggleSection: (sectionId: string) => void;
  onDownloadSample: (items: ExcelItem[], section: ExcelSection) => void;
  onDownloadAllZip: (selectedItemKeys?: string[]) => void;
  isProcessing: boolean;
  getTemplateForSection: (section: ExcelSection) => any;
  productNameMappings: { [prefix: string]: string };
  setProductNameMappings: React.Dispatch<React.SetStateAction<{ [prefix: string]: string }>>;
}

export const VisualPreviewModal: React.FC<VisualPreviewModalProps> = ({
  isOpen,
  onClose,
  sections,
  selectedSections,
  onToggleSection,
  onDownloadSample,
  onDownloadAllZip,
  isProcessing,
  getTemplateForSection,
  productNameMappings,
  setProductNameMappings,
}) => {
  // Get all companies with items (only those that have selected sections)
  const activeSections = sections.filter((s) => selectedSections.includes(s.id) && s.rowCount > 0);

  const allCompanies = Array.from(
    new Set(activeSections.map((s) => s.companyId))
  ).map((cId) => {
    const allCompanySecs = sections.filter((s) => s.companyId === cId);
    const companySecs = allCompanySecs.filter((s) => selectedSections.includes(s.id));
    const companyName = allCompanySecs[0]?.companyName || 'Công ty';
    const totalItems = companySecs.reduce((sum, s) => sum + s.rowCount, 0);
    return {
      companyId: cId,
      companyName,
      sections: companySecs,
      allSections: allCompanySecs,
      totalItems,
    };
  });

  const [activeCompanyId, setActiveCompanyId] = useState<string>(allCompanies[0]?.companyId || '');
  const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]);

  // Initialize selectedItemKeys when modal opens or sections change
  useEffect(() => {
    if (isOpen) {
      const keys = sections
        .filter((s) => selectedSections.includes(s.id))
        .flatMap((s) => s.items.map((item) => `${s.id}-stt-${item.stt}-idx-${item.index}`));
      setSelectedItemKeys(keys);
    }
  }, [isOpen, sections, selectedSections]);

  // Sync active company if list changes
  useEffect(() => {
    if (allCompanies.length > 0 && !allCompanies.some((c) => c.companyId === activeCompanyId)) {
      setActiveCompanyId(allCompanies[0].companyId);
    }
  }, [sections, activeCompanyId, allCompanies]);

  const currentCompany = allCompanies.find((c) => c.companyId === activeCompanyId) || allCompanies[0];
  const companySecs = currentCompany?.sections || [];
  const isCompanySelected = companySecs.length > 0;

  // Toggle export for all sections of a company
  const handleToggleCompany = (cId: string, checked: boolean) => {
    const company = allCompanies.find((c) => c.companyId === cId);
    if (!company) return;
    const targetSecs = company.allSections;
    for (const sec of targetSecs) {
      const isCurrentlySelected = selectedSections.includes(sec.id);
      if (checked && !isCurrentlySelected) {
        onToggleSection(sec.id);
      } else if (!checked && isCurrentlySelected) {
        onToggleSection(sec.id);
      }
    }
  };

  // Get items for active company (only from selected sections)
  const companyItems = companySecs.flatMap((sec) =>
    sec.items.map((item) => ({
      ...item,
      section: sec,
      uniqueKey: `${sec.id}-stt-${item.stt}-idx-${item.index}`,
    }))
  );

  const getMappedProductName = (maHang: string, rawName: string) => {
    if (!maHang) return rawName;
    const cleanMaHang = String(maHang).trim().toUpperCase();
    const prefixes = Object.keys(productNameMappings).sort((a, b) => b.length - a.length);
    for (const prefix of prefixes) {
      if (cleanMaHang.startsWith(prefix.trim().toUpperCase())) {
        return productNameMappings[prefix];
      }
    }
    return rawName;
  };

  const [activeItemKey, setActiveItemKey] = useState<string>('');

  // Sync active item key
  useEffect(() => {
    if (companyItems.length > 0) {
      if (!companyItems.some((i) => i.uniqueKey === activeItemKey)) {
        setActiveItemKey(companyItems[0].uniqueKey);
      }
    } else {
      setActiveItemKey('');
    }
  }, [activeCompanyId, companyItems, activeItemKey]);

  if (allCompanies.length === 0) return null;

  const currentItem = companyItems.find((i) => i.uniqueKey === activeItemKey) || companyItems[0];
  const currentSection = currentItem?.section;

  // Active export companies count
  const activeExportCount = allCompanies.filter((c) =>
    c.sections.some((s) => selectedSections.includes(s.id)) &&
    c.sections.every((sec) => getTemplateForSection(sec) !== null)
  ).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kiểm Tra Bố Cục & Đóng Gói File Tải Về"
      size="5xl"
    >
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(85vh-8rem)] overflow-hidden">
        {/* Left column: Sidebar splits into Company Tabs & Files list */}
        <div className="w-full lg:w-80 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 pr-0 lg:pr-4 shrink-0 overflow-hidden">
          
          {/* Section A: Company Tabs */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              1. Chọn công ty & Tùy chọn xuất
            </h5>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
              {allCompanies.map((company) => {
                const isSelected = company.sections.length > 0;
                const isActive = activeCompanyId === company.companyId;
                const hasTemplate = company.allSections.every((sec) => getTemplateForSection(sec) !== null);

                let tabClasses = '';
                if (!hasTemplate) {
                  tabClasses = isActive
                    ? 'border-rose-600 bg-rose-600 text-white font-bold shadow-md shadow-rose-500/10'
                    : 'border-rose-200/80 bg-rose-50/20 dark:border-rose-900/20 dark:bg-rose-950/5 text-rose-550 dark:text-rose-450 hover:bg-rose-50/40 hover:border-rose-350';
                } else {
                  tabClasses = isActive
                    ? 'border-violet-600 bg-violet-600 text-white font-bold shadow-md shadow-violet-500/10'
                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:border-zinc-300';
                }

                return (
                  <div
                    key={company.companyId}
                    onClick={() => setActiveCompanyId(company.companyId)}
                    className={`
                      flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all duration-150
                      ${tabClasses}
                    `}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={hasTemplate && isSelected}
                        disabled={!hasTemplate}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleCompany(company.companyId, e.target.checked);
                        }}
                        className={`
                          h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50
                          ${isActive && hasTemplate ? 'border-white/50 text-violet-650 bg-white' : ''}
                        `}
                        title={hasTemplate ? "Bật/Tắt xuất công ty này" : "Thiếu file mẫu Word cho công ty này"}
                      />
                      <div className="flex flex-col min-w-0 items-start">
                        <span className="truncate font-semibold text-left select-none max-w-[130px] leading-tight">
                          {company.companyName}
                        </span>
                        {!hasTemplate && (
                          <span className={`
                            text-[9px] font-bold mt-0.5 leading-none
                            ${isActive ? 'text-rose-100' : 'text-rose-650 dark:text-rose-400 animate-pulse'}
                          `}>
                            Thiếu mẫu Word
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`
                      text-[9px] px-1.5 py-0.5 rounded-md font-mono shrink-0
                      ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : !hasTemplate
                            ? 'bg-rose-100/50 dark:bg-rose-955 text-rose-600'
                            : 'bg-zinc-200/50 dark:bg-zinc-800 text-zinc-500'
                      }
                    `}>
                      {company.totalItems} hàng
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: Files List for Active Company */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                2. Danh sách File sản phẩm
              </h5>
              {isCompanySelected && (
                <div className="flex gap-2 text-[10px] font-bold text-violet-650 dark:text-violet-400">
                  <button 
                    onClick={() => {
                      const activeKeys = companyItems.map((item) => item.uniqueKey);
                      setSelectedItemKeys(prev => Array.from(new Set([...prev, ...activeKeys])));
                    }}
                    className="hover:underline"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-zinc-200 dark:text-zinc-800">|</span>
                  <button 
                    onClick={() => {
                      const activeKeys = companyItems.map((item) => item.uniqueKey);
                      setSelectedItemKeys(prev => prev.filter(k => !activeKeys.includes(k)));
                    }}
                    className="hover:underline text-zinc-400 hover:text-zinc-500"
                  >
                    Bỏ chọn
                  </button>
                </div>
              )}
            </div>
            
            {!isCompanySelected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-400">
                <HelpCircle className="h-5 w-5 text-zinc-300 mb-1.5" />
                <p className="text-[11px] font-medium leading-relaxed">
                  Tích chọn ô vuông phía trên công ty để kích hoạt hiển thị và xuất file
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
                {companyItems.map((item) => {
                  const cleanName = String(item.ten_hang).replace(/[\/\\:\*\?"<>\|]/g, '_').trim();
                  const docName = `${cleanName}_STT_${item.stt}.docx`;
                  const isItemActive = activeItemKey === item.uniqueKey;
                  const isChecked = selectedItemKeys.includes(item.uniqueKey);

                  return (
                    <div
                      key={item.uniqueKey}
                      className={`
                        w-full px-3 py-1.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-2.5
                        ${
                          isItemActive
                            ? 'bg-zinc-900 text-white border-zinc-800 font-bold dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-250'
                            : 'bg-zinc-50/40 dark:bg-zinc-900/30 border-zinc-150 dark:border-zinc-850 text-zinc-650 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedItemKeys(prev => [...prev, item.uniqueKey]);
                            } else {
                              setSelectedItemKeys(prev => prev.filter(k => k !== item.uniqueKey));
                            }
                          }}
                          className="h-3.5 w-3.5 rounded text-violet-650 border-zinc-300 dark:border-zinc-700 focus:ring-violet-500 cursor-pointer"
                        />
                        <span 
                          onClick={() => setActiveItemKey(item.uniqueKey)}
                          className="truncate font-semibold cursor-pointer flex-1 py-1"
                        >
                          {docName}
                        </span>
                      </div>
                      {isItemActive && <Check className="h-3.5 w-3.5 text-violet-500 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section C: Product Name Mappings */}
          <div className="flex flex-col gap-1.5 shrink-0 border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              3. Cấu hình Tên sản phẩm theo đầu Mã hàng
            </h5>
            
            {/* Added mapping rules list */}
            {Object.keys(productNameMappings).length > 0 && (
              <div className="flex flex-col gap-1 max-h-24 overflow-y-auto mb-2 pr-1">
                {Object.entries(productNameMappings).map(([prefix, categoryName]) => (
                  <div key={prefix} className="flex items-center justify-between p-1.5 px-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-[10px] font-semibold border border-zinc-200/50 dark:border-zinc-800">
                    <span className="truncate max-w-[190px]">
                      <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-violet-650 dark:text-violet-455 font-mono mr-1.5">{prefix}</code>
                      {categoryName}
                    </span>
                    <button
                      onClick={() => {
                        setProductNameMappings(prev => {
                          const next = { ...prev };
                          delete next[prefix];
                          return next;
                        });
                      }}
                      className="text-rose-500 hover:text-rose-600 p-0.5 hover:bg-rose-50 dark:hover:bg-rose-955 rounded transition-all"
                      title="Xóa cấu hình này"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Inputs to add new mapping */}
            <div className="flex flex-col gap-2 bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-850">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Mã: VL, SP..."
                  id="prefixInput"
                  className="w-1/2 p-1.5 px-2 text-[10.5px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 font-bold font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      document.getElementById('addButton')?.click();
                    }
                  }}
                />
                <input
                  type="text"
                  placeholder="Tên: Ống nhựa..."
                  id="nameInput"
                  className="w-1/2 p-1.5 px-2 text-[10.5px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 font-medium"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      document.getElementById('addButton')?.click();
                    }
                  }}
                />
              </div>
              <Button
                id="addButton"
                size="sm"
                onClick={() => {
                  const prefixEl = document.getElementById('prefixInput') as HTMLInputElement;
                  const nameEl = document.getElementById('nameInput') as HTMLInputElement;
                  const prefix = prefixEl?.value?.trim();
                  const name = nameEl?.value?.trim();
                  if (prefix && name) {
                    setProductNameMappings(prev => ({
                      ...prev,
                      [prefix]: name
                    }));
                    prefixEl.value = '';
                    nameEl.value = '';
                  }
                }}
                className="w-full h-7 text-[10px] font-bold rounded-lg shrink-0"
              >
                Thêm Cấu Hình
              </Button>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-150 dark:border-zinc-800 text-[10px] leading-relaxed text-zinc-500 font-medium shrink-0">
            <p className="font-bold text-zinc-700 dark:text-zinc-350 flex items-center gap-1 mb-1">
              <Building2 className="h-3.5 w-3.5 text-violet-500" />
              Tách ZIP theo Công ty
            </p>
            Hệ thống sẽ đóng gói và tải xuống riêng biệt các file ZIP chứa phiếu của từng công ty được chọn.
          </div>
        </div>

        {/* Right column: High-fidelity paper-like mockup viewer */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-violet-500" />
              Xem trước Phiếu được chọn
            </h5>
            <span className="text-[10px] font-medium text-zinc-450 dark:text-zinc-500">
              Kích thước chuẩn A4
            </span>
          </div>

          {/* Scrollable A4 Container */}
          <div className="flex-1 overflow-auto border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 p-6 rounded-2xl flex justify-center relative">
            {isProcessing && (
              <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 animate-bounce">
                  <Sparkles className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 rounded-full bg-violet-600 animate-bounce"></div>
                </div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 tracking-wide animate-pulse">
                  HỆ THỐNG ĐANG TẠO VÀ ĐÓNG GÓI VĂN BẢN...
                </p>
                <p className="text-[10px] text-zinc-500 font-medium">
                  Vui lòng không đóng cửa sổ này
                </p>
              </div>
            )}
            {isCompanySelected && currentItem ? (
              /* Responsive Paper Sheet Document mockup */
              <div className="bg-white text-zinc-950 p-12 border border-zinc-200/50 shadow-lg rounded-sm w-full max-w-[794px] aspect-[1/1.414] min-h-[950px] text-[11px] font-serif leading-relaxed flex flex-col justify-between shrink-0 select-none">
                
                {/* Report Header Logo Section */}
                <div>
                  <div className="flex items-start justify-between border-b border-zinc-950 pb-3 mb-5">
                    <div className="w-2/3">
                      <p className="font-bold text-[13px] uppercase tracking-wide">
                        {currentSection?.companyName || 'CÔNG TY'}
                      </p>
                      <p className="text-[9px] text-zinc-650 font-sans italic mt-0.5">
                        Địa chỉ: Văn phòng đại diện chính hãng
                      </p>
                      <p className="text-[9px] text-zinc-650 font-sans italic">
                        Điện thoại liên hệ: 1900-XXXX
                      </p>
                    </div>
                    <div className="text-right w-1/3 flex flex-col items-end">
                      <div className="w-10 h-10 border border-zinc-900 flex items-center justify-center font-sans font-bold text-[10px] rounded-lg">
                        ISO
                      </div>
                      <span className="text-[8px] text-zinc-500 font-sans mt-1">TCVN ISO 9001:2015</span>
                    </div>
                  </div>

                  {/* Report Title */}
                  <div className="text-center mb-6">
                    <h3 className="text-sm font-bold tracking-wider uppercase">
                      PHIẾU KIỂM TRA CHẤT LƯỢNG
                    </h3>
                    <h4 className="text-[10px] font-bold tracking-wider uppercase font-sans mt-0.5 text-zinc-400">
                      TEST REPORT
                    </h4>
                    <p className="font-bold uppercase mt-2 text-[10.5px]">
                      Sản phẩm/Product: {currentItem ? getMappedProductName(currentItem.ma_hang, currentItem.ten_hang).toUpperCase() : '---'}
                    </p>
                  </div>

                  {/* Reference Details */}
                  <div className="grid grid-cols-2 gap-y-1.5 border border-zinc-950 p-3 mb-6 bg-zinc-50/50">
                    <div>
                      <span className="italic text-zinc-500">Số phiếu / No:</span>{' '}
                      <span className="font-bold font-sans">
                        {currentItem && currentSection ? formatSoDocx(currentSection.so_de_nghi, currentItem.hd_xlt_so) : '---'}
                      </span>
                    </div>
                    <div>
                      <span className="italic text-zinc-500">Ngày xuất xưởng / Date:</span>{' '}
                      <span className="font-bold font-sans">
                        {currentItem && currentSection ? calculateNgayXuatXuong(currentItem.hd_xlt_ngay, currentSection) : '---'}
                      </span>
                    </div>
                    <div className="col-span-2 border-t border-zinc-200 pt-1.5">
                      <span className="italic text-zinc-500">Khách hàng / Customer:</span>{' '}
                      <span className="font-bold uppercase">{currentSection?.ten_khach_hang || '---'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="italic text-zinc-500">Là nhà cung cấp cho:</span>{' '}
                      <span className="font-bold uppercase">{currentSection?.nha_cung_cap_cho || '---'}</span>
                    </div>
                  </div>

                  {/* Properties table */}
                  <table className="w-full text-left border-collapse text-[10.5px] border border-zinc-950 mb-6">
                    <thead>
                      <tr className="border-b border-zinc-950 bg-zinc-100 font-bold text-center">
                        <th className="px-2.5 py-2 border-r border-zinc-950 w-8">TT</th>
                        <th className="px-2.5 py-2 border-r border-zinc-950 w-2/5">Tên sản phẩm / Product Name</th>
                        <th className="px-2.5 py-2 border-r border-zinc-950 w-20">Mã sản phẩm</th>
                        <th className="px-2.5 py-2 border-r border-zinc-950 w-16">Số lượng</th>
                        <th className="px-2.5 py-2 border-r border-zinc-950 w-28">Chỉ tiêu chất lượng</th>
                        <th className="px-2.5 py-2 w-16">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="align-top border-b border-zinc-950">
                        <td className="px-2.5 py-2.5 border-r border-zinc-950 text-center font-mono">1</td>
                        <td className="px-2.5 py-2.5 border-r border-zinc-950 font-bold">{currentItem.ten_hang}</td>
                        <td className="px-2.5 py-2.5 border-r border-zinc-950 text-center font-mono">{currentItem.ma_hang || '---'}</td>
                        <td className="px-2.5 py-2.5 border-r border-zinc-950 text-center font-semibold">{currentItem.so_luong} {currentItem.dvt}</td>
                        <td className="px-2.5 py-2.5 border-r border-zinc-950 text-zinc-650">
                          - Khả năng cách điện<br />
                          - Độ bền vật lý cơ học<br />
                          - Tính thẩm mỹ đồng đều
                        </td>
                        <td className="px-2.5 py-2.5 text-center font-bold text-emerald-700">ĐẠT</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="text-[10px] text-zinc-500 italic mb-8">
                    * Các chỉ tiêu kiểm tra chất lượng trên phù hợp theo các tiêu chuẩn kỹ thuật hiện hành. Đạt điều kiện nhập kho và đưa vào khai thác sử dụng.
                  </p>
                </div>

                {/* Signatures */}
                <div className="flex justify-between text-center mt-auto border-t border-zinc-150 pt-6">
                  <div className="w-1/3">
                    <p className="font-bold text-[10px] uppercase">PHỤ TRÁCH Q.C</p>
                    <p className="text-[9px] text-zinc-400 italic mt-0.5">CHIEF OF Q.C DEPT</p>
                    <div className="h-16" />
                    <p className="font-bold uppercase text-[10.5px]">NGUYỄN MẠNH HÙNG</p>
                  </div>
                  <div className="w-1/3">
                    <p className="font-bold text-[10px] uppercase">KIỂM TRA VIÊN</p>
                    <p className="text-[9px] text-zinc-400 italic mt-0.5">INSPECTOR</p>
                    <div className="h-16" />
                    <p className="font-bold uppercase text-[10.5px]">{currentSection?.nguoi_de_nghi || 'NGUYỄN THỊ ĐIỆP'}</p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-white/5 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl w-full max-w-[794px] aspect-[1/1.414] text-zinc-400">
                <Building2 className="h-10 w-10 text-zinc-350 mb-3" />
                <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Công ty này chưa được chọn để xuất bản
                </h4>
                <p className="text-xs text-zinc-500 max-w-sm">
                  Vui lòng tích vào ô vuông bên cạnh tên công ty trong danh sách để cho phép hiển thị xem trước và tải về.
                </p>
              </div>
            )}
          </div>

          {/* Action buttons footer */}
          {(() => {
            const activeCompanyHasTemplate = currentCompany ? currentCompany.allSections.every(sec => getTemplateForSection(sec) !== null) : false;
            const activeCompanySelectedItems = companyItems
              .filter(item => selectedItemKeys.includes(item.uniqueKey))
              .map(item => {
                const { section, uniqueKey, ...rest } = item;
                return rest;
              });

            return (
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!currentCompany || !currentCompany.sections[0]) return;
                    onDownloadSample(activeCompanySelectedItems, currentCompany.sections[0]);
                  }}
                  disabled={isProcessing || !isCompanySelected || activeCompanySelectedItems.length === 0 || !activeCompanyHasTemplate}
                  className="w-full sm:w-auto font-semibold rounded-xl"
                >
                  <FileDown className="h-4 w-4 mr-1.5 text-violet-500" />
                  Tải Thử Phiếu Này (.docx)
                </Button>
                <Button
                  onClick={() => onDownloadAllZip(selectedItemKeys)}
                  disabled={isProcessing || activeExportCount === 0 || selectedItemKeys.length === 0}
                  isLoading={isProcessing}
                  className="w-full sm:w-auto font-bold px-6 shadow-md shadow-violet-500/10 rounded-xl"
                >
                  {activeExportCount === 1 ? (
                    <>
                      <FileDown className="h-4.5 w-4.5 mr-2" />
                      Tải File .docx
                    </>
                  ) : (
                    <>
                      <FolderArchive className="h-4.5 w-4.5 mr-2" />
                      Tải File ZIP ({activeExportCount} Công ty)
                    </>
                  )}
                </Button>
              </div>
            );
          })()}
        </div>
      </div>
    </Modal>
  );
};
