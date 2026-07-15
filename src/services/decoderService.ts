import { ethers } from "ethers";
import type { DecodedParam } from "../types";

/**
 * decoderService
 *
 * Turns a raw ethers.Log into a human-readable event/function name plus
 * a typed parameter list, using an ethers.Interface built from the
 * contract's ABI. Decoding failure is expected and handled — logs from
 * selectors/events not present in the supplied ABI simply fall back to
 * "Unknown" rather than throwing.
 */

export interface DecodedLog {
  name: string;
  params: DecodedParam[];
}

/** Builds a reusable ethers.Interface from an ABI (human-readable or JSON). */
export function createInterface(abi: ethers.InterfaceAbi): ethers.Interface {
  return new ethers.Interface(abi);
}

/** Converts a decoded arg (including BigInt) into a display-safe string. */
function stringifyArg(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return `[${value.map(stringifyArg).join(", ")}]`;
  if (value === null || value === undefined) return String(value);
  return String(value);
}

/**
 * Decodes a single log against the given interface.
 * Never throws — on any decode failure it returns { name: "Unknown", params: [] }
 * so the UI always has something safe to render (per requirement #9).
 */
export function decodeLog(iface: ethers.Interface, log: ethers.Log): DecodedLog {
  try {
    const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
    if (!parsed) return { name: "Unknown", params: [] };

    const params: DecodedParam[] = parsed.fragment.inputs.map((input, i) => ({
      name: input.name || `arg${i}`,
      type: input.type,
      value: stringifyArg(parsed.args[i]),
    }));

    return { name: parsed.name, params };
  } catch {
    return { name: "Unknown", params: [] };
  }
}

/**
 * Decodes a transaction's `data` field as a function call (as opposed to
 * an emitted event). Useful if/when the app monitors calls that don't
 * necessarily emit logs. Same "never throw" contract as decodeLog.
 */
export function decodeFunctionData(iface: ethers.Interface, data: string): DecodedLog {
  try {
    const parsed = iface.parseTransaction({ data });
    if (!parsed) return { name: "Unknown", params: [] };

    const params: DecodedParam[] = parsed.fragment.inputs.map((input, i) => ({
      name: input.name || `arg${i}`,
      type: input.type,
      value: stringifyArg(parsed.args[i]),
    }));

    return { name: parsed.name, params };
  } catch {
    return { name: "Unknown", params: [] };
  }
}
