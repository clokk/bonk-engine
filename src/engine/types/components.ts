/**
 * Component type definitions for Bonk Engine.
 * These define the JSON schema for each built-in component.
 */

import type { Vector2, ColorValue } from './math';

/** Base component interface - all components extend this */
export interface ComponentJson {
  type: string;
}

/** Sprite component - renders a 2D image */
export interface SpriteJson extends ComponentJson {
  type: 'Sprite';
  src: string;
  anchor?: Vector2;
  tint?: ColorValue;
  alpha?: number;
  flipX?: boolean;
  flipY?: boolean;
}

/** Animated sprite component - plays sprite sheet animations */
export interface AnimatedSpriteJson extends ComponentJson {
  type: 'AnimatedSprite';
  src: string;
  frameWidth: number;
  frameHeight: number;
  animations: Record<string, {
    frames: number[];
    frameRate?: number;
    loop?: boolean;
  }>;
  defaultAnimation?: string;
  anchor?: Vector2;
}

/** Physics body types */
export type BodyType = 'dynamic' | 'static' | 'kinematic';

/** RigidBody2D component - physics body */
export interface RigidBody2DJson extends ComponentJson {
  type: 'RigidBody2D';
  bodyType: BodyType;
  mass?: number;
  friction?: number;
  restitution?: number;
  linearDamping?: number;
  angularDamping?: number;
  fixedRotation?: boolean;
  bullet?: boolean;
  gravityScale?: number;
}

/** Collider shapes */
export type ColliderShape =
  | { type: 'box'; width: number; height: number }
  | { type: 'circle'; radius: number }
  | { type: 'polygon'; vertices: Vector2[] };

/** Collider2D component - collision detection */
export interface Collider2DJson extends ComponentJson {
  type: 'Collider2D';
  shape: ColliderShape;
  isTrigger?: boolean;
  offset?: Vector2;
  layer?: string;
  mask?: string[];
}

/** Camera2D component - viewport control */
export interface Camera2DJson extends ComponentJson {
  type: 'Camera2D';
  zoom?: number;
  isMain?: boolean;
  target?: string;
  followSmoothing?: number;
  offset?: Vector2;
  bounds?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  deadzone?: {
    width: number;
    height: number;
  };
}

/** Camera component - viewport control (legacy, use Camera2D) */
export interface CameraJson extends ComponentJson {
  type: 'Camera';
  zoom?: number;
  backgroundColor?: ColorValue;
  isMain?: boolean;
}

/** AudioSource component - plays sounds */
export interface AudioSourceJson extends ComponentJson {
  type: 'AudioSource';
  src?: string;
  volume?: number;
  loop?: boolean;
  playOnAwake?: boolean;
  /** Volume category: 'music' or 'sfx' */
  category?: 'music' | 'sfx';
  spatial?: boolean;
  minDistance?: number;
  maxDistance?: number;
}

/** ParticleEmitter component - particle effects */
export interface ParticleEmitterJson extends ComponentJson {
  type: 'ParticleEmitter';
  texture?: string;
  maxParticles?: number;
  emissionRate?: number;
  lifetime?: Vector2;
  speed?: Vector2;
  angle?: Vector2;
  scale?: Vector2;
  alpha?: Vector2;
  color?: ColorValue;
  gravity?: Vector2;
  playOnAwake?: boolean;
}

/** TileMap component - renders tile-based maps */
export interface TileMapJson extends ComponentJson {
  type: 'TileMap';
  src: string;
  tileWidth: number;
  tileHeight: number;
}

/** Text component - renders text */
export interface TextJson extends ComponentJson {
  type: 'Text';
  text: string;
  fontFamily?: string;
  fontSize?: number;
  color?: ColorValue;
  align?: 'left' | 'center' | 'right';
  wordWrap?: boolean;
  wordWrapWidth?: number;
}

/** Union of all built-in component types */
export type BuiltInComponentJson =
  | SpriteJson
  | AnimatedSpriteJson
  | RigidBody2DJson
  | Collider2DJson
  | Camera2DJson
  | CameraJson
  | AudioSourceJson
  | ParticleEmitterJson
  | TileMapJson
  | TextJson;

/** Component can be built-in or custom */
export type AnyComponentJson = BuiltInComponentJson | (ComponentJson & Record<string, unknown>);
