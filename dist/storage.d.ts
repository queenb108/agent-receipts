/**
 * AgentReceipts - Storage Handler
 * IPFS pinning and on-chain anchoring
 */
import { AgentReceipt } from './types';
/**
 * Pin receipt to IPFS using web3.storage or Pinata
 * For hackathon demo, we'll use a simplified approach
 */
export declare function pinToIPFS(receipt: AgentReceipt): Promise<string>;
/**
 * Retrieve receipt from IPFS
 * In production, this would fetch from IPFS gateway
 */
export declare function fetchFromIPFS(cid: string): Promise<AgentReceipt | null>;
/**
 * Anchor receipt hash on-chain
 */
export declare function anchorOnChain(receipt: AgentReceipt, privateKey: string): Promise<{
    hash: string;
    txHash: string;
}>;
/**
 * Verify receipt anchor on-chain
 */
export declare function verifyOnChainAnchor(receipt: AgentReceipt): Promise<{
    exists: boolean;
    timestamp?: number;
    anchorer?: string;
}>;
/**
 * Set the anchor contract address (after deployment)
 */
export declare function setAnchorContract(address: string): void;
/**
 * Get current anchor contract address
 */
export declare function getAnchorContract(): string;
