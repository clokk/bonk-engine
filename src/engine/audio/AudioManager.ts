/**
 * AudioManager - Singleton for managing audio playback, caching, and volume.
 * Handles browser autoplay restrictions and provides volume categories.
 */

import { Howl, Howler } from 'howler';
import { GlobalEvents } from '../EventSystem';

/** Volume categories for audio */
export type VolumeCategory = 'master' | 'music' | 'sfx';

/** Audio events emitted by the system */
export const AudioEvents = {
  /** Fired when audio context is unlocked by user interaction */
  UNLOCKED: 'audio:unlocked',
  /** Fired when a volume category changes */
  VOLUME_CHANGED: 'audio:volume:changed',
} as const;

class AudioManagerImpl {
  /** Cache of loaded sounds by path */
  private cache = new Map<string, Howl>();

  /** Volume levels for each category */
  private volumes: Record<VolumeCategory, number> = {
    master: 1,
    music: 1,
    sfx: 1,
  };

  /** Whether audio context has been unlocked */
  private unlocked = false;

  /** Callbacks waiting for unlock */
  private unlockCallbacks: Array<() => void> = [];

  /** Whether init has been called */
  private initialized = false;

  /**
   * Initialize the audio manager.
   * Sets up browser autoplay unlock listeners.
   * Safe to call multiple times.
   */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Check if already unlocked (some browsers don't require interaction)
    if (Howler.ctx?.state === 'running') {
      this.handleUnlock();
      return;
    }

    // Set up unlock listeners
    const unlockEvents = ['click', 'touchstart', 'keydown'];
    const unlock = () => {
      if (this.unlocked) return;

      // Resume the audio context
      if (Howler.ctx?.state === 'suspended') {
        Howler.ctx.resume().then(() => {
          this.handleUnlock();
        });
      } else {
        this.handleUnlock();
      }

      // Remove listeners
      unlockEvents.forEach((event) => {
        document.removeEventListener(event, unlock, true);
      });
    };

    unlockEvents.forEach((event) => {
      document.addEventListener(event, unlock, true);
    });
  }

  /** Handle successful audio unlock */
  private handleUnlock(): void {
    this.unlocked = true;

    // Call all waiting callbacks
    for (const callback of this.unlockCallbacks) {
      try {
        callback();
      } catch (e) {
        console.error('Error in audio unlock callback:', e);
      }
    }
    this.unlockCallbacks = [];

    // Emit global event
    GlobalEvents.emit(AudioEvents.UNLOCKED);
  }

  /**
   * Set volume for a category.
   * @param category - The volume category
   * @param value - Volume level (0-1)
   */
  setVolume(category: VolumeCategory, value: number): void {
    this.volumes[category] = Math.max(0, Math.min(1, value));

    // Update master volume in Howler
    if (category === 'master') {
      Howler.volume(this.volumes.master);
    }

    GlobalEvents.emit(AudioEvents.VOLUME_CHANGED, { category, value: this.volumes[category] });
  }

  /**
   * Get volume for a category.
   * @param category - The volume category
   * @returns Volume level (0-1)
   */
  getVolume(category: VolumeCategory): number {
    return this.volumes[category];
  }

  /**
   * Get effective volume for a category (master * category).
   * @param category - The volume category
   * @returns Effective volume level (0-1)
   */
  getEffectiveVolume(category: VolumeCategory): number {
    if (category === 'master') {
      return this.volumes.master;
    }
    return this.volumes.master * this.volumes[category];
  }

  /**
   * Preload audio files.
   * @param paths - Array of audio file paths to preload
   * @returns Promise that resolves when all files are loaded
   */
  async preload(paths: string[]): Promise<void> {
    const promises = paths.map((path) => this.getSound(path));
    await Promise.all(promises);
  }

  /**
   * Get or load a sound (async).
   * @param path - Path to the audio file
   * @returns Promise that resolves to the Howl instance
   */
  async getSound(path: string): Promise<Howl> {
    // Return cached sound if available
    const cached = this.cache.get(path);
    if (cached) {
      return cached;
    }

    // Create and load new sound
    return new Promise((resolve, reject) => {
      const sound = new Howl({
        src: [path],
        preload: true,
        onload: () => {
          this.cache.set(path, sound);
          resolve(sound);
        },
        onloaderror: (_id, error) => {
          console.error(`Failed to load audio: ${path}`, error);
          reject(new Error(`Failed to load audio: ${path}`));
        },
      });
    });
  }

  /**
   * Get cached sound (sync).
   * Returns null if not loaded.
   * @param path - Path to the audio file
   * @returns Howl instance or null
   */
  getSoundSync(path: string): Howl | null {
    return this.cache.get(path) ?? null;
  }

  /**
   * Check if audio context is unlocked.
   * @returns True if audio can play without user interaction
   */
  isUnlocked(): boolean {
    return this.unlocked;
  }

  /**
   * Register a callback for when audio is unlocked.
   * Calls immediately if already unlocked.
   * @param callback - Function to call when unlocked
   */
  onUnlock(callback: () => void): void {
    if (this.unlocked) {
      callback();
    } else {
      this.unlockCallbacks.push(callback);
    }
  }

  /**
   * Unload a specific sound from cache.
   * @param path - Path to the audio file
   */
  unload(path: string): void {
    const sound = this.cache.get(path);
    if (sound) {
      sound.unload();
      this.cache.delete(path);
    }
  }

  /**
   * Destroy and cleanup all sounds.
   */
  destroy(): void {
    for (const sound of this.cache.values()) {
      sound.unload();
    }
    this.cache.clear();
    this.unlockCallbacks = [];
  }

  /**
   * Pause all sounds.
   */
  pauseAll(): void {
    for (const sound of this.cache.values()) {
      sound.pause();
    }
  }

  /**
   * Resume all sounds that were playing.
   */
  resumeAll(): void {
    // Note: Howler doesn't track which sounds were playing,
    // so this resumes all sounds. Use with caution.
    for (const sound of this.cache.values()) {
      if (sound.playing()) continue;
      // Only resume sounds that have a seek position > 0
      const seek = sound.seek();
      if (typeof seek === 'number' && seek > 0) {
        sound.play();
      }
    }
  }

  /**
   * Stop all sounds.
   */
  stopAll(): void {
    for (const sound of this.cache.values()) {
      sound.stop();
    }
  }
}

/** Global AudioManager singleton */
export const AudioManager = new AudioManagerImpl();

/** Convenience function to get the AudioManager */
export function getAudioManager(): AudioManagerImpl {
  return AudioManager;
}
