/**
 * Coroutine scheduler for game logic.
 * Provides generator-based async operations that integrate with the game loop.
 */

import { Time } from './Time';

/** Coroutine handle for controlling execution */
export interface CoroutineHandle {
  id: number;
  cancel: () => void;
  readonly isRunning: boolean;
}

/** Yield instruction types */
export type YieldInstruction =
  | { type: 'frames'; count: number }
  | { type: 'seconds'; duration: number }
  | { type: 'until'; predicate: () => boolean }
  | { type: 'coroutine'; generator: Generator<YieldInstruction, void, void> };

/** Wait for a number of frames */
export function waitFrames(count: number): YieldInstruction {
  return { type: 'frames', count };
}

/** Wait for a duration in seconds (respects Time.timeScale) */
export function wait(seconds: number): YieldInstruction {
  return { type: 'seconds', duration: seconds };
}

/** Wait until a condition is true */
export function waitUntil(predicate: () => boolean): YieldInstruction {
  return { type: 'until', predicate };
}

/** Wait for another coroutine to complete */
export function waitForCoroutine(
  generator: Generator<YieldInstruction, void, void>
): YieldInstruction {
  return { type: 'coroutine', generator };
}

interface RunningCoroutine {
  id: number;
  generator: Generator<YieldInstruction, void, void>;
  waitingFor: YieldInstruction | null;
  remainingFrames: number;
  remainingTime: number;
  nestedCoroutine: RunningCoroutine | null;
  cancelled: boolean;
}

let nextCoroutineId = 0;

export class Scheduler {
  private coroutines: RunningCoroutine[] = [];

  /** Start a new coroutine */
  start(generator: Generator<YieldInstruction, void, void>): CoroutineHandle {
    const id = nextCoroutineId++;
    const coroutine: RunningCoroutine = {
      id,
      generator,
      waitingFor: null,
      remainingFrames: 0,
      remainingTime: 0,
      nestedCoroutine: null,
      cancelled: false,
    };

    this.coroutines.push(coroutine);
    this.advanceCoroutine(coroutine);

    return {
      id,
      cancel: () => this.cancel(id),
      get isRunning() {
        return !coroutine.cancelled;
      },
    };
  }

  /** Cancel a running coroutine */
  cancel(id: number): void {
    const coroutine = this.coroutines.find((c) => c.id === id);
    if (coroutine) {
      coroutine.cancelled = true;
    }
  }

  /** Cancel all coroutines */
  cancelAll(): void {
    for (const coroutine of this.coroutines) {
      coroutine.cancelled = true;
    }
    this.coroutines = [];
  }

  /** Update all coroutines (called each frame) */
  update(): void {
    const dt = Time.deltaTime;

    // Process coroutines, removing completed/cancelled ones
    this.coroutines = this.coroutines.filter((coroutine) => {
      if (coroutine.cancelled) return false;

      // Check if waiting condition is met
      if (coroutine.waitingFor) {
        switch (coroutine.waitingFor.type) {
          case 'frames':
            coroutine.remainingFrames--;
            if (coroutine.remainingFrames > 0) return true;
            break;

          case 'seconds':
            coroutine.remainingTime -= dt;
            if (coroutine.remainingTime > 0) return true;
            break;

          case 'until':
            if (!coroutine.waitingFor.predicate()) return true;
            break;

          case 'coroutine':
            if (coroutine.nestedCoroutine && !coroutine.nestedCoroutine.cancelled) {
              // Still waiting for nested coroutine
              return true;
            }
            break;
        }
      }

      // Advance to next yield
      return this.advanceCoroutine(coroutine);
    });
  }

  /** Advance a coroutine to its next yield point */
  private advanceCoroutine(coroutine: RunningCoroutine): boolean {
    try {
      const result = coroutine.generator.next();

      if (result.done) {
        return false; // Coroutine completed
      }

      const instruction = result.value;
      coroutine.waitingFor = instruction;

      switch (instruction.type) {
        case 'frames':
          coroutine.remainingFrames = instruction.count;
          break;

        case 'seconds':
          coroutine.remainingTime = instruction.duration;
          break;

        case 'until':
          // Will check predicate next frame
          break;

        case 'coroutine':
          // Start nested coroutine
          const nested: RunningCoroutine = {
            id: nextCoroutineId++,
            generator: instruction.generator,
            waitingFor: null,
            remainingFrames: 0,
            remainingTime: 0,
            nestedCoroutine: null,
            cancelled: false,
          };
          coroutine.nestedCoroutine = nested;
          this.coroutines.push(nested);
          this.advanceCoroutine(nested);
          break;
      }

      return true; // Coroutine still running
    } catch (error) {
      console.error('Coroutine error:', error);
      return false; // Remove on error
    }
  }

  /** Get number of running coroutines */
  get count(): number {
    return this.coroutines.length;
  }
}

/** Global scheduler instance */
export const GlobalScheduler = new Scheduler();
