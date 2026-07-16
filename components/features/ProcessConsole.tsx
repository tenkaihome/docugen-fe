import React, { useRef, useEffect } from 'react';
import { Terminal, ShieldAlert, Cpu, FileCheck2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProcessLog, ProcessState } from '@/common/types';

interface ProcessConsoleProps {
  logs: ProcessLog[];
  processState: ProcessState;
  onClearLogs: () => void;
  isProcessing: boolean;
  onGenerate: () => void;
  generationMode: 'client' | 'server';
  onGenerationModeChange: (mode: 'client' | 'server') => void;
  hasData: boolean;
}

export const ProcessConsole: React.FC<ProcessConsoleProps> = ({
  logs,
  processState,
  onClearLogs,
  isProcessing,
  onGenerate,
  generationMode,
  onGenerationModeChange,
  hasData,
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal to bottom when new logs arrive
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const stages = [
    { key: 'IDLE', label: 'Chờ lệnh' },
    { key: 'PARSING', label: 'Đọc Excel' },
    { key: 'MAPPING', label: 'Khớp Trường' },
    { key: 'GENERATING', label: 'Tạo Word' },
    { key: 'SUCCESS', label: 'Hoàn thành' },
  ];

  const getStageIndex = (state: ProcessState) => {
    if (state === 'ERROR') return 3; // Stay at generating/error
    return stages.findIndex((s) => s.key === state);
  };

  const currentStageIndex = getStageIndex(processState);

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-zinc-950 dark:bg-zinc-950/60 overflow-hidden text-zinc-100">
      <CardContent className="p-6">
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Terminal className="h-4.5 w-4.5 text-violet-400" />
            <span className="text-sm font-semibold tracking-wide">
              Bảng Điều Khiển Tiến Trình
            </span>
            {isProcessing && (
              <Badge variant="warning" className="animate-pulse bg-violet-600/30 text-violet-400 border border-violet-500/20">
                Processing...
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Switcher */}
            <div className="flex bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 text-xs font-semibold">
              <button
                disabled={isProcessing}
                onClick={() => onGenerationModeChange('client')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  generationMode === 'client'
                    ? 'bg-zinc-850 text-white border border-zinc-700/50 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                Client (Trình duyệt)
              </button>
              <button
                disabled={isProcessing}
                onClick={() => onGenerationModeChange('server')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  generationMode === 'server'
                    ? 'bg-zinc-850 text-white border border-zinc-700/50 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                Server (API Backend)
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onClearLogs}
              disabled={logs.length === 0}
              className="border-zinc-800 hover:bg-zinc-900 hover:text-white text-zinc-400 font-semibold"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Xoá logs
            </Button>
          </div>
        </div>

        {/* Timeline Progress */}
        <div className="mb-6 bg-zinc-900/60 border border-zinc-900/80 rounded-2xl p-4.5">
          <div className="flex items-center justify-between relative mb-2">
            {stages.map((stage, idx) => {
              const isActive = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              
              return (
                <div key={stage.key} className="flex flex-col items-center z-10 w-1/5 text-center">
                  <div
                    className={`
                      w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300
                      ${
                        isCurrent
                          ? 'bg-violet-500 text-white ring-4 ring-violet-500/20'
                          : isActive
                            ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40'
                            : 'bg-zinc-900 text-zinc-650 border border-zinc-800'
                      }
                    `}
                  >
                    {isActive && idx < currentStageIndex ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-1.5 transition-all
                      ${isCurrent ? 'text-violet-400' : isActive ? 'text-zinc-300' : 'text-zinc-600'}
                    `}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}

            {/* Connecting line */}
            <div className="absolute top-[13px] left-[10%] right-[10%] h-[2px] bg-zinc-900 -z-1" />
            <div
              className="absolute top-[13px] left-[10%] h-[2px] bg-violet-600 transition-all duration-500 -z-1"
              style={{
                width: `${(currentStageIndex / (stages.length - 1)) * 80}%`,
              }}
            />
          </div>
        </div>

        {/* Terminal Logs Window */}
        <div className="relative font-mono text-[11px] leading-relaxed p-4 rounded-xl bg-zinc-950 border border-zinc-900 h-64 overflow-y-auto mb-5 shadow-inner">
          {logs.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 select-none">
              <Cpu className="h-7 w-7 mb-2 text-zinc-700 animate-pulse" />
              <span>Hệ thống đang sẵn sàng. Hãy bấm bắt đầu để xử lý.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {logs.map((log, index) => {
                const colors = {
                  info: 'text-zinc-400',
                  success: 'text-emerald-400 font-medium',
                  warning: 'text-amber-400 font-medium',
                  error: 'text-rose-400 font-bold',
                };
                return (
                  <div key={index} className="flex gap-2">
                    <span className="text-zinc-600">[{log.timestamp}]</span>
                    <span className={colors[log.type]}>{log.message}</span>
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>
          )}
        </div>

        {/* Action Button Trigger */}
        <div className="flex justify-end">
          <Button
            onClick={onGenerate}
            disabled={!hasData || isProcessing}
            isLoading={isProcessing}
            size="lg"
            className="w-full sm:w-auto shadow-lg shadow-violet-500/20 font-bold px-8 text-sm py-3"
          >
            <FileCheck2 className="h-5 w-5 mr-2" />
            Tiến Hành Tạo Văn Bản (.docx)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
