#!/usr/bin/env node
import { run } from "hardhat";

async function main() {
  const envKeys = ["FACTORY", "POOL", "ORACLE", "STABLE", "GRAIN"];
  const envAddrs = envKeys.map((k) => process.env[k]).filter(Boolean);
  const cliAddrs = process.argv.slice(2).filter((a) => a.startsWith("0x"));
  const addresses = Array.from(new Set([...envAddrs, ...cliAddrs]));

  if (addresses.length === 0) {
    console.log("Usage: FACTORY=0x... POOL=0x... ORACLE=0x... pnpm hardhat run scripts/verify.js --network hederaTestnet");
    console.log("Or: pnpm hardhat run scripts/verify.js --network hederaTestnet 0xFactory 0xPool 0xOracle");
    process.exit(1);
  }

  console.log("Sourcify verifying:", addresses);
  await run("sourcify", { addresses });
  console.log("Submitted. Check Hashscan once Sourcify processes it.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


