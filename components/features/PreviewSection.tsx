import React, { useState } from 'react';
import { Table, Download, FileText, Search, FileDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ExcelSection, ExcelItem } from '@/common/types';

interface PreviewSectionProps {
  sections: ExcelSection[];
  selectedSections: string[];
  onGenerateRow: (rowData: ExcelItem, section: ExcelSection) => void;
  onGenerateSection: (section: ExcelSection) => void;
  isProcessing: boolean;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
  sections,
  selectedSections,
  onGenerateRow,
  onGenerateSection,
  isProcessing,
}) => {
  const activeSections = sections.filter((s) => selectedSections.includes(s.id) && s.rowCount > 0);
  const [activeTabId, setActiveTabId] = useState<string>(activeSections[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');

  // Sync active tab if it gets deselected
  React.useEffect(() => {
    if (activeSections.length > 0 && !activeSections.some((s) => s.id === activeTabId)) {
      setActiveTabId(activeSections[0].id);
    }
  }, [selectedSections, activeSections, activeTabId]);

  if (activeSections.length === 0) return null;

  const currentSection = activeSections.find((s) => s.id === activeTabId);
  if (!currentSection) return null;

  // Search filter
  const filteredItems = currentSection.items.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-150 dark:border-zinc-900 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Table className="h-4.5 w-4.5 text-violet-500" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              4. Xem trước hàng hóa & Xuất báo cáo lẻ
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full md:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Tìm kiếm mặt hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
              />
            </div>

            {/* Quick Export entire section */}
            <Button
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={() => onGenerateSection(currentSection)}
              className="text-xs rounded-xl font-bold bg-violet-600/5 text-violet-650 hover:bg-violet-600 hover:text-white border-violet-200/50"
            >
              <FileDown className="h-4 w-4 mr-1.5" />
              Tải Toàn Bộ Phiếu Section này ({currentSection.rowCount} trang)
            </Button>
          </div>
        </div>

        {/* Tabs to toggle between active sections */}
        <div className="flex flex-wrap gap-2 mb-5">
          {activeSections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveTabId(section.id);
                setSearchTerm('');
              }}
              className={`
                px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 text-left
                ${
                  activeTabId === section.id
                    ? 'bg-violet-600/10 text-violet-650 border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400'
                    : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-950 dark:border-zinc-850 dark:hover:bg-zinc-900 text-zinc-550 hover:text-zinc-800 dark:hover:text-zinc-200'
                }
              `}
            >
              <div className="text-[10px] opacity-75 font-semibold">Số: {section.so_de_nghi}</div>
              <div className="font-bold flex items-center gap-1.5 mt-0.5">
                {section.companyId === 'xuan-loc-tho' ? 'Xuân Lộc Thọ' : section.companyId === 'phu-minh' ? 'Phú Minh' : 'Khác'}
                <span className="font-mono opacity-65">({section.rowCount} hàng)</span>
              </div>
            </button>
          ))}
        </div>

        {/* Data Grid Table */}
        <div className="border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950/40">
          <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
                  <th className="px-3 py-3 font-semibold text-zinc-500 w-12 text-center bg-zinc-50 dark:bg-zinc-900">
                    STT
                  </th>
                  <th className="px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900">
                    Tên Hàng
                  </th>
                  <th className="px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900">
                    Mã Hàng
                  </th>
                  <th className="px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 text-center">
                    ĐVT
                  </th>
                  <th className="px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 text-center">
                    Số Lượng
                  </th>
                  <th className="px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900">
                    HĐxlt Số
                  </th>
                  <th className="px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900">
                    Ngày KTCL
                  </th>
                  <th className="px-3 py-3 font-semibold text-zinc-500 text-right w-32 sticky right-0 bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-zinc-500 font-medium text-xs bg-zinc-50/10 dark:bg-zinc-950/20"
                    >
                      Không tìm thấy mặt hàng nào khớp.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors"
                    >
                      <td className="px-3 py-3 text-zinc-450 font-mono text-center">
                        {item.stt}
                      </td>
                      <td className="px-3 py-3 text-zinc-800 dark:text-zinc-200 font-medium max-w-[200px] truncate" title={item.ten_hang}>
                        {item.ten_hang}
                      </td>
                      <td className="px-3 py-3 text-zinc-600 dark:text-zinc-450 font-mono">
                        {item.ma_hang || '---'}
                      </td>
                      <td className="px-3 py-3 text-zinc-650 dark:text-zinc-400 text-center">
                        {item.dvt}
                      </td>
                      <td className="px-3 py-3 text-zinc-850 dark:text-zinc-100 text-center font-bold">
                        {item.so_luong}
                      </td>
                      <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">
                        {item.hd_xlt_so || '---'}
                      </td>
                      <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">
                        {item.ngay_ktcl || '---'}
                      </td>
                      {/* Action Cell */}
                      <td className="px-3 py-2 text-right sticky right-0 bg-white/95 dark:bg-zinc-950/95 border-l border-zinc-200 dark:border-zinc-800 shadow-[-4px_0_12px_rgba(0,0,0,0.03)]">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => onGenerateRow(item, currentSection)}
                          className="text-[10px] h-7.5 text-violet-650 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/40 p-1 px-2.5 rounded-lg"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Xuất Phiếu Lẻ
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
