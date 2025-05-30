import { NextResponse } from 'next/server';
import * as serverState from '@/app/lib/serverState';
import {startToy, stopToy} from "@/app/lib/toysService";

export async function POST() {
    await stopToy();
    return NextResponse.json({ success: true, message: 'OK' });
}