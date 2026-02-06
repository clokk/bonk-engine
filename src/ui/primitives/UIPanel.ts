/**
 * UIPanel - Background panel UI element.
 *
 * A container with optional background, border, and rounded corners.
 * Children are positioned inside the padding area.
 *
 * Example:
 * ```typescript
 * const panel = new UIPanel({
 *   backgroundColor: 0x333333,
 *   borderColor: 0x666666,
 *   borderWidth: 2,
 *   borderRadius: 8,
 *   padding: [10, 15, 10, 15], // top, right, bottom, left
 *   anchor: 'top-left',
 *   offset: [20, 20],
 * });
 * ```
 */

import { Graphics } from 'pixi.js';
import { UIElement } from '../UIElement';
import type { Vector2 } from '../../types';
import type { UIPadding, UIPanelConfig } from '../types';

export class UIPanel extends UIElement {
  /** The PixiJS Graphics for background rendering */
  protected background: Graphics;

  /** Background color (protected for subclass access) */
  protected _backgroundColor: number;

  /** Border color */
  private _borderColor: number;

  /** Border width in pixels */
  private _borderWidth: number;

  /** Corner radius for rounded rectangles */
  private _borderRadius: number;

  /** Inner padding [top, right, bottom, left] */
  private _padding: UIPadding;

  constructor(config: UIPanelConfig = {}) {
    super(config);

    this._backgroundColor = config.backgroundColor ?? 0x333333;
    this._borderColor = config.borderColor ?? 0x000000;
    this._borderWidth = config.borderWidth ?? 0;
    this._borderRadius = config.borderRadius ?? 0;
    this._padding = config.padding ?? [0, 0, 0, 0];

    // Create background graphics (added first so children render on top)
    this.background = new Graphics();
    this.background.zIndex = -1; // Ensure it's behind children
    this.displayObject.addChild(this.background);
  }

  // ==================== Properties ====================

  /** Get background color */
  get backgroundColor(): number {
    return this._backgroundColor;
  }

  /** Set background color */
  set backgroundColor(value: number) {
    if (this._backgroundColor === value) return;
    this._backgroundColor = value;
    this.redrawBackground();
  }

  /** Get border color */
  get borderColor(): number {
    return this._borderColor;
  }

  /** Set border color */
  set borderColor(value: number) {
    if (this._borderColor === value) return;
    this._borderColor = value;
    this.redrawBackground();
  }

  /** Get border width */
  get borderWidth(): number {
    return this._borderWidth;
  }

  /** Set border width */
  set borderWidth(value: number) {
    if (this._borderWidth === value) return;
    this._borderWidth = value;
    this.redrawBackground();
    this.markLayoutDirty();
  }

  /** Get border radius */
  get borderRadius(): number {
    return this._borderRadius;
  }

  /** Set border radius */
  set borderRadius(value: number) {
    if (this._borderRadius === value) return;
    this._borderRadius = value;
    this.redrawBackground();
  }

  /** Get padding */
  get padding(): UIPadding {
    return [...this._padding] as UIPadding;
  }

  /** Set padding [top, right, bottom, left] */
  set padding(value: UIPadding) {
    this._padding = [...value] as UIPadding;
    this.markLayoutDirty();
  }

  // ==================== Internal ====================

  /**
   * Get the inner bounds (after padding).
   */
  getInnerBounds(): { x: number; y: number; width: number; height: number } {
    const [pt, pr, pb, pl] = this._padding;
    return {
      x: pl,
      y: pt,
      width: Math.max(0, this.computedSize[0] - pl - pr),
      height: Math.max(0, this.computedSize[1] - pt - pb),
    };
  }

  /**
   * Redraw the background graphics.
   */
  protected redrawBackground(): void {
    const [w, h] = this.computedSize;
    if (w <= 0 || h <= 0) return;

    this.background.clear();

    // Draw border if present
    if (this._borderWidth > 0) {
      this.background.roundRect(0, 0, w, h, this._borderRadius);
      this.background.fill(this._borderColor);

      // Draw inner fill
      const bw = this._borderWidth;
      const innerRadius = Math.max(0, this._borderRadius - bw);
      this.background.roundRect(bw, bw, w - bw * 2, h - bw * 2, innerRadius);
      this.background.fill(this._backgroundColor);
    } else {
      // Just fill
      this.background.roundRect(0, 0, w, h, this._borderRadius);
      this.background.fill(this._backgroundColor);
    }
  }

  // ==================== Layout ====================

  /**
   * Measure content size (size needed to contain children + padding).
   */
  protected override measureContent(): Vector2 {
    const [pt, pr, pb, pl] = this._padding;

    // Find bounding box of all children
    let maxRight = 0;
    let maxBottom = 0;

    for (const child of this.children) {
      const childSize = child.getComputedSize();
      const childPos = child.getComputedPosition();

      // Children position relative to our content area
      maxRight = Math.max(maxRight, childPos[0] + childSize[0]);
      maxBottom = Math.max(maxBottom, childPos[1] + childSize[1]);
    }

    // Add padding
    return [maxRight + pl + pr, maxBottom + pt + pb];
  }

  /**
   * Override layout to position children within padding and redraw background.
   */
  override layout(viewport: { width: number; height: number }): void {
    super.layout(viewport);
    this.redrawBackground();
  }

  /**
   * Layout children within the padded content area.
   */
  protected override layoutChildren(viewport: { width: number; height: number }): void {
    const inner = this.getInnerBounds();

    for (const child of this.children) {
      // Each child gets the inner bounds as its viewport
      child.layout({ width: inner.width, height: inner.height });

      // Offset child position by padding - update BOTH displayObject AND computedPosition
      // This ensures hit testing works correctly for nested elements
      const childDisplay = child.getDisplayObject();
      childDisplay.position.x += inner.x;
      childDisplay.position.y += inner.y;

      // Also update the child's computed position for hit testing
      child.offsetComputedPosition(inner.x, inner.y);
    }
  }
}
