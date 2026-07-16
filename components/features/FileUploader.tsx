import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatFileSize } from '@/common/excelHelper';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  isParsing: boolean;
  error: string | null;
  onClear: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  selectedFile,
  isParsing,
  error,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        onFileSelect(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
          1. Tải lên tệp nguồn Excel
        </h4>
        
        {!selectedFile ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerInputClick}
            className={`
              border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300
              ${isDragActive 
                ? 'border-violet-500 bg-violet-500/5 dark:bg-violet-500/10 scale-[0.99]' 
                : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="p-4 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded-2xl mb-4 shadow-sm">
              <Upload className="h-6 w-6 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Kéo thả tệp Excel của bạn vào đây
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
              Hỗ trợ tệp định dạng .xlsx, .xls (Tối đa 25MB)
            </p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-between p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-600/10 dark:bg-violet-400/10 text-violet-600 dark:text-violet-400 rounded-xl">
                <FileSpreadsheet className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate max-w-[240px] sm:max-w-md">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isParsing ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Đang phân tích...
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={onClear}>
                  Thay đổi tệp
                </Button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl border border-rose-200/50 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-950/10 text-xs font-medium text-rose-600 dark:text-rose-450">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
