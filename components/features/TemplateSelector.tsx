import React, { useRef, useState } from 'react';
import { FileUp, FileCode, AlertCircle, Sparkles, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Dropdown } from '@/components/ui/Dropdown';
import { Badge } from '@/components/ui/Badge';
import { EnterpriseTemplate } from '@/common/types';

interface TemplateSelectorProps {
  templates: EnterpriseTemplate[];
  selectedTemplateId: string;
  onTemplateChange: (id: string) => void;
  customFiles: File[];
  onCustomFilesChange: (files: File[]) => void;
  onRemoveCustomFile: (index: number) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onTemplateChange,
  customFiles,
  onCustomFilesChange,
  onRemoveCustomFile,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRemoveCustomFile = (index: number) => {
    const removedFile = customFiles[index];
    const targetVal = `custom-${removedFile.name}`;
    if (selectedTemplateId === targetVal) {
      onTemplateChange('custom');
    }
    onRemoveCustomFile(index);
  };

  const dropdownOptions = [
    ...templates.map((t) => ({
      value: t.id,
      label: t.name,
    })),
    { value: 'custom', label: '📂 Tự tải lên nhiều file mẫu Word (.docx)' },
    ...customFiles.map((file, idx) => ({
      value: `custom-${file.name}`,
      label: `📄 Mẫu: ${file.name}`,
      isCustomFile: true,
      onRemove: () => handleRemoveCustomFile(idx),
    })),
  ];

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => {
        if (file.name.endsWith('.docx')) {
          return true;
        } else if (file.name.endsWith('.doc')) {
          alert(
            `Định dạng .doc của file "${file.name}" không được hỗ trợ để xử lý trực tiếp trên trình duyệt.\n\nVui lòng mở bằng Word, chọn Save As và đổi thành .docx để tiếp tục.`
          );
        }
        return false;
      });

      if (droppedFiles.length > 0) {
        onCustomFilesChange([...customFiles, ...droppedFiles]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files).filter((file) => {
        if (file.name.endsWith('.docx')) {
          return true;
        } else if (file.name.endsWith('.doc')) {
          alert(
            `Định dạng .doc của file "${file.name}" không được hỗ trợ để xử lý trực tiếp trên trình duyệt.\n\nVui lòng mở bằng Word, chọn Save As và đổi thành .docx để tiếp tục.`
          );
        }
        return false;
      });

      if (selected.length > 0) {
        onCustomFilesChange([...customFiles, ...selected]);
      }
    }
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileCode className="h-4 w-4 text-violet-500" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            3. Chọn biểu mẫu Word (.docx)
          </h4>
        </div>

        <div className="flex flex-col gap-4">
          {/* Dropdown */}
          <Dropdown
            options={dropdownOptions}
            value={selectedTemplateId}
            onChange={onTemplateChange}
            id="template-dropdown"
          />

          {/* Conditional Custom Template Upload Zone */}
          {selectedTemplateId === 'custom' && (
            <div className="mt-1 flex flex-col gap-3">
              {/* Dropzone area */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerInputClick}
                className={`
                  border border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200
                  ${isDragActive 
                    ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10' 
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-zinc-50/20 dark:bg-zinc-950/40'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <FileUp className="h-5 w-5 text-zinc-450 dark:text-zinc-500 mb-2" />
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Kéo thả nhiều file Word (.docx) hoặc click để tải lên
                </p>
              </div>

              {/* Uploaded Files List */}
              {customFiles.length > 0 && (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Mẫu đã chọn ({customFiles.length} file)
                  </span>
                  {customFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
                          <FileCode className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[190px]">
                            {file.name}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCustomFile(idx);
                        }}
                        className="p-1 text-zinc-400 hover:text-rose-550 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Xoá bỏ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Show Placeholders / Mapping Schema if Enterprise Template selected */}
          {selectedTemplateId !== 'custom' && currentTemplate && (
            <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-855 bg-zinc-50/30 dark:bg-zinc-950/20">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nhãn trường yêu cầu (Placeholders):
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-[88px] overflow-y-auto pr-1">
                {currentTemplate.mappingSchema.map((variable) => (
                  <Badge key={variable} variant="primary" className="font-mono text-[10px]">
                    {`{${variable}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {selectedTemplateId === 'custom' && customFiles.length === 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-250 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/10 text-[11px] font-medium text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Vui lòng tải lên các file mẫu Word tương ứng với tên công ty phát hành phiếu. Hệ thống sẽ tự động đối chiếu và áp dụng đúng mẫu.
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
