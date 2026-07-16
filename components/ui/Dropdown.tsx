import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Trash2 } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
  isCustomFile?: boolean;
  onRemove?: () => void;
}

interface DropdownProps {
  label?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  value,
  onChange,
  error,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5 w-full relative">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 select-none">
          {label}
        </label>
      )}

      <div>
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full px-4 py-2.5 rounded-xl text-xs flex items-center justify-between text-left cursor-pointer
            bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100
            hover:bg-zinc-100/50 dark:hover:bg-zinc-850 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-500/40
            ${error ? 'border-rose-500 focus:ring-rose-500/20' : ''}
          `}
        >
          <span className="truncate pr-4 font-medium">
            {selectedOption ? selectedOption.label : 'Chọn biểu mẫu...'}
          </span>
          <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Options Menu */}
        {isOpen && (
          <div className="absolute z-30 mt-1.5 w-full rounded-2xl border border-zinc-200/85 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shadow-xl shadow-zinc-500/5 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="max-h-60 overflow-y-auto scrollbar-thin">
              {options.map((option) => {
                const isActive = option.value === value;
                return (
                  <div
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`
                      group flex items-center justify-between px-3.5 py-2.5 text-xs cursor-pointer select-none transition-colors
                      ${
                        isActive
                          ? 'bg-violet-50/50 dark:bg-violet-950/20 text-violet-650 dark:text-violet-400 font-semibold'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`h-4 w-4 flex items-center justify-center shrink-0 ${isActive ? 'text-violet-650' : 'text-transparent'}`}>
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">{option.label}</span>
                    </div>

                    {/* Delete button if option is custom file */}
                    {option.isCustomFile && option.onRemove && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // Stop click from selecting option or closing dropdown
                          option.onRemove?.();
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-400 hover:text-rose-600 transition-colors"
                        title="Xoá bỏ mẫu này"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && (
        <span className="text-xs text-rose-500 font-medium mt-0.5">{error}</span>
      )}
    </div>
  );
};
