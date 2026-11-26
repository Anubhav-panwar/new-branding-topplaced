import "./globals.css";

import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import Providers from "./providers";
import AnalyticsTracker from "@/components/AnalyticsTracker";

export const metadata: Metadata = {
  title: "TopPlaced AI | AI-Powered Career Development Platform",
  description:
    "Master your career with AI-powered mock interviews, personalized feedback, and expert mentorship. Connect with top mentors and accelerate your professional growth.",
  keywords:
    "AI interviews, career development, mentorship, skill assessment, professional growth",
  authors: [{ name: "TopPlaced Team" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-[#FFFCF8] text-[#2B211C] antialiased">
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />

        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RE6L798S4V"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];

            function gtag() {
              window.dataLayer.push(arguments);
            }

            gtag("js", new Date());
            gtag("config", "G-RE6L798S4V");
          `}
        </Script>

        <div className="min-h-screen">
          <Providers>
            <Suspense fallback={null}>
              <AnalyticsTracker />
            </Suspense>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}