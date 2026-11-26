"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Palette,
  Bell,
  Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function SettingsPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("beige-orange");
  const [userType, setUserType] = useState<"learner" | "mentor">("learner");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    setIsVisible(true);
    const path = window.location.pathname;
    if (path.includes("/mentor")) {
      setUserType("mentor");
    }
  }, []);

  const colorThemes = [
    {
      id: "beige-orange",
      name: "Beige & Orange (Default)",
      primary: "#F26A0A",
      secondary: "#E85D04",
      description: "Official TopPlaced AI warm design system",
    },
    {
      id: "sunset-amber",
      name: "Sunset Amber",
      primary: "#E85D04",
      secondary: "#D95304",
      description: "Deep warm sunset orange accents",
    },
    {
      id: "deep-terracotta",
      name: "Warm Terracotta",
      primary: "#C84F04",
      secondary: "#B83E02",
      description: "Rich high-contrast earth and terracotta",
    },
  ];

  const applyTheme = (theme: (typeof colorThemes)[0]) => {
    const root = document.documentElement;
    root.style.setProperty("--primary-accent", theme.primary);
    root.style.setProperty("--secondary-accent", theme.secondary);

    const style = document.createElement("style");
    style.textContent = `
      :root {
        --primary-accent: ${theme.primary};
        --secondary-accent: ${theme.secondary};
      }
      .gradient-text {
        background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .btn-primary {
        background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});
        color: #302016;
        font-weight: 700;
      }
      .btn-primary:hover {
        background: ${theme.secondary};
      }
    `;

    const existingStyle = document.getElementById("dynamic-theme");
    if (existingStyle) existingStyle.remove();
    style.id = "dynamic-theme";
    document.head.appendChild(style);

    setSelectedTheme(theme.id);
    localStorage.setItem("selectedTheme", theme.id);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("selectedTheme");
    if (savedTheme) {
      const theme = colorThemes.find((t) => t.id === savedTheme);
      if (theme) applyTheme(theme);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F0E6] text-[#302016] flex flex-col font-sans selection:bg-[#FFF0E6] selection:text-[#F26A0A]">
      <Navbar />
      <Sidebar userType={userType} />
      <div className="md:ml-64 ml-0 pt-16 md:pt-20 pb-24 md:pb-12">
        <div className="max-w-none w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`mb-8 transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center mb-4">
              <Link
                href={userType === "learner" ? "/learner" : "/mentor"}
                className="flex items-center text-xs font-semibold text-[#E85D04] hover:text-[#F26A0A] transition-colors"
              >
                <ArrowLeft size={16} className="mr-1.5" /> Back to Dashboard
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#302016]">
              Portal <span className="bg-gradient-to-r from-[#F26A0A] to-[#E85D04] bg-clip-text text-transparent">Settings</span>
            </h1>
            <p className="text-[#68574B] text-base mt-1">
              Customize your TopPlaced AI portal appearance and notifications
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-[#FFF9F2] border border-[#F1D2B8] rounded-2xl p-6 sticky top-24 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#8B796B] mb-3">Preferences</h3>
                <nav className="space-y-1.5">
                  <a
                    href="#appearance"
                    className="flex items-center p-2.5 rounded-xl bg-[#FFF0E6] border border-[#F1D2B8] text-xs font-bold text-[#E85D04]"
                  >
                    <Palette size={16} className="mr-2.5 text-[#F26A0A]" /> Appearance
                  </a>
                  <a
                    href="#notifications"
                    className="flex items-center p-2.5 rounded-xl text-xs font-medium text-[#68574B] hover:text-[#302016] hover:bg-[#FFF8F0] transition-colors"
                  >
                    <Bell size={16} className="mr-2.5 text-[#8B796B]" /> Notifications
                  </a>
                </nav>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-8">
              <section id="appearance" className="bg-[#FFF9F2] border border-[#F1D2B8] rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0E6] border border-[#F1D2B8] flex items-center justify-center text-[#F26A0A] mr-3">
                    <Palette size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#302016]">Appearance & Accent Tone</h2>
                    <p className="text-xs text-[#68574B] mt-0.5">Choose your preferred warm accent tone within the design system</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {colorThemes.map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => applyTheme(theme)}
                      className={`relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                        selectedTheme === theme.id
                          ? "border-[#F26A0A] bg-[#FFF0E6] shadow-sm"
                          : "border-[#F1D2B8] bg-[#FFF8F0] hover:border-[#F26A0A]/50 hover:bg-[#FFF9F2]"
                      }`}
                    >
                      {selectedTheme === theme.id && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-[#F26A0A] rounded-full flex items-center justify-center text-white shadow-xs">
                          <Check size={14} className="stroke-[2.5]" />
                        </div>
                      )}
                      <div className="flex items-center mb-3">
                        <div
                          className="w-7 h-7 rounded-full mr-2 border border-black/10"
                          style={{ backgroundColor: theme.primary }}
                        ></div>
                        <div
                          className="w-5 h-5 rounded-full border border-black/10"
                          style={{ backgroundColor: theme.secondary }}
                        ></div>
                      </div>
                      <h4 className="font-bold text-sm text-[#302016] mb-1">{theme.name}</h4>
                      <p className="text-xs text-[#68574B] leading-relaxed">
                        {theme.description}
                      </p>
                      <div className="mt-3 p-2.5 bg-[#FFF9F2] border border-[#F1D2B8] rounded-xl">
                        <div
                          className="text-xs font-bold"
                          style={{ color: theme.primary }}
                        >
                          Preview Accent
                        </div>
                        <div
                          className="w-full h-1.5 rounded-full mt-1.5"
                          style={{
                            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section id="notifications" className="bg-[#FFF9F2] border border-[#F1D2B8] rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0E6] border border-[#F1D2B8] flex items-center justify-center text-[#F26A0A] mr-3">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#302016]">Notification Preferences</h2>
                    <p className="text-xs text-[#68574B] mt-0.5">Manage your interview reminders and platform notifications</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#FFF8F0] border border-[#F1D2B8] rounded-xl">
                    <div>
                      <div className="font-bold text-sm text-[#302016]">Email Notifications</div>
                      <div className="text-xs text-[#68574B] mt-0.5">
                        Receive score summaries and progress updates via email
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      aria-label="Toggle Email Notifications"
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        emailNotifications ? "bg-[#F26A0A]" : "bg-[#F1D2B8]"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          emailNotifications ? "right-1" : "left-1"
                        }`}
                      ></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#FFF8F0] border border-[#F1D2B8] rounded-xl">
                    <div>
                      <div className="font-bold text-sm text-[#302016]">Push Notifications</div>
                      <div className="text-xs text-[#68574B] mt-0.5">
                        In-browser alerts for live session invites and evaluation completion
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPushNotifications(!pushNotifications)}
                      aria-label="Toggle Push Notifications"
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        pushNotifications ? "bg-[#F26A0A]" : "bg-[#F1D2B8]"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          pushNotifications ? "right-1" : "left-1"
                        }`}
                      ></div>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
