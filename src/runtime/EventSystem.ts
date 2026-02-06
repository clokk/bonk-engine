/**
 * Event system for global and entity-scoped events.
 * Provides pub/sub functionality for game events.
 */

export type EventCallback<T = unknown> = (data: T) => void;

interface EventSubscription {
  callback: EventCallback;
  once: boolean;
}

export class EventEmitter {
  private listeners = new Map<string, EventSubscription[]>();

  /** Subscribe to an event */
  on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const subscription: EventSubscription = {
      callback: callback as EventCallback,
      once: false,
    };
    this.listeners.get(event)!.push(subscription);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /** Subscribe to an event (fires once then unsubscribes) */
  once<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const subscription: EventSubscription = {
      callback: callback as EventCallback,
      once: true,
    };
    this.listeners.get(event)!.push(subscription);

    return () => this.off(event, callback);
  }

  /** Unsubscribe from an event */
  off<T = unknown>(event: string, callback: EventCallback<T>): void {
    const subs = this.listeners.get(event);
    if (!subs) return;

    const index = subs.findIndex((s) => s.callback === callback);
    if (index !== -1) {
      subs.splice(index, 1);
    }
  }

  /** Emit an event */
  emit<T = unknown>(event: string, data?: T): void {
    const subs = this.listeners.get(event);
    if (!subs) return;

    // Copy array to handle removals during iteration
    const toCall = [...subs];
    for (const sub of toCall) {
      sub.callback(data);
      if (sub.once) {
        this.off(event, sub.callback);
      }
    }
  }

  /** Remove all listeners for an event (or all events) */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /** Check if event has listeners */
  hasListeners(event: string): boolean {
    const subs = this.listeners.get(event);
    return subs !== undefined && subs.length > 0;
  }
}

/** Global event bus for game-wide events */
export const GlobalEvents = new EventEmitter();

/** Built-in engine events */
export const EngineEvents = {
  /** Fired when the game is paused */
  PAUSE: 'engine:pause',
  /** Fired when the game is resumed */
  RESUME: 'engine:resume',
  /** Fired on collision enter */
  COLLISION_ENTER: 'engine:collision:enter',
  /** Fired on collision exit */
  COLLISION_EXIT: 'engine:collision:exit',
  /** Fired on trigger enter */
  TRIGGER_ENTER: 'engine:trigger:enter',
  /** Fired on trigger exit */
  TRIGGER_EXIT: 'engine:trigger:exit',
} as const;
