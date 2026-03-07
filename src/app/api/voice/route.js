import { NextResponse } from 'next/server';
// This line connects your logic to your route
import { analyseAudio } from '@/lib/voice'; 

export async function POST(req) {
    try {
        if (!process.env.OPENAI_API_KEY?.trim()) {
            console.warn("OPENAI_API_KEY is missing or empty. Using .env.local in the same folder as package.json. Restart the dev server after adding it.");
            return NextResponse.json({
                transcript: "",
                classification: "uncertain",
                reason: "Voice analysis unavailable (OPENAI_API_KEY not set)",
            });
        }

        const formData = await req.formData();
        const audioFile = formData.get('audio');

        if (!audioFile) {
            return NextResponse.json(
                { error: 'No audio uploaded' },
                { status: 400 }
            );
        }

        const answer = await analyseAudio({ audioFile });
        let parsed;
        try {
            parsed = typeof answer === 'string' ? JSON.parse(answer) : answer;
        } catch {
            parsed = { transcript: String(answer ?? ''), classification: 'unknown', reason: '', confidence: 'low' };
        }
        return NextResponse.json({
            transcript: parsed?.transcript ?? '',
            ...parsed
        });
        
    } catch (error) {
        console.error("Audio Analysis Route Error:", error);
        return NextResponse.json(
            { error: 'Audio analysis failed' },
            { status: 500 }
        );
    }
}
