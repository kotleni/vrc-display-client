import fs from 'fs/promises';
import path from 'path';
import { GRID_SIZE } from './font';

const DATA_ROOT_DIR = path.join(process.cwd(), 'data'); // process.cwd() gives project root
const PRESETS_DIR = path.join(DATA_ROOT_DIR, 'presets');
const ANIMATIONS_DIR = path.join(DATA_ROOT_DIR, 'animations');

export async function ensureDataDirs() {
    try {
        await fs.mkdir(PRESETS_DIR, { recursive: true });
        await fs.mkdir(ANIMATIONS_DIR, { recursive: true });
        console.log("Data directories ensured:", PRESETS_DIR, ANIMATIONS_DIR);
    } catch (error) {
        console.error("Error creating data directories:", error);
    }
}

// Call it once on server start (e.g. in a global setup file or at the top of this module)
ensureDataDirs();

export async function savePreset(name: string, grid: boolean[][]): Promise<void> {
    const filePath = path.join(PRESETS_DIR, `${name}.json`);
    await fs.writeFile(filePath, JSON.stringify(grid, null, 2));
}

export async function loadPreset(name: string): Promise<boolean[][] | null> {
    const filePath = path.join(PRESETS_DIR, `${name}.json`);
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const loadedGrid = JSON.parse(data);
        if (loadedGrid && loadedGrid.length === GRID_SIZE && loadedGrid.every((row: any) => Array.isArray(row) && row.length === GRID_SIZE)) {
            return loadedGrid;
        }
        return null;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return null; // File not found
        }
        throw error; // Other errors
    }
}

export async function listPresets(): Promise<string[]> {
    try {
        const files = await fs.readdir(PRESETS_DIR);
        return files.filter(file => file.endsWith('.json')).map(file => file.slice(0, -5));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return []; // Directory not found, so no presets
        }
        console.error("Error listing presets:", error);
        return [];
    }
}

export interface AnimationData {
    name: string;
    delay: number;
    frames: boolean[][][];
}

export async function saveAnimation(name: string, animation: AnimationData): Promise<void> {
    const filePath = path.join(ANIMATIONS_DIR, `${name}.json`);
    await fs.writeFile(filePath, JSON.stringify(animation, null, 2));
}

export async function loadAnimation(name: string): Promise<AnimationData | null> {
    const filePath = path.join(ANIMATIONS_DIR, `${name}.json`);
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const loadedAnimation: AnimationData = JSON.parse(data);
        // Add validation for animation structure if needed
        if (loadedAnimation && loadedAnimation.frames && Array.isArray(loadedAnimation.frames) && typeof loadedAnimation.delay === 'number') {
            return loadedAnimation;
        }
        return null;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

export async function listAnimations(): Promise<string[]> {
     try {
        const files = await fs.readdir(ANIMATIONS_DIR);
        return files.filter(file => file.endsWith('.json')).map(file => file.slice(0, -5));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return [];
        }
        console.error("Error listing animations:", error);
        return [];
    }
}