import {GRID_SIZE} from "@/app/lib/font";
import {resetAllPixelsInGame, updatePixelGrid, updatePixelGridInGame} from "@/app/lib/serverState";
import { clearTimeout } from "timers";
import {sendPixelDataToVRChat} from "@/app/lib/oscService"; // Changed from clearInterval

export interface SandboxToyMeta {
    id: string;
    name: string;
}

export interface SandboxToy {
    id: string;
    name: string;
    updateDelay: number;
    onStart: () => Promise<void>;
    onStop: () => Promise<void>;
    onUpdate: () => Promise<void>;
}

interface DisplayRenderer {
    getWidth: () => Promise<number>;
    getHeight: () => Promise<number>;

    clear: () => Promise<void>;
    setPixel: (x: number, y: number, value: boolean) => Promise<void>;
    getPixel: (x: number, y: number) => Promise<boolean>;
    render: () => Promise<void>;
}

class DisplayRendererImpl implements DisplayRenderer {
    private pixelGrid: boolean[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));

    async getWidth(): Promise<number> {
        return GRID_SIZE;
    }

    async getHeight(): Promise<number> {
        return GRID_SIZE;
    }

    async clear(): Promise<void> {
        resetAllPixelsInGame();
    }

    async render(): Promise<void> {
        updatePixelGridInGame(this.pixelGrid);
    }

    async setPixel(x: number, y: number, value: boolean): Promise<void> {
        this.pixelGrid[y][x] = value;
    }

    async getPixel(x: number, y: number): Promise<boolean> {
        return this.pixelGrid[y][x];
    }
}

class FillAndClearToy implements SandboxToy {
    renderer: DisplayRenderer = new DisplayRendererImpl();

    id: string = "fill-and-clear";
    name: string = "Fill and Clear";
    updateDelay: number = 1000;

    private isRunning: boolean = false;

    async onStart(): Promise<void> {
        await this.renderer.clear();
        this.isRunning = true;
    }

    async onStop(): Promise<void> {
        this.isRunning = false;
    }

    async onUpdate(): Promise<void> {
        for(let y = 0; y < await this.renderer.getHeight(); y++) {
            for(let x = 0; x < await this.renderer.getWidth(); x++) {
                await this.renderer.setPixel(x, y, !(await this.renderer.getPixel(x, y)));
                await this.renderer.render();
                await new Promise(resolve => setTimeout(resolve, 15));

                if(!this.isRunning) return;
            }
        }
    }
}

class BouncingBallToy implements SandboxToy {
    renderer: DisplayRenderer = new DisplayRendererImpl(); // Or your actual implementation

    id: string = "bouncing-ball";
    name: string = "Bouncing Ball";
    updateDelay: number = 150;

    private isRunning: boolean = false;

    private ballX: number = 0;
    private ballY: number = 0;
    private velocityX: number = 1;
    private velocityY: number = 1;

    private displayWidth: number = -1;
    private displayHeight: number = -1;

    async onStart(): Promise<void> {
        this.displayWidth = await this.renderer.getWidth();
        this.displayHeight = await this.renderer.getHeight();

        await this.renderer.clear();

        // Initial position
        this.ballX = Math.floor(Math.random() * this.displayWidth);
        this.ballY = Math.floor(Math.random() * this.displayHeight);

        // Initial velocity
        this.velocityX = Math.random() < 0.5 ? 1 : -1;
        this.velocityY = Math.random() < 0.5 ? 1 : -1;

        this.isRunning = true;
    }

    async onStop(): Promise<void> {
        this.isRunning = false;
    }

    async onUpdate(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        // 1. Clear current ball position
        await this.renderer.setPixel(this.ballX, this.ballY, false);

        // 2. Calculate next position
        let nextX = this.ballX + this.velocityX;
        let nextY = this.ballY + this.velocityY;

        // 3. Collision detection and response
        // Horizontal bounce
        if (nextX < 0) {
            nextX = 0; // Place ball on the boundary
            this.velocityX *= -1; // Reverse horizontal direction
            // Chance to change vertical velocity
            if (Math.random() < (1/26)) {
                this.velocityY = Math.random() < 0.5 ? 1 : -1;
            }
        } else if (nextX >= this.displayWidth) {
            nextX = this.displayWidth - 1; // Place ball on the boundary
            this.velocityX *= -1; // Reverse horizontal direction
            // Chance to change vertical velocity
            if (Math.random() < (1/26)) {
                this.velocityY = Math.random() < 0.5 ? 1 : -1;
            }
        }

        // Vertical bounce
        if (nextY < 0) {
            nextY = 0; // Place ball on the boundary
            this.velocityY *= -1; // Reverse vertical direction
            // Chance to change horizontal velocity
            if (Math.random() < (1/26)) {
                this.velocityX = Math.random() < 0.5 ? 1 : -1;
            }
        } else if (nextY >= this.displayHeight) {
            nextY = this.displayHeight - 1; // Place ball on the boundary
            this.velocityY *= -1; // Reverse vertical direction
            // Chance to change horizontal velocity
            if (Math.random() < (1/26)) {
                this.velocityX = Math.random() < 0.5 ? 1 : -1;
            }
        }

        // Update ball position
        this.ballX = nextX;
        this.ballY = nextY;

        // 4. Draw ball at new position
        await this.renderer.setPixel(this.ballX, this.ballY, true);

        // 5. Render the display
        await this.renderer.render();
    }
}

