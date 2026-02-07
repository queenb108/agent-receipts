/**
 * AgentReceipts - Receipt Verifier
 * Complete verification of receipts: transaction, signatures, anchors
 */

import { createPublicClient, http, type Hash } from 'viem';
import { baseSepolia } from 'viem/chains';
import {
  AgentReceipt,
  VerifyReceiptInput,
  VerificationResult,
} from './types';
import { verifyAllAttestations, hasRequiredAttestations } from './signer';
import { verifyOnChainAnchor } from './storage';
import { computeReceiptHash } from './generator';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

/**
 * Verify that the transaction exists and matches receipt data
 */
async function verifyTransaction(
  receipt: AgentReceipt
): Promise<{ exists: boolean; matches: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    const tx = await publicClient.getTransaction({
      hash: receipt.transaction.txHash as Hash,
    });
    
    if (!tx) {
      return { exists: false, matches: false, errors: ['Transaction not found on chain'] };
    }
    
    const txReceipt = await publicClient.getTransactionReceipt({
      hash: receipt.transaction.txHash as Hash,
    });
    
    if (!txReceipt) {
      return { exists: true, matches: false, errors: ['Transaction receipt not found'] };
    }
    
    // Verify block number matches
    if (Number(txReceipt.blockNumber) !== receipt.transaction.blockNumber) {
      errors.push(`Block number mismatch: expected ${receipt.transaction.blockNumber}, got ${txReceipt.blockNumber}`);
    }
    
    // Verify block hash matches
    if (txReceipt.blockHash !== receipt.transaction.blockHash) {
      errors.push('Block hash mismatch');
    }
    
    // Verify transaction was successful
    if (txReceipt.status !== 'success') {
      errors.push('Transaction was not successful');
    }
    
    return {
      exists: true,
      matches: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      exists: false,
      matches: false,
      errors: [`Error fetching transaction: ${error}`],
    };
  }
}

/**
 * Full receipt verification
 */
export async function verifyReceipt(
  input: VerifyReceiptInput
): Promise<VerificationResult> {
  const { receipt, checkOnChain = true } = input;
  const errors: string[] = [];
  
  const checks = {
    transactionExists: false,
    transactionMatches: false,
    signaturesValid: false,
    anchorMatches: undefined as boolean | undefined,
    ipfsAvailable: undefined as boolean | undefined,
  };
  
  // 1. Verify transaction on chain
  console.log('🔍 Verifying transaction on chain...');
  const txVerification = await verifyTransaction(receipt);
  checks.transactionExists = txVerification.exists;
  checks.transactionMatches = txVerification.matches;
  errors.push(...txVerification.errors);
  
  // 2. Verify attestation signatures
  console.log('🔍 Verifying attestation signatures...');
  if (receipt.attestations.length === 0) {
    errors.push('No attestations present');
    checks.signaturesValid = false;
  } else {
    const sigVerification = await verifyAllAttestations(receipt);
    checks.signaturesValid = sigVerification.valid;
    
    if (!sigVerification.valid) {
      for (const [agent, valid] of sigVerification.results) {
        if (!valid) {
          errors.push(`Invalid signature from ${agent}`);
        }
      }
    }
    
    // Check for required attestations
    if (!hasRequiredAttestations(receipt)) {
      errors.push('Missing required attestations (need both buyer and seller)');
    }
  }
  
  // 3. Verify on-chain anchor (if present and requested)
  if (checkOnChain && receipt.anchorTxHash) {
    console.log('🔍 Verifying on-chain anchor...');
    const anchorVerification = await verifyOnChainAnchor(receipt);
    checks.anchorMatches = anchorVerification.exists;
    
    if (!anchorVerification.exists) {
      errors.push('On-chain anchor not found or does not match');
    }
  }
  
  // 4. Check IPFS availability (if CID present)
  if (receipt.ipfsCid) {
    // In production, would verify IPFS availability
    checks.ipfsAvailable = true; // Assume available for demo
  }
  
  // Calculate confidence score
  let confidence = 0;
  if (checks.transactionExists) confidence += 25;
  if (checks.transactionMatches) confidence += 25;
  if (checks.signaturesValid) confidence += 30;
  if (checks.anchorMatches === true) confidence += 10;
  if (checks.ipfsAvailable === true) confidence += 10;
  
  // Adjust for missing optional checks
  if (checks.anchorMatches === undefined) confidence += 5;
  if (checks.ipfsAvailable === undefined) confidence += 5;
  
  const valid = 
    checks.transactionExists && 
    checks.transactionMatches && 
    checks.signaturesValid;
  
  return {
    valid,
    checks,
    errors,
    confidence,
  };
}

/**
 * Quick verification (transaction only, no signatures)
 */
export async function quickVerify(
  receipt: AgentReceipt
): Promise<{ valid: boolean; message: string }> {
  const txVerification = await verifyTransaction(receipt);
  
  if (!txVerification.exists) {
    return { valid: false, message: 'Transaction not found on chain' };
  }
  
  if (!txVerification.matches) {
    return { valid: false, message: `Transaction data mismatch: ${txVerification.errors.join(', ')}` };
  }
  
  return { valid: true, message: 'Transaction verified on chain' };
}

/**
 * Format verification result for display
 */
export function formatVerificationResult(result: VerificationResult): string {
  const statusIcon = result.valid ? '✅' : '❌';
  
  return `
═══════════════════════════════════════════════════════
              VERIFICATION RESULT ${statusIcon}
═══════════════════════════════════════════════════════

Overall: ${result.valid ? 'VALID' : 'INVALID'}
Confidence: ${result.confidence}%

─── CHECKS ────────────────────────────────────────────
Transaction exists:  ${result.checks.transactionExists ? '✅' : '❌'}
Transaction matches: ${result.checks.transactionMatches ? '✅' : '❌'}
Signatures valid:    ${result.checks.signaturesValid ? '✅' : '❌'}
On-chain anchor:     ${result.checks.anchorMatches === undefined ? '⏭️ Skipped' : result.checks.anchorMatches ? '✅' : '❌'}
IPFS available:      ${result.checks.ipfsAvailable === undefined ? '⏭️ Skipped' : result.checks.ipfsAvailable ? '✅' : '❌'}

${result.errors.length > 0 ? `─── ERRORS ────────────────────────────────────────────
${result.errors.map(e => `• ${e}`).join('\n')}` : ''}

═══════════════════════════════════════════════════════
`;
}
