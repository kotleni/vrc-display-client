import { Client as OscClient } from 'node-osc';
import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VRC_IP = '127.0.0.1';
const VRC_OSC_PORT = 9000;
const WEB_SERVER_PORT = 3000;
const PRESETS_DIR = path.join(__dirname, 'presets');
const ANIMATIONS_DIR = path.join(__dirname, 'animations');


const oscClient = new OscClient(VRC_IP, VRC_OSC_PORT);
const app = express();

const GRID_SIZE = 15;
let pixelGrid: boolean[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
let bufferPixelGrid: boolean[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));

let textScrollInterval: NodeJS.Timeout | null = null;
let currentScrollText = "";
let scrollTextPosition = 0;
let textCharacterColumnBuffer: (boolean[])[] = [];

let animationInterval: NodeJS.Timeout | null = null;
let currentAnimationFrames: boolean[][][] = [];
let currentAnimationFrameIndex = 0;


async function ensureDir(dirPath: string) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        console.error(`Error creating directory ${dirPath}:`, error);
    }
}
ensureDir(PRESETS_DIR);
ensureDir(ANIMATIONS_DIR);


app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

interface PixelUpdateInstruction {
    x: number;
    y: number;
    value: boolean;
    address: string;
}

// Fisher-Yates (Knuth) Shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // ES6 destructuring swap
    }
    return array;
}

function sendPixelDataToVRChat(currentPixelGrid: boolean[][]): void {
    const pixelsToUpdate: PixelUpdateInstruction[] = [];

    // 1. Identify all pixels that need updating
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const currentValue = currentPixelGrid[y][x];

            // Ensure bufferPixelGrid has this entry.
            // If bufferPixelGrid[y] or bufferPixelGrid[y][x] is undefined,
            // it means it was never set, so we should treat its "buffered" value
            // as different from currentValue to force an update.
            // A common way is to assume it's the opposite of currentValue.
            const bufferedValue = (bufferPixelGrid[y] && bufferPixelGrid[y][x] !== undefined)
                ? bufferPixelGrid[y][x]
                : !currentValue; // Force update if buffer entry is missing/uninitialized

            if (currentValue !== bufferedValue) {
                pixelsToUpdate.push({
                    x,
                    y,
                    value: currentValue,
                    address: `/avatar/parameters/Pixel_${y}_${x}`
                });
            }
        }
    }

    if (pixelsToUpdate.length === 0) {
        return;
    }

    // 2. Shuffle the list of pixels to update
    shuffleArray(pixelsToUpdate);

    // console.log(`Attempting to send ${pixelsToUpdate.length} pixel updates in random order.`);

    // 3. Send them in the new random order and update our buffer
    for (const pixel of pixelsToUpdate) {
        oscClient.send(pixel.address, pixel.value);

        // Update our buffer *after* sending (or attempting to send)
        // Ensure the row exists in the buffer grid
        if (!bufferPixelGrid[pixel.y]) {
            bufferPixelGrid[pixel.y] = new Array(GRID_SIZE).fill(!pixel.value); // Initialize with opposite
        }
        bufferPixelGrid[pixel.y][pixel.x] = pixel.value;
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/grid', (req, res) => {
    res.json({ grid: pixelGrid });
});

app.post('/api/grid', (req, res) => {
    const { newGrid } = req.body;
    if (newGrid && newGrid.length === GRID_SIZE && newGrid.every((row: any) => Array.isArray(row) && row.length === GRID_SIZE)) {
        pixelGrid = newGrid;
        res.json({ success: true, grid: pixelGrid });
    } else {
        res.status(400).json({ success: false, message: 'Invalid grid data' });
    }
});

app.post('/api/send', (req, res) => {
    stopAllAutomations();
    sendPixelDataToVRChat(pixelGrid);
    res.json({ success: true, message: 'Pixel data sent to VRChat OSC.' });
});

app.post('/api/clear', (req, res) => {
    stopAllAutomations();
    pixelGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
    sendPixelDataToVRChat(pixelGrid);
    res.json({ success: true, grid: pixelGrid, message: 'Grid cleared and sent to VRChat.' });
});

