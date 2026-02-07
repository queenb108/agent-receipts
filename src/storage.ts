/**
 * AgentReceipts - Storage Handler
 * IPFS pinning and on-chain anchoring
 */

import { 
  createWalletClient, 
  createPublicClient,
  http, 
  type Hash,
  keccak256,
  toBytes,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { AgentReceipt } from './types';
import { computeReceiptHash } from './generator';

// Will be deployed - placeholder for now
let ANCHOR_CONTRACT_ADDRESS = '';

/**
 * Pin receipt to IPFS using web3.storage or Pinata
 * For hackathon demo, we'll use a simplified approach
 */
export async function pinToIPFS(receipt: AgentReceipt): Promise<string> {
  // For hackathon MVP, we'll create a deterministic CID-like hash
  // In production, this would use actual IPFS pinning
  
  const receiptJson = JSON.stringify(receipt, null, 2);
  
  // Create a mock CID based on content hash
  const contentHash = keccak256(toBytes(receiptJson));
  
  // Format as base58-like CID (simplified for demo)
  const mockCid = `bafyreig${contentHash.slice(2, 50)}`;
  
  console.log(`📌 Receipt pinned to IPFS (mock): ${mockCid}`);
  console.log(`   Content size: ${receiptJson.length} bytes`);
  
  return mockCid;
}

/**
 * Retrieve receipt from IPFS
 * In production, this would fetch from IPFS gateway
 */
export async function fetchFromIPFS(cid: string): Promise<AgentReceipt | null> {
  // For demo, we'd need to store locally or use actual IPFS
  console.log(`📥 Fetching from IPFS: ${cid}`);
  console.log(`   Note: In production, this fetches from IPFS gateway`);
  
  return null; // Would return actual receipt in production
}

/**
 * Anchor receipt hash on-chain
 */
export async function anchorOnChain(
  receipt: AgentReceipt,
  privateKey: string
): Promise<{ hash: string; txHash: string }> {
  const receiptHash = computeReceiptHash(receipt);
  
  const account = privateKeyToAccount(privateKey as Hash);
  
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http('https://sepolia.base.org'),
  });
  
  // Store hash in transaction calldata (no contract needed)
  const txHash = await walletClient.sendTransaction({
    to: account.address, // Self-send with data
    data: receiptHash as Hash,
    value: BigInt(0),
  } as any);
  
  console.log(`⚓ Receipt anchored on-chain via calldata`);
  console.log(`   Hash: ${receiptHash}`);
  console.log(`   TX: ${txHash}`);
  
  return { hash: receiptHash, txHash };
}

/**
 * Verify receipt anchor on-chain
 */
export async function verifyOnChainAnchor(
  receipt: AgentReceipt
): Promise<{ exists: boolean; timestamp?: number; anchorer?: string }> {
  if (!receipt.anchorTxHash) {
    return { exists: false };
  }
  
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http('https://sepolia.base.org'),
  });
  
  try {
    const tx = await publicClient.getTransaction({
      hash: receipt.anchorTxHash as Hash,
    });
    
    if (!tx) {
      return { exists: false };
    }
    
    const expectedHash = computeReceiptHash(receipt);
    
    // Check if calldata contains the receipt hash
    if (tx.input === expectedHash || tx.input.includes(expectedHash.slice(2))) {
      const block = await publicClient.getBlock({
        blockHash: tx.blockHash!,
      });
      
      return {
        exists: true,
        timestamp: Number(block.timestamp),
        anchorer: tx.from,
      };
    }
    
    return { exists: false };
  } catch (error) {
    console.error('Error verifying anchor:', error);
    return { exists: false };
  }
}

/**
 * Set the anchor contract address (after deployment)
 */
export function setAnchorContract(address: string): void {
  ANCHOR_CONTRACT_ADDRESS = address;
}

/**
 * Get current anchor contract address
 */
export function getAnchorContract(): string {
  return ANCHOR_CONTRACT_ADDRESS;
}
