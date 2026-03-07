import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/voice";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio");

    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json({ error: "No audio uploaded" }, { status: 400 });
    }
  
    const transcript = await transcribeAudio(audio);
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Voice API error:", error);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}
