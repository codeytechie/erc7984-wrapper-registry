import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Confidential Wrapper Registry",
  description: "Browse, wrap, decrypt, and unwrap ERC-7984 confidential tokens on Zama.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <Providers>{children}</Providers>
        <Toaster richColors theme="dark" position="top-right" />
      </body>
    </html>
  );
}
