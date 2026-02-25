import type { Metadata } from "next";
import "./globals.css";
import { SimulatorProvider } from "./context/SimulatorContext";
import AppShell from "./components/AppShell";

export const metadata: Metadata = {
  title: "Japan FIRE Calculator — Retire Early in Japan",
  description:
    "Simulate your path to Financial Independence in Japan. Models iDeCo, NISA, taxable accounts, inflation, and the 4% safe withdrawal rule.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=block"
          rel="stylesheet"
        />
      </head>
      <body>
        <SimulatorProvider>
          <AppShell>{children}</AppShell>
        </SimulatorProvider>
      </body>
    </html>
  );
}
