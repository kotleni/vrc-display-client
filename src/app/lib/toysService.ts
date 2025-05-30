import {GRID_SIZE} from "@/app/lib/font";
import {
    DisplayRenderer,
    globalRenderer,
    resetAllPixelsInGame,
    updatePixelGrid,
    updatePixelGridInGame
} from "@/app/lib/serverState";
import { clearTimeout } from "timers";

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

class FillAndClearToy implements SandboxToy {
    renderer: DisplayRenderer = globalRenderer;

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
    renderer: DisplayRenderer = globalRenderer;

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
    renderer: DisplayRenderer = globalRenderer;
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

class FoodChasingSnakeToy implements SandboxToy {
    renderer: DisplayRenderer = globalRenderer;

    id: string = "food-chasing-snake";
    name: string = "Snake Chases Food";
    updateDelay: number = 180; // Milliseconds, adjust for snake speed

    private isRunning: boolean = false;
    private readonly displayWidth: number = 15;
    private readonly displayHeight: number = 15;

    private snakeBody: Array<[number, number]> = [];
    private readonly initialLength: number = 3;
    private snakeGrowthPending: number = 0;

    private foodX: number = -1;
    private foodY: number = -1;
    private foodVisible: boolean = true;
    private foodBlinkToggleCounter: number = 0;
    private readonly FOOD_BLINK_FRAMES: number = 3; // Food blinks every N frames (N on, N off approx)

    private readonly dirDeltas = [
        { dx: 0, dy: -1, name: "UP" },    // 0: UP
        { dx: 1, dy: 0,  name: "RIGHT" }, // 1: RIGHT
        { dx: 0, dy: 1,  name: "DOWN" },  // 2: DOWN
        { dx: -1, dy: 0, name: "LEFT" }   // 3: LEFT
    ];
    private currentDirectionIndex: number = 1; // Start going RIGHT

    private async spawnFood(): Promise<void> {
        let newFoodX: number, newFoodY: number;
        let attempts = 0;
        const maxAttempts = this.displayWidth * this.displayHeight;

        do {
            newFoodX = Math.floor(Math.random() * this.displayWidth);
            newFoodY = Math.floor(Math.random() * this.displayHeight);
            attempts++;
            if (attempts > maxAttempts && this.snakeBody.length < maxAttempts) { // Avoid infinite loop if screen is almost full
                console.warn("Could not find empty spot for food easily.");
                // Fallback: just pick a random spot, might overlap if unlucky
                break;
            }
        } while (this.snakeBody.some(seg => seg[0] === newFoodX && seg[1] === newFoodY) && attempts <= maxAttempts);

        // If old food existed and was visible, turn it off before moving
        if (this.foodX !== -1 && this.foodY !== -1 && this.foodVisible) {
            await this.renderer.setPixel(this.foodX, this.foodY, false);
        }

        this.foodX = newFoodX;
        this.foodY = newFoodY;
        this.foodVisible = true;
        this.foodBlinkToggleCounter = this.FOOD_BLINK_FRAMES;
        if (this.foodX !== -1 && this.foodY !== -1) { // Ensure valid coordinates
            await this.renderer.setPixel(this.foodX, this.foodY, this.foodVisible);
        }
    }

    async onStart(): Promise<void> {
        this.isRunning = true;
        this.snakeGrowthPending = 0;
        await this.renderer.clear();

        this.snakeBody = [];
        this.currentDirectionIndex = 1; // Start Right

        const startX = Math.floor(this.displayWidth / 3); // Start a bit off-center
        const startY = Math.floor(this.displayHeight / 2);

        for (let i = 0; i < this.initialLength; i++) {
            this.snakeBody.push([startX - (this.initialLength - 1 - i), startY]);
        }

        for (const segment of this.snakeBody) {
            await this.renderer.setPixel(segment[0], segment[1], true);
        }

        await this.spawnFood();
        await this.renderer.render();
    }

    async onStop(): Promise<void> {
        this.isRunning = false;
    }

