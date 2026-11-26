"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Home,
  Play,
  BarChart3,
  User,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Calendar,
  Clock,
  MessageSquare,
  BookOpen,
  Settings,
  ShieldCheck,
  Award,
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

interface SidebarProps {
  userType: "learner" | "mentor";
  theme?: "light" | "redsun";
}

export default function Sidebar({ userType, theme = "light" }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();
  const { user } = useSelector((state: RootState) => state.auth);
  const isIncomplete =
    user?.profile_completion !== undefined && user.profile_completion < 90;

  type MenuItem = {
    icon: typeof Home;
    label: string;
    href: string;
    locked?: boolean;
  };

  const learnerMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", href: "/learner", locked: false },
    {
      icon: Play,
      label: "AI Interview",
      href: "/learner/interview/setup",
      locked: false,
    },
    {
      icon: CreditCard,
      label: "My Plans",
      href: "/learner/plans",
      locked: false,
    },
    {
      icon: BarChart3,
      label: "Interview History",
      href: "/learner/history",
      locked: false,
    },
    { icon: Award, label: "Achievements", href: "/learner/achievements", locked: false },
    { icon: User, label: "Profile & Settings", href: "/learner/profile", locked: false },
  ];

  const mentorMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", href: "/mentor" },
    { icon: Calendar, label: "Sessions", href: "/mentor/sessions" },
    { icon: DollarSign, label: "Earnings", href: "/mentor/earnings" },
    { icon: User, label: "Profile", href: "/mentor/profile" },
    { icon: BarChart3, label: "Analytics", href: "/mentor/analytics" },
    { icon: Clock, label: "Availability", href: "/mentor/availability" },
    { icon: MessageSquare, label: "Reviews", href: "/mentor/reviews" },
    { icon: BookOpen, label: "Resources", href: "/mentor/resources" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const menuItems = userType === "learner" ? learnerMenuItems : mentorMenuItems;

  return (
    <aside
      className={`hidden md:flex flex-col justify-between fixed left-0 top-16 h-[calc(100vh-64px)] transition-all duration-300 z-40 bg-[#FFFCF8] border-r border-[#E8D9CC] ${
        isCollapsed ? "w-18" : "w-64"
      }`}
    >
      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow-xs cursor-pointer z-50 bg-white border border-[#E8D9CC] text-[#70645C] hover:text-[#2B211C] hover:border-[#E85D04]"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1.5 mt-2 scrollbar-none">
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/learner" &&
              item.href !== "/mentor" &&
              pathname.startsWith(item.href));
          const isDisabled = isIncomplete && item.locked;

          return (
            <Link
              key={index}
              href={isDisabled ? "#" : item.href}
              className={`relative flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                isActive
                  ? "text-[#E85D04] font-bold"
                  : "text-[#70645C] hover:text-[#2B211C] hover:bg-[#F9E6D4]/30"
              } ${
                isDisabled
                  ? "opacity-40 cursor-not-allowed pointer-events-none"
                  : ""
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId={prefersReduced ? undefined : "learner-sidebar-pill"}
                  className="absolute inset-0 rounded-xl bg-[#F9E6D4]/60 border border-[#E8D9CC] shadow-2xs"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 32,
                  }}
                />
              )}
              <IconComponent
                size={18}
                className={`relative z-10 flex-shrink-0 transition-transform duration-200 ${
                  isActive
                    ? "text-[#E85D04] scale-105"
                    : "text-[#70645C] group-hover:text-[#E85D04] group-hover:scale-110"
                }`}
              />
              {!isCollapsed && (
                <span className="relative z-10 ml-3 tracking-wide transition-transform duration-200 group-hover:translate-x-0.5">
                  {item.label}
                </span>
              )}
              {isCollapsed && (
                <div className="absolute left-18 px-2.5 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-all duration-150 group-hover:translate-x-1 pointer-events-none whitespace-nowrap shadow-lg z-50 bg-white border border-[#E8D9CC] text-[#2B211C]">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Info Card at Bottom */}
      {!isCollapsed ? (
        <div className="shrink-0 p-3 pb-4">
          <div className="p-3 rounded-2xl border border-[#E8D9CC] bg-white shadow-2xs">
            <div className="flex items-center">
              <div className="w-8 h-8 text-white font-bold rounded-full flex items-center justify-center mr-3 text-xs shadow-xs bg-gradient-to-tr from-[#E85D04] to-[#B94308] overflow-hidden shrink-0">
                {user?.profile_image ? (
                  <img
                    src={
                      user.profile_image.startsWith("http") || user.profile_image.startsWith("data:")
                        ? user.profile_image
                        : `${API_URL}${user.profile_image.startsWith("/") ? "" : "/"}${user.profile_image}`
                    }
                    alt={user.name || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : user?.name ? (
                  user.name[0].toUpperCase()
                ) : (
                  <User size={14} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate text-[#2B211C]">
                  {user?.name || (userType === "learner" ? "Learner" : "Mentor")}
                </div>
                <div className="text-xs font-mono capitalize text-[#B94308]">
                  {userType} Active
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="shrink-0 p-2 pb-4 flex justify-center">
          <div className="w-8 h-8 text-white font-bold rounded-full flex items-center justify-center text-xs shadow-xs bg-gradient-to-tr from-[#E85D04] to-[#B94308] overflow-hidden shrink-0">
            {user?.profile_image ? (
              <img
                src={
                  user.profile_image.startsWith("http") || user.profile_image.startsWith("data:")
                    ? user.profile_image
                    : `${API_URL}${user.profile_image.startsWith("/") ? "" : "/"}${user.profile_image}`
                }
                alt={user.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : user?.name ? (
              user.name[0].toUpperCase()
            ) : (
              <User size={14} />
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
