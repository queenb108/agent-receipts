/**
 * AgentReceipts - Type Definitions
 * USDC Hackathon - Agentic Commerce Track
 */
export interface TransactionProof {
    chain: 'base' | 'base-sepolia' | 'ethereum' | 'polygon';
    txHash: string;
    blockNumber: number;
    blockHash: string;
    timestamp: string;
    from: string;
    to: string;
    amount: string;
    currency: 'USDC';
    gasUsed?: string;
}
export type CommerceType = 'service_payment' | 'product_purchase' | 'subscription' | 'refund' | 'advance_payment' | 'milestone_payment' | 'bounty_payout' | 'team_split' | 'escrow_release' | 'other';
export type PaymentStatus = 'paid_in_full' | 'partial_payment' | 'advance' | 'refund' | 'disputed' | 'cancelled';
export interface CommerceTerms {
    period?: string;
    sla?: string;
    deliverables?: string[];
    refundConditions?: string;
    customTerms?: Record<string, string>;
}
export interface CommerceContext {
    type: CommerceType;
    description: string;
    orderReference?: string;
    invoiceId?: string;
    terms?: CommerceTerms;
    status: PaymentStatus;
    metadata?: Record<string, unknown>;
}
export interface Attestation {
    agent: string;
    agentId?: string;
    signature: string;
    timestamp: string;
    role: 'buyer' | 'seller' | 'witness' | 'arbiter';
}
export interface AgentReceipt {
    receiptId: string;
    version: '1.0';
    createdAt: string;
    transaction: TransactionProof;
    commerce: CommerceContext;
    attestations: Attestation[];
    ipfsCid?: string;
    onChainAnchor?: string;
    anchorTxHash?: string;
}
export interface CreateReceiptInput {
    txHash: string;
    chain?: 'base' | 'base-sepolia';
    commerce: CommerceContext;
    buyerAgent: string;
    sellerAgent: string;
}
export interface SignReceiptInput {
    receipt: AgentReceipt;
    privateKey: string;
    role: 'buyer' | 'seller' | 'witness' | 'arbiter';
}
export interface VerifyReceiptInput {
    receipt: AgentReceipt;
    checkOnChain?: boolean;
}
export interface VerificationResult {
    valid: boolean;
    checks: {
        transactionExists: boolean;
        transactionMatches: boolean;
        signaturesValid: boolean;
        anchorMatches?: boolean;
        ipfsAvailable?: boolean;
    };
    errors: string[];
    confidence: number;
}
export declare const RECEIPT_DOMAIN: {
    name: string;
    version: string;
    chainId: number;
};
export declare const RECEIPT_TYPES: {
    Receipt: {
        name: string;
        type: string;
    }[];
};
