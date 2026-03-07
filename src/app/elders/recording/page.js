"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, VideoOff, Video, Check, Loader2, Info, ArrowLeft } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";
import { supabase } from "@/lib/supabase";

const BAR_COUNT = 28;
const MAX_RECORDING_SECONDS = 10;
const COUNTDOWN_SECONDS = 3;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function RecordingPage() {
  const router = useRouter();
  const { t, theme, mounted: settingsMounted } = useSettings();

  const videoRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [classification, setClassification] = useState("");
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [barHeights, setBarHeights] = useState(Array(BAR_COUNT).fill(20));
  const [streamReady, setStreamReady] = useState(false);
  const [recordingStarted, setRecordingStarted] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [showCountdown, setShowCountdown] = useState(true);

  const streamRef = useRef(null);
  const videoStreamRef = useRef(null);

  const audioRecorderRef = useRef(null);
  const videoRecorderRef = useRef(null);

  const audioChunksRef = useRef([]);
  const videoChunksRef = useRef([]);
  
  const recordingStartRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  const isRecording = recordingStarted && recordingStartRef.current !== null;
  const hasHitMax = recordingElapsed >= MAX_RECORDING_SECONDS;

  // Theme-based colors
  const colors = {
    bg: theme === "light" ? "#F8F5F2" : "#1A1A1A",
    text: theme === "light" ? "#1A1A1A" : "#FFFFFF",
    textMuted: theme === "light" ? "#666666" : "#CCCCCC",
    textDim: theme === "light" ? "#999999" : "#888888",
    cardBg: theme === "light" ? "#FFFFFF" : "#111111",
    cardBorder: theme === "light" ? "#E5E5E5" : "#3A3A3A",
    headerBg: theme === "light" ? "#FFFFFF" : "#111111",
    buttonBg: theme === "light" ? "#F5F5F5" : "#2A2A2A",
    buttonBorder: theme === "light" ? "#E5E5E5" : "#444444",
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Countdown timer before recording starts
  useEffect(() => {
    if (!mounted || !showCountdown) return;
    
    if (countdown <= 0) {
      setShowCountdown(false);
      recordingStartRef.current = Date.now();
      setRecordingStarted(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(c => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [mounted, countdown, showCountdown]);

  // Mic on mount + real-time waveform from AnalyserNode
  useEffect(() => {
    if (!mounted) return;
    let stream = null;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((s) => {
        stream = s;
        streamRef.current = s;
        setStreamReady(true);

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(s);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateBars = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const step = Math.floor(dataArray.length / BAR_COUNT);
          const heights = Array.from({ length: BAR_COUNT }, (_, i) => {
            const v = dataArray[Math.min(i * step, dataArray.length - 1)] ?? 0;
            return Math.max(8, 12 + (v / 255) * 50);
          });
          setBarHeights(heights);
          animationRef.current = requestAnimationFrame(updateBars);
        };
        updateBars();
      })
      .catch(() => {});
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      setStreamReady(false);
    };
  }, [mounted]);

  // Start audio + video recording only when user has clicked "Start recording" and stream is ready
  useEffect(() => {
    if (!recordingStarted || !streamRef.current || recordingStartRef.current === null) return;
    if (audioRecorderRef.current?.state === "recording") return;

    audioChunksRef.current = [];
    const audioRecorder = new MediaRecorder(streamRef.current, {
      mimeType: "audio/webm;codecs=opus",
    });
    audioRecorder.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
    audioRecorder.start(500);
    audioRecorderRef.current = audioRecorder;

    return () => {
      if (audioRecorderRef.current?.state === "recording") audioRecorderRef.current.stop();
    };
  }, [recordingStarted, streamReady]);

  // Start/stop video recorder when camera is on and recording session has started
  useEffect(() => {
    if (!recordingStarted || !cameraOn || !videoStreamRef.current || !streamRef.current) {
      if (videoRecorderRef.current?.state === "recording") videoRecorderRef.current.stop();
      videoRecorderRef.current = null;
      return;
    }
    if (videoRecorderRef.current?.state === "recording") return;

    videoChunksRef.current = [];
    const combined = new MediaStream([
      ...streamRef.current.getAudioTracks(),
      ...videoStreamRef.current.getVideoTracks(),
    ]);
    const videoRecorder = new MediaRecorder(combined, { mimeType: "video/webm;codecs=vp9,opus" });
    videoRecorder.ondataavailable = (e) => e.data.size > 0 && videoChunksRef.current.push(e.data);
    videoRecorder.start(500);
    videoRecorderRef.current = videoRecorder;

    return () => {
      if (videoRecorderRef.current?.state === "recording") videoRecorderRef.current.stop();
      videoRecorderRef.current = null;
    };
  }, [recordingStarted, cameraOn]);

  // Recording elapsed timer (0..10s) and auto-complete at 10s
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartRef.current) / 1000);
      setRecordingElapsed(Math.min(elapsed, MAX_RECORDING_SECONDS));
    }, 200);
    return () => clearInterval(id);
  }, [isRecording]);

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

  const stopRecordersAndSend = useCallback(async () => {
    if (sending) return;

    const audioRecorder = audioRecorderRef.current;
    const videoRecorder = videoRecorderRef.current;

    const waitForStop = (recorder) =>
      new Promise((resolve) => {
        if (!recorder || recorder.state !== "recording") {
          resolve();
          return;
        }
        recorder.onstop = resolve;
        recorder.stop();
      });

    await Promise.all([waitForStop(audioRecorder), waitForStop(videoRecorder)]);

    recordingStartRef.current = null;
    setSending(true);

    let transcript = "";
    let analysis = "";
    let voiceClassification = "";

    const audioBlob =
      audioChunksRef.current.length > 0
        ? new Blob(audioChunksRef.current, { type: "audio/webm" })
        : null;
    const videoBlob =
      videoChunksRef.current.length > 0
        ? new Blob(videoChunksRef.current, { type: "video/webm" })
        : null;

    try {
      if (audioBlob) {
        const voiceForm = new FormData();
        voiceForm.append("audio", audioBlob, "audio.webm");
        const voiceRes = await fetch("/api/voice", { method: "POST", body: voiceForm });
        if (voiceRes.ok) {
          const data = await voiceRes.json();
          transcript = data.transcript ?? "";
          voiceClassification = data.classification ?? "";
        }
      }

      if (videoBlob) {
        const videoForm = new FormData();
        videoForm.append("video", videoBlob, "video.webm");
        try {
          const videoRes = await fetch("/api/video", { method: "POST", body: videoForm });
          const data = await videoRes.json().catch(() => ({}));
          analysis = typeof data.analysis === "string" ? data.analysis : JSON.stringify(data.analysis ?? "");
        } catch (e) {
          console.error("Video API error:", e);
        }
      }

      const textRes = await fetch("/api/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: analysis, voiceTranscript: transcript }),
      });

      let finalClassification = "";
      let finalSummary = "";

      if (textRes.ok) {
        const textData = await textRes.json();
        const textClassification = textData.classification ?? "";
        finalClassification = textClassification ||
          (voiceClassification
            ? voiceClassification.toLowerCase() === "urgent"
              ? "Urgent"
              : voiceClassification.toLowerCase() === "false alarm"
                ? "Uncertain"
                : "Not Urgent"
            : "Pending");
        finalSummary = textData.summary ?? [transcript, analysis].filter(Boolean).join("\n\n");
        setClassification(finalClassification);
        setSummaryText(finalSummary);
      } else {
        finalClassification = voiceClassification
          ? voiceClassification.toLowerCase() === "urgent"
            ? "Urgent"
            : voiceClassification.toLowerCase() === "false alarm"
              ? "Uncertain"
              : "Not Urgent"
          : "Pending";
        finalSummary = [transcript, analysis].filter(Boolean).join("\n\n") || "Recording completed.";
        setClassification(finalClassification);
        setSummaryText(finalSummary);
      }

      // Normalize classification for DB: reports page expects "Non-Urgent" and "False Alarm"
      const dbClassification =
        finalClassification === "Not Urgent"
          ? "Non-Urgent"
          : finalClassification === "Uncertain"
            ? "False Alarm"
            : (finalClassification || "Pending");

      // Save report to Supabase
      try {
        const { error: saveError } = await supabase.from("reports").insert([
          {
            title: finalClassification === "Urgent" 
              ? "Urgent Emergency Alert" 
              : finalClassification === "Not Urgent" 
                ? "Non-Urgent Alert"
                : "Emergency Alert",
            classification: dbClassification,
            confidence: "Medium",
            summary: finalSummary,
            status: "Pending",
            has_video: videoBlob !== null,
            transcript: transcript,
            video_analysis: analysis,
          },
        ]);
        if (saveError) {
          console.error("Failed to save report:", saveError);
        } else {
          console.log("Report saved successfully");
        }
      } catch (saveErr) {
        console.error("Error saving report:", saveErr);
      }

    } catch (err) {
      console.error(err);
      setClassification("");
      setSummaryText("Recording completed. Summary unavailable.");
    } finally {
      setSending(false);
      setSent(true);
    }
  }, [sending]);

  // Auto-complete when we hit 10 seconds
  useEffect(() => {
    if (!hasHitMax || sending || sent) return;
    stopRecordersAndSend();
  }, [hasHitMax, sending, sent, stopRecordersAndSend]);

  const handleSend = useCallback(() => {
    if (hasHitMax) return;
    stopRecordersAndSend();
  }, [hasHitMax, stopRecordersAndSend]);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (videoStreamRef.current) videoStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Calculate progress percentage
  const progressPercent = (recordingElapsed / MAX_RECORDING_SECONDS) * 100;
  const timeRemaining = MAX_RECORDING_SECONDS - recordingElapsed;

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {/* Countdown Popup */}
      {showCountdown && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
          style={{ backgroundColor: theme === "light" ? "rgba(248,245,242,0.98)" : "rgba(26,26,26,0.98)" }}
        >
          <div className="flex flex-col items-center gap-6 text-center px-6">
            {/* Countdown Circle */}
            <div className="relative">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={theme === "light" ? "#E5E5E5" : "#3A3A3A"}
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#F5C400"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={2 * Math.PI * 70 * (1 - countdown / COUNTDOWN_SECONDS)}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="font-['Barlow_Condensed'] text-6xl font-bold"
                  style={{ color: colors.text }}
                >
                  {countdown}
                </span>
              </div>
            </div>
            
            <div>
              <h2
                className="font-['Barlow_Condensed'] text-2xl font-bold mb-2"
                style={{ color: colors.text }}
              >
                {settingsMounted ? t("recordingStartsIn") : "Recording starts in"}{" "}
                <span className="text-[#F5C400]">{countdown}</span>{" "}
                {settingsMounted ? t("seconds") : "seconds"}
              </h2>
              <p
                className="font-['Barlow'] text-lg"
                style={{ color: colors.textMuted }}
              >
                {settingsMounted ? t("getReady") : "Get ready to describe your emergency"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header with Recording indicator */}
      <header
        className="flex w-full items-center justify-between border-b px-4 py-3"
        style={{
          backgroundColor: colors.headerBg,
          borderColor: "#9D4F15",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 flex-shrink-0 rounded-full bg-[#F5C400] animate-pulse"
            aria-hidden
          />
          <span
            className="font-['Barlow_Condensed'] text-lg font-semibold tracking-wide"
            style={{ color: colors.text }}
          >
            {settingsMounted ? t("recording") : "RECORDING"}
          </span>
        </div>
      </header>

      {/* Prominent Timer Display */}
      <div
        className="sticky top-0 z-30 py-3 mx-auto max-w-lg px-4"
        style={{ backgroundColor: colors.bg }}
      >
        <div
          className="rounded-2xl p-4 shadow-lg"
          style={{
            backgroundColor: colors.cardBg,
            borderWidth: "2px",
            borderStyle: "solid",
            borderColor: timeRemaining <= 5 ? "#C0392B" : "#F5C400",
          }}
        >
          {/* Progress bar */}
          <div
            className="h-2 rounded-full mb-3 overflow-hidden"
            style={{ backgroundColor: theme === "light" ? "#E5E5E5" : "#3A3A3A" }}
          >
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: timeRemaining <= 5 ? "#C0392B" : "#F5C400",
              }}
            />
          </div>
          
          {/* Time display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: timeRemaining <= 5 ? "#C0392B" : "#F5C400" }}
              />
              <span
                className="font-['Barlow'] text-sm font-medium"
                style={{ color: colors.textMuted }}
              >
                {timeRemaining <= 5 
                  ? (settingsMounted ? t("timeRunningOut") : "Time running out!")
                  : (settingsMounted ? t("recordingInProgress") : "Recording...")}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="font-['Barlow_Condensed'] text-3xl font-bold tabular-nums"
                style={{ color: timeRemaining <= 5 ? "#C0392B" : colors.text }}
              >
                {formatTime(timeRemaining)}
              </span>
              <span
                className="font-['Barlow'] text-sm"
                style={{ color: colors.textDim }}
              >
                {settingsMounted ? t("timeLeft") : "left"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-lg px-4 pb-8 pt-4">
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
              <span className="text-lg font-['Barlow']">
                {settingsMounted ? t("cameraOff") : "Camera Off"}
              </span>
            </div>
          )}
        </section>

        <section
          className="mt-4 overflow-hidden rounded-lg bg-gradient-to-b from-[#2A2A6A] to-[#1A1A2A] px-6 py-6"
          aria-label="Microphone and waveform"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <Mic className="h-12 w-12 text-white" strokeWidth={2.5} aria-hidden />
              <span className="text-sm font-['Barlow'] text-[#CCCCCC]">
                {settingsMounted ? t("microphone") : "Microphone"}
              </span>
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

        <section className="mt-6">
          <h1
            className="font-['Barlow_Condensed'] text-[32px] font-semibold leading-tight"
            style={{ color: colors.text }}
          >
            {settingsMounted ? t("describeTitle") : "Please describe your situation"}
          </h1>
          <p
            className="mt-2 font-['Barlow'] text-lg leading-relaxed"
            style={{ color: colors.textMuted }}
          >
            {settingsMounted
              ? t("describeText", { seconds: MAX_RECORDING_SECONDS })
              : `Speak clearly in your preferred language (max ${MAX_RECORDING_SECONDS} seconds). You can also turn on your camera to show your surroundings.`}
          </p>
        </section>

        <section className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={toggleCamera}
            disabled={sending || hasHitMax}
            className="flex min-h-[64px] min-w-[56px] flex-1 items-center justify-center gap-3 rounded-lg font-['Barlow'] text-lg transition-colors disabled:opacity-50"
            style={{
              backgroundColor: colors.buttonBg,
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: cameraOn ? "#F5C400" : colors.buttonBorder,
              color: cameraOn ? "#F5C400" : colors.text,
            }}
            aria-label={cameraOn ? "Turn off camera" : "Turn on camera"}
          >
            <Video className="h-7 w-7 flex-shrink-0" strokeWidth={2} aria-hidden />
            <span>
              {settingsMounted
                ? (cameraOn ? t("turnOffCamera") : t("turnOnCamera"))
                : (cameraOn ? "Turn Off Camera" : "Turn On Camera")}
            </span>
          </button>
          <div className="flex flex-col flex-1 gap-1">
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || hasHitMax}
              className="flex min-h-[64px] min-w-[56px] w-full items-center justify-center gap-3 rounded-lg bg-[#F5C400] font-['Barlow'] text-lg font-bold text-black transition-opacity disabled:opacity-90"
              aria-label="Complete and send alert"
            >
              {sending ? (
                <>
                  <Loader2 className="h-7 w-7 flex-shrink-0 animate-spin" aria-hidden />
                  <span>{settingsMounted ? t("sending") : "Sending..."}</span>
                </>
              ) : hasHitMax ? (
                <span>{settingsMounted ? t("completing") : "Completing..."}</span>
              ) : (
                <span>{settingsMounted ? t("completeAndSend") : "Complete & Send Alert"}</span>
              )}
            </button>
            {/* Button explanation */}
            <div
              className="flex items-start gap-1.5 px-2 py-1 rounded-md"
              style={{ backgroundColor: theme === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)" }}
            >
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 opacity-60" />
              <p
                className="font-['Barlow'] text-xs leading-tight"
                style={{ color: colors.textDim }}
              >
                {settingsMounted
                  ? t("completeAndSendDesc")
                  : "Tap to finish recording and immediately send your alert to emergency services"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6" aria-label="Supported languages">
          <p
            className="mb-2 font-['Barlow'] text-base"
            style={{ color: colors.textDim }}
          >
            {settingsMounted ? t("weSupport") : "We support:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {["English", "Mandarin", "Tamil", "Malay", "Japanese", "Korean"].map((lang) => (
              <span
                key={lang}
                className="rounded-full px-3 py-1.5 font-['Barlow']"
                style={{
                  backgroundColor: colors.buttonBg,
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: colors.cardBorder,
                  color: colors.textMuted,
                }}
              >
                {lang}
              </span>
            ))}
          </div>
        </section>

        <section
          className="mt-6 rounded-r-lg border-l-4 border-[#9D4F15] px-4 py-3"
          style={{ backgroundColor: colors.cardBg }}
        >
          <p
            className="font-['Barlow'] text-[17px] leading-relaxed"
            style={{ color: colors.textMuted }}
          >
            {settingsMounted ? t("safetyMessage") : "Your safety is our priority. An emergency operator will contact you through your PAB device."}
          </p>
        </section>
      </main>

      {sent && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
          style={{ backgroundColor: theme === "light" ? "rgba(248,245,242,0.97)" : "rgba(26,26,26,0.97)" }}
        >
          <div className="flex max-h-[90vh] flex-col items-center gap-6 overflow-auto">
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-[#F5C400]">
              <Check className="h-14 w-14 text-black" strokeWidth={3} aria-hidden />
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h2
                id="success-title"
                className="font-['Barlow_Condensed'] text-[36px] font-bold"
                style={{ color: colors.text }}
              >
                {settingsMounted ? t("alertSent") : "Alert Sent"}
              </h2>
              <p
                className="font-['Barlow'] text-xl"
                style={{ color: colors.textMuted }}
              >
                {settingsMounted ? t("operatorContact") : "An operator will contact you shortly."}
              </p>
              <p
                className={`font-['Barlow'] text-lg font-bold mt-2 px-4 py-2 rounded-lg ${
                  !classification || classification.trim() === ""
                    ? "bg-[#3A3A3A] text-[#888888] border border-[#555555]"
                    : classification.toLowerCase() === "urgent"
                      ? "bg-[#C0392B] text-white"
                      : classification.toLowerCase() === "uncertain"
                        ? "bg-[#5D5D5D] text-white border border-[#888888]"
                        : "bg-[#2A2A2A] text-[#F5C400] border border-[#F5C400]"
                }`}
                aria-live="polite"
              >
                {settingsMounted ? t("status") : "Status"}: {classification && classification.trim() !== "" ? classification : (settingsMounted ? t("noClassification") : "No classification found")}
              </p>
            </div>
            {(summaryText || classification) && (
              <div
                className="w-full max-w-lg flex flex-col rounded-lg px-4 py-3 text-left max-h-[50vh] min-h-[120px] overflow-hidden"
                style={{
                  backgroundColor: colors.cardBg,
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: colors.cardBorder,
                }}
              >
                <p className="mb-2 font-['Barlow'] text-sm font-semibold text-[#F5C400] flex-shrink-0 text-center">
                  {settingsMounted ? t("analysisSummary") : "Analysis & summary"}
                </p>
                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                  <p
                    className="font-['Barlow'] text-[15px] leading-relaxed whitespace-pre-wrap break-words pr-1"
                    style={{ color: colors.textMuted }}
                  >
                    {summaryText || (settingsMounted ? t("noSummary") : "No summary available.")}
                  </p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-['Barlow'] text-base font-semibold transition-opacity hover:opacity-90"
              style={{
                backgroundColor: colors.buttonBg ?? "#F5C400",
                color: theme === "light" ? "#1A1A1A" : "#0D0D0D",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: colors.cardBorder,
              }}
              aria-label={settingsMounted ? t("backToButton") : "Back to button"}
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
              {settingsMounted ? t("backToButton") : "Back to button"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
