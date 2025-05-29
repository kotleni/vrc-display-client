// app/api/animations/play/route.ts
import { NextResponse } from 'next/server';
import * as serverState from '@/app/lib/serverState';
import { sendPixelDataToVRChat } from '@/app/lib/oscService';
import { GRID_SIZE } from '@/app/lib/font';

function animationStep() {
    if (serverState.currentAnimationFrames.length === 0 || !serverState.animationInterval) return;
    const newGrid = serverState.currentAnimationFrames[serverState.currentAnimationFrameIndex];
    serverState.updatePixelGrid(newGrid);
    sendPixelDataToVRChat(newGrid);
    let nextFrame = (serverState.currentAnimationFrameIndex + 1) % serverState.currentAnimationFrames.length;
    serverState.updateCurrentAnimationFrameIndex(nextFrame);
}
export async function POST(request: Request) {
    serverState.stopAllServerAutomations();
    const { frames, delay } = await request.json();
    if (!frames || !Array.isArray(frames) || frames.length === 0 || typeof delay !== 'number' || delay < 20) return NextResponse.json({ success: false, message: 'Valid frames and delay are required.' }, { status: 400 });
    serverState.updateCurrentAnimationFrames(frames);
    serverState.updateCurrentAnimationFrameIndex(0);
    animationStep();
    const intervalId = setInterval(animationStep, delay);
    serverState.updateAnimationInterval(intervalId);
    return NextResponse.json({ success: true, message: `Playing temporary animation.` });
}