import { NextResponse } from 'next/server';
// This line connects your logic to your route
import { analyseAudio } from '@/lib/voice'; 

export async function POST(req) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio'); // Matches your Voice.js append('file', ...)

        if (!audioFile) {
            return NextResponse.json(
                { error: 'No audio uploaded' },
                { status: 400 }
            );
        }

        // 1. Call your imported function
        const answer = await analyseAudio({
            audioFile
        });

        // 2. Forward the JSON string to your /api/text endpoint (Matching Video format)
        const response = await fetch(`/api/text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answer }) // answer is the JSON string from analyseAudio
        });

        const result = await response.json();

        return NextResponse.json(result);
        
    } catch (error) {
        console.error("Audio Analysis Route Error:", error);
        return NextResponse.json(
            { error: 'Audio analysis failed' },
            { status: 500 }
        );
    }
}