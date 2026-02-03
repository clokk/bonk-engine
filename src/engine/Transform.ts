/**
 * Transform component for 2D positioning.
 * Handles position, rotation, scale, and z-ordering.
 */

import type { Vector2, TransformJson } from './types';

export class Transform {
  /** Position in world space */
  position: Vector2;

  /** Rotation in degrees */
  rotation: number;

  /** Scale factor */
  scale: Vector2;

  /** Z-index for render ordering (higher = on top) */
  zIndex: number;

  /** Parent transform for hierarchical positioning */
  parent: Transform | null = null;

  /** Child transforms */
  private children: Transform[] = [];

  constructor(data?: Partial<TransformJson>) {
    this.position = data?.position ? [...data.position] : [0, 0];
    this.rotation = data?.rotation ?? 0;
    this.scale = data?.scale ? [...data.scale] : [1, 1];
    this.zIndex = data?.zIndex ?? 0;
  }

  /** Get world position (accounting for parent transforms) */
  get worldPosition(): Vector2 {
    if (!this.parent) return this.position;

    const parentWorld = this.parent.worldPosition;
    const parentScale = this.parent.worldScale;
    const parentRotRad = (this.parent.worldRotation * Math.PI) / 180;

    // Rotate local position by parent rotation
    const cos = Math.cos(parentRotRad);
    const sin = Math.sin(parentRotRad);
    const scaledX = this.position[0] * parentScale[0];
    const scaledY = this.position[1] * parentScale[1];

    return [
      parentWorld[0] + cos * scaledX - sin * scaledY,
      parentWorld[1] + sin * scaledX + cos * scaledY,
    ];
  }

  /** Set world position */
  set worldPosition(value: Vector2) {
    if (!this.parent) {
      this.position = [...value];
      return;
    }

    const parentWorld = this.parent.worldPosition;
    const parentScale = this.parent.worldScale;
    const parentRotRad = (-this.parent.worldRotation * Math.PI) / 180;

    const relX = value[0] - parentWorld[0];
    const relY = value[1] - parentWorld[1];

    const cos = Math.cos(parentRotRad);
    const sin = Math.sin(parentRotRad);

    this.position = [
      (cos * relX - sin * relY) / parentScale[0],
      (sin * relX + cos * relY) / parentScale[1],
    ];
  }

  /** Get world rotation */
  get worldRotation(): number {
    if (!this.parent) return this.rotation;
    return this.parent.worldRotation + this.rotation;
  }

  /** Set world rotation */
  set worldRotation(value: number) {
    if (!this.parent) {
      this.rotation = value;
      return;
    }
    this.rotation = value - this.parent.worldRotation;
  }

  /** Get world scale */
  get worldScale(): Vector2 {
    if (!this.parent) return this.scale;
    const parentScale = this.parent.worldScale;
    return [this.scale[0] * parentScale[0], this.scale[1] * parentScale[1]];
  }

  /** Add a child transform */
  addChild(child: Transform): void {
    if (child.parent) {
      child.parent.removeChild(child);
    }
    child.parent = this;
    this.children.push(child);
  }

  /** Remove a child transform */
  removeChild(child: Transform): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
    }
  }

  /** Get all children */
  getChildren(): readonly Transform[] {
    return this.children;
  }

  /** Get forward direction vector */
  get forward(): Vector2 {
    const rad = (this.worldRotation * Math.PI) / 180;
    return [Math.cos(rad), Math.sin(rad)];
  }

  /** Get right direction vector */
  get right(): Vector2 {
    const rad = ((this.worldRotation + 90) * Math.PI) / 180;
    return [Math.cos(rad), Math.sin(rad)];
  }

  /** Translate by offset */
  translate(x: number, y: number): void {
    this.position[0] += x;
    this.position[1] += y;
  }

  /** Rotate by degrees */
  rotate(degrees: number): void {
    this.rotation += degrees;
  }

  /** Look at a target position */
  lookAt(target: Vector2): void {
    const dx = target[0] - this.worldPosition[0];
    const dy = target[1] - this.worldPosition[1];
    this.worldRotation = (Math.atan2(dy, dx) * 180) / Math.PI;
  }

  /** Convert to JSON */
  toJSON(): TransformJson {
    return {
      position: [...this.position],
      rotation: this.rotation,
      scale: [...this.scale],
      zIndex: this.zIndex,
    };
  }

  /** Create from JSON */
  static fromJSON(json: TransformJson): Transform {
    return new Transform(json);
  }
}
