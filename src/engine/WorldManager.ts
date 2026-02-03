/**
 * WorldManager - The main game loop controller.
 * Manages the fixed timestep loop, scenes, and overall game state.
 */

import { Time } from './Time';
import { GlobalScheduler } from './Scheduler';
import { GlobalEvents, EngineEvents } from './EventSystem';
import type { GameObject } from './GameObject';

export interface WorldConfig {
  /** Target frame rate (default: 60) */
  targetFps?: number;
  /** Maximum delta time to prevent spiral of death (default: 0.25) */
  maxDeltaTime?: number;
  /** Fixed timestep for physics (default: 1/60) */
  fixedTimestep?: number;
}

export class WorldManager {
  /** All root GameObjects in the current scene */
  private gameObjects: GameObject[] = [];

  /** GameObjects pending destruction */
  private pendingDestroy: GameObject[] = [];

  /** GameObjects pending addition */
  private pendingAdd: GameObject[] = [];

  /** Is the game running? */
  private running: boolean = false;

  /** Is the game paused? */
  private paused: boolean = false;

  /** Animation frame ID */
  private frameId: number | null = null;

  /** Last frame timestamp */
  private lastTime: number = 0;

  /** Physics accumulator */
  private accumulator: number = 0;

  /** Configuration */
  private config: Required<WorldConfig>;

  constructor(config: WorldConfig = {}) {
    this.config = {
      targetFps: config.targetFps ?? 60,
      maxDeltaTime: config.maxDeltaTime ?? 0.25,
      fixedTimestep: config.fixedTimestep ?? 1 / 60,
    };
  }

  /** Start the game loop */
  start(): void {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();
    Time.reset();

    this.loop(this.lastTime);
  }

  /** Stop the game loop */
  stop(): void {
    this.running = false;
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  /** Pause the game */
  pause(): void {
    if (this.paused) return;
    this.paused = true;
    GlobalEvents.emit(EngineEvents.PAUSE);
  }

  /** Resume the game */
  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.lastTime = performance.now();
    GlobalEvents.emit(EngineEvents.RESUME);
  }

  /** Is the game paused? */
  get isPaused(): boolean {
    return this.paused;
  }

  /** Is the game running? */
  get isRunning(): boolean {
    return this.running;
  }

  /** Add a GameObject to the world */
  add(gameObject: GameObject): void {
    this.pendingAdd.push(gameObject);
  }

  /** Remove a GameObject from the world */
  remove(gameObject: GameObject): void {
    this.pendingDestroy.push(gameObject);
  }

  /** Get all root GameObjects */
  getGameObjects(): readonly GameObject[] {
    return this.gameObjects;
  }

  /** Find a GameObject by name */
  findByName(name: string): GameObject | undefined {
    for (const go of this.gameObjects) {
      if (go.name === name) return go;
      const child = go.findChildRecursive(name);
      if (child) return child;
    }
    return undefined;
  }

  /** Find all GameObjects with a tag */
  findByTag(tag: string): GameObject[] {
    const results: GameObject[] = [];
    const search = (gameObjects: readonly GameObject[]) => {
      for (const go of gameObjects) {
        if (go.tag === tag) results.push(go);
        search(go.getChildren());
      }
    };
    search(this.gameObjects);
    return results;
  }

  /** Find a GameObject by ID */
  findById(id: string): GameObject | undefined {
    const search = (gameObjects: readonly GameObject[]): GameObject | undefined => {
      for (const go of gameObjects) {
        if (go.id === id) return go;
        const child = search(go.getChildren());
        if (child) return child;
      }
      return undefined;
    };
    return search(this.gameObjects);
  }

  /** Clear all GameObjects */
  clear(): void {
    for (const go of this.gameObjects) {
      go.destroy();
    }
    this.gameObjects = [];
    this.pendingAdd = [];
    this.pendingDestroy = [];
  }

  /** Main game loop */
  private loop = (currentTime: number): void => {
    if (!this.running) return;

    this.frameId = requestAnimationFrame(this.loop);

    // Calculate delta time
    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Clamp delta time to prevent spiral of death
    if (dt > this.config.maxDeltaTime) {
      dt = this.config.maxDeltaTime;
    }

    // Update time
    Time.update(dt);

    if (this.paused) return;

    // Process pending additions
    this.processPendingAdd();

    // Fixed timestep physics updates
    this.accumulator += dt;
    while (this.accumulator >= this.config.fixedTimestep) {
      this.fixedUpdate();
      this.accumulator -= this.config.fixedTimestep;
    }

    // Variable timestep updates
    this.update();
    this.lateUpdate();

    // Update global scheduler
    GlobalScheduler.update();

    // Process pending destructions
    this.processPendingDestroy();
  };

  /** Process pending GameObject additions */
  private processPendingAdd(): void {
    if (this.pendingAdd.length === 0) return;

    for (const go of this.pendingAdd) {
      this.gameObjects.push(go);
      go.awake();
    }

    // Start after all awakes
    for (const go of this.pendingAdd) {
      go.start();
    }

    this.pendingAdd = [];
  }

  /** Process pending GameObject destructions */
  private processPendingDestroy(): void {
    if (this.pendingDestroy.length === 0) return;

    for (const go of this.pendingDestroy) {
      const index = this.gameObjects.indexOf(go);
      if (index !== -1) {
        this.gameObjects.splice(index, 1);
      }
      go.destroy();
    }

    this.pendingDestroy = [];
  }

  /** Fixed update all GameObjects */
  private fixedUpdate(): void {
    for (const go of this.gameObjects) {
      go.fixedUpdate();
    }
  }

  /** Update all GameObjects */
  private update(): void {
    for (const go of this.gameObjects) {
      go.update();
    }
  }

  /** Late update all GameObjects */
  private lateUpdate(): void {
    for (const go of this.gameObjects) {
      go.lateUpdate();
    }
  }
}

/** Global world manager instance */
export const World = new WorldManager();
