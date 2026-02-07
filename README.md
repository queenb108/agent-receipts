# AgentReceipts 🧾

**Agent-Native Receipt & Proof Generator**

*Structured, verifiable receipts for USDC agent commerce*

## 🎯 The Problem

When humans transact, we get receipts — bank statements, email confirmations, PDF invoices. These are human-readable but not machine-verifiable.

When agents transact USDC on-chain, the raw transaction data exists but it's just hashes, addresses, and amounts. There's no structured, semantically rich receipt that another agent can independently parse, verify, and act on.

**This gap matters the moment agents start doing real commerce.**

Agent A pays Agent B 500 USDC for a data feed. Later, Agent C needs to verify that payment happened, what it was for, and whether the terms were met. Right now, Agent C has to parse raw blockchain data and guess at context.

There's no standard "proof of commerce" layer.

**Until now.**

## 💡 The Solution

AgentReceipts transforms raw USDC transactions into semantically rich, bilaterally-signed proof-of-commerce documents.

### Three Layers

**Layer 1: Transaction Proof**
The on-chain facts — transaction hash, block number, sender, receiver, amount, chain ID, timestamp. Independently verifiable by any agent.

**Layer 2: Commerce Context**
The semantic layer that gives meaning to the transaction:
- What was purchased (service type, description)
- Agreed terms (price, delivery conditions, SLA)
- Reference to original agreement
- Payment status (full, partial, advance, refund)

**Layer 3: Attestation**
Both agents sign the receipt, confirming they agree on the commerce context. Creates bilateral proof — not just "money moved" but "both parties agree on why money moved."

## 🏗 Architecture

```
┌─────────────────┐
│  Agent A pays   │
│  Agent B USDC   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Receipt Skill   │
│ - Fetch tx data │
│ - Add commerce  │
│ - Get signatures│
│ - Pin to IPFS   │
│ - Anchor hash   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verifier Agent  │
│ - Check tx      │
│ - Verify sigs   │
│ - Match anchor  │
└─────────────────┘
```

## 📋 Receipt Format

```json
{
  "receiptId": "uuid",
  "version": "1.0",
  "transaction": {
    "chain": "base-sepolia",
    "txHash": "0x...",
    "blockNumber": 12345678,
    "timestamp": "2026-02-08T10:00:00Z",
    "from": "0xBuyerAgent",
    "to": "0xSellerAgent",
    "amount": "500.00",
    "currency": "USDC"
  },
  "commerce": {
    "type": "service_payment",
    "description": "Premium data feed - 30 day access",
    "orderReference": "0xHashOfOriginalOrder",
    "terms": {
      "period": "30d",
      "sla": "99.9% uptime"
    },
    "status": "paid_in_full"
  },
  "attestations": [
    {
      "agent": "0xBuyerAgent",
      "signature": "0x...",
      "timestamp": "2026-02-08T10:00:05Z",
      "role": "buyer"
    },
    {
      "agent": "0xSellerAgent",
      "signature": "0x...",
      "timestamp": "2026-02-08T10:00:07Z",
      "role": "seller"
    }
  ],
  "ipfsCid": "bafyreig...",
  "onChainAnchor": "0x..."
}
```

## 🚀 Quick Start

### Installation

```bash
npm install agent-receipts
```

### Create a Receipt

```typescript
import { 
  createReceipt, 
  signReceipt, 
  addAttestation,
  pinToIPFS,
  verifyReceipt 
} from 'agent-receipts';

// 1. Create receipt from transaction
const receipt = await createReceipt({
  txHash: '0x...',
  commerce: {
    type: 'service_payment',
    description: 'Premium data feed subscription',
    status: 'paid_in_full',
  },
  buyerAgent: '0xBuyer...',
  sellerAgent: '0xSeller...',
});

// 2. Buyer signs
const buyerAttestation = await signReceipt({
  receipt,
  privateKey: buyerPrivateKey,
  role: 'buyer',
});
receipt = addAttestation(receipt, buyerAttestation);

// 3. Seller signs
const sellerAttestation = await signReceipt({
  receipt,
  privateKey: sellerPrivateKey,
  role: 'seller',
});
receipt = addAttestation(receipt, sellerAttestation);

// 4. Pin to IPFS
receipt.ipfsCid = await pinToIPFS(receipt);

// 5. Verify
const result = await verifyReceipt({ receipt });
console.log(result.valid); // true
```

## 🔍 Verification

Any agent can verify a receipt:

```typescript
import { verifyReceipt, formatVerificationResult } from 'agent-receipts';

const result = await verifyReceipt({ receipt });

console.log(formatVerificationResult(result));
// ═══════════════════════════════════════════════════════
//               VERIFICATION RESULT ✅
// ═══════════════════════════════════════════════════════
// 
// Overall: VALID
// Confidence: 95%
// 
// ─── CHECKS ────────────────────────────────────────────
// Transaction exists:  ✅
// Transaction matches: ✅
// Signatures valid:    ✅
// On-chain anchor:     ✅
// IPFS available:      ✅
```

## 🎯 Why Agents Need This

| Use Case | How Receipts Help |
|----------|-------------------|
| **Dispute Resolution** | Bilateral receipt is source of truth. No he-said-she-said. |
| **Credit History** | Present verified receipts to factoring agents. Prove transaction volume and reliability. |
| **Tax & Compliance** | Structured records for human owners' regulatory reporting. |
| **Cross-Chain** | Tie CCTP transfers into single commercial records. |
| **Agent Trust** | "Show me your last 50 receipts" = agent credit check. |

## 📁 Project Structure

```
agent-receipts/
├── src/
│   ├── index.ts      # Main exports
│   ├── types.ts      # TypeScript interfaces
│   ├── generator.ts  # Receipt creation
│   ├── signer.ts     # EIP-712 signatures
│   ├── storage.ts    # IPFS + on-chain anchoring
│   └── verifier.ts   # Receipt verification
├── demo/
│   └── demo.ts       # Full demo flow
└── README.md
```

## 🔧 Technical Details

- **Chain**: Base Sepolia (testnet)
- **Token**: USDC (0x036CbD53842c5426634e7929541eC2318f3dCF7e)
- **Anchor Contract**: `0x91f67417A9DC2Af96a217aA6F7721f8951f9F4Dd`
- **Block Explorer**: [View on Basescan](https://sepolia.basescan.org/address/0x91f67417A9DC2Af96a217aA6F7721f8951f9F4Dd)
- **Signatures**: EIP-712 typed data
- **Storage**: IPFS (content-addressed)
- **Anchoring**: On-chain via ReceiptAnchor contract

## 📜 License

MIT

## 👑 Author

**Queen-B** — Building infrastructure for the agent economy.

*"Every transaction deserves a receipt."*

---

**#USDCHackathon | Agentic Commerce Track**
