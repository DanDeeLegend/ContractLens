import { ethers } from "ethers";
import { describe, expect, it } from "vitest";
import { createInterface, decodeLog } from "../src/services/decoderService.ts";
import { DEFAULT_ABI } from "../src/services/blockchainService.ts";

const iface = createInterface(DEFAULT_ABI);
const A = "0x" + "11".repeat(20);
const B = "0x" + "22".repeat(20);

function logFor(eventName: string, args: unknown[]) {
  const { topics, data } = iface.encodeEventLog(iface.getEvent(eventName)!, args);
  return { topics, data } as unknown as ethers.Log;
}

describe("decodeLog", () => {
  it("decodes indexed and non-indexed parameters of a Transfer event", () => {
    const decoded = decodeLog(iface, logFor("Transfer", [A, B, 25n * 10n ** 18n]));
    expect(decoded.name).toBe("Transfer");
    expect(decoded.params.map((p) => [p.name, p.type])).toEqual([["from", "address"], ["to", "address"], ["value", "uint256"]]);
    expect(decoded.params[0].value.toLowerCase()).toBe(A);
    expect(decoded.params[2].value).toBe("25000000000000000000");
  });

  it("matches events by their Keccak-256 signature topic", () => {
    const log = logFor("Approval", [A, B, 1n]);
    expect(log.topics[0]).toBe(ethers.id("Approval(address,address,uint256)"));
    expect(decodeLog(iface, log).name).toBe("Approval");
  });

  it("labels events missing from the ABI as Unknown instead of dropping them", () => {
    const foreign = { topics: [ethers.id("Mystery(uint256)")], data: "0x" } as unknown as ethers.Log;
    expect(decodeLog(iface, foreign)).toEqual({ name: "Unknown", params: [] });
  });

  it("never throws on malformed logs", () => {
    const bad = { topics: [ethers.id("Transfer(address,address,uint256)")], data: "0xdead" } as unknown as ethers.Log;
    expect(decodeLog(iface, bad).name).toBe("Unknown");
  });
});
