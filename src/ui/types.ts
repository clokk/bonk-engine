/**
 * UI System Type Definitions
 *
 * This file defines the core types for the Bonk Engine UI system.
 * UI elements render in screen-space (unaffected by camera transforms).
 */

import type { Vector2 } from '../types';

/**
 * Anchor points define where a UI element attaches to the screen or its parent.
 *
 * ┌─────────────────────────────────────────┐
 * │ top-left     top-center     top-right   │
 * │                                         │
 * │ center-left    center    center-right   │
 * │                                         │
 * │ bottom-left bottom-center bottom-right  │
 * └─────────────────────────────────────────┘
 *
 * The anchor determines both:
 * 1. Where on the parent/screen the element attaches
 * 2. Which point of the element is used for positioning
 *
 * Example: anchor='bottom-right' + offset=[20, 20]
 * → Element's bottom-right corner is 20px from screen's bottom-right
 */
export type UIAnchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Padding values as [top, right, bottom, left] - CSS box model order.
 */
export type UIPadding = [number, number, number, number];

/**
 * Base configuration shared by all UI elements.
 */
export interface UIElementConfig {
  /** Unique identifier (auto-generated if not provided) */
  id?: string;
  /** Human-readable name for debugging */
  name?: string;
  /** Anchor point for positioning */
  anchor?: UIAnchor;
  /** Offset from anchor point in pixels [x, y] */
  offset?: Vector2;
  /** Explicit size in pixels [width, height]. 0 = auto-size to content */
  size?: Vector2;
  /** Whether the element is visible */
  visible?: boolean;
  /** Opacity (0-1) */
  alpha?: number;
  /** Render order (higher = on top) */
  zIndex?: number;
}

/**
 * Configuration for UIText elements.
 */
export interface UITextConfig extends UIElementConfig {
  /** Text content to display */
  text?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Font family */
  fontFamily?: string;
  /** Text color (CSS color string or hex number) */
  color?: string | number;
  /** Font weight */
  fontWeight?: 'normal' | 'bold' | number;
  /** Text alignment for multi-line text */
  align?: 'left' | 'center' | 'right';
  /** Word wrap width (0 = no wrap) */
  wordWrapWidth?: number;
}

/**
 * Configuration for UIImage elements.
 */
export interface UIImageConfig extends UIElementConfig {
  /** Image source path */
  src?: string;
  /** Explicit width (uses image width if not specified) */
  width?: number;
  /** Explicit height (uses image height if not specified) */
  height?: number;
  /** Tint color */
  tint?: number;
}

/**
 * Configuration for UIPanel elements (background containers).
 */
export interface UIPanelConfig extends UIElementConfig {
  /** Background color */
  backgroundColor?: number;
  /** Border color */
  borderColor?: number;
  /** Border width in pixels */
  borderWidth?: number;
  /** Corner radius for rounded rectangles */
  borderRadius?: number;
  /** Inner padding [top, right, bottom, left] */
  padding?: UIPadding;
}

/**
 * Button interaction state.
 */
export type UIButtonState = 'normal' | 'hover' | 'pressed' | 'disabled';

/**
 * Configuration for UIButton elements.
 */
export interface UIButtonConfig extends UIPanelConfig {
  /** Click handler */
  onClick?: () => void;
  /** Color when hovered */
  hoverColor?: number;
  /** Color when pressed */
  pressedColor?: number;
  /** Color when disabled */
  disabledColor?: number;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * Alignment for items within layout containers.
 */
export type UILayoutAlign = 'start' | 'center' | 'end';

/**
 * Configuration for VBox/HBox layout containers.
 */
export interface UILayoutContainerConfig extends UIElementConfig {
  /** Space between children in pixels */
  gap?: number;
  /** Inner padding [top, right, bottom, left] */
  padding?: UIPadding;
  /** Cross-axis alignment of children */
  align?: UILayoutAlign;
}

/**
 * Pointer event data passed to UI event handlers.
 */
export interface UIPointerEvent {
  /** Screen position of pointer */
  position: Vector2;
  /** Which mouse button (0=left, 1=middle, 2=right) */
  button: number;
  /** Whether the event was consumed (stops propagation) */
  consumed: boolean;
}
