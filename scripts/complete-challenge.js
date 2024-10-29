const hre = require("hardhat");
require('dotenv').config();

async function main() {
  const wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY, hre.ethers.provider);
  console.log("Using wallet address:", wallet.address);
  
  const devBounty = await hre.ethers.getContractAt(
    "DevBounty",
    "0x09d21D696498b1E7D80E462f0d188BD6b984A964",
    wallet
  );

  const currentStage = await devBounty.getCurrentStage(wallet.address);
  console.log("Current stage:", currentStage.toString());

  if (currentStage.toString() === "4") { // Stage.Completed
    console.log("At final stage, completing challenge...");
    const tx = await devBounty.completeChallenge();
    const receipt = await tx.wait();

    const iface = devBounty.interface;
    const decodedLogs = receipt.logs.map(log => {
      try {
        return iface.parseLog(log);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    const challengeSolvedEvent = decodedLogs.find(log => log.name === 'ChallengeSolved');
    if (challengeSolvedEvent) {
      console.log("Challenge completed successfully!");
      
      // was curious lol
      const leaderboard = await devBounty.getLeaderboard();
      console.log("Your position on leaderboard:", leaderboard.length);
    }
  } else {
    console.log("Error: Not at final stage. Complete all stages first!");
    console.log("Stages: 0=NotStarted, 1=CrypticPuzzle, 2=ExternalChallenge, 3=VaultUnlocking, 4=Completed");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });