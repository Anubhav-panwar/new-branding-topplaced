"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FFFCF8] text-[#2B211C]">
      <Navbar />
      {/* Background grid / glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(242,106,10,0.12),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(232,93,4,0.08),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(241,210,184,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(241,210,184,0.15)_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      <div className="pt-24 pb-16">
        <div className="container-custom max-w-5xl mx-auto px-4 lg:px-0">
          {/* Hero */}
          <motion.header
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-[#70645C] mb-3">
              Legal · TopPlaced
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
              Terms of{" "}
              <span className="text-[#E85D04]">
                Service
              </span>
            </h1>
            <p className="text-sm md:text-base text-[#5C4E42] max-w-2xl mx-auto">
              These Terms of Service (&quot;Terms&quot;) govern your access to and
              use of the <span className="font-semibold text-[#2B211C]">TopPlaced</span>{" "}
              platform—our AI-powered interview and assessment tools for
              candidates, companies, and recruiters.
            </p>
            <p className="mt-3 text-[11px] text-[#70645C]">
              Last updated: 26 November 2025
            </p>
          </motion.header>

          {/* Clean 2D card with crisp font rendering */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              whileHover={{ translateY: -3 }}
              className="relative rounded-3xl border border-[#E8D9CC] bg-[#FFFFFF] shadow-xl shadow-[#2B211C]/5 overflow-hidden transform-gpu backface-hidden"
            >
              {/* warm ambient glow */}
              <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-[#E85D04]/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-40 -left-24 h-72 w-72 rounded-full bg-[#E8D9CC]/20 blur-3xl" />

              <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] p-6 md:p-8 lg:p-10">
                {/* Left side: mini TOC */}
                <aside className="hidden lg:flex flex-col justify-between border-r border-[#E8D9CC] pr-8">
                  <div>
                    <h2 className="text-sm font-semibold text-[#2B211C] mb-3">
                      Overview
                    </h2>
                    <p className="text-xs text-[#70645C]">
                      TopPlaced helps candidates practice AI-driven interviews,
                      receive structured feedback, and share results securely with
                      hiring teams.
                    </p>

                    <div className="mt-6 space-y-2 text-xs">
                      <p className="text-[#70645C] uppercase tracking-[0.18em] mb-1">
                        Sections
                      </p>
                      <ul className="space-y-1 text-[#5C4E42]">
                        <li>1. About TopPlaced</li>
                        <li>2. Eligibility & Accounts</li>
                        <li>3. Use of Service</li>
                        <li>4. AI Interviews & Results</li>
                        <li>5. User Content</li>
                        <li>6. Payments</li>
                        <li>7. Privacy</li>
                        <li>8. Intellectual Property</li>
                        <li>9. Disclaimers</li>
                        <li>10. Liability</li>
                        <li>11. Changes</li>
                        <li>12. Contact</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-[#E8D9CC] text-[11px] text-[#70645C]">
                    This summary is for convenience only. Please read the full
                    Terms carefully.
                  </div>
                </aside>

                {/* Right side: main terms */}
                <main className="space-y-7 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar text-sm md:text-[15px] leading-relaxed">
                  {/* 1 */}
                  <section id="about">
                    <h2 className="text-lg md:text-xl font-semibold mb-1.5">
                      1. About TopPlaced
                    </h2>
                    <p className="text-[#111827]">
                      TopPlaced is an AI-driven interview and assessment platform.
                      Candidates can practice interviews, attempt coding and
                      scenario-based tasks, receive feedback, and optionally share
                      their performance with companies and recruiters. Employers
                      and hiring partners can use TopPlaced to evaluate skills in
                      a structured, scalable, and objective way.
                    </p>
                  </section>

                  {/* 2 */}
                  <section id="eligibility">
                    <h2 className="text-lg md:text-xl font-semibold mb-1.5">
                      2. Eligibility & Accounts
                    </h2>
                    <p className="text-[#475569] mb-2">
                      By using the Service, you confirm that:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[#475569]">
                      <li>
                        You are at least 18 years old, or the age of majority in
                        your jurisdiction.
                      </li>
                      <li>
                        The information you provide (profile, experience, contact
                        details) is accurate, current, and complete.
                      </li>
                      <li>
                        You are responsible for all activity under your account
                        and will keep your login credentials secure.
                      </li>
                    </ul>
                    <p className="text-[#475569] mt-2">
                      We may suspend or terminate accounts that violate these
                      Terms or are used in a fraudulent or abusive manner.
                    </p>
                  </section>

                  {/* 3 */}
                  <section id="use">
                    <h2 className="text-lg md:text-xl font-semibold mb-1.5">
                      3. Acceptable Use of the Service
                    </h2>
                    <p className="text-[#475569] mb-2">
                      You agree to use TopPlaced only for lawful and legitimate
                      purposes. You must not:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[#475569]">
                      <li>
                        Misrepresent your identity, skills, employment history, or
                        any part of your profile.
                      </li>
                      <li>
                        Attempt to cheat, bypass, or manipulate interview
                        questions, coding tests, or scoring logic.
                      </li>
                      <li>
                        Share leaked questions, proprietary content, or any
                        confidential material from employer assessments.
                      </li>
                      <li>
                        Interfere with the security, integrity, or performance of
                        the platform, including automated scraping or reverse
                        engineering.
                      </li>
                      <li>
                        Upload content that is illegal, harmful, harassing,
                        discriminatory, or infringes third-party rights.
                      </li>
                    </ul>
                  </section>

                  {/* 4 */}
                  <section id="ai-results">
                    <h2 className="text-lg md:text-xl font-semibold mb-1.5">
                      4. AI Interviews, Scoring & Results
                    </h2>
                    <p className="text-[#475569] mb-2">
                      TopPlaced uses AI models and evaluation logic to analyze
                      your responses (including text, audio, video, and code) and
                      generate scores, feedback, and insights.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[#475569]">
                      <li>
                        Results are intended as guidance and decision support, not
                        as a guarantee of your ability or future performance.
                      </li>
                      <li>
                        With your consent, your reports and highlights may be
                        shared with companies or recruiters you choose to connect
                        with.
                      </li>
                      <li>
                        Employers may use their own criteria, processes, and
                        human review in addition to TopPlaced results.
                      </li>
                    </ul>
                    <p className="text-[#475569] mt-2">
                      We continuously improve our models but cannot guarantee
                      perfect accuracy, fairness, or suitability for every role or
                      candidate.
                    </p>
                  </section>

                  {/* 5 */}
                  <section id="content">
                    <h2 className="text-lg md:text-xl font-semibold mb-1.5">
                      5. User Content & License
                    </h2>
                    <p className="text-[#475569] mb-2">
                      &quot;User Content&quot; includes your responses, uploads,
                      recordings, code solutions, feedback, and profile data that
                      you submit to TopPlaced.
                    </p>
                    <p className="text-[#475569] mb-2">
                      You retain ownership of your User Content. However, by using
                      the Service you grant TopPlaced a worldwide,
                      non-exclusive, royalty-free license to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[#475569]">
                      <li>Store and process your content to deliver the Service.</li>
                      <li>
                        Generate assessments, reports, and insights for you and
                        for hiring partners you choose to share with.
                      </li>
                      <li>
                        Use anonymized or aggregated data to improve our models,
                        features, and overall platform quality.
                      </li>
                    </ul>
                    <p className="text-[#475569] mt-2">
                      You confirm that you have the right to share this content
                      and that it does not violate any third-party rights or
                      confidentiality obligations.
                    </p>
                  </section>

                  {/* 6 */}
                  <section id="payments">
                    <h2 className="text-lg md:text-xl font-semibold mb-1.5">
                      6. Plans, Payments & Refunds
                    </h2>
                    <p className="text-[#475569]">
                      Some features of TopPlaced may be offered on paid plans
                      (e.g., premium interview packs, detailed reports, or
                      recruiter tools). By starting a paid plan, you agree to pay
                      the fees shown at checkout. Unless explicitly stated,
                      payments are non-refundable, except where required by
                      applicable law or as specified in a separate written
                      agreement.
                    </p>
                  </section>

                  {/* 7 */}
                  <section id="privacy">
                    <h2 className="text-lg md:text-xl font-semibold mb-1.5">
                      7. Privacy & Data Protection
                    </h2>
                    <p className="text-[#475569]">
                      Our collection and use of personal information is described
                      in our separate{" "}
                      <span className="underline underline-offset-4">
                        Privacy Policy
                      </span>
                      . By using TopPlaced, you agree that we may process your data
                      in accordance with that policy. We implement reasonable
                      technical and organizational measures to protect your data,
                      but no system can be guaranteed to be 100% secure.
                    </p>
                  </section>

                  {/* 8 */}
                  <section id="ip">
                    <h2 className="text-lg md:text-xl font-semibold mb-1.5">
                      8. Intellectual Property
                    </h2>
                    <p className="text-[#475569]">
                      The TopPlaced platform, including its software, AI models,
                      branding, and design, is owned by TopPlaced and its
                      licensors. Except for the limited right to use the Service
                      under these Terms, no rights are transferred to you. You
                      may not copy, modify, distribute, or create derivative works
                      from our platform or attempt to extract or replicate our
                      models.
                    </p>
                  </section>

                  {/* 9 */}
                  <section id="disclaimers">
                    <h2 className="text-lg md:text-xl font-semibold mb-1.5">
                      9. Disclaimers
                    </h2>
                    <p className="text-[#475569] mb-2">
                      The Service is provided on an &quot;as-is&quot; and
                      &quot;as-available&quot; basis. To the maximum extent
                      permitted by law, we disclaim all warranties, express or
                      implied, including but not limited to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[#475569]">
                      <li>Fitness for a particular job, role, or outcome.</li>
                      <li>
                        Continuous availability, error-free operation, or
                        compatibility with every device or browser.
                      </li>
                      <li>
                        Any guarantee that using TopPlaced will result in a job,
                        promotion, or specific hiring decision.
                      </li>
                    </ul>
                  </section>

                  {/* 10 */}
                  <section id="liability">
                    <h2 className="text-lg md:text-xl font-semibold mb-1.5">
                      10. Limitation of Liability
                    </h2>
                    <p className="text-[#475569]">
                      To the fullest extent permitted by law, TopPlaced, its
                      affiliates, and their respective officers, employees, and
                      partners shall not be liable for any indirect, incidental,
                      special, consequential, or punitive damages, or any loss of
                      profits or data, arising out of or in connection with your
                      use of the Service.
                    </p>
                  </section>

                  {/* 11 */}
                  <section id="changes">
                    <h2 className="text-lg md:text-xl font-semibold mb-1.5">
                      11. Changes to These Terms
                    </h2>
                    <p className="text-[#475569]">
                      We may update these Terms from time to time. When we make
                      material changes, we will update the &quot;Last updated&quot;
                      date above and may provide additional notice. Your continued
                      use of TopPlaced after changes become effective constitutes
                      acceptance of the revised Terms.
                    </p>
                  </section>

                  {/* 12 */}
                  <section id="contact">
                    <h2 className="text-lg md:text-xl font-semibold mb-1.5">
                      12. Contact Us
                    </h2>
                    <p className="text-[#475569]">
                      If you have any questions about these Terms or how TopPlaced
                      works, please reach out via the{" "}
                      <span className="underline underline-offset-4">
                        contact form
                      </span>{" "}
                      on our website or email us at{" "}
                      <span className="font-medium">support@topplaced.com</span>.
                    </p>
                  </section>

                  <p className="text-[11px] text-[#64748B] pt-4 border-t border-[#E5E7EB]">
                    This Terms of Service text is a general template and should be
                    reviewed and customized by your legal advisor before being
                    used in production.
                  </p>
                </main>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
