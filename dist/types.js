"use strict";
/**
 * AgentReceipts - Type Definitions
 * USDC Hackathon - Agentic Commerce Track
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RECEIPT_TYPES = exports.RECEIPT_DOMAIN = void 0;
// ============ EIP-712 Types ============
exports.RECEIPT_DOMAIN = {
    name: 'AgentReceipts',
    version: '1',
    chainId: 84532, // Base Sepolia
};
exports.RECEIPT_TYPES = {
    Receipt: [
        { name: 'receiptId', type: 'string' },
        { name: 'txHash', type: 'string' },
        { name: 'amount', type: 'string' },
        { name: 'commerceType', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'timestamp', type: 'string' },
    ],
};
