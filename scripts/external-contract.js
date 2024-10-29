const hre = require("hardhat");
require('dotenv').config();

async function main() {
  // Create wallet from private key
  const wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY, hre.ethers.provider);
  console.log("Using wallet address:", wallet.address);
  
  // Get the DevBounty contract
  const devBounty = await hre.ethers.getContractAt(
    "DevBounty",
    "0x09d21D696498b1E7D80E462f0d188BD6b984A964",
    wallet
  );

  const hint = await devBounty.getHint(wallet.address);
  console.log("Hint value:", hint.toString());

  const solution = hre.ethers.keccak256(
    hre.ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [hint]) // using hint from getter func 
  );
  
  console.log("Generated solution:", solution);

  console.log("Submitting solution...");
  const tx = await devBounty.completeExternalChallenge(solution);
  const receipt = await tx.wait();
  
  const iface = devBounty.interface;
  const decodedLogs = receipt.logs.map(log => {
    try {
      return iface.parseLog(log);
    } catch (e) {
      return null;
    }
  }).filter(Boolean);

  const stageCompletedEvent = decodedLogs.find(log => log.name === 'StageCompleted');
  const challengeStartedEvent = decodedLogs.find(log => log.name === 'ChallengeStarted');
  
  if (stageCompletedEvent) {
    console.log("Stage completed!");
  }
  if (challengeStartedEvent) {
    console.log("Next hint:", challengeStartedEvent.args[1]);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });