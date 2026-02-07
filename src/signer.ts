/**
 * AgentReceipts - Signature Handler
 * EIP-712 typed signatures for bilateral attestation
 */

import { 
  createWalletClient, 
  http, 
  type Hash,
} from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import {
  AgentReceipt,
  Attestation,
  SignReceiptInput,
  RECEIPT_DOMAIN,
  RECEIPT_TYPES,
} from './types';
import { getReceiptSigningMessage } from './generator';

/**
 * Sign a receipt as a specific role (buyer, seller, witness, arbiter)
 */
export async function signReceipt(
  input: SignReceiptInput
): Promise<Attestation> {
  const { receipt, privateKey, role } = input;
  
  // Create account from private key
  const account = privateKeyToAccount(privateKey as Hash);
  
  // Create wallet client
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http('https://sepolia.base.org'),
  });
  
  // Get the structured message to sign
  const typedData = getReceiptSigningMessage(receipt);
  
  // Sign using EIP-712
  const signature = await walletClient.signTypedData({
    account,
    domain: typedData.domain,
    types: typedData.types,
    primaryType: typedData.primaryType,
    message: typedData.message,
  });
  
  const attestation: Attestation = {
    agent: account.address,
    signature,
    timestamp: new Date().toISOString(),
    role,
  };
  
  return attestation;
}

/**
 * Add an attestation to a receipt
 */
export function addAttestation(
  receipt: AgentReceipt,
  attestation: Attestation
): AgentReceipt {
  // Check if this agent already attested
  const existing = receipt.attestations.find(
    a => a.agent.toLowerCase() === attestation.agent.toLowerCase()
  );
  
  if (existing) {
    throw new Error(`Agent ${attestation.agent} has already attested to this receipt`);
  }
  
  return {
    ...receipt,
    attestations: [...receipt.attestations, attestation],
  };
}

/**
 * Verify a single attestation signature
 */
export async function verifyAttestation(
  receipt: AgentReceipt,
  attestation: Attestation
): Promise<boolean> {
  const { verifyTypedData } = await import('viem');
  
  const typedData = getReceiptSigningMessage(receipt);
  
  try {
    const isValid = await verifyTypedData({
      address: attestation.agent as Hash,
      domain: typedData.domain,
      types: typedData.types,
      primaryType: typedData.primaryType,
      message: typedData.message,
      signature: attestation.signature as Hash,
    });
    
    return isValid;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Verify all attestations on a receipt
 */
export async function verifyAllAttestations(
  receipt: AgentReceipt
): Promise<{ valid: boolean; results: Map<string, boolean> }> {
  const results = new Map<string, boolean>();
  
  for (const attestation of receipt.attestations) {
    const isValid = await verifyAttestation(receipt, attestation);
    results.set(attestation.agent, isValid);
  }
  
  const allValid = Array.from(results.values()).every(v => v);
  
  return { valid: allValid, results };
}

/**
 * Check if receipt has required attestations (buyer + seller minimum)
 */
export function hasRequiredAttestations(receipt: AgentReceipt): boolean {
  const hasBuyer = receipt.attestations.some(a => a.role === 'buyer');
  const hasSeller = receipt.attestations.some(a => a.role === 'seller');
  
  return hasBuyer && hasSeller;
}

/**
 * Generate a test wallet for demo purposes
 */
export function generateTestWallet(): { address: string; privateKey: string } {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  
  return {
    address: account.address,
    privateKey,
  };
}