    private chooseDirection(): void {
        if (this.foodX === -1 || this.snakeBody.length === 0) return; // No food or no snake

        const head = this.snakeBody[this.snakeBody.length - 1];

        const potentialDirections = [
            this.currentDirectionIndex, // Straight
            (this.currentDirectionIndex + 1 + 4) % 4, // Turn Right
            (this.currentDirectionIndex - 1 + 4) % 4  // Turn Left
        ];

        let bestDirection = this.currentDirectionIndex;
        let minDistance = Infinity;

        for (const dirIndex of potentialDirections) {
            const delta = this.dirDeltas[dirIndex];
            const nextHeadX = (head[0] + delta.dx + this.displayWidth) % this.displayWidth;
            const nextHeadY = (head[1] + delta.dy + this.displayHeight) % this.displayHeight;

            // Simple distance: Manhattan distance
            const distance = Math.abs(nextHeadX - this.foodX) + Math.abs(nextHeadY - this.foodY);

            if (distance < minDistance) {
                minDistance = distance;
                bestDirection = dirIndex;
            }
            // Basic tie-breaking: prefer straight, then right turn, then left turn
            else if (distance === minDistance) {
                if (dirIndex === this.currentDirectionIndex) { // Prefer going straight
                    bestDirection = dirIndex;
                } else if (bestDirection !== this.currentDirectionIndex && dirIndex === (this.currentDirectionIndex + 1 + 4) % 4) {
                    // If current best is not straight, prefer right turn over left
                    bestDirection = dirIndex;
                }
            }
        }
        this.currentDirectionIndex = bestDirection;
    }

    private async handleFoodBlinking(): Promise<void> {
        if (this.foodX === -1 || !this.renderer.setPixel) return;

        this.foodBlinkToggleCounter--;
        if (this.foodBlinkToggleCounter <= 0) {
            this.foodVisible = !this.foodVisible;
            this.foodBlinkToggleCounter = this.FOOD_BLINK_FRAMES;
            // Only update if food hasn't been "eaten" in the same frame by snake moving onto it
            // The snake drawing logic will handle drawing food if it's visible and snake head is not on it
            // And if snake head *is* on it, it's "eaten".
            // This ensures the food pixel reflects its current blink state IF it's not where the snake head just moved.
            const head = this.snakeBody[this.snakeBody.length - 1];
            if (!(head[0] === this.foodX && head[1] === this.foodY)) {
                await this.renderer.setPixel(this.foodX, this.foodY, this.foodVisible);
            }
        }
    }

    async onUpdate(): Promise<void> {
        if (!this.isRunning || !this.renderer.setPixel || this.snakeBody.length === 0) {
            return;
        }

        await this.handleFoodBlinking();
        this.chooseDirection();

        const head = this.snakeBody[this.snakeBody.length - 1];
        const delta = this.dirDeltas[this.currentDirectionIndex];

        let newHeadX = (head[0] + delta.dx + this.displayWidth) % this.displayWidth;
        let newHeadY = (head[1] + delta.dy + this.displayHeight) % this.displayHeight;

        // Check for self-collision
        for (let i = 0; i < this.snakeBody.length -1; i++) { // Don't check against current head's old position before move
            const segment = this.snakeBody[i];
            if (segment[0] === newHeadX && segment[1] === newHeadY) {
                // Self-collision! Reset the game.
                await this.onStart();
                return; // Exit current onUpdate
            }
        }

        // Check for food collision
        let ateFood = false;
        if (newHeadX === this.foodX && newHeadY === this.foodY) {
            ateFood = true;
            this.snakeGrowthPending += 1; // Grow by 1 segment
            // Turn off current food pixel explicitly because spawnFood might take time
            // or the blinking logic might turn it back on before render if unlucky timing.
            if (this.foodX !== -1 && this.foodY !== -1) {
                await this.renderer.setPixel(this.foodX, this.foodY, false);
            }
            await this.spawnFood(); // New food will be drawn by spawnFood
        }

        // Add new head
        this.snakeBody.push([newHeadX, newHeadY]);
        await this.renderer.setPixel(newHeadX, newHeadY, true);

        // Handle tail / growth
        if (this.snakeGrowthPending > 0) {
            this.snakeGrowthPending--;
        } else {
            const removedTail = this.snakeBody.shift();
            if (removedTail) {
                // Ensure the removed tail pixel is actually turned off,
                // unless the new head (or food) is now there.
                // This check is mostly redundant if self-collision reset works,
                // but good for safety.
                let stillOccupied = false;
                if (newHeadX === removedTail[0] && newHeadY === removedTail[1]) stillOccupied = true;
                if (this.foodX === removedTail[0] && this.foodY === removedTail[1] && this.foodVisible) stillOccupied = true;

                if (!stillOccupied) {
                    await this.renderer.setPixel(removedTail[0], removedTail[1], false);
                }
            }
        }

        // Ensure food is correctly visible if not eaten and not under the head
        // (This is a bit of a catch-all for blinking edge cases with movement)
        if (!ateFood && this.foodX !== -1 && this.foodY !== -1 &&
            !(newHeadX === this.foodX && newHeadY === this.foodY)) {
            await this.renderer.setPixel(this.foodX, this.foodY, this.foodVisible);
        }


        await this.renderer.render();
    }
}

const toys: SandboxToy[] = [
    new FillAndClearToy(),
    new BouncingBallToy(),
    new FallingPixelsToy(),
    new FoodChasingSnakeToy(),
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