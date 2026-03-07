import { NextResponse } from 'next/server';
import { analyseVideo } from '@/lib/video';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const video = formData.get('video');

        if (!video) {
            return NextResponse.json(
                { error: 'No video uploaded' },
                { status: 400 }
            )
        }

        const answer = await analyseVideo({
            video
        });

        const response = await fetch('/api/text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answer })
        })

        const result = await response.json();

        return NextResponse.json(result);
        
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: 'Video analysis failed' },
            { status: 500 }
        )
    }
}