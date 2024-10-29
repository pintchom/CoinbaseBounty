const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  
  const devBounty = await hre.ethers.getContractAt( // finding contract addy
    "DevBounty",
    "0x09d21D696498b1E7D80E462f0d188BD6b984A964",
    signer
  );

  console.log("Starting challenge...");
  
  const tx = await devBounty.startChallenge(); // calling start (pirvate key in env initialized in config)
  const receipt = await tx.wait();
  
  console.log("Transaction receipt logs:", receipt.logs); // finding logs 
  
  const iface = devBounty.interface;
  const decodedLogs = receipt.logs.map(log => {
    try {
      return iface.parseLog(log);
    } catch (e) {
      return null;
    }
  }).filter(Boolean);

  const vaultCreatedEvent = decodedLogs.find(log => log.name === 'VaultCreated');
  const challengeStartedEvent = decodedLogs.find(log => log.name === 'ChallengeStarted');
  
  console.log("Challenge started!");
  if (vaultCreatedEvent) {
    console.log("Vault address:", vaultCreatedEvent.args[1]);
  }
  if (challengeStartedEvent) {
    console.log("Hint:", challengeStartedEvent.args[1]);
  }

  const newStage = await devBounty.getCurrentStage(signer.address);
  console.log("Current stage after starting:", newStage.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });