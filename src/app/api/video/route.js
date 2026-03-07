import { NextResponse } from 'next/server';
import { analyseVideo } from '@/lib/video';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const video = formData.get('video');

        if (!video || typeof video.arrayBuffer !== "function") {
            return NextResponse.json(
                { error: "No video uploaded or invalid file" },
                { status: 400 }
            )
        }

        const analysis = await analyseVideo({ video });
        const analysisStr = typeof analysis === "string" ? analysis : JSON.stringify(analysis ?? "");
        return NextResponse.json({ analysis: analysisStr });
        
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Video analysis failed", analysis: "" },
            { status: 500 }
        );
    }
}