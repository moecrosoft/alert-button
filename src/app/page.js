"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useSettings } from "@/lib/SettingsContext";
import { AlertTriangle, Mic, Video, Check, ShieldCheck, FileText } from "lucide-react";
import { Suspense } from 'react';

// Step 3 message by urgency: urgent | not-urgent | uncertain | 
function getStep3Message(urgency, mounted, t) {
  if (urgency === "urgent") return "Dispatching ambulance to location";
  if (urgency === "not-urgent") return "Someone will attend to you shortly";
  if (urgency === "uncertain") return "Let me get back to you";
  return mounted ? t("step3Desc") : "An operator will call you back immediately.";
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, theme, mounted } = useSettings();
  const urgency = searchParams.get("urgency"); 
  const step3Message = getStep3Message(urgency, mounted, t);
  
  const [micPermission, setMicPermission] = useState("prompt"); 
  const [cameraPermission, setCameraPermission] = useState("prompt");

  // Check existing permissions on mount (microphone only)
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions.query({ name: "microphone" }).then((result) => {
        setMicPermission(result.state);
        result.onchange = () => setMicPermission(result.state);
      }).catch(() => {});
    }
  }, []);

  const requestMicPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission("granted");
    } catch {
      setMicPermission("denied");
    }
  }, []);

  const [showCameraTooltip, setShowCameraTooltip] = useState(false);
  
  // Microphone is required, camera is optional
  const allPermissionsGranted = micPermission === "granted";

  // Theme-based colors
  const colors = {
    bg: theme === "light" ? "#F8F5F2" : "#1A1A1A",
    text: theme === "light" ? "#1A1A1A" : "#FFFFFF",
    textMuted: theme === "light" ? "#666666" : "#CCCCCC",
    textDim: theme === "light" ? "#999999" : "#888888",
    cardBg: theme === "light" ? "#FFFFFF" : "#111111",
    cardBorder: theme === "light" ? "#E5E5E5" : "#3A3A3A",
  };

  return (
    <Suspense>
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <main className="mx-auto flex max-w-md flex-col px-6 pt-12 pb-8">
        {/* Reports Button - Top Left */}
        <button
          type="button"
          onClick={() => router.push("/reports")}
          className="fixed top-4 left-4 z-40 flex items-center gap-2 rounded-full px-4 py-2 
            backdrop-blur-md transition-all duration-200 shadow-lg hover:scale-105"
          style={{
            backgroundColor: theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: theme === "light" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.2)",
            color: theme === "light" ? "#1A1A1A" : "#FFFFFF",
          }}
        >
          <FileText className="h-5 w-5" strokeWidth={2} />
          <span className="font-['Barlow'] text-sm font-medium hidden sm:inline">
            {mounted ? t("reports") : "Reports"}
          </span>
        </button>

        {/* Header */}
        <header className="mb-10 text-center">
          <div className="flex justify-center">
            <h1
              className="font-['Barlow_Condensed'] mb-3 text-4xl font-bold tracking-tight sm:text-5xl whitespace-nowrap text-center"
              style={{ color: colors.text }}
            >
              {mounted ? t("Personal Alert Button (PAB)") : "Personal Alert Button"}
            </h1>
          </div>
          <p
            className="font-['Barlow'] text-lg"
            style={{ color: colors.textMuted }}
          >
            {mounted ? t("subtitle") : "Press the button in case of emergency."}
          </p>
        </header>

        {/* Emergency Button - Enhanced Design */}
        <section className="mb-12 flex flex-col items-center">
          {/* Outer glow rings */}
          <div className="relative">
            {/* Animated pulse rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="absolute h-[260px] w-[260px] rounded-full animate-ping opacity-20"
                style={{
                  backgroundColor: "#C0392B",
                  animationDuration: "2s",
                }}
              />
              <div
                className="absolute h-[240px] w-[240px] rounded-full animate-pulse opacity-30"
                style={{
                  backgroundColor: "#C0392B",
                  animationDuration: "1.5s",
                }}
              />
            </div>

            {/* Main button */}
            <button
              type="button"
              onClick={() => router.push("/elders/recording")}
              className="relative flex h-[220px] w-[220px] flex-col items-center justify-center rounded-full 
                transition-all duration-200 ease-out
                hover:scale-105 hover:shadow-[0_0_80px_30px_rgba(192,57,43,0.5)]
                active:scale-[0.98] active:shadow-[0_0_40px_15px_rgba(192,57,43,0.4)]
                focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F5C400] focus-visible:ring-offset-4"
              style={{
                background: "linear-gradient(145deg, #E74C3C, #C0392B, #922B21)",
                boxShadow: `
                  0 0 0 4px rgba(255,255,255,0.9),
                  0 0 0 8px rgba(192,57,43,0.3),
                  0 0 60px 20px rgba(192,57,43,0.4),
                  0 20px 40px rgba(0,0,0,0.3),
                  inset 0 -8px 20px rgba(0,0,0,0.2),
                  inset 0 8px 20px rgba(255,255,255,0.1)
                `,
                focusVisibleRingOffsetColor: colors.bg,
              }}
              aria-label="Emergency - press for help"
            >
              {/* Inner highlight */}
              <div
                className="absolute top-4 left-1/2 -translate-x-1/2 h-[60px] w-[120px] rounded-full opacity-30"
                style={{
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)",
                }}
              />

              {/* Icon container */}
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white/90 bg-white/10 backdrop-blur-sm">
                <AlertTriangle className="h-9 w-9 text-white" strokeWidth={2.5} />
              </div>

              {/* Text */}
              <span className="font-['Barlow_Condensed'] text-xl font-bold tracking-wider text-white drop-shadow-lg">
                {mounted ? t("emergency") : "EMERGENCY"}
              </span>
            </button>
          </div>
        </section>

        {/* Permissions Section */}
        <section
          className="mb-6 rounded-2xl p-5 shadow-lg transition-colors duration-300"
          style={{
            backgroundColor: colors.cardBg,
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: allPermissionsGranted ? "#22C55E" : colors.cardBorder,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                backgroundColor: allPermissionsGranted ? "#22C55E" : "#F5C400",
              }}
            >
              {allPermissionsGranted ? (
                <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.5} />
              ) : (
                <ShieldCheck className="h-5 w-5 text-black" strokeWidth={2.5} />
              )}
            </div>
            <div>
              <h2
                className="font-['Barlow_Condensed'] text-lg font-semibold"
                style={{ color: colors.text }}
              >
                {mounted ? t("enablePermissions") : "Enable Permissions"}
              </h2>
              <p
                className="font-['Barlow'] text-sm"
                style={{ color: colors.textMuted }}
              >
                {allPermissionsGranted
                  ? (mounted ? t("permissionsReady") : "All set! You're ready for emergencies.")
                  : (mounted ? t("permissionsDesc") : "Allow microphone and camera access so we can help you faster in emergencies.")}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Microphone Permission Button - Required */}
            <div className="flex-1 flex flex-col gap-1">
              <button
                type="button"
                onClick={requestMicPermission}
                disabled={micPermission === "granted"}
                className={`permission-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-['Barlow'] text-sm font-medium transition-all duration-200 disabled:cursor-default ${
                  micPermission !== "granted" 
                    ? "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] cursor-pointer" 
                    : ""
                }`}
                style={{
                  backgroundColor: micPermission === "granted" 
                    ? (theme === "light" ? "#DCFCE7" : "#14532D")
                    : (theme === "light" ? "#F5F5F5" : "#2A2A2A"),
                  color: micPermission === "granted"
                    ? "#22C55E"
                    : colors.text,
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: micPermission === "granted" ? "#22C55E" : colors.cardBorder,
                }}
              >
                {micPermission === "granted" ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                <span>
                  {micPermission === "granted"
                    ? (mounted ? t("microphoneEnabled") : "Microphone Ready")
                    : (mounted ? t("enableMicrophone") : "Enable Microphone")}
                </span>
              </button>
              <span
                className="text-xs font-['Barlow'] font-medium text-center"
                style={{ color: "#C0392B" }}
              >
                {mounted ? t("microphoneRequired") : "Required"}
              </span>
            </div>
            
            {/* Camera Permission Button - Optional with Tooltip */}
            <div className="flex-1 flex flex-col gap-1 relative">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    stream.getTracks().forEach(track => track.stop());
                    setCameraPermission("granted");
                  } catch (err) {
                    console.error("Camera permission error:", err);
                    setCameraPermission("denied");
                  }
                }}
                onMouseEnter={() => setShowCameraTooltip(true)}
                onMouseLeave={() => setShowCameraTooltip(false)}
                className={`permission-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-['Barlow'] text-sm font-medium transition-all duration-200 ${
                  cameraPermission !== "granted" 
                    ? "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] cursor-pointer" 
                    : "cursor-default"
                }`}
                style={{
                  backgroundColor: cameraPermission === "granted"
                    ? (theme === "light" ? "#DCFCE7" : "#14532D")
                    : (theme === "light" ? "#F5F5F5" : "#2A2A2A"),
                  color: cameraPermission === "granted"
                    ? "#22C55E"
                    : colors.text,
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: cameraPermission === "granted" ? "#22C55E" : colors.cardBorder,
                }}
              >
                {cameraPermission === "granted" ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                <span>
                  {cameraPermission === "granted"
                    ? (mounted ? t("cameraEnabled") : "Camera Ready")
                    : (mounted ? t("enableCamera") : "Enable Camera")}
                </span>
              </button>
              <span
                className="text-xs font-['Barlow'] font-medium text-center"
                style={{ color: colors.textDim }}
              >
                {mounted ? t("cameraOptional") : "Optional"}
              </span>
              
              {/* Tooltip */}
              {showCameraTooltip && cameraPermission !== "granted" && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl shadow-xl z-50 animate-in pointer-events-none"
                  style={{
                    backgroundColor: theme === "light" ? "#1A1A1A" : "#FFFFFF",
                    color: theme === "light" ? "#FFFFFF" : "#1A1A1A",
                  }}
                >
                  <p className="font-['Barlow'] text-xs leading-relaxed text-center">
                    {mounted ? t("cameraTooltip") : "Enabling camera allows for more accurate emergency classification by analyzing your surroundings."}
                  </p>
                  {/* Tooltip Arrow */}
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                    style={{
                      borderLeft: "8px solid transparent",
                      borderRight: "8px solid transparent",
                      borderTop: `8px solid ${theme === "light" ? "#1A1A1A" : "#FFFFFF"}`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* How it works Card */}
        <section
          className="rounded-2xl p-6 shadow-lg transition-colors duration-300"
          style={{
            backgroundColor: colors.cardBg,
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: colors.cardBorder,
          }}
        >
          <h2
            className="font-['Barlow_Condensed'] mb-5 text-xl font-semibold"
            style={{ color: colors.text }}
          >
            {mounted ? t("howItWorks") : "How it works"}
          </h2>
          <ol className="space-y-5">
            <li className="flex gap-4">
              <span className="flex h-9 min-w-[36px] flex-shrink-0 items-center justify-center rounded-full bg-[#F5C400] text-sm font-bold text-black">
                1
              </span>
              <div>
                <span
                  className="font-['Barlow'] font-semibold"
                  style={{ color: colors.text }}
                >
                  {mounted ? t("step1Title") : "Press the emergency button"}
                </span>
                <p
                  className="font-['Barlow'] mt-0.5 text-sm leading-relaxed"
                  style={{ color: colors.textMuted }}
                >
                  {mounted ? t("step1Desc") : "When you need help, press the red button above."}
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-9 min-w-[36px] flex-shrink-0 items-center justify-center rounded-full bg-[#F5C400] text-sm font-bold text-black">
                2
              </span>
              <div>
                <span
                  className="font-['Barlow'] font-semibold"
                  style={{ color: colors.text }}
                >
                  {mounted ? t("step2Title") : "Speak clearly"}
                </span>
                <p
                  className="font-['Barlow'] mt-0.5 text-sm leading-relaxed"
                  style={{ color: colors.textMuted }}
                >
                  {mounted ? t("step2Desc") : "Tell us what's wrong in your preferred language."}
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-9 min-w-[36px] flex-shrink-0 items-center justify-center rounded-full bg-[#F5C400] text-sm font-bold text-black">
                3
              </span>
              <div>
                <span
                  className="font-['Barlow'] font-semibold"
                  style={{ color: colors.text }}
                >
                  {mounted ? t("step3Title") : "Help is on the way"}
                </span>
                <p
                  className="font-['Barlow'] mt-0.5 text-sm leading-relaxed"
                  style={{ color: colors.textMuted }}
                >
                  {step3Message}
                </p>
              </div>
            </li>
          </ol>
        </section>
      </main>
    </div>
    </Suspense>
  );
}