/**
 * MatterPhysicsWorld - Matter.js implementation of PhysicsWorld.
 * Default physics backend for Bonk Engine.
 */

import Matter from 'matter-js';
import type {
  PhysicsWorld,
  PhysicsBody,
  RigidBodyConfig,
  ColliderConfig,
  RaycastHit,
  CollisionEvent,
  CollisionCallback,
  PhysicsWorldConfig,
} from './PhysicsWorld';
import { registerPhysicsBackend } from './PhysicsWorld';
import type { Vector2 } from '../types';

/** Matter.js body wrapper */
class MatterBody implements PhysicsBody {
  constructor(
    public readonly matterBody: Matter.Body,
    public readonly type: 'dynamic' | 'static' | 'kinematic'
  ) {}

  get id(): string {
    return String(this.matterBody.id);
  }

  get position(): Vector2 {
    return [this.matterBody.position.x, this.matterBody.position.y];
  }

  set position(value: Vector2) {
    Matter.Body.setPosition(this.matterBody, { x: value[0], y: value[1] });
  }

  get rotation(): number {
    return (this.matterBody.angle * 180) / Math.PI;
  }

  set rotation(value: number) {
    Matter.Body.setAngle(this.matterBody, (value * Math.PI) / 180);
  }

  get velocity(): Vector2 {
    return [this.matterBody.velocity.x, this.matterBody.velocity.y];
  }

  set velocity(value: Vector2) {
    Matter.Body.setVelocity(this.matterBody, { x: value[0], y: value[1] });
  }

  get angularVelocity(): number {
    return (this.matterBody.angularVelocity * 180) / Math.PI;
  }

  set angularVelocity(value: number) {
    Matter.Body.setAngularVelocity(this.matterBody, (value * Math.PI) / 180);
  }

  applyForce(force: Vector2): void {
    Matter.Body.applyForce(this.matterBody, this.matterBody.position, {
      x: force[0],
      y: force[1],
    });
  }

  applyImpulse(impulse: Vector2): void {
    // Matter.js doesn't have a direct impulse method, so we modify velocity
    const mass = this.matterBody.mass;
    Matter.Body.setVelocity(this.matterBody, {
      x: this.matterBody.velocity.x + impulse[0] / mass,
      y: this.matterBody.velocity.y + impulse[1] / mass,
    });
  }

  setVelocity(velocity: Vector2): void {
    Matter.Body.setVelocity(this.matterBody, { x: velocity[0], y: velocity[1] });
  }

  setPosition(position: Vector2): void {
    Matter.Body.setPosition(this.matterBody, { x: position[0], y: position[1] });
  }

  setRotation(rotation: number): void {
    Matter.Body.setAngle(this.matterBody, (rotation * Math.PI) / 180);
  }
}

/** Matter.js physics world implementation */
export class MatterPhysicsWorld implements PhysicsWorld {
  private engine: Matter.Engine;
  private bodies = new Map<number, MatterBody>();
  private collisionStartCallbacks: CollisionCallback[] = [];
  private collisionEndCallbacks: CollisionCallback[] = [];

