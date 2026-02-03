/**
 * HotReload - Handles hot module replacement for behaviors and scenes.
 * Preserves game state while updating code.
 */

import { Behavior } from './Behavior';
import type { GameObject } from './GameObject';
import type { Scene } from './Scene';
import { registerBehavior, type BehaviorClass } from './BehaviorLoader';
import type { SceneJson } from './types';

/** Hot reload state */
interface HotReloadState {
  currentScene: Scene | null;
  onSceneReload: ((scene: Scene) => void) | null;
}

const state: HotReloadState = {
  currentScene: null,
  onSceneReload: null,
};

/** Set the current scene for hot reload */
export function setHotReloadScene(scene: Scene): void {
  state.currentScene = scene;
}

/** Set callback for scene reload */
export function onSceneReload(callback: (scene: Scene) => void): void {
  state.onSceneReload = callback;
}

/** Extract behavior props for preservation */
function extractBehaviorProps(behavior: Behavior): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const proto = Object.getPrototypeOf(behavior);

  // Get own enumerable properties (not from prototype)
  for (const key of Object.keys(behavior)) {
    // Skip internal properties
    if (key.startsWith('_') || key === 'gameObject' || key === 'events') {
      continue;
    }

    const value = (behavior as unknown as Record<string, unknown>)[key];

    // Only preserve serializable values
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      Array.isArray(value) ||
      (typeof value === 'object' && value !== null && value.constructor === Object)
    ) {
      props[key] = value;
    }
  }

  return props;
}

/** Apply preserved props to a new behavior instance */
function applyBehaviorProps(
  behavior: Behavior,
  props: Record<string, unknown>
): void {
  for (const [key, value] of Object.entries(props)) {
    if (key in behavior) {
      (behavior as unknown as Record<string, unknown>)[key] = value;
    }
  }
}

/** Hot reload a behavior class */
export function hotReloadBehavior(
  name: string,
  NewBehaviorClass: BehaviorClass
): void {
  if (!state.currentScene) {
    console.warn('[HotReload] No scene set, skipping behavior reload');
    return;
  }

  console.log(`[HotReload] Reloading behavior: ${name}`);

  // Update registry
  registerBehavior(name, NewBehaviorClass);

  // Find all GameObjects with this behavior
  const affectedObjects: Array<{
    gameObject: GameObject;
    oldBehavior: Behavior;
    props: Record<string, unknown>;
  }> = [];

  const findBehaviors = (gameObjects: readonly GameObject[]) => {
    for (const go of gameObjects) {
      for (const behavior of go.getAllBehaviors()) {
        if (behavior.constructor.name === name) {
          affectedObjects.push({
            gameObject: go,
            oldBehavior: behavior,
            props: extractBehaviorProps(behavior),
          });
        }
      }
      findBehaviors(go.getChildren());
    }
  };

  findBehaviors(state.currentScene.getGameObjects());

  // Replace behaviors
  for (const { gameObject, oldBehavior, props } of affectedObjects) {
    // Destroy old behavior
    gameObject.removeBehavior(oldBehavior);

    // Create new behavior
    const newBehavior = new NewBehaviorClass(gameObject);
    applyBehaviorProps(newBehavior, props);
    gameObject.addBehavior(newBehavior);

    console.log(
      `[HotReload] Replaced ${name} on ${gameObject.name} with props:`,
      props
    );
  }

  console.log(
    `[HotReload] Reloaded ${affectedObjects.length} instance(s) of ${name}`
  );
}

/** Hot reload scene data */
export function hotReloadScene(json: SceneJson): void {
  if (!state.currentScene) {
    console.warn('[HotReload] No scene set, skipping scene reload');
    return;
  }

  console.log(`[HotReload] Reloading scene: ${json.name}`);

  // For now, we do a full scene reload
  // Future: Implement diffing and patching

  // Import SceneLoader dynamically to avoid circular dependency
  import('./SceneLoader').then(async ({ loadSceneFromJson }) => {
    const newScene = await loadSceneFromJson(json);

    // Replace current scene
    state.currentScene?.unload();
    state.currentScene = newScene;

    // Notify callback
    if (state.onSceneReload) {
      state.onSceneReload(newScene);
    }
  });
}

/** Setup Vite HMR integration */
export function setupViteHMR(): void {
  if (!import.meta.hot) return;

  // Listen for scene updates from vite-plugin-bonk-scenes
  import.meta.hot.on('bonk:scene-update', (data: {
    path: string;
    json: SceneJson;
    isPrefab: boolean;
  }) => {
    if (data.isPrefab) {
      // Prefab updates would require finding all instances
      console.log(`[HotReload] Prefab updated: ${data.path}`);
      // For now, just log - full prefab HMR is complex
    } else {
      hotReloadScene(data.json);
    }
  });

  console.log('[HotReload] Vite HMR integration enabled');
}

/** Create HMR accept handler for behavior files */
export function createBehaviorHMRHandler(
  name: string,
  BehaviorClass: BehaviorClass
): void {
  if (!import.meta.hot) return;

  import.meta.hot.accept((newModule: Record<string, unknown> | undefined) => {
    if (newModule) {
      const NewClass = (newModule.default || newModule[name]) as BehaviorClass | undefined;
      if (NewClass) {
        hotReloadBehavior(name, NewClass);
      }
    }
  });
}
