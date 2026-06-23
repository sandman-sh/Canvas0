'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  Home,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Info,
  ExternalLink,
  ChevronDown,
  Eye,
  Grid,
  Users,
  Settings,
  Plus,
  Database,
  Layers
} from 'lucide-react';
import {
  supabase,
  getAssets,
  addAsset,
  updateAsset,
  deleteAsset,
  CanvasAsset,
  UserCursor
} from '@/lib/supabase';
import { connectBrowserWallet, hasWalletProvider } from '@/lib/wallet';
import { uploadToZGStorage } from '@/lib/zgStorage';
import Toolbar, { ToolType } from '@/components/Toolbar';
import Inspector from '@/components/Inspector';
import AIChatPanel from '@/components/AIChatPanel';
import DesignCanvas from '@/components/DesignCanvas';
import LayersPanel from '@/components/LayersPanel';

export default function CanvasPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const presenceChannelRef = useRef<any>(null);

  // Connection & Workspace state
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [workspace, setWorkspace] = useState('main-hq');
  const [mounted, setMounted] = useState(false);

  // Collaborative state (room, name, user identity)
  const [collaboratorName, setCollaboratorName] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [showNameModal, setShowNameModal] = useState(false);

  // Viewport & Workspace settings
  const [zoom, setZoom] = useState(1);
  const [gridType, setGridType] = useState<'dots' | 'lines' | 'none'>('dots');
  const [gridSize, setGridSize] = useState(30);
  const [canvasBg, setCanvasBg] = useState('#ffffff');
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  // Asset selection / state
  const [assets, setAssets] = useState<CanvasAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<CanvasAsset | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [cursorColor, setCursorColor] = useState('#9D4EDD');

  // Real-time states
  const [cursors, setCursors] = useState<UserCursor[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState(1);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(true);
  const [backingUp, setBackingUp] = useState(false);

  // Blockchain Provenance logs (assetId -> TxHash info)
  const [provenanceLogs, setProvenanceLogs] = useState<Record<string, { txHash: string; simulated: boolean }>>({});
  
  // Toast notifications
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; desc: string; type: 'success' | 'error' | 'info' }>>([]);
  const lastBroadcast = useRef<number>(0);

  const addToast = (title: string, desc: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, title, desc, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const cursorColors = ['#9D4EDD', '#39FF14', '#FFD60A', '#FF007F', '#FF6B00', '#00FFFF'];
  const getCursorColor = (address: string) => {
    if (!address) return '#9D4EDD';
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = address.charCodeAt(i) + ((hash << 5) - hash);
    }
    return cursorColors[Math.abs(hash) % cursorColors.length];
  };

  // Connect Wallet
  const connectWallet = async () => {
    if (!hasWalletProvider()) {
      addToast('No Wallet Found', 'Install MetaMask, OKX, Coinbase or another browser wallet.', 'error');
      return;
    }
    setConnecting(true);
    try {
      const info = await connectBrowserWallet();
      setWalletAddress(info.address);
      setCursorColor(getCursorColor(info.address));
      localStorage.setItem('canvas0_wallet', info.address);
      
      const shortAddr = `${info.address.slice(0, 6)}...${info.address.slice(-4)}`;
      if (!collaboratorName || collaboratorName === 'Anonymous') {
        setCollaboratorName(shortAddr);
        localStorage.setItem('canvas0_username', shortAddr);
      }
      
      addToast('Wallet Connected', `Connected successfully to EVM workspace.`, 'success');
    } catch (err: any) {
      console.error(err);
      addToast('Connection Failed', err.message || 'EVM connect failed.', 'error');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect Wallet
  const disconnectWallet = () => {
    setWalletAddress('');
    localStorage.removeItem('canvas0_wallet');
    addToast('Wallet Disconnected', 'Switched to guest mode.', 'info');
  };

  // Load assets & setup real-time canvas subscriptions
  useEffect(() => {
    setMounted(true);
    const savedWallet = localStorage.getItem('canvas0_wallet') || '';
    
    // 1. Read room query parameter
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    let activeWorkspace = '';
    if (roomParam) {
      activeWorkspace = roomParam;
      localStorage.setItem('canvas0_workspace', roomParam);
    } else {
      const randRoom = 'room-' + Math.random().toString(36).substring(2, 9);
      router.push(`/canvas?room=${encodeURIComponent(randRoom)}`);
      return;
    }
    setWorkspace(activeWorkspace);

    // 2. Read or generate unique user ID
    let storedUserId = sessionStorage.getItem('canvas0_user_id');
    if (!storedUserId) {
      storedUserId = 'usr_' + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('canvas0_user_id', storedUserId);
    }
    setUserId(storedUserId);

    // 3. Read or prompt for username
    const storedUsername = localStorage.getItem('canvas0_username') || '';
    if (storedUsername) {
      setCollaboratorName(storedUsername);
    } else {
      if (!savedWallet) {
        setShowNameModal(true);
      } else {
        const shortAddr = `${savedWallet.slice(0, 6)}...${savedWallet.slice(-4)}`;
        setCollaboratorName(shortAddr);
        localStorage.setItem('canvas0_username', shortAddr);
      }
    }

    if (savedWallet) {
      setWalletAddress(savedWallet);
      setCursorColor(getCursorColor(savedWallet));
    } else {
      setCursorColor(getCursorColor(storedUserId));
    }

    // Load provenance local receipts
    try {
      const savedProv = localStorage.getItem('canvas0_provenance');
      if (savedProv) setProvenanceLogs(JSON.parse(savedProv));
    } catch (e) {
      // ignore
    }

    // Initial asset load
    getAssets(activeWorkspace).then(setAssets).catch((err) => {
      addToast('Fetch Failed', 'Failed to retrieve assets from Supabase database.', 'error');
    });

    // Supabase Real-time DB subscription
    const dbChannel = supabase
      .channel('canvas-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'canvas_assets' },
        (payload) => {
          const payloadAsset = (payload.new || payload.old) as CanvasAsset;
          if (payloadAsset && payloadAsset.room_id !== activeWorkspace) {
            return; // Ignore updates from other rooms
          }

          if (payload.eventType === 'INSERT') {
            const newAsset = payload.new as CanvasAsset;
            setAssets((prev) => {
              if (prev.some((a) => a.id === newAsset.id)) return prev;
              return [...prev, newAsset];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedAsset = payload.new as CanvasAsset;
            setAssets((prev) =>
              prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a))
            );
            // Update selection focus if needed
            setSelectedAsset((prev) => {
              if (prev && prev.id === updatedAsset.id) {
                return updatedAsset;
              }
              return prev;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedAsset = payload.old as CanvasAsset;
            setAssets((prev) => prev.filter((a) => a.id !== deletedAsset.id));
            setSelectedAsset((prev) => (prev && prev.id === deletedAsset.id ? null : prev));
          }
        }
      )
      .subscribe();

    return () => {
      dbChannel.unsubscribe();
    };
  }, []);

  // Sync cursor presence
  useEffect(() => {
    if (!userId || !collaboratorName) return;

    const presenceChannel = supabase.channel(`canvas-presence-${workspace}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannelRef.current = presenceChannel;

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const activeCursors: UserCursor[] = [];
        let count = 0;
        
        for (const key in state) {
          count++;
          const presences = state[key] as any;
          if (presences && presences[0]) {
            if (presences[0].userId !== userId) {
              activeCursors.push(presences[0]);
            }
          }
        }
        
        setCursors(activeCursors);
        setActiveUsersCount(count);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            userId: userId,
            userName: collaboratorName,
            color: cursorColor,
            x: 0,
            y: 0,
            lastActive: Date.now(),
          });
        }
      });

    return () => {
      presenceChannel.unsubscribe();
      presenceChannelRef.current = null;
    };
  }, [userId, collaboratorName, workspace, cursorColor]);

  // Track coordinates and broadcast via Presence
  const handleTrackCursor = (x: number, y: number) => {
    const now = Date.now();
    if (!userId || !presenceChannelRef.current) return;

    if (now - lastBroadcast.current > 75) {
      presenceChannelRef.current.track({
        userId: userId,
        userName: collaboratorName,
        color: cursorColor,
        x,
        y,
        activeTool,
        lastActive: now,
      });
      lastBroadcast.current = now;
    }
  };

  // 0G Storage state backup
  const handleBackup = async () => {
    if (assets.length === 0) {
      addToast('Backup Skipped', 'Canvas is empty, nothing to save.', 'info');
      return;
    }
    setBackingUp(true);
    addToast('Backing Up', 'Uploading canvas state to 0G Storage...', 'info');
    try {
      const res = await uploadToZGStorage(assets);
      if (res.success) {
        addToast(
          'Backup Secure',
          `Saved to 0G Storage Node! Root Hash: ${res.hash.slice(0, 12)}...`,
          'success'
        );
      }
    } catch (err: any) {
      console.error(err);
      addToast('Backup Failed', err.message || '0G Storage Node communication failed.', 'error');
    } finally {
      setBackingUp(false);
    }
  };

  // Add Asset Handlers
  const handleAddAsset = async (asset: Omit<CanvasAsset, 'id'>) => {
    try {
      const added = await addAsset(asset, workspace);
      setAssets((prev) => [...prev, added]);
      return added;
    } catch (e: any) {
      addToast('Create Failed', e.message || 'Database insert failed.', 'error');
      throw e;
    }
  };

  // Update Asset Handlers
  const handleUpdateAsset = async (id: string, updates: Partial<CanvasAsset>) => {
    try {
      // Optimistic state updates
      setAssets((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } as CanvasAsset : a))
      );
      await updateAsset(id, updates);
    } catch (e: any) {
      addToast('Update Failed', e.message || 'Database update failed.', 'error');
    }
  };

  // Duplicate Asset Handler
  const handleDuplicateAsset = async (asset: CanvasAsset) => {
    try {
      const { id: _id, created_at: _c, updated_at: _u, ...rest } = asset;
      const duplicated = await addAsset(
        { ...rest, x_pos: asset.x_pos + 20, y_pos: asset.y_pos + 20, z_index: assets.length + 1 },
        workspace
      );
      setAssets((prev) => [...prev, duplicated]);
      setSelectedAsset(duplicated);
      addToast('Duplicated', `${asset.type} duplicated.`, 'success');
    } catch (e: any) {
      addToast('Duplicate Failed', e.message || 'Database insert failed.', 'error');
    }
  };

  // Delete Asset Handler
  const handleDeleteAsset = async (id: string) => {
    try {
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setSelectedAsset(null);
      await deleteAsset(id);
      addToast('Asset Removed', 'Object deleted from board.', 'info');
    } catch (e: any) {
      addToast('Delete Failed', e.message || 'Database delete failed.', 'error');
    }
  };

  // Media File Selector Trigger
  const triggerImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle local file selection for images
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!walletAddress) {
      addToast('Wallet Required', 'Please connect your Web3 wallet to upload images.', 'error');
      return;
    }

    addToast('Uploading Image', 'Processing image content...', 'info');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const creatorShort = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

      try {
        await handleAddAsset({
          type: 'image',
          content: 'Uploaded raster image',
          x_pos: 150,
          y_pos: 150,
          width: 300,
          height: 300,
          rotation: 0,
          z_index: assets.length + 1,
          creator_id: creatorShort,
          properties: {
            imageUrl: base64,
            opacity: 1,
            brightness: 100,
            contrast: 100,
            saturation: 100
          }
        });
        addToast('Upload Complete', 'Image added successfully to board.', 'success');
      } catch (err: any) {
        addToast('Upload Failed', err.message || 'Database save error.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-zinc-50 overflow-hidden font-sans">
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* Main App Header / Top nav */}
      <header className="h-16 bg-white neo-border border-t-0 border-x-0 px-6 flex items-center justify-between z-40 select-none shadow-[0px_2px_0px_#000]">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 p-1.5 hover:bg-zinc-100 neo-border-sm cursor-pointer"
            title="Go to Home"
          >
            <Home className="w-4 h-4 text-brand-purple" />
            <span className="font-black text-sm uppercase tracking-wider">Canvas0</span>
          </button>

          <div className="relative flex items-center gap-2">
            <div className="px-3 py-1.5 bg-brand-yellow neo-border-sm font-bold text-xs uppercase flex items-center gap-1.5 select-none">
              <span>Room: {workspace}</span>
            </div>

            <button
              onClick={() => {
                const inviteUrl = `${window.location.origin}/canvas?room=${encodeURIComponent(workspace)}`;
                navigator.clipboard.writeText(inviteUrl);
                addToast('Invite Link Copied', 'Share it with your teammates to collab!', 'success');
              }}
              className="px-3 py-1.5 bg-brand-green hover:bg-brand-green/90 neo-border-sm font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer"
              title="Copy Collab Invite Link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>

            <button
              onClick={handleBackup}
              disabled={backingUp}
              className="px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-white neo-border-sm font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Secure Canvas State on 0G Storage"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{backingUp ? 'Saving...' : 'Backup'}</span>
            </button>
          </div>
        </div>

        {/* Global Stats / Web3 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white neo-border-sm font-bold text-xs uppercase">
            <Users className="w-4 h-4 text-brand-purple" />
            <span>Active: {activeUsersCount}</span>
          </div>

          {walletAddress ? (
            <div className="flex items-center gap-2 bg-brand-green/20 px-3 py-1.5 neo-border-sm font-bold text-xs uppercase">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: cursorColor }}
              />
              <span>{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</span>
              <button
                onClick={disconnectWallet}
                className="ml-1 px-1 bg-white hover:bg-zinc-100 neo-border-sm text-[9px] uppercase cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="neo-btn neo-btn-purple text-xs px-4 py-2 font-black uppercase flex items-center gap-1.5"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Design Workspace Area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Side: Scrollable vertical toolbar & controls wrapper */}
        <div className="absolute left-4 top-4 bottom-4 z-30 flex flex-col gap-3 pointer-events-none overflow-y-auto scrollbar-none select-none max-h-[calc(100vh-100px)]">
          <div className="pointer-events-auto">
            <Toolbar
              activeTool={activeTool}
              onChangeTool={setActiveTool}
              onUploadClick={triggerImageUpload}
              onAIClick={() => setIsAIChatOpen(!isAIChatOpen)}
              isAIChatOpen={isAIChatOpen}
            />
          </div>

          <div className="pointer-events-auto">
            {/* Quick Environment Controls */}
            <div className="bg-white neo-border shadow-[4px_4px_0px_#000] p-2 flex flex-col gap-2 w-14 items-center">
              {/* Layers Panel Toggle */}
              <button
                onClick={() => setIsLayersPanelOpen(!isLayersPanelOpen)}
                className={`p-2 neo-border-sm cursor-pointer transition-all ${isLayersPanelOpen ? 'bg-brand-green' : 'hover:bg-zinc-100'}`}
                title="Toggle Layers Panel"
              >
                <Layers className="w-5 h-5 text-black" />
              </button>

              {/* Dots Grid toggle */}
              <button
                onClick={() => setGridType(gridType === 'dots' ? 'lines' : gridType === 'lines' ? 'none' : 'dots')}
                className="p-2 hover:bg-zinc-100 neo-border-sm cursor-pointer"
                title="Toggle Background Grid"
              >
                <Grid className="w-5 h-5 text-black" />
              </button>
              
              {/* Viewport Zoom Indicator */}
              <div className="text-[10px] font-black uppercase text-center w-full">
                {Math.round(zoom * 100)}%
              </div>

              {/* Reset Zoom */}
              <button
                onClick={() => setZoom(1)}
                className="px-1.5 py-0.5 bg-brand-yellow neo-border-sm text-[8px] font-bold uppercase cursor-pointer"
                title="Reset Zoom"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Layers Panel (below toolbar) */}
          {isLayersPanelOpen && (
            <div className="pointer-events-auto max-h-[40vh]">
              <LayersPanel
                assets={assets}
                selectedAsset={selectedAsset}
                onSelectAsset={setSelectedAsset}
                onUpdateAsset={handleUpdateAsset}
              />
            </div>
          )}
        </div>

        {/* Center: Infinite Canvas Workspace */}
        <div className="flex-1 min-w-0 h-full bg-zinc-50 relative overflow-hidden">
          <DesignCanvas
            assets={assets}
            activeTool={activeTool}
            walletAddress={walletAddress}
            collaboratorName={collaboratorName}
            cursorColor={cursorColor}
            selectedAsset={selectedAsset}
            onSelectAsset={setSelectedAsset}
            onUpdateAsset={handleUpdateAsset}
            onAddAsset={async (newAsset) => {
              const added = await handleAddAsset(newAsset);
              setSelectedAsset(added);
              setActiveTool('select');
              return added;
            }}
            onDeleteAsset={handleDeleteAsset}
            onSelectTool={(tool) => {
              if (tool === 'ai') {
                setIsAIChatOpen(prev => !prev);
              } else {
                setActiveTool(tool);
              }
            }}
            onTrackCursor={handleTrackCursor}
            cursors={cursors}
            zoom={zoom}
            onZoomChange={setZoom}
            gridType={gridType}
            gridSize={gridSize}
            canvasBg={canvasBg}
          />
        </div>

        {/* Right Side: Properties Inspector Panel (only show if selectedAsset is not null) */}
        {selectedAsset && (
          <div className="relative border-l-2 border-black z-30 h-full w-80 flex-shrink-0">
            <Inspector
              selectedAsset={selectedAsset}
              assets={assets}
              onUpdateProperties={(updates) => {
                handleUpdateAsset(selectedAsset.id, updates);
              }}
              onDeleteAsset={handleDeleteAsset}
              onDuplicateAsset={handleDuplicateAsset}
            />
          </div>
        )}
      </div>

      {/* Floating AI Chatbox Generator */}
      <AIChatPanel
        walletAddress={walletAddress}
        collaboratorName={collaboratorName}
        workspace={workspace}
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        onAssetGenerated={(newAsset) => {
          setAssets((prev) => [...prev, newAsset]);
          setIsAIChatOpen(false);
        }}
        addToast={addToast}
      />

      {/* Name Request Modal Overlay */}
      {showNameModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white neo-border shadow-[8px_8px_0px_#000] p-6 max-w-sm w-full flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b-2 border-black pb-2">
              <Users className="w-5 h-5 text-brand-purple" />
              <h3 className="text-lg font-black uppercase tracking-tight">
                Identify Yourself
              </h3>
            </div>
            <p className="text-xs font-bold text-zinc-600 uppercase">
              You are joining room: <span className="text-brand-purple">{workspace}</span>
            </p>
            <div className="flex flex-col gap-1">
              <label htmlFor="modal-name" className="text-[10px] font-bold text-zinc-600 uppercase">
                Enter Your Collaborator Name
              </label>
              <input
                id="modal-name"
                type="text"
                placeholder="e.g. Charlie"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) {
                      setCollaboratorName(val);
                      localStorage.setItem('canvas0_username', val);
                      setShowNameModal(false);
                      addToast('Welcome to Canvas', `Joined room ${workspace} as ${val}`, 'success');
                    }
                  }
                }}
                className="w-full px-3 py-2 bg-white neo-border-sm font-bold text-sm focus:outline-none focus:bg-yellow-50"
                autoFocus
              />
            </div>
            <button
              onClick={(e) => {
                const inputEl = document.getElementById('modal-name') as HTMLInputElement;
                const val = inputEl?.value?.trim();
                if (val) {
                  setCollaboratorName(val);
                  localStorage.setItem('canvas0_username', val);
                  setShowNameModal(false);
                  addToast('Welcome to Canvas', `Joined room ${workspace} as ${val}`, 'success');
                } else {
                  alert('Name is required!');
                }
              }}
              className="w-full neo-btn neo-btn-green py-2 text-xs font-black uppercase tracking-wider"
            >
              Enter Workspace
            </button>
          </div>
        </div>
      )}

      {/* Bottom Right: Interactive Toast notification stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm select-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-3 neo-border shadow-[4px_4px_0px_#000] flex flex-col gap-0.5 border-2 ${
              toast.type === 'success'
                ? 'bg-brand-green text-black'
                : toast.type === 'error'
                ? 'bg-red-400 text-black'
                : 'bg-white text-black'
            }`}
          >
            <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wide">
              {toast.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : toast.type === 'error' ? (
                <Info className="w-4 h-4" />
              ) : (
                <Info className="w-4 h-4" />
              )}
              <span>{toast.title}</span>
            </div>
            <p className="text-[10px] font-bold">{toast.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
