import React, { useState, useEffect } from 'react';
import { Eye, FileDown, FolderArchive, HelpCircle, Check, Building2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ExcelSection, ExcelItem } from '@/common/types';

interface VisualPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: ExcelSection[];
  selectedSections: string[];
  onToggleSection: (sectionId: string) => void;
  onDownloadSample: (item: ExcelItem, section: ExcelSection) => void;
  onDownloadAllZip: () => void;
  isProcessing: boolean;
  getTemplateForSection: (section: ExcelSection) => any;
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
}) => {
  // Get all companies with items
  const allCompanies = Array.from(
    new Set(sections.filter((s) => s.rowCount > 0).map((s) => s.companyId))
  ).map((cId) => {
    const companySecs = sections.filter((s) => s.companyId === cId);
    const companyName = companySecs[0]?.companyName || 'Công ty';
    const totalItems = companySecs.reduce((sum, s) => sum + s.rowCount, 0);
    return {
      companyId: cId,
      companyName,
      sections: companySecs,
      totalItems,
    };
  });

  const [activeCompanyId, setActiveCompanyId] = useState<string>(allCompanies[0]?.companyId || '');

  // Sync active company if list changes
  useEffect(() => {
    if (allCompanies.length > 0 && !allCompanies.some((c) => c.companyId === activeCompanyId)) {
      setActiveCompanyId(allCompanies[0].companyId);
    }
  }, [sections, activeCompanyId, allCompanies]);

  const currentCompany = allCompanies.find((c) => c.companyId === activeCompanyId) || allCompanies[0];
  const companySecs = currentCompany?.sections || [];
  const isCompanySelected = companySecs.some((s) => selectedSections.includes(s.id));

  // Toggle export for all sections of a company
  const handleToggleCompany = (cId: string, checked: boolean) => {
    const targetSecs = sections.filter((s) => s.companyId === cId);
    for (const sec of targetSecs) {
      const isCurrentlySelected = selectedSections.includes(sec.id);
      if (checked && !isCurrentlySelected) {
        onToggleSection(sec.id);
      } else if (!checked && isCurrentlySelected) {
        onToggleSection(sec.id);
      }
    }
  };

  // Get items for active company
  const companyItems = companySecs.flatMap((sec) =>
    sec.items.map((item) => ({
      ...item,
      section: sec,
      uniqueKey: `${sec.id}-stt-${item.stt}-idx-${item.index}`,
    }))
  );

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
                const isSelected = company.sections.some((s) => selectedSections.includes(s.id));
                const isActive = activeCompanyId === company.companyId;
                const hasTemplate = company.sections.every((sec) => getTemplateForSection(sec) !== null);

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
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
              2. Danh sách File sản phẩm
            </h5>
            
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

                  return (
                    <button
                      key={item.uniqueKey}
                      onClick={() => setActiveItemKey(item.uniqueKey)}
                      className={`
                        w-full px-3 py-2 rounded-xl text-left border text-xs transition-all flex items-start justify-between gap-2
                        ${
                          isItemActive
                            ? 'bg-zinc-900 text-white border-zinc-800 font-bold dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-250'
                            : 'bg-zinc-50/40 dark:bg-zinc-900/30 border-zinc-150 dark:border-zinc-850 text-zinc-650 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }
                      `}
                    >
                      <span className="truncate font-semibold pr-2">{docName}</span>
                      {isItemActive && <Check className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            )}
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
          <div className="flex-1 overflow-auto border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 p-6 rounded-2xl flex justify-center">
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
                      Sản phẩm/Product: {currentItem ? currentItem.ten_hang.toUpperCase() : '---'}
                    </p>
                  </div>

                  {/* Reference Details */}
                  <div className="grid grid-cols-2 gap-y-1.5 border border-zinc-950 p-3 mb-6 bg-zinc-50/50">
                    <div>
                      <span className="italic text-zinc-500">Số phiếu / No:</span>{' '}
                      <span className="font-bold font-sans">{currentSection?.so_de_nghi || '---'}</span>
                    </div>
                    <div>
                      <span className="italic text-zinc-500">Ngày xuất xưởng / Date:</span>{' '}
                      <span className="font-bold font-sans">
                        {currentItem?.ngay_ktcl || '---'}
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
            const activeCompanyHasTemplate = currentCompany ? currentCompany.sections.every(sec => getTemplateForSection(sec) !== null) : false;
            return (
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => onDownloadSample(currentItem, currentSection)}
                  disabled={isProcessing || !isCompanySelected || !currentItem || !activeCompanyHasTemplate}
                  className="w-full sm:w-auto font-semibold rounded-xl"
                >
                  <FileDown className="h-4 w-4 mr-1.5 text-violet-500" />
                  Tải Thử Phiếu Này (.docx)
                </Button>
                <Button
                  onClick={onDownloadAllZip}
                  disabled={isProcessing || activeExportCount === 0}
                  isLoading={isProcessing}
                  className="w-full sm:w-auto font-bold px-6 shadow-md shadow-violet-500/10 rounded-xl"
                >
                  <FolderArchive className="h-4.5 w-4.5 mr-2" />
                  Tải File ZIP ({activeExportCount} Công ty)
                </Button>
              </div>
            );
          })()}
        </div>
      </div>
    </Modal>
  );
};
