require("@nomicfoundation/hardhat-ethers");
require("dotenv").config(); // For safely loading private key

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.27",
      },
      {
        version: "0.8.17",
      }
    ]
  },
  networks: {
    "base-sepolia": {
      url: "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY], // Your wallet private key
      chainId: 84532
    }
  }
};