  constructor(config?: PhysicsWorldConfig) {
    this.engine = Matter.Engine.create();

    // Set gravity
    if (config?.gravity) {
      this.setGravity(config.gravity);
    }

    // Set up collision events
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const bodyA = this.bodies.get(pair.bodyA.id);
        const bodyB = this.bodies.get(pair.bodyB.id);
        if (bodyA && bodyB) {
          const collisionEvent: CollisionEvent = {
            bodyA,
            bodyB,
            contacts: pair.collision.supports.map((point) => ({
              point: [point.x, point.y] as Vector2,
              normal: [
                pair.collision.normal.x,
                pair.collision.normal.y,
              ] as Vector2,
            })),
          };
          for (const callback of this.collisionStartCallbacks) {
            callback(collisionEvent);
          }
        }
      }
    });

    Matter.Events.on(this.engine, 'collisionEnd', (event) => {
      for (const pair of event.pairs) {
        const bodyA = this.bodies.get(pair.bodyA.id);
        const bodyB = this.bodies.get(pair.bodyB.id);
        if (bodyA && bodyB) {
          const collisionEvent: CollisionEvent = {
            bodyA,
            bodyB,
            contacts: [],
          };
          for (const callback of this.collisionEndCallbacks) {
            callback(collisionEvent);
          }
        }
      }
    });
  }

  createBody(config: RigidBodyConfig): PhysicsBody {
    const isStatic = config.type === 'static';

    // Create a default rectangle body (colliders will be added separately)
    const matterBody = Matter.Bodies.rectangle(
      config.position[0],
      config.position[1],
      1,
      1,
      {
        isStatic,
        angle: (config.rotation * Math.PI) / 180,
        friction: config.friction ?? 0.1,
        restitution: config.restitution ?? 0,
        frictionAir: config.linearDamping ?? 0.01,
        mass: config.mass,
        inertia: config.fixedRotation ? Infinity : undefined,
      }
    );

    // Handle gravity scale
    if (config.gravityScale !== undefined && config.gravityScale !== 1) {
      // Store for custom gravity handling
      (matterBody as Matter.Body & { gravityScale: number }).gravityScale =
        config.gravityScale;
    }

    Matter.Composite.add(this.engine.world, matterBody);

    const body = new MatterBody(matterBody, config.type);
    this.bodies.set(matterBody.id, body);

    return body;
  }

  removeBody(body: PhysicsBody): void {
    const matterBody = body as MatterBody;
    Matter.Composite.remove(this.engine.world, matterBody.matterBody);
    this.bodies.delete(matterBody.matterBody.id);
  }

  addCollider(body: PhysicsBody, config: ColliderConfig): void {
    const matterBody = (body as MatterBody).matterBody;
    let newBody: Matter.Body | null = null;

    const offset = config.offset ?? [0, 0];

    switch (config.type) {
      case 'box':
        newBody = Matter.Bodies.rectangle(
          matterBody.position.x + offset[0],
          matterBody.position.y + offset[1],
          config.width ?? 32,
          config.height ?? 32,
          { isSensor: config.isTrigger }
        );
        break;

      case 'circle':
        newBody = Matter.Bodies.circle(
          matterBody.position.x + offset[0],
          matterBody.position.y + offset[1],
          config.radius ?? 16,
          { isSensor: config.isTrigger }
        );
        break;

      case 'polygon':
        if (config.vertices && config.vertices.length >= 3) {
          const vertices = config.vertices.map((v) => ({ x: v[0], y: v[1] }));
          newBody = Matter.Bodies.fromVertices(
            matterBody.position.x + offset[0],
            matterBody.position.y + offset[1],
            [vertices],
            { isSensor: config.isTrigger }
          );
        }
        break;
    }

    if (newBody) {
      // Replace the body parts with the new collider
      Matter.Body.setParts(matterBody, [newBody]);
    }
  }

  step(dt: number): void {
    // Apply custom gravity for bodies with gravityScale
    const gravity = this.engine.gravity;
    for (const body of this.bodies.values()) {
      const mb = body.matterBody as Matter.Body & { gravityScale?: number };
      if (mb.gravityScale !== undefined && mb.gravityScale !== 1 && !mb.isStatic) {
        const scale = mb.gravityScale - 1;
        Matter.Body.applyForce(mb, mb.position, {
          x: gravity.x * mb.mass * scale * gravity.scale,
          y: gravity.y * mb.mass * scale * gravity.scale,
        });
      }
    }

    Matter.Engine.update(this.engine, dt * 1000);
  }

  setGravity(gravity: Vector2): void {
    this.engine.gravity.x = gravity[0] / 1000;
    this.engine.gravity.y = gravity[1] / 1000;
    this.engine.gravity.scale = 0.001;
  }

  getGravity(): Vector2 {
    return [
      this.engine.gravity.x * 1000,
      this.engine.gravity.y * 1000,
    ];
  }

  raycast(
    origin: Vector2,
    direction: Vector2,
    distance: number
  ): RaycastHit | null {
    // Normalize direction
    const len = Math.sqrt(direction[0] ** 2 + direction[1] ** 2);
    const nx = direction[0] / len;
    const ny = direction[1] / len;

    const endPoint = {
      x: origin[0] + nx * distance,
      y: origin[1] + ny * distance,
    };

    const collisions = Matter.Query.ray(
      Matter.Composite.allBodies(this.engine.world),
      { x: origin[0], y: origin[1] },
      endPoint
    );

    if (collisions.length === 0) return null;

    // Find closest
    let closest = collisions[0];
    let closestDist = Infinity;

    for (const collision of collisions) {
      // bodyA is the ray body, bodyB is the hit body
      const hitBody = collision.bodyB ?? collision.bodyA;
      const dx = hitBody.position.x - origin[0];
      const dy = hitBody.position.y - origin[1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = collision;
      }
    }

    const hitBody = closest.bodyB ?? closest.bodyA;
    const body = this.bodies.get(hitBody.id);
    if (!body) return null;

    return {
      body,
      point: [hitBody.position.x, hitBody.position.y],
      normal: [0, -1], // Simplified - Matter.js doesn't give easy normals
      distance: closestDist,
    };
  }

  queryAABB(min: Vector2, max: Vector2): PhysicsBody[] {
    const bounds: Matter.Bounds = {
      min: { x: min[0], y: min[1] },
      max: { x: max[0], y: max[1] },
    };

    const allBodies = Matter.Composite.allBodies(this.engine.world);
    const results: PhysicsBody[] = [];

    for (const matterBody of allBodies) {
      if (Matter.Bounds.overlaps(matterBody.bounds, bounds)) {
        const body = this.bodies.get(matterBody.id);
        if (body) results.push(body);
      }
    }

    return results;
  }

  onCollisionStart(callback: CollisionCallback): () => void {
    this.collisionStartCallbacks.push(callback);
    return () => {
      const index = this.collisionStartCallbacks.indexOf(callback);
      if (index !== -1) this.collisionStartCallbacks.splice(index, 1);
    };
  }

  onCollisionEnd(callback: CollisionCallback): () => void {
    this.collisionEndCallbacks.push(callback);
    return () => {
      const index = this.collisionEndCallbacks.indexOf(callback);
      if (index !== -1) this.collisionEndCallbacks.splice(index, 1);
    };
  }

  clear(): void {
    Matter.Composite.clear(this.engine.world, false);
    this.bodies.clear();
  }

  destroy(): void {
    this.clear();
    Matter.Engine.clear(this.engine);
    this.collisionStartCallbacks = [];
    this.collisionEndCallbacks = [];
  }
}

// Register as default backend
registerPhysicsBackend('matter', (config) => new MatterPhysicsWorld(config));

export default MatterPhysicsWorld;
