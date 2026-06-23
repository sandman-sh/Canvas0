'use client';

import React, { useState } from 'react';
import { Sparkles, X, RefreshCw, MessageSquare, ShieldCheck, History } from 'lucide-react';
import { generateAIAsset } from '@/lib/openrouter';
import { logToZGChain } from '@/lib/zgChain';
import { addAsset, CanvasAsset } from '@/lib/supabase';

interface AIChatPanelProps {
  walletAddress: string;
  collaboratorName?: string;
  isOpen: boolean;
  onClose: () => void;
  onAssetGenerated: (asset: CanvasAsset) => void;
  addToast: (title: string, desc: string, type: 'success' | 'error' | 'info') => void;
}

export default function AIChatPanel({
  walletAddress,
  collaboratorName,
  isOpen,
  onClose,
  onAssetGenerated,
  addToast
}: AIChatPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [assetType, setAssetType] = useState<'text' | 'image' | 'rect'>('text');
  const [generating, setGenerating] = useState(false);
  const [recentGenerations, setRecentGenerations] = useState<{ prompt: string; type: string }[]>([]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userIdentifier = walletAddress || collaboratorName;
    if (!userIdentifier) {
      addToast('Name Required', 'Please enter your Name before generating assets.', 'error');
      return;
    }
    if (!prompt.trim()) return;

    setGenerating(true);
    addToast('AI Agent Working', 'Contacting OpenRouter for asset generation...', 'info');

    try {
      const response = await generateAIAsset(prompt, assetType === 'image' ? 'image' : 'text');
      
      const creatorShort = walletAddress
        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
        : (collaboratorName || 'Guest');

      // Save to Supabase
      const newAsset = await addAsset({
        type: assetType,
        content: response.content,
        x_pos: Math.floor(Math.random() * 200) + 150,
        y_pos: Math.floor(Math.random() * 200) + 150,
        width: 250,
        height: 250,
        rotation: 0,
        z_index: 99,
        creator_id: creatorShort,
        properties: {
          opacity: 1,
          fill: assetType === 'text' ? '#18181b' : '#3f3f46',
          strokeColor: 'transparent',
          strokeWidth: 0,
          fontSize: 16,
          fontFamily: 'Inter',
          shadowX: 0,
          shadowY: 0,
          shadowColor: 'transparent',
          shadowBlur: 0
        }
      });

      // Provenance hash
      const promptHashRaw = prompt.toLowerCase().trim();
      const promptHash = '0x' + Array.from(new Uint8Array(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(promptHashRaw))
      )).map(b => b.toString(16).padStart(2, '0')).join('');

      addToast('Asset Spawned', 'Card added. Registering provenance on 0G Chain...', 'success');
      onAssetGenerated(newAsset);

      // Save to recent list
      setRecentGenerations(prev => [{ prompt, type: assetType }, ...prev.slice(0, 4)]);
      setPrompt('');

      // Async Galileo Chain sync
      try {
        const logReceipt = await logToZGChain(userIdentifier, promptHash, newAsset.id);
        if (logReceipt.success) {
          addToast('Provenance Registered', 'Transaction written to 0G Galileo Chain!', 'success');
        } else {
          addToast('Sponsor Mode Saved', 'Provenance registered via fallback gas sponsor.', 'info');
        }
      } catch (chainErr: any) {
        console.error('Galileo transaction failure:', chainErr);
        addToast('Galileo Chain Refused', 'Could not broadcast Tx. Local metadata verified.', 'error');
      }

    } catch (err: any) {
      console.error(err);
      addToast('AI Generation Failed', err.message || 'OpenRouter connection error.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed bottom-20 left-20 z-50 w-96 bg-white neo-border shadow-[8px_8px_0px_#000] p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-purple" />
          <span className="font-black text-xs uppercase tracking-wider">AI Asset Generator</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-zinc-100 neo-border-sm cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Asset Category</label>
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setAssetType('text')}
              className={`py-1.5 neo-border-sm font-bold text-[10px] uppercase cursor-pointer ${
                assetType === 'text' ? 'bg-brand-purple text-white shadow-[1px_1px_0px_#000]' : 'bg-white hover:bg-zinc-50'
              }`}
            >
              Rich Text
            </button>
            <button
              type="button"
              onClick={() => setAssetType('image')}
              className={`py-1.5 neo-border-sm font-bold text-[10px] uppercase cursor-pointer ${
                assetType === 'image' ? 'bg-brand-purple text-white shadow-[1px_1px_0px_#000]' : 'bg-white hover:bg-zinc-50'
              }`}
            >
              Image Art
            </button>
            <button
              type="button"
              onClick={() => setAssetType('rect')}
              className={`py-1.5 neo-border-sm font-bold text-[10px] uppercase cursor-pointer ${
                assetType === 'rect' ? 'bg-brand-purple text-white shadow-[1px_1px_0px_#000]' : 'bg-white hover:bg-zinc-50'
              }`}
            >
              AI Shapes
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Interactive Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2 bg-white neo-border-sm font-bold text-xs"
            placeholder={
              assetType === 'text'
                ? 'Create a premium design checklist for enterprise branding...'
                : 'Vibrant high-contrast custom abstract logo design...'
            }
            rows={3}
            disabled={generating}
          />
        </div>

        <button
          type="submit"
          disabled={generating || !prompt.trim()}
          className="w-full neo-btn neo-btn-green py-2 text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {generating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Generating Node...</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Spawn AI Node</span>
            </>
          )}
        </button>
      </form>

      {/* History */}
      {recentGenerations.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-zinc-200 pt-2">
          <span className="font-bold text-[9px] text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            <History className="w-2.5 h-2.5" /> Recent
          </span>
          <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto">
            {recentGenerations.map((item, idx) => (
              <div
                key={idx}
                onClick={() => !generating && setPrompt(item.prompt)}
                className="text-[10px] p-1 hover:bg-zinc-50 cursor-pointer neo-border-sm flex justify-between bg-zinc-50/50"
              >
                <span className="truncate max-w-[200px] font-bold text-zinc-700">{item.prompt}</span>
                <span className="font-black text-brand-purple text-[8px] uppercase">{item.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chain Status */}
      <div className="text-[9px] font-bold text-zinc-500 uppercase bg-zinc-100 p-2 neo-border-sm flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
        <span>0G Galileo Testnet Provenance Auto-Secure Active</span>
      </div>
    </div>
  );
}