app.post('/api/presets/save', async (req, res) => {
    const { name, grid } = req.body;
    if (!name || !grid) {
        return res.status(400).json({ success: false, message: 'Preset name and grid data are required.' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        return res.status(400).json({ success: false, message: 'Preset name can only contain letters, numbers, underscores, and hyphens.' });
    }
    try {
        const filePath = path.join(PRESETS_DIR, `${name}.json`);
        await fs.writeFile(filePath, JSON.stringify(grid, null, 2));
        res.json({ success: true, message: `Preset '${name}' saved.` });
    } catch (error) {
        console.error("Error saving preset:", error);
        res.status(500).json({ success: false, message: 'Error saving preset.' });
    }
});

app.get('/api/presets/load/:name', async (req, res) => {
    const { name } = req.params;
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        return res.status(400).json({ success: false, message: 'Invalid preset name format.' });
    }
    try {
        stopAllAutomations();
        const filePath = path.join(PRESETS_DIR, `${name}.json`);
        const data = await fs.readFile(filePath, 'utf-8');
        const loadedGrid = JSON.parse(data);
        if (loadedGrid && loadedGrid.length === GRID_SIZE && loadedGrid.every((row: any) => Array.isArray(row) && row.length === GRID_SIZE)) {
            pixelGrid = loadedGrid;
            sendPixelDataToVRChat(pixelGrid);
            res.json({ success: true, grid: pixelGrid, message: `Preset '${name}' loaded.` });
        } else {
            res.status(400).json({ success: false, message: 'Invalid preset file format.' });
        }
    } catch (error) {
        console.error("Error loading preset:", error);
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return res.status(404).json({ success: false, message: 'Preset not found.' });
        }
        res.status(500).json({ success: false, message: 'Error loading preset.' });
    }
});

app.get('/api/presets', async (req, res) => {
    try {
        const files = await fs.readdir(PRESETS_DIR);
        const presetNames = files
            .filter(file => file.endsWith('.json'))
            .map(file => file.slice(0, -5));
        res.json({ success: true, presets: presetNames });
    } catch (error) {
        console.error("Error listing presets:", error);
        res.status(500).json({ success: false, message: 'Error listing presets.' });
    }
});

