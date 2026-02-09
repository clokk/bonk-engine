/**
 * Tweaker devtools — type definitions
 */

/** Hint for how to render a field that can't be auto-detected */
export type FieldHint = 'color' | 'readonly';

/** Options passed to Tweaker.register() */
export interface RegisterOptions {
  /** Per-field rendering hints (key = field name or dot path for nested) */
  hints?: Record<string, FieldHint>;
  /** Start this group collapsed (default: false) */
  collapsed?: boolean;
}

/** Configuration for Tweaker.init() */
export interface TweakerConfig {
  /** KeyboardEvent.code for toggle key (default: 'Backquote') */
  hotkey?: string;
  /** Panel side (default: 'right') */
  position?: 'left' | 'right';
  /** Panel width in px (default: 360) */
  width?: number;
  /** localStorage key prefix (default: 'bonk-tweaker') */
  storagePrefix?: string;
  /** Color theme (default: 'amber') */
  theme?: TweakerTheme;
}

/** Internal representation of a registered constant group */
export interface GroupEntry {
  name: string;
  target: Record<string, unknown>;
  defaults: Record<string, unknown>;
  options: RegisterOptions;
}

/** Detected field type for rendering */
export type FieldType = 'number' | 'color' | 'boolean' | 'object' | 'readonly';

/** Available tweaker color themes */
export type TweakerTheme = 'amber' | 'lime' | 'spring';
