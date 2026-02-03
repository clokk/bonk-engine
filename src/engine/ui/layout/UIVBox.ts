/**
 * UIVBox - Vertical layout container.
 *
 * Stacks children vertically with configurable gap and alignment.
 * Similar to CSS flexbox with flex-direction: column.
 *
 * Layout behavior:
 * - Children are stacked top-to-bottom
 * - Gap is added between each child
 * - Cross-axis (horizontal) alignment is controlled by `align`
 * - Padding is applied around the content area
 *
 * Example:
 * ```typescript
 * const menu = new UIVBox({
 *   gap: 8,
 *   padding: [16, 16, 16, 16],
 *   align: 'center',
 *   anchor: 'center',
 * });
 * menu.addChild(new UIText({ text: 'Title', fontSize: 24 }));
 * menu.addChild(new UIButton({ ... }));
 * menu.addChild(new UIButton({ ... }));
 * ```
 */

import { UIElement } from '../UIElement';
import type { Vector2 } from '../../types';
import type { UIPadding, UILayoutAlign, UILayoutContainerConfig } from '../types';

export class UIVBox extends UIElement {
  /** Space between children in pixels */
  private _gap: number;

  /** Inner padding [top, right, bottom, left] */
  private _padding: UIPadding;

  /** Cross-axis (horizontal) alignment of children */
  private _align: UILayoutAlign;

  constructor(config: UILayoutContainerConfig = {}) {
    super(config);

    this._gap = config.gap ?? 0;
    this._padding = config.padding ?? [0, 0, 0, 0];
    this._align = config.align ?? 'start';
  }

  // ==================== Properties ====================

  /** Get gap between children */
  get gap(): number {
    return this._gap;
  }

  /** Set gap between children */
  set gap(value: number) {
    if (this._gap === value) return;
    this._gap = value;
    this.markLayoutDirty();
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

  /** Get alignment */
  get align(): UILayoutAlign {
    return this._align;
  }

  /** Set alignment */
  set align(value: UILayoutAlign) {
    if (this._align === value) return;
    this._align = value;
    this.markLayoutDirty();
  }

  // ==================== Layout ====================

  /**
   * Measure content size (sum of child heights + gaps + padding).
   *
   * ┌─────────────────────────────────────────┐
   * │  padding-top                            │
   * │  ┌─────────────────────────────────┐    │
   * │  │ Child 1 (measured height)       │    │
   * │  └─────────────────────────────────┘    │
   * │              gap                         │
   * │  ┌─────────────────────────────────┐    │
   * │  │ Child 2 (measured height)       │    │
   * │  └─────────────────────────────────┘    │
   * │              gap                         │
   * │  ┌─────────────────────────────────┐    │
   * │  │ Child 3 (measured height)       │    │
   * │  └─────────────────────────────────┘    │
   * │  padding-bottom                         │
   * └─────────────────────────────────────────┘
   */
  protected override measureContent(): Vector2 {
    const [pt, pr, pb, pl] = this._padding;

    let totalHeight = pt + pb;
    let maxWidth = 0;

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];

      // First pass: measure each child to get their intrinsic size
      // We call layout with a temporary viewport to compute their size
      child.layout({ width: 0, height: 0 });
      const childSize = child.getComputedSize();

      totalHeight += childSize[1];
      maxWidth = Math.max(maxWidth, childSize[0]);

      // Add gap between children (not after last child)
      if (i < this.children.length - 1) {
        totalHeight += this._gap;
      }
    }

    return [maxWidth + pl + pr, totalHeight];
  }

  /**
   * Layout children vertically with gaps.
   */
  protected override layoutChildren(viewport: { width: number; height: number }): void {
    const [pt, pr, pb, pl] = this._padding;

    // Content area dimensions
    const contentWidth = this.computedSize[0] - pl - pr;

    let y = pt; // Start after top padding

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];

      // Layout child to get its size
      child.layout({ width: contentWidth, height: 0 });
      const childSize = child.getComputedSize();

      // Calculate x based on alignment
      let x = pl;
      switch (this._align) {
        case 'center':
          x = pl + (contentWidth - childSize[0]) / 2;
          break;
        case 'end':
          x = pl + contentWidth - childSize[0];
          break;
        // 'start' uses default x = pl
      }

      // Position the child - use setComputedPosition to keep hit testing in sync
      child.setComputedPosition(x, y);

      // Move y for next child
      y += childSize[1];

      // Add gap (except after last child)
      if (i < this.children.length - 1) {
        y += this._gap;
      }
    }
  }
}
