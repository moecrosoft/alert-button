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
      );
    }

    const analysis = await analyseVideo(video); // ✅ pass File directly
    return NextResponse.json({ analysis });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Video analysis failed' },
      { status: 500 }
    );
  }
}