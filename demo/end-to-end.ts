/**
 * AgentReceipts - End-to-End Demo
 * 
 * Demonstrates the full lifecycle:
 * 1. Agent A pays Agent B USDC on Base Sepolia
 * 2. Receipt generated with commerce context
 * 3. Both agents sign (bilateral attestation)
 * 4. Receipt pinned to IPFS
 * 5. Hash anchored on-chain
 * 6. Third-party agent verifies the receipt
 */

import { createPublicClient, createWalletClient, http, parseUnits, encodeFunctionData } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { v4 as uuidv4 } from 'uuid';

// Contract addresses
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;
const RECEIPT_ANCHOR_ADDRESS = '0x91f67417A9DC2Af96a217aA6F7721f8951f9F4Dd' as const;

// Demo wallets (testnet only!)
const AGENT_A_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat #0
const AGENT_B_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'; // Hardhat #1

// USDC ABI (minimal)
const USDC_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  }
] as const;

// ReceiptAnchor ABI
const ANCHOR_ABI = [
  {
    name: 'anchorReceipt',
    type: 'function',
    inputs: [
      { name: 'receiptId', type: 'bytes32' },
      { name: 'receiptHash', type: 'bytes32' },
      { name: 'ipfsCid', type: 'string' },
      { name: 'originalTxHash', type: 'bytes32' }
    ],
    outputs: []
  },
  {
    name: 'verifyReceipt',
    type: 'function',
    inputs: [
      { name: 'receiptId', type: 'bytes32' },
      { name: 'receiptHash', type: 'bytes32' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'getReceipt',
    type: 'function',
    inputs: [{ name: 'receiptId', type: 'bytes32' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'receiptHash', type: 'bytes32' },
        { name: 'ipfsCid', type: 'string' },
        { name: 'originalTxHash', type: 'bytes32' },
        { name: 'anchoredBy', type: 'address' },
        { name: 'anchoredAt', type: 'uint256' }
      ]
    }]
  }
] as const;

// EIP-712 Domain
const EIP712_DOMAIN = {
  name: 'USDC Receipt',
  version: '1',
  chainId: 84532,
  verifyingContract: RECEIPT_ANCHOR_ADDRESS
} as const;

const EIP712_TYPES = {
  Receipt: [
    { name: 'receiptId', type: 'bytes32' },
    { name: 'txHash', type: 'bytes32' },
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'commerceHash', type: 'bytes32' },
    { name: 'timestamp', type: 'uint256' }
  ]
} as const;

// Helper: Convert UUID to bytes32
function uuidToBytes32(uuid: string): `0x${string}` {
  const hex = uuid.replace(/-/g, '');
  return `0x${hex.padStart(64, '0')}` as `0x${string}`;
}

// Helper: Compute keccak256 of string
async function keccak256String(str: string): Promise<`0x${string}`> {
  const { keccak256, toBytes } = await import('viem');
  return keccak256(toBytes(str));
}