const FONT_DATA: { [char: string]: boolean[][] } = {
    'A':[[false,true,true,true,false],[true,false,false,false,true],[true,false,false,false,true],[true,true,true,true,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true]],
    'B':[[true,true,true,true,false],[true,false,false,false,true],[true,false,false,false,true],[true,true,true,true,false],[true,false,false,false,true],[true,false,false,false,true],[true,true,true,true,false]],
    'C':[[false,true,true,true,true],[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false],[false,true,true,true,true]],
    'D':[[true,true,true,true,false],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,true,true,true,false]],
    'E':[[true,true,true,true,true],[true,false,false,false,false],[true,false,false,false,false],[true,true,true,true,false],[true,false,false,false,false],[true,false,false,false,false],[true,true,true,true,true]],
    'F':[[true,true,true,true,true],[true,false,false,false,false],[true,false,false,false,false],[true,true,true,true,false],[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false]],
    'G':[[false,true,true,true,false],[true,false,false,false,true],[true,false,false,false,false],[true,false,true,true,true],[true,false,false,false,true],[true,false,false,false,true],[false,true,true,true,true]],
    'H':[[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,true,true,true,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true]],
    'I':[[true,true,true,true,true],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[true,true,true,true,true]],
    'J':[[false,false,false,false,true],[false,false,false,false,true],[false,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[false,true,true,true,false]],
    'K':[[true,false,false,false,true],[true,false,false,true,false],[true,false,true,false,false],[true,true,false,false,false],[true,false,true,false,false],[true,false,false,true,false],[true,false,false,false,true]],
    'L':[[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false],[true,true,true,true,true]],
    'M':[[true,false,false,false,true],[true,true,false,true,true],[true,false,true,false,true],[true,false,true,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true]],
    'N':[[true,false,false,false,true],[true,true,false,false,true],[true,false,true,false,true],[true,false,false,true,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true]],
    'O':[[false,true,true,true,false],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[false,true,true,true,false]],
    'P':[[true,true,true,true,false],[true,false,false,false,true],[true,false,false,false,true],[true,true,true,true,false],[true,false,false,false,false],[true,false,false,false,false],[true,false,false,false,false]],
    'Q':[[false,true,true,true,false],[true,false,false,false,true],[true,false,false,false,true],[true,false,true,false,true],[true,false,false,true,true],[false,true,true,true,false],[false,false,false,false,true]],
    'R':[[true,true,true,true,false],[true,false,false,false,true],[true,false,false,false,true],[true,true,true,true,false],[true,false,true,false,false],[true,false,false,true,false],[true,false,false,false,true]],
    'S':[[false,true,true,true,false],[true,false,false,false,false],[false,true,true,true,false],[false,false,false,false,true],[true,true,true,true,false],[false,false,false,false,false],[false,false,false,false,false]],
    'T':[[true,true,true,true,true],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false]],
    'U':[[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[false,true,true,true,false]],
    'V':[[true,false,false,false,true],[true,false,false,false,true],[true,false,false,false,true],[false,true,false,true,false],[false,true,false,true,false],[false,false,true,false,false],[false,false,true,false,false]],
    'W':[[true,false,false,false,true],[true,false,false,false,true],[true,false,true,false,true],[true,false,true,false,true],[true,true,false,true,true],[true,true,false,true,true],[false,false,false,false,false]],
    'X':[[true,false,false,false,true],[false,true,false,true,false],[false,false,true,false,false],[false,false,true,false,false],[false,true,false,true,false],[true,false,false,false,true],[false,false,false,false,false]],
    'Y':[[true,false,false,false,true],[true,false,false,false,true],[false,true,false,true,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false]],
    'Z':[[true,true,true,true,true],[false,false,false,true,false],[false,false,true,false,false],[false,true,false,false,false],[true,false,false,false,false],[true,true,true,true,true],[false,false,false,false,false]],
    ' ': [[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false]],
    '0':[[false,true,true,true,false],[true,false,false,true,true],[true,false,true,false,true],[true,true,false,false,true],[false,true,true,true,false],[false,false,false,false,false],[false,false,false,false,false]],
    '1':[[false,false,true,false,false],[false,true,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,true,true,true,false],[false,false,false,false,false]],
    '2':[[false,true,true,true,false],[true,false,false,false,true],[false,false,false,true,false],[false,false,true,false,false],[false,true,false,false,false],[true,true,true,true,true],[false,false,false,false,false]],
    '3':[[true,true,true,true,false],[false,false,false,false,true],[false,true,true,true,false],[false,false,false,false,true],[true,true,true,true,false],[false,false,false,false,false],[false,false,false,false,false]],
    '4':[[true,false,false,true,false],[true,false,false,true,false],[true,true,true,true,true],[false,false,false,true,false],[false,false,false,true,false],[false,false,false,false,false],[false,false,false,false,false]],
    '5':[[true,true,true,true,true],[true,false,false,false,false],[true,true,true,true,false],[false,false,false,false,true],[true,true,true,true,false],[false,false,false,false,false],[false,false,false,false,false]],
    '6':[[false,true,true,true,false],[true,false,false,false,false],[true,true,true,true,false],[true,false,false,false,true],[false,true,true,true,false],[false,false,false,false,false],[false,false,false,false,false]],
    '7':[[true,true,true,true,true],[false,false,false,false,true],[false,false,false,true,false],[false,false,true,false,false],[false,true,false,false,false],[false,false,false,false,false],[false,false,false,false,false]],
    '8':[[false,true,true,true,false],[true,false,false,false,true],[false,true,true,true,false],[true,false,false,false,true],[false,true,true,true,false],[false,false,false,false,false],[false,false,false,false,false]],
    '9':[[false,true,true,true,false],[true,false,false,false,true],[false,true,true,true,true],[false,false,false,false,true],[false,true,true,true,false],[false,false,false,false,false],[false,false,false,false,false]],
    '.':[[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,true,true,false,false],[false,true,true,false,false]],
    '!':[[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,true,false,false],[false,false,false,false,false],[false,false,true,false,false],[false,false,false,false,false]],
};


