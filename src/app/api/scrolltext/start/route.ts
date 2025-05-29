import { NextResponse } from 'next/server';
import * as serverState from '@/app/lib/serverState';
import { sendPixelDataToVRChat } from '@/app/lib/oscService';
import { generateTextColumnBuffer, GRID_SIZE } from '@/app/lib/font';

function scrollStep() {
    if (serverState.textCharacterColumnBuffer.length === 0) return;

    const newGrid: boolean[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const bufferX = (serverState.scrollTextPosition + x);
            if (bufferX >= 0 && bufferX < serverState.textCharacterColumnBuffer.length && 
                serverState.textCharacterColumnBuffer[bufferX] && 
                serverState.textCharacterColumnBuffer[bufferX][y] !== undefined) {
                newGrid[y][x] = serverState.textCharacterColumnBuffer[bufferX][y];
            } else {
                newGrid[y][x] = false;
            }
        }
    }
    serverState.updatePixelGrid(newGrid);
    sendPixelDataToVRChat(newGrid);
    
    let newPosition = serverState.scrollTextPosition + 1;
    if (newPosition >= serverState.textCharacterColumnBuffer.length + GRID_SIZE) {
        newPosition = -GRID_SIZE + 1;
    }
    serverState.updateScrollTextPosition(newPosition);
}


export async function POST(request: Request) {
    serverState.stopAllServerAutomations();
    const { text, speed } = await request.json();

    if (typeof text !== 'string' || text.length === 0) {
        return NextResponse.json({ success: false, message: 'Text is required.' }, { status: 400 });
    }
    const scrollSpeed = typeof speed === 'number' && speed > 0 ? speed : 200;

    serverState.updateCurrentScrollText(text);
    serverState.updateScrollTextPosition(-GRID_SIZE + 1);
    serverState.updateTextCharacterColumnBuffer(generateTextColumnBuffer(text));

    if (serverState.textCharacterColumnBuffer.length === 0) {
        return NextResponse.json({ success: false, message: 'Could not generate text buffer.' }, { status: 400 });
    }
    
    scrollStep(); // Initial paint
    const intervalId = setInterval(scrollStep, scrollSpeed);
    serverState.updateTextScrollInterval(intervalId);

    return NextResponse.json({ success: true, message: `Scrolling text started: "${text}"` });
}