/**
 * UIElement - Base class for all UI elements in Bonk Engine.
 *
 * UIElement is a SEPARATE hierarchy from Component/Behavior:
 * - Components attach to GameObjects and live in world-space
 * - UIElements render in screen-space, unaffected by camera
 *
 * WHY not extend Component?
 * - UI doesn't need world-space transforms or physics
 * - Screen-space anchoring is fundamentally different from game positioning
 * - Cleaner separation of concerns
 *
 * Layout System:
 * - Elements have an anchor (where they attach) and offset (pixels from anchor)
 * - Parent elements can override child positioning (VBox, HBox)
 * - Layout is computed each frame, flowing from roots down to leaves
 */

import { Container } from 'pixi.js';
import type { Vector2 } from '../types';
import type { UIAnchor, UIElementConfig } from './types';

/** Counter for auto-generating unique IDs */
let nextId = 1;

/**
 * Abstract base class for all UI elements.
 *
 * Subclasses must:
 * 1. Call super() with config
 * 2. Create their PixiJS displayObject in constructor
 * 3. Override measureContent() to return intrinsic size
 * 4. Optionally override update() for per-frame logic
 */
export abstract class UIElement {
  // ==================== Identity ====================

  /** Unique identifier for this element */
  readonly id: string;

  /** Human-readable name for debugging */
  name: string;

  // ==================== Positioning ====================

  /**
   * Anchor point determines where the element attaches to its parent/screen.
   *
   * The anchor affects both:
   * 1. Which point on the parent/screen we measure from
   * 2. Which point on this element is placed at that location
   *
   * Example: anchor='bottom-right' means:
   * - Reference the parent's bottom-right corner
   * - Place this element's bottom-right corner there
   * - Offset moves the element up and left (into the parent)
   */
  anchor: UIAnchor = 'top-left';

  /**
   * Pixel offset from the anchor point.
   * Positive values move right/down from the anchor.
   */
  offset: Vector2 = [0, 0];

  /**
   * Requested size in pixels [width, height].
   * 0 = auto-size to content (uses measureContent())
   */
  size: Vector2 = [0, 0];

  // ==================== Computed Layout ====================

  /**
   * Computed position after layout pass (screen coordinates).
   * Set by parent or UIManager during layout().
   */
  protected computedPosition: Vector2 = [0, 0];

  /**
   * Computed size after layout pass.
   * Either explicit size or measureContent() result.
   */
  protected computedSize: Vector2 = [0, 0];

  // ==================== Visual Properties ====================

  /** Whether this element is visible */
  visible: boolean = true;

  /** Opacity (0-1) */
  alpha: number = 1;

  /** Render order within parent (higher = on top) */
  zIndex: number = 0;

  // ==================== Hierarchy ====================

  /** Parent element (null for root elements) */
  parent: UIElement | null = null;

  /** Child elements */
  protected children: UIElement[] = [];

  // ==================== PixiJS ====================

  /**
   * The PixiJS container for this element.
   * Subclasses add their visual content (Graphics, Text, Sprite) to this.
   */
  protected displayObject: Container;

  // ==================== Layout State ====================

  /**
   * Whether layout needs to be recalculated.
   * Set to true when properties change that affect layout.
   */
  protected layoutDirty: boolean = true;

  // ==================== Constructor ====================

  constructor(config: UIElementConfig = {}) {
    this.id = config.id ?? `ui_${nextId++}`;
    this.name = config.name ?? this.id;

    if (config.anchor !== undefined) this.anchor = config.anchor;
    if (config.offset !== undefined) this.offset = [...config.offset];
    if (config.size !== undefined) this.size = [...config.size];
    if (config.visible !== undefined) this.visible = config.visible;
    if (config.alpha !== undefined) this.alpha = config.alpha;
    if (config.zIndex !== undefined) this.zIndex = config.zIndex;

    // Create the container - subclasses add their content to this
    this.displayObject = new Container();
    this.displayObject.sortableChildren = true;
  }

  // ==================== Lifecycle ====================

  /**
   * Called when the element is first added to the UI hierarchy.
   * Override to perform one-time initialization.
   */
  awake(): void {}

  /**
   * Called every frame.
   * Override for per-frame logic (animations, state updates).
   */
  update(): void {}

  /**
   * Called when the element is removed from the UI hierarchy.
   * Override to clean up resources.
   */
  onDestroy(): void {}

  // ==================== Hierarchy Management ====================

  /**
   * Add a child element.
   */
  addChild(child: UIElement): void {
    if (child.parent) {
      child.parent.removeChild(child);
    }

    child.parent = this;
    this.children.push(child);
    this.displayObject.addChild(child.displayObject);

    child.awake();
    this.markLayoutDirty();
  }

  /**
   * Remove a child element.
   */
  removeChild(child: UIElement): void {
    const index = this.children.indexOf(child);
    if (index === -1) return;

    child.onDestroy();
    child.parent = null;
    this.children.splice(index, 1);
    this.displayObject.removeChild(child.displayObject);

    this.markLayoutDirty();
  }

  /**
   * Remove all children.
   */
  removeAllChildren(): void {
    for (const child of [...this.children]) {
      this.removeChild(child);
    }
  }

  /**
   * Get all children.
   */
  getChildren(): readonly UIElement[] {
    return this.children;
  }

  /**
   * Get the PixiJS display object.
   * Used by UIManager to add to render tree.
   */
  getDisplayObject(): Container {
    return this.displayObject;
  }

  // ==================== Layout ====================

  /**
   * Mark this element and its ancestors as needing layout recalculation.
   */
  markLayoutDirty(): void {
    this.layoutDirty = true;
    if (this.parent) {
      this.parent.markLayoutDirty();
    }
  }

  /**
   * Measure the intrinsic content size.
   * Override in subclasses to return the natural size of the content.
   *
   * Examples:
   * - UIText: Returns the text bounds
   * - UIImage: Returns the image dimensions
   * - UIPanel: Returns size needed to contain children + padding
   *
   * @returns [width, height] in pixels
   */
  protected measureContent(): Vector2 {
    return [0, 0];
  }

  /**
   * Compute layout for this element and its children.
   * Called by UIManager each frame on root elements.
   *
   * @param viewport - The available space (screen or parent bounds)
   */
  layout(viewport: { width: number; height: number }): void {
    // Step 1: Determine our size
    const contentSize = this.measureContent();
    this.computedSize = [
      this.size[0] > 0 ? this.size[0] : contentSize[0],
      this.size[1] > 0 ? this.size[1] : contentSize[1],
    ];

    // Step 2: Compute position based on anchor
    this.computedPosition = this.computeAnchoredPosition(viewport);

    // Step 3: Apply to PixiJS display object
    this.displayObject.position.set(this.computedPosition[0], this.computedPosition[1]);
    this.displayObject.alpha = this.alpha;
    this.displayObject.visible = this.visible;
    this.displayObject.zIndex = this.zIndex;

    // Step 4: Layout children (can be overridden by layout containers)
    this.layoutChildren(viewport);

    this.layoutDirty = false;
  }

  /**
   * Layout child elements.
   * Override in VBox/HBox to implement custom layout logic.
   */
  protected layoutChildren(viewport: { width: number; height: number }): void {
    for (const child of this.children) {
      // Children use our computed bounds as their viewport
      child.layout({
        width: this.computedSize[0],
        height: this.computedSize[1],
      });
    }
  }

  /**
   * Compute position based on anchor point and offset.
   *
   * The anchor system works like this:
   * ┌─────────────────────────────────────────┐
   * │ (0,0)           (w/2,0)           (w,0) │
   * │ top-left      top-center      top-right │
   * │                                         │
   * │ (0,h/2)       (w/2,h/2)       (w,h/2)   │
   * │ center-left    center    center-right   │
   * │                                         │
   * │ (0,h)         (w/2,h)         (w,h)     │
   * │ bottom-left bottom-center bottom-right  │
   * └─────────────────────────────────────────┘
   */
  protected computeAnchoredPosition(viewport: { width: number; height: number }): Vector2 {
    const { width: vw, height: vh } = viewport;
    const [ew, eh] = this.computedSize;
    const [ox, oy] = this.offset;

    let x = 0;
    let y = 0;

    // Horizontal anchor
    if (this.anchor.includes('left')) {
      x = ox;
    } else if (this.anchor.includes('right')) {
      x = vw - ew - ox;
    } else {
      // center
      x = (vw - ew) / 2 + ox;
    }

    // Vertical anchor
    if (this.anchor.includes('top')) {
      y = oy;
    } else if (this.anchor.includes('bottom')) {
      y = vh - eh - oy;
    } else {
      // center
      y = (vh - eh) / 2 + oy;
    }

    return [x, y];
  }

  // ==================== Hit Testing ====================

  /**
   * Get the world/screen position of this element.
   *
   * For nested elements, computedPosition is in LOCAL coordinates (relative to parent).
   * This method walks up the parent chain to compute the absolute screen position.
   *
   * Example:
   * - Panel at screen position (600, 400)
   *   - Button at local position (10, 10)
   *   - Button's world position = (610, 410)
   */
  getWorldPosition(): Vector2 {
    let worldX = this.computedPosition[0];
    let worldY = this.computedPosition[1];

    // Walk up parent chain, accumulating positions
    let current = this.parent;
    while (current) {
      worldX += current.computedPosition[0];
      worldY += current.computedPosition[1];
      current = current.parent;
    }

    return [worldX, worldY];
  }

  /**
   * Check if a screen point is inside this element's bounds.
   * Uses world position for accurate hit testing of nested elements.
   */
  containsPoint(point: Vector2): boolean {
    if (!this.visible) return false;

    const [px, py] = point;
    const [x, y] = this.getWorldPosition();
    const [w, h] = this.computedSize;

    return px >= x && px <= x + w && py >= y && py <= y + h;
  }

  /**
   * Find the topmost element at a screen point.
   * Searches children first (in reverse z-order) then self.
   */
  hitTest(point: Vector2): UIElement | null {
    if (!this.visible) return null;

    // Test children in reverse order (highest z-index first)
    const sortedChildren = [...this.children].sort((a, b) => b.zIndex - a.zIndex);
    for (const child of sortedChildren) {
      const hit = child.hitTest(point);
      if (hit) return hit;
    }

    // Test self
    if (this.containsPoint(point)) {
      return this;
    }

    return null;
  }

  // ==================== Getters ====================

  /** Get computed position after layout */
  getComputedPosition(): Vector2 {
    return [...this.computedPosition];
  }

  /**
   * Offset the computed position after layout.
   * Used by layout containers (UIPanel) to adjust child positions for padding.
   * This keeps computedPosition in sync with displayObject.position.
   */
  offsetComputedPosition(dx: number, dy: number): void {
    this.computedPosition[0] += dx;
    this.computedPosition[1] += dy;
  }

  /**
   * Set the computed position directly.
   * Used by layout containers (UIVBox, UIHBox) that completely override child positioning.
   * Also updates the displayObject position.
   */
  setComputedPosition(x: number, y: number): void {
    this.computedPosition[0] = x;
    this.computedPosition[1] = y;
    this.displayObject.position.set(x, y);
  }

  /** Get computed size after layout */
  getComputedSize(): Vector2 {
    return [...this.computedSize];
  }

  /** Get computed bounds as {x, y, width, height} */
  getComputedBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.computedPosition[0],
      y: this.computedPosition[1],
      width: this.computedSize[0],
      height: this.computedSize[1],
    };
  }

  // ==================== Destruction ====================

  /**
   * Destroy this element and all children.
   */
  destroy(): void {
    // Destroy children first
    for (const child of [...this.children]) {
      child.destroy();
    }
    this.children = [];

    // Call lifecycle hook
    this.onDestroy();

    // Remove from parent
    if (this.parent) {
      this.parent.removeChild(this);
    }

    // Destroy PixiJS display object
    this.displayObject.destroy({ children: true });
  }
}
