import { NextResponse } from 'next/server';
import * as serverState from '@/app/lib/serverState';
import { sendPixelDataToVRChat } from '@/app/lib/oscService';

export async function POST() {
    serverState.stopAllServerAutomations();
    sendPixelDataToVRChat(serverState.pixelGrid);
    return NextResponse.json({ success: true, message: 'Pixel data sent to VRChat OSC.' });
}