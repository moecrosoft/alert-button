"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "./translations";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem("pab-language");
    const savedTheme = localStorage.getItem("pab-theme");
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang);
    }
    if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
      setTheme(savedTheme);
    }
  }, []);

  // Save settings to localStorage when changed
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("pab-language", language);
    }
  }, [language, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("pab-theme", theme);
    }
  }, [theme, mounted]);

  // Apply theme to document
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme, mounted]);

  const t = (key, replacements = {}) => {
    let text = translations[language]?.[key] || translations.en[key] || key;
    Object.entries(replacements).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
    return text;
  };

  return (
    <SettingsContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        t,
        mounted,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
