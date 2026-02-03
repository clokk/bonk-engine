/**
 * Core math types for the Bonk Engine.
 */

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
