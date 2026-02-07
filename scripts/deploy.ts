import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ReceiptAnchor contract to Base Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  const ReceiptAnchor = await ethers.getContractFactory("ReceiptAnchor");
  const receiptAnchor = await ReceiptAnchor.deploy();
  
  await receiptAnchor.waitForDeployment();
  
  const address = await receiptAnchor.getAddress();
  console.log("ReceiptAnchor deployed to:", address);
  console.log("\nVerify with:");
  console.log(`npx hardhat verify --network baseSepolia ${address}`);
  
  // Log for easy copy
  console.log("\n=== DEPLOYMENT INFO ===");
  console.log(`CONTRACT_ADDRESS=${address}`);
  console.log(`CHAIN=base-sepolia`);
  console.log(`BLOCK_EXPLORER=https://sepolia.basescan.org/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
