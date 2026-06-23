'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Play, Sparkles, Database, Cpu, Wallet, Layers, ArrowRight, ShieldCheck, X, RefreshCw, Users } from 'lucide-react';
import { connectBrowserWallet, hasWalletProvider } from '@/lib/wallet';

export default function Home() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletName, setWalletName] = useState('');
  const [name, setName] = useState('');
  const [workspace, setWorkspace] = useState('main-hq');
  const [isUrlRoom, setIsUrlRoom] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedWallet = localStorage.getItem('canvas0_wallet');
    if (savedWallet) setWalletAddress(savedWallet);

    const savedName = localStorage.getItem('canvas0_username');
    if (savedName) setName(savedName);

    // Read room query parameter
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setWorkspace(roomParam);
      setIsUrlRoom(true);
    } else {
      const savedSession = localStorage.getItem('canvas0_workspace');
      if (savedSession) setWorkspace(savedSession);
    }
  }, []);

  const connectWallet = async () => {
    if (!hasWalletProvider()) {
      alert('No Web3 wallet detected. Please install MetaMask, Coinbase Wallet, OKX Wallet, Phantom, or another EVM-compatible browser extension.');
      return;
    }
    setConnecting(true);
    try {
      const info = await connectBrowserWallet();
      setWalletAddress(info.address);
      setWalletName(info.providerName);
      localStorage.setItem('canvas0_wallet', info.address);

      // Auto-fill name with short address if empty
      const shortAddr = `${info.address.slice(0, 6)}...${info.address.slice(-4)}`;
      if (!name) {
        setName(shortAddr);
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      alert(err.message || 'Failed to connect Web3 wallet. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your Name before launching the canvas workspace.');
      return;
    }
    localStorage.setItem('canvas0_username', name.trim());
    
    // Auto-generate a unique private room ID if not joining an existing room
    const targetRoom = isUrlRoom ? workspace.trim() : 'room-' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('canvas0_workspace', targetRoom);
    
    router.push(`/canvas?room=${encodeURIComponent(targetRoom)}`);
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    localStorage.removeItem('canvas0_wallet');
  };

  if (!mounted) return null;

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';

  return (
    <div className="min-h-screen canvas-grid flex flex-col p-4 md:p-8">
      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between bg-white neo-border p-4 mb-8 md:mb-12 shadow-neo">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative">
            <Image
              src="/favicon.svg"
              alt="Canvas0 Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-2xl font-black tracking-tight uppercase">
            Canvas<span className="text-brand-purple">0</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-6 font-bold uppercase text-xs">
          <a href="#features" className="hover:underline">Features</a>
          <a href="https://docs.0g.ai" target="_blank" className="hover:underline">0G Protocol</a>
          <span className="px-2 py-1 bg-brand-yellow neo-border-sm text-[10px] uppercase font-black tracking-widest">
            Galileo Testnet
          </span>
          {walletAddress ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-green/20 neo-border-sm text-[10px] font-black uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-purple" />
                <span>{shortAddress}</span>
              </div>
              <button
                onClick={disconnectWallet}
                className="p-1 hover:bg-zinc-100 neo-border-sm cursor-pointer"
                title="Disconnect Wallet"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="neo-btn neo-btn-purple text-[10px] px-3 py-1.5 flex items-center gap-1.5"
            >
              {connecting ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Wallet className="w-3 h-3" />
              )}
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Title and Setup */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left">
          <div className="inline-flex self-start items-center gap-2 px-3 py-1.5 bg-brand-purple text-white text-xs font-black uppercase tracking-wider neo-border shadow-neo-sm transform -rotate-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-green fill-brand-green" />
            <span>Multiplayer AI Asset Workspace</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight uppercase select-none">
            Real-Time <br />
            AI Canvas For <br />
            <span className="bg-brand-yellow px-2 inline-block transform rotate-1 neo-border">Enterprise</span> Teams.
          </h1>
          
          <p className="text-lg md:text-xl font-medium leading-relaxed text-zinc-800 max-w-2xl border-l-4 border-black pl-4">
            Generate, arrange, and backup AI creative assets in real-time. Track cursor movements, store canvas states on the <strong>0G Storage Node</strong>, and lock copyright provenance on the <strong>0G EVM Galileo Chain</strong>.
          </p>

          {/* Web3 Nickname & Workspace Form */}
          <form onSubmit={handleLaunch} className="bg-white neo-border p-6 max-w-lg shadow-neo mt-4 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b-2 border-black pb-2">
              <Users className="w-5 h-5" />
              <h3 className="text-xl font-black uppercase tracking-tight">
                Join Collaborative Canvas
              </h3>
            </div>

            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-black uppercase text-zinc-700">
                Your Collaborator Name <span className="text-brand-purple">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alice or Alex"
                className="neo-border p-3 font-bold text-sm bg-white focus:outline-none focus:bg-yellow-50 focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            
            {/* Wallet Connect Section (Optional) */}
            <div className="flex flex-col gap-1.5 border-t border-zinc-200 pt-3">
              <span className="text-xs font-black uppercase text-zinc-700">
                Web3 Identity (Optional)
              </span>
              
              {!walletAddress ? (
                <button
                  type="button"
                  onClick={connectWallet}
                  disabled={connecting}
                  className="neo-btn bg-zinc-50 hover:bg-zinc-100 py-2.5 text-xs font-black uppercase tracking-wide cursor-pointer disabled:opacity-50"
                >
                  {connecting ? (
                    <span>Connecting wallet...</span>
                  ) : (
                    <>
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Link Web3 Wallet</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="neo-border p-2 bg-brand-green/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-brand-purple" />
                    <span className="font-black text-black">{shortAddress}</span>
                  </div>
                  <button
                    type="button"
                    onClick={disconnectWallet}
                    className="text-[9px] font-black uppercase text-zinc-500 hover:text-brand-orange hover:underline cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>

            {/* Room / Workspace Section (Only show locked label if joining via invite link) */}
            {isUrlRoom && (
              <div className="flex flex-col gap-1 border-t border-zinc-200 pt-3 bg-zinc-50 p-3 neo-border-sm">
                <span className="text-[10px] font-black uppercase text-zinc-500">
                  Joining Private Shared Room
                </span>
                <span className="text-sm font-black text-brand-purple uppercase select-all">
                  {workspace}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={!name.trim()}
              className={`neo-btn py-3.5 mt-2 text-base font-black tracking-wide uppercase flex items-center justify-center gap-2 ${
                name.trim() 
                  ? 'neo-btn-green cursor-pointer' 
                  : 'bg-zinc-200 text-zinc-400 border-zinc-400 cursor-not-allowed shadow-none hover:transform-none hover:shadow-none'
              }`}
            >
              <span>Launch & Collab</span>
              <Play className="w-5 h-5 fill-current" />
            </button>
          </form>
        </div>

        {/* Right Column: Grid Showcase / Features */}
        <div className="lg:col-span-5 flex flex-col gap-6" id="features">
          {/* Card 1: Supabase Realtime */}
          <div className="bg-brand-purple text-white neo-border p-6 shadow-neo transform rotate-1 hover:rotate-0 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-black p-2 neo-border-sm">
                <Cpu className="w-6 h-6 text-brand-green" />
              </div>
              <h3 className="text-xl font-black uppercase">Supabase Realtime</h3>
            </div>
            <p className="font-bold text-sm text-purple-100">
              Live presence tracks other team members cursor movements, while DB subscriptions stream card repositioning updates instantly across clients.
            </p>
          </div>

          {/* Card 2: OpenRouter AI */}
          <div className="bg-white text-black neo-border p-6 shadow-neo transform -rotate-1 hover:rotate-0 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-brand-green p-2 neo-border-sm">
                <Sparkles className="w-6 h-6 text-black fill-black" />
              </div>
              <h3 className="text-xl font-black uppercase">OpenRouter Agents</h3>
            </div>
            <p className="font-medium text-sm text-zinc-700">
              Trigger high-performance LLMs to output marketing copy or directly write valid inline SVG designs, spawning draggable asset cards.
            </p>
          </div>

          {/* Card 3: 0G Storage & Chain */}
          <div className="bg-brand-yellow text-black neo-border p-6 shadow-neo transform rotate-2 hover:rotate-0 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-black p-2 neo-border-sm">
                <Database className="w-6 h-6 text-brand-green" />
              </div>
              <h3 className="text-xl font-black uppercase">0G Web3 Provenance</h3>
            </div>
            <p className="font-medium text-sm text-zinc-800">
              Backup the entire board JSON onto 0G Storage Nodes. Attribute assets to the creator on the 0G Galileo chain for immutable copyright logging.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between border-t-4 border-black pt-6 mt-12 text-xs font-bold uppercase gap-4 pb-4">
        <span>© {new Date().getFullYear()} Canvas0 Labs. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="https://0g.ai" target="_blank" className="hover:underline">0G Foundation</a>
          <span>•</span>
          <a href="https://supabase.com" target="_blank" className="hover:underline">Supabase Database</a>
          <span>•</span>
          <a href="https://openrouter.ai" target="_blank" className="hover:underline">OpenRouter AI</a>
        </div>
      </footer>
    </div>
  );
}
