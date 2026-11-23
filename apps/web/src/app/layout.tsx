import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
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
      <body className="min-h-full">
        {/*
          Clerk handles accounts. Every page can ask who is signed in, and
          Clerk's forms use Embr's colours through the shadcn theme.
        */}
        <ClerkProvider
          appearance={{ theme: shadcn, cssLayerName: "clerk" }}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
          afterSignOutUrl="/"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
