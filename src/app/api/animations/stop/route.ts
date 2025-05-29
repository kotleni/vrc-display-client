// app/api/animations/stop/route.ts
import { NextResponse } from 'next/server';
import * as serverState from '@/app/lib/serverState';
export async function POST() {
    if (serverState.animationInterval) clearInterval(serverState.animationInterval);
    serverState.updateAnimationInterval(null);
    return NextResponse.json({ success: true, message: 'Animation stopped.' });
}