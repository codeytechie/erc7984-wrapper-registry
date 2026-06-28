import Image from "next/image";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center">
      <Image src="/brand/zama-z.svg" alt="Zama" width={72} height={72} priority />
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Confidential Wrapper Registry</h1>
        <p className="text-lg text-muted-foreground">
          Browse every ERC-20 to ERC-7984 pair on the Zama protocol. Wrap, decrypt your balance via EIP-712, and unwrap,
          all from one place.
        </p>
      </div>
      <a
        href={APP_URL}
        className="inline-flex h-12 items-center rounded-md bg-primary px-8 font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Launch App
      </a>
    </main>
  );
}
