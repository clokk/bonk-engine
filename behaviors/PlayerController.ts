/**
 * PlayerController - Example behavior for player movement.
 * Demonstrates physics-based movement, input handling, and collision callbacks.
 */

import { Behavior } from '../src/engine/Behavior';
import type { GameObject } from '../src/engine/GameObject';
import type { ContactInfo } from '../src/engine/Scene';

export default class PlayerController extends Behavior {
  /** Movement speed in pixels per second */
  speed: number = 200;

  /** Jump impulse strength */
  jumpForce: number = 400;

  /** Is the player grounded? */
  isGrounded: boolean = false;

  start(): void {
    console.log(`PlayerController started on ${this.gameObject.name}`);
    if (!this.rigidbody) {
      console.warn('[PlayerController] No RigidBody2D found - physics movement disabled');
    }
  }

  fixedUpdate(): void {
    const rb = this.rigidbody;
    if (!rb) return;

    // Get horizontal input
    const moveX = this.getAxisRaw('horizontal');

    // Set horizontal velocity while preserving vertical velocity (gravity)
    // Matter.js velocity is in pixels per step, so multiply by fixedDeltaTime
    const [, vy] = rb.velocity;
    rb.velocity = [moveX * this.speed * this.fixedDeltaTime, vy];

    // Handle jump - getButtonDown only fires on the frame the button is first pressed
    const jumpPressed = this.getButtonDown('jump');
    if (jumpPressed) {
      console.log('[PlayerController] Jump pressed, isGrounded:', this.isGrounded);
    }

    if (jumpPressed && this.isGrounded) {
      // Set upward velocity (scale like horizontal movement)
      const [vx] = rb.velocity;
      const jumpVelocity = -this.jumpForce * this.fixedDeltaTime;
      console.log('[PlayerController] Jumping with velocity:', jumpVelocity);
      rb.velocity = [vx, jumpVelocity];
      this.isGrounded = false;

      // Start jump coroutine for visual feedback
      this.startCoroutine(this.jumpSquash());
    }
  }

  /** Called when player collides with something */
  onCollisionEnter(other: GameObject, contact: ContactInfo): void {
    // Check if we landed on something (contact normal pointing up)
    // Normal pointing up means we hit something below us
    if (contact.normal[1] < -0.5) {
      this.isGrounded = true;
      console.log(`[PlayerController] Landed on ${other.name}`);
    }
  }

  /** Called when player stops colliding */
  onCollisionExit(other: GameObject): void {
    // Simple ground check - could be improved with raycast
    if (other.tag === 'Ground') {
      this.isGrounded = false;
    }
  }

  /** Squash and stretch effect during jump */
  *jumpSquash() {
    // Squash on takeoff
    this.transform.scale = [1.2, 0.8];
    yield* this.wait(0.1);

    // Stretch during jump
    this.transform.scale = [0.8, 1.2];
    yield* this.wait(0.2);

    // Return to normal
    this.transform.scale = [1, 1];
  }
}
