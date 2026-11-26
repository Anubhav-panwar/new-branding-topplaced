"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  Home,
  Play,
  History,
  User,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const items: NavItem[] = [
  { href: "/learner", label: "Dashboard", icon: Home },
  { href: "/learner/interview/setup", label: "Interview", icon: Play },
  { href: "/learner/plans", label: "My Plan", icon: CreditCard },
  { href: "/learner/history", label: "History", icon: History },
  { href: "/learner/profile", label: "Profile", icon: User },
];

export default function BottomNav({ theme = "light" }: { theme?: "light" | "redsun" } = {}) {
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-[#FFFCF8]/96 backdrop-blur-xl border-t border-[#E8D9CC] safe-area-bottom shadow-lg"
    >
      <ul className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/learner" && pathname.startsWith(href));
          return (
            <li key={href} className="flex-1 max-w-[76px]">
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`group flex flex-col items-center justify-center min-h-[48px] py-1.5 px-2 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E85D04] ${
                  active
                    ? "text-[#E85D04] bg-[#F9E6D4]/60 border border-[#E8D9CC] shadow-2xs font-bold"
                    : "text-[#70645C] hover:text-[#2B211C] border border-transparent font-medium"
                }`}
              >
                {href === "/learner/profile" && user?.profile_image ? (
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-[#E8D9CC] shrink-0">
                    <img
                      src={
                        user.profile_image.startsWith("http") || user.profile_image.startsWith("data:")
                          ? user.profile_image
                          : `${API_URL}${user.profile_image.startsWith("/") ? "" : "/"}${user.profile_image}`
                      }
                      alt={user.name || "Profile"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <Icon
                    size={19}
                    className={`transition-transform duration-200 group-active:scale-90 motion-reduce:transition-none ${
                      active ? "stroke-[2.25] text-[#E85D04]" : "stroke-[1.75]"
                    }`}
                  />
                )}
                <span
                  className={`mt-1 text-[10px] leading-tight tracking-tight ${
                    active ? "font-bold text-[#E85D04]" : "font-medium text-[#70645C] group-hover:text-[#2B211C]"
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