const CHAR_WIDTH = 5;
const CHAR_HEIGHT = 7;
const CHAR_SPACING = 1;

function generateTextColumnBuffer(text: string): (boolean[])[] {
    const buffer: (boolean[])[] = [];
    const upperText = text.toUpperCase();
    const yOffset = Math.floor((GRID_SIZE - CHAR_HEIGHT) / 2);

    for (const char of upperText) {
        const charData = FONT_DATA[char] || FONT_DATA[' '];
        if (charData) {
            for (let c = 0; c < CHAR_WIDTH; c++) {
                const colBuffer: boolean[] = Array(GRID_SIZE).fill(false);
                for (let r = 0; r < CHAR_HEIGHT; r++) {
                    if (yOffset + r >= 0 && yOffset + r < GRID_SIZE) {
                        colBuffer[yOffset + r] = charData[r][c];
                    }
                }
                buffer.push(colBuffer);
            }
            for (let s = 0; s < CHAR_SPACING; s++) {
                buffer.push(Array(GRID_SIZE).fill(false));
            }
        }
    }
    return buffer;
}

function scrollStep() {
    if (textCharacterColumnBuffer.length === 0) return;

    const newGrid: boolean[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const bufferX = (scrollTextPosition + x);
            if (bufferX >= 0 && bufferX < textCharacterColumnBuffer.length && textCharacterColumnBuffer[bufferX] && textCharacterColumnBuffer[bufferX][y] !== undefined) {
                newGrid[y][x] = textCharacterColumnBuffer[bufferX][y];
            } else {
                newGrid[y][x] = false;
            }
        }
    }
    pixelGrid = newGrid;
    sendPixelDataToVRChat(pixelGrid);
    scrollTextPosition = (scrollTextPosition + 1);
    if(scrollTextPosition >= textCharacterColumnBuffer.length + GRID_SIZE) {
        scrollTextPosition = -GRID_SIZE +1;
    }
}

function animationStep() {
    if (currentAnimationFrames.length === 0) return;
    pixelGrid = currentAnimationFrames[currentAnimationFrameIndex];
    sendPixelDataToVRChat(pixelGrid);
    currentAnimationFrameIndex = (currentAnimationFrameIndex + 1) % currentAnimationFrames.length;
}

function stopAllAutomations() {
    if (textScrollInterval) {
        clearInterval(textScrollInterval);
        textScrollInterval = null;
        currentScrollText = "";
        textCharacterColumnBuffer = [];
    }
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
}

app.post('/api/scrolltext/start', (req, res) => {
    stopAllAutomations();
    const { text, speed } = req.body;
    if (typeof text !== 'string' || text.length === 0) {
        return res.status(400).json({ success: false, message: 'Text is required.' });
    }
    const scrollSpeed = typeof speed === 'number' && speed > 0 ? speed : 200;

    currentScrollText = text;
    scrollTextPosition = -GRID_SIZE + 1;
    textCharacterColumnBuffer = generateTextColumnBuffer(currentScrollText);

    if(textCharacterColumnBuffer.length === 0){
        return res.status(400).json({ success: false, message: 'Could not generate text buffer (empty or unknown chars).' });
    }
    scrollStep();
    textScrollInterval = setInterval(scrollStep, scrollSpeed);
    res.json({ success: true, message: `Scrolling text started: "${text}"` });
});

app.post('/api/scrolltext/stop', (req, res) => {
    if (textScrollInterval) {
        clearInterval(textScrollInterval);
        textScrollInterval = null;
    }
    currentScrollText = "";
    textCharacterColumnBuffer = [];
    res.json({ success: true, message: 'Scrolling text stopped.' });
});


