export interface ZGChainLogResponse {
  success: boolean;
  txHash: string;
  blockNumber?: number;
  contractAddress?: string;
  errorMessage?: string;
  simulated?: boolean;
  walletAddress?: string;
  data: {
    userId: string;
    timestamp: number;
    promptHash: string;
    assetId: string;
  };
}

export async function logToZGChain(
  userId: string,
  promptHash: string,
  assetId: string
): Promise<ZGChainLogResponse> {
  const timestamp = Math.floor(Date.now() / 1000);

  const response = await fetch('/api/chain/log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, timestamp, promptHash, assetId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to log provenance to 0G Chain');
  }

  return response.json();
}
