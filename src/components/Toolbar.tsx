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
  LayoutGrid,
  Rows3,
  Columns3,
  Crop,
  Download,
  Group,
  Ungroup,
  AlignVerticalJustifyCenter,
  Triangle,
  Spline,
} from 'lucide-react';

export type ToolType =
  | 'select'
  | 'hand'
  | 'frame'
  | 'container'
  | 'flexbox'
  | 'grid'
  | 'rect'
  | 'ellipse'
  | 'triangle'
  | 'star'
  | 'polygon'
  | 'line'
  | 'arrow'
  | 'curve'
  | 'text'
  | 'pen'
  | 'sticky'
  | 'comment'
  | 'eraser'
  | 'eyedropper'
  | 'crop'
  | 'image'
  | 'ai'
  | 'shader';

interface ToolbarProps {
  activeTool: ToolType;
  onChangeTool: (tool: ToolType) => void;
  onUploadClick: () => void;
  onAIClick: () => void;
  onExportClick: () => void;
  isAIChatOpen: boolean;
}

interface ToolItem {
  id: ToolType | '_upload' | '_ai' | '_export';
  label: string;
  shortcut: string;
  icon: React.ComponentType<any>;
  color?: string;
}

type ToolSection = {
  label: string;
  tools: ToolItem[];
};

export default function Toolbar({ activeTool, onChangeTool, onUploadClick, onAIClick, onExportClick, isAIChatOpen }: ToolbarProps) {
  const sections: ToolSection[] = [
    {
      label: 'Select',
      tools: [
        { id: 'select', label: 'Select', shortcut: 'V', icon: MousePointer2 },
        { id: 'hand', label: 'Hand / Pan', shortcut: 'H', icon: Hand },
      ],
    },
    {
      label: 'Layout',
      tools: [
        { id: 'frame', label: 'Frame', shortcut: 'F', icon: Frame },
        { id: 'container', label: 'Container', shortcut: 'D', icon: AlignVerticalJustifyCenter },
        { id: 'flexbox', label: 'Flexbox', shortcut: 'X', icon: Rows3 },
        { id: 'grid', label: 'Grid Layout', shortcut: 'Z', icon: LayoutGrid },
      ],
    },
    {
      label: 'Shapes',
      tools: [
        { id: 'rect', label: 'Rectangle', shortcut: 'R', icon: Square },
        { id: 'ellipse', label: 'Ellipse', shortcut: 'O', icon: Circle },
        { id: 'triangle', label: 'Triangle', shortcut: 'J', icon: Triangle },
        { id: 'star', label: 'Star', shortcut: 'G', icon: Star },
        { id: 'polygon', label: 'Polygon', shortcut: 'Y', icon: Hexagon },
        { id: 'line', label: 'Line', shortcut: 'L', icon: TrendingUp },
        { id: 'arrow', label: 'Arrow', shortcut: 'W', icon: ArrowUpRight },
        { id: 'curve', label: 'Curve', shortcut: 'Q', icon: Spline },
      ],
    },
    {
      label: 'Content',
      tools: [
        { id: 'text', label: 'Text', shortcut: 'T', icon: Type },
        { id: 'pen', label: 'Pen / Draw', shortcut: 'P', icon: PenTool },
        { id: 'sticky', label: 'Sticky Note', shortcut: 'N', icon: StickyNote },
        { id: 'comment', label: 'Comment', shortcut: 'K', icon: MessageSquare },
      ],
    },
    {
      label: 'Utility',
      tools: [
        { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: Eraser },
        { id: 'eyedropper', label: 'Eyedropper', shortcut: 'I', icon: Pipette },
        { id: 'crop', label: 'Crop / Mask', shortcut: 'M', icon: Crop },
      ],
    },
    {
      label: 'Media',
      tools: [
        { id: '_upload', label: 'Upload Image', shortcut: 'U', icon: Upload },
        { id: '_ai', label: 'AI Generator', shortcut: 'A', icon: Sparkles, color: 'purple' },
        { id: 'shader', label: 'Shader', shortcut: 'S', icon: Cpu },
        { id: '_export', label: 'Export', shortcut: '⇧E', icon: Download, color: 'green' },
      ],
    },
  ];

  const handleToolClick = (toolId: string) => {
    if (toolId === '_upload') {
      onUploadClick();
    } else if (toolId === '_ai') {
      onAIClick();
    } else if (toolId === '_export') {
      onExportClick();
    } else {
      onChangeTool(toolId as ToolType);
    }
  };

  const getButtonStyle = (tool: ToolItem) => {
    const isActive = activeTool === tool.id || (tool.id === '_ai' && isAIChatOpen);
    if (isActive) {
      return 'bg-brand-green text-black translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_#000]';
    }
    if (tool.color === 'purple') {
      return 'bg-brand-purple text-white hover:bg-opacity-90 shadow-[2px_2px_0px_#000]';
    }
    if (tool.color === 'green') {
      return 'bg-brand-green text-black hover:bg-opacity-90 shadow-[2px_2px_0px_#000]';
    }
    return 'bg-white hover:bg-zinc-100 text-black shadow-[2px_2px_0px_#000]';
  };

  return (
    <div className="flex flex-col gap-0 p-1.5 bg-white neo-border shadow-[4px_4px_0px_#000] items-center" style={{ width: '88px' }}>
      {sections.map((section, sIdx) => (
        <React.Fragment key={section.label}>
          {sIdx > 0 && <div className="w-full border-t-2 border-black my-1" />}
          {/* Section label */}
          <div className="text-[7px] font-black uppercase tracking-[0.1em] text-zinc-400 w-full text-center mb-0.5">
            {section.label}
          </div>
          {/* 2-column grid */}
          <div className="grid grid-cols-2 gap-0.5 w-full">
            {section.tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id)}
                  className={`group relative p-1.5 neo-border-sm cursor-pointer transition-all duration-100 flex items-center justify-center ${getButtonStyle(tool)}`}
                  title={`${tool.label} (${tool.shortcut})`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black text-white text-[9px] font-bold px-2 py-1 uppercase rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap neo-border-sm">
                    {tool.label} <span className="text-zinc-400 font-normal ml-1">[{tool.shortcut}]</span>
                  </span>
                </button>
              );
            })}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