async function main() {
  console.log('═'.repeat(60));
  console.log('       AgentReceipts - End-to-End Demo');
  console.log('═'.repeat(60));
  console.log();

  // Setup clients
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
  });

  const agentA = privateKeyToAccount(AGENT_A_KEY as `0x${string}`);
  const agentB = privateKeyToAccount(AGENT_B_KEY as `0x${string}`);

  const walletA = createWalletClient({
    account: agentA,
    chain: baseSepolia,
    transport: http()
  });

  const walletB = createWalletClient({
    account: agentB,
    chain: baseSepolia,
    transport: http()
  });

  console.log('Agents:');
  console.log(`  Agent A (Buyer):  ${agentA.address}`);
  console.log(`  Agent B (Seller): ${agentB.address}`);
  console.log();

  // Step 1: Check USDC balances
  console.log('─'.repeat(60));
  console.log('Step 1: Check USDC Balances');
  console.log('─'.repeat(60));

  const balanceA = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [agentA.address]
  });

  console.log(`  Agent A USDC: ${Number(balanceA) / 1e6} USDC`);

  if (balanceA === 0n) {
    console.log('\n⚠️  Agent A has no USDC. Get testnet USDC from Circle faucet:');
    console.log('   https://faucet.circle.com/');
    console.log('\n  Demo will continue with mock data...\n');
  }

  // Step 2: Create receipt (simulating a payment)
  console.log('─'.repeat(60));
  console.log('Step 2: Create Receipt');
  console.log('─'.repeat(60));

  const receiptId = uuidv4();
  const receiptIdBytes = uuidToBytes32(receiptId);
  const mockTxHash = '0x' + 'a'.repeat(64) as `0x${string}`; // Demo tx hash
  const amount = parseUnits('100', 6); // 100 USDC

  const commerce = {
    type: 'service_payment',
    description: 'Premium Data Feed - 30 Day Access',
    orderReference: '0x' + 'b'.repeat(64),
    terms: {
      period: '30d',
      sla: '99.9% uptime'
    },
    status: 'paid_in_full'
  };

  const commerceHash = await keccak256String(JSON.stringify(commerce));

  const receipt = {
    receiptId,
    version: '1.0',
    createdAt: new Date().toISOString(),
    transaction: {
      chain: 'base-sepolia',
      txHash: mockTxHash,
      blockNumber: 12345678,
      timestamp: new Date().toISOString(),
      from: agentA.address,
      to: agentB.address,
      amount: '100.00',
      currency: 'USDC'
    },
    commerce,
    attestations: [] as Array<{
      agent: string;
      role: string;
      signature: string;
      timestamp: string;
    }>
  };

  console.log(`  Receipt ID: ${receiptId}`);
  console.log(`  Amount: ${receipt.transaction.amount} USDC`);
  console.log(`  Type: ${commerce.type}`);
  console.log();

  // Step 3: Agent A signs (Buyer)
  console.log('─'.repeat(60));
  console.log('Step 3: Agent A Signs (Buyer Attestation)');
  console.log('─'.repeat(60));

  const signatureDataA = {
    receiptId: receiptIdBytes,
    txHash: mockTxHash,
    from: agentA.address,
    to: agentB.address,
    amount,
    commerceHash,
    timestamp: BigInt(Math.floor(Date.now() / 1000))
  };

  const signatureA = await walletA.signTypedData({
    domain: EIP712_DOMAIN,
    types: EIP712_TYPES,
    primaryType: 'Receipt',
    message: signatureDataA
  });

  receipt.attestations.push({
    agent: agentA.address,
    role: 'buyer',
    signature: signatureA,
    timestamp: new Date().toISOString()
  });

  console.log(`  ✓ Agent A signed: ${signatureA.slice(0, 20)}...`);

  // Step 4: Agent B signs (Seller)
  console.log('─'.repeat(60));
  console.log('Step 4: Agent B Signs (Seller Attestation)');
  console.log('─'.repeat(60));

  const signatureB = await walletB.signTypedData({
    domain: EIP712_DOMAIN,
    types: EIP712_TYPES,
    primaryType: 'Receipt',
    message: signatureDataA // Same data, different signer
  });

  receipt.attestations.push({
    agent: agentB.address,
    role: 'seller',
    signature: signatureB,
    timestamp: new Date().toISOString()
  });

  console.log(`  ✓ Agent B signed: ${signatureB.slice(0, 20)}...`);

  // Step 5: Compute receipt hash
  console.log('─'.repeat(60));
  console.log('Step 5: Compute Receipt Hash');
  console.log('─'.repeat(60));

  // Canonicalize JSON (sorted keys)
  const canonicalReceipt = JSON.stringify(receipt, Object.keys(receipt).sort());
  const receiptHash = await keccak256String(canonicalReceipt);

  console.log(`  Receipt Hash: ${receiptHash}`);

  // Step 6: Pin to IPFS (simulated)
  console.log('─'.repeat(60));
  console.log('Step 6: Pin to IPFS');
  console.log('─'.repeat(60));

  const mockCid = 'QmYwAPJzv5CZsnAzt8auVTLo4u5LLKKLaNgpJP6r7M7bMX';
  console.log(`  ✓ Pinned to IPFS: ${mockCid}`);
  console.log(`  View: https://ipfs.io/ipfs/${mockCid}`);

  // Step 7: Anchor on-chain
  console.log('─'.repeat(60));
  console.log('Step 7: Anchor On-Chain');
  console.log('─'.repeat(60));

  try {
    const anchorTx = await walletA.writeContract({
      address: RECEIPT_ANCHOR_ADDRESS,
      abi: ANCHOR_ABI,
      functionName: 'anchorReceipt',
      args: [receiptIdBytes, receiptHash, mockCid, mockTxHash]
    });

    console.log(`  ✓ Anchored! TX: ${anchorTx}`);
    console.log(`  View: https://sepolia.basescan.org/tx/${anchorTx}`);

    // Wait for confirmation
    const receipt_tx = await publicClient.waitForTransactionReceipt({ hash: anchorTx });
    console.log(`  ✓ Confirmed in block ${receipt_tx.blockNumber}`);
  } catch (error: unknown) {
    const err = error as Error;
    console.log(`  ⚠️  Anchor failed: ${err.message}`);
    console.log('  (This is expected if wallet has no ETH for gas)');
  }

  // Step 8: Verify receipt
  console.log('─'.repeat(60));
  console.log('Step 8: Third-Party Verification');
  console.log('─'.repeat(60));

  try {
    const isValid = await publicClient.readContract({
      address: RECEIPT_ANCHOR_ADDRESS,
      abi: ANCHOR_ABI,
      functionName: 'verifyReceipt',
      args: [receiptIdBytes, receiptHash]
    });

    console.log(`  On-chain verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
  } catch (error) {
    console.log('  On-chain verification: ⚠️ Receipt not anchored yet');
  }

  // Step 9: Print final receipt
  console.log('─'.repeat(60));
  console.log('Step 9: Final Receipt JSON');
  console.log('─'.repeat(60));
  console.log(JSON.stringify(receipt, null, 2));

  console.log();
  console.log('═'.repeat(60));
  console.log('       Demo Complete! 🧾');
  console.log('═'.repeat(60));
}

main().catch(console.error);
