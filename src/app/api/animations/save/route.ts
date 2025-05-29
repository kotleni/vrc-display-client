// app/api/animations/save/route.ts
import { NextResponse } from 'next/server';
import { saveAnimation, AnimationData } from '@/app/lib/fileStore';
export async function POST(request: Request) {
    try {
        const { name, frames, delay } = await request.json() as AnimationData;
        if (!name || !frames || !Array.isArray(frames) || frames.length === 0 || typeof delay !== 'number') return NextResponse.json({ success: false, message: 'Animation name, frames, and delay are required.' }, { status: 400 });
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) return NextResponse.json({ success: false, message: 'Invalid animation name format.' }, { status: 400 });
        await saveAnimation(name, {name, frames, delay});
        return NextResponse.json({ success: true, message: `Animation '${name}' saved.` });
    } catch (error) {
        console.error("API Error saving animation:", error);
        return NextResponse.json({ success: false, message: 'Error saving animation.' }, { status: 500 });
    }
}