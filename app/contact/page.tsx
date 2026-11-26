"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Mail, MessageCircle, Phone, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCF8] text-[#2B211C]">
      <Navbar />

      {/* Background subtle pattern */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(242,106,10,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(232,93,4,0.06),_transparent_55%)]" />
      </div>

      <main className="pt-28 pb-16">
        <div className="max-w-none w-full mx-auto px-6 lg:px-0">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF0E5] border border-[#E8D9CC] text-[#E85D04] text-xs font-bold tracking-wide mb-4 shadow-xs">
              CONTACT & SUPPORT
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#2B211C] mb-3">
              Let’s{" "}
              <span className="text-[#E85D04]">
                connect
              </span>
            </h1>
            <p className="text-base text-[#5C4E42] max-w-2xl mx-auto leading-relaxed">
              Share your query, ideas, or requirements. Our team will get back to
              you with a clear response and next steps.
            </p>
          </motion.div>

          {/* Main card */}
          <motion.div
            className="relative overflow-hidden border border-[#E8D9CC] rounded-3xl bg-[#FFFFFF] shadow-xl shadow-[#2B211C]/5"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)] p-6 md:p-8 lg:p-10">
              {/* LEFT: Info + status */}
              <div className="space-y-7 lg:pr-4 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#2B211C] mb-3">
                    Tell us what{" "}
                    <span className="text-[#E85D04]">
                      you need
                    </span>
                    .
                  </h2>
                  <p className="text-sm md:text-base text-[#5C4E42] leading-relaxed">
                    Whether it’s a support query, collaboration, or a new project,
                    drop the details here. We usually respond within{" "}
                    <span className="text-[#2B211C] font-semibold">
                      24 working hours
                    </span>
                    .
                  </p>
                </div>

                <div className="space-y-4 mt-4 md:mt-6">
                  <div className="flex items-center gap-3 text-sm text-[#2B211C]">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#FFF0E5] border border-[#E8D9CC] text-[#E85D04]">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#70645C] font-semibold">
                        Email
                      </p>
                      <p className="font-semibold text-[#2B211C]">support@topplaced.ai</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-[#2B211C]">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#FFF0E5] border border-[#E8D9CC] text-[#E85D04]">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#70645C] font-semibold">
                        Phone / WhatsApp
                      </p>
                      <p className="font-semibold text-[#2B211C]">+91-98765-XXXX0</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-[#2B211C]">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#FFF0E5] border border-[#E8D9CC] text-[#E85D04]">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#70645C] font-semibold">
                        Response time
                      </p>
                      <p className="font-semibold text-[#2B211C]">Typically within 24 hours</p>
                    </div>
                  </div>
                </div>

                {/* Status messages */}
                <div className="mt-3">
                  {status === "success" && (
                    <motion.div
                      className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-600" />
                      <p>Your message has been sent. We’ll get back to you soon.</p>
                    </motion.div>
                  )}

                  {status === "error" && (
                    <motion.div
                      className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-600" />
                      <p>Something went wrong. Please try again in a moment.</p>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* RIGHT: Form */}
              <div className="bg-[#FFFCF8] border border-[#E8D9CC] rounded-2xl p-5 md:p-6 lg:p-7 shadow-xs">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-[#5C4E42] mb-1.5">
                        Name
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-[#E8D9CC] bg-white px-3.5 py-2.5 text-sm text-[#2B211C] placeholder:text-[#70645C] outline-none transition-all focus:border-[#E85D04] focus:ring-2 focus:ring-[#E85D04]/20"
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-[#5C4E42] mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-[#E8D9CC] bg-white px-3.5 py-2.5 text-sm text-[#2B211C] placeholder:text-[#70645C] outline-none transition-all focus:border-[#E85D04] focus:ring-2 focus:ring-[#E85D04]/20"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-[#5C4E42] mb-1.5">
                      Subject
                    </label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full rounded-xl border border-[#E8D9CC] bg-white px-3.5 py-2.5 text-sm text-[#2B211C] placeholder:text-[#70645C] outline-none transition-all focus:border-[#E85D04] focus:ring-2 focus:ring-[#E85D04]/20"
                      placeholder="How can we help?"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-[#5C4E42] mb-1.5">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-xl border border-[#E8D9CC] bg-white px-3.5 py-2.5 text-sm text-[#2B211C] placeholder:text-[#70645C] outline-none transition-all focus:border-[#E85D04] focus:ring-2 focus:ring-[#E85D04]/20 resize-none min-h-[130px]"
                      placeholder="Share details about your query or project..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#E85D04] to-[#E85D04] hover:from-[#E85D04] hover:to-[#D45000] shadow-md shadow-orange-500/20 disabled:cursor-not-allowed disabled:opacity-70 min-h-[44px]"
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />
                        Submitting...
                      </>
                    ) : (
                      <>Send message</>
                    )}
                  </button>

                  <p className="mt-3 text-[11px] leading-relaxed text-[#70645C]">
                    By submitting this form, you agree to be contacted back on the
                    email or phone number you’ve shared.
                  </p>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
