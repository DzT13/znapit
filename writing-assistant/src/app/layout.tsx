import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/providers/AppProvider";
import { Navigation } from "@/components/layout/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Writing Assistant Dashboard",
  description: "AI-powered writing assistant for organizing and analyzing blog posts and ideas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} h-full bg-gray-50 dark:bg-gray-900 antialiased`}>
        <AppProvider>
          <div className="min-h-full flex">
            <Navigation />
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
