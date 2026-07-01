import Image from "next/image";

// mainnet + sepolia both ride the Ethereum icon (sepolia is an ETH testnet)
export function ChainIcon({ size = 16 }: { size?: number }) {
  return <Image src="/chains/ethereum.png" alt="" width={size} height={size} className="rounded-full" />;
}
