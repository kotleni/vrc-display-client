import { NextResponse } from 'next/server';
import * as serverState from '@/app/lib/serverState'; // Adjust path as necessary

export async function GET() {
    return NextResponse.json({ grid: serverState.pixelGrid });
}

export async function POST(request: Request) {
    try {
        const { newGrid } = await request.json();
        if (newGrid && newGrid.length === serverState.pixelGrid.length && newGrid.every((row: any) => Array.isArray(row) && row.length === serverState.pixelGrid[0].length)) {
            serverState.updatePixelGrid(newGrid);
            return NextResponse.json({ success: true, grid: serverState.pixelGrid });
        } else {
            return NextResponse.json({ success: false, message: 'Invalid grid data' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Error processing request' }, { status: 500 });
    }
}