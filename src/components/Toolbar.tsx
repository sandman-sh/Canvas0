'use client';

import React from 'react';
import {
  MousePointer2,
  Hand,
  Square,
  Circle,
  TrendingUp,
  Type,
  PenTool,
  Upload,
  Sparkles,
  Cpu,
  Hexagon
} from 'lucide-react';

export type ToolType =
  | 'select'
  | 'hand'
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'polygon'
  | 'text'
  | 'pen'
  | 'image'
  | 'ai'
  | 'shader';

interface ToolbarProps {
  activeTool: ToolType;
  onChangeTool: (tool: ToolType) => void;
  onUploadClick: () => void;
  onAIClick: () => void;
  isAIChatOpen: boolean;
}

interface ToolItem {
  id: ToolType;
  label: string;
  shortcut: string;
  icon: React.ComponentType<any>;
}

export default function Toolbar({ activeTool, onChangeTool, onUploadClick, onAIClick, isAIChatOpen }: ToolbarProps) {
  const tools: ToolItem[] = [
    { id: 'select', label: 'Select', shortcut: 'V', icon: MousePointer2 },
    { id: 'hand', label: 'Hand / Pan', shortcut: 'H', icon: Hand },
    { id: 'rect', label: 'Rectangle', shortcut: 'R', icon: Square },
    { id: 'ellipse', label: 'Ellipse', shortcut: 'O', icon: Circle },
    { id: 'polygon', label: 'Polygon', shortcut: 'Y', icon: Hexagon },
    { id: 'line', label: 'Line', shortcut: 'L', icon: TrendingUp },
    { id: 'text', label: 'Text', shortcut: 'T', icon: Type },
    { id: 'pen', label: 'Pen / Freehand', shortcut: 'P', icon: PenTool },
  ];

  const handleToolClick = (toolId: ToolType) => {
    if (toolId === 'image') {
      onUploadClick();
    } else if (toolId === 'ai') {
      onAIClick();
    } else {
      onChangeTool(toolId);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-white neo-border shadow-[4px_4px_0px_#000] w-14 items-center">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            className={`group relative p-2.5 neo-border-sm cursor-pointer transition-all duration-150 ${
              isActive
                ? 'bg-brand-green text-black translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_#000]'
                : 'bg-white hover:bg-zinc-100 text-black shadow-[2px_2px_0px_#000]'
            }`}
            title={`${tool.label} (${tool.shortcut})`}
          >
            <Icon className="w-5 h-5" />
            <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap neo-border-sm">
              {tool.label} <span className="text-zinc-400 font-normal ml-1">[{tool.shortcut}]</span>
            </span>
          </button>
        );
      })}

      <div className="w-full border-t-2 border-black my-1" />

      {/* Media Upload */}
      <button
        onClick={() => onUploadClick()}
        className="group relative p-2.5 bg-white hover:bg-zinc-100 text-black neo-border-sm cursor-pointer shadow-[2px_2px_0px_#000] transition-all"
        title="Upload Image (U)"
      >
        <Upload className="w-5 h-5" />
        <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap neo-border-sm">
          Upload Image <span className="text-zinc-400 font-normal ml-1">[U]</span>
        </span>
      </button>

      {/* AI Assistant */}
      <button
        onClick={() => onAIClick()}
        className={`group relative p-2.5 neo-border-sm cursor-pointer transition-all duration-150 ${
          isAIChatOpen
            ? 'bg-brand-green text-black translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_#000]'
            : 'bg-brand-purple text-white hover:bg-opacity-95 shadow-[2px_2px_0px_#000]'
        }`}
        title="AI Generator (A)"
      >
        <Sparkles className="w-5 h-5" />
        <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap neo-border-sm">
          AI Generator <span className="text-zinc-400 font-normal ml-1">[A]</span>
        </span>
      </button>

      {/* Shader Node */}
      <button
        onClick={() => onChangeTool('shader')}
        className={`group relative p-2.5 neo-border-sm cursor-pointer transition-all duration-150 ${
          activeTool === 'shader'
            ? 'bg-brand-green text-black translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_#000]'
            : 'bg-white hover:bg-zinc-100 text-black shadow-[2px_2px_0px_#000]'
        }`}
        title="WebGL Shader Node (S)"
      >
        <Cpu className="w-5 h-5" />
        <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap neo-border-sm">
          WebGL Shader <span className="text-zinc-400 font-normal ml-1">[S]</span>
        </span>
      </button>
    </div>
  );
}
