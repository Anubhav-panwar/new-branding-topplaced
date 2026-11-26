"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { loginSuccess } from "@/store/slices/authSlice";
import { toast } from "sonner";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = searchParams.get("token");
    const userParam = searchParams.get("user");
    const userIdParam = searchParams.get("userId");

    if (!token) {
      toast.error("Authentication failed. Please try again.");
      router.replace("/login");
      return;
    }

    localStorage.setItem("token", token);
    const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
    document.cookie = `token=${token}; Max-Age=86400; Path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;

    const finalizeLogin = async () => {
      try {
        let user: any = null;

        if (userParam) {
          user = JSON.parse(decodeURIComponent(userParam));
        } else {
          const res = await fetch(`${API_URL}/api/auth/profile`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          if (!res.ok) throw new Error("Failed to fetch profile");
          user = await res.json();
        }

        dispatch(loginSuccess({ access_token: token, user }));
        toast.success("LinkedIn login successful!");

        const role = (user?.role || "").toLowerCase().trim();
        const isAdmin = role === "admin" || role === "superadmin" || role === "super_admin" || user?.isAdmin;

        if (isAdmin) {
          localStorage.setItem("adminToken", token);
          router.replace("/admin");
        } else if (role === "mentor") {
          router.replace("/mentor");
        } else {
          router.replace("/learner");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        toast.error("Authentication failed. Please try again.");
        router.replace("/login");
      }
    };

    finalizeLogin();
  }, [searchParams, dispatch, router]);

  return (
    <div className="min-h-screen bg-[#FFFCF8] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-[#E85D04] to-[#E85D04] rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-white font-bold text-xl">TP</span>
        </div>
        <h1 className="text-xl font-semibold text-[#2B211C] mb-2">
          Completing LinkedIn Authentication...
        </h1>
        <p className="text-[#70645C]">Please wait while we sign you in.</p>

        <div className="mt-6">
          <div className="inline-flex items-center space-x-1">
            <div className="w-2 h-2 bg-[#E85D04] rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-[#E85D04] rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-[#E85D04] rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
