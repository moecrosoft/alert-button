"use client";

import { useState } from "react";
import { Settings, X, Check } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";
import { languageNames } from "@/lib/translations";

export default function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, theme, setTheme, t, mounted } = useSettings();

  if (!mounted) return null;

  return (
    <>
      {/* Settings Button - Fixed position top-right */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-40 flex items-center gap-2 rounded-full px-4 py-2 
          backdrop-blur-md transition-all duration-200 shadow-lg hover:scale-105"
        aria-label={t("settings")}
        style={{
          backgroundColor: theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: theme === "light" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.2)",
          color: theme === "light" ? "#1A1A1A" : "#FFFFFF",
        }}
      >
        <Settings className="h-5 w-5" strokeWidth={2} />
        <span className="font-['Barlow'] text-sm font-medium hidden sm:inline">
          {t("settings")}
        </span>
      </button>

      {/* Settings Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div
            className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl border animate-in fade-in zoom-in-95 duration-200"
            style={{
              backgroundColor: theme === "light" ? "#FFFFFF" : "#1A1A1A",
              borderColor: theme === "light" ? "#E5E5E5" : "#3A3A3A",
              color: theme === "light" ? "#1A1A1A" : "#FFFFFF",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2
                id="settings-title"
                className="font-['Barlow_Condensed'] text-2xl font-bold"
              >
                {t("settings")}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 transition-colors"
                style={{
                  backgroundColor: theme === "light" ? "#F5F5F5" : "#2A2A2A",
                }}
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Language Selection */}
            <div className="mb-6">
              <label className="font-['Barlow'] text-sm font-semibold mb-3 block opacity-70">
                {t("language")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(languageNames).map(([code, name]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLanguage(code)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl font-['Barlow'] text-left transition-all duration-200"
                    style={{
                      backgroundColor:
                        language === code
                          ? "#F5C400"
                          : theme === "light"
                            ? "#F5F5F5"
                            : "#2A2A2A",
                      color:
                        language === code
                          ? "#000000"
                          : theme === "light"
                            ? "#1A1A1A"
                            : "#FFFFFF",
                      borderWidth: "2px",
                      borderStyle: "solid",
                      borderColor:
                        language === code
                          ? "#F5C400"
                          : "transparent",
                    }}
                  >
                    <span className="font-medium">{name}</span>
                    {language === code && (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selection */}
            <div>
              <label className="font-['Barlow'] text-sm font-semibold mb-3 block opacity-70">
                {t("theme")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-['Barlow'] transition-all duration-200"
                  style={{
                    backgroundColor:
                      theme === "light"
                        ? "#F5C400"
                        : "#2A2A2A",
                    color:
                      theme === "light"
                        ? "#000000"
                        : "#FFFFFF",
                    borderWidth: "2px",
                    borderStyle: "solid",
                    borderColor:
                      theme === "light" ? "#F5C400" : "transparent",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400" />
                    <span className="font-medium">{t("lightTheme")}</span>
                  </div>
                  {theme === "light" && (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-['Barlow'] transition-all duration-200"
                  style={{
                    backgroundColor:
                      theme === "dark"
                        ? "#F5C400"
                        : theme === "light"
                          ? "#F5F5F5"
                          : "#2A2A2A",
                    color:
                      theme === "dark"
                        ? "#000000"
                        : theme === "light"
                          ? "#1A1A1A"
                          : "#FFFFFF",
                    borderWidth: "2px",
                    borderStyle: "solid",
                    borderColor:
                      theme === "dark" ? "#F5C400" : "transparent",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-900 to-slate-900" />
                    <span className="font-medium">{t("darkTheme")}</span>
                  </div>
                  {theme === "dark" && (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
