import OpenAI from 'openai';

function getOpenAI() {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function analyseAudio({ audioFile }) {
    const openai = getOpenAI();

    // 1. Translate the audio (Whisper-1 automatically converts any language to English)
    const translation = await openai.audio.translations.create({
        file: audioFile,
        model: "whisper-1",
    });

    const transcript = translation.text;

    // 2. Analyze the transcript for emergency classification (matching video.js format)
    const prompt = `
You are an AI emergency monitoring system analysing a transcript from a security microphone.
Carefully analyse the text and determine the situation.

Classify into ONE category:
urgent (Immediate danger, violence, fire, medical distress)
non-urgent (Arguments, suspicious behavior, loitering)
false alarm (Normal conversation, everyday activity)

Return STRICT JSON:
{
  "classification": "urgent | non-urgent | false alarm",
  "confidence": "low | medium | high",
  "reason": "short explanation",
  "transcript": "${transcript}"
}
`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o', // or your preferred model
        response_format: { type: "json_object" },
        messages: [
            { role: 'user', content: prompt }
        ]
    });

    return response.choices[0].message.content;
}