import type { Metadata } from "next";
import { Nunito, DM_Sans } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Tink - Speak. Learn. Grow.",
  description:
    "AI voice tutoring platform — learn any subject through real-time conversation, flashcards, and quizzes powered by Google Gemini.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${nunito.variable} ${dmSans.variable} antialiased bg-[--bg-deep] text-[#E8E6F0] min-h-screen`}
        style={{ fontFamily: "var(--font-dm-sans), Arial, Helvetica, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
