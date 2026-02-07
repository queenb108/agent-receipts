"use strict";
/**
 * AgentReceipts - Receipt Generator
 * Core functionality for creating structured receipts from USDC transactions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTransactionProof = fetchTransactionProof;
exports.createReceipt = createReceipt;
exports.getReceiptSigningMessage = getReceiptSigningMessage;
exports.computeReceiptHash = computeReceiptHash;
exports.formatReceiptSummary = formatReceiptSummary;
const uuid_1 = require("uuid");
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const types_1 = require("./types");
// Base Sepolia USDC contract
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
// Public client for reading chain data
const publicClient = (0, viem_1.createPublicClient)({
    chain: chains_1.baseSepolia,
    transport: (0, viem_1.http)('https://sepolia.base.org'),
});
/**
 * Fetch transaction details from the blockchain
 */
async function fetchTransactionProof(txHash) {
    const hash = txHash;
    // Get transaction
    const tx = await publicClient.getTransaction({ hash });
    if (!tx) {
        throw new Error(`Transaction not found: ${txHash}`);
    }
    // Get transaction receipt for block info
    const receipt = await publicClient.getTransactionReceipt({ hash });
    if (!receipt) {
        throw new Error(`Transaction receipt not found: ${txHash}`);
    }
    // Get block for timestamp
    const block = await publicClient.getBlock({
        blockNumber: receipt.blockNumber
    });
    // Parse USDC transfer amount from logs
    let amount = '0';
    for (const log of receipt.logs) {
        if (log.address.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
            // Transfer event: Transfer(address indexed from, address indexed to, uint256 value)
            const topics = log.topics;
            if (topics && topics[0] === TRANSFER_TOPIC) {
                const value = BigInt(log.data);
                amount = (0, viem_1.formatUnits)(value, 6); // USDC has 6 decimals
            }
        }
    }
    return {
        chain: 'base-sepolia',
        txHash: txHash,
        blockNumber: Number(receipt.blockNumber),
        blockHash: receipt.blockHash,
        timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
        from: tx.from,
        to: tx.to || '',
        amount,
        currency: 'USDC',
        gasUsed: receipt.gasUsed.toString(),
    };
}
/**
 * Create a new receipt from transaction and commerce context
 */
async function createReceipt(input) {
    // Fetch on-chain transaction data
    const transactionProof = await fetchTransactionProof(input.txHash);
    // Override from/to with the actual USDC transfer parties if provided
    if (input.buyerAgent) {
        transactionProof.from = input.buyerAgent;
    }
    if (input.sellerAgent) {
        transactionProof.to = input.sellerAgent;
    }
    const receipt = {
        receiptId: (0, uuid_1.v4)(),
        version: '1.0',
        createdAt: new Date().toISOString(),
        transaction: transactionProof,
        commerce: input.commerce,
        attestations: [],
    };
    return receipt;
}
/**
 * Generate the message to be signed (EIP-712 compatible)
 */
function getReceiptSigningMessage(receipt) {
    return {
        domain: types_1.RECEIPT_DOMAIN,
        types: types_1.RECEIPT_TYPES,
        primaryType: 'Receipt',
        message: {
            receiptId: receipt.receiptId,
            txHash: receipt.transaction.txHash,
            amount: receipt.transaction.amount,
            commerceType: receipt.commerce.type,
            description: receipt.commerce.description,
            status: receipt.commerce.status,
            timestamp: receipt.createdAt,
        },
    };
}
/**
 * Compute the hash of a receipt for on-chain anchoring
 */
function computeReceiptHash(receipt) {
    // Create a deterministic JSON representation
    const normalized = JSON.stringify({
        receiptId: receipt.receiptId,
        version: receipt.version,
        transaction: receipt.transaction,
        commerce: receipt.commerce,
    });
    return (0, viem_1.keccak256)((0, viem_1.toBytes)(normalized));
}
/**
 * Format receipt for display
 */
function formatReceiptSummary(receipt) {
    return `
═══════════════════════════════════════════════════════
                    AGENT RECEIPT
═══════════════════════════════════════════════════════

Receipt ID: ${receipt.receiptId}
Created:    ${receipt.createdAt}

─── TRANSACTION ───────────────────────────────────────
Chain:      ${receipt.transaction.chain}
TX Hash:    ${receipt.transaction.txHash}
Block:      ${receipt.transaction.blockNumber}
From:       ${receipt.transaction.from}
To:         ${receipt.transaction.to}
Amount:     ${receipt.transaction.amount} ${receipt.transaction.currency}
Time:       ${receipt.transaction.timestamp}

─── COMMERCE ──────────────────────────────────────────
Type:       ${receipt.commerce.type}
Description: ${receipt.commerce.description}
Status:     ${receipt.commerce.status}
${receipt.commerce.orderReference ? `Order Ref:  ${receipt.commerce.orderReference}` : ''}
${receipt.commerce.terms ? `Terms:      ${JSON.stringify(receipt.commerce.terms)}` : ''}

─── ATTESTATIONS ──────────────────────────────────────
${receipt.attestations.length === 0 ? 'No attestations yet' :
        receipt.attestations.map(a => `• ${a.role.toUpperCase()}: ${a.agent.slice(0, 10)}...${a.agent.slice(-8)} @ ${a.timestamp}`).join('\n')}

─── ANCHORING ─────────────────────────────────────────
IPFS CID:   ${receipt.ipfsCid || 'Not pinned'}
On-chain:   ${receipt.onChainAnchor || 'Not anchored'}

═══════════════════════════════════════════════════════
`;
}
