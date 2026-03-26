type EventMap = Record<string, unknown[]>;
type EventCallback<T extends unknown[] = unknown[]> = (...args: T) => void;
export declare class EventEmitter<Events extends EventMap = EventMap> {
    private listeners;
    on<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void;
    off<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void;
    emit<K extends keyof Events>(event: K, ...args: Events[K]): void;
    once<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void;
    removeAllListeners(event?: keyof Events): void;
    listenerCount(event: keyof Events): number;
}
export {};
//# sourceMappingURL=EventEmitter.d.ts.map