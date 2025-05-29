// app/api/animations/route.ts
import { NextResponse } from 'next/server';
import { listAnimations } from '@/app/lib/fileStore';
export async function GET() {
    try {
        const animations = await listAnimations();
        return NextResponse.json({ success: true, animations });
    } catch (error) {
        console.error("API Error listing animations:", error);
        return NextResponse.json({ success: false, message: 'Error listing animations.' }, { status: 500 });
    }
}