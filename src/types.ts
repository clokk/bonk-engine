/**
 * Shared type definitions for Bonk Engine.
 */

// === Math Types ===

/** 2D vector as tuple [x, y] */
export type Vector2 = [number, number];

/** 2D vector with optional z for layering */
export type Vector3 = [number, number, number];

/** RGBA color as tuple [r, g, b, a] with values 0-1 */
export type Color = [number, number, number, number];

/** Hex color string */
export type HexColor = string;

/** Color can be specified as hex or RGBA tuple */
export type ColorValue = string | Color;

// === Input Types ===

/** Configuration for an axis (e.g., horizontal, vertical) */
export interface AxisConfig {
  /** Keys that contribute -1 to this axis */
  negative: string[];
  /** Keys that contribute +1 to this axis */
  positive: string[];
  /** Smoothing factor (0 = instant, higher = smoother). Default: 10 */
  smoothing?: number;
}

/** Configuration for a button (e.g., jump, fire) */
export interface ButtonConfig {
  /** Keys that trigger this button. Use "Mouse0", "Mouse1", "Mouse2" for mouse buttons */
  keys: string[];
}

/** Full input configuration */
export interface InputConfig {
  axes: Record<string, AxisConfig>;
  buttons: Record<string, ButtonConfig>;
}

// === Transform Types ===

/** Transform data for positioning */
export interface TransformJson {
  position: Vector2;
  rotation: number;
  scale: Vector2;
  zIndex?: number;
}

// === Physics Types ===

/** Physics body types */
export type BodyType = 'dynamic' | 'static' | 'kinematic';

/** Collider shapes */
export type ColliderShape =
  | { type: 'box'; width: number; height: number }
  | { type: 'circle'; radius: number }
  | { type: 'polygon'; vertices: Vector2[] };
