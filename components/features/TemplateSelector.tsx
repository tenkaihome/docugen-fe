import React, { useRef, useState } from 'react';
import { FileUp, FileCode, AlertCircle, Trash2, FileDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { EnterpriseTemplate } from '@/common/types';
import { API_BASE_URL } from '@/config';

interface TemplateSelectorProps {
  templates: EnterpriseTemplate[];
  selectedTemplateId: string;
  onTemplateChange: (id: string) => void;
  onUploadFile: (file: File) => void;
  onRemoveTemplate: (id: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onTemplateChange,
  onUploadFile,
  onRemoveTemplate,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      Array.from(e.dataTransfer.files).forEach((file) => {
        if (file.name.endsWith('.docx')) {
          onUploadFile(file);
        } else if (file.name.endsWith('.doc')) {
          alert(
            `Định dạng .doc của file "${file.name}" không được hỗ trợ.\n\nVui lòng mở bằng Word, chọn Save As và đổi thành .docx để tiếp tục.`
          );
        }
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => {
        if (file.name.endsWith('.docx')) {
          onUploadFile(file);
        } else if (file.name.endsWith('.doc')) {
          alert(
            `Định dạng .doc của file "${file.name}" không được hỗ trợ.\n\nVui lòng mở bằng Word, chọn Save As và đổi thành .docx để tiếp tục.`
          );
        }
      });
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

        <div className="flex flex-col gap-3">
          {/* Option: Auto-matching Mode */}
          <div
            onClick={() => onTemplateChange('custom')}
            className={`
              flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all duration-150 select-none
              ${
                selectedTemplateId === 'custom'
                  ? 'border-violet-500 bg-violet-650/10 text-violet-650 dark:bg-violet-500/10 dark:text-violet-400 font-bold shadow-sm shadow-violet-500/5 ring-1 ring-violet-500/10'
                  : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:border-zinc-300'
              }
            `}
          >
            <span className="text-base shrink-0">📂</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">Tự động đối khớp mẫu theo tên công ty</p>
              <p className={`text-[10px] mt-0.5 font-medium leading-relaxed ${selectedTemplateId === 'custom' ? 'text-violet-500 dark:text-violet-400' : 'text-zinc-450 dark:text-zinc-500'}`}>
                Hệ thống tự nhận diện mẫu phù hợp cho từng công ty phát hành phiếu.
              </p>
            </div>
          </div>

          {/* List of uploaded templates */}
          {templates.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 select-none">
                Danh sách biểu mẫu đã tải lên ({templates.length})
              </span>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                {templates.map((template) => {
                  const isActive = selectedTemplateId === template.id;
                  return (
                    <div
                      key={template.id}
                      onClick={() => onTemplateChange(template.id)}
                      className={`
                        flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all duration-150 select-none
                        ${
                          isActive
                            ? 'border-violet-500 bg-violet-600 text-white font-bold shadow-md shadow-violet-500/10'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:border-zinc-300'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-sm shrink-0">📄</span>
                        <span className="truncate font-semibold">{template.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Download button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`${API_BASE_URL}/api/templates/${template.id}/download`, '_blank');
                          }}
                          className={`
                            p-1.5 rounded-lg transition-colors
                            ${
                              isActive
                                ? 'text-white/80 hover:bg-white/20 hover:text-white'
                                : 'text-zinc-450 hover:bg-zinc-100 hover:text-violet-600 dark:text-zinc-550 dark:hover:bg-zinc-800'
                            }
                          `}
                          title="Tải tệp tin mẫu này về máy"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveTemplate(template.id);
                          }}
                          className={`
                            p-1.5 rounded-lg transition-colors
                            ${
                              isActive
                                ? 'text-white/80 hover:bg-white/20 hover:text-white'
                                : 'text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-955 hover:text-rose-600'
                            }
                          `}
                          title="Xoá mẫu này khỏi hệ thống"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upload Dropzone */}
          <div className="mt-1">
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
                Kéo thả file Word (.docx) hoặc click để tải lên mẫu mới
              </p>
            </div>
          </div>

          {templates.length === 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-250 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/10 text-[11px] font-medium text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Chưa có mẫu nào trong hệ thống. Vui lòng kéo thả hoặc click tải lên tệp mẫu Word (.docx) tương ứng với công ty cần xuất.
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
