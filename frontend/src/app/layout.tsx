import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Hyperion",
  description: "Pay for campus buses with ride points",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className={`${nunito.className} min-h-full flex flex-col bg-app text-slate-900`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