class FallingPixelsToy implements SandboxToy {
    renderer: DisplayRenderer = new DisplayRendererImpl();
    id: string = "falling-pixels";
    name: string = "Falling Pixels";
    updateDelay: number = 100;

    private isRunning: boolean = false;
    private grid: boolean[][] = []; // Internal representation of the pixels
    private width: number = 0;
    private height: number = 0;

    // Configuration for the simulation
    private spawnProbability: number = 0.2;

    async onStart(): Promise<void> {
        this.isRunning = true;
        this.width = await this.renderer.getWidth();
        this.height = await this.renderer.getHeight();

        // Initialize internal grid
        this.grid = Array(this.height).fill(null).map(() => Array(this.width).fill(false));

        await this.renderer.clear();
        await this.renderer.render();
    }

    async onStop(): Promise<void> {
        this.isRunning = false;
    }

    async onUpdate(): Promise<void> {
        if (!this.isRunning) return;

        // 0. Check if all pixels are filled
        var isAllFilled = true;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.grid[y][x]) {
                    isAllFilled = false;
                }
            }
        }

        if(isAllFilled) {
            this.grid = Array(this.height).fill(null).map(() => Array(this.width).fill(false));
            await this.renderer.clear();
            await this.renderer.render();
        }

        const nextGrid = Array(this.height).fill(null).map(() => Array(this.width).fill(false));

        // 1. Simulate gravity and collisions
        // Iterate from bottom-up to correctly handle pixels stacking
        for (let y = this.height - 1; y >= 0; y--) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x]) { // If there's a pixel here
                    if (y + 1 < this.height && !this.grid[y + 1][x]) {
                        // Space below is empty and within bounds, so it falls
                        nextGrid[y + 1][x] = true;
                    } else {
                        // It's at the bottom or blocked by another pixel, so it stays
                        nextGrid[y][x] = true;
                    }
                }

                if(!this.isRunning) return;
            }
        }

        // Update the internal grid with the result of falling/staying pixels
        this.grid = nextGrid;

        // 2. Spawn new pixels at the top row
        for (let x = 0; x < this.width; x++) {
            // Only spawn if the top cell is currently empty *after* potential falls from above (which is impossible for row 0)
            // and based on probability
            if (!this.grid[0][x] && Math.random() < this.spawnProbability) {
                this.grid[0][x] = true;
            }

            if(!this.isRunning) return;
        }

        // 3. Update the display renderer
        // It's more efficient to set all pixels and then render once.
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                await this.renderer.setPixel(x, y, this.grid[y][x]);
                if(!this.isRunning) return;
            }
        }
        await this.renderer.render();
    }
}

const toys: SandboxToy[] = [
    new FillAndClearToy(),
    new BouncingBallToy(),
    new FallingPixelsToy()
];

let activeToy: SandboxToy | null = null;
export let toyUpdateInterval: NodeJS.Timeout | null = null;

export async function getToys(): Promise<SandboxToyMeta[]> {
    return toys;
}

export async function startToy(id: string): Promise<void> {
    // Stop any currently active toy before starting a new one
    if (activeToy && activeToy.id !== id) {
        await stopToy();
    } else if (activeToy && activeToy.id === id) {
        // If the same toy is asked to start again, effectively restart it
        await stopToy();
    }

    const toyToStart = toys.find(t => t.id === id);
    if (toyToStart) {
        activeToy = toyToStart; // Set activeToy immediately
        console.log(`Starting toy: ${toyToStart.name} (ID: ${toyToStart.id})`);
        await toyToStart.onStart();

        // Perform the first update immediately
        if (activeToy === toyToStart) { // Check if still the active toy
            try {
                console.log(`Performing initial update for toy: ${toyToStart.name}`);
                await toyToStart.onUpdate();
                console.log(`Initial update completed for toy: ${toyToStart.name}`);
            } catch (error) {
                console.error(`Error during initial onUpdate for toy ${toyToStart.id}:`, error);
                if (activeToy === toyToStart) { // If it failed, stop it
                    await stopToy();
                }
                return; // Do not proceed to schedule further updates if initial one failed
            }
        }

        // Schedule subsequent updates using a recursive setTimeout
        const loop = async () => {
            if (activeToy !== toyToStart) { // If toy was stopped or another one started
                console.log(`Loop for toy ${toyToStart.id} stopping as it's no longer active.`);
                return;
            }

            try {
                await toyToStart.onUpdate();
                console.log(`Update completed for toy: ${toyToStart.name}`);
            } catch (error) {
                console.error(`Error during onUpdate for toy ${toyToStart.id}:`, error);
                // Depending on desired behavior, you might want to stop the toy here
                // or let it try again on the next cycle.
            }

            if (activeToy === toyToStart) { // Check again before scheduling next update
                toyUpdateInterval = setTimeout(loop, toyToStart.updateDelay);
            }
        };

        if (activeToy === toyToStart) { // Ensure toy is still active before scheduling the first timeout in the loop
            toyUpdateInterval = setTimeout(loop, toyToStart.updateDelay);
        }
    }
}

export async function stopToy(): Promise<void> {
    const toyToStop = activeToy;
    if (toyToStop) {
        console.log(`Stopping toy: ${toyToStop.name} (ID: ${toyToStop.id})`);
        const currentIntervalId = toyUpdateInterval;
        activeToy = null; // Important to set this before await onStop and clear timeout

        if (currentIntervalId) {
            clearTimeout(currentIntervalId); // Use clearTimeout
            toyUpdateInterval = null;
        }
        await toyToStop.onStop();
        console.log(`Toy ${toyToStop.id} stopped.`);
    }
}