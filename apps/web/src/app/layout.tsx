import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

// Embr's brand font. next/font downloads it when the app is built and serves
// it from our own site, so visitors' browsers never contact Google.
const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Each page sets its own title, shown as "Calendar · Embr"
  title: { default: "Embr", template: "%s · Embr" },
  description: "A daily companion for living with arthritis.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
