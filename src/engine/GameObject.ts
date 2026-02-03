/**
 * GameObject - The fundamental entity in Bonk Engine.
 * GameObjects have a Transform, Components, Behaviors, and can have children.
 */

import { Transform } from './Transform';
import { Component, createComponent } from './Component';
import { Behavior } from './Behavior';
import { EventEmitter } from './EventSystem';
import type { GameObjectJson, AnyComponentJson, BehaviorJson } from './types';
import { v4 as uuid } from 'uuid';

// Forward declaration for Scene (avoid circular import)
export interface Scene {
  findByName(name: string): GameObject | undefined;
  findByTag(tag: string): GameObject[];
  destroy(gameObject: GameObject): void;
}

export class GameObject {
  /** Unique identifier */
  readonly id: string;

  /** Display name */
  name: string;

  /** Optional tag for grouping */
  tag?: string;

  /** Whether this GameObject is active */
  enabled: boolean = true;

  /** Transform component (always present) */
  readonly transform: Transform;

  /** Reference to containing scene */
  scene: Scene | null = null;

  /** Local event emitter */
  readonly events: EventEmitter = new EventEmitter();

  /** Parent GameObject */
  private _parent: GameObject | null = null;

  /** Child GameObjects */
  private children: GameObject[] = [];

  /** Attached components */
  private components: Component[] = [];

  /** Attached behaviors */
  private behaviors: Behavior[] = [];

  /** Has awake been called? */
  private awoken: boolean = false;

  /** Has start been called? */
  private started: boolean = false;

  constructor(name: string = 'GameObject', id?: string) {
    this.id = id ?? uuid();
    this.name = name;
    this.transform = new Transform();
  }

  /** Get parent GameObject */
  get parent(): GameObject | null {
    return this._parent;
  }

  /** Set parent GameObject */
  set parent(value: GameObject | null) {
    if (this._parent === value) return;

    // Remove from old parent
    if (this._parent) {
      const index = this._parent.children.indexOf(this);
      if (index !== -1) {
        this._parent.children.splice(index, 1);
      }
      this.transform.parent = null;
    }

    this._parent = value;

    // Add to new parent
    if (value) {
      value.children.push(this);
      this.transform.parent = value.transform;
    }
  }

  /** Get all children */
  getChildren(): readonly GameObject[] {
    return this.children;
  }

  /** Find child by name (non-recursive) */
  findChild(name: string): GameObject | undefined {
    return this.children.find((c) => c.name === name);
  }

  /** Find child by name (recursive) */
  findChildRecursive(name: string): GameObject | undefined {
    for (const child of this.children) {
      if (child.name === name) return child;
      const found = child.findChildRecursive(name);
      if (found) return found;
    }
    return undefined;
  }

  // ==================== Components ====================

  /** Add a component */
  addComponent<T extends Component>(component: T): T {
    this.components.push(component);
    if (this.awoken) {
      component.awake();
    }
    if (this.started) {
      component.start();
    }
    return component;
  }

  /** Get a component by type */
  getComponent<T extends Component>(
    type: new (go: GameObject) => T
  ): T | undefined {
    return this.components.find((c) => c instanceof type) as T | undefined;
  }

  /** Get all components of a type */
  getComponents<T extends Component>(type: new (go: GameObject) => T): T[] {
    return this.components.filter((c) => c instanceof type) as T[];
  }

  /** Get all components */
  getAllComponents(): readonly Component[] {
    return this.components;
  }

  /** Remove a component */
  removeComponent(component: Component): void {
    const index = this.components.indexOf(component);
    if (index !== -1) {
      component.onDestroy();
      this.components.splice(index, 1);
    }
  }

  // ==================== Behaviors ====================

  /** Add a behavior */
  addBehavior<T extends Behavior>(behavior: T): T {
    this.behaviors.push(behavior);
    if (this.awoken) {
      behavior.awake();
    }
    if (this.started) {
      behavior.start();
    }
    return behavior;
  }

  /** Get a behavior by type */
  getBehavior<T extends Behavior>(
    type: new (go: GameObject) => T
  ): T | undefined {
    return this.behaviors.find((b) => b instanceof type) as T | undefined;
  }

