"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Play } from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import BottomNav from "@/components/BottomNav";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { toast } from "sonner";

export default function JDInterviewSetupPage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("30");

  const durations = [
    { id: "15", name: "15 Minutes" },
    { id: "30", name: "30 Minutes" },
    { id: "45", name: "45 Minutes" },
    { id: "60", name: "60 Minutes" },
  ];

  const handleStartInterview = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please paste a Job Description to continue");
      return;
    }

    if (jobDescription.length < 50) {
      toast.error("Job Description is too short. Please provide more details.");
      return;
    }

    setLoading(true);

    try {
      // Save JD to localStorage for the voice session to pick up
      localStorage.setItem("topplaced_jd_context", jobDescription);

      // Also set a flag to indicate this is a JD-based interview
      localStorage.setItem("topplaced_interview_mode", "jd_based");

      // Redirect to voice session with selected parameters
      const params = new URLSearchParams({
        level: "intermediate", // Default, as JD determines difficulty
        category: "fullstack", // Default fallback, AI will override based on JD
        language: "javascript", // Default fallback, AI will override based on JD
        duration: selectedDuration,
        userId: user?._id || "",
        userName: user?.name || "",
        userEmail: user?.email || "",
        isFreeInterview: "true",
      });

      router.push(`/learner/interview/voice-session?${params.toString()}`);
    } catch (error) {
      console.error("Error starting interview:", error);
      toast.error("Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFFCF8] text-[#2B211C] font-sans selection:bg-[#FFFCF8] selection:text-[#E85D04]">
        <Navbar />
        <Sidebar userType="learner" />

        <main className="pt-20 md:pl-64 pb-20 md:pb-8 transition-all duration-300">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#2B211C] mb-2">
                JD Based Interview
              </h1>
              <p className="text-[#70645C] text-lg">
                Paste a Job Description to simulate a real interview for that
                specific role.
              </p>
            </div>

            {/* Input Area */}
            <div className="bg-[#FFFFFF] p-6 md:p-8 rounded-2xl border border-[#E8D9CC] shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#E85D04]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FFFCF8] flex items-center justify-center text-[#E85D04]">
                    <FileText size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-[#2B211C]">
                    Job Description
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Duration Selection */}
                  <div className="space-y-2">
                    <label className="text-sm text-[#70645C] block">
                      Duration
                    </label>
                    <select
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                      className="w-full bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl p-3 text-[#2B211C] focus:outline-none focus:border-[#E85D04] focus-visible:ring-2 focus-visible:ring-[#E85D04]"
                    >
                      {durations.map((dur) => (
                        <option key={dur.id} value={dur.id}>
                          {dur.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="jd-input"
                    className="text-sm text-[#70645C] block"
                  >
                    Paste the full job description here (responsibilities,
                    requirements, etc.)
                  </label>
                  <textarea
                    id="jd-input"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="e.g. We are looking for a Senior React Developer with experience in..."
                    className="w-full h-64 bg-[#FFFCF8] border border-[#E8D9CC] rounded-xl p-4 text-[#2B211C] placeholder-[#64748B] focus:outline-none focus:border-[#E85D04] focus-visible:ring-2 focus-visible:ring-[#E85D04] transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleStartInterview}
                    disabled={loading}
                    className={`
                      relative group px-8 py-4 bg-gradient-to-r from-[#E85D04] to-[#E85D04] text-white font-bold text-lg rounded-xl 
                      transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/25
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    `}
                  >
                    <div className="flex items-center space-x-2">
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Play size={20} fill="currentColor" />
                      )}
                      <span>{loading ? "Starting..." : "Start Interview"}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
