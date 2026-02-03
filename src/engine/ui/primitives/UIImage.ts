/**
 * UIImage - Image display UI element.
 *
 * Displays an image from a texture file.
 * Supports explicit sizing or auto-sizing to image dimensions.
 *
 * Example:
 * ```typescript
 * const icon = new UIImage({
 *   src: './ui/heart.png',
 *   width: 32,
 *   height: 32,
 *   tint: 0xff6666,
 * });
 * ```
 */

import { Sprite, Texture, Assets, Graphics } from 'pixi.js';
import { UIElement } from '../UIElement';
import type { Vector2 } from '../../types';
import type { UIImageConfig } from '../types';

export class UIImage extends UIElement {
  /** The PixiJS Sprite or placeholder Graphics */
  private imageDisplay: Sprite | Graphics;

  /** Image source path */
  private _src: string;

  /** Explicit width (0 = use image width) */
  private _width: number;

  /** Explicit height (0 = use image height) */
  private _height: number;

  /** Tint color */
  private _tint: number;

  /** Whether the texture has loaded */
  private textureLoaded: boolean = false;

  /** Natural image dimensions */
  private naturalWidth: number = 0;
  private naturalHeight: number = 0;

  constructor(config: UIImageConfig = {}) {
    super(config);

    this._src = config.src ?? '';
    this._width = config.width ?? 0;
    this._height = config.height ?? 0;
    this._tint = config.tint ?? 0xffffff;

    // Start with a placeholder
    const placeholderWidth = this._width || 32;
    const placeholderHeight = this._height || 32;
    const placeholder = new Graphics();
    placeholder.rect(0, 0, placeholderWidth, placeholderHeight);
    placeholder.fill(0x888888);
    this.imageDisplay = placeholder;
    this.displayObject.addChild(this.imageDisplay);

    // Load the texture if provided
    if (this._src) {
      this.loadTexture(this._src);
    }
  }

  // ==================== Properties ====================

  /** Get the image source path */
  get src(): string {
    return this._src;
  }

  /** Set the image source path (triggers async load) */
  set src(value: string) {
    if (this._src === value) return;
    this._src = value;
    this.textureLoaded = false;
    if (value) {
      this.loadTexture(value);
    }
  }

  /** Get explicit width */
  get width(): number {
    return this._width;
  }

  /** Set explicit width (0 = use natural width) */
  set width(value: number) {
    if (this._width === value) return;
    this._width = value;
    this.updateImageSize();
    this.markLayoutDirty();
  }

  /** Get explicit height */
  get height(): number {
    return this._height;
  }

  /** Set explicit height (0 = use natural height) */
  set height(value: number) {
    if (this._height === value) return;
    this._height = value;
    this.updateImageSize();
    this.markLayoutDirty();
  }

  /** Get tint color */
  get tint(): number {
    return this._tint;
  }

  /** Set tint color */
  set tint(value: number) {
    this._tint = value;
    if (this.imageDisplay instanceof Sprite) {
      this.imageDisplay.tint = value;
    }
  }

  // ==================== Internal ====================

  /**
   * Load a texture from the given path.
   */
  private async loadTexture(src: string): Promise<void> {
    try {
      const texture = await Assets.load(src);
      if (texture && texture !== Texture.WHITE && this._src === src) {
        this.replaceWithSprite(texture);
      }
    } catch {
      // Keep placeholder on load failure
      console.warn(`UIImage: Failed to load texture: ${src}`);
    }
  }

  /**
   * Replace the placeholder with a loaded sprite.
   */
  private replaceWithSprite(texture: Texture): void {
    // Store natural dimensions
    this.naturalWidth = texture.width;
    this.naturalHeight = texture.height;

    // Create sprite
    const sprite = new Sprite(texture);
    sprite.tint = this._tint;

    // Remove old display
    this.displayObject.removeChild(this.imageDisplay);
    if (this.imageDisplay instanceof Graphics) {
      this.imageDisplay.destroy();
    }

    // Add new sprite
    this.imageDisplay = sprite;
    this.displayObject.addChild(sprite);

    this.textureLoaded = true;
    this.updateImageSize();
    this.markLayoutDirty();
  }

  /**
   * Update the sprite size based on explicit dimensions.
   */
  private updateImageSize(): void {
    if (!(this.imageDisplay instanceof Sprite)) return;

    const targetWidth = this._width || this.naturalWidth;
    const targetHeight = this._height || this.naturalHeight;

    this.imageDisplay.width = targetWidth;
    this.imageDisplay.height = targetHeight;
  }

  // ==================== Layout ====================

  /**
   * Measure the image dimensions as content size.
   */
  protected override measureContent(): Vector2 {
    if (this.textureLoaded) {
      return [
        this._width || this.naturalWidth,
        this._height || this.naturalHeight,
      ];
    }

    // Return placeholder size while loading
    return [this._width || 32, this._height || 32];
  }
}
