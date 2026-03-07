"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, VideoOff, Video, Check, Loader2 } from "lucide-react";

const BAR_COUNT = 28;
const MAX_RECORDING_SECONDS = 10;

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
  const [summaryText, setSummaryText] = useState("");
  const [classification, setClassification] = useState("");
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [barHeights, setBarHeights] = useState(Array(BAR_COUNT).fill(20));
  const [streamReady, setStreamReady] = useState(false);
  const [recordingStarted, setRecordingStarted] = useState(false);

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

  useEffect(() => {
    setMounted(true);
    recordingStartRef.current = Date.now();
    setRecordingStarted(true);
  }, []);

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
        const videoRes = await fetch("/api/video", { method: "POST", body: videoForm });
        if (videoRes.ok) {
          const data = await videoRes.json();
          analysis = typeof data.analysis === "string" ? data.analysis : JSON.stringify(data.analysis ?? "");
        }
      }

      const textRes = await fetch("/api/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: analysis, voiceTranscript: transcript }),
      });

      if (textRes.ok) {
        const textData = await textRes.json();
        const textClassification = textData.classification ?? "";
        setClassification(
          textClassification ||
            (voiceClassification
              ? voiceClassification.toLowerCase() === "urgent"
                ? "Urgent"
                : voiceClassification.toLowerCase() === "false alarm"
                  ? "Uncertain"
                  : "Not Urgent"
              : "")
        );
        setSummaryText(textData.summary ?? [transcript, analysis].filter(Boolean).join("\n\n"));
      } else {
        setClassification(
          voiceClassification
            ? voiceClassification.toLowerCase() === "urgent"
              ? "Urgent"
              : voiceClassification.toLowerCase() === "false alarm"
                ? "Uncertain"
                : "Not Urgent"
            : ""
        );
        setSummaryText([transcript, analysis].filter(Boolean).join("\n\n") || "Recording completed.");
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

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#FFFFFF]">
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
          {formatTime(recordingElapsed)} / {formatTime(MAX_RECORDING_SECONDS)}
        </span>
      </header>

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
              <span className="text-lg font-['Barlow']">Camera Off</span>
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

        <section className="mt-6">
          <h1 className="font-['Barlow_Condensed'] text-[32px] font-semibold leading-tight text-[#FFFFFF]">
            Please describe your situation
          </h1>
          <p className="mt-2 font-['Barlow'] text-lg leading-relaxed text-[#CCCCCC]">
            Speak clearly in your preferred language (max {MAX_RECORDING_SECONDS} seconds). You can
            also turn on your camera to show your surroundings.
          </p>
        </section>

        <section className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={toggleCamera}
            disabled={sending || hasHitMax}
            className={`flex min-h-[64px] min-w-[56px] flex-1 items-center justify-center gap-3 rounded-lg border bg-[#2A2A2A] font-['Barlow'] text-lg text-white transition-colors disabled:opacity-50 ${
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
            disabled={sending || hasHitMax}
            className="flex min-h-[64px] min-w-[56px] flex-1 items-center justify-center gap-3 rounded-lg bg-[#F5C400] font-['Barlow'] text-lg font-bold text-black transition-opacity disabled:opacity-90"
            aria-label="Complete and send alert"
          >
            {sending ? (
              <>
                <Loader2 className="h-7 w-7 flex-shrink-0 animate-spin" aria-hidden />
                <span>Sending...</span>
              </>
            ) : hasHitMax ? (
              <span>Completing...</span>
            ) : (
              <span>Complete & Send Alert</span>
            )}
          </button>
        </section>

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

        <section className="mt-6 rounded-r-lg border-l-4 border-[#9D4F15] bg-[#111111] px-4 py-3">
          <p className="font-['Barlow'] text-[17px] leading-relaxed text-[#CCCCCC]">
            Your safety is our priority. An emergency operator will contact you through your PAB
            device.
          </p>
        </section>
      </main>

      {sent && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1A1A1A]/95 px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
        >
          <div className="flex max-h-[90vh] flex-col items-center gap-6 overflow-auto">
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
                Status: {classification && classification.trim() !== "" ? classification : "No classification found"}
              </p>
            </div>
            {(summaryText || classification) && (
              <div className="w-full max-w-lg flex flex-col rounded-lg border border-[#3A3A3A] bg-[#111111] px-4 py-3 text-left max-h-[50vh] min-h-[120px] overflow-hidden">
                <p className="mb-2 font-['Barlow'] text-sm font-semibold text-[#F5C400] flex-shrink-0 text-center">
                  Analysis &amp; summary
                </p>
                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                  <p className="font-['Barlow'] text-[15px] leading-relaxed text-[#CCCCCC] whitespace-pre-wrap break-words pr-1">
                    {summaryText || "No summary available."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
