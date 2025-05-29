// app/api/presets/route.ts
import { NextResponse } from 'next/server';
import { listPresets } from '@/app/lib/fileStore';
export async function GET() {
    try {
        const presets = await listPresets();
        return NextResponse.json({ success: true, presets });
    } catch (error) {
        console.error("API Error listing presets:", error);
        return NextResponse.json({ success: false, message: 'Error listing presets.' }, { status: 500 });
    }
}