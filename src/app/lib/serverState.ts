import { GRID_SIZE } from './font';
import {sendPixelDataToVRChat, sendSinglePixelDataToVRChat} from "@/app/lib/oscService"; // Assuming GRID_SIZE will be defined there or centrally

export let pixelGrid: boolean[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));

export let textScrollInterval: NodeJS.Timeout | null = null;
export let currentScrollText: string = "";
export let scrollTextPosition: number = 0;
export let textCharacterColumnBuffer: (boolean[])[] = [];

export let animationInterval: NodeJS.Timeout | null = null;
export let currentAnimationFrames: boolean[][][] = [];
export let currentAnimationFrameIndex: number = 0;

export function updatePixelGrid(newGrid: boolean[][]) {
    if (newGrid && newGrid.length === GRID_SIZE && newGrid.every(row => Array.isArray(row) && row.length === GRID_SIZE)) {
        pixelGrid = newGrid;
    }
}

export function resetAllPixelsInGame() {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            sendSinglePixelDataToVRChat(x, y, false);
        }
    }
}

/**
 * Smart update of the pixel grid in VRChat.
 * Updates only the cells that have changed.
 * @param newGrid
 */
export function updatePixelGridInGame(newGrid: boolean[][]) {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (pixelGrid[y][x] != newGrid[y][x]) {
                pixelGrid[y][x] = newGrid[y][x];
                sendSinglePixelDataToVRChat(x, y, newGrid[y][x]);
            }
        }
    }
}

export function updateTextScrollInterval(intervalId: NodeJS.Timeout | null) {
    if (textScrollInterval && intervalId !== textScrollInterval) {
        clearInterval(textScrollInterval);
    }
    textScrollInterval = intervalId;
}

export function updateCurrentScrollText(text: string) {
    currentScrollText = text;
}

export function updateScrollTextPosition(position: number) {
    scrollTextPosition = position;
}

export function updateTextCharacterColumnBuffer(buffer: (boolean[])[]) {
    textCharacterColumnBuffer = buffer;
}

export function updateAnimationInterval(intervalId: NodeJS.Timeout | null) {
    if (animationInterval && intervalId !== animationInterval) {
        clearInterval(animationInterval);
    }
    animationInterval = intervalId;
}

export function updateCurrentAnimationFrames(frames: boolean[][][]) {
    currentAnimationFrames = frames;
}

export function updateCurrentAnimationFrameIndex(index: number) {
    currentAnimationFrameIndex = index;
}

export function stopAllServerAutomations() {
    if (textScrollInterval) {
        clearInterval(textScrollInterval);
        textScrollInterval = null;
        currentScrollText = "";
        textCharacterColumnBuffer = [];
        scrollTextPosition = 0;
    }
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
        // currentAnimationFrames = []; // Optionally preserve frames
        // currentAnimationFrameIndex = 0;
    }
}
