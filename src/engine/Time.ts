/**
 * Time management for the game loop.
 * Provides delta time, elapsed time, and time scaling.
 */

export class Time {
  /** Time since last frame in seconds */
  static deltaTime: number = 0;

  /** Unscaled time since last frame */
  static unscaledDeltaTime: number = 0;

  /** Total elapsed time since game start */
  static time: number = 0;

  /** Unscaled total elapsed time */
  static unscaledTime: number = 0;

  /** Fixed timestep for physics (1/60 second) */
  static readonly fixedDeltaTime: number = 1 / 60;

  /** Time scale for slow-mo or pause effects */
  static timeScale: number = 1;

  /** Frame count since game start */
  static frameCount: number = 0;

  /** Current frames per second */
  static fps: number = 60;

  private static fpsAccumulator: number = 0;
  private static fpsFrameCount: number = 0;
  private static lastFpsUpdate: number = 0;

  /** Update time values (called by WorldManager) */
  static update(dt: number): void {
    this.unscaledDeltaTime = dt;
    this.deltaTime = dt * this.timeScale;
    this.unscaledTime += dt;
    this.time += this.deltaTime;
    this.frameCount++;

    // Update FPS every second
    this.fpsAccumulator += dt;
    this.fpsFrameCount++;
    if (this.fpsAccumulator >= 1) {
      this.fps = Math.round(this.fpsFrameCount / this.fpsAccumulator);
      this.fpsAccumulator = 0;
      this.fpsFrameCount = 0;
    }
  }

  /** Reset all time values */
  static reset(): void {
    this.deltaTime = 0;
    this.unscaledDeltaTime = 0;
    this.time = 0;
    this.unscaledTime = 0;
    this.timeScale = 1;
    this.frameCount = 0;
    this.fps = 60;
    this.fpsAccumulator = 0;
    this.fpsFrameCount = 0;
  }
}
