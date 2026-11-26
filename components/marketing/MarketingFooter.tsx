"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Linkedin, Twitter, Youtube, Instagram } from "lucide-react";
import { RedSunReveal } from "@/components/marketing/RedSunMotion";

export default function MarketingFooter({ animated = false }: { animated?: boolean }) {
  const wrapCol = (node: React.ReactNode, delay: number, className: string) =>
    animated ? (
      <RedSunReveal variant="fade" delay={delay} className={className}>
        {node}
      </RedSunReveal>
    ) : (
      <div className={className}>{node}</div>
    );

  return (
    <footer className="topplaced-marketing-footer bg-[#FFFCF8] border-t border-[#E8D9CC] pt-10 pb-7 text-xs text-[#70645C]">
      <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top 4 Columns matching RedSun footer rhythm */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[#E8D9CC]">
          {/* Col 1: Brand + Headline */}
          {wrapCol(
            <>
              <Link href="/" className="inline-block">
                <Logo size="md" variant="redsun" />
              </Link>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#2B211C] tracking-tight leading-snug max-w-xs redsun-display">
                Transform Your Preparation with TopPlaced AI
              </h2>
              <p className="text-sm text-[#70645C] max-w-sm leading-relaxed">
                AI-powered interview preparation platform to help you practice, improve, and get placed.
              </p>
            </>,
            0,
            "md:col-span-5 space-y-4"
          )}

          {/* Col 2: Main Pages (2-column link cluster matching RedSun) */}
          {wrapCol(
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2B211C]">Product</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                <Link href="/#how-it-works" className="text-[#70645C] hover:text-[#E85D04] transition-colors">
                  How It Works
                </Link>
                <Link href="/pricing" className="text-[#70645C] hover:text-[#E85D04] transition-colors">
                  Pricing
                </Link>
                <Link href="/#features" className="text-[#70645C] hover:text-[#E85D04] transition-colors">
                  Features
                </Link>
                <Link href="/#testimonials" className="text-[#70645C] hover:text-[#E85D04] transition-colors">
                  Testimonials
                </Link>
                <Link href="/#faqs" className="text-[#70645C] hover:text-[#E85D04] transition-colors">
                  FAQs
                </Link>
                <Link href="/learner/interview/setup" className="text-[#E85D04] font-medium hover:text-[#E85D04] transition-colors">
                  Start Practice
                </Link>
              </div>
            </>,
            0.08,
            "md:col-span-3 space-y-3"
          )}

          {/* Col 3: Company */}
          {wrapCol(
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2B211C]">Company</p>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/about" className="text-[#70645C] hover:text-[#E85D04] transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="text-[#70645C] hover:text-[#E85D04] transition-colors">
                    Security &amp; Trust
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-[#70645C] hover:text-[#E85D04] transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-[#70645C] hover:text-[#E85D04] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-[#70645C] hover:text-[#E85D04] transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </>,
            0.16,
            "md:col-span-2 space-y-3"
          )}

          {/* Col 4: Social Media */}
          {wrapCol(
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2B211C]">Social Media</p>
              <div className="flex items-center gap-2.5 pt-1">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-[#FFFFFF] border border-[#E8D9CC] hover:border-[#E85D04] hover:text-[#E85D04] text-[#70645C] flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_12px_rgba(242,106,10,0.18)]"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-[#FFFFFF] border border-[#E8D9CC] hover:border-[#E85D04] hover:text-[#E85D04] text-[#70645C] flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_12px_rgba(242,106,10,0.18)]"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-[#FFFFFF] border border-[#E8D9CC] hover:border-[#E85D04] hover:text-[#E85D04] text-[#70645C] flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_12px_rgba(242,106,10,0.18)]"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-[#FFFFFF] border border-[#E8D9CC] hover:border-[#E85D04] hover:text-[#E85D04] text-[#70645C] flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_12px_rgba(242,106,10,0.18)]"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </>,
            0.24,
            "md:col-span-2 space-y-3"
          )}
        </div>

        {/* Bottom Legal Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#70645C]">
          <p>© 2026 TopPlaced AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#2B211C] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#2B211C] transition-colors">
              Terms
            </Link>
            <Link href="/security" className="hover:text-[#2B211C] transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

