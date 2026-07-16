import React, { useState, useEffect } from 'react';
import { Layers, Eye, TableProperties, Building2, User, Landmark } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ExcelSection } from '@/common/types';

interface SectionSelectorProps {
  sections: ExcelSection[];
  selectedSections: string[];
  onToggleSection: (sectionId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export const SectionSelector: React.FC<SectionSelectorProps> = ({
  sections,
  selectedSections,
  onToggleSection,
  onSelectAll,
  onDeselectAll,
}) => {
  const [previewSection, setPreviewSection] = useState<ExcelSection | null>(null);

  const sheetNames = Array.from(new Set(sections.map(s => s.sheetName || 'Sheet1')));
  const [activeSheetName, setActiveSheetName] = useState<string>('');

  // Sync active sheet when sections load
  useEffect(() => {
    if (sheetNames.length > 0) {
      setActiveSheetName(sheetNames[0]);
    }
  }, [sections]);

  if (sections.length === 0) return null;

  const currentSheetName = activeSheetName || sheetNames[0] || '';
  const filteredSections = sections.filter(s => (s.sheetName || 'Sheet1') === currentSheetName);

  // Sheet-specific select/deselect all
  const selectAllSheetSections = () => {
    for (const sec of filteredSections) {
      if (!selectedSections.includes(sec.id) && sec.rowCount > 0) {
        onToggleSection(sec.id);
      }
    }
  };

  const deselectAllSheetSections = () => {
    for (const sec of filteredSections) {
      if (selectedSections.includes(sec.id)) {
        // Keep at least one selected overall
        if (selectedSections.length > 1) {
          onToggleSection(sec.id);
        }
      }
    }
  };

  const handleTabClick = (name: string, event: React.MouseEvent<HTMLButtonElement>) => {
    setActiveSheetName(name);
    event.currentTarget.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-500" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              2. Chọn danh sách Section (Hóa đơn Công ty) phát hiện được
            </h4>
          </div>
          
          <div className="flex items-center gap-3 text-xs font-medium">
            <button 
              onClick={selectAllSheetSections} 
              className="text-violet-600 hover:text-violet-500 transition-colors cursor-pointer"
            >
              Chọn tab này
            </button>
            <span className="text-zinc-300 dark:text-zinc-800">|</span>
            <button 
              onClick={deselectAllSheetSections} 
              className="text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Bỏ chọn tab này
            </button>
          </div>
        </div>

        {/* Sheet Tabs */}
        {sheetNames.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-4 border-b border-zinc-150 dark:border-zinc-900/60 scrollbar-thin">
            {sheetNames.map((name) => {
              const isActive = name === currentSheetName;
              const sheetSecsCount = sections.filter(s => (s.sheetName || 'Sheet1') === name).length;
              return (
                <button
                  key={name}
                  onClick={(e) => handleTabClick(name, e)}
                  className={`
                    px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5
                    ${
                      isActive
                        ? 'bg-violet-600 border-violet-600 text-white shadow-sm shadow-violet-500/10'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850'
                    }
                  `}
                >
                  <TableProperties className="h-3.5 w-3.5" />
                  {name}
                  <span className={`
                    text-[10px] px-1.5 py-0.5 rounded-full font-bold
                    ${isActive ? 'bg-violet-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400'}
                  `}>
                    {sheetSecsCount}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSections.map((section) => {
            const isSelected = selectedSections.includes(section.id);
            const isEmpty = section.rowCount === 0;
            
            return (
              <div
                key={section.id}
                onClick={() => !isEmpty && onToggleSection(section.id)}
                className={`
                  flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative group
                  ${isEmpty 
                    ? 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-800/40 dark:bg-zinc-950/20 opacity-50 cursor-not-allowed'
                    : isSelected
                      ? 'border-violet-500/80 bg-violet-50/30 dark:border-violet-500/30 dark:bg-violet-950/10'
                      : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/30 dark:border-zinc-850 dark:bg-zinc-950 dark:hover:bg-zinc-900/40'
                  }
                `}
              >
                {/* Header Checkbox + Company title */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isEmpty}
                      onChange={() => {}} // Controlled via card onClick
                      className="h-4.5 w-4.5 rounded border-zinc-300 text-violet-600 focus:ring-violet-500 cursor-pointer disabled:cursor-not-allowed mt-0.5"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-zinc-450 shrink-0" />
                        {section.companyName}
                      </p>
                      <p className="text-xs font-semibold text-violet-650 dark:text-violet-400 mt-0.5">
                        Số đề nghị: {section.so_de_nghi || 'Chưa rõ'}
                      </p>
                    </div>
                  </div>

                  {!isEmpty && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid card toggle
                        setPreviewSection(section);
                      }}
                      className="p-1.5 rounded-lg hover:bg-zinc-150/60 dark:hover:bg-zinc-900 text-zinc-550 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                      title="Xem trước Section"
                    >
                      <Eye className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>

                {/* Metadata Summary */}
                <div className="text-[11px] text-zinc-500 dark:text-zinc-450 space-y-1 mt-1 border-t border-zinc-100 dark:border-zinc-900/60 pt-2.5">
                  {section.ten_khach_hang && (
                    <p className="truncate flex items-center gap-1.5">
                      <User className="h-3 w-3 shrink-0" />
                      Khách hàng: <span className="font-semibold text-zinc-700 dark:text-zinc-350">{section.ten_khach_hang}</span>
                    </p>
                  )}
                  {section.ten_cong_trinh && (
                    <p className="truncate flex items-center gap-1.5">
                      <Landmark className="h-3 w-3 shrink-0" />
                      Công trình: <span className="font-semibold text-zinc-700 dark:text-zinc-350">{section.ten_cong_trinh}</span>
                    </p>
                  )}
                </div>

                {/* Bottom Badges */}
                <div className="flex items-center justify-between mt-3">
                  <Badge variant={section.companyId === 'custom' ? 'secondary' : 'primary'}>
                    Mẫu: {section.companyId === 'custom' ? 'Mẫu ngoài' : section.companyId === 'xuan-loc-tho' ? 'Xuân Lộc Thọ' : 'Phú Minh'}
                  </Badge>
                  <Badge variant={isEmpty ? 'danger' : 'success'}>
                    {section.rowCount} hàng hóa
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section Preview Modal */}
        <Modal
          isOpen={previewSection !== null}
          onClose={() => setPreviewSection(null)}
          title={`Xem chi tiết hóa đơn: ${previewSection?.so_de_nghi || ''}`}
          size="xl"
        >
          {previewSection && (
            <div className="flex flex-col gap-5">
              {/* Parent Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl text-xs">
                <div>
                  <span className="font-semibold text-zinc-400 dark:text-zinc-500">Đơn vị tiếp nhận:</span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{previewSection.companyName}</p>
                </div>
                <div>
                  <span className="font-semibold text-zinc-400 dark:text-zinc-500">Tên khách hàng (nhà cung cấp):</span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{previewSection.ten_khach_hang || '---'}</p>
                </div>
                <div>
                  <span className="font-semibold text-zinc-400 dark:text-zinc-500">Đối tác bàn giao (nhà cung cấp cho):</span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{previewSection.nha_cung_cap_cho || '---'}</p>
                </div>
                <div>
                  <span className="font-semibold text-zinc-400 dark:text-zinc-500">Tên công trình:</span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{previewSection.ten_cong_trinh || '---'}</p>
                </div>
                <div>
                  <span className="font-semibold text-zinc-400 dark:text-zinc-500">Người đề nghị:</span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{previewSection.nguoi_de_nghi || '---'}</p>
                </div>
                <div>
                  <span className="font-semibold text-zinc-400 dark:text-zinc-500">Ngày tạo phiếu:</span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{previewSection.ngay_de_nghi || '---'}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <TableProperties className="h-4 w-4 text-violet-500" />
                  <span>Danh sách hàng hóa ({previewSection.rowCount} mục):</span>
                </div>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                        <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300 w-10 text-center">STT</th>
                        <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300">Tên Hàng</th>
                        <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300">Mã Hàng</th>
                        <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300">ĐVT</th>
                        <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300 text-center">Số Lượng</th>
                        <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300">HĐxlt Số</th>
                        <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300">HĐxlt Ngày</th>
                        <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300">HĐPM Ngày</th>
                        <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300">Ngày KTCL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {previewSection.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20">
                          <td className="px-3 py-2 text-zinc-500 text-center font-mono">{item.stt}</td>
                          <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200 font-medium max-w-[180px] truncate" title={item.ten_hang}>{item.ten_hang}</td>
                          <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400 font-mono">{item.ma_hang || '---'}</td>
                          <td className="px-3 py-2 text-zinc-650 dark:text-zinc-400 text-center">{item.dvt}</td>
                          <td className="px-3 py-2 text-zinc-850 dark:text-zinc-100 text-center font-semibold">{item.so_luong}</td>
                          <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{item.hd_xlt_so || '---'}</td>
                          <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{item.hd_xlt_ngay || '---'}</td>
                          <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{item.hd_pm_ngay || '---'}</td>
                          <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{item.ngay_ktcl || '---'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </CardContent>
    </Card>
  );
};
