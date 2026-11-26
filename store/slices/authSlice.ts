import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// --- Types ---
interface User {
  _id: string;
  name?: string;
  email: string;
  role: "user" | "mentor" | "admin";
  phone?: string;
  experience?: string;
  resume_url?: string;
  profile_image?: string;
  goals?: string;
  tech_stack?: string;
  profile_completion?: number;
  linkedin_profile?: string;
  education?: string;
  bio?: string;
  verified?: boolean;
}

interface AuthState {
  token: string;
  user: User | null;
  isHydrated: boolean;
}

// --- Initial State ---
const initialState: AuthState = {
  token: "",
  user: null,
  isHydrated: false,
};

// --- Helper ---
const deriveNameFromEmail = (email: string): string => {
  const username = email.split("@")[0];
  return username
    .replace(/[._]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// --- Slice ---
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(
      state,
      action: PayloadAction<{ access_token: string; user: User }>
    ) {
      const { access_token, user } = action.payload;

      const userData = {
        ...user,
        name: (user as any).name || (user as any).fullName || deriveNameFromEmail(user.email),
      };

      state.token = access_token;
      state.user = userData;
      state.isHydrated = true;

      if (typeof window !== "undefined") {
        localStorage.setItem("token", access_token);
        const isSecure = window.location.protocol === "https:";
        document.cookie = `token=${access_token}; Max-Age=86400; Path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
        // Persist user so optimistic hydration works on next load
        try { localStorage.setItem("user", JSON.stringify(userData)); } catch {}
      }

      console.log("✅ Login success:", userData);
    },

    logout(state) {
      state.token = "";
      state.user = null;
      state.isHydrated = true;

      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        try { localStorage.removeItem("user"); } catch {}
        try {
          document.cookie = "token=; Max-Age=0; Path=/; SameSite=Lax";
        } catch {}
      }
      console.log("🚪 Logged out");
    },

    setHydrated(state) {
      state.isHydrated = true;
    },

    restoreAuth(
      state,
      action: PayloadAction<{ token: string; user: User } | null>
    ) {
      if (action.payload?.token && action.payload?.user) {
        const userData = {
          ...action.payload.user,
          name:
            (action.payload.user as any).name ||
            (action.payload.user as any).fullName ||
            deriveNameFromEmail(action.payload.user.email),
        };

        state.token = action.payload.token;
        state.user = userData;
      }
      state.isHydrated = true;
    },

    updateUserName(state, action: PayloadAction<string>) {
      if (state.user) {
        state.user.name = action.payload || state.user.name;
      }
    },

    updateProfileImage(state, action: PayloadAction<string>) {
      if (state.user) {
        state.user.profile_image = action.payload;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("user", JSON.stringify(state.user));
          } catch {}
        }
      }
    },
  },
});

export const { loginSuccess, logout, setHydrated, restoreAuth, updateUserName, updateProfileImage } =
  authSlice.actions;
export const authReducer = authSlice.reducer;
