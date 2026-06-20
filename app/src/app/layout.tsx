import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { WalletProviderWrapper } from "@/components/WalletProvider";
import { Navbar } from "@/components/Navbar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "SquadPass - World Cup Fan Club Subscriptions on Solana",
  description:
    "Join country-based matchday squads through recurring USDC payments, unlock match predictions, and build an on-chain leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-white`}
      >
        <WalletProviderWrapper>
          <Navbar />
          <main className="pt-16 min-h-screen">{children}</main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1e293b",
                color: "#f8fafc",
                border: "1px solid #334155",
                borderRadius: "12px",
                fontSize: "14px",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#f8fafc",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#f8fafc",
                },
              },
            }}
          />
        </WalletProviderWrapper>
      </body>
    </html>
  );
}
