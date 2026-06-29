import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

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
  description: "Browse, wrap, decrypt, and unwrap ERC-7984 confidential tokens on Zama.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${telegraf.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
        <Toaster richColors theme="dark" />
      </body>
    </html>
  );
}
