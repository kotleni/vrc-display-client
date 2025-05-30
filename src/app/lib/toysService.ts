import {GRID_SIZE} from "@/app/lib/font";
import {updatePixelGrid, updatePixelGridInGame} from "@/app/lib/serverState";
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
        for(let y = 0; y < await this.getHeight(); y++) {
            for(let x = 0; x < await this.getWidth(); x++) {
                await this.setPixel(x, y, false);
            }
        }
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

const toys: SandboxToy[] = [
    new FillAndClearToy()
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