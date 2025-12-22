import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import ConditionalNavbar from "@/components/ConditionalNavbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inquizitive - Neuro-Stack Learning",
  description: "Mastery through Spaced Repetition and Active Recall",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100`}>
        <ConditionalNavbar />
        <main className="max-w-5xl mx-auto w-full">
          {children}
        </main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}