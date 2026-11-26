"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import {
  ArrowRight,
  Menu,
  X,
  User,
  ShieldCheck,
  Home,
  Workflow,
  Layers,
  Video,
  Tag,
  HelpCircle,
  LayoutDashboard,
  Mic,
  History,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store/store";
import { logout } from "@/store/slices/authSlice";
import { useRouter, usePathname } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

export interface NavbarProps {
  theme?: string;
}

export default function Navbar({ theme = "auto" }: NavbarProps = {}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const isHomePage = pathname === "/";
  const isLearnerSection =
    pathname.startsWith("/learner") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/security");

  const handleLogout = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (e) {
      // swallow network errors
    } finally {
      document.cookie = "token=; Max-Age=0; Path=/; SameSite=Lax";
      dispatch(logout());
      router.replace("/login");
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  const homeNavItems = [
    { name: "Home", href: "/#", icon: Home, active: isHomePage },
    { name: "How it works", href: "/#how-it-works", icon: Sparkles, active: false },
    { name: "Features", href: "/#features", icon: Layers, active: false },
    { name: "Interview Showcase", href: "/#showcase", icon: Video, active: false },
    { name: "Pricing", href: "/#pricing", icon: Tag, active: false },
    { name: "FAQs", href: "/#faqs", icon: HelpCircle, active: false },
  ];

  const learnerNavItems = [
    { name: "Dashboard", href: "/learner", icon: LayoutDashboard, active: pathname === "/learner" },
    { name: "AI Interview", href: "/learner/interview/setup", icon: Mic, active: pathname.startsWith("/learner/interview") },
    { name: "History", href: "/learner/history", icon: History, active: pathname === "/learner/history" },
    { name: "Plans", href: "/learner/plans", icon: CreditCard, active: pathname === "/learner/plans" },
    { name: "Security & Trust", href: "/security", icon: ShieldCheck, active: pathname === "/security" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isDark
          ? "bg-[#120B07]/95 backdrop-blur-md border-b border-white/10 text-white"
          : "bg-[#FFFCF8]/92 backdrop-blur-md border-b border-[#E8D9CC]/60"
      }`}
    >
      <div className="section-container flex items-center justify-between h-16">
        {/* Left: Brand Logo & Intelligence Status */}
        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          <Link href="/" className="flex items-center group shrink-0" aria-label="TopPlaced AI Home">
            <Logo size="md" variant={isDark ? "dark" : "light"} />
          </Link>

          {/* Real-time System Status Pill */}
          <div
            className={`hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs ${
              isDark
                ? "bg-white/10 border border-white/15 text-white/90"
                : "bg-[#F9E6D4]/70 border border-[#E8D9CC] text-[#2B211C]"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E85D04] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E85D04]" />
            </span>
            <span>AI Interview Platform</span>
          </div>
        </div>

        {/* Center: Desktop Navigation Links With Icons */}
        <nav
          className={`hidden md:flex items-center gap-1.5 lg:gap-2 text-xs lg:text-[13px] font-medium ${
            isDark ? "text-white/70" : "text-[#70645C]"
          }`}
        >
          {(isLearnerSection ? learnerNavItems : homeNavItems).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 group ${
                  item.active
                    ? isDark
                      ? "bg-white/15 text-white shadow-2xs font-bold"
                      : "bg-[#FFF0E6] text-[#E85D04] shadow-2xs font-bold"
                    : isDark
                    ? "text-white/75 hover:text-white hover:bg-white/10"
                    : "text-[#70645C] hover:text-[#2B211C] hover:bg-[#F9E6D4]/40"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
                    item.active
                      ? isDark
                        ? "text-[#FF9238]"
                        : "text-[#E85D04]"
                      : isDark
                      ? "text-white/60 group-hover:text-[#FF9238]"
                      : "text-[#70645C] group-hover:text-[#E85D04]"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions / Auth CTAs */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {mounted && user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-semibold shadow-xs min-h-[40px] ${
                  isDark
                    ? "bg-white/10 border border-white/20 text-white hover:border-[#E85D04]"
                    : "bg-white border border-[#E8D9CC] hover:border-[#E85D04] text-[#2B211C]"
                }`}
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#E85D04] to-[#B94308] text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden shrink-0">
                  {user.profile_image ? (
                    <img
                      src={
                        user.profile_image.startsWith("http") || user.profile_image.startsWith("data:")
                          ? user.profile_image
                          : `${API_URL}${user.profile_image.startsWith("/") ? "" : "/"}${user.profile_image}`
                      }
                      alt={user.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : user.name ? (
                    user.name[0].toUpperCase()
                  ) : (
                    "U"
                  )}
                </div>
                <span className="hidden sm:inline font-medium">{user.name || "Candidate"}</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E8D9CC] rounded-2xl py-2 shadow-xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150 origin-top-right text-[#2B211C]">
                  <div className="px-4 py-2 border-b border-[#E8D9CC]/60 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#E85D04] to-[#B94308] text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden shrink-0">
                      {user.profile_image ? (
                        <img
                          src={
                            user.profile_image.startsWith("http") || user.profile_image.startsWith("data:")
                              ? user.profile_image
                              : `${API_URL}${user.profile_image.startsWith("/") ? "" : "/"}${user.profile_image}`
                          }
                          alt={user.name || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : user.name ? (
                        user.name[0].toUpperCase()
                      ) : (
                        "U"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#2B211C] truncate">{user.name || "Candidate"}</p>
                      <p className="text-[#70645C] truncate text-[11px]">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/learner"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2.5 text-[#2B211C] hover:bg-[#FFFCF8] hover:text-[#E85D04] font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/learner/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-[#70645C] hover:bg-[#FFFCF8] hover:text-[#E85D04] font-medium"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    href="/security"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-[#70645C] hover:bg-[#FFFCF8] hover:text-[#E85D04] font-medium"
                  >
                    Security & Trust
                  </Link>
                  {((user.role as string) === "admin" ||
                    (user.role as string) === "superadmin" ||
                    (user as any).isAdmin) && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-[#E85D04] hover:bg-[#F9E6D4]/30 font-medium"
                      >
                        Super Admin Console
                      </Link>
                    )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium border-t border-[#E8D9CC]/60 mt-1 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className={`hidden sm:inline-block text-sm font-semibold transition-colors ${
                  isDark
                    ? "text-white/80 hover:text-white"
                    : "text-[#70645C] hover:text-[#2B211C]"
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/learner/interview/setup"
                className="btn-brand-primary whitespace-nowrap shadow-sm text-xs sm:text-sm px-4 sm:px-5 py-2.5"
              >
                <span>Start Free Practice</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
              isDark
                ? "text-white hover:bg-white/10"
                : "text-[#2B211C] hover:bg-[#F9E6D4]/50"
            }`}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className={`md:hidden section-container py-4 space-y-1.5 border-b shadow-lg animate-in slide-in-from-top-2 duration-150 ${
            isDark
              ? "bg-[#120B07] border-white/15 text-white"
              : "bg-[#FFFCF8] border-[#E8D9CC] text-[#2B211C]"
          }`}
        >
          {(isLearnerSection ? learnerNavItems : homeNavItems).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  item.active
                    ? isDark
                      ? "bg-white/15 text-white font-bold"
                      : "bg-[#FFF0E6] text-[#E85D04] font-bold"
                    : isDark
                    ? "text-white/80 hover:bg-white/10"
                    : "text-[#70645C] hover:text-[#2B211C] hover:bg-[#F9E6D4]/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${item.active ? "text-[#E85D04]" : "text-[#70645C]"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-[#E8D9CC] space-y-2">
            {!user && (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full btn-brand-secondary text-center"
              >
                Sign In
              </Link>
            )}
            <Link
              href="/learner/interview/setup"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full btn-brand-primary text-center"
            >
              Start Free Practice →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
