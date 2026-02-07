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
export * from './types';
export { createReceipt, fetchTransactionProof, getReceiptSigningMessage, computeReceiptHash, formatReceiptSummary, } from './generator';
export { signReceipt, addAttestation, verifyAttestation, verifyAllAttestations, hasRequiredAttestations, generateTestWallet, } from './signer';
export { pinToIPFS, fetchFromIPFS, anchorOnChain, verifyOnChainAnchor, setAnchorContract, getAnchorContract, } from './storage';
export { verifyReceipt, quickVerify, formatVerificationResult, } from './verifier';
import { AgentReceipt, CommerceContext } from './types';
/**
 * Complete flow: Create receipt, sign, pin, anchor, verify
 */
export declare function createAndSignReceipt(params: {
    txHash: string;
    commerce: CommerceContext;
    buyerPrivateKey: string;
    sellerPrivateKey: string;
    buyerAddress: string;
    sellerAddress: string;
    anchor?: boolean;
    anchorPrivateKey?: string;
}): Promise<AgentReceipt>;
/**
 * Verify a receipt and print results
 */
export declare function verifyAndPrint(receipt: AgentReceipt): Promise<boolean>;
export declare const VERSION = "1.0.0";