app.post('/api/animations/save', async (req, res) => {
    const { name, frames, delay } = req.body;
    if (!name || !frames || !Array.isArray(frames) || frames.length === 0 || typeof delay !== 'number') {
        return res.status(400).json({ success: false, message: 'Animation name, frames (array), and delay (number) are required.' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        return res.status(400).json({ success: false, message: 'Animation name can only contain letters, numbers, underscores, and hyphens.' });
    }
    try {
        const animationData = { name, delay, frames };
        const filePath = path.join(ANIMATIONS_DIR, `${name}.json`);
        await fs.writeFile(filePath, JSON.stringify(animationData, null, 2));
        res.json({ success: true, message: `Animation '${name}' saved.` });
    } catch (error) {
        console.error("Error saving animation:", error);
        res.status(500).json({ success: false, message: 'Error saving animation.' });
    }
});

app.post('/api/animations/play', (req, res) => {
    stopAllAutomations();
    const { frames, delay } = req.body;
    if (!frames || !Array.isArray(frames) || frames.length === 0 || typeof delay !== 'number' || delay < 20) {
        return res.status(400).json({ success: false, message: 'Valid frames (array) and delay (number >= 20) are required.' });
    }
    currentAnimationFrames = frames;
    currentAnimationFrameIndex = 0;
    animationStep();
    animationInterval = setInterval(animationStep, delay);
    res.json({ success: true, message: `Playing temporary animation.` });
});


app.get('/api/animations/load/:name', async (req, res) => {
    const { name } = req.params;
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        return res.status(400).json({ success: false, message: 'Invalid animation name format.' });
    }
    try {
        stopAllAutomations();
        const filePath = path.join(ANIMATIONS_DIR, `${name}.json`);
        const data = await fs.readFile(filePath, 'utf-8');
        const loadedAnimation = JSON.parse(data);

        if (loadedAnimation && loadedAnimation.frames && Array.isArray(loadedAnimation.frames) && typeof loadedAnimation.delay === 'number') {
            currentAnimationFrames = loadedAnimation.frames;
            currentAnimationFrameIndex = 0;
            if (currentAnimationFrames.length > 0) {
                pixelGrid = currentAnimationFrames[0];
                sendPixelDataToVRChat(pixelGrid); // Send first frame immediately
                animationInterval = setInterval(animationStep, loadedAnimation.delay);
            }
            res.json({ success: true, animation: loadedAnimation, message: `Animation '${name}' loaded and started.` });
        } else {
            res.status(400).json({ success: false, message: 'Invalid animation file format.' });
        }
    } catch (error) {
        console.error("Error loading animation:", error);
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return res.status(404).json({ success: false, message: 'Animation not found.' });
        }
        res.status(500).json({ success: false, message: 'Error loading animation.' });
    }
});

app.get('/api/animations', async (req, res) => {
    try {
        const files = await fs.readdir(ANIMATIONS_DIR);
        const animationNames = files
            .filter(file => file.endsWith('.json'))
            .map(file => file.slice(0, -5));
        res.json({ success: true, animations: animationNames });
    } catch (error) {
        console.error("Error listing animations:", error);
        res.status(500).json({ success: false, message: 'Error listing animations.' });
    }
});

app.post('/api/animations/stop', (req, res) => {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    res.json({ success: true, message: 'Animation stopped.' });
});


app.listen(WEB_SERVER_PORT, () => {
    console.log(`Web server running at http://localhost:${WEB_SERVER_PORT}`);
    console.log(`OSC client targeting ${VRC_IP}:${VRC_OSC_PORT}`);
});

process.on('SIGINT', () => {
    console.log("\nCaught interrupt signal. Closing OSC client and web server.");
    stopAllAutomations();
    const allOffGrid: boolean[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
    sendPixelDataToVRChat(allOffGrid);
    setTimeout(() => {
        oscClient.close();
        console.log("OSC Client closed.");
        process.exit(0);
    }, 500);
});

// public/index.html
/*

*/