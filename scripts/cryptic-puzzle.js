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

  const solution = "base"; // tried every variation of base, Base, BASE, etc. in a seperate script lol
  
  const expectedHash = await devBounty.CRYPTIC_PUZZLE_HASH();
  const solutionHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(solution));
  
  console.log("Solution Hash:", solutionHash);
  console.log("Expected Hash:", expectedHash);
  console.log("Hash matches:", solutionHash === expectedHash);
  
  if (solutionHash === expectedHash) {
    console.log("Submitting solution...");
    const tx = await devBounty.completeCrypticPuzzle(solution, wallet.address);
    const receipt = await tx.wait();
    
    console.log("Solution submitted!");
    
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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });