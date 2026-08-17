import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookBridge 2.0 – AI-Powered Academic Ecosystem",
  description: "India's premier student platform for books, notes, lab manuals, past papers, projects, and real-time academic collaboration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body class="antialiased selection:bg-brand-accent selection:text-white">
        {children}
      </body>
    </html>
  );
}
