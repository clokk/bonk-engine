/**
 * AnimatedSprite - Standalone sprite sheet animation, decoupled from any entity system.
 */

import type { Renderer, RenderObject, AnimatedSpriteConfig } from './Renderer';
import type { Transform } from '../runtime/Transform';
import { Time } from '../runtime/Time';

/** Definition of a single named animation */
export interface AnimationDefinition {
  frames: number[];
  frameRate: number;
  loop: boolean;
}

/** Options for creating an AnimatedSprite */
export interface AnimatedSpriteOptions {
  /** Path to the sprite sheet image */
  src?: string;
  /** Width of each frame in pixels */
  frameWidth: number;
  /** Height of each frame in pixels */
  frameHeight: number;
  /** Named animations */
  animations?: Record<string, { frames: number[]; frameRate?: number; loop?: boolean }>;
  /** Animation to play on creation */
  defaultAnimation?: string;
  /** Anchor point [0-1] */
  anchor?: [number, number];
  /** Initial alpha */
  alpha?: number;
  /** Fill color (hex) for placeholder */
  color?: number;
  /** Z-index for render ordering */
  zIndex?: number;
  /** Optional transform to auto-sync from */
  transform?: Transform;
}

export class AnimatedSprite {
  /** Optional transform for auto-sync via sync() */
  transform: Transform | null;

  /** Flip sprite horizontally */
  flipX = false;

  /** Flip sprite vertically */
  flipY = false;

  /** Alpha transparency */
  alpha: number;

  /** Called when a non-looping animation reaches its last frame */
  onAnimationComplete: ((name: string) => void) | null = null;

  /** Called every time the displayed frame changes */
  onFrameChange: ((frameIndex: number, name: string) => void) | null = null;

  readonly frameWidth: number;
  readonly frameHeight: number;

  private renderObject: RenderObject;
  private animations: Map<string, AnimationDefinition>;
  private currentAnimation: string | null = null;
  private currentFrameIndex = 0;
  private frameAccumulator = 0;
  private isPlaying = false;
  private sheetColumns = 1;
  private textureReady = false;

  constructor(renderer: Renderer, options: AnimatedSpriteOptions) {
    this.transform = options.transform ?? null;
    this.alpha = options.alpha ?? 1;
    this.frameWidth = options.frameWidth;
    this.frameHeight = options.frameHeight;

    this.animations = new Map();
    if (options.animations) {
      for (const [name, anim] of Object.entries(options.animations)) {
        this.animations.set(name, {
          frames: anim.frames,
          frameRate: anim.frameRate ?? 12,
          loop: anim.loop ?? true,
        });
      }
    }

    const config: AnimatedSpriteConfig = {
      src: options.src,
      frameWidth: options.frameWidth,
      frameHeight: options.frameHeight,
      color: options.color ?? 0xff00ff,
      anchor: options.anchor ?? [0.5, 0.5],
      alpha: this.alpha,
      zIndex: options.zIndex ?? 0,
      onTextureReady: () => this.onTextureLoaded(options.defaultAnimation),
    };

    this.renderObject = renderer.createAnimatedSprite(config);
  }

  /** Must be called each frame to advance animation and sync transform. */
  update(): void {
    if (this.textureReady && this.isPlaying && this.currentAnimation) {
      const animation = this.animations.get(this.currentAnimation);
      if (animation) {
        const secondsPerFrame = 1 / animation.frameRate;
        this.frameAccumulator += Time.deltaTime;

        while (this.frameAccumulator >= secondsPerFrame) {
          this.frameAccumulator -= secondsPerFrame;
          this.advanceFrame(animation);
        }
      }
    }

    this.sync();
  }

  /** Sync visual from attached transform. */
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
    if (this.transform.zIndex !== undefined) {
      this.renderObject.zIndex = this.transform.zIndex;
    }
  }

  /** Play a named animation. */
  playAnimation(name: string, forceRestart = false): void {
    if (!this.animations.has(name)) {
      console.warn(`Animation "${name}" not found`);
      return;
    }
    if (this.currentAnimation === name && this.isPlaying && !forceRestart) return;

    this.currentAnimation = name;
    this.currentFrameIndex = 0;
    this.frameAccumulator = 0;
    this.isPlaying = true;

    if (this.textureReady) this.applyFrame();
  }

  /** Stop animation on current frame. */
  stop(): void {
    this.isPlaying = false;
  }

  /** Resume playing. */
  play(): void {
    if (this.currentAnimation) this.isPlaying = true;
  }

  /** Jump to a specific frame. */
  gotoFrame(index: number, andPlay = false): void {
    if (!this.currentAnimation) return;
    const animation = this.animations.get(this.currentAnimation);
    if (!animation) return;

    this.currentFrameIndex = Math.max(0, Math.min(index, animation.frames.length - 1));
    this.frameAccumulator = 0;
    this.isPlaying = andPlay;

    if (this.textureReady) this.applyFrame();
  }

  getCurrentAnimation(): string | null {
    return this.currentAnimation;
  }

  isAnimationPlaying(): boolean {
    return this.isPlaying;
  }

  hasAnimation(name: string): boolean {
    return this.animations.has(name);
  }

  getAnimationNames(): string[] {
    return Array.from(this.animations.keys());
  }

  setSheetColumns(columns: number): void {
    this.sheetColumns = columns;
  }

  /** Manually set position. */
  setPosition(x: number, y: number): void {
    this.renderObject.setPosition(x, y);
  }

  /** Set visibility. */
  setVisible(visible: boolean): void {
    this.renderObject.setVisible(visible);
  }

  /** Destroy and remove from renderer. */
  destroy(): void {
    this.renderObject.destroy();
  }

  private onTextureLoaded(defaultAnimation?: string): void {
    this.textureReady = true;

    let maxFrame = 0;
    for (const anim of this.animations.values()) {
      for (const frame of anim.frames) {
        maxFrame = Math.max(maxFrame, frame);
      }
    }
    this.sheetColumns = Math.max(4, Math.ceil(Math.sqrt(maxFrame + 1)));

    if (defaultAnimation && this.animations.has(defaultAnimation)) {
      this.playAnimation(defaultAnimation);
    }
  }

  private advanceFrame(animation: AnimationDefinition): void {
    const nextFrameIndex = this.currentFrameIndex + 1;

    if (nextFrameIndex >= animation.frames.length) {
      if (animation.loop) {
        this.currentFrameIndex = 0;
      } else {
        this.isPlaying = false;
        this.onAnimationComplete?.(this.currentAnimation!);
        return;
      }
    } else {
      this.currentFrameIndex = nextFrameIndex;
    }

    this.applyFrame();
    this.onFrameChange?.(this.currentFrameIndex, this.currentAnimation!);
  }

  private applyFrame(): void {
    if (!this.renderObject?.setTextureRegion || !this.currentAnimation) return;

    const animation = this.animations.get(this.currentAnimation);
    if (!animation) return;

    const sheetFrameIndex = animation.frames[this.currentFrameIndex];
    const column = sheetFrameIndex % this.sheetColumns;
    const row = Math.floor(sheetFrameIndex / this.sheetColumns);
    const x = column * this.frameWidth;
    const y = row * this.frameHeight;

    this.renderObject.setTextureRegion(x, y, this.frameWidth, this.frameHeight);
  }
}
