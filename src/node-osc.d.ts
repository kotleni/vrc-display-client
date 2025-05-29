// src/node-osc.d.ts
declare module 'node-osc' {
    export class Message {
        constructor(address: string, ...args: any[]);
        address: string;
        args: any[];
    }

    export class Client {
        constructor(host: string, port: number);
        send(address: string, callback?: (err?: Error) => void): void;
        send(address: string, arg1: any, callback?: (err?: Error) => void): void;
        // ... more overloads as needed ...
        send(address: string, ...args: any[]): void;
        send(message: Message, callback?: (err?: Error) => void): void;
        send(message: Message): void;
        close(callback?: () => void): void;
    }
    // ... Server class if you use it ...
}