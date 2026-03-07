import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function analyseAudio({ audioFile }) {
  const openai = getOpenAI();

  const translation = await openai.audio.translations.create({
    file: audioFile,
    model: "whisper-1",
  });

  const transcript = translation.text;

  const prompt = `
You are an AI emergency monitoring system analysing a transcript from a security microphone.
Carefully analyse the text and determine the situation.

Classify into ONE category:
urgent (Immediate danger, violence, fire, medical distress, [screaming], or [crying])
non-urgent (Arguments, suspicious behavior, loitering, or [whispering])
uncertain (Normal conversation, everyday activity, [laughter], [singing], or [joyful shouting])

Return STRICT JSON:
{
  "classification": "urgent | non-urgent | false alarm",
  "confidence": "low | medium | high",
  "reason": "short explanation focusing on the emotional tone detected",
  "transcript": "${transcript}"
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
}
