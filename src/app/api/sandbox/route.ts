import { NextResponse } from 'next/server';
import {getToys} from "@/app/lib/toysService";

export async function GET() {
    try {
        const toysMeta = (await getToys()).map(toy => ({ id: toy.id, name: toy.name }));
        return NextResponse.json({ success: true, toys: toysMeta });
    } catch (error) {
        console.error("API Error listing animations:", error);
        return NextResponse.json({ success: false, message: 'Error listing animations.' }, { status: 500 });
    }
}