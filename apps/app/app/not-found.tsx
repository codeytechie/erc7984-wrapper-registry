import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-between px-6 pt-6 pb-10 sm:px-10 sm:pt-8 sm:pb-14">
      <header className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <span>Confidential Wrapper Registry</span>
        <Link href="/" className="transition-colors hover:text-foreground">
          Back to app
        </Link>
      </header>

      <section>
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">404</p>
        <p className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.12] tracking-[-0.02em] sm:text-5xl">
          This page does not exist.
        </p>
        <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground">
          The page you requested was moved or never existed. Head back to the registry to browse, wrap and unwrap
          confidential tokens.
        </p>
      </section>

      <footer className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
      </footer>
    </main>
  );
}
