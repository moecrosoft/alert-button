"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/lib/SettingsContext";
import { useAuth } from "@/lib/AuthContext";
import { Lock, Mail, Eye, EyeOff, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { theme, mounted } = useSettings();
  const { signIn, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const colors = {
    bg: theme === "light" ? "#F8F5F2" : "#0D0D0D",
    text: theme === "light" ? "#1A1A1A" : "#FFFFFF",
    textMuted: theme === "light" ? "#666666" : "#CCCCCC",
    cardBg: theme === "light" ? "#FFFFFF" : "#1A1A1A",
    cardBorder: theme === "light" ? "#E5E5E5" : "#2A2A2A",
    inputBg: theme === "light" ? "#F5F5F5" : "#141414",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      router.push("/reports");
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: colors.bg }}
    >
      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        className="fixed top-4 left-4 flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"
        style={{ color: colors.textMuted }}
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="font-['Barlow'] text-sm font-medium hidden sm:inline">Back</span>
      </button>

      <div
        className="w-full max-w-md rounded-3xl p-8 shadow-2xl"
        style={{
          backgroundColor: colors.cardBg,
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: colors.cardBorder,
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
            style={{ backgroundColor: "rgba(245, 196, 0, 0.15)" }}
          >
            <ShieldCheck className="h-8 w-8 text-[#F5C400]" strokeWidth={2} />
          </div>
          <h1
            className="font-['Barlow_Condensed'] text-3xl font-bold text-center"
            style={{ color: colors.text }}
          >
            Admin Login
          </h1>
          <p
            className="font-['Barlow'] text-sm mt-2 text-center"
            style={{ color: colors.textMuted }}
          >
            Sign in to access the reports dashboard
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="mb-6 p-4 rounded-xl text-sm font-['Barlow']"
            style={{
              backgroundColor: "rgba(192, 57, 43, 0.1)",
              color: "#E74C3C",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "rgba(192, 57, 43, 0.2)",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              className="block font-['Barlow'] text-sm font-medium mb-2"
              style={{ color: colors.textMuted }}
            >
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
                style={{ color: colors.textMuted }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full rounded-xl py-4 pl-12 pr-4 font-['Barlow'] text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-[#F5C400]"
                style={{
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: colors.cardBorder,
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              className="block font-['Barlow'] text-sm font-medium mb-2"
              style={{ color: colors.textMuted }}
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
                style={{ color: colors.textMuted }}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl py-4 pl-12 pr-12 font-['Barlow'] text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-[#F5C400]"
                style={{
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: colors.cardBorder,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: colors.textMuted }}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || authLoading}
            className="w-full rounded-xl py-4 font-['Barlow'] text-lg font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: "#F5C400",
              color: "#000000",
            }}
          >
            {loading || authLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
