/**
 * SpriteComponent - Renders a 2D sprite using PixiJS.
 * This is a placeholder that demonstrates the component pattern.
 */

import { Component, registerComponent } from '../Component';
import type { GameObject } from '../GameObject';
import type { SpriteJson, AnyComponentJson } from '../types';

export class SpriteComponent extends Component {
  readonly type = 'Sprite';

  /** Image source path */
  src: string;

  /** Anchor point (0-1) */
  anchor: [number, number] = [0.5, 0.5];

  /** Tint color */
  tint?: string;

  /** Alpha transparency */
  alpha: number = 1;

  /** Flip horizontally */
  flipX: boolean = false;

  /** Flip vertically */
  flipY: boolean = false;

  // Note: In a full implementation, this would hold a PixiJS Sprite reference
  // private sprite: PIXI.Sprite | null = null;

  constructor(gameObject: GameObject, data?: Partial<SpriteJson>) {
    super(gameObject);
    this.src = data?.src ?? '';
    if (data?.anchor) this.anchor = [...data.anchor];
    this.tint = data?.tint as string | undefined;
    this.alpha = data?.alpha ?? 1;
    this.flipX = data?.flipX ?? false;
    this.flipY = data?.flipY ?? false;
  }

  awake(): void {
    // In full implementation: Load texture and create PIXI.Sprite
    console.log(`[SpriteComponent] Loading sprite: ${this.src}`);
  }

  update(): void {
    // In full implementation: Sync transform to sprite position
  }

  onDestroy(): void {
    // In full implementation: Destroy PIXI.Sprite
  }

  toJSON(): SpriteJson {
    return {
      type: 'Sprite',
      src: this.src,
      anchor: this.anchor,
      tint: this.tint,
      alpha: this.alpha,
      flipX: this.flipX,
      flipY: this.flipY,
    };
  }
}

// Register the component factory
registerComponent('Sprite', (gameObject, data) => {
  return new SpriteComponent(gameObject, data as SpriteJson);
});

export default SpriteComponent;
