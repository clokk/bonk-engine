/**
 * UIManager - Central manager for the UI system.
 *
 * Responsibilities:
 * 1. Manage root UI elements (add/remove)
 * 2. Run layout passes each frame
 * 3. Process input BEFORE game (so UI can consume clicks)
 * 4. Track hover/pressed state for interactive elements
 *
 * Usage:
 * ```typescript
 * const ui = new UIManager(renderer);
 * ui.addRoot(myPanel);
 *
 * // In game loop:
 * const consumed = ui.processInput();
 * if (!consumed) {
 *   // Handle game input
 * }
 * ui.update();
 * ui.layout();
 * ```
 */

import type { Renderer } from '../rendering/Renderer';
import type { Vector2 } from '../types';
import type { UIPointerEvent } from './types';
import { UIElement } from './UIElement';
import { Input } from '../Input';

/**
 * Interface for elements that can receive pointer events.
 * Implemented by UIButton and other interactive elements.
 */
export interface UIInteractive {
  /** Called when pointer enters element bounds */
  onPointerEnter?(event: UIPointerEvent): void;
  /** Called when pointer exits element bounds */
  onPointerExit?(event: UIPointerEvent): void;
  /** Called when pointer button is pressed on element */
  onPointerDown?(event: UIPointerEvent): void;
  /** Called when pointer button is released on element */
  onPointerUp?(event: UIPointerEvent): void;
}

/**
 * Type guard to check if an element is interactive.
 */
function isInteractive(element: UIElement): element is UIElement & UIInteractive {
  return (
    'onPointerEnter' in element ||
    'onPointerExit' in element ||
    'onPointerDown' in element ||
    'onPointerUp' in element
  );
}

export class UIManager {
  /** Root UI elements (not parented to other UI elements) */
  private roots: UIElement[] = [];

  /** Reference to the renderer for viewport size */
  private renderer: Renderer;

  /** Currently hovered element */
  private hoveredElement: UIElement | null = null;

  /** Currently pressed element (mouse button held) */
  private pressedElement: UIElement | null = null;

  /** Whether the UI system is active */
  private active: boolean = true;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  // ==================== Root Management ====================

  /**
   * Add a root UI element.
   * Root elements are positioned relative to the screen.
   */
  addRoot(element: UIElement): void {
    if (this.roots.includes(element)) {
      console.warn(`UIElement ${element.id} is already a root`);
      return;
    }

    this.roots.push(element);

    // Add to renderer's UI container
    this.renderer.addToUI(element.getDisplayObject());

    // Call lifecycle hook
    element.awake();
  }

  /**
   * Remove a root UI element.
   */
  removeRoot(element: UIElement): void {
    const index = this.roots.indexOf(element);
    if (index === -1) return;

    this.roots.splice(index, 1);

    // Remove from renderer's UI container
    this.renderer.removeFromUI(element.getDisplayObject());

    // Call lifecycle hook
    element.onDestroy();
  }

  /**
   * Get all root elements.
   */
  getRoots(): readonly UIElement[] {
    return this.roots;
  }

  // ==================== Input Processing ====================

  /**
   * Process input events for the UI.
   * Call this BEFORE game input processing.
   *
   * @returns true if UI consumed the input (game should ignore it)
   */
  processInput(): boolean {
    if (!this.active) return false;

    const mousePos = Input.mousePosition;
    let consumed = false;

    // Find what we're hovering over
    const hitElement = this.hitTestAll(mousePos);

    // Handle hover state changes
    if (hitElement !== this.hoveredElement) {
      // Exit previous
      if (this.hoveredElement && isInteractive(this.hoveredElement)) {
        const event = this.createPointerEvent(mousePos);
        this.hoveredElement.onPointerExit?.(event);
      }

      // Enter new
      if (hitElement && isInteractive(hitElement)) {
        const event = this.createPointerEvent(mousePos);
        hitElement.onPointerEnter?.(event);
      }

      this.hoveredElement = hitElement;
    }

    // Handle mouse button down
    if (Input.getMouseButtonDown(0)) {
      if (hitElement && isInteractive(hitElement)) {
        this.pressedElement = hitElement;
        const event = this.createPointerEvent(mousePos, 0);
        hitElement.onPointerDown?.(event);
        consumed = event.consumed || true;
      }
    }

    // Handle mouse button up
    if (Input.getMouseButtonUp(0)) {
      if (this.pressedElement && isInteractive(this.pressedElement)) {
        const event = this.createPointerEvent(mousePos, 0);
        this.pressedElement.onPointerUp?.(event);
        consumed = event.consumed || consumed;
      }
      this.pressedElement = null;
    }

    // If we're hovering over UI, consume input to prevent game from receiving it
    if (hitElement) {
      consumed = true;
    }

    return consumed;
  }

  /**
   * Hit test all root elements.
   * Returns the topmost element at the given point.
   */
  private hitTestAll(point: Vector2): UIElement | null {
    // Test roots in reverse order (later roots are on top)
    const sortedRoots = [...this.roots].sort((a, b) => b.zIndex - a.zIndex);
    for (const root of sortedRoots) {
      const hit = root.hitTest(point);
      if (hit) return hit;
    }
    return null;
  }

  /**
   * Create a pointer event object.
   */
  private createPointerEvent(position: Vector2, button: number = 0): UIPointerEvent {
    return {
      position: [...position],
      button,
      consumed: false,
    };
  }

  // ==================== Update & Layout ====================

  /**
   * Update all UI elements.
   * Call once per frame.
   */
  update(): void {
    if (!this.active) return;

    for (const root of this.roots) {
      this.updateElement(root);
    }
  }

  /**
   * Recursively update an element and its children.
   */
  private updateElement(element: UIElement): void {
    element.update();
    for (const child of element.getChildren()) {
      this.updateElement(child);
    }
  }

  /**
   * Run layout pass on all root elements.
   * Call once per frame after update.
   */
  layout(): void {
    if (!this.active) return;

    const viewport = this.renderer.getViewportSize();

    for (const root of this.roots) {
      root.layout(viewport);
    }
  }

  // ==================== Lifecycle ====================

  /**
   * Enable or disable the UI system.
   */
  setActive(active: boolean): void {
    this.active = active;
  }

  /**
   * Check if the UI system is active.
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Destroy the UI manager and all root elements.
   */
  destroy(): void {
    for (const root of [...this.roots]) {
      root.destroy();
      this.renderer.removeFromUI(root.getDisplayObject());
    }
    this.roots = [];
    this.hoveredElement = null;
    this.pressedElement = null;
  }

  // ==================== Utilities ====================

  /**
   * Find a UI element by ID.
   */
  findById(id: string): UIElement | null {
    for (const root of this.roots) {
      const found = this.findByIdInTree(root, id);
      if (found) return found;
    }
    return null;
  }

  /**
   * Recursively search for an element by ID.
   */
  private findByIdInTree(element: UIElement, id: string): UIElement | null {
    if (element.id === id) return element;
    for (const child of element.getChildren()) {
      const found = this.findByIdInTree(child, id);
      if (found) return found;
    }
    return null;
  }

  /**
   * Find a UI element by name.
   */
  findByName(name: string): UIElement | null {
    for (const root of this.roots) {
      const found = this.findByNameInTree(root, name);
      if (found) return found;
    }
    return null;
  }

  /**
   * Recursively search for an element by name.
   */
  private findByNameInTree(element: UIElement, name: string): UIElement | null {
    if (element.name === name) return element;
    for (const child of element.getChildren()) {
      const found = this.findByNameInTree(child, name);
      if (found) return found;
    }
    return null;
  }
}
