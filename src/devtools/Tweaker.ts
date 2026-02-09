/**
 * Tweaker devtools — singleton runtime constants editor
 *
 * Register constant objects, toggle with hotkey, edit values live.
 * Modified values persist to localStorage across reloads.
 * Zero overhead when hidden — no game loop integration needed.
 */

import type { TweakerConfig, RegisterOptions, GroupEntry } from './types';
import { TweakerOverlay } from './TweakerOverlay';

const DEFAULT_CONFIG: Required<TweakerConfig> = {
  hotkey: 'Backquote',
  position: 'right',
  width: 360,
  storagePrefix: 'bonk-tweaker',
  theme: 'amber',
};

export class Tweaker {
  private static overlay: TweakerOverlay | null = null;
  private static groups: Map<string, GroupEntry> = new Map();
  private static config: Required<TweakerConfig> = { ...DEFAULT_CONFIG };
  private static initialized = false;
  private static hotkeyHandler: ((e: KeyboardEvent) => void) | null = null;

  /**
   * Initialize the tweaker. Call once at startup.
   * Creates the DOM overlay and binds the toggle hotkey.
   */
  static init(config?: TweakerConfig) {
    if (Tweaker.initialized) return;
    Tweaker.initialized = true;

    Tweaker.config = { ...DEFAULT_CONFIG, ...config };

    Tweaker.overlay = new TweakerOverlay();
    Tweaker.overlay.setCallbacks(
      (group, path, value) => Tweaker.onFieldChange(group, path, value),
      (group) => Tweaker.reset(group),
      () => Tweaker.exportPreset(),
      (json) => Tweaker.importPreset(json),
    );
    Tweaker.overlay.create(Tweaker.config.position, Tweaker.config.width, Tweaker.config.storagePrefix);
    Tweaker.overlay.setTheme(Tweaker.config.theme);
    Tweaker.overlay.restoreVisibility();

    // Hotkey toggle
    Tweaker.hotkeyHandler = (e: KeyboardEvent) => {
      if (e.code === Tweaker.config.hotkey) {
        e.preventDefault();
        Tweaker.toggle();
      }
    };
    window.addEventListener('keydown', Tweaker.hotkeyHandler);
  }

  /**
   * Register a constants object for live editing.
   * Saved overrides from localStorage are applied immediately.
   */
  static register(name: string, target: Record<string, unknown>, options?: RegisterOptions) {
    if (!Tweaker.initialized) return;

    // Deep clone defaults for reset
    const defaults = Tweaker.deepClone(target);

    const entry: GroupEntry = {
      name,
      target,
      defaults,
      options: options || {},
    };

    Tweaker.groups.set(name, entry);
    Tweaker.overlay?.addGroup(entry);

    // Restore saved overrides
    Tweaker.loadOverrides(entry);
  }

  /**
   * Unregister a constants group.
   */
  static unregister(name: string) {
    Tweaker.groups.delete(name);
    Tweaker.overlay?.removeGroup(name);
  }

  /** Show the tweaker overlay */
  static show() {
    Tweaker.overlay?.show();
  }

  /** Hide the tweaker overlay */
  static hide() {
    Tweaker.overlay?.hide();
  }

  /** Toggle the tweaker overlay visibility */
  static toggle() {
    if (Tweaker.overlay?.isVisible()) {
      Tweaker.overlay.hide();
    } else {
      Tweaker.overlay?.show();
    }
  }

  /** Send the tweaker to dormant mode (faded, slid aside) */
  static goDormant() {
    Tweaker.overlay?.goDormant();
  }

  /** Wake the tweaker from dormant mode */
  static wake() {
    Tweaker.overlay?.wake();
  }

  /** Get the current tweaker state */
  static getState(): 'hidden' | 'active' | 'dormant' {
    return Tweaker.overlay?.getState() ?? 'hidden';
  }

  /**
   * Reset a group (or all groups) to default values.
   * Clears localStorage overrides.
   */
  static reset(groupName?: string) {
    if (groupName) {
      const entry = Tweaker.groups.get(groupName);
      if (entry) {
        Tweaker.applyDefaults(entry);
        Tweaker.clearStorage(groupName);
      }
    } else {
      for (const entry of Tweaker.groups.values()) {
        Tweaker.applyDefaults(entry);
      }
      Tweaker.clearStorage();
    }
    Tweaker.overlay?.refreshAllFields();
  }

  /**
   * Export all current overrides as a JSON string.
   */
  static exportPreset(): string {
    const preset: Record<string, Record<string, unknown>> = {};
    for (const [name, entry] of Tweaker.groups) {
      const overrides = Tweaker.getOverrides(entry);
      if (Object.keys(overrides).length > 0) {
        preset[name] = overrides;
      }
    }
    return JSON.stringify(preset, null, 2);
  }

