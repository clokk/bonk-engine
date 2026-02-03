/**
 * Collider2DComponent - Collision shape for physics bodies.
 * Must be attached to a GameObject that also has a RigidBody2D.
 */

import { Component, registerComponent } from '../Component';
import type { GameObject } from '../GameObject';
import type { Scene } from '../Scene';
import { RigidBody2DComponent } from './RigidBody2DComponent';
import type { Collider2DJson, AnyComponentJson, ColliderShape, Vector2 } from '../types';

export class Collider2DComponent extends Component {
  readonly type = 'Collider2D';

  /** Collision shape */
  shape: ColliderShape;

  /** Is this a trigger (detects overlap without physical response)? */
  isTrigger: boolean = false;

  /** Offset from transform origin */
  offset: Vector2 = [0, 0];

  /** Collision layer name */
  layer?: string;

  /** Collision mask (layers this collides with) */
  mask?: string[];

  /** Whether the collider has been added to the physics body */
  private colliderAdded: boolean = false;

  constructor(gameObject: GameObject, data?: Partial<Collider2DJson>) {
    super(gameObject);

    // Default to a small box if no shape provided
    this.shape = data?.shape ?? { type: 'box', width: 32, height: 32 };
    this.isTrigger = data?.isTrigger ?? false;
    this.offset = data?.offset ?? [0, 0];
    this.layer = data?.layer;
    this.mask = data?.mask;
  }

  awake(): void {
    this.addColliderToBody();
  }

  start(): void {
    // Try again in start in case RigidBody2D wasn't ready in awake
    if (!this.colliderAdded) {
      this.addColliderToBody();
    }
  }

  /** Add this collider to the associated RigidBody2D */
  private addColliderToBody(): void {
    if (this.colliderAdded) return;

    const rb = this.gameObject.getComponent(RigidBody2DComponent);
    if (!rb?.body) {
      console.warn(
        `[Collider2D] No RigidBody2D found on "${this.gameObject.name}". ` +
          'Collider2D requires a RigidBody2D component.'
      );
      return;
    }

    const scene = this.gameObject.scene as Scene | null;
    if (!scene?.physicsWorld) {
      console.warn('[Collider2D] No physics world available');
      return;
    }

    // Add the collider shape to the physics body
    scene.physicsWorld.addCollider(rb.body, {
      type: this.shape.type,
      width: this.shape.type === 'box' ? this.shape.width : undefined,
      height: this.shape.type === 'box' ? this.shape.height : undefined,
      radius: this.shape.type === 'circle' ? this.shape.radius : undefined,
      vertices: this.shape.type === 'polygon' ? this.shape.vertices : undefined,
      isTrigger: this.isTrigger,
      offset: this.offset,
      layer: this.layer,
      mask: this.mask,
    });

    // Re-register the body since addCollider may have replaced the underlying physics body
    rb.reregisterBody();

    this.colliderAdded = true;

    const shapeDesc =
      this.shape.type === 'box'
        ? `box(${this.shape.width}x${this.shape.height})`
        : this.shape.type === 'circle'
          ? `circle(r=${this.shape.radius})`
          : `polygon(${this.shape.vertices.length} verts)`;

    console.log(
      `[Collider2D] Added ${shapeDesc} collider to "${this.gameObject.name}"` +
        (this.isTrigger ? ' (trigger)' : '')
    );
  }

  onDestroy(): void {
    // Colliders are automatically removed when the body is removed
    this.colliderAdded = false;
  }

  toJSON(): Collider2DJson {
    const json: Collider2DJson = {
      type: 'Collider2D',
      shape: this.shape,
    };

    if (this.isTrigger) json.isTrigger = this.isTrigger;
    if (this.offset[0] !== 0 || this.offset[1] !== 0) json.offset = this.offset;
    if (this.layer) json.layer = this.layer;
    if (this.mask) json.mask = this.mask;

    return json;
  }
}

// Register the component factory
registerComponent('Collider2D', (gameObject, data) => {
  return new Collider2DComponent(gameObject, data as Collider2DJson);
});

export default Collider2DComponent;
