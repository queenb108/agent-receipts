// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReceiptAnchor
 * @notice On-chain anchor for USDC transaction receipts
 * @dev Stores receipt hashes and IPFS CIDs for verification
 * 
 * #USDCHackathon - Agentic Commerce Track
 * Author: Queen-B
 */
contract ReceiptAnchor {
    
    struct Receipt {
        bytes32 receiptHash;      // keccak256 of the full receipt JSON
        string ipfsCid;           // IPFS content identifier
        bytes32 originalTxHash;   // The USDC transfer transaction hash
        address anchoredBy;       // Agent that anchored this receipt
        uint256 anchoredAt;       // Block timestamp when anchored
    }
    
    // receiptId => Receipt
    mapping(bytes32 => Receipt) public receipts;
    
    // Track all receipt IDs for enumeration
    bytes32[] public receiptIds;
    
    // Events
    event ReceiptAnchored(
        bytes32 indexed receiptId,
        bytes32 indexed receiptHash,
        string ipfsCid,
        bytes32 originalTxHash,
        address indexed anchoredBy,
        uint256 timestamp
    );
    
    /**
     * @notice Anchor a receipt on-chain
     * @param receiptId Unique identifier for the receipt (UUID as bytes32)
     * @param receiptHash keccak256 hash of the receipt JSON
     * @param ipfsCid IPFS content identifier where full receipt is stored
     * @param originalTxHash The USDC transfer transaction hash
     */
    function anchorReceipt(
        bytes32 receiptId,
        bytes32 receiptHash,
        string calldata ipfsCid,
        bytes32 originalTxHash
    ) external {
        // Prevent overwrites - each receipt can only be anchored once
        require(receipts[receiptId].anchoredAt == 0, "Receipt already anchored");
        require(receiptHash != bytes32(0), "Invalid receipt hash");
        require(bytes(ipfsCid).length > 0, "Invalid IPFS CID");
        
        receipts[receiptId] = Receipt({
            receiptHash: receiptHash,
            ipfsCid: ipfsCid,
            originalTxHash: originalTxHash,
            anchoredBy: msg.sender,
            anchoredAt: block.timestamp
        });
        
        receiptIds.push(receiptId);
        
        emit ReceiptAnchored(
            receiptId,
            receiptHash,
            ipfsCid,
            originalTxHash,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @notice Verify a receipt hash matches the anchored hash
     * @param receiptId The receipt identifier
     * @param receiptHash The hash to verify
     * @return bool True if the hash matches
     */
    function verifyReceipt(
        bytes32 receiptId,
        bytes32 receiptHash
    ) external view returns (bool) {
        Receipt memory r = receipts[receiptId];
        if (r.anchoredAt == 0) {
            return false; // Receipt not found
        }
        return r.receiptHash == receiptHash;
    }
    
    /**
     * @notice Get full receipt anchor data
     * @param receiptId The receipt identifier
     * @return Receipt struct with all anchor data
     */
    function getReceipt(bytes32 receiptId) external view returns (Receipt memory) {
        return receipts[receiptId];
    }
    
    /**
     * @notice Check if a receipt exists
     * @param receiptId The receipt identifier
     * @return bool True if receipt is anchored
     */
    function receiptExists(bytes32 receiptId) external view returns (bool) {
        return receipts[receiptId].anchoredAt > 0;
    }
    
    /**
     * @notice Get total number of anchored receipts
     * @return uint256 Count of receipts
     */
    function getReceiptCount() external view returns (uint256) {
        return receiptIds.length;
    }
    
    /**
     * @notice Get receipts anchored by a specific agent
     * @param agent The agent address
     * @return bytes32[] Array of receipt IDs anchored by this agent
     */
    function getReceiptsByAgent(address agent) external view returns (bytes32[] memory) {
        // Count first
        uint256 count = 0;
        for (uint256 i = 0; i < receiptIds.length; i++) {
            if (receipts[receiptIds[i]].anchoredBy == agent) {
                count++;
            }
        }
        
        // Build array
        bytes32[] memory result = new bytes32[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < receiptIds.length; i++) {
            if (receipts[receiptIds[i]].anchoredBy == agent) {
                result[idx] = receiptIds[i];
                idx++;
            }
        }
        
        return result;
    }
}
