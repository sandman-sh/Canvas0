'use client';

import React from 'react';
import { CanvasAsset, ObjectProperties } from '@/lib/supabase';
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Type,
  Image as ImageIcon,
  Sliders,
  Cpu,
  Layers,
  Palette,
  Copy,
  Clipboard,
  ArrowUpToLine,
  ArrowDownToLine,
  Star,
  Frame,
  StickyNote,
  MessageSquare,
} from 'lucide-react';

interface InspectorProps {
  selectedAsset: CanvasAsset | null;
  assets: CanvasAsset[];
  onUpdateProperties: (updates: Partial<CanvasAsset>) => void;
  onDeleteAsset: (id: string) => void;
  onDuplicateAsset?: (asset: CanvasAsset) => void;
}

const fontFamilies = [
  'Inter', 'system-ui', 'Courier New', 'Georgia', 'Impact', 'Trebuchet MS'
];

const blendModes = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
  'color-dodge', 'color-burn', 'difference', 'exclusion'
];

const strokeDashPresets: { label: string; value: string; array: number[] | null }[] = [
  { label: 'Solid', value: 'solid', array: null },
  { label: 'Dashed', value: 'dashed', array: [6, 4] },
  { label: 'Dotted', value: 'dotted', array: [2, 2] },
  { label: 'Dash-Dot', value: 'dashdot', array: [10, 5, 2, 5] },
];

export default function Inspector({ selectedAsset, assets, onUpdateProperties, onDeleteAsset, onDuplicateAsset }: InspectorProps) {
  if (!selectedAsset) {
    return (
      <div className="w-80 bg-white neo-border shadow-[4px_4px_0px_#000] p-4 flex flex-col items-center justify-center text-center h-full">
        <Sliders className="w-8 h-8 text-zinc-400 mb-2" />
        <p className="font-bold text-sm uppercase tracking-wide">No selection</p>
        <p className="text-xs text-zinc-500 mt-1">Select an object on the canvas to inspect its properties.</p>
      </div>
    );
  }

  const props = selectedAsset.properties || {};

  const handlePropChange = (key: keyof ObjectProperties, value: any) => {
    onUpdateProperties({
      properties: {
        ...props,
        [key]: value
      }
    });
  };

  const handleMultiPropChange = (updates: Partial<ObjectProperties>) => {
    onUpdateProperties({
      properties: { ...props, ...updates }
    });
  };

  const handleBaseChange = (key: 'x_pos' | 'y_pos' | 'width' | 'height' | 'rotation' | 'z_index' | 'parent_id', value: any) => {
    onUpdateProperties({
      [key]: value
    });
  };

  const typeIcon = () => {
    switch (selectedAsset.type) {
      case 'frame': return <Frame className="w-3.5 h-3.5" />;
      case 'star': return <Star className="w-3.5 h-3.5" />;
      case 'sticky': return <StickyNote className="w-3.5 h-3.5" />;
      case 'comment': return <MessageSquare className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  const frames = assets.filter(a => a.type === 'frame' && a.id !== selectedAsset.id);

  return (
    <div className="w-80 bg-white neo-border shadow-[4px_4px_0px_#000] p-4 flex flex-col h-full overflow-y-auto gap-5 select-none scrollbar-none">
      {/* Title */}
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-brand-purple" />
          <span className="font-black text-xs uppercase tracking-wider">Inspector</span>
        </div>
        <span className="bg-brand-yellow neo-border-sm text-[9px] px-1.5 py-0.5 font-bold uppercase flex items-center gap-1">
          {typeIcon()}
          {selectedAsset.type}
        </span>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-1.5">
        <button
          onClick={() => handleBaseChange('z_index', selectedAsset.z_index + 10)}
          className="flex-1 py-1 px-1 bg-white hover:bg-zinc-100 neo-border-sm font-bold text-[9px] uppercase flex items-center justify-center gap-0.5 cursor-pointer"
          title="Bring to Front"
        >
          <ArrowUpToLine className="w-3 h-3" /> Front
        </button>
        <button
          onClick={() => handleBaseChange('z_index', Math.max(0, selectedAsset.z_index - 10))}
          className="flex-1 py-1 px-1 bg-white hover:bg-zinc-100 neo-border-sm font-bold text-[9px] uppercase flex items-center justify-center gap-0.5 cursor-pointer"
          title="Send to Back"
        >
          <ArrowDownToLine className="w-3 h-3" /> Back
        </button>
        <button
          onClick={() => handleBaseChange('z_index', selectedAsset.z_index + 1)}
          className="flex-1 py-1 px-1 bg-white hover:bg-zinc-100 neo-border-sm font-bold text-[9px] uppercase flex items-center justify-center gap-0.5 cursor-pointer"
        >
          <ChevronUp className="w-3 h-3" /> Up
        </button>
        <button
          onClick={() => handleBaseChange('z_index', Math.max(0, selectedAsset.z_index - 1))}
          className="flex-1 py-1 px-1 bg-white hover:bg-zinc-100 neo-border-sm font-bold text-[9px] uppercase flex items-center justify-center gap-0.5 cursor-pointer"
        >
          <ChevronDown className="w-3 h-3" /> Down
        </button>
      </div>
      <div className="flex gap-1.5">
        {onDuplicateAsset && (
          <button
            onClick={() => onDuplicateAsset(selectedAsset)}
            className="flex-1 py-1 px-2 bg-white hover:bg-zinc-100 neo-border-sm font-bold text-[9px] uppercase flex items-center justify-center gap-1 cursor-pointer"
          >
            <Copy className="w-3 h-3" /> Duplicate
          </button>
        )}
        <button
          onClick={() => onDeleteAsset(selectedAsset.id)}
          className="flex-1 py-1 px-2 bg-red-500 hover:bg-red-600 text-white neo-border-sm font-bold text-[9px] uppercase cursor-pointer"
        >
          Delete
        </button>
      </div>

      {/* Section: Transform */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
          <Layers className="w-3 h-3" /> Transform
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">X Position</label>
            <input
              type="number"
              value={Math.round(selectedAsset.x_pos)}
              onChange={(e) => handleBaseChange('x_pos', Number(e.target.value))}
              className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Y Position</label>
            <input
              type="number"
              value={Math.round(selectedAsset.y_pos)}
              onChange={(e) => handleBaseChange('y_pos', Number(e.target.value))}
              className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Width</label>
            <input
              type="number"
              value={Math.round(selectedAsset.width)}
              onChange={(e) => handleBaseChange('width', Math.max(1, Number(e.target.value)))}
              className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Height</label>
            <input
              type="number"
              value={Math.round(selectedAsset.height)}
              onChange={(e) => handleBaseChange('height', Math.max(1, Number(e.target.value)))}
              className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Rotation</label>
            <input
              type="number"
              min="0"
              max="360"
              value={Math.round(selectedAsset.rotation || 0)}
              onChange={(e) => handleBaseChange('rotation', Number(e.target.value))}
              className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs"
            />
          </div>
          {/* Corner Radius for rect/frame/sticky */}
          {(selectedAsset.type === 'rect' || selectedAsset.type === 'frame' || selectedAsset.type === 'sticky') && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Radius</label>
              <input
                type="number"
                min="0"
                max="200"
                value={props.cornerRadius || 0}
                onChange={(e) => handlePropChange('cornerRadius', Number(e.target.value))}
                className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Section: Constraints & Visibility */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest">Constraints</span>
        <div className="flex gap-1.5">
          <button
            onClick={() => handlePropChange('lockMovement', !props.lockMovement)}
            className={`flex-1 py-1 px-1.5 neo-border-sm font-bold text-[9px] uppercase flex items-center justify-center gap-0.5 cursor-pointer ${
              props.lockMovement ? 'bg-brand-purple text-white' : 'bg-white hover:bg-zinc-100'
            }`}
          >
            {props.lockMovement ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            {props.lockMovement ? 'Locked' : 'Lock'}
          </button>
          <button
            onClick={() => handlePropChange('lockAspectRatio', !props.lockAspectRatio)}
            className={`flex-1 py-1 px-1.5 neo-border-sm font-bold text-[9px] uppercase flex items-center justify-center cursor-pointer ${
              props.lockAspectRatio ? 'bg-brand-purple text-white' : 'bg-white hover:bg-zinc-100'
            }`}
          >
            Ratio
          </button>
          <button
            onClick={() => handlePropChange('hidden', !props.hidden)}
            className={`py-1 px-1.5 neo-border-sm font-bold text-[9px] uppercase flex items-center justify-center cursor-pointer ${
              props.hidden ? 'bg-brand-purple text-white' : 'bg-white hover:bg-zinc-100'
            }`}
          >
            {props.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Parent Frame Assignment */}
      {selectedAsset.type !== 'frame' && frames.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            <Frame className="w-3 h-3" /> Parent Frame
          </span>
          <select
            value={selectedAsset.parent_id || ''}
            onChange={(e) => handleBaseChange('parent_id', e.target.value || null)}
            className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs uppercase"
          >
            <option value="">None (Root)</option>
            {frames.map(f => (
              <option key={f.id} value={f.id}>{f.content || `Frame ${f.id.slice(0, 6)}`}</option>
            ))}
          </select>
        </div>
      )}

      {/* Section: Fill & Appearance */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
          <Palette className="w-3 h-3" /> Fill & Stroke
        </span>

        {/* Fill Color */}
        {(selectedAsset.type !== 'image') && (
          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Fill Color</label>
            <div className="flex gap-1.5">
              <input
                type="color"
                value={props.fill || '#000000'}
                onChange={(e) => handlePropChange('fill', e.target.value)}
                className="w-8 h-8 neo-border-sm cursor-pointer p-0 bg-transparent"
              />
              <input
                type="text"
                value={props.fill || '#000000'}
                onChange={(e) => handlePropChange('fill', e.target.value)}
                className="flex-1 px-2 py-1 bg-white neo-border-sm font-mono font-bold text-xs uppercase"
              />
            </div>
          </div>
        )}

        {/* Opacity */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Opacity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={props.opacity !== undefined ? props.opacity : 1}
            onChange={(e) => handlePropChange('opacity', Number(e.target.value))}
            className="w-full accent-brand-purple cursor-pointer"
          />
          <div className="text-right text-[10px] font-bold mt-0.5">
            {Math.round((props.opacity !== undefined ? props.opacity : 1) * 100)}%
          </div>
        </div>

        {/* Blend Mode */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Blend Mode</label>
          <select
            value={props.blendMode || 'normal'}
            onChange={(e) => handlePropChange('blendMode', e.target.value)}
            className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs uppercase"
          >
            {blendModes.map((mode) => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
        </div>

        {/* Stroke / Border */}
        {selectedAsset.type !== 'image' && (
          <div className="flex flex-col gap-2 mt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Stroke W</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={props.strokeWidth !== undefined ? props.strokeWidth : 0}
                  onChange={(e) => handlePropChange('strokeWidth', Number(e.target.value))}
                  className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Stroke Color</label>
                <input
                  type="color"
                  value={props.strokeColor && props.strokeColor !== 'transparent' ? props.strokeColor : '#cccccc'}
                  onChange={(e) => handlePropChange('strokeColor', e.target.value)}
                  className="w-full h-8 neo-border-sm cursor-pointer p-0 bg-transparent"
                />
              </div>
            </div>
            {/* Stroke Dash Pattern */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Stroke Style</label>
              <select
                value={props.strokeDashPreset || 'solid'}
                onChange={(e) => {
                  const preset = strokeDashPresets.find(p => p.value === e.target.value);
                  handleMultiPropChange({
                    strokeDashPreset: e.target.value,
                    strokeDashArray: preset?.array || undefined,
                  });
                }}
                className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs uppercase"
              >
                {strokeDashPresets.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Shadows */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest">Drop Shadows</span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Offset X</label>
            <input
              type="number"
              value={props.shadowX !== undefined ? props.shadowX : 0}
              onChange={(e) => handlePropChange('shadowX', Number(e.target.value))}
              className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Offset Y</label>
            <input
              type="number"
              value={props.shadowY !== undefined ? props.shadowY : 0}
              onChange={(e) => handlePropChange('shadowY', Number(e.target.value))}
              className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Blur</label>
            <input
              type="number"
              min="0"
              max="50"
              value={props.shadowBlur !== undefined ? props.shadowBlur : 0}
              onChange={(e) => handlePropChange('shadowBlur', Number(e.target.value))}
              className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Shadow Color</label>
            <input
              type="color"
              value={props.shadowColor && props.shadowColor !== 'transparent' ? props.shadowColor : '#000000'}
              onChange={(e) => handlePropChange('shadowColor', e.target.value)}
              className="w-full h-8 neo-border-sm cursor-pointer p-0 bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* CONTEXTUAL: Frame Settings */}
      {selectedAsset.type === 'frame' && (
        <div className="border-t-2 border-black pt-4 flex flex-col gap-3">
          <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            <Frame className="w-3.5 h-3.5" /> Frame Settings
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePropChange('clipContent', !props.clipContent)}
              className={`flex-1 py-1.5 neo-border-sm font-bold text-[9px] uppercase cursor-pointer ${
                props.clipContent ? 'bg-brand-purple text-white' : 'bg-white hover:bg-zinc-50'
              }`}
            >
              {props.clipContent ? 'Clip ON (Overflow Hidden)' : 'Clip OFF (Overflow Visible)'}
            </button>
          </div>
          {/* Show children count */}
          <div className="text-[10px] font-bold text-zinc-500 uppercase">
            Children: {assets.filter(a => a.parent_id === selectedAsset.id).length} elements
          </div>
        </div>
      )}

      {/* CONTEXTUAL: Star Properties */}
      {selectedAsset.type === 'star' && (
        <div className="border-t-2 border-black pt-4 flex flex-col gap-3">
          <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            <Star className="w-3.5 h-3.5" /> Star Settings
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Points</label>
              <input
                type="number"
                min="3"
                max="12"
                value={props.starPoints || 5}
                onChange={(e) => handlePropChange('starPoints', Number(e.target.value))}
                className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Inner Ratio</label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={props.starInnerRadius || 0.4}
                onChange={(e) => handlePropChange('starInnerRadius', Number(e.target.value))}
                className="w-full accent-brand-purple cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* CONTEXTUAL: Arrow Properties */}
      {selectedAsset.type === 'arrow' && (
        <div className="border-t-2 border-black pt-4 flex flex-col gap-3">
          <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest">Arrow Settings</span>
          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Arrow Head</label>
            <div className="grid grid-cols-3 gap-1">
              {(['one', 'both', 'none'] as const).map(headType => (
                <button
                  key={headType}
                  onClick={() => handlePropChange('arrowHead', headType)}
                  className={`py-1 neo-border-sm font-bold text-[9px] uppercase cursor-pointer ${
                    props.arrowHead === headType ? 'bg-brand-purple text-white' : 'bg-white hover:bg-zinc-50'
                  }`}
                >
                  {headType === 'one' ? '→' : headType === 'both' ? '↔' : '—'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONTEXTUAL: Text Properties */}
      {(selectedAsset.type === 'text' || selectedAsset.type === 'sticky') && (
        <div className="border-t-2 border-black pt-4 flex flex-col gap-3">
          <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            <Type className="w-3.5 h-3.5" /> Text Settings
          </span>

          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Font Family</label>
            <select
              value={props.fontFamily || 'Inter'}
              onChange={(e) => handlePropChange('fontFamily', e.target.value)}
              className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs"
            >
              {fontFamilies.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Font Size</label>
              <input
                type="number"
                min="8"
                max="120"
                value={props.fontSize || 16}
                onChange={(e) => handlePropChange('fontSize', Number(e.target.value))}
                className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Font Weight</label>
              <select
                value={props.fontWeight || 'normal'}
                onChange={(e) => handlePropChange('fontWeight', e.target.value)}
                className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs uppercase"
              >
                <option value="normal">Regular</option>
                <option value="bold">Bold</option>
                <option value="900">Black</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {['left', 'center', 'right'].map(align => (
              <button
                key={align}
                onClick={() => handlePropChange('textAlign', align)}
                className={`py-1 neo-border-sm font-bold text-[9px] uppercase cursor-pointer ${
                  (props.textAlign || 'left') === align ? 'bg-brand-purple text-white' : 'bg-white hover:bg-zinc-50'
                }`}
              >
                {align}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CONTEXTUAL: Sticky Note */}
      {selectedAsset.type === 'sticky' && (
        <div className="flex flex-col gap-2">
          <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            <StickyNote className="w-3.5 h-3.5" /> Sticky Color
          </span>
          <div className="flex gap-1">
            {['#FFD60A', '#FF9CAD', '#A7F3D0', '#93C5FD', '#C4B5FD', '#FED7AA'].map(color => (
              <button
                key={color}
                onClick={() => handleMultiPropChange({ fill: color, stickyColor: color })}
                className={`w-8 h-8 neo-border-sm cursor-pointer ${props.stickyColor === color ? 'ring-2 ring-black ring-offset-1' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}

      {/* CONTEXTUAL: Comment */}
      {selectedAsset.type === 'comment' && (
        <div className="border-t-2 border-black pt-4 flex flex-col gap-3">
          <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> Comment
          </span>
          <textarea
            rows={3}
            value={props.commentText || ''}
            onChange={(e) => handlePropChange('commentText', e.target.value)}
            className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs"
            placeholder="Write a comment..."
          />
          <div className="text-[10px] font-bold text-zinc-400 uppercase">
            By: {props.commentAuthor || 'Unknown'}
          </div>
        </div>
      )}

      {/* CONTEXTUAL: Image & Upload Adjustments */}
      {selectedAsset.type === 'image' && (
        <div className="border-t-2 border-black pt-4 flex flex-col gap-3">
          <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" /> Image Settings
          </span>

          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Filters</label>
            <div className="flex flex-col gap-2 text-xs">
              <div>
                <div className="flex justify-between font-bold text-[10px]">
                  <span>BRIGHTNESS</span>
                  <span>{props.brightness !== undefined ? props.brightness : 100}%</span>
                </div>
                <input
                  type="range" min="0" max="200"
                  value={props.brightness !== undefined ? props.brightness : 100}
                  onChange={(e) => handlePropChange('brightness', Number(e.target.value))}
                  className="w-full accent-brand-purple cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between font-bold text-[10px]">
                  <span>CONTRAST</span>
                  <span>{props.contrast !== undefined ? props.contrast : 100}%</span>
                </div>
                <input
                  type="range" min="0" max="200"
                  value={props.contrast !== undefined ? props.contrast : 100}
                  onChange={(e) => handlePropChange('contrast', Number(e.target.value))}
                  className="w-full accent-brand-purple cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between font-bold text-[10px]">
                  <span>SATURATION</span>
                  <span>{props.saturation !== undefined ? props.saturation : 100}%</span>
                </div>
                <input
                  type="range" min="0" max="200"
                  value={props.saturation !== undefined ? props.saturation : 100}
                  onChange={(e) => handlePropChange('saturation', Number(e.target.value))}
                  className="w-full accent-brand-purple cursor-pointer"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => handlePropChange('grayscale', !props.grayscale)}
                  className={`py-1 neo-border-sm font-bold text-[9px] uppercase cursor-pointer ${
                    props.grayscale ? 'bg-brand-purple text-white' : 'bg-white'
                  }`}
                >
                  Grayscale
                </button>
                <button
                  onClick={() => handlePropChange('invert', !props.invert)}
                  className={`py-1 neo-border-sm font-bold text-[9px] uppercase cursor-pointer ${
                    props.invert ? 'bg-brand-purple text-white' : 'bg-white'
                  }`}
                >
                  Invert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEXTUAL: Shader Properties */}
      {selectedAsset.type === 'shader' && (
        <div className="border-t-2 border-black pt-4 flex flex-col gap-3">
          <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" /> Shader Code
          </span>

          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Shader Type</label>
            <select
              value={props.shaderType || 'fragment'}
              onChange={(e) => handlePropChange('shaderType', e.target.value)}
              className="w-full px-2 py-1 bg-white neo-border-sm font-bold text-xs"
            >
              <option value="fragment">Fragment Shader (GLSL)</option>
              <option value="vertex">Vertex Shader (GLSL)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">GLSL Source</label>
            <textarea
              rows={6}
              value={props.shaderSource || ''}
              onChange={(e) => handlePropChange('shaderSource', e.target.value)}
              className="w-full px-2 py-1 bg-zinc-900 text-brand-green font-mono text-[10px] neo-border-sm h-36"
              placeholder="void main() { ... }"
            />
          </div>
        </div>
      )}
    </div>
  );
}
