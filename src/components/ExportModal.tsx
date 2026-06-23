'use client';

import React, { useState } from 'react';
import { X, Download, FileText, Image as ImageIcon, Sliders } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: {
    format: 'png' | 'jpeg' | 'svg' | 'json';
    scope: 'all' | 'selected';
    multiplier: number;
    transparent: boolean;
  }) => void;
  hasSelection: boolean;
}

export default function ExportModal({ isOpen, onClose, onExport, hasSelection }: ExportModalProps) {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'svg' | 'json'>('png');
  const [scope, setScope] = useState<'all' | 'selected'>(hasSelection ? 'selected' : 'all');
  const [multiplier, setMultiplier] = useState<number>(2); // 2x default for retina quality
  const [transparent, setTransparent] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExportClick = () => {
    onExport({ format, scope, multiplier, transparent });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] max-w-md w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-brand-purple text-white p-4 border-b-4 border-black flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            <h3 className="text-md font-black uppercase tracking-wider">Export Design</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/20 neo-border-sm bg-white text-black cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5 text-sm">
          {/* Format */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Format</label>
            <div className="grid grid-cols-4 gap-2">
              {(['png', 'jpeg', 'svg', 'json'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFormat(f);
                    if (f === 'json' || f === 'jpeg') {
                      setTransparent(false);
                    }
                  }}
                  className={`py-2 px-1 neo-border-sm font-black text-xs uppercase cursor-pointer transition-all duration-100 ${
                    format === f
                      ? 'bg-brand-yellow text-black translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_#000]'
                      : 'bg-white hover:bg-zinc-50 text-black shadow-[2px_2px_0px_#000]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Scope (All vs Selected) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Export Area</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setScope('all')}
                className={`py-2 px-3 neo-border-sm font-black text-xs uppercase cursor-pointer transition-all duration-100 ${
                  scope === 'all'
                    ? 'bg-brand-green text-black translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_#000]'
                    : 'bg-white hover:bg-zinc-50 text-black shadow-[2px_2px_0px_#000]'
                }`}
              >
                Entire Board
              </button>
              <button
                onClick={() => setScope('selected')}
                disabled={!hasSelection}
                className={`py-2 px-3 neo-border-sm font-black text-xs uppercase transition-all duration-100 ${
                  !hasSelection
                    ? 'opacity-40 cursor-not-allowed bg-zinc-100 text-zinc-400 border-dashed'
                    : scope === 'selected'
                    ? 'bg-brand-green text-black translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_#000]'
                    : 'bg-white hover:bg-zinc-50 text-black shadow-[2px_2px_0px_#000] cursor-pointer'
                }`}
              >
                Selection Only
              </button>
            </div>
          </div>

          {/* Multiplier / Scale (raster only) */}
          {(format === 'png' || format === 'jpeg') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Resolution Scale</label>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMultiplier(m)}
                    className={`py-1.5 neo-border-sm font-black text-xs uppercase cursor-pointer transition-all duration-100 ${
                      multiplier === m
                        ? 'bg-brand-purple text-white translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_#000]'
                        : 'bg-white hover:bg-zinc-50 text-black shadow-[2px_2px_0px_#000]'
                    }`}
                  >
                    {m}x {m === 1 ? '(Standard)' : m === 2 ? '(Retina)' : '(Print)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transparency Option (PNG / SVG only) */}
          {(format === 'png' || format === 'svg') && (
            <div className="flex items-center gap-2 border-t-2 border-black/10 pt-3">
              <input
                id="transparency"
                type="checkbox"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
                className="w-4 h-4 accent-brand-purple cursor-pointer neo-border-sm"
              />
              <label htmlFor="transparency" className="text-xs font-black uppercase text-zinc-700 cursor-pointer">
                Transparent Background
              </label>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-zinc-50 p-4 border-t-2 border-black flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 neo-border-sm font-bold text-xs uppercase hover:bg-zinc-100 cursor-pointer bg-white"
          >
            Cancel
          </button>
          <button
            onClick={handleExportClick}
            className="flex-1 py-2 neo-btn neo-btn-green text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
