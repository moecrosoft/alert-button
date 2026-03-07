"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, VideoOff, Video, Check, Loader2 } from "lucide-react";

const BAR_COUNT = 28;

function useElapsedTimer(running) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [running]);
  return elapsed;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function RecordingPage() {
  const videoRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [waveTick, setWaveTick] = useState(0);
  const streamRef = useRef(null);
  const videoStreamRef = useRef(null);

  const elapsed = useElapsedTimer(mounted);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mic on mount (client-only)
  useEffect(() => {
    if (!mounted) return;
    let stream = null;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((s) => {
        stream = s;
        streamRef.current = s;
      })
      .catch(() => {});
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [mounted]);

  // Waveform animation (client-only, avoids hydration mismatch)
  useEffect(() => {
    if (!mounted) return;
    let raf = 0;
    const tick = () => {
      setWaveTick((t) => t + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mounted]);

  const toggleCamera = useCallback(() => {
    if (cameraOn && videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraOn(true);
      })
      .catch(() => {});
  }, [cameraOn]);

  const handleSend = useCallback(() => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (videoStreamRef.current) videoStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const barHeights = Array.from({ length: BAR_COUNT }, (_, i) => {
    const t = waveTick * 0.05 + i * 0.4;
    return 20 + Math.sin(t) * 35;
  });

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#FFFFFF]">
      {/* 1. Status bar */}
      <header className="flex w-full items-center justify-between border-b border-[#9D4F15] bg-[#111111] px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 flex-shrink-0 rounded-full bg-[#F5C400] animate-pulse"
            aria-hidden
          />
          <span className="font-['Barlow_Condensed'] text-lg font-semibold tracking-wide text-[#FFFFFF]">
            RECORDING
          </span>
        </div>
        <span className="font-['Barlow_Condensed'] text-xl tabular-nums text-[#FFFFFF]">
          {formatTime(elapsed)}
        </span>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-8 pt-4">
        {/* 2. Camera section — video always in DOM so ref is set when we attach stream */}
        <section
          className="relative aspect-video w-full overflow-hidden rounded-lg bg-black"
          aria-label="Camera"
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            aria-hidden={!cameraOn}
          />
          {!cameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black text-[#555555]">
              <VideoOff className="h-14 w-14 flex-shrink-0" strokeWidth={2} aria-hidden />
              <span className="text-lg font-['Barlow']">Camera Off</span>
            </div>
          )}
        </section>

        {/* 3. Mic + waveform */}
        <section
          className="mt-4 overflow-hidden rounded-lg bg-gradient-to-b from-[#2A2A6A] to-[#1A1A2A] px-6 py-6"
          aria-label="Microphone and waveform"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <Mic className="h-12 w-12 text-white" strokeWidth={2.5} aria-hidden />
              <span className="text-sm font-['Barlow'] text-[#CCCCCC]">Microphone</span>
            </div>
            <div className="flex h-14 items-end justify-center gap-0.5">
              {barHeights.map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-sm bg-gradient-to-t from-[#F5C400] to-white"
                  style={{ height: `${Math.max(4, h)}px` }}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        </section>

        {/* 4. Text content */}
        <section className="mt-6">
          <h1 className="font-['Barlow_Condensed'] text-[32px] font-semibold leading-tight text-[#FFFFFF]">
            Please describe your situation
          </h1>
          <p className="mt-2 font-['Barlow'] text-lg leading-relaxed text-[#CCCCCC]">
            Speak clearly in your preferred language. You can also turn on your camera to show your
            surroundings.
          </p>
        </section>

        {/* 5. Two buttons */}
        <section className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={toggleCamera}
            className={`flex min-h-[64px] min-w-[56px] flex-1 items-center justify-center gap-3 rounded-lg border bg-[#2A2A2A] font-['Barlow'] text-lg text-white transition-colors ${
              cameraOn ? "border-[#F5C400] text-[#F5C400]" : "border-[#444444]"
            }`}
            aria-label={cameraOn ? "Turn off camera" : "Turn on camera"}
          >
            <Video className="h-7 w-7 flex-shrink-0" strokeWidth={2} aria-hidden />
            <span>{cameraOn ? "Turn Off Camera" : "Turn On Camera"}</span>
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="flex min-h-[64px] min-w-[56px] flex-1 items-center justify-center gap-3 rounded-lg bg-[#F5C400] font-['Barlow'] text-lg font-bold text-black transition-opacity disabled:opacity-90"
            aria-label="Complete and send alert"
          >
            {sending ? (
              <>
                <Loader2 className="h-7 w-7 flex-shrink-0 animate-spin" aria-hidden />
                <span>Sending...</span>
              </>
            ) : (
              <span>Complete & Send Alert</span>
            )}
          </button>
        </section>

        {/* 6. Language chips */}
        <section className="mt-6" aria-label="Supported languages">
          <p className="mb-2 font-['Barlow'] text-base text-[#888888]">We support:</p>
          <div className="flex flex-wrap gap-2">
            {["English", "Mandarin"].map((lang) => (
              <span
                key={lang}
                className="rounded-full border border-[#3A3A3A] bg-[#2A2A2A] px-3 py-1.5 font-['Barlow'] text-[#CCCCCC]"
              >
                {lang}
              </span>
            ))}
          </div>
        </section>

        {/* 7. Safety note */}
        <section className="mt-6 rounded-r-lg border-l-4 border-[#9D4F15] bg-[#111111] px-4 py-3">
          <p className="font-['Barlow'] text-[17px] leading-relaxed text-[#CCCCCC]">
            Your safety is our priority. An emergency operator will contact you through your PAB
            device.
          </p>
        </section>
      </main>

      {/* 8. Success overlay */}
      {sent && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1A1A1A]/95 px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-[#F5C400]">
              <Check className="h-14 w-14 text-black" strokeWidth={3} aria-hidden />
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h2
                id="success-title"
                className="font-['Barlow_Condensed'] text-[36px] font-bold text-[#FFFFFF]"
              >
                Alert Sent
              </h2>
              <p className="font-['Barlow'] text-xl text-[#CCCCCC]">
                An operator will contact you shortly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
