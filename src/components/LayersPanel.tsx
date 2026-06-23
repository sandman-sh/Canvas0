'use client';

import React, { useMemo } from 'react';
import { CanvasAsset } from '@/lib/supabase';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronRight,
  ChevronDown,
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  PenTool,
  Cpu,
  Frame,
  Star,
  ArrowUpRight,
  StickyNote,
  MessageSquare,
  TrendingUp,
  Hexagon,
} from 'lucide-react';

interface LayersPanelProps {
  assets: CanvasAsset[];
  selectedAsset: CanvasAsset | null;
  onSelectAsset: (asset: CanvasAsset | null) => void;
  onUpdateAsset: (id: string, updates: Partial<CanvasAsset>) => void;
}

function getTypeIcon(type: string) {
  const cls = "w-3.5 h-3.5 flex-shrink-0";
  switch (type) {
    case 'rect': return <Square className={cls} />;
    case 'ellipse': return <Circle className={cls} />;
    case 'text': return <Type className={cls} />;
    case 'image': return <ImageIcon className={cls} />;
    case 'path': return <Hexagon className={cls} />;
    case 'line': return <TrendingUp className={cls} />;
    case 'shader': return <Cpu className={cls} />;
    case 'frame': return <Frame className={cls} />;
    case 'star': return <Star className={cls} />;
    case 'arrow': return <ArrowUpRight className={cls} />;
    case 'sticky': return <StickyNote className={cls} />;
    case 'comment': return <MessageSquare className={cls} />;
    default: return <PenTool className={cls} />;
  }
}

function getAssetLabel(asset: CanvasAsset): string {
  if (asset.content && asset.content.length > 0) {
    return asset.content.slice(0, 20);
  }
  return `${asset.type} ${asset.id.slice(0, 6)}`;
}

interface TreeNode {
  asset: CanvasAsset;
  children: TreeNode[];
}

export default function LayersPanel({ assets, selectedAsset, onSelectAsset, onUpdateAsset }: LayersPanelProps) {
  const [collapsedFrames, setCollapsedFrames] = React.useState<Set<string>>(new Set());

  // Build tree: root nodes + frame children
  const tree = useMemo(() => {
    const sorted = [...assets].sort((a, b) => (b.z_index || 0) - (a.z_index || 0));
    const childMap = new Map<string, CanvasAsset[]>();
    const roots: CanvasAsset[] = [];

    sorted.forEach(asset => {
      if (asset.parent_id) {
        const existing = childMap.get(asset.parent_id) || [];
        existing.push(asset);
        childMap.set(asset.parent_id, existing);
      } else {
        roots.push(asset);
      }
    });

    const buildNode = (asset: CanvasAsset): TreeNode => ({
      asset,
      children: (childMap.get(asset.id) || []).map(buildNode),
    });

    return roots.map(buildNode);
  }, [assets]);

  const toggleCollapse = (id: string) => {
    setCollapsedFrames(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDrop = (e: React.DragEvent, targetAsset: CanvasAsset) => {
    e.preventDefault();
    const dragId = e.dataTransfer.getData('text/plain');
    if (!dragId || dragId === targetAsset.id) return;

    if (targetAsset.type === 'frame') {
      // Nest inside frame
      onUpdateAsset(dragId, { parent_id: targetAsset.id } as any);
    } else {
      // Reorder: swap z_index
      const dragAsset = assets.find(a => a.id === dragId);
      if (dragAsset) {
        onUpdateAsset(dragId, { z_index: targetAsset.z_index });
        onUpdateAsset(targetAsset.id, { z_index: dragAsset.z_index });
      }
    }
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const { asset, children } = node;
    const isSelected = selectedAsset?.id === asset.id;
    const isFrame = asset.type === 'frame';
    const isCollapsed = collapsedFrames.has(asset.id);
    const props = asset.properties || {};

    return (
      <div key={asset.id}>
        <div
          className={`flex items-center gap-1 px-2 py-1 cursor-pointer transition-colors text-[11px] group ${
            isSelected
              ? 'bg-brand-purple text-white'
              : 'hover:bg-zinc-100'
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => onSelectAsset(asset)}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', asset.id);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, asset)}
        >
          {/* Expand/collapse for frames */}
          {isFrame && children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(asset.id);
              }}
              className="p-0 w-4 h-4 flex items-center justify-center flex-shrink-0"
            >
              {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          ) : (
            <span className="w-4 flex-shrink-0" />
          )}

          {/* Type icon */}
          {getTypeIcon(asset.type)}

          {/* Label */}
          <span className="flex-1 truncate font-bold">
            {getAssetLabel(asset)}
          </span>

          {/* Quick toggles (visible on hover) */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateAsset(asset.id, {
                  properties: { ...props, hidden: !props.hidden }
                });
              }}
              className="p-0.5 rounded"
              title={props.hidden ? 'Show' : 'Hide'}
            >
              {props.hidden
                ? <EyeOff className="w-3 h-3 text-zinc-400" />
                : <Eye className="w-3 h-3" />
              }
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateAsset(asset.id, {
                  properties: { ...props, lockMovement: !props.lockMovement }
                });
              }}
              className="p-0.5 rounded"
              title={props.lockMovement ? 'Unlock' : 'Lock'}
            >
              {props.lockMovement
                ? <Lock className="w-3 h-3 text-zinc-400" />
                : <Unlock className="w-3 h-3" />
              }
            </button>
          </div>
        </div>

        {/* Children */}
        {isFrame && !isCollapsed && children.length > 0 && (
          <div className="border-l border-zinc-300" style={{ marginLeft: `${16 + depth * 16}px` }}>
            {children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-56 bg-white neo-border shadow-[4px_4px_0px_#000] flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b-2 border-black bg-white">
        <Layers className="w-4 h-4 text-brand-purple" />
        <span className="font-black text-xs uppercase tracking-wider">Layers</span>
        <span className="ml-auto bg-brand-green neo-border-sm text-[9px] px-1.5 py-0.5 font-bold">
          {assets.length}
        </span>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Layers className="w-6 h-6 text-zinc-300 mb-2" />
            <p className="text-[10px] font-bold text-zinc-400 uppercase">No layers yet</p>
          </div>
        ) : (
          tree.map(node => renderNode(node))
        )}
      </div>
    </div>
  );
}
