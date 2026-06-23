import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ZG_STORAGE_GATEWAY = process.env.NEXT_PUBLIC_ZG_STORAGE_GATEWAY;

// Ensure local directory exists for canvas persistence
const storageDir = path.join(process.cwd(), 'public', 'canvas-states');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.canvasState) {
      return NextResponse.json({ error: 'Canvas state data is required' }, { status: 400 });
    }

    const payloadString = JSON.stringify(body);
    const size = Buffer.byteLength(payloadString);
    
    // Generate standard SHA-256 hash (similar to 0G Storage Data Root Hash)
    const hash = '0x' + crypto.createHash('sha256').update(payloadString).digest('hex');
    
    // Generate a mock transaction hash for the storage submission
    const txHash = '0x' + crypto.randomBytes(32).toString('hex');
    
    // Save locally for retrieval (persisting states in 0g folder)
    const filePath = path.join(storageDir, `${hash}.json`);
    fs.writeFileSync(filePath, payloadString, 'utf8');

    // Attempt to post to the 0G Storage gateway if it is fully configured and online
    let uploadedToGateway = false;
    if (ZG_STORAGE_GATEWAY && ZG_STORAGE_GATEWAY !== 'https://storage-gateway.testnet.0g.ai') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
        
        const response = await fetch(`${ZG_STORAGE_GATEWAY}/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: payloadString,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        if (response.ok) {
          uploadedToGateway = true;
          console.log('Successfully posted to 0G Storage gateway:', ZG_STORAGE_GATEWAY);
        }
      } catch (e) {
        console.warn('0G Storage Gateway request bypassed/timed out, falling back to local persistent store.', e);
      }
    }

    return NextResponse.json({
      success: true,
      hash,
      txHash,
      size,
      timestamp: new Date().toISOString(),
      url: `/api/storage?hash=${hash}`,
      gatewaySynced: uploadedToGateway
    });
  } catch (error: any) {
    console.error('Error uploading to storage:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hash = searchParams.get('hash');

    if (!hash) {
      return NextResponse.json({ error: 'Hash parameter is required' }, { status: 400 });
    }

    // Clean hash for filename safety
    const cleanHash = hash.replace(/[^a-fA-F0-9xX]/g, '');
    const filePath = path.join(storageDir, `${cleanHash}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Canvas state not found in storage' }, { status: 404 });
    }

    const dataString = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(dataString);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching from storage:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
