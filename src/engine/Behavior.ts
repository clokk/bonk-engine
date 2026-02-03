/**
 * Base Behavior class for game logic.
 * Behaviors are scripts that control GameObject behavior.
 */

import type { GameObject } from './GameObject';
import type { Component } from './Component';
import type { Transform } from './Transform';
import {
  Scheduler,
  type CoroutineHandle,
  type YieldInstruction,
  wait,
  waitFrames,
  waitUntil,
} from './Scheduler';
import { Time } from './Time';
import { EventEmitter } from './EventSystem';

export abstract class Behavior {
  /** The GameObject this behavior is attached to */
  readonly gameObject: GameObject;

  /** Whether this behavior is enabled */
  enabled: boolean = true;

  /** Local event emitter for this behavior */
  readonly events: EventEmitter = new EventEmitter();

  /** Per-behavior scheduler for coroutines */
  private scheduler: Scheduler = new Scheduler();

  /** Active coroutine handles */
  private coroutines: CoroutineHandle[] = [];

  constructor(gameObject: GameObject) {
    this.gameObject = gameObject;
  }

  /** Quick access to transform */
  get transform(): Transform {
    return this.gameObject.transform;
  }

  // ==================== Lifecycle Hooks ====================

  /**
   * Called once when the behavior is first created.
   * Use for initialization that doesn't depend on other behaviors.
   */
  awake(): void {}

  /**
   * Called once after all behaviors have been created.
   * Use for initialization that depends on other components/behaviors.
   */
  start(): void {}

  /**
   * Called every frame.
   * Use for game logic, input handling, etc.
   */
  update(): void {}

  /**
   * Called at fixed timestep (1/60s).
   * Use for physics-related updates.
   */
  fixedUpdate(): void {}

  /**
   * Called every frame after update().
   * Use for camera follow, UI updates, etc.
   */
  lateUpdate(): void {}

  /**
   * Called when the behavior is destroyed.
   * Use for cleanup.
   */
  onDestroy(): void {}

  // ==================== Coroutines ====================

  /**
   * Start a coroutine.
   * Coroutines run in sync with the game loop and respect Time.timeScale.
   *
   * @example
   * *fadeOut() {
   *   for (let i = 1; i >= 0; i -= 0.1) {
   *     this.sprite.alpha = i;
   *     yield* this.wait(0.1);
   *   }
   * }
   *
   * start() {
   *   this.startCoroutine(this.fadeOut());
   * }
   */
  startCoroutine(
    generator: Generator<YieldInstruction, void, void>
  ): CoroutineHandle {
    const handle = this.scheduler.start(generator);
    this.coroutines.push(handle);
    return handle;
  }

  /** Stop a specific coroutine */
  stopCoroutine(handle: CoroutineHandle): void {
    handle.cancel();
    this.coroutines = this.coroutines.filter((h) => h !== handle);
  }

  /** Stop all coroutines on this behavior */
  stopAllCoroutines(): void {
    this.scheduler.cancelAll();
    this.coroutines = [];
  }

  /** Update coroutines (called by engine) */
  updateCoroutines(): void {
    this.scheduler.update();
    // Clean up completed coroutines
    this.coroutines = this.coroutines.filter((h) => h.isRunning);
  }

  // ==================== Coroutine Helpers ====================

  /** Wait for seconds (respects Time.timeScale) */
  *wait(seconds: number): Generator<YieldInstruction, void, void> {
    yield wait(seconds);
  }

  /** Wait for frames */
  *waitFrames(count: number): Generator<YieldInstruction, void, void> {
    yield waitFrames(count);
  }

  /** Wait until condition is true */
  *waitUntil(
    predicate: () => boolean
  ): Generator<YieldInstruction, void, void> {
    yield waitUntil(predicate);
  }

  // ==================== Utility Methods ====================

  /** Get a component on the same GameObject */
  getComponent<T extends Component>(type: new (go: GameObject) => T): T | undefined {
    return this.gameObject.getComponent(type);
  }

  /** Get a behavior on the same GameObject */
  getBehavior<T extends Behavior>(type: new (go: GameObject) => T): T | undefined {
    return this.gameObject.getBehavior(type);
  }

  /** Find a GameObject by name */
  find(name: string): GameObject | undefined {
    return this.gameObject.scene?.findByName(name);
  }

  /** Find all GameObjects with a tag */
  findWithTag(tag: string): GameObject[] {
    return this.gameObject.scene?.findByTag(tag) ?? [];
  }

  /** Instantiate a prefab */
  async instantiate(
    prefabPath: string,
    position?: [number, number],
    rotation?: number
  ): Promise<GameObject | null> {
    // Defer to scene manager (will be implemented)
    console.warn('instantiate not yet implemented');
    return null;
  }

  /** Destroy a GameObject */
  destroy(target?: GameObject): void {
    const go = target ?? this.gameObject;
    go.scene?.destroy(go);
  }

  /** Schedule destruction after delay */
  destroyAfter(seconds: number, target?: GameObject): void {
    const go = target ?? this.gameObject;
    this.startCoroutine(
      (function* (self: Behavior) {
        yield* self.wait(seconds);
        go.scene?.destroy(go);
      })(this)
    );
  }

  // ==================== Time Helpers ====================

  /** Current delta time */
  get deltaTime(): number {
    return Time.deltaTime;
  }

  /** Fixed delta time */
  get fixedDeltaTime(): number {
    return Time.fixedDeltaTime;
  }

  /** Current time scale */
  get timeScale(): number {
    return Time.timeScale;
  }

  set timeScale(value: number) {
    Time.timeScale = value;
  }

  // ==================== Internal ====================

  /** Clean up when destroyed */
  _destroy(): void {
    this.stopAllCoroutines();
    this.events.removeAllListeners();
    this.onDestroy();
  }
}
