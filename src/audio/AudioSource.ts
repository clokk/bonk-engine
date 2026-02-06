/**
 * AudioSource - Standalone audio playback, decoupled from any entity system.
 */

import { Howl } from 'howler';
import { AudioManager, getAudioManager, type VolumeCategory } from './AudioManager';
import type { Renderer } from '../render/Renderer';
import type { Transform } from '../runtime/Transform';

/** Configuration for creating an AudioSource */
export interface AudioSourceConfig {
  /** Audio file source path */
  src?: string;
  /** Base volume (0-1) */
  volume?: number;
  /** Whether to loop playback */
  loop?: boolean;
  /** Volume category */
  category?: 'music' | 'sfx';
  /** Enable spatial audio */
  spatial?: boolean;
  /** Minimum distance for full volume (spatial) */
  minDistance?: number;
  /** Maximum distance before silent (spatial) */
  maxDistance?: number;
}

export class AudioSource {
  /** Audio file source path */
  src: string;

  /** Base volume (0-1) */
  volume: number;

  /** Whether to loop */
  loop: boolean;

  /** Volume category */
  category: 'music' | 'sfx';

  /** Spatial audio enabled */
  spatial: boolean;

  /** Minimum distance for full volume */
  minDistance: number;

  /** Maximum distance before silent */
  maxDistance: number;

  private sound: Howl | null = null;
  private soundId: number | null = null;
  private effectiveVolume = 1;
  private _transform: Transform | null = null;

  constructor(config?: AudioSourceConfig) {
    this.src = config?.src ?? '';
    this.volume = config?.volume ?? 1;
    this.loop = config?.loop ?? false;
    this.category = config?.category ?? 'sfx';
    this.spatial = config?.spatial ?? false;
    this.minDistance = config?.minDistance ?? 100;
    this.maxDistance = config?.maxDistance ?? 500;
  }

  /** Set the transform for spatial audio positioning. */
  setTransform(transform: Transform): void {
    this._transform = transform;
  }

  /** Load the audio file. Call before play(). */
  async load(): Promise<void> {
    AudioManager.init();
    if (this.src) {
      try {
        this.sound = await getAudioManager().getSound(this.src);
      } catch (e) {
        console.error(`AudioSource: Failed to load ${this.src}`, e);
      }
    }
  }

  /** Play the sound. */
  play(): void {
    if (!this.sound) {
      console.warn('AudioSource: No sound loaded');
      return;
    }

    if (this.soundId !== null) {
      this.sound.stop(this.soundId);
    }

    this.effectiveVolume = this.volume * getAudioManager().getEffectiveVolume(this.category);
    this.sound.loop(this.loop);
    this.soundId = this.sound.play();
    this.sound.volume(this.effectiveVolume, this.soundId);

    if (this.spatial) {
      this.updateSpatialAudio(null);
    }
  }

  /** Pause playback. */
  pause(): void {
    if (this.sound && this.soundId !== null) {
      this.sound.pause(this.soundId);
    }
  }

  /** Stop playback and reset. */
  stop(): void {
    if (this.sound && this.soundId !== null) {
      this.sound.stop(this.soundId);
      this.soundId = null;
    }
  }

  /** Resume paused playback. */
  resume(): void {
    if (this.sound && this.soundId !== null) {
      this.sound.play(this.soundId);
    }
  }

  /** Seek to a specific time in seconds. */
  seek(time: number): void {
    if (this.sound && this.soundId !== null) {
      this.sound.seek(time, this.soundId);
    }
  }

  /** Fade volume over time. */
  fade(from: number, to: number, durationMs: number): void {
    if (this.sound && this.soundId !== null) {
      const effectiveFrom = from * getAudioManager().getEffectiveVolume(this.category);
      const effectiveTo = to * getAudioManager().getEffectiveVolume(this.category);
      this.sound.fade(effectiveFrom, effectiveTo, durationMs, this.soundId);
    }
  }

  /** Check if currently playing. */
  get playing(): boolean {
    if (!this.sound || this.soundId === null) return false;
    return this.sound.playing(this.soundId);
  }

  /** Get current playback time in seconds. */
  getTime(): number {
    if (!this.sound || this.soundId === null) return 0;
    const seek = this.sound.seek(this.soundId);
    return typeof seek === 'number' ? seek : 0;
  }

  /** Get total duration in seconds. */
  getDuration(): number {
    if (!this.sound) return 0;
    return this.sound.duration();
  }

  /** Play a one-shot sound. */
  async playOneShot(path?: string): Promise<void> {
    const audioPath = path ?? this.src;
    if (!audioPath) return;

    try {
      const sound = await getAudioManager().getSound(audioPath);
      const effectiveVolume = this.volume * getAudioManager().getEffectiveVolume(this.category);
      const id = sound.play();
      sound.volume(effectiveVolume, id);
    } catch (e) {
      console.error(`AudioSource: Failed to play one-shot ${audioPath}`, e);
    }
  }

  /** Update spatial audio (call each frame if spatial is enabled). */
  updateSpatialAudio(renderer: Renderer | null): void {
    if (!this.sound || this.soundId === null || !renderer || !this._transform) return;

    const viewport = renderer.getViewportSize();
    const cameraPos = renderer.getCameraPosition();
    const worldPos = this._transform.worldPosition;

    const dx = worldPos[0] - cameraPos.x;
    const dy = worldPos[1] - cameraPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const halfWidth = viewport.width / 2;
    const pan = Math.max(-1, Math.min(1, dx / halfWidth));

    let vol = 1;
    if (distance > this.minDistance) {
      if (distance >= this.maxDistance) {
        vol = 0;
      } else {
        const range = this.maxDistance - this.minDistance;
        vol = 1 - (distance - this.minDistance) / range;
      }
    }

    this.sound.stereo(pan, this.soundId);
    this.sound.volume(this.effectiveVolume * vol, this.soundId);
  }

  /** Destroy and clean up. */
  destroy(): void {
    this.stop();
    this.sound = null;
  }
}
