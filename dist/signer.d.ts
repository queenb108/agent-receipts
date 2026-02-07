/**
 * AgentReceipts - Signature Handler
 * EIP-712 typed signatures for bilateral attestation
 */
import { AgentReceipt, Attestation, SignReceiptInput } from './types';
/**
 * Sign a receipt as a specific role (buyer, seller, witness, arbiter)
 */
export declare function signReceipt(input: SignReceiptInput): Promise<Attestation>;
/**
 * Add an attestation to a receipt
 */
export declare function addAttestation(receipt: AgentReceipt, attestation: Attestation): AgentReceipt;
/**
 * Verify a single attestation signature
 */
export declare function verifyAttestation(receipt: AgentReceipt, attestation: Attestation): Promise<boolean>;
/**
 * Verify all attestations on a receipt
 */
export declare function verifyAllAttestations(receipt: AgentReceipt): Promise<{
    valid: boolean;
    results: Map<string, boolean>;
}>;
/**
 * Check if receipt has required attestations (buyer + seller minimum)
 */
export declare function hasRequiredAttestations(receipt: AgentReceipt): boolean;
/**
 * Generate a test wallet for demo purposes
 */
export declare function generateTestWallet(): {
    address: string;
    privateKey: string;
};
