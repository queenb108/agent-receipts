"use strict";
/**
 * AgentReceipts - Signature Handler
 * EIP-712 typed signatures for bilateral attestation
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.signReceipt = signReceipt;
exports.addAttestation = addAttestation;
exports.verifyAttestation = verifyAttestation;
exports.verifyAllAttestations = verifyAllAttestations;
exports.hasRequiredAttestations = hasRequiredAttestations;
exports.generateTestWallet = generateTestWallet;
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
const generator_1 = require("./generator");
/**
 * Sign a receipt as a specific role (buyer, seller, witness, arbiter)
 */
async function signReceipt(input) {
    const { receipt, privateKey, role } = input;
    // Create account from private key
    const account = (0, accounts_1.privateKeyToAccount)(privateKey);
    // Create wallet client
    const walletClient = (0, viem_1.createWalletClient)({
        account,
        chain: chains_1.baseSepolia,
        transport: (0, viem_1.http)('https://sepolia.base.org'),
    });
    // Get the structured message to sign
    const typedData = (0, generator_1.getReceiptSigningMessage)(receipt);
    // Sign using EIP-712
    const signature = await walletClient.signTypedData({
        account,
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
    });
    const attestation = {
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
function addAttestation(receipt, attestation) {
    // Check if this agent already attested
    const existing = receipt.attestations.find(a => a.agent.toLowerCase() === attestation.agent.toLowerCase());
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
async function verifyAttestation(receipt, attestation) {
    const { verifyTypedData } = await Promise.resolve().then(() => __importStar(require('viem')));
    const typedData = (0, generator_1.getReceiptSigningMessage)(receipt);
    try {
        const isValid = await verifyTypedData({
            address: attestation.agent,
            domain: typedData.domain,
            types: typedData.types,
            primaryType: typedData.primaryType,
            message: typedData.message,
            signature: attestation.signature,
        });
        return isValid;
    }
    catch (error) {
        console.error('Signature verification failed:', error);
        return false;
    }
}
/**
 * Verify all attestations on a receipt
 */
async function verifyAllAttestations(receipt) {
    const results = new Map();
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
function hasRequiredAttestations(receipt) {
    const hasBuyer = receipt.attestations.some(a => a.role === 'buyer');
    const hasSeller = receipt.attestations.some(a => a.role === 'seller');
    return hasBuyer && hasSeller;
}
/**
 * Generate a test wallet for demo purposes
 */
function generateTestWallet() {
    const privateKey = (0, accounts_1.generatePrivateKey)();
    const account = (0, accounts_1.privateKeyToAccount)(privateKey);
    return {
        address: account.address,
        privateKey,
    };
}