  /**
   * Import a preset JSON string and apply overrides.
   */
  static importPreset(json: string) {
    try {
      const preset = JSON.parse(json) as Record<string, Record<string, unknown>>;
      for (const [groupName, overrides] of Object.entries(preset)) {
        const entry = Tweaker.groups.get(groupName);
        if (!entry) continue;
        for (const [path, value] of Object.entries(overrides)) {
          Tweaker.setNestedValue(entry.target, path, value);
          Tweaker.saveOverride(groupName, path, value);
        }
      }
      Tweaker.overlay?.refreshAllFields();
    } catch {
      console.warn('[Tweaker] Invalid preset JSON');
    }
  }

  /** Clean up everything */
  static destroy() {
    if (Tweaker.hotkeyHandler) {
      window.removeEventListener('keydown', Tweaker.hotkeyHandler);
      Tweaker.hotkeyHandler = null;
    }
    Tweaker.overlay?.destroy();
    Tweaker.overlay = null;
    Tweaker.groups.clear();
    Tweaker.initialized = false;
  }

  // === Internal ===

  private static onFieldChange(groupName: string, path: string, value: unknown) {
    Tweaker.saveOverride(groupName, path, value);
  }

  private static storageKey(group: string, path: string): string {
    return `${Tweaker.config.storagePrefix}:${group}:${path}`;
  }

  private static saveOverride(group: string, path: string, value: unknown) {
    try {
      localStorage.setItem(Tweaker.storageKey(group, path), JSON.stringify(value));
    } catch { /* quota exceeded or private mode */ }
  }

  private static loadOverrides(entry: GroupEntry) {
    const prefix = `${Tweaker.config.storagePrefix}:${entry.name}:`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const path = key.slice(prefix.length);
      try {
        const value = JSON.parse(localStorage.getItem(key)!);
        Tweaker.setNestedValue(entry.target, path, value);
      } catch { /* invalid stored value */ }
    }
  }

  private static clearStorage(groupName?: string) {
    const prefix = groupName
      ? `${Tweaker.config.storagePrefix}:${groupName}:`
      : `${Tweaker.config.storagePrefix}:`;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) toRemove.push(key);
    }
    for (const key of toRemove) localStorage.removeItem(key);
  }

  private static applyDefaults(entry: GroupEntry) {
    Tweaker.deepApply(entry.target, entry.defaults);
  }

  private static getOverrides(entry: GroupEntry): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    Tweaker.diffValues(entry.target, entry.defaults, '', result);
    return result;
  }

  private static diffValues(
    current: Record<string, unknown>,
    defaults: Record<string, unknown>,
    prefix: string,
    result: Record<string, unknown>,
  ) {
    for (const key of Object.keys(defaults)) {
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (descriptor && descriptor.get) continue; // skip getters

      const path = prefix ? `${prefix}.${key}` : key;
      const cVal = current[key];
      const dVal = defaults[key];

      if (typeof cVal === 'object' && cVal !== null && !Array.isArray(cVal) &&
          typeof dVal === 'object' && dVal !== null && !Array.isArray(dVal)) {
        Tweaker.diffValues(
          cVal as Record<string, unknown>,
          dVal as Record<string, unknown>,
          path,
          result,
        );
      } else if (cVal !== dVal) {
        result[path] = cVal;
      }
    }
  }

  private static setNestedValue(target: Record<string, unknown>, path: string, value: unknown) {
    const parts = path.split('.');
    let current: Record<string, unknown> = target;
    for (let i = 0; i < parts.length - 1; i++) {
      const next = current[parts[i]];
      if (typeof next !== 'object' || next === null) return;
      current = next as Record<string, unknown>;
    }
    (current as Record<string, unknown>)[parts[parts.length - 1]] = value;
  }

  private static deepClone(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      const descriptor = Object.getOwnPropertyDescriptor(obj, key);
      if (descriptor && descriptor.get) {
        // Preserve getter — define it on the clone
        Object.defineProperty(result, key, {
          get: descriptor.get,
          enumerable: true,
          configurable: true,
        });
        continue;
      }
      const val = obj[key];
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        result[key] = Tweaker.deepClone(val as Record<string, unknown>);
      } else if (Array.isArray(val)) {
        result[key] = [...val];
      } else {
        result[key] = val;
      }
    }
    return result;
  }

  private static deepApply(target: Record<string, unknown>, defaults: Record<string, unknown>) {
    for (const key of Object.keys(defaults)) {
      const descriptor = Object.getOwnPropertyDescriptor(target, key);
      if (descriptor && descriptor.get) continue; // skip getters

      const dVal = defaults[key];
      if (typeof dVal === 'object' && dVal !== null && !Array.isArray(dVal)) {
        const tVal = target[key];
        if (typeof tVal === 'object' && tVal !== null && !Array.isArray(tVal)) {
          Tweaker.deepApply(tVal as Record<string, unknown>, dVal as Record<string, unknown>);
        }
      } else {
        (target as Record<string, unknown>)[key] = dVal;
      }
    }
  }
}
