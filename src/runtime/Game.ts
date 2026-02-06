/**
 * Game - Central runtime class for Bonk Engine.
 * Owns the renderer, physics world, and game loop.
 */

import { PixiRenderer } from '../render/PixiRenderer';
import type { Renderer, RendererConfig } from '../render/Renderer';
import {
  createPhysicsWorld,
  type PhysicsWorld,
  type CollisionEvent,
} from '../physics/PhysicsWorld';
import '../physics/MatterPhysicsWorld'; // Auto-register matter backend
import { Time } from './Time';
import { GlobalScheduler } from './Scheduler';
import { Input } from '../input/Input';
import { GlobalEvents, EngineEvents } from './EventSystem';
import { RigidBody, type RigidBodyConfig as RBConfig } from '../physics/RigidBody';
import { Transform } from './Transform';
import type { Vector2 } from '../types';

/** Game configuration */
export interface GameConfig {
  physics?: {
    gravity?: Vector2;
    enabled?: boolean;
  };
}

type UpdateCallback = () => void;

export class Game {
  readonly renderer: Renderer;
  readonly physics: PhysicsWorld | null;

  private fixedUpdateCallbacks: UpdateCallback[] = [];
  private updateCallbacks: UpdateCallback[] = [];
  private lateUpdateCallbacks: UpdateCallback[] = [];

  private running = false;
  private paused = false;
  private animFrameId: number | null = null;
  private lastTime = 0;
  private fixedAccumulator = 0;
  private readonly maxDeltaTime = 0.25;

  /** Body ID → RigidBody for collision routing */
  private registeredBodies = new Map<string, RigidBody>();
  private physicsCleanup: (() => void)[] = [];

  constructor(config?: GameConfig) {
    this.renderer = new PixiRenderer();

    const physicsEnabled = config?.physics?.enabled !== false;
    if (physicsEnabled) {
      this.physics = createPhysicsWorld('matter', {
        gravity: config?.physics?.gravity ?? [0, 980],
      });
      this.setupCollisionRouting();
    } else {
      this.physics = null;
    }
  }

  /** Initialize the renderer and input system. Returns the canvas. */
  async init(config?: Partial<RendererConfig>): Promise<HTMLCanvasElement> {
    const canvas = await this.renderer.init({
      width: config?.width ?? 800,
      height: config?.height ?? 600,
      backgroundColor: config?.backgroundColor,
      antialias: config?.antialias ?? true,
      resolution: config?.resolution,
    });

    Input.initialize(canvas);
    return canvas;
  }

  /** Register a callback for fixed-timestep updates (physics). */
  onFixedUpdate(cb: UpdateCallback): () => void {
    this.fixedUpdateCallbacks.push(cb);
    return () => {
      const i = this.fixedUpdateCallbacks.indexOf(cb);
      if (i !== -1) this.fixedUpdateCallbacks.splice(i, 1);
    };
  }

  /** Register a callback for per-frame updates. */
  onUpdate(cb: UpdateCallback): () => void {
    this.updateCallbacks.push(cb);
    return () => {
      const i = this.updateCallbacks.indexOf(cb);
      if (i !== -1) this.updateCallbacks.splice(i, 1);
    };
  }

  /** Register a callback for late updates (after main update). */
  onLateUpdate(cb: UpdateCallback): () => void {
    this.lateUpdateCallbacks.push(cb);
    return () => {
      const i = this.lateUpdateCallbacks.indexOf(cb);
      if (i !== -1) this.lateUpdateCallbacks.splice(i, 1);
    };
  }

  /** Register a RigidBody for collision routing. */
  registerBody(rb: RigidBody): void {
    if (rb.body) {
      this.registeredBodies.set(rb.body.id, rb);
    }
  }

  /** Unregister a RigidBody from collision routing. */
  unregisterBody(rb: RigidBody): void {
    if (rb.body) {
      this.registeredBodies.delete(rb.body.id);
    }
  }

  /** Convenience: create a RigidBody and auto-register it. */
  createBody(transform: Transform, config: RBConfig): RigidBody {
    if (!this.physics) {
      throw new Error('Physics is not enabled for this Game instance');
    }
    const rb = new RigidBody(this.physics, transform, config);
    this.registerBody(rb);
    return rb;
  }

  /** Start the game loop. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.fixedAccumulator = 0;
    this.loop();
  }

  /** Stop the game loop. */
  stop(): void {
    this.running = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /** Pause the game (loop continues but updates are skipped). */
  pause(): void {
    if (!this.paused) {
      this.paused = true;
      GlobalEvents.emit(EngineEvents.PAUSE);
    }
  }

  /** Resume a paused game. */
  resume(): void {
    if (this.paused) {
      this.paused = false;
      this.lastTime = performance.now();
      GlobalEvents.emit(EngineEvents.RESUME);
    }
  }

  /** Clean up all resources. */
  destroy(): void {
    this.stop();
    for (const cleanup of this.physicsCleanup) cleanup();
    this.physicsCleanup = [];
    this.registeredBodies.clear();
    this.physics?.destroy();
    Input.destroy();
    this.renderer.destroy();
  }

  private loop = (): void => {
    if (!this.running) return;

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Clamp to prevent spiral of death
    if (dt > this.maxDeltaTime) dt = this.maxDeltaTime;

    if (!this.paused) {
      Time.update(dt);

      // Fixed timestep loop
      this.fixedAccumulator += dt;
      while (this.fixedAccumulator >= Time.fixedDeltaTime) {
        this.fixedAccumulator -= Time.fixedDeltaTime;

        if (this.physics) {
          this.physics.step(Time.fixedDeltaTime);
        }

        for (const cb of this.fixedUpdateCallbacks) cb();
      }

      // Variable timestep update
      for (const cb of this.updateCallbacks) cb();

      // Late update
      for (const cb of this.lateUpdateCallbacks) cb();

      // Coroutines
      GlobalScheduler.update();

      // Clear per-frame input state
      Input.update();
    }

    // Always render (even when paused, for UI)
    this.renderer.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private setupCollisionRouting(): void {
    if (!this.physics) return;

    this.physicsCleanup.push(
      this.physics.onCollisionStart((event) => {
        this.routeCollision(event, 'enter');
      })
    );

    this.physicsCleanup.push(
      this.physics.onCollisionEnd((event) => {
        this.routeCollision(event, 'exit');
      })
    );
  }

  private routeCollision(event: CollisionEvent, type: 'enter' | 'exit'): void {
    const rbA = this.registeredBodies.get(event.bodyA.id);
    const rbB = this.registeredBodies.get(event.bodyB.id);

    if (!rbA || !rbB) return;

    if (event.isSensor) {
      if (type === 'enter') {
        rbA._fireTriggerEnter(rbB);
        rbB._fireTriggerEnter(rbA);
      } else {
        rbA._fireTriggerExit(rbB);
        rbB._fireTriggerExit(rbA);
      }
    } else {
      const contact = event.contacts[0] ?? { point: [0, 0] as Vector2, normal: [0, 0] as Vector2 };

      if (type === 'enter') {
        rbA._fireCollisionEnter(rbB, contact);
        rbB._fireCollisionEnter(rbA, {
          point: contact.point,
          normal: [-contact.normal[0], -contact.normal[1]] as Vector2,
        });
      } else {
        rbA._fireCollisionExit(rbB);
        rbB._fireCollisionExit(rbA);
      }
    }
  }
}
