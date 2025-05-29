// app/api/clear/route.ts
import { NextResponse } from 'next/server';
import * as serverState from '@/app/lib/serverState';
import { sendPixelDataToVRChat } from '@/app/lib/oscService';
import { GRID_SIZE } from '@/app/lib/font';
export async function POST() {
    serverState.stopAllServerAutomations();
    const clearedGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
    serverState.updatePixelGrid(clearedGrid);
    sendPixelDataToVRChat(serverState.pixelGrid);
    return NextResponse.json({ success: true, grid: serverState.pixelGrid, message: 'Grid cleared and sent to VRChat.' });
}