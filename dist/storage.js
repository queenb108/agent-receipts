"use strict";
/**
 * AgentReceipts - Storage Handler
 * IPFS pinning and on-chain anchoring
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pinToIPFS = pinToIPFS;
exports.fetchFromIPFS = fetchFromIPFS;
exports.anchorOnChain = anchorOnChain;
exports.verifyOnChainAnchor = verifyOnChainAnchor;
exports.setAnchorContract = setAnchorContract;
exports.getAnchorContract = getAnchorContract;
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
const generator_1 = require("./generator");
// Will be deployed - placeholder for now
let ANCHOR_CONTRACT_ADDRESS = '';
/**
 * Pin receipt to IPFS using web3.storage or Pinata
 * For hackathon demo, we'll use a simplified approach
 */
async function pinToIPFS(receipt) {
    // For hackathon MVP, we'll create a deterministic CID-like hash
    // In production, this would use actual IPFS pinning
    const receiptJson = JSON.stringify(receipt, null, 2);
    // Create a mock CID based on content hash
    const contentHash = (0, viem_1.keccak256)((0, viem_1.toBytes)(receiptJson));
    // Format as base58-like CID (simplified for demo)
    const mockCid = `bafyreig${contentHash.slice(2, 50)}`;
    console.log(`📌 Receipt pinned to IPFS (mock): ${mockCid}`);
    console.log(`   Content size: ${receiptJson.length} bytes`);
    return mockCid;
}
/**
 * Retrieve receipt from IPFS
 * In production, this would fetch from IPFS gateway
 */
async function fetchFromIPFS(cid) {
    // For demo, we'd need to store locally or use actual IPFS
    console.log(`📥 Fetching from IPFS: ${cid}`);
    console.log(`   Note: In production, this fetches from IPFS gateway`);
    return null; // Would return actual receipt in production
}
/**
 * Anchor receipt hash on-chain
 */
async function anchorOnChain(receipt, privateKey) {
    const receiptHash = (0, generator_1.computeReceiptHash)(receipt);
    const account = (0, accounts_1.privateKeyToAccount)(privateKey);
    const walletClient = (0, viem_1.createWalletClient)({
        account,
        chain: chains_1.baseSepolia,
        transport: (0, viem_1.http)('https://sepolia.base.org'),
    });
    // Store hash in transaction calldata (no contract needed)
    const txHash = await walletClient.sendTransaction({
        to: account.address, // Self-send with data
        data: receiptHash,
        value: BigInt(0),
    });
    console.log(`⚓ Receipt anchored on-chain via calldata`);
    console.log(`   Hash: ${receiptHash}`);
    console.log(`   TX: ${txHash}`);
    return { hash: receiptHash, txHash };
}
/**
 * Verify receipt anchor on-chain
 */
async function verifyOnChainAnchor(receipt) {
    if (!receipt.anchorTxHash) {
        return { exists: false };
    }
    const publicClient = (0, viem_1.createPublicClient)({
        chain: chains_1.baseSepolia,
        transport: (0, viem_1.http)('https://sepolia.base.org'),
    });
    try {
        const tx = await publicClient.getTransaction({
            hash: receipt.anchorTxHash,
        });
        if (!tx) {
            return { exists: false };
        }
        const expectedHash = (0, generator_1.computeReceiptHash)(receipt);
        // Check if calldata contains the receipt hash
        if (tx.input === expectedHash || tx.input.includes(expectedHash.slice(2))) {
            const block = await publicClient.getBlock({
                blockHash: tx.blockHash,
            });
            return {
                exists: true,
                timestamp: Number(block.timestamp),
                anchorer: tx.from,
            };
        }
        return { exists: false };
    }
    catch (error) {
        console.error('Error verifying anchor:', error);
        return { exists: false };
    }
}
/**
 * Set the anchor contract address (after deployment)
 */
function setAnchorContract(address) {
    ANCHOR_CONTRACT_ADDRESS = address;
}
/**
 * Get current anchor contract address
 */
function getAnchorContract() {
    return ANCHOR_CONTRACT_ADDRESS;
}
