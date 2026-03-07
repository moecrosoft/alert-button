import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function analyseVideo({ video }) {

    const buffer = Buffer.from(await video.arrayBuffer());
    const base64Video = buffer.toString('base64');

    const prompt = `
You are an AI emergency monitoring system analysing a short security camera recording.

Carefully analyse the video and determine the situation.

Classify into ONE category:

urgent
Immediate danger such as:
- physical violence
- weapon present
- fire
- car accident
- person unconscious
- medical emergency
- robbery

non-urgent
Suspicious or concerning activity but not immediate danger:
- argument
- person loitering
- suspicious movement
- minor disturbance

false alarm
Normal everyday activity:
- walking
- normal behaviour

Return STRICT JSON:

{
  "classification": "urgent | non-urgent | false alarm",
  "confidence": "low | medium | high",
  "reason": "short explanation"
}
`;

    const response = await openai.responses.create({
        model: 'gpt-4.1',
        response_format: { type: "json_object" },
        input: [
            {
                role: 'user',
                content: [
                    {
                        type: 'input_text',
                        text: prompt
                    },
                    {
                        type: 'input_video',
                        video: {
                            b64: base64Video
                        }
                    }
                ]
            }
        ]
    });

    return response.output_text;
}