import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Target", template: "%s · Target" },
  description: "Company strategy, Rocks and initiatives in one place.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
