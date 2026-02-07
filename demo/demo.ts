/**
 * AgentReceipts Demo
 * 
 * Demonstrates the complete flow:
 * 1. Two agents transact USDC
 * 2. Receipt is generated with commerce context
 * 3. Both agents sign (bilateral attestation)
 * 4. Receipt is pinned to IPFS
 * 5. Third agent verifies the receipt
 */

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

// Import from our library
import {
  createReceipt,
  signReceipt,
  addAttestation,
  pinToIPFS,
  verifyReceipt,
  formatReceiptSummary,
  formatVerificationResult,
  AgentReceipt,
  CommerceContext,
} from '../src';

// Demo configuration
const DEMO_TX_HASH = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           AgentReceipts - Demo Flow                           ║
║           Agent-Native Receipt & Proof Generator               ║
╚═══════════════════════════════════════════════════════════════╝
`);

  // === Step 1: Setup Agents ===
  console.log('📋 Step 1: Setting up demo agents...\n');
  
  const buyerPrivateKey = generatePrivateKey();
  const sellerPrivateKey = generatePrivateKey();
  const verifierPrivateKey = generatePrivateKey();
  
  const buyerAccount = privateKeyToAccount(buyerPrivateKey);
  const sellerAccount = privateKeyToAccount(sellerPrivateKey);
  const verifierAccount = privateKeyToAccount(verifierPrivateKey);
  
  console.log(`  🤖 Buyer Agent:    ${buyerAccount.address}`);
  console.log(`  🤖 Seller Agent:   ${sellerAccount.address}`);
  console.log(`  🤖 Verifier Agent: ${verifierAccount.address}`);
  console.log();

  // === Step 2: Define Commerce Context ===
  console.log('📋 Step 2: Defining commerce context...\n');
  
  const commerce: CommerceContext = {
    type: 'service_payment',
    description: 'Premium AI data analysis - 30 day subscription',
    orderReference: '0xabc123def456...',
    terms: {
      period: '30d',
      sla: '99.9% uptime',
      deliverables: ['Daily reports', 'API access', '24/7 support'],
      refundConditions: 'Pro-rata if SLA breached',
    },
    status: 'paid_in_full',
    metadata: {
      tier: 'premium',
      startDate: '2026-02-08',
    },
  };
  
  console.log('  Commerce Type:', commerce.type);
  console.log('  Description:', commerce.description);
  console.log('  Status:', commerce.status);
  console.log();

  // === Step 3: Create Receipt ===
  console.log('📋 Step 3: Creating receipt from transaction...\n');
  
  // Note: In production, this would fetch real tx data from chain
  // For demo, we'll create a mock receipt
  const mockReceipt: AgentReceipt = {
    receiptId: '550e8400-e29b-41d4-a716-446655440000',
    version: '1.0',
    createdAt: new Date().toISOString(),
    transaction: {
      chain: 'base-sepolia',
      txHash: DEMO_TX_HASH,
      blockNumber: 12345678,
      blockHash: '0xblock123...',
      timestamp: new Date().toISOString(),
      from: buyerAccount.address,
      to: sellerAccount.address,
      amount: '500.00',
      currency: 'USDC',
    },
    commerce,
    attestations: [],
  };
  
  console.log('  ✅ Receipt created');
  console.log('  Receipt ID:', mockReceipt.receiptId);
  console.log();

  // === Step 4: Collect Signatures ===
  console.log('📋 Step 4: Collecting bilateral signatures...\n');
  
  let receipt = mockReceipt;
  
  // Buyer signs
  console.log('  ✍️  Buyer signing...');
  const buyerAttestation = await signReceipt({
    receipt,
    privateKey: buyerPrivateKey,
    role: 'buyer',
  });
  receipt = addAttestation(receipt, buyerAttestation);
  console.log('     Signature:', buyerAttestation.signature.slice(0, 20) + '...');
  
  // Seller signs
  console.log('  ✍️  Seller signing...');
  const sellerAttestation = await signReceipt({
    receipt,
    privateKey: sellerPrivateKey,
    role: 'seller',
  });
  receipt = addAttestation(receipt, sellerAttestation);
  console.log('     Signature:', sellerAttestation.signature.slice(0, 20) + '...');
  console.log();

  // === Step 5: Pin to IPFS ===
  console.log('📋 Step 5: Pinning to IPFS...\n');
  
  receipt.ipfsCid = await pinToIPFS(receipt);
  console.log();

  // === Step 6: Display Final Receipt ===
  console.log('📋 Step 6: Final receipt...');
  console.log(formatReceiptSummary(receipt));

  // === Step 7: Third Agent Verifies ===
  console.log('📋 Step 7: Verifier agent checking receipt...\n');
  
  console.log(`  🔍 Verifier ${verifierAccount.address.slice(0, 10)}... is checking...`);
  console.log();
  
  // Note: Full verification requires real tx on chain
  // For demo, we'll do signature verification
  const verificationResult = await verifyReceipt({ 
    receipt, 
    checkOnChain: false, // Skip on-chain check for demo
  });
  
  console.log(formatVerificationResult(verificationResult));

  // === Summary ===
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                     Demo Complete! ✅                          ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  What we demonstrated:                                        ║
║                                                               ║
║  1. Created a structured receipt from a USDC transaction      ║
║  2. Added commerce context (what was bought, terms, etc.)     ║
║  3. Collected bilateral signatures (EIP-712)                  ║
║  4. Pinned receipt to IPFS for permanent storage              ║
║  5. Independent agent verified the receipt                    ║
║                                                               ║
║  This is the foundation for:                                  ║
║  • Dispute resolution (bilateral proof)                       ║
║  • Credit history (verified transaction records)              ║
║  • Tax/compliance (structured commercial records)             ║
║  • Agent-to-agent trust (portable receipts)                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
}

main().catch(console.error);
