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

import { getSubjects } from "./actions";
import { cookies } from "next/headers";
import { SubjectProvider } from "@/contexts/SubjectContext";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies()
  const currentSubject = cookieStore.get('subject')?.value || 'General'
  const subjects = await getSubjects()

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased selection:bg-neon-blue selection:text-black`}>
        <SubjectProvider initialSubject={currentSubject} initialSubjects={subjects}>
          <ConditionalNavbar />
          <main className="w-full">
            {children}
          </main>
          <Toaster position="top-center" />
        </SubjectProvider>
      </body>
    </html>
  );
}