import { ConnectBar } from "@/components/connect-bar";
import { RegistryTable } from "@/components/registry-table";
import { TokenActions } from "@/components/token-actions";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <ConnectBar />
      <main className="mx-auto w-full max-w-4xl space-y-6 p-6">
        <RegistryTable />
        <TokenActions />
      </main>
    </div>
  );
}
