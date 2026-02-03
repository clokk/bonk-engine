/**
 * UIHBox - Horizontal layout container.
 *
 * Stacks children horizontally with configurable gap and alignment.
 * Similar to CSS flexbox with flex-direction: row.
 *
 * Layout behavior:
 * - Children are stacked left-to-right
 * - Gap is added between each child
 * - Cross-axis (vertical) alignment is controlled by `align`
 * - Padding is applied around the content area
 *
 * Example:
 * ```typescript
 * const healthBar = new UIHBox({
 *   gap: 8,
 *   align: 'center',
 * });
 * healthBar.addChild(new UIImage({ src: './ui/heart.png', width: 24, height: 24 }));
 * healthBar.addChild(new UIText({ text: '100', fontSize: 18, color: '#ff6666' }));
 * ```
 */

import { UIElement } from '../UIElement';
import type { Vector2 } from '../../types';
import type { UIPadding, UILayoutAlign, UILayoutContainerConfig } from '../types';

export class UIHBox extends UIElement {
  /** Space between children in pixels */
  private _gap: number;

  /** Inner padding [top, right, bottom, left] */
  private _padding: UIPadding;

  /** Cross-axis (vertical) alignment of children */
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
   * Measure content size (sum of child widths + gaps + padding).
   *
   * ┌───────────────────────────────────────────────────────────┐
   * │ pl │ Child1 │ gap │ Child2 │ gap │ Child3 │ pr           │
   * └───────────────────────────────────────────────────────────┘
   *        └─────────────────────────────────────┘
   *                    content area
   */
  protected override measureContent(): Vector2 {
    const [pt, pr, pb, pl] = this._padding;

    let totalWidth = pl + pr;
    let maxHeight = 0;

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];

      // First pass: measure each child to get their intrinsic size
      child.layout({ width: 0, height: 0 });
      const childSize = child.getComputedSize();

      totalWidth += childSize[0];
      maxHeight = Math.max(maxHeight, childSize[1]);

      // Add gap between children (not after last child)
      if (i < this.children.length - 1) {
        totalWidth += this._gap;
      }
    }

    return [totalWidth, maxHeight + pt + pb];
  }

  /**
   * Layout children horizontally with gaps.
   */
  protected override layoutChildren(viewport: { width: number; height: number }): void {
    const [pt, pr, pb, pl] = this._padding;

    // Content area dimensions
    const contentHeight = this.computedSize[1] - pt - pb;

    let x = pl; // Start after left padding

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];

      // Layout child to get its size
      child.layout({ width: 0, height: contentHeight });
      const childSize = child.getComputedSize();

      // Calculate y based on alignment
      let y = pt;
      switch (this._align) {
        case 'center':
          y = pt + (contentHeight - childSize[1]) / 2;
          break;
        case 'end':
          y = pt + contentHeight - childSize[1];
          break;
        // 'start' uses default y = pt
      }

      // Position the child - use setComputedPosition to keep hit testing in sync
      child.setComputedPosition(x, y);

      // Move x for next child
      x += childSize[0];

      // Add gap (except after last child)
      if (i < this.children.length - 1) {
        x += this._gap;
      }
    }
  }
}