  /** Get all behaviors of a type */
  getBehaviors<T extends Behavior>(type: new (go: GameObject) => T): T[] {
    return this.behaviors.filter((b) => b instanceof type) as T[];
  }

  /** Get all behaviors */
  getAllBehaviors(): readonly Behavior[] {
    return this.behaviors;
  }

  /** Remove a behavior */
  removeBehavior(behavior: Behavior): void {
    const index = this.behaviors.indexOf(behavior);
    if (index !== -1) {
      behavior._destroy();
      this.behaviors.splice(index, 1);
    }
  }

  // ==================== Lifecycle ====================

  /** Called once after creation */
  awake(): void {
    if (this.awoken) return;
    this.awoken = true;

    for (const component of this.components) {
      component.awake();
    }
    for (const behavior of this.behaviors) {
      behavior.awake();
    }
    for (const child of this.children) {
      child.awake();
    }
  }

  /** Called once after awake, before first update */
  start(): void {
    if (this.started) return;
    this.started = true;

    for (const component of this.components) {
      component.start();
    }
    for (const behavior of this.behaviors) {
      behavior.start();
    }
    for (const child of this.children) {
      child.start();
    }
  }

  /** Called every frame */
  update(): void {
    if (!this.enabled) return;

    for (const component of this.components) {
      if (component.enabled) component.update();
    }
    for (const behavior of this.behaviors) {
      if (behavior.enabled) {
        behavior.updateCoroutines();
        behavior.update();
      }
    }
    for (const child of this.children) {
      child.update();
    }
  }

  /** Called at fixed timestep */
  fixedUpdate(): void {
    if (!this.enabled) return;

    for (const component of this.components) {
      if (component.enabled) component.fixedUpdate();
    }
    for (const behavior of this.behaviors) {
      if (behavior.enabled) behavior.fixedUpdate();
    }
    for (const child of this.children) {
      child.fixedUpdate();
    }
  }

  /** Called after update */
  lateUpdate(): void {
    if (!this.enabled) return;

    for (const behavior of this.behaviors) {
      if (behavior.enabled) behavior.lateUpdate();
    }
    for (const child of this.children) {
      child.lateUpdate();
    }
  }

  /** Clean up when destroyed */
  destroy(): void {
    // Destroy children first
    for (const child of [...this.children]) {
      child.destroy();
    }

    // Destroy behaviors
    for (const behavior of this.behaviors) {
      behavior._destroy();
    }

    // Destroy components
    for (const component of this.components) {
      component.onDestroy();
    }

    // Remove from parent
    this.parent = null;

    // Clear references
    this.components = [];
    this.behaviors = [];
    this.children = [];
    this.events.removeAllListeners();
  }

  // ==================== Serialization ====================

  /** Create from JSON */
  static fromJSON(json: GameObjectJson): GameObject {
    const go = new GameObject(json.name, json.id);
    go.tag = json.tag;
    go.enabled = json.enabled ?? true;

    // Set transform
    go.transform.position = [...json.transform.position];
    go.transform.rotation = json.transform.rotation;
    go.transform.scale = [...json.transform.scale];
    go.transform.zIndex = json.transform.zIndex ?? 0;

    // Components are created by SceneLoader after all GameObjects exist
    // Behaviors are loaded asynchronously by BehaviorLoader

    // Create children
    if (json.children) {
      for (const childJson of json.children) {
        const child = GameObject.fromJSON(childJson);
        child.parent = go;
      }
    }

    return go;
  }

  /** Convert to JSON */
  toJSON(): GameObjectJson {
    const json: GameObjectJson = {
      id: this.id,
      name: this.name,
      transform: this.transform.toJSON(),
    };

    if (this.tag) json.tag = this.tag;
    if (!this.enabled) json.enabled = false;

    if (this.components.length > 0) {
      json.components = this.components.map((c) => c.toJSON());
    }

    // Note: Behaviors are serialized by reference (src path), not by value
    // This is handled separately

    if (this.children.length > 0) {
      json.children = this.children.map((c) => c.toJSON());
    }

    return json;
  }
}
