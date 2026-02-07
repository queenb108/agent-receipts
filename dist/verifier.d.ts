/**
 * AgentReceipts - Receipt Verifier
 * Complete verification of receipts: transaction, signatures, anchors
 */
import { AgentReceipt, VerifyReceiptInput, VerificationResult } from './types';
/**
 * Full receipt verification
 */
export declare function verifyReceipt(input: VerifyReceiptInput): Promise<VerificationResult>;
/**
 * Quick verification (transaction only, no signatures)
 */
export declare function quickVerify(receipt: AgentReceipt): Promise<{
    valid: boolean;
    message: string;
}>;
/**
 * Format verification result for display
 */
export declare function formatVerificationResult(result: VerificationResult): string;
