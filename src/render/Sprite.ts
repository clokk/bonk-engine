/**
 * Sprite - Standalone 2D sprite, decoupled from any entity system.
 */

import type { Renderer, RenderObject, SpriteConfig } from './Renderer';
import type { Transform } from '../runtime/Transform';
import type { Vector2 } from '../types';

/** Options for creating a Sprite */
export interface SpriteOptions {
  /** Image source path */
  src?: string;
  /** Width in pixels (for placeholder) */
  width?: number;
  /** Height in pixels (for placeholder) */
  height?: number;
  /** Fill color (hex) for placeholder */
  color?: number;
  /** Anchor point [0-1] */
  anchor?: [number, number];
  /** Initial alpha */
  alpha?: number;
  /** Z-index for render ordering */
  zIndex?: number;
  /** Optional transform to auto-sync from */
  transform?: Transform;
}

export class Sprite {
  /** Optional transform for auto-sync via sync() */
  transform: Transform | null;

  /** Flip sprite horizontally */
  flipX = false;

  /** Flip sprite vertically */
  flipY = false;

  /** Alpha transparency */
  alpha: number;

  private renderObject: RenderObject;

  constructor(renderer: Renderer, options: SpriteOptions = {}) {
    this.transform = options.transform ?? null;
    this.alpha = options.alpha ?? 1;

    const config: SpriteConfig = {
      src: options.src,
      width: options.width ?? 32,
      height: options.height ?? 32,
      color: options.color ?? 0xff00ff,
      anchor: options.anchor ?? [0.5, 0.5],
      alpha: this.alpha,
      zIndex: options.zIndex ?? 0,
    };

    this.renderObject = renderer.createSprite(config);
  }

  /** Sync visual position/rotation/scale from the attached transform. */
  sync(): void {
    if (!this.transform) return;

    const worldPos = this.transform.worldPosition;
    const worldRot = this.transform.worldRotation;
    const worldScale = this.transform.worldScale;

    this.renderObject.setPosition(worldPos[0], worldPos[1]);
    this.renderObject.setRotation(worldRot);

    const scaleX = this.flipX ? -worldScale[0] : worldScale[0];
    const scaleY = this.flipY ? -worldScale[1] : worldScale[1];
    this.renderObject.setScale(scaleX, scaleY);

    this.renderObject.setAlpha(this.alpha);
    this.renderObject.zIndex = this.transform.zIndex;
  }

  /** Manually set position. */
  setPosition(x: number, y: number): void {
    this.renderObject.setPosition(x, y);
  }

  /** Manually set rotation (degrees). */
  setRotation(degrees: number): void {
    this.renderObject.setRotation(degrees);
  }

  /** Manually set scale. */
  setScale(x: number, y: number): void {
    this.renderObject.setScale(x, y);
  }

  /** Set visibility. */
  setVisible(visible: boolean): void {
    this.renderObject.setVisible(visible);
  }

  /** Set z-index. */
  set zIndex(value: number) {
    this.renderObject.zIndex = value;
  }

  get zIndex(): number {
    return this.renderObject.zIndex;
  }

  /** Destroy the sprite and remove from renderer. */
  destroy(): void {
    this.renderObject.destroy();
  }
}
