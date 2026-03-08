import { NextResponse } from 'next/server';
import { analyseVideo } from '@/lib/video';

const FALLBACK_ANALYSIS = JSON.stringify({
  classification: "uncertain",
  confidence: "low",
  reason: "Video analysis unavailable (e.g. ffmpeg not installed or API error).",
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const video = formData.get('video');

    if (!video || typeof video.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "No video uploaded or invalid file" },
        { status: 400 }
      );
    }

    const analysis = await analyseVideo(video);
    const analysisStr = typeof analysis === "string" ? analysis : JSON.stringify(analysis ?? "");
    return NextResponse.json({ analysis: analysisStr });
  } catch (error) {
    console.error("Video API error:", error);
    return NextResponse.json({ analysis: FALLBACK_ANALYSIS });
  }
}