import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const telegraf = localFont({
  src: [
    { path: "./fonts/Telegraf-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Telegraf-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-telegraf",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Confidential Wrapper Registry",
  description: "Wrap any ERC-20 into a confidential ERC-7984 token on Zama. Balances live encrypted on-chain.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${telegraf.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
