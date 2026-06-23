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
  Hexagon,
  Frame,
  Star,
  ArrowUpRight,
  Eraser,
  Pipette,
  StickyNote,
  MessageSquare,
} from 'lucide-react';

export type ToolType =
  | 'select'
  | 'hand'
  | 'frame'
  | 'rect'
  | 'ellipse'
  | 'star'
  | 'polygon'
  | 'line'
  | 'arrow'
  | 'text'
  | 'pen'
  | 'sticky'
  | 'comment'
  | 'eraser'
  | 'eyedropper'
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

type ToolSection = {
  label: string;
  tools: ToolItem[];
};

export default function Toolbar({ activeTool, onChangeTool, onUploadClick, onAIClick, isAIChatOpen }: ToolbarProps) {
  const sections: ToolSection[] = [
    {
      label: 'Navigate',
      tools: [
        { id: 'select', label: 'Select', shortcut: 'V', icon: MousePointer2 },
        { id: 'hand', label: 'Hand / Pan', shortcut: 'H', icon: Hand },
      ],
    },
    {
      label: 'Shapes',
      tools: [
        { id: 'frame', label: 'Frame', shortcut: 'F', icon: Frame },
        { id: 'rect', label: 'Rectangle', shortcut: 'R', icon: Square },
        { id: 'ellipse', label: 'Ellipse', shortcut: 'O', icon: Circle },
        { id: 'star', label: 'Star', shortcut: 'G', icon: Star },
        { id: 'polygon', label: 'Polygon', shortcut: 'Y', icon: Hexagon },
        { id: 'line', label: 'Line', shortcut: 'L', icon: TrendingUp },
        { id: 'arrow', label: 'Arrow', shortcut: 'W', icon: ArrowUpRight },
      ],
    },
    {
      label: 'Content',
      tools: [
        { id: 'text', label: 'Text', shortcut: 'T', icon: Type },
        { id: 'pen', label: 'Pen / Freehand', shortcut: 'P', icon: PenTool },
        { id: 'sticky', label: 'Sticky Note', shortcut: 'N', icon: StickyNote },
        { id: 'comment', label: 'Comment', shortcut: 'K', icon: MessageSquare },
      ],
    },
    {
      label: 'Utilities',
      tools: [
        { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: Eraser },
        { id: 'eyedropper', label: 'Eyedropper', shortcut: 'I', icon: Pipette },
      ],
    },
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
    <div className="flex flex-col gap-0 p-2 bg-white neo-border shadow-[4px_4px_0px_#000] w-14 items-center">
      {sections.map((section, sIdx) => (
        <React.Fragment key={section.label}>
          {sIdx > 0 && <div className="w-full border-t-2 border-black my-1" />}
          {section.tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className={`group relative p-2 neo-border-sm cursor-pointer transition-all duration-150 mb-1 ${
                  isActive
                    ? 'bg-brand-green text-black translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_#000]'
                    : 'bg-white hover:bg-zinc-100 text-black shadow-[2px_2px_0px_#000]'
                }`}
                title={`${tool.label} (${tool.shortcut})`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap neo-border-sm">
                  {tool.label} <span className="text-zinc-400 font-normal ml-1">[{tool.shortcut}]</span>
                </span>
              </button>
            );
          })}
        </React.Fragment>
      ))}

      <div className="w-full border-t-2 border-black my-1" />

      {/* Media Upload */}
      <button
        onClick={() => onUploadClick()}
        className="group relative p-2 bg-white hover:bg-zinc-100 text-black neo-border-sm cursor-pointer shadow-[2px_2px_0px_#000] transition-all mb-1"
        title="Upload Image (U)"
      >
        <Upload className="w-4.5 h-4.5" />
        <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap neo-border-sm">
          Upload Image <span className="text-zinc-400 font-normal ml-1">[U]</span>
        </span>
      </button>

      {/* AI Assistant */}
      <button
        onClick={() => onAIClick()}
        className={`group relative p-2 neo-border-sm cursor-pointer transition-all duration-150 mb-1 ${
          isAIChatOpen
            ? 'bg-brand-green text-black translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_#000]'
            : 'bg-brand-purple text-white hover:bg-opacity-95 shadow-[2px_2px_0px_#000]'
        }`}
        title="AI Generator (A)"
      >
        <Sparkles className="w-4.5 h-4.5" />
        <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap neo-border-sm">
          AI Generator <span className="text-zinc-400 font-normal ml-1">[A]</span>
        </span>
      </button>

      {/* Shader Node */}
      <button
        onClick={() => onChangeTool('shader')}
        className={`group relative p-2 neo-border-sm cursor-pointer transition-all duration-150 mb-1 ${
          activeTool === 'shader'
            ? 'bg-brand-green text-black translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_#000]'
            : 'bg-white hover:bg-zinc-100 text-black shadow-[2px_2px_0px_#000]'
        }`}
        title="WebGL Shader Node (S)"
      >
        <Cpu className="w-4.5 h-4.5" />
        <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap neo-border-sm">
          WebGL Shader <span className="text-zinc-400 font-normal ml-1">[S]</span>
        </span>
      </button>
    </div>
  );
}
