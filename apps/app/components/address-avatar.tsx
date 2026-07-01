import Avatar from "boring-avatars";

const COLORS = ["#ffd208", "#111111", "#f4f4f4", "#8a8a90", "#3a3a3a"];

// deterministic open-source avatar from the address
export function AddressAvatar({ address, size = 18 }: { address: string; size?: number }) {
  return <Avatar size={size} name={address.toLowerCase()} variant="beam" colors={COLORS} />;
}
