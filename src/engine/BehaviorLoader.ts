/**
 * BehaviorLoader - Loads and instantiates behaviors on GameObjects.
 * Supports both registry-based and dynamic import loading.
 */

import { Behavior } from './Behavior';
import type { GameObject } from './GameObject';
import type { BehaviorJson } from './types';

/** Behavior class constructor type */
export type BehaviorClass = new (gameObject: GameObject) => Behavior;

/** Behavior registry - maps behavior names to classes */
const behaviorRegistry = new Map<string, BehaviorClass>();

/** Register a behavior class */
export function registerBehavior(name: string, behaviorClass: BehaviorClass): void {
  behaviorRegistry.set(name, behaviorClass);
}

/** Register multiple behaviors at once */
export function registerBehaviors(
  behaviors: Record<string, BehaviorClass>
): void {
  for (const [name, behaviorClass] of Object.entries(behaviors)) {
    registerBehavior(name, behaviorClass);
  }
}

/** Get a registered behavior class */
export function getBehavior(name: string): BehaviorClass | undefined {
  return behaviorRegistry.get(name);
}

/** Extract behavior name from source path */
function extractBehaviorName(src: string): string {
  // "./behaviors/PlayerController.ts" -> "PlayerController"
  const match = src.match(/\/([^/]+)\.(ts|js)$/);
  return match ? match[1] : src;
}

/** Load a behavior class (from registry or dynamic import) */
async function loadBehaviorClass(src: string): Promise<BehaviorClass> {
  const name = extractBehaviorName(src);

  // First check registry
  const registered = behaviorRegistry.get(name);
  if (registered) {
    return registered;
  }

  // In dev mode, try dynamic import
  if (import.meta.env?.DEV) {
    try {
      // Vite handles the dynamic import
      const module = await import(/* @vite-ignore */ src);
      const behaviorClass = module.default || module[name];

      if (!behaviorClass) {
        throw new Error(`Behavior module ${src} has no default export or ${name} export`);
      }

      // Cache for future use
      behaviorRegistry.set(name, behaviorClass);
      return behaviorClass;
    } catch (error) {
      console.error(`Failed to dynamically import behavior: ${src}`, error);
      throw error;
    }
  }

  throw new Error(
    `Behavior not found: ${name}. ` +
      `Make sure it's registered with registerBehavior() or included in behaviors/index.ts`
  );
}

/** Create a behavior instance from JSON */
async function createBehavior(
  gameObject: GameObject,
  json: BehaviorJson
): Promise<Behavior> {
  const BehaviorClass = await loadBehaviorClass(json.src);
  const behavior = new BehaviorClass(gameObject);

  // Apply props
  if (json.props) {
    for (const [key, value] of Object.entries(json.props)) {
      (behavior as unknown as Record<string, unknown>)[key] = value;
    }
  }

  return behavior;
}

/** Load all behaviors for a GameObject from JSON */
export async function loadBehaviors(
  gameObject: GameObject,
  behaviors: BehaviorJson[]
): Promise<void> {
  const loaded = await Promise.all(
    behaviors.map((json) => createBehavior(gameObject, json))
  );

  for (const behavior of loaded) {
    gameObject.addBehavior(behavior);
  }
}

/** Load behaviors for all GameObjects in a tree */
export async function loadBehaviorsRecursive(
  gameObject: GameObject,
  behaviorMap: Map<string, BehaviorJson[]>
): Promise<void> {
  const behaviors = behaviorMap.get(gameObject.id);
  if (behaviors && behaviors.length > 0) {
    await loadBehaviors(gameObject, behaviors);
  }

  // Load for children
  await Promise.all(
    gameObject
      .getChildren()
      .map((child) => loadBehaviorsRecursive(child, behaviorMap))
  );
}

/** Clear the behavior registry (for testing) */
export function clearBehaviorRegistry(): void {
  behaviorRegistry.clear();
}

/** Get all registered behavior names */
export function getRegisteredBehaviorNames(): string[] {
  return Array.from(behaviorRegistry.keys());
}
