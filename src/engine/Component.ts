/**
 * Base Component class for GameObject components.
 * Components add functionality to GameObjects (rendering, physics, etc).
 */

import type { GameObject } from './GameObject';
import type { AnyComponentJson } from './types';

export abstract class Component {
  /** The GameObject this component is attached to */
  readonly gameObject: GameObject;

  /** Whether this component is enabled */
  enabled: boolean = true;

  /** Component type identifier */
  abstract readonly type: string;

  constructor(gameObject: GameObject) {
    this.gameObject = gameObject;
  }

  /** Quick access to transform */
  get transform() {
    return this.gameObject.transform;
  }

  /** Called when the component is first created */
  awake(): void {}

  /** Called after all components are created, before first update */
  start(): void {}

  /** Called every frame */
  update(): void {}

  /** Called after all updates (useful for camera follow) */
  lateUpdate(): void {}

  /** Called at fixed timestep (for physics) */
  fixedUpdate(): void {}

  /** Called when the component is destroyed */
  onDestroy(): void {}

  /** Serialize component to JSON */
  abstract toJSON(): AnyComponentJson;
}

/** Registry of component factories */
export type ComponentFactory = (
  gameObject: GameObject,
  data: AnyComponentJson
) => Component;

const componentFactories = new Map<string, ComponentFactory>();

/** Register a component factory */
export function registerComponent(type: string, factory: ComponentFactory): void {
  componentFactories.set(type, factory);
}

/** Create a component from JSON */
export function createComponent(
  gameObject: GameObject,
  data: AnyComponentJson
): Component | null {
  const factory = componentFactories.get(data.type);
  if (!factory) {
    console.warn(`Unknown component type: ${data.type}`);
    return null;
  }
  return factory(gameObject, data);
}

/** Get all registered component types */
export function getRegisteredComponents(): string[] {
  return Array.from(componentFactories.keys());
}
