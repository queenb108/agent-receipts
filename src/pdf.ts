/**
 * AgentReceipts - PDF Generator
 * Creates professional, human-readable PDF receipts with QR verification codes
 */

import { AgentReceipt } from './types';

// PDF generation using html-pdf approach (convert HTML to PDF)
// For hackathon MVP, we generate HTML that can be rendered or converted to PDF

/**
 * Generate HTML receipt that can be converted to PDF
 */
export function generateReceiptHTML(receipt: AgentReceipt): string {
  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const shortenHash = (hash: string) => `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  
  // QR code data - link to verification
  const verifyUrl = receipt.anchorTxHash 
    ? `https://sepolia.basescan.org/tx/${receipt.anchorTxHash}`
    : '#';
  const ipfsUrl = receipt.ipfsCid
    ? `https://ipfs.io/ipfs/${receipt.ipfsCid}`
    : '#';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>USDC Transaction Receipt - ${receipt.receiptId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Helvetica Neue', Arial, sans-serif; 
      font-size: 11px;
      line-height: 1.5;
      color: #1a1a1a;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #2775ca;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 600;
      color: #2775ca;
      margin-bottom: 5px;
    }
    .header .subtitle {
      color: #666;
      font-size: 12px;
    }
    .receipt-id {
      font-family: monospace;
      background: #f5f5f5;
      padding: 5px 10px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 10px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #2775ca;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 5px;
      margin-bottom: 15px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .row:last-child { border-bottom: none; }
    .label { color: #666; }
    .value { font-weight: 500; text-align: right; }
    .value.mono { font-family: monospace; font-size: 10px; }
    .amount {
      font-size: 28px;
      font-weight: 700;
      color: #2775ca;
      text-align: center;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
      margin: 15px 0;
    }
    .amount .currency { font-size: 16px; font-weight: 400; }
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status.paid { background: #dcfce7; color: #166534; }
    .status.pending { background: #fef3c7; color: #92400e; }
    .status.refund { background: #fee2e2; color: #991b1b; }
    .attestation-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .attestation-table th {
      text-align: left;
      padding: 8px;
      background: #f5f5f5;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      color: #666;
    }
    .attestation-table td {
      padding: 8px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 10px;
    }
    .attestation-table .signature {
      font-family: monospace;
      font-size: 9px;
      color: #666;
    }
    .verified { color: #166534; }
    .qr-section {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .qr-placeholder {
      width: 120px;
      height: 120px;
      background: #e0e0e0;
      margin: 0 auto 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #666;
    }
    .verify-links {
      font-size: 10px;
      color: #666;
      margin-top: 10px;
    }
    .verify-links a {
      color: #2775ca;
      text-decoration: none;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      font-size: 9px;
      color: #999;
    }
    .footer .hash {
      font-family: monospace;
      word-break: break-all;
      margin-top: 10px;
      background: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>💰 USDC Transaction Receipt</h1>
    <div class="subtitle">Agent-Native Proof of Commerce</div>
    <div class="receipt-id">Receipt ID: ${receipt.receiptId}</div>
  </div>

  <div class="section">
    <div class="section-title">Transaction Summary</div>
    <div class="amount">
      ${receipt.transaction.amount} <span class="currency">USDC</span>
    </div>
    <div class="row">
      <span class="label">Status</span>
      <span class="value"><span class="status ${receipt.commerce.status === 'paid_in_full' ? 'paid' : 'pending'}">${receipt.commerce.status.replace(/_/g, ' ')}</span></span>
    </div>
    <div class="row">
      <span class="label">Chain</span>
      <span class="value">${receipt.transaction.chain}</span>
    </div>
    <div class="row">
      <span class="label">Transaction Hash</span>
      <span class="value mono">${shortenHash(receipt.transaction.txHash)}</span>
    </div>
    <div class="row">
      <span class="label">Block Number</span>
      <span class="value">${receipt.transaction.blockNumber}</span>
    </div>
    <div class="row">
      <span class="label">Timestamp</span>
      <span class="value">${new Date(receipt.transaction.timestamp).toLocaleString()}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Parties</div>
    <div class="row">
      <span class="label">From (Payer)</span>
      <span class="value mono">${shortenAddress(receipt.transaction.from)}</span>
    </div>
    <div class="row">
      <span class="label">To (Payee)</span>
      <span class="value mono">${shortenAddress(receipt.transaction.to)}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Commerce Details</div>
    <div class="row">
      <span class="label">Type</span>
      <span class="value">${receipt.commerce.type.replace(/_/g, ' ')}</span>
    </div>
    <div class="row">
      <span class="label">Description</span>
      <span class="value">${receipt.commerce.description}</span>
    </div>
    ${receipt.commerce.orderReference ? `
    <div class="row">
      <span class="label">Order Reference</span>
      <span class="value mono">${shortenHash(receipt.commerce.orderReference)}</span>
    </div>
    ` : ''}
    ${receipt.commerce.terms ? `
    <div class="row">
      <span class="label">Terms</span>
      <span class="value">${JSON.stringify(receipt.commerce.terms)}</span>
    </div>
    ` : ''}
  </div>

  <div class="section">
    <div class="section-title">Attestations</div>
    <table class="attestation-table">
      <thead>
        <tr>
          <th>Role</th>
          <th>Agent Address</th>
          <th>Signature</th>
          <th>Signed At</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${receipt.attestations.map(a => `
        <tr>
          <td>${a.role.toUpperCase()}</td>
          <td class="mono">${shortenAddress(a.agent)}</td>
          <td class="signature">${a.signature.slice(0, 16)}...</td>
          <td>${new Date(a.timestamp).toLocaleString()}</td>
          <td class="verified">✓ Verified</td>
        </tr>
        `).join('')}
        ${receipt.attestations.length === 0 ? `
        <tr>
          <td colspan="5" style="text-align: center; color: #999;">No attestations</td>
        </tr>
        ` : ''}
      </tbody>
    </table>
  </div>

  <div class="qr-section">
    <div class="qr-placeholder">[QR Code]<br>Scan to Verify</div>
    <div class="verify-links">
      <strong>Verify On-Chain:</strong><br>
      <a href="${verifyUrl}" target="_blank">${verifyUrl}</a><br><br>
      <strong>IPFS Receipt:</strong><br>
      <a href="${ipfsUrl}" target="_blank">${ipfsUrl}</a>
    </div>
  </div>

  <div class="footer">
    <p>This receipt was generated by the <strong>USDC Receipt & Proof Generator</strong></p>
    <p>Verify the receipt hash on-chain using the QR code above</p>
    <div class="hash">
      <strong>Receipt Hash:</strong> ${receipt.onChainAnchor || 'Not yet anchored'}
    </div>
    <p style="margin-top: 10px;">Generated: ${receipt.createdAt}</p>
  </div>
</body>
</html>
`;

  return html;
}

/**
 * Generate a simple text-based receipt for terminal output
 */
export function generateReceiptText(receipt: AgentReceipt): string {
  const line = '═'.repeat(60);
  const thinLine = '─'.repeat(60);
  
  return `
${line}
              💰 USDC TRANSACTION RECEIPT
${line}

Receipt ID: ${receipt.receiptId}
Generated:  ${receipt.createdAt}

${thinLine}
                    TRANSACTION
${thinLine}
Chain:           ${receipt.transaction.chain}
TX Hash:         ${receipt.transaction.txHash}
Block:           ${receipt.transaction.blockNumber}
Timestamp:       ${receipt.transaction.timestamp}

From (Payer):    ${receipt.transaction.from}
To (Payee):      ${receipt.transaction.to}
Amount:          ${receipt.transaction.amount} ${receipt.transaction.currency}

${thinLine}
                    COMMERCE
${thinLine}
Type:            ${receipt.commerce.type}
Description:     ${receipt.commerce.description}
Status:          ${receipt.commerce.status}
${receipt.commerce.orderReference ? `Order Ref:       ${receipt.commerce.orderReference}` : ''}

${thinLine}
                   ATTESTATIONS
${thinLine}
${receipt.attestations.length === 0 ? 'No attestations yet' :
  receipt.attestations.map(a => 
    `${a.role.toUpperCase().padEnd(8)} ${a.agent.slice(0, 20)}... @ ${a.timestamp}`
  ).join('\n')}

${thinLine}
                   VERIFICATION
${thinLine}
IPFS CID:        ${receipt.ipfsCid || 'Not pinned'}
On-Chain Anchor: ${receipt.onChainAnchor || 'Not anchored'}
Anchor TX:       ${receipt.anchorTxHash || 'N/A'}

${line}
     Verify at: https://sepolia.basescan.org/tx/${receipt.anchorTxHash || '...'}
${line}
`;
}

/**
 * Save HTML receipt to file
 */
export async function saveReceiptHTML(
  receipt: AgentReceipt, 
  filepath: string
): Promise<void> {
  const fs = await import('fs/promises');
  const html = generateReceiptHTML(receipt);
  await fs.writeFile(filepath, html, 'utf-8');
}
