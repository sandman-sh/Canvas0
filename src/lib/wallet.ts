export interface WalletInfo {
  address: string;
  shortAddress: string;
  chainId: number;
  providerName: string;
}

interface DetectedProvider {
  provider: any;
  name: string;
}

// Collect ALL wallet providers available in the browser
function getAllProviders(): DetectedProvider[] {
  if (typeof window === 'undefined') return [];
  const win = window as any;
  const providers: DetectedProvider[] = [];
  const seen = new Set<any>();

  const addProvider = (p: any, name: string) => {
    if (p && !seen.has(p)) {
      seen.add(p);
      providers.push({ provider: p, name });
    }
  };

  // Some browsers expose multiple wallets via providers array
  if (win.ethereum?.providers && Array.isArray(win.ethereum.providers)) {
    for (const p of win.ethereum.providers) {
      if (p.isMetaMask) addProvider(p, 'MetaMask');
      else if (p.isCoinbaseWallet) addProvider(p, 'Coinbase Wallet');
      else if (p.isBraveWallet) addProvider(p, 'Brave Wallet');
      else if (p.isTrust) addProvider(p, 'Trust Wallet');
      else if (p.isRabby) addProvider(p, 'Rabby');
      else if (p.isTokenPocket) addProvider(p, 'TokenPocket');
      else addProvider(p, 'Browser Wallet');
    }
  }

  // Named wallet injections (check specific globals first)
  if (win.okxwallet) addProvider(win.okxwallet, 'OKX Wallet');
  if (win.phantom?.ethereum) addProvider(win.phantom.ethereum, 'Phantom');
  if (win.coinbaseWalletExtension) addProvider(win.coinbaseWalletExtension, 'Coinbase Wallet');
  if (win.bitkeep?.ethereum) addProvider(win.bitkeep.ethereum, 'Bitget Wallet');
  if (win.zerion) addProvider(win.zerion, 'Zerion');

  // Generic window.ethereum fallback (if not already added from providers array)
  if (win.ethereum) {
    let name = 'Browser Wallet';
    if (win.ethereum.isMetaMask) name = 'MetaMask';
    else if (win.ethereum.isCoinbaseWallet) name = 'Coinbase Wallet';
    else if (win.ethereum.isBraveWallet) name = 'Brave Wallet';
    else if (win.ethereum.isTrust) name = 'Trust Wallet';
    else if (win.ethereum.isRabby) name = 'Rabby';
    else if (win.ethereum.isTokenPocket) name = 'TokenPocket';
    addProvider(win.ethereum, name);
  }

  return providers;
}

export function hasWalletProvider(): boolean {
  return getAllProviders().length > 0;
}

// Try connecting to a single provider, returns address or null
async function tryConnect(provider: any): Promise<string | null> {
  // Strategy 1: eth_requestAccounts (opens popup)
  try {
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    if (accounts && accounts.length > 0 && accounts[0]) {
      return accounts[0];
    }
  } catch (e: any) {
    // User rejected or wallet empty — continue to next strategy
  }

  // Strategy 2: eth_accounts (silent check, no popup)
  try {
    const accounts = await provider.request({ method: 'eth_accounts' });
    if (accounts && accounts.length > 0 && accounts[0]) {
      return accounts[0];
    }
  } catch (e: any) {
    // Silently fail
  }

  return null;
}

export async function connectBrowserWallet(): Promise<WalletInfo> {
  const allProviders = getAllProviders();

  if (allProviders.length === 0) {
    throw new Error('No Web3 wallet detected in your browser. Please install MetaMask, OKX Wallet, Coinbase Wallet, Phantom, or another EVM-compatible extension.');
  }

  // Try each provider until one returns an account
  const errors: string[] = [];

  for (const { provider, name } of allProviders) {
    try {
      const address = await tryConnect(provider);
      if (address) {
        let chainId = 1;
        try {
          const chainHex = await provider.request({ method: 'eth_chainId' });
          chainId = parseInt(chainHex, 16);
        } catch (e) {
          // ignore chain detection failure
        }

        return {
          address,
          shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
          chainId,
          providerName: name,
        };
      } else {
        errors.push(`${name}: no accounts available`);
      }
    } catch (e: any) {
      errors.push(`${name}: ${e.message || 'connection failed'}`);
    }
  }

  // All providers failed — give a helpful message
  const walletNames = allProviders.map(p => p.name).join(', ');
  throw new Error(
    `Found ${walletNames} but none returned an account. Please open your wallet extension, unlock it, and make sure you have at least one account created. Then try again.`
  );
}

// Listen for account changes across all detected providers
export function onAccountChange(callback: (accounts: string[]) => void): () => void {
  const allProviders = getAllProviders();
  const cleanups: (() => void)[] = [];

  for (const { provider } of allProviders) {
    if (provider && provider.on) {
      try {
        provider.on('accountsChanged', callback);
        cleanups.push(() => {
          try { provider.removeListener('accountsChanged', callback); } catch (e) { /* ignore */ }
        });
      } catch (e) {
        // ignore
      }
    }
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}

// Listen for chain changes across all detected providers
export function onChainChange(callback: (chainId: string) => void): () => void {
  const allProviders = getAllProviders();
  const cleanups: (() => void)[] = [];

  for (const { provider } of allProviders) {
    if (provider && provider.on) {
      try {
        provider.on('chainChanged', callback);
        cleanups.push(() => {
          try { provider.removeListener('chainChanged', callback); } catch (e) { /* ignore */ }
        });
      } catch (e) {
        // ignore
      }
    }
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
