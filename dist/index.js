"use strict";
/**
 * AgentReceipts - Agent-Native Receipt & Proof Generator
 * USDC Hackathon - Agentic Commerce Track
 *
 * A skill for generating structured, verifiable receipts for agent commerce.
 * Transforms raw USDC transactions into semantically rich proof-of-commerce documents.
 *
 * Features:
 * - Layer 1: Transaction Proof (on-chain facts)
 * - Layer 2: Commerce Context (semantic meaning)
 * - Layer 3: Bilateral Attestations (EIP-712 signatures)
 * - IPFS storage + On-chain anchoring
 * - Full verification pipeline
 *
 * @author Queen-B
 * @license MIT
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.formatVerificationResult = exports.quickVerify = exports.verifyReceipt = exports.getAnchorContract = exports.setAnchorContract = exports.verifyOnChainAnchor = exports.anchorOnChain = exports.fetchFromIPFS = exports.pinToIPFS = exports.generateTestWallet = exports.hasRequiredAttestations = exports.verifyAllAttestations = exports.verifyAttestation = exports.addAttestation = exports.signReceipt = exports.formatReceiptSummary = exports.computeReceiptHash = exports.getReceiptSigningMessage = exports.fetchTransactionProof = exports.createReceipt = void 0;
exports.createAndSignReceipt = createAndSignReceipt;
exports.verifyAndPrint = verifyAndPrint;
// Types
__exportStar(require("./types"), exports);
// Generator
var generator_1 = require("./generator");
Object.defineProperty(exports, "createReceipt", { enumerable: true, get: function () { return generator_1.createReceipt; } });
Object.defineProperty(exports, "fetchTransactionProof", { enumerable: true, get: function () { return generator_1.fetchTransactionProof; } });
Object.defineProperty(exports, "getReceiptSigningMessage", { enumerable: true, get: function () { return generator_1.getReceiptSigningMessage; } });
Object.defineProperty(exports, "computeReceiptHash", { enumerable: true, get: function () { return generator_1.computeReceiptHash; } });
Object.defineProperty(exports, "formatReceiptSummary", { enumerable: true, get: function () { return generator_1.formatReceiptSummary; } });
// Signer
var signer_1 = require("./signer");
Object.defineProperty(exports, "signReceipt", { enumerable: true, get: function () { return signer_1.signReceipt; } });
Object.defineProperty(exports, "addAttestation", { enumerable: true, get: function () { return signer_1.addAttestation; } });
Object.defineProperty(exports, "verifyAttestation", { enumerable: true, get: function () { return signer_1.verifyAttestation; } });
Object.defineProperty(exports, "verifyAllAttestations", { enumerable: true, get: function () { return signer_1.verifyAllAttestations; } });
Object.defineProperty(exports, "hasRequiredAttestations", { enumerable: true, get: function () { return signer_1.hasRequiredAttestations; } });
Object.defineProperty(exports, "generateTestWallet", { enumerable: true, get: function () { return signer_1.generateTestWallet; } });
// Storage
var storage_1 = require("./storage");
Object.defineProperty(exports, "pinToIPFS", { enumerable: true, get: function () { return storage_1.pinToIPFS; } });
Object.defineProperty(exports, "fetchFromIPFS", { enumerable: true, get: function () { return storage_1.fetchFromIPFS; } });
Object.defineProperty(exports, "anchorOnChain", { enumerable: true, get: function () { return storage_1.anchorOnChain; } });
Object.defineProperty(exports, "verifyOnChainAnchor", { enumerable: true, get: function () { return storage_1.verifyOnChainAnchor; } });
Object.defineProperty(exports, "setAnchorContract", { enumerable: true, get: function () { return storage_1.setAnchorContract; } });
Object.defineProperty(exports, "getAnchorContract", { enumerable: true, get: function () { return storage_1.getAnchorContract; } });
// Verifier
var verifier_1 = require("./verifier");
Object.defineProperty(exports, "verifyReceipt", { enumerable: true, get: function () { return verifier_1.verifyReceipt; } });
Object.defineProperty(exports, "quickVerify", { enumerable: true, get: function () { return verifier_1.quickVerify; } });
Object.defineProperty(exports, "formatVerificationResult", { enumerable: true, get: function () { return verifier_1.formatVerificationResult; } });
// ============ Convenience Functions ============
const generator_2 = require("./generator");
const signer_2 = require("./signer");
const storage_2 = require("./storage");
const verifier_2 = require("./verifier");
/**
 * Complete flow: Create receipt, sign, pin, anchor, verify
 */
async function createAndSignReceipt(params) {
    console.log('🧾 Creating receipt...');
    // Create receipt
    let receipt = await (0, generator_2.createReceipt)({
        txHash: params.txHash,
        commerce: params.commerce,
        buyerAgent: params.buyerAddress,
        sellerAgent: params.sellerAddress,
    });
    console.log('✍️ Collecting signatures...');
    // Buyer signs
    const buyerAttestation = await (0, signer_2.signReceipt)({
        receipt,
        privateKey: params.buyerPrivateKey,
        role: 'buyer',
    });
    receipt = (0, signer_2.addAttestation)(receipt, buyerAttestation);
    // Seller signs
    const sellerAttestation = await (0, signer_2.signReceipt)({
        receipt,
        privateKey: params.sellerPrivateKey,
        role: 'seller',
    });
    receipt = (0, signer_2.addAttestation)(receipt, sellerAttestation);
    console.log('📌 Pinning to IPFS...');
    // Pin to IPFS
    receipt.ipfsCid = await (0, storage_2.pinToIPFS)(receipt);
    // Anchor on-chain if requested
    if (params.anchor && params.anchorPrivateKey) {
        console.log('⚓ Anchoring on-chain...');
        const { hash, txHash } = await (0, storage_2.anchorOnChain)(receipt, params.anchorPrivateKey);
        receipt.onChainAnchor = hash;
        receipt.anchorTxHash = txHash;
    }
    console.log('✅ Receipt created and signed!');
    console.log((0, generator_2.formatReceiptSummary)(receipt));
    return receipt;
}
/**
 * Verify a receipt and print results
 */
async function verifyAndPrint(receipt) {
    console.log('🔍 Verifying receipt...');
    const result = await (0, verifier_2.verifyReceipt)({ receipt });
    console.log((0, verifier_2.formatVerificationResult)(result));
    return result.valid;
}
// Version
exports.VERSION = '1.0.0';
