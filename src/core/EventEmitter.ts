type EventMap = Record<string, unknown[]>;
type EventCallback<T extends unknown[] = unknown[]> = (...args: T) => void;

export class EventEmitter<Events extends EventMap = EventMap> {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void {
    const key = event as string;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback as EventCallback);
  }

  off<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void {
    const callbacks = this.listeners.get(event as string);
    if (callbacks) {
      callbacks.delete(callback as EventCallback);
    }
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
    const callbacks = this.listeners.get(event as string);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event handler for "${String(event)}":`, error);
        }
      });
    }
  }

  once<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void {
    const onceCallback: EventCallback<Events[K]> = (...args) => {
      this.off(event, onceCallback);
      callback(...args);
    };
    this.on(event, onceCallback);
  }

  removeAllListeners(event?: keyof Events): void {
    if (event) {
      this.listeners.delete(event as string);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount(event: keyof Events): number {
    return this.listeners.get(event as string)?.size ?? 0;
  }
}
