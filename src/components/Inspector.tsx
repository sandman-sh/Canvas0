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
  Palette
} from 'lucide-react';

interface InspectorProps {
  selectedAsset: CanvasAsset | null;
  onUpdateProperties: (updates: Partial<CanvasAsset>) => void;
  onDeleteAsset: (id: string) => void;
}

const fontFamilies = [
  'Inter',
  'system-ui',
  'Courier New',
  'Georgia',
  'Impact',
  'Trebuchet MS'
];

const blendModes = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'difference',
  'exclusion'
];

export default function Inspector({ selectedAsset, onUpdateProperties, onDeleteAsset }: InspectorProps) {
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

  const handleBaseChange = (key: 'x_pos' | 'y_pos' | 'width' | 'height' | 'rotation' | 'z_index', value: any) => {
    onUpdateProperties({
      [key]: value
    });
  };

  return (
    <div className="w-80 bg-white neo-border shadow-[4px_4px_0px_#000] p-4 flex flex-col h-full overflow-y-auto gap-6 select-none">
      {/* Title */}
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-brand-purple" />
          <span className="font-black text-xs uppercase tracking-wider">Inspector</span>
        </div>
        <span className="bg-brand-yellow neo-border-sm text-[9px] px-1.5 py-0.5 font-bold uppercase">
          {selectedAsset.type}
        </span>
      </div>

      {/* Layering & Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => handleBaseChange('z_index', selectedAsset.z_index + 1)}
          className="flex-1 py-1 px-2 bg-white hover:bg-zinc-100 neo-border-sm font-bold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer"
          title="Bring Forward"
        >
          <ChevronUp className="w-3 h-3" /> Up
        </button>
        <button
          onClick={() => handleBaseChange('z_index', Math.max(0, selectedAsset.z_index - 1))}
          className="flex-1 py-1 px-2 bg-white hover:bg-zinc-100 neo-border-sm font-bold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer"
          title="Send Backward"
        >
          <ChevronDown className="w-3 h-3" /> Down
        </button>
        <button
          onClick={() => onDeleteAsset(selectedAsset.id)}
          className="py-1 px-3 bg-red-500 hover:bg-red-600 text-white neo-border-sm font-bold text-[10px] uppercase cursor-pointer"
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
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Rotation (deg)</label>
            <input
              type="range"
              min="0"
              max="360"
              value={Math.round(selectedAsset.rotation || 0)}
              onChange={(e) => handleBaseChange('rotation', Number(e.target.value))}
              className="w-full accent-brand-purple cursor-pointer"
            />
            <div className="text-right text-[10px] font-bold mt-0.5">{Math.round(selectedAsset.rotation || 0)}°</div>
          </div>
        </div>
      </div>

      {/* Section: Constraints & Visibility */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest">Constraints</span>
        <div className="flex gap-2">
          <button
            onClick={() => handlePropChange('lockMovement', !props.lockMovement)}
            className={`flex-1 py-1 px-2 neo-border-sm font-bold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer ${
              props.lockMovement ? 'bg-brand-purple text-white' : 'bg-white hover:bg-zinc-100'
            }`}
          >
            {props.lockMovement ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            {props.lockMovement ? 'Locked' : 'Lock Mov'}
          </button>
          <button
            onClick={() => handlePropChange('lockAspectRatio', !props.lockAspectRatio)}
            className={`flex-1 py-1 px-2 neo-border-sm font-bold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer ${
              props.lockAspectRatio ? 'bg-brand-purple text-white' : 'bg-white hover:bg-zinc-100'
            }`}
          >
            Aspect Ratio
          </button>
          <button
            onClick={() => handlePropChange('hidden', !props.hidden)}
            className={`py-1 px-2 neo-border-sm font-bold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer ${
              props.hidden ? 'bg-brand-purple text-white' : 'bg-white hover:bg-zinc-100'
            }`}
          >
            {props.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Section: Fill & Appearance */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
          <Palette className="w-3 h-3" /> Fill & Stroke
        </span>

        {/* Fill Color */}
        {(selectedAsset.type === 'rect' || selectedAsset.type === 'ellipse' || selectedAsset.type === 'text' || selectedAsset.type === 'path') && (
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
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        {/* Stroke / Border */}
        {selectedAsset.type !== 'image' && (
          <div className="flex flex-col gap-2 mt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Stroke Width</label>
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
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Blur Radius</label>
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

      {/* CONTEXTUAL Section: Text Properties */}
      {selectedAsset.type === 'text' && (
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
                <option key={font} value={font}>
                  {font}
                </option>
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
            <button
              onClick={() => handlePropChange('textAlign', 'left')}
              className={`py-1 neo-border-sm font-bold text-[9px] uppercase cursor-pointer ${
                props.textAlign === 'left' || !props.textAlign ? 'bg-brand-purple text-white' : 'bg-white hover:bg-zinc-50'
              }`}
            >
              Left
            </button>
            <button
              onClick={() => handlePropChange('textAlign', 'center')}
              className={`py-1 neo-border-sm font-bold text-[9px] uppercase cursor-pointer ${
                props.textAlign === 'center' ? 'bg-brand-purple text-white' : 'bg-white hover:bg-zinc-50'
              }`}
            >
              Center
            </button>
            <button
              onClick={() => handlePropChange('textAlign', 'right')}
              className={`py-1 neo-border-sm font-bold text-[9px] uppercase cursor-pointer ${
                props.textAlign === 'right' ? 'bg-brand-purple text-white' : 'bg-white hover:bg-zinc-50'
              }`}
            >
              Right
            </button>
          </div>
        </div>
      )}

      {/* CONTEXTUAL Section: Image & Upload Adjustments */}
      {selectedAsset.type === 'image' && (
        <div className="border-t-2 border-black pt-4 flex flex-col gap-3">
          <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" /> Image Settings
          </span>

          <div>
            <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Filters</label>
            <div className="flex flex-col gap-2 text-xs">
              {/* Brightness */}
              <div>
                <div className="flex justify-between font-bold text-[10px]">
                  <span>BRIGHTNESS</span>
                  <span>{props.brightness !== undefined ? props.brightness : 100}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={props.brightness !== undefined ? props.brightness : 100}
                  onChange={(e) => handlePropChange('brightness', Number(e.target.value))}
                  className="w-full accent-brand-purple cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between font-bold text-[10px]">
                  <span>CONTRAST</span>
                  <span>{props.contrast !== undefined ? props.contrast : 100}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={props.contrast !== undefined ? props.contrast : 100}
                  onChange={(e) => handlePropChange('contrast', Number(e.target.value))}
                  className="w-full accent-brand-purple cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div>
                <div className="flex justify-between font-bold text-[10px]">
                  <span>SATURATION</span>
                  <span>{props.saturation !== undefined ? props.saturation : 100}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={props.saturation !== undefined ? props.saturation : 100}
                  onChange={(e) => handlePropChange('saturation', Number(e.target.value))}
                  className="w-full accent-brand-purple cursor-pointer"
                />
              </div>

              {/* Toggles */}
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

      {/* CONTEXTUAL Section: Shader Properties */}
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
