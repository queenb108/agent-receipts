/**
 * AgentReceipts - Receipt Generator
 * Core functionality for creating structured receipts from USDC transactions
 */
import { AgentReceipt, TransactionProof, CreateReceiptInput, RECEIPT_DOMAIN, RECEIPT_TYPES } from './types';
/**
 * Fetch transaction details from the blockchain
 */
export declare function fetchTransactionProof(txHash: string): Promise<TransactionProof>;
/**
 * Create a new receipt from transaction and commerce context
 */
export declare function createReceipt(input: CreateReceiptInput): Promise<AgentReceipt>;
/**
 * Generate the message to be signed (EIP-712 compatible)
 */
export declare function getReceiptSigningMessage(receipt: AgentReceipt): {
    domain: typeof RECEIPT_DOMAIN;
    types: typeof RECEIPT_TYPES;
    primaryType: 'Receipt';
    message: Record<string, string>;
};
/**
 * Compute the hash of a receipt for on-chain anchoring
 */
export declare function computeReceiptHash(receipt: AgentReceipt): string;
/**
 * Format receipt for display
 */
export declare function formatReceiptSummary(receipt: AgentReceipt): string;
