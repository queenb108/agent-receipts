/**
 * AgentReceipts - Type Definitions
 * USDC Hackathon - Agentic Commerce Track
 */

// ============ Layer 1: Transaction Proof ============

export interface TransactionProof {
  chain: 'base' | 'base-sepolia' | 'ethereum' | 'polygon';
  txHash: string;
  blockNumber: number;
  blockHash: string;
  timestamp: string; // ISO 8601
  from: string;
  to: string;
  amount: string; // Decimal string (e.g., "500.00")
  currency: 'USDC';
  gasUsed?: string;
}

// ============ Layer 2: Commerce Context ============

export type CommerceType = 
  | 'service_payment'
  | 'product_purchase'
  | 'subscription'
  | 'refund'
  | 'advance_payment'
  | 'milestone_payment'
  | 'bounty_payout'
  | 'team_split'
  | 'escrow_release'
  | 'other';

export type PaymentStatus =
  | 'paid_in_full'
  | 'partial_payment'
  | 'advance'
  | 'refund'
  | 'disputed'
  | 'cancelled';

export interface CommerceTerms {
  period?: string; // e.g., "30d", "1y"
  sla?: string; // e.g., "99.9% uptime"
  deliverables?: string[];
  refundConditions?: string;
  customTerms?: Record<string, string>;
}

export interface CommerceContext {
  type: CommerceType;
  description: string;
  orderReference?: string; // Hash of original order/agreement
  invoiceId?: string;
  terms?: CommerceTerms;
  status: PaymentStatus;
  metadata?: Record<string, unknown>;
}

// ============ Layer 3: Attestations ============

export interface Attestation {
  agent: string; // Agent wallet address
  agentId?: string; // Optional agent identifier (Moltbook ID, etc.)
  signature: string; // EIP-712 signature
  timestamp: string; // ISO 8601
  role: 'buyer' | 'seller' | 'witness' | 'arbiter';
}

// ============ Full Receipt ============

export interface AgentReceipt {
  receiptId: string; // UUID
  version: '1.0';
  createdAt: string; // ISO 8601
  
  // Layer 1
  transaction: TransactionProof;
  
  // Layer 2
  commerce: CommerceContext;
  
  // Layer 3
  attestations: Attestation[];
  
  // Anchoring
  ipfsCid?: string; // IPFS content identifier
  onChainAnchor?: string; // Hash stored on-chain
  anchorTxHash?: string; // Transaction that stored the anchor
}

// ============ Input Types ============

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

// ============ Output Types ============

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
  confidence: number; // 0-100
}

// ============ EIP-712 Types ============

export const RECEIPT_DOMAIN = {
  name: 'AgentReceipts',
  version: '1',
  chainId: 84532, // Base Sepolia
};

export const RECEIPT_TYPES = {
  Receipt: [
    { name: 'receiptId', type: 'string' },
    { name: 'txHash', type: 'string' },
    { name: 'amount', type: 'string' },
    { name: 'commerceType', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'status', type: 'string' },
    { name: 'timestamp', type: 'string' },
  ],
};
