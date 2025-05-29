// app/api/animations/load/[name]/route.ts
import { NextResponse } from 'next/server';
import * as serverState from '@/app/lib/serverState';
import { loadAnimation } from '@/app/lib/fileStore';
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
export async function GET(request: Request, { params }: { params: { name: string } }) {
    const { name } = await params;
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) return NextResponse.json({ success: false, message: 'Invalid animation name format.' }, { status: 400 });
    try {
        serverState.stopAllServerAutomations();
        const loadedAnimation = await loadAnimation(name);
        if (loadedAnimation) {
            serverState.updateCurrentAnimationFrames(loadedAnimation.frames);
            serverState.updateCurrentAnimationFrameIndex(0);
            if (serverState.currentAnimationFrames.length > 0) {
                const firstFrame = serverState.currentAnimationFrames[0];
                serverState.updatePixelGrid(firstFrame);
                sendPixelDataToVRChat(firstFrame);
                const intervalId = setInterval(animationStep, loadedAnimation.delay);
                serverState.updateAnimationInterval(intervalId);
            }
            return NextResponse.json({ success: true, animation: loadedAnimation, message: `Animation '${name}' loaded and started.` });
        } else {
            return NextResponse.json({ success: false, message: 'Animation not found or invalid.' }, { status: 404 });
        }
    } catch (error) {
        console.error(`API Error loading animation ${name}:`, error);
        return NextResponse.json({ success: false, message: 'Error loading animation.' }, { status: 500 });
    }
}