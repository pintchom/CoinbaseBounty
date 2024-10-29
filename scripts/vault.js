const hre = require("hardhat");
require('dotenv').config();

async function main() {
  const wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY, hre.ethers.provider);
  console.log("Using wallet address:", wallet.address);
  
  const vaultAddress = "0x4446746E681Eb1C27FB172F94FCd9bC245c9cc4B"; // gathered from start-challenge
  console.log("Vault address:", vaultAddress);

  const vault = await hre.ethers.getContractAt("Vault", vaultAddress, wallet);
  
  const creationBlockNumber = 17227198; // gathered from start-challenge
  const creationBlock = await hre.ethers.provider.getBlock(creationBlockNumber);
  const previousBlock = await hre.ethers.provider.getBlock(creationBlockNumber - 1);
  
  console.log("Creation block timestamp:", creationBlock.timestamp);
  console.log("Previous block hash:", previousBlock.hash);

  const nonceInput = hre.ethers.solidityPacked(
    ['uint256', 'address'],
    [creationBlock.timestamp, wallet.address]
  );
  const randomNonce = BigInt(hre.ethers.keccak256(nonceInput)) % 10000n;
  
  console.log("Calculated nonce:", randomNonce);

  const passwordInput = hre.ethers.solidityPacked(
    ['bytes32', 'address', 'uint256', 'uint256'],
    [previousBlock.hash, wallet.address, creationBlock.timestamp, randomNonce]
  );
  const password = hre.ethers.keccak256(passwordInput);

  console.log("Generated password:", password);

  const initialLockStatus = await vault.locked();
  console.log("Initial lock status:", initialLockStatus);

  if (initialLockStatus) {
    console.log("Attempting to unlock vault...");
    const unlockTx = await vault.unlock(password);
    console.log("Waiting for unlock transaction...");
    await unlockTx.wait();
    
    // Wait a bit for the state to update
    console.log("Waiting for state update...");
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const isLocked = await vault.locked();
  console.log("Current vault lock status:", isLocked);

  if (!isLocked) {
    console.log("Vault confirmed unlocked! Completing stage...");
    
    const devBounty = await hre.ethers.getContractAt(
      "DevBounty",
      "0x09d21D696498b1E7D80E462f0d188BD6b984A964",
      wallet
    );
    // was getting a bunch of stage errors, as in which stage Im currently on - just went out of order on accident,
    // had GPT write me some error handling for checking where I am :) 
    const currentStage = await devBounty.getCurrentStage(wallet.address);
    console.log("Current stage:", currentStage.toString());
    
    console.log("Completing vault unlocking stage...");
    const completeTx = await devBounty.completeVaultUnlocking();
    console.log("Waiting for completion transaction...");
    const receipt = await completeTx.wait();
    console.log("Stage completed!");
    
    // Verify new stage
    const newStage = await devBounty.getCurrentStage(wallet.address);
    console.log("New stage:", newStage.toString());
  } else {
    console.log("ERROR: Vault is still locked!");
    console.log("Please verify the password calculation.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });