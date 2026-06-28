import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Confidential Wrapper Registry",
  description: "Wrap, decrypt, and unwrap every ERC-7984 confidential token on Zama.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
