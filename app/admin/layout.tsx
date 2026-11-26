"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Logo from "@/components/Logo";
import {
  LayoutDashboard,
  Users,
  Video,
  HardDrive,
  BarChart3,
  ScrollText,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Lock,
} from "lucide-react";
import { getAdminToken, getCurrentAdminUser, adminFetch } from "@/lib/adminApi";
import { REDSUN_OUT_EXPO } from "@/components/admin/AdminRedSunUI";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const clearAdminSession = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("user");
        document.cookie = "token=; Max-Age=0; Path=/; SameSite=Lax";
      } catch (e) {
        console.error("Error clearing admin session:", e);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function verifyAdminAuth() {
      if (isAuthorized) return;

      const token = getAdminToken();
      if (!token) {
        if (isMounted) {
          const redirectPath = pathname ? encodeURIComponent(pathname) : "%2Fadmin";
          router.replace(`/login?redirect=${redirectPath}`);
        }
        return;
      }

      try {
        // Ping admin stats to confirm backend verifies admin role
        const stats = await adminFetch("/api/admin/dashboard/stats?days=1");
        if (!isMounted) return;

        if (stats && stats.success) {
          setIsAuthorized(true);
          const cachedUser = getCurrentAdminUser();
          setAdminUser(
            cachedUser || {
              email: "admin@test.com",
              fullName: "Super Administrator",
              role: "superadmin",
            }
          );
          setDbHealthy(true);
        } else {
          clearAdminSession();
          const redirectPath = pathname ? encodeURIComponent(pathname) : "%2Fadmin";
          router.replace(`/login?redirect=${redirectPath}&reason=admin_unauthorized`);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Admin verification failed:", err);
        clearAdminSession();
        const msg = String(err?.message || "").toLowerCase();
        const reason =
          msg.includes("super administrator") || msg.includes("restricted") || msg.includes("403")
            ? "admin_unauthorized"
            : "session_expired";
        const redirectPath = pathname ? encodeURIComponent(pathname) : "%2Fadmin";
        router.replace(`/login?redirect=${redirectPath}&reason=${reason}`);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    verifyAdminAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    clearAdminSession();
    router.replace("/login");
  };

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard, group: "core" },
    { label: "User Management", href: "/admin/users", icon: Users, group: "core" },
    { label: "Interviews", href: "/admin/interviews", icon: Video, group: "core" },
    { label: "Recordings & Retention", href: "/admin/recordings", icon: HardDrive, group: "core" },
    { label: "Website Analytics", href: "/admin/analytics", icon: BarChart3, group: "core" },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText, group: "governance" },
    { label: "Email & Auth", href: "/admin/permissions", icon: Lock, group: "governance" },
    { label: "Settings & Health", href: "/admin/settings", icon: Settings, group: "governance" },
  ];

  const normalizedRole = String(adminUser?.role || "superadmin")
    .toLowerCase()
    .trim();
  const isSuperAdmin =
    normalizedRole === "superadmin" || normalizedRole === "super_admin";
  const roleLabel = isSuperAdmin ? "Super Admin" : "Administrator";

  const activeNav =
    navItems.find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/admin" && pathname.startsWith(item.href))
    ) || navItems[0];

  const displayName =
    adminUser?.fullName || adminUser?.name || (isSuperAdmin ? "Super Admin" : "Administrator");
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (isLoading) {
    return (
      <div className="redsun-theme min-h-screen bg-[#FFFCF8] flex flex-col items-center justify-center text-[#2B211C] relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-[#E85D04]/10 blur-[110px]"
        />
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-16 h-16 mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-[#E8D9CC]" />
            <div className="absolute inset-0 rounded-full border-2 border-[#E85D04] border-t-transparent animate-spin" />
            <div className="absolute inset-2.5 rounded-full bg-[#FFFFFF] border border-[#E85D04]/25 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E85D04] animate-pulse" />
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E85D04] font-mono mb-1">
            TopPlaced Admin Console
          </p>
          <p className="text-sm font-medium text-[#70645C]">
            Verifying administrator credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const coreNav = navItems.filter((item) => item.group === "core");
  const governanceNav = navItems.filter((item) => item.group === "governance");

  const renderNavLink = (item: (typeof navItems)[number]) => {
    const IconComponent = item.icon;
    const isActive =
      pathname === item.href ||
      (item.href !== "/admin" && pathname.startsWith(item.href));

    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch={false}
        title={sidebarCollapsed ? item.label : undefined}
        onClick={() => setSidebarOpen(false)}
        className={`relative min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          sidebarCollapsed ? "lg:justify-center lg:px-2" : ""
        } ${
          isActive
            ? "text-[#E85D04] font-semibold"
            : "text-[#70645C] hover:text-[#2B211C] hover:bg-[#FFFFFF]"
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="admin-active-pill"
            className="absolute inset-0 rounded-xl bg-[#E85D04]/12 border border-[#E85D04]/35 shadow-xs"
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 32,
            }}
          />
        )}
        <IconComponent
          size={18}
          className={`relative z-10 shrink-0 transition-colors ${
            isActive ? "text-[#E85D04]" : "text-[#70645C]"
          }`}
        />
        <span className={`relative z-10 ${sidebarCollapsed ? "lg:hidden truncate" : "truncate"}`}>
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <div className="redsun-theme min-h-screen bg-[#FFFCF8] text-[#2B211C] flex flex-col relative overflow-x-clip">
      {/* Subtle Ambient Solar Backlight with gentle organic drift */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        <motion.div
          animate={
            prefersReduced
              ? false
              : {
                  x: [0, 30, -20, 0],
                  y: [0, -35, 20, 0],
                  opacity: [0.07, 0.12, 0.06, 0.07],
                }
          }
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-44 right-[-6%] w-[560px] h-[560px] rounded-full bg-[#E85D04] blur-[140px]"
        />
        <motion.div
          animate={
            prefersReduced
              ? false
              : {
                  x: [0, -25, 20, 0],
                  y: [0, 30, -20, 0],
                  opacity: [0.05, 0.09, 0.04, 0.05],
                }
          }
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-20%] left-[-8%] w-[460px] h-[460px] rounded-full bg-[#E85D04] blur-[140px]"
        />
      </div>

      {/* Top Glass Header */}
      <header className="sticky top-0 z-40 bg-[#FFFCF8]/90 backdrop-blur-xl border-b border-[#E8D9CC] h-16 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-[#70645C] hover:text-[#2B211C] rounded-xl hover:bg-[#FFFFFF] border border-[#E8D9CC] cursor-pointer"
            aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/admin" className="flex items-center gap-3 shrink-0">
            <Logo size="sm" variant="redsun" />
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase border ${
                isSuperAdmin
                  ? "bg-[#E85D04]/12 text-[#E85D04] border-[#E85D04]/35"
                  : "bg-sky-500/12 text-sky-700 border-sky-500/30"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSuperAdmin ? "bg-[#E85D04]" : "bg-sky-500"
                }`}
              />
              {roleLabel}
            </span>
          </Link>

          {/* Breadcrumb Trail */}
          <nav
            aria-label="Breadcrumb"
            className="hidden md:flex items-center gap-2 text-xs text-[#70645C] pl-3 border-l border-[#E8D9CC] truncate"
          >
            <Link
              href="/admin"
              className="hover:text-[#2B211C] transition-colors whitespace-nowrap"
            >
              Console
            </Link>
            <span>/</span>
            <span className="text-[#2B211C] font-medium truncate">
              {activeNav.label}
            </span>
          </nav>
        </div>

        {/* Right Telemetry Pills & Profile Account Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#E8D9CC] text-xs text-[#70645C]">
            <Clock size={13} className="text-[#E85D04]" />
            <span>10-Day Auto-Retention</span>
          </div>

          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${
              dbHealthy
                ? "bg-emerald-500/[0.08] border-emerald-500/25 text-emerald-700"
                : "bg-amber-500/[0.08] border-amber-500/25 text-amber-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                dbHealthy ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="hidden md:inline font-medium">
              {dbHealthy ? "MongoDB Atlas Live" : "Connecting"}
            </span>
          </div>

          <Link
            href="/learner"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl text-xs font-medium text-[#70645C] hover:text-[#E85D04] hover:bg-[#FFFFFF] transition-colors"
          >
            <span>Candidate View</span>
            <ExternalLink size={12} />
          </Link>

          {/* Profile / Account Dropdown */}
          <div className="relative pl-2 border-l border-[#E8D9CC]" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((v) => !v)}
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
              className="min-h-[44px] flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FFFCF8] border border-[#E8D9CC] hover:border-[#E85D04]/35 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E85D04] to-[#E85D04] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {initials || "A"}
              </div>
              <div className="hidden sm:block text-left max-w-[140px]">
                <div className="text-xs font-semibold text-[#2B211C] truncate">
                  {displayName}
                </div>
                <div className="text-[10px] text-[#70645C] truncate">
                  {adminUser?.email || "admin@topplaced.ai"}
                </div>
              </div>
              <ChevronDown
                size={14}
                className={`text-[#70645C] transition-transform duration-200 ${
                  profileMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  role="menu"
                  initial={prefersReduced ? false : { opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.2, ease: REDSUN_OUT_EXPO }}
                  className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#FFFFFF] backdrop-blur-xl border border-[#E8D9CC] shadow-xl py-2 z-50 origin-top-right"
                >
                  <div className="px-4 py-2.5 border-b border-[#E8D9CC]">
                    <div className="text-xs font-bold text-[#2B211C] truncate">
                      {displayName}
                    </div>
                    <div className="text-[11px] text-[#70645C] truncate">
                      {adminUser?.email || "admin@topplaced.ai"}
                    </div>
                    <span
                      className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        isSuperAdmin
                          ? "bg-[#E85D04]/12 text-[#E85D04] border-[#E85D04]/35"
                          : "bg-sky-500/12 text-sky-700 border-sky-500/30"
                      }`}
                    >
                      {roleLabel}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/admin/settings"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="min-h-[44px] flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#70645C] hover:text-[#2B211C] hover:bg-[#FFFCF8]"
                    >
                      <Settings size={14} />
                      <span>System &amp; AI Settings</span>
                    </Link>
                    <Link
                      href="/admin/permissions"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="min-h-[44px] flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#70645C] hover:text-[#2B211C] hover:bg-[#FFFCF8]"
                    >
                      <Lock size={14} />
                      <span>Email &amp; Auth Controls</span>
                    </Link>
                    <Link
                      href="/learner"
                      target="_blank"
                      rel="noopener noreferrer"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                      className="min-h-[44px] flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#70645C] hover:text-[#2B211C] hover:bg-[#FFFCF8]"
                    >
                      <ExternalLink size={14} />
                      <span>Open Candidate View</span>
                    </Link>
                  </div>

                  <div className="border-t border-[#E8D9CC] pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full min-h-[44px] flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Sign Out of Console</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative z-10">
        {/* Mobile Drawer Backdrop */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-20 bg-[#2B211C]/50 backdrop-blur-sm lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Collapsible Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 bg-[#FFFCF8] backdrop-blur-xl border-r border-[#E8D9CC] transform transition-all duration-200 ease-out pt-16 lg:pt-0 lg:static shrink-0 ${
            sidebarCollapsed ? "lg:w-[78px]" : "lg:w-64"
          } w-64 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          <div className="h-full flex flex-col justify-between py-5 px-3">
            <div className="space-y-5 overflow-y-auto">
              {/* Collapse Toggle (Desktop) */}
              <div className="hidden lg:flex items-center justify-between px-2">
                {!sidebarCollapsed && (
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#70645C]">
                    Administration
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((c) => !c)}
                  aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#70645C] hover:text-[#2B211C] hover:bg-[#FFFFFF] border border-[#E8D9CC] ml-auto cursor-pointer"
                >
                  {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                </button>
              </div>

              <nav aria-label="Admin primary navigation" className="space-y-1">
                {coreNav.map(renderNavLink)}
              </nav>

              <div className="pt-2 border-t border-[#E8D9CC]">
                {!sidebarCollapsed && (
                  <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#70645C]">
                    Governance &amp; System
                  </div>
                )}
                <nav aria-label="Admin governance navigation" className="space-y-1">
                  {governanceNav.map(renderNavLink)}
                </nav>
              </div>
            </div>

            {/* Bottom Policy Card */}
            <div
              className={`mt-4 rounded-xl bg-[#FFFFFF] border border-[#E8D9CC] text-xs text-[#70645C] ${
                sidebarCollapsed ? "p-2.5 flex justify-center" : "p-3.5 space-y-2"
              }`}
              title="Security Retention: Media auto-expires in 10 days"
            >
              <div className="flex items-center gap-2 text-[#2B211C] font-semibold">
                <ShieldCheck size={16} className="text-[#E85D04] shrink-0" />
                {!sidebarCollapsed && <span>Security Retention</span>}
              </div>
              {!sidebarCollapsed && (
                <p className="text-[11px] leading-relaxed text-[#70645C]">
                  Media recordings auto-expire in{" "}
                  <span className="text-[#E85D04] font-semibold">10 days</span>{" "}
                  and are permanently purged.
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area with Page Transitions */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-none w-full mx-auto w-full space-y-6">
            {/* Universal Retention Alert Banner */}
            <div className="rounded-2xl bg-[#FFFFFF] border border-[#E8D9CC] p-4 flex items-start sm:items-center justify-between gap-4 flex-wrap shadow-sm">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFFCF8] flex items-center justify-center shrink-0 border border-[#E8D9CC]">
                  <Clock size={18} className="text-[#E85D04]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#2B211C] flex flex-wrap items-center gap-2">
                    <span>Strict 10-Day Media Retention Active</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#E85D04]/12 text-[#E85D04] border border-[#E85D04]/35">
                      Enforced
                    </span>
                  </div>
                  <div className="text-xs text-[#70645C] mt-0.5">
                    Recordings remain available for exactly 10 days from completion. Cleanup engine permanently purges expired media.
                  </div>
                </div>
              </div>
              <Link
                href="/admin/recordings"
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#E85D04] hover:text-white bg-[#E85D04]/12 hover:bg-[#E85D04] border border-[#E85D04]/30 transition-colors shrink-0"
              >
                <span>Manage Retention</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            <motion.div
              key={pathname}
              initial={prefersReduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: REDSUN_OUT_EXPO }}
              className="w-full space-y-6"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
