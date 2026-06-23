import { NextRequest, NextResponse } from 'next/server';
import { JsonRpcProvider, Wallet, hexlify, toUtf8Bytes } from 'ethers';

const ZG_RPC_URL = process.env.NEXT_PUBLIC_ZG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
const ZG_WALLET_PRIVATE_KEY = process.env.ZG_WALLET_PRIVATE_KEY;

export async function POST(req: NextRequest) {
  try {
    const { userId, timestamp, promptHash, assetId } = await req.json();

    if (!userId || !promptHash || !assetId) {
      return NextResponse.json(
        { error: 'userId, promptHash, and assetId are required' },
        { status: 400 }
      );
    }

    if (!ZG_WALLET_PRIVATE_KEY) {
      return NextResponse.json(
        { error: '0G wallet private key is not configured on the server.' },
        { status: 500 }
      );
    }

    // Format the private key (ensure 0x prefix)
    const formattedPrivateKey = ZG_WALLET_PRIVATE_KEY.startsWith('0x')
      ? ZG_WALLET_PRIVATE_KEY
      : `0x${ZG_WALLET_PRIVATE_KEY}`;

    let provider;
    let wallet;
    let walletAddress = '';

    try {
      provider = new JsonRpcProvider(ZG_RPC_URL);
      wallet = new Wallet(formattedPrivateKey, provider);
      walletAddress = wallet.address;
    } catch (e: any) {
      console.error('Ethers initialization failed:', e);
      return NextResponse.json(
        { error: `Failed to initialize Ethereum wallet: ${e.message}` },
        { status: 500 }
      );
    }

    // Create provenance payload
    const payload = {
      userId,
      timestamp,
      promptHash,
      assetId,
      application: 'Canvas0',
      action: 'AI_ASSET_CREATION'
    };

    const payloadHex = hexlify(toUtf8Bytes(JSON.stringify(payload)));

    try {
      // Send data transaction to self (immutably logging data in tx input)
      const tx = {
        to: walletAddress,
        value: 0,
        data: payloadHex,
      };

      // Estimate gas
      const gasLimit = await provider.estimateGas(tx).catch(() => 30000);
      const feeData = await provider.getFeeData();

      const transactionResponse = await wallet.sendTransaction({
        ...tx,
        gasLimit,
        gasPrice: feeData.gasPrice || undefined
      });

      console.log('Successfully logged provenance on 0G Chain. Tx Hash:', transactionResponse.hash);

      return NextResponse.json({
        success: true,
        txHash: transactionResponse.hash,
        blockNumber: transactionResponse.blockNumber || undefined,
        walletAddress,
        data: payload
      });
    } catch (txError: any) {
      console.warn('0G Chain live transaction failed. Falling back to local logging.', txError.message);

      // Generate a valid-looking hash for testing/simulation
      const mockHash = '0x' + crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
      
      const isGasError = txError.message.includes('insufficient funds') || txError.message.includes('replacement transaction underpriced');

      return NextResponse.json({
        success: false,
        txHash: mockHash,
        walletAddress,
        errorMessage: isGasError 
          ? `Insufficient testnet gas tokens (OG) at address ${walletAddress}. Please fund your wallet using the 0G Galileo Testnet faucet to enable live blockchain writes.`
          : txError.message,
        simulated: true,
        data: payload
      });
    }
  } catch (error: any) {
    console.error('Error logging to 0G Chain:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
