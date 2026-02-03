/**
 * Camera2DComponent - Controls the viewport, follows targets, supports zoom and bounds.
 */

import { Component, registerComponent } from '../Component';
import { Time } from '../Time';
import { getRenderer } from '../rendering';
import type { GameObject } from '../GameObject';
import type { Camera2DJson, AnyComponentJson, Vector2 } from '../types';

export class Camera2DComponent extends Component {
  readonly type = 'Camera2D';

  /** Zoom level (1 = 100%) */
  zoom: number = 1;

  /** Is this the active camera? */
  isMain: boolean = true;

  /** Name of GameObject to follow */
  target?: string;

  /** Follow speed (higher = faster/tighter follow) */
  followSmoothing: number = 5;

  /** Offset from target position */
  offset: Vector2 = [0, 0];

  /** World bounds to constrain camera */
  bounds?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };

  /** Deadzone - area target can move without camera moving */
  deadzone?: {
    width: number;
    height: number;
  };

  /** Runtime reference to target GameObject */
  private _target: GameObject | null = null;

  /** Current interpolated camera position */
  private currentPosition: Vector2 = [0, 0];

  constructor(gameObject: GameObject, data?: Partial<Camera2DJson>) {
    super(gameObject);
    this.zoom = data?.zoom ?? 1;
    this.isMain = data?.isMain ?? true;
    this.target = data?.target;
    this.followSmoothing = data?.followSmoothing ?? 5;
    if (data?.offset) this.offset = [...data.offset];
    if (data?.bounds) this.bounds = { ...data.bounds };
    if (data?.deadzone) this.deadzone = { ...data.deadzone };
  }

  awake(): void {
    // Initialize position to transform position
    this.currentPosition = [...this.transform.worldPosition] as Vector2;
  }

  start(): void {
    // Find target by name
    if (this.target && this.gameObject.scene) {
      this._target = this.gameObject.scene.findByName(this.target) ?? null;
      if (!this._target) {
        console.warn(`Camera2D: Target "${this.target}" not found`);
      }
    }

    // If we have a target, snap to it immediately on start
    if (this._target) {
      const targetPos = this.getTargetPosition();
      this.currentPosition = [...targetPos];
    }
  }

  lateUpdate(): void {
    if (!this.isMain || !this.enabled) return;

    // Calculate target position
    let targetPos = this.getTargetPosition();

    // Apply deadzone
    if (this.deadzone) {
      targetPos = this.applyDeadzone(targetPos);
    }

    // Smooth follow
    this.currentPosition = this.smoothFollow(targetPos);

    // Clamp to bounds
    if (this.bounds) {
      this.currentPosition = this.clampToBounds(this.currentPosition);
    }

    // Apply to renderer
    const renderer = getRenderer();
    renderer.setCameraPosition(this.currentPosition[0], this.currentPosition[1]);
    renderer.setCameraZoom(this.zoom);
  }

  private getTargetPosition(): Vector2 {
    if (this._target) {
      const pos = this._target.transform.worldPosition;
      return [pos[0] + this.offset[0], pos[1] + this.offset[1]];
    }
    return [...this.transform.worldPosition] as Vector2;
  }

  private smoothFollow(target: Vector2): Vector2 {
    const t = Math.min(1, this.followSmoothing * Time.deltaTime);
    return [
      this.currentPosition[0] + (target[0] - this.currentPosition[0]) * t,
      this.currentPosition[1] + (target[1] - this.currentPosition[1]) * t,
    ];
  }

  private applyDeadzone(target: Vector2): Vector2 {
    const dz = this.deadzone!;
    const halfW = dz.width / 2;
    const halfH = dz.height / 2;

    let [tx, ty] = target;
    const [cx, cy] = this.currentPosition;

    // Only move if target is outside deadzone
    if (tx < cx - halfW) tx = tx + halfW;
    else if (tx > cx + halfW) tx = tx - halfW;
    else tx = cx;

    if (ty < cy - halfH) ty = ty + halfH;
    else if (ty > cy + halfH) ty = ty - halfH;
    else ty = cy;

    return [tx, ty];
  }

  private clampToBounds(pos: Vector2): Vector2 {
    const b = this.bounds!;
    const viewport = getRenderer().getViewportSize();
    const halfW = (viewport.width / 2) / this.zoom;
    const halfH = (viewport.height / 2) / this.zoom;

    return [
      Math.max(b.minX + halfW, Math.min(b.maxX - halfW, pos[0])),
      Math.max(b.minY + halfH, Math.min(b.maxY - halfH, pos[1])),
    ];
  }

  /** Set a new target at runtime */
  setTarget(gameObject: GameObject | null): void {
    this._target = gameObject;
  }

  /** Get the current target */
  getTarget(): GameObject | null {
    return this._target;
  }

  /** Get current camera position */
  getPosition(): Vector2 {
    return [...this.currentPosition] as Vector2;
  }

  /** Instantly move camera to position (no smoothing) */
  snapTo(x: number, y: number): void {
    this.currentPosition = [x, y];
  }

  toJSON(): Camera2DJson {
    const json: Camera2DJson = {
      type: 'Camera2D',
      zoom: this.zoom,
      isMain: this.isMain,
    };

    if (this.target) json.target = this.target;
    if (this.followSmoothing !== 5) json.followSmoothing = this.followSmoothing;
    if (this.offset[0] !== 0 || this.offset[1] !== 0) json.offset = this.offset;
    if (this.bounds) json.bounds = this.bounds;
    if (this.deadzone) json.deadzone = this.deadzone;

    return json;
  }
}

// Register the component factory
registerComponent('Camera2D', (gameObject, data) => {
  return new Camera2DComponent(gameObject, data as Camera2DJson);
});

export default Camera2DComponent;
