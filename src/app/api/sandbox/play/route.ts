import { NextResponse } from 'next/server';
import * as serverState from '@/app/lib/serverState';
import {startToy} from "@/app/lib/toysService";

export async function POST(request: Request) {
    const { id } = await request.json();
    await startToy(id);
    return NextResponse.json({ success: true, message: 'OK' });
}