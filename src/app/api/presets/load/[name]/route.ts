// app/api/presets/load/[name]/route.ts
import { NextResponse } from 'next/server';
import * as serverState from '@/app/lib/serverState';
import { loadPreset } from '@/app/lib/fileStore';
import { sendPixelDataToVRChat } from '@/app/lib/oscService';
export async function GET(request: Request, { params }: { params: { name: string } }) {
    const { name } = params;
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) return NextResponse.json({ success: false, message: 'Invalid preset name format.' }, { status: 400 });
    try {
        serverState.stopAllServerAutomations();
        const loadedGrid = await loadPreset(name);
        if (loadedGrid) {
            serverState.updatePixelGrid(loadedGrid);
            sendPixelDataToVRChat(serverState.pixelGrid);
            return NextResponse.json({ success: true, grid: serverState.pixelGrid, message: `Preset '${name}' loaded.` });
        } else {
            return NextResponse.json({ success: false, message: 'Preset not found or invalid.' }, { status: 404 });
        }
    } catch (error) {
        console.error(`API Error loading preset ${name}:`, error);
        return NextResponse.json({ success: false, message: 'Error loading preset.' }, { status: 500 });
    }
}