import type { Contract, ConnectionStatus, Transaction } from "../types";

export const mockContract: Contract = {
  address: "0x7a3d1f2E9bC4a8F6D0e5B21C4A9F8e3D2C1B0A99",
  name: "VaultToken",
  network: "Sepolia",
  deployedBlock: 5_812_004,
};

export const mockConnectionStatus: ConnectionStatus = {
  state: "connected",
  network: "Sepolia",
  lastSyncedAt: "2026-07-11T09:42:11Z",
};

const wallets = [
  "0x9F1c4b6A2e8D3f0C7B5a1E9D4c2F8B6A0E3D7C15",
  "0x1B4e7A0c9D2f6B8E3A5c1D9F0e7B4A2C6D8E0F31",
  "0xC2a8D4e1F6B0c9A3E7D5b2C8F1A4e6B0D3C7A952",
  "0x4E6d0A2c8B1F3e9D7A5C0b4E2F8D1A6C9B3E7D08",
  "0xA0f3C7e1D9b4A6E2c8B5D0F7A3E1C9B6D4A2F857",
  "0x88a5C1D3e9F0b7A4C2E6D8B1F3A0C7E5D9B4A216",
  "0xDe61B3A8c0F2D6e9A4C7B1D5F8A2E0C3B6D9A741",
];

interface TxSeed {
  fn: string;
  caller: string;
  status: "success" | "failed";
  gas: number;
  params: { name: string; type: string; value: string }[];
}

const seeds: TxSeed[] = [
  { fn: "transfer", caller: wallets[0], status: "success", gas: 51234, params: [{ name: "to", type: "address", value: wallets[3] }, { name: "amount", type: "uint256", value: "250000000000000000000" }] },
  { fn: "approve", caller: wallets[1], status: "success", gas: 46811, params: [{ name: "spender", type: "address", value: wallets[4] }, { name: "amount", type: "uint256", value: "1000000000000000000000" }] },
  { fn: "mint", caller: wallets[2], status: "success", gas: 71029, params: [{ name: "to", type: "address", value: wallets[2] }, { name: "amount", type: "uint256", value: "5000000000000000000000" }] },
  { fn: "transfer", caller: wallets[3], status: "failed", gas: 23110, params: [{ name: "to", type: "address", value: wallets[5] }, { name: "amount", type: "uint256", value: "999999999999999999999999" }] },
  { fn: "burn", caller: wallets[4], status: "success", gas: 38452, params: [{ name: "amount", type: "uint256", value: "10000000000000000000" }] },
  { fn: "setOwner", caller: wallets[5], status: "success", gas: 29901, params: [{ name: "newOwner", type: "address", value: wallets[6] }] },
  { fn: "pause", caller: wallets[6], status: "success", gas: 27540, params: [] },
  { fn: "unpause", caller: wallets[6], status: "success", gas: 27488, params: [] },
  { fn: "transfer", caller: wallets[0], status: "success", gas: 51290, params: [{ name: "to", type: "address", value: wallets[1] }, { name: "amount", type: "uint256", value: "75000000000000000000" }] },
  { fn: "approve", caller: wallets[2], status: "failed", gas: 21005, params: [{ name: "spender", type: "address", value: wallets[0] }, { name: "amount", type: "uint256", value: "0" }] },
  { fn: "mint", caller: wallets[1], status: "success", gas: 70884, params: [{ name: "to", type: "address", value: wallets[5] }, { name: "amount", type: "uint256", value: "1200000000000000000000" }] },
  { fn: "transfer", caller: wallets[3], status: "success", gas: 51177, params: [{ name: "to", type: "address", value: wallets[2] }, { name: "amount", type: "uint256", value: "3000000000000000000" }] },
  { fn: "burn", caller: wallets[5], status: "failed", gas: 19233, params: [{ name: "amount", type: "uint256", value: "50000000000000000000000" }] },
  { fn: "transfer", caller: wallets[6], status: "success", gas: 51322, params: [{ name: "to", type: "address", value: wallets[4] }, { name: "amount", type: "uint256", value: "18500000000000000000" }] },
  { fn: "approve", caller: wallets[4], status: "success", gas: 46955, params: [{ name: "spender", type: "address", value: wallets[3] }, { name: "amount", type: "uint256", value: "500000000000000000000" }] },
  { fn: "setOwner", caller: wallets[0], status: "failed", gas: 22876, params: [{ name: "newOwner", type: "address", value: "0x0000000000000000000000000000000000000000" }] },
  { fn: "transfer", caller: wallets[2], status: "success", gas: 51268, params: [{ name: "to", type: "address", value: wallets[6] }, { name: "amount", type: "uint256", value: "640000000000000000000" }] },
  { fn: "mint", caller: wallets[3], status: "success", gas: 71144, params: [{ name: "to", type: "address", value: wallets[0] }, { name: "amount", type: "uint256", value: "9000000000000000000000" }] },
  { fn: "pause", caller: wallets[5], status: "failed", gas: 20112, params: [] },
  { fn: "transfer", caller: wallets[1], status: "success", gas: 51201, params: [{ name: "to", type: "address", value: wallets[5] }, { name: "amount", type: "uint256", value: "42000000000000000000" }] },
];

function hashFor(index: number): string {
  const base = (index + 1).toString(16).padStart(6, "0");
  return `0x${base}c3f9a1d7e5b2c8f0a4d6e9b3c7f1a5d8e2b6c0f4a9d3e7b1c5f8a2d6e0b4c${base}`.slice(0, 66);
}

export const mockTransactions: Transaction[] = seeds.map((seed, i) => {
  const minutesAgo = (seeds.length - i) * 7;
  const timestamp = new Date(Date.now() - minutesAgo * 60_000).toISOString();
  return {
    id: `tx-${i + 1}`,
    hash: hashFor(i),
    functionName: seed.fn,
    caller: seed.caller,
    timestamp,
    blockNumber: mockContract.deployedBlock + 1042 + i * 3,
    gasUsed: seed.gas,
    status: seed.status,
    params: seed.params,
  };
});

export const mockDashboardStats = {
  contractAddress: mockContract.address,
  latestBlock: mockTransactions[mockTransactions.length - 1].blockNumber,
  totalTransactions: mockTransactions.length,
  activeListeners: 3,
  connectionStatus: mockConnectionStatus.state,
};
