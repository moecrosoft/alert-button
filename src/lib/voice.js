import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Transcribe audio blob to text using OpenAI Whisper.
 * @param {Blob|File} audioBlob - Audio file (webm, mp3, wav, m4a, etc.)
 * @returns {Promise<string>} Transcript text
 */
export async function transcribeAudio(audioBlob) {
  const openai = getOpenAI();
  const file = new File([audioBlob], "audio.webm", { type: audioBlob.type || "audio/webm" });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });

  return transcription.text?.trim() || "";
}
