/**
 * RigidBody - Standalone physics body, decoupled from any entity system.
 * Couples a Transform with a PhysicsBody and handles sync.
 */

import type {
  PhysicsWorld,
  PhysicsBody,
  ColliderConfig,
} from './PhysicsWorld';
import type { Transform } from '../runtime/Transform';
import type { Vector2, BodyType } from '../types';

/** Contact info for collision callbacks */
export interface ContactInfo {
  point: Vector2;
  normal: Vector2;
}

/** Configuration for creating a RigidBody */
export interface RigidBodyConfig {
  type: BodyType;
  mass?: number;
  friction?: number;
  restitution?: number;
  linearDamping?: number;
  angularDamping?: number;
  fixedRotation?: boolean;
  bullet?: boolean;
  gravityScale?: number;
}

type CollisionCallback = (other: RigidBody, contact: ContactInfo) => void;
type CollisionExitCallback = (other: RigidBody) => void;
type TriggerCallback = (other: RigidBody) => void;

export class RigidBody {
  readonly world: PhysicsWorld;
  readonly transform: Transform;
  readonly bodyType: BodyType;

  /** The underlying physics body */
  private _body: PhysicsBody;

  private collisionEnterCallbacks: CollisionCallback[] = [];
  private collisionExitCallbacks: CollisionExitCallback[] = [];
  private triggerEnterCallbacks: TriggerCallback[] = [];
  private triggerExitCallbacks: TriggerCallback[] = [];

  constructor(world: PhysicsWorld, transform: Transform, config: RigidBodyConfig) {
    this.world = world;
    this.transform = transform;
    this.bodyType = config.type;

    const worldPos = transform.worldPosition;
    const worldRot = transform.worldRotation;

    this._body = world.createBody({
      type: config.type,
      position: worldPos,
      rotation: worldRot,
      mass: config.mass,
      friction: config.friction,
      restitution: config.restitution,
      linearDamping: config.linearDamping,
      angularDamping: config.angularDamping,
      fixedRotation: config.fixedRotation,
      bullet: config.bullet,
      gravityScale: config.gravityScale,
    });
  }

  /** Get the underlying physics body. */
  get body(): PhysicsBody {
    return this._body;
  }

  /** Get/set velocity. */
  get velocity(): Vector2 {
    return this._body.velocity;
  }

  set velocity(v: Vector2) {
    this._body.setVelocity(v);
  }

  /** Apply a continuous force. */
  applyForce(force: Vector2): void {
    this._body.applyForce(force);
  }

  /** Apply an instant impulse. */
  applyImpulse(impulse: Vector2): void {
    this._body.applyImpulse(impulse);
  }

  /** Add a collider shape to this body. */
  addCollider(config: Omit<ColliderConfig, 'type'> & { type: 'box' | 'circle' | 'polygon' }): void {
    this.world.addCollider(this._body, config);
  }

  /** Sync transform FROM physics (call for dynamic bodies after physics step). */
  syncFromPhysics(): void {
    if (this.bodyType !== 'dynamic') return;
    const pos = this._body.position;
    const rot = this._body.rotation;
    this.transform.position = [pos[0], pos[1]];
    this.transform.rotation = rot;
  }

  /** Sync transform TO physics (call for kinematic bodies before physics step). */
  syncToPhysics(): void {
    if (this.bodyType !== 'kinematic') return;
    const worldPos = this.transform.worldPosition;
    const worldRot = this.transform.worldRotation;
    this._body.setPosition(worldPos);
    this._body.setRotation(worldRot);
  }

  /** Register collision enter callback. */
  onCollisionEnter(cb: CollisionCallback): () => void {
    this.collisionEnterCallbacks.push(cb);
    return () => {
      const i = this.collisionEnterCallbacks.indexOf(cb);
      if (i !== -1) this.collisionEnterCallbacks.splice(i, 1);
    };
  }

  /** Register collision exit callback. */
  onCollisionExit(cb: CollisionExitCallback): () => void {
    this.collisionExitCallbacks.push(cb);
    return () => {
      const i = this.collisionExitCallbacks.indexOf(cb);
      if (i !== -1) this.collisionExitCallbacks.splice(i, 1);
    };
  }

  /** Register trigger enter callback. */
  onTriggerEnter(cb: TriggerCallback): () => void {
    this.triggerEnterCallbacks.push(cb);
    return () => {
      const i = this.triggerEnterCallbacks.indexOf(cb);
      if (i !== -1) this.triggerEnterCallbacks.splice(i, 1);
    };
  }

  /** Register trigger exit callback. */
  onTriggerExit(cb: TriggerCallback): () => void {
    this.triggerExitCallbacks.push(cb);
    return () => {
      const i = this.triggerExitCallbacks.indexOf(cb);
      if (i !== -1) this.triggerExitCallbacks.splice(i, 1);
    };
  }

  /** Destroy and remove from physics world. */
  destroy(): void {
    this.world.removeBody(this._body);
    this.collisionEnterCallbacks = [];
    this.collisionExitCallbacks = [];
    this.triggerEnterCallbacks = [];
    this.triggerExitCallbacks = [];
  }

  // Internal methods called by Game collision routing
  /** @internal */
  _fireCollisionEnter(other: RigidBody, contact: ContactInfo): void {
    for (const cb of this.collisionEnterCallbacks) cb(other, contact);
  }

  /** @internal */
  _fireCollisionExit(other: RigidBody): void {
    for (const cb of this.collisionExitCallbacks) cb(other);
  }

  /** @internal */
  _fireTriggerEnter(other: RigidBody): void {
    for (const cb of this.triggerEnterCallbacks) cb(other);
  }

  /** @internal */
  _fireTriggerExit(other: RigidBody): void {
    for (const cb of this.triggerExitCallbacks) cb(other);
  }
}
