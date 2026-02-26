import React, { useState, useRef, useEffect } from 'react';
import { X, PlusCircle } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const availableOptions = options.filter(opt => !selected.includes(opt));

  const handleSelect = (option: string) => {
    onChange([...selected, option]);
    setIsOpen(false);
  };

  const handleRemove = (option: string) => {
    onChange(selected.filter(item => item !== option));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref]);

  return (
    <div ref={ref}>
      <label className="block text-sm font-medium text-slate-600 mb-2">{label}</label>
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-slate-200 min-h-[50px]">
        {selected.map(item => (
          <div key={item} className="flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
            <span>{item}</span>
            <button onClick={() => handleRemove(item)} className="hover:text-blue-600">
              <X size={14} />
            </button>
          </div>
        ))}
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-full transition-colors"
            title="Adicionar"
          >
            <PlusCircle size={20} />
          </button>
          {isOpen && availableOptions.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 z-10 overflow-hidden">
              {availableOptions.map(opt => (
                <button 
                  key={opt} 
                  onClick={() => handleSelect(opt)}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
