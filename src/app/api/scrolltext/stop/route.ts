// app/api/scrolltext/stop/route.ts
import { NextResponse } from 'next/server';
import * as serverState from '@/app/lib/serverState';
export async function POST() {
    if (serverState.textScrollInterval) clearInterval(serverState.textScrollInterval);
    serverState.updateTextScrollInterval(null);
    serverState.updateCurrentScrollText("");
    serverState.updateTextCharacterColumnBuffer([]);
    serverState.updateScrollTextPosition(0);
    return NextResponse.json({ success: true, message: 'Scrolling text stopped.' });
}