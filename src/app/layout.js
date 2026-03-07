import { Geist, Geist_Mono, Merriweather } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/lib/SettingsContext";
import { ReportsProvider } from "@/lib/ReportsContext";
import { AuthProvider } from "@/lib/AuthContext";
import SettingsButton from "@/components/SettingsButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  weight: ["400", "700"],
  variable: "--font-merriweather",
  subsets: ["latin"],
});

export const metadata = {
  title: "Personal Alert Button",
  description: "Press the button in case of emergency. Help for elderly and vulnerable users in Singapore.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${merriweather.variable} antialiased`}
      >
        <SettingsProvider>
          <AuthProvider>
            <ReportsProvider>
              <SettingsButton />
              {children}
            </ReportsProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
