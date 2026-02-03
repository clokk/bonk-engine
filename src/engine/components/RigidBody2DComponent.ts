/**
 * RigidBody2DComponent - Physics body for 2D simulation.
 * Wraps a Matter.js body and syncs with the GameObject transform.
 */

import { Component, registerComponent } from '../Component';
import type { GameObject } from '../GameObject';
import type { Scene } from '../Scene';
import type { PhysicsBody } from '../physics';
import type { RigidBody2DJson, AnyComponentJson, Vector2, BodyType } from '../types';

export class RigidBody2DComponent extends Component {
  readonly type = 'RigidBody2D';

  /** Body type: dynamic, static, or kinematic */
  bodyType: BodyType = 'dynamic';

  /** Body mass (affects forces) */
  mass?: number;

  /** Surface friction */
  friction?: number;

  /** Bounciness (0-1) */
  restitution?: number;

  /** Gravity multiplier (0 = no gravity) */
  gravityScale?: number;

  /** Prevent rotation */
  fixedRotation?: boolean;

  /** Air resistance */
  linearDamping?: number;

  /** Angular air resistance */
  angularDamping?: number;

  /** Continuous collision detection for fast objects */
  bullet?: boolean;

  /** The underlying physics body */
  private _body: PhysicsBody | null = null;

  /** Whether the body has been created */
  private bodyCreated: boolean = false;

  constructor(gameObject: GameObject, data?: Partial<RigidBody2DJson>) {
    super(gameObject);
    if (data) {
      this.bodyType = data.bodyType ?? 'dynamic';
      this.mass = data.mass;
      this.friction = data.friction;
      this.restitution = data.restitution;
      this.gravityScale = data.gravityScale;
      this.fixedRotation = data.fixedRotation;
      this.linearDamping = data.linearDamping;
      this.angularDamping = data.angularDamping;
      this.bullet = data.bullet;
    }
  }

  /** Get the physics body */
  get body(): PhysicsBody | null {
    return this._body;
  }

  /** Get/set velocity */
  get velocity(): Vector2 {
    return this._body?.velocity ?? [0, 0];
  }

  set velocity(v: Vector2) {
    this._body?.setVelocity(v);
  }

  /** Apply a continuous force (like wind) */
  applyForce(force: Vector2): void {
    this._body?.applyForce(force);
  }

  /** Apply an instant impulse (like an explosion) */
  applyImpulse(impulse: Vector2): void {
    this._body?.applyImpulse(impulse);
  }

  awake(): void {
    this.createBody();
  }

  /** Create the physics body */
  private createBody(): void {
    const scene = this.gameObject.scene as Scene | null;
    if (!scene?.physicsWorld) {
      console.warn('[RigidBody2D] No physics world available');
      return;
    }

    if (this.bodyCreated) return;

    const worldPos = this.transform.worldPosition;
    const worldRot = this.transform.worldRotation;

    this._body = scene.physicsWorld.createBody({
      type: this.bodyType,
      position: worldPos,
      rotation: worldRot,
      mass: this.mass,
      friction: this.friction,
      restitution: this.restitution,
      linearDamping: this.linearDamping,
      angularDamping: this.angularDamping,
      fixedRotation: this.fixedRotation,
      bullet: this.bullet,
      gravityScale: this.gravityScale,
    });

    // Register for collision routing
    scene.registerPhysicsBody(this._body, this.gameObject);
    this.bodyCreated = true;

    console.log(
      `[RigidBody2D] Created ${this.bodyType} body for "${this.gameObject.name}"`
    );
  }

  /** Re-register the physics body (called after collider changes the underlying body) */
  reregisterBody(): void {
    if (!this._body) return;
    const scene = this.gameObject.scene as Scene | null;
    if (scene) {
      scene.registerPhysicsBody(this._body, this.gameObject);
    }
  }

  /** Sync transform FROM physics (for dynamic bodies after physics step) */
  syncFromPhysics(): void {
    if (!this._body || this.bodyType !== 'dynamic') return;

    const pos = this._body.position;
    const rot = this._body.rotation;

    // Update local position (assumes no parent for now)
    // TODO: Handle hierarchical transforms properly
    this.transform.position = [pos[0], pos[1]];
    this.transform.rotation = rot;
  }

  /** Sync transform TO physics (for kinematic bodies before physics step) */
  syncToPhysics(): void {
    if (!this._body || this.bodyType !== 'kinematic') return;

    const worldPos = this.transform.worldPosition;
    const worldRot = this.transform.worldRotation;

    this._body.setPosition(worldPos);
    this._body.setRotation(worldRot);
  }

  onDestroy(): void {
    if (this._body) {
      const scene = this.gameObject.scene as Scene | null;
      if (scene?.physicsWorld) {
        scene.unregisterPhysicsBody(this._body);
        scene.physicsWorld.removeBody(this._body);
      }
      this._body = null;
    }
    this.bodyCreated = false;
  }

  toJSON(): RigidBody2DJson {
    const json: RigidBody2DJson = {
      type: 'RigidBody2D',
      bodyType: this.bodyType,
    };

    if (this.mass !== undefined) json.mass = this.mass;
    if (this.friction !== undefined) json.friction = this.friction;
    if (this.restitution !== undefined) json.restitution = this.restitution;
    if (this.gravityScale !== undefined) json.gravityScale = this.gravityScale;
    if (this.fixedRotation !== undefined) json.fixedRotation = this.fixedRotation;
    if (this.linearDamping !== undefined) json.linearDamping = this.linearDamping;
    if (this.angularDamping !== undefined) json.angularDamping = this.angularDamping;
    if (this.bullet !== undefined) json.bullet = this.bullet;

    return json;
  }
}

// Register the component factory
registerComponent('RigidBody2D', (gameObject, data) => {
  return new RigidBody2DComponent(gameObject, data as RigidBody2DJson);
});

export default RigidBody2DComponent;
