export interface ImportedRef {
  underlying: `0x${string}`;
  wrapper: `0x${string}`;
}

const keyFor = (chainId: number) => `cwr:imported:${chainId}`;

export function getImported(chainId: number): ImportedRef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyFor(chainId));
    return raw ? (JSON.parse(raw) as ImportedRef[]) : [];
  } catch {
    return [];
  }
}

export function addImported(chainId: number, ref: ImportedRef): void {
  const cur = getImported(chainId);
  if (cur.some((r) => r.wrapper.toLowerCase() === ref.wrapper.toLowerCase())) return;
  window.localStorage.setItem(keyFor(chainId), JSON.stringify([...cur, ref]));
}

export function removeImported(chainId: number, wrapper: string): void {
  const next = getImported(chainId).filter((r) => r.wrapper.toLowerCase() !== wrapper.toLowerCase());
  window.localStorage.setItem(keyFor(chainId), JSON.stringify(next));
}
