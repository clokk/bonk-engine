/**
 * Rotator - Simple behavior that rotates the GameObject.
 * Useful for testing and visual effects.
 */

import { Behavior } from '../src/engine/Behavior';

export default class Rotator extends Behavior {
  /** Rotation speed in degrees per second */
  speed: number = 90;

  /** Rotation direction (1 = clockwise, -1 = counter-clockwise) */
  direction: number = 1;

  update(): void {
    this.transform.rotate(this.speed * this.direction * this.deltaTime);
  }
}
