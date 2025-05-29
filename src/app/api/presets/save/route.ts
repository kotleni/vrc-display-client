// app/api/presets/save/route.ts
import { NextResponse } from 'next/server';
import { savePreset } from '@/app/lib/fileStore';
export async function POST(request: Request) {
    try {
        const { name, grid } = await request.json();
        if (!name || !grid) return NextResponse.json({ success: false, message: 'Preset name and grid data are required.' }, { status: 400 });
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) return NextResponse.json({ success: false, message: 'Invalid preset name format.' }, { status: 400 });
        await savePreset(name, grid);
        return NextResponse.json({ success: true, message: `Preset '${name}' saved.` });
    } catch (error) {
        console.error("API Error saving preset:", error);
        return NextResponse.json({ success: false, message: 'Error saving preset.' }, { status: 500 });
    }
}