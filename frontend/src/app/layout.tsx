import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hyperion",
  description: "Campus bus ride points — University of Ilorin SWEP",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <body className={`${spaceGrotesk.className} min-h-full flex flex-col bg-app text-slate-900`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
