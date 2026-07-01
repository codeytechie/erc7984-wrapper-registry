import { knownTokenByWrapper, type PairView } from "@cwr/sdk";

export function symbolOf(p: PairView): string {
  return knownTokenByWrapper(p.wrapper)?.symbol ?? p.underlyingSymbol ?? "token";
}

// strip leading c + trailing Mock: cUSDCMock -> USDC
export function normalizeSymbol(s: string): string {
  return s.replace(/^c/, "").replace(/Mock$/, "");
}
