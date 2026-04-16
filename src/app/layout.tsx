import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { AuthShell } from "@/components/layout/auth-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rivius Ops",
  description: "Internal operations dashboard for Rivius",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} font-sans antialiased`}>
        <TooltipProvider>
          <AuthShell>{children}</AuthShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
