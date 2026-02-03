/**
 * Scene - Container for GameObjects.
 * Manages the lifecycle of all GameObjects within a scene.
 */

import { GameObject, type Scene as IScene } from './GameObject';
import { GlobalEvents, EngineEvents } from './EventSystem';
import type { SceneJson, SceneSettingsJson, Vector2 } from './types';
import { DEFAULT_SCENE_SETTINGS } from './types';

export class Scene implements IScene {
  /** Scene name */
  readonly name: string;

  /** Scene version */
  readonly version: string;

  /** Scene settings */
  readonly settings: SceneSettingsJson;

  /** Root GameObjects */
  private gameObjects: GameObject[] = [];

  /** GameObjects by ID for fast lookup */
  private gameObjectsById = new Map<string, GameObject>();

  /** GameObjects pending destruction */
  private pendingDestroy: Set<GameObject> = new Set();

  /** Has the scene been started? */
  private started: boolean = false;

  constructor(name: string, version: string = '1.0.0', settings?: SceneSettingsJson) {
    this.name = name;
    this.version = version;
    this.settings = { ...DEFAULT_SCENE_SETTINGS, ...settings };
  }

  /** Get gravity setting */
  get gravity(): Vector2 {
    return this.settings.gravity ?? [0, 980];
  }

  /** Get background color */
  get backgroundColor(): string {
    const color = this.settings.backgroundColor;
    if (typeof color === 'string') return color;
    if (Array.isArray(color)) {
      const [r, g, b] = color.map((c) => Math.round(c * 255));
      return `rgb(${r}, ${g}, ${b})`;
    }
    return '#1a1a2e';
  }

  /** Add a GameObject to the scene */
  add(gameObject: GameObject): void {
    gameObject.scene = this;
    this.gameObjects.push(gameObject);
    this.gameObjectsById.set(gameObject.id, gameObject);

    // Register all children too
    const registerChildren = (go: GameObject) => {
      for (const child of go.getChildren()) {
        child.scene = this;
        this.gameObjectsById.set(child.id, child);
        registerChildren(child);
      }
    };
    registerChildren(gameObject);

    // If scene already started, initialize the new GameObject
    if (this.started) {
      gameObject.awake();
      gameObject.start();
    }
  }

  /** Remove a GameObject from the scene */
  remove(gameObject: GameObject): void {
    const index = this.gameObjects.indexOf(gameObject);
    if (index !== -1) {
      this.gameObjects.splice(index, 1);
    }
    this.gameObjectsById.delete(gameObject.id);

    // Unregister children
    const unregisterChildren = (go: GameObject) => {
      for (const child of go.getChildren()) {
        this.gameObjectsById.delete(child.id);
        unregisterChildren(child);
      }
    };
    unregisterChildren(gameObject);

    gameObject.scene = null;
  }

  /** Mark a GameObject for destruction (processed at end of frame) */
  destroy(gameObject: GameObject): void {
    this.pendingDestroy.add(gameObject);
  }

  /** Process pending destructions */
  processPendingDestroy(): void {
    for (const go of this.pendingDestroy) {
      this.remove(go);
      go.destroy();
    }
    this.pendingDestroy.clear();
  }

  /** Get all root GameObjects */
  getGameObjects(): readonly GameObject[] {
    return this.gameObjects;
  }

  /** Find a GameObject by name */
  findByName(name: string): GameObject | undefined {
    for (const go of this.gameObjects) {
      if (go.name === name) return go;
      const child = go.findChildRecursive(name);
      if (child) return child;
    }
    return undefined;
  }

  /** Find a GameObject by ID */
  findById(id: string): GameObject | undefined {
    return this.gameObjectsById.get(id);
  }

  /** Find all GameObjects with a tag */
  findByTag(tag: string): GameObject[] {
    const results: GameObject[] = [];
    const search = (gameObjects: readonly GameObject[]) => {
      for (const go of gameObjects) {
        if (go.tag === tag) results.push(go);
        search(go.getChildren());
      }
    };
    search(this.gameObjects);
    return results;
  }

  /** Initialize the scene (call awake on all GameObjects) */
  awake(): void {
    for (const go of this.gameObjects) {
      go.awake();
    }
  }

  /** Start the scene (call start on all GameObjects) */
  start(): void {
    if (this.started) return;
    this.started = true;

    for (const go of this.gameObjects) {
      go.start();
    }
  }

  /** Update all GameObjects */
  update(): void {
    for (const go of this.gameObjects) {
      go.update();
    }
  }

  /** Fixed update all GameObjects */
  fixedUpdate(): void {
    for (const go of this.gameObjects) {
      go.fixedUpdate();
    }
  }

  /** Late update all GameObjects */
  lateUpdate(): void {
    for (const go of this.gameObjects) {
      go.lateUpdate();
    }
  }

  /** Clean up the scene */
  unload(): void {
    GlobalEvents.emit(EngineEvents.SCENE_UNLOAD, { scene: this.name });

    for (const go of this.gameObjects) {
      go.destroy();
    }
    this.gameObjects = [];
    this.gameObjectsById.clear();
    this.pendingDestroy.clear();
    this.started = false;
  }

  /** Create scene from JSON */
  static fromJSON(json: SceneJson): Scene {
    const scene = new Scene(json.name, json.version, json.settings);

    for (const goJson of json.gameObjects) {
      const go = GameObject.fromJSON(goJson);
      scene.add(go);
    }

    return scene;
  }

  /** Convert to JSON */
  toJSON(): SceneJson {
    return {
      name: this.name,
      version: this.version,
      settings: this.settings,
      gameObjects: this.gameObjects.map((go) => go.toJSON()),
    };
  }
}
