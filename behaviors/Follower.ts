/**
 * Follower - Behavior that follows a target GameObject.
 * Demonstrates finding other GameObjects and smooth movement.
 */

import { Behavior } from '../src/engine/Behavior';
import type { Vector2 } from '../src/engine/types';

export default class Follower extends Behavior {
  /** Name of the target to follow */
  targetName: string = 'Player';

  /** Follow speed */
  speed: number = 100;

  /** Minimum distance to maintain from target */
  minDistance: number = 50;

  /** Smoothing factor (0 = instant, 1 = no movement) */
  smoothing: number = 0.1;

  /** Cached target reference */
  private target: { transform: { position: Vector2 } } | null = null;

  start(): void {
    // Find target
    const found = this.find(this.targetName);
    if (found) {
      this.target = found;
    } else {
      console.warn(`Follower: Target "${this.targetName}" not found`);
    }
  }

  update(): void {
    if (!this.target) return;

    const targetPos = this.target.transform.position;
    const currentPos = this.transform.position;

    // Calculate direction and distance
    const dx = targetPos[0] - currentPos[0];
    const dy = targetPos[1] - currentPos[1];
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only move if beyond minimum distance
    if (distance > this.minDistance) {
      // Normalize direction
      const nx = dx / distance;
      const ny = dy / distance;

      // Calculate target position (maintain minDistance)
      const targetX = targetPos[0] - nx * this.minDistance;
      const targetY = targetPos[1] - ny * this.minDistance;

      // Smooth movement (lerp)
      const t = 1 - Math.pow(this.smoothing, this.deltaTime * 60);
      this.transform.position[0] += (targetX - currentPos[0]) * t;
      this.transform.position[1] += (targetY - currentPos[1]) * t;

      // Face target
      this.transform.lookAt(targetPos);
    }
  }
}
