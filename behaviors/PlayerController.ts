/**
 * PlayerController - Example behavior for player movement.
 * Demonstrates input handling, physics-based movement, and coroutines.
 */

import { Behavior } from '../src/engine/Behavior';

export default class PlayerController extends Behavior {
  /** Movement speed in pixels per second */
  speed: number = 200;

  /** Jump force */
  jumpForce: number = 400;

  /** Is the player grounded? */
  isGrounded: boolean = true;

  /** Current velocity */
  private velocity: [number, number] = [0, 0];

  /** Input state */
  private input = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
  };

  /** Key bindings */
  private keyBindings: Record<string, keyof typeof this.input> = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
    KeyA: 'left',
    KeyD: 'right',
    KeyW: 'up',
    KeyS: 'down',
    Space: 'jump',
  };

  awake(): void {
    // Set up input listeners
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  start(): void {
    console.log(`PlayerController started on ${this.gameObject.name}`);
  }

  update(): void {
    // Calculate movement direction
    let moveX = 0;
    let moveY = 0;

    if (this.input.left) moveX -= 1;
    if (this.input.right) moveX += 1;
    if (this.input.up) moveY -= 1;
    if (this.input.down) moveY += 1;

    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
      const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= magnitude;
      moveY /= magnitude;
    }

    // Apply movement
    this.transform.position[0] += moveX * this.speed * this.deltaTime;
    this.transform.position[1] += moveY * this.speed * this.deltaTime;

    // Handle jump
    if (this.input.jump && this.isGrounded) {
      this.velocity[1] = -this.jumpForce;
      this.isGrounded = false;
      this.input.jump = false;

      // Start jump coroutine for visual feedback
      this.startCoroutine(this.jumpSquash());
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

  onDestroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    const action = this.keyBindings[event.code];
    if (action) {
      this.input[action] = true;
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    const action = this.keyBindings[event.code];
    if (action) {
      this.input[action] = false;
    }
  };
}
