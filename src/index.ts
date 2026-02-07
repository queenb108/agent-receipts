/**
 * AgentReceipts - Agent-Native Receipt & Proof Generator
 * USDC Hackathon - Agentic Commerce Track
 * 
 * A skill for generating structured, verifiable receipts for agent commerce.
 * Transforms raw USDC transactions into semantically rich proof-of-commerce documents.
 * 
 * Features:
 * - Layer 1: Transaction Proof (on-chain facts)
 * - Layer 2: Commerce Context (semantic meaning)
 * - Layer 3: Bilateral Attestations (EIP-712 signatures)
 * - IPFS storage + On-chain anchoring
 * - Full verification pipeline
 * 
 * @author Queen-B
 * @license MIT
 */

// Types
export * from './types';

// Generator
export { 
  createReceipt, 
  fetchTransactionProof,
  getReceiptSigningMessage,
  computeReceiptHash,
  formatReceiptSummary,
} from './generator';

// Signer
export {
  signReceipt,
  addAttestation,
  verifyAttestation,
  verifyAllAttestations,
  hasRequiredAttestations,
  generateTestWallet,
} from './signer';

// Storage
export {
  pinToIPFS,
  fetchFromIPFS,
  anchorOnChain,
  verifyOnChainAnchor,
  setAnchorContract,
  getAnchorContract,
} from './storage';

// Verifier
export {
  verifyReceipt,
  quickVerify,
  formatVerificationResult,
} from './verifier';

// PDF/HTML Generation
export {
  generateReceiptHTML,
  generateReceiptText,
  saveReceiptHTML,
} from './pdf';

// ============ Convenience Functions ============

import { createReceipt, formatReceiptSummary, computeReceiptHash } from './generator';
import { signReceipt, addAttestation } from './signer';
import { pinToIPFS, anchorOnChain } from './storage';
import { verifyReceipt, formatVerificationResult } from './verifier';
import { AgentReceipt, CommerceContext } from './types';

/**
 * Complete flow: Create receipt, sign, pin, anchor, verify
 */
export async function createAndSignReceipt(params: {
  txHash: string;
  commerce: CommerceContext;
  buyerPrivateKey: string;
  sellerPrivateKey: string;
  buyerAddress: string;
  sellerAddress: string;
  anchor?: boolean;
  anchorPrivateKey?: string;
}): Promise<AgentReceipt> {
  console.log('🧾 Creating receipt...');
  
  // Create receipt
  let receipt = await createReceipt({
    txHash: params.txHash,
    commerce: params.commerce,
    buyerAgent: params.buyerAddress,
    sellerAgent: params.sellerAddress,
  });
  
  console.log('✍️ Collecting signatures...');
  
  // Buyer signs
  const buyerAttestation = await signReceipt({
    receipt,
    privateKey: params.buyerPrivateKey,
    role: 'buyer',
  });
  receipt = addAttestation(receipt, buyerAttestation);
  
  // Seller signs
  const sellerAttestation = await signReceipt({
    receipt,
    privateKey: params.sellerPrivateKey,
    role: 'seller',
  });
  receipt = addAttestation(receipt, sellerAttestation);
  
  console.log('📌 Pinning to IPFS...');
  
  // Pin to IPFS
  receipt.ipfsCid = await pinToIPFS(receipt);
  
  // Anchor on-chain if requested
  if (params.anchor && params.anchorPrivateKey) {
    console.log('⚓ Anchoring on-chain...');
    const { hash, txHash } = await anchorOnChain(receipt, params.anchorPrivateKey);
    receipt.onChainAnchor = hash;
    receipt.anchorTxHash = txHash;
  }
  
  console.log('✅ Receipt created and signed!');
  console.log(formatReceiptSummary(receipt));
  
  return receipt;
}

/**
 * Verify a receipt and print results
 */
export async function verifyAndPrint(receipt: AgentReceipt): Promise<boolean> {
  console.log('🔍 Verifying receipt...');
  
  const result = await verifyReceipt({ receipt });
  console.log(formatVerificationResult(result));
  
  return result.valid;
}

// Version
export const VERSION = '1.0.0';
