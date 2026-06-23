export interface ZGStorageResponse {
  success: boolean;
  hash: string;
  txHash?: string;
  size: number;
  timestamp: string;
  url?: string;
}

export async function uploadToZGStorage(assets: any[]): Promise<ZGStorageResponse> {
  const payload = {
    canvasState: assets,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };

  const response = await fetch('/api/storage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload canvas to 0G Storage');
  }

  return response.json();
}
