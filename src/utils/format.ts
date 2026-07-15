/** Shortens an address or hash to `0x1234…abcd` form for compact display. */
export function truncateHex(value: string, lead = 6, trail = 4): string {
  if (value.length <= lead + trail + 3) return value;
  return `${value.slice(0, lead)}…${value.slice(-trail)}`;
}

/** Formats an integer with thousands separators (e.g. gas, block numbers). */
export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

/** Formats an ISO timestamp as a relative "x min ago" string, falling back to a date. */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const diffMin = Math.round(diffMs / 60_000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

/** Formats an ISO timestamp as an absolute, human-readable date/time. */
export function formatAbsoluteTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Converts a raw uint256-as-string token amount (18 decimals) into a readable number. */
export function formatTokenAmount(raw: string, decimals = 18): string {
  try {
    const value = BigInt(raw);
    const divisor = BigInt(10) ** BigInt(decimals);
    const whole = value / divisor;
    const fraction = value % divisor;
    if (fraction === BigInt(0)) return whole.toLocaleString("en-US");
    const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "");
    return fractionStr ? `${whole.toLocaleString("en-US")}.${fractionStr}` : whole.toLocaleString("en-US");
  } catch {
    return raw;
  }
}
