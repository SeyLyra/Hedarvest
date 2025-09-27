require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');
require('hardhat-sourcify');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.19',
    settings: { 
      optimizer: { enabled: true, runs: 200 },
      viaIR: true
    },
  },
  networks: {
    hederaTestnet: {
      url: process.env.HEDERA_JSON_RPC_URL || 'https://testnet.hashio.io/api',
      accounts: process.env.EVM_PRIVATE_KEY ? [process.env.EVM_PRIVATE_KEY] : [],
    },
  },
  sourcify: { enabled: true },
};


