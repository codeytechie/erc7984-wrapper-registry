import { knownTokenByWrapper, type PairView } from "@cwr/sdk";

export function symbolOf(p: PairView): string {
  return knownTokenByWrapper(p.wrapper)?.symbol ?? p.underlyingSymbol ?? "—";
}
