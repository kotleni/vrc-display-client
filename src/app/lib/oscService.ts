import { Client as OscClient } from 'node-osc';
import * as serverState from './serverState'; // Import the mutable state
import { GRID_SIZE } from './font';

const VRC_IP = process.env.VRC_OSC_IP || '127.0.0.1';
const VRC_OSC_PORT = parseInt(process.env.VRC_OSC_PORT || '9000', 10);

const oscClient = new OscClient(VRC_IP, VRC_OSC_PORT);
console.log(`OSC client initialized, targeting ${VRC_IP}:${VRC_OSC_PORT}`);

export function sendPixelDataToVRChat(gridData: boolean[][]): void {
    if (!gridData || gridData.length !== GRID_SIZE) return;

    for (let y = 0; y < GRID_SIZE; y++) {
        if (!gridData[y] || gridData[y].length !== GRID_SIZE) continue;
        for (let x = 0; x < GRID_SIZE; x++) {
            const address = `/avatar/parameters/Pixel_${y}_${x}`;
            const value = gridData[y][x];
            try {
                oscClient.send(address, value);
            } catch (e) {
                console.error(`Error sending OSC message for ${address}: ${e}`);
            }
        }
    }
}

// Graceful shutdown for OSC client (optional, as Next.js dev server restarts might not trigger this well)
// process.on('SIGINT', () => {
//     console.log("Closing OSC client due to SIGINT.");
//     // Send a clear signal if desired
//     const clearGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
//     sendPixelDataToVRChat(clearGrid);
//     // oscClient.close(); // node-osc client doesn't have a persistent connection to close for UDP
//     process.exit(0);
// });

// Exporting client directly is usually not needed if sendPixelDataToVRChat is the only interface
// export { oscClient };
