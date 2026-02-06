# Audio System

Bonk Engine's audio system provides Unity-familiar patterns for audio playback using [Howler.js](https://howlerjs.com/) under the hood.

## Architecture

The audio system uses a hybrid approach:

- **AudioManager** - Global singleton for caching sounds, managing volume categories, and handling browser autoplay restrictions
- **AudioSource** - Standalone class for playback control and spatial audio

## Quick Start

### Basic Playback

```typescript
import { AudioSource } from 'bonk-engine';

const music = new AudioSource({
  src: './audio/music.mp3',
  category: 'music',
  loop: true,
  volume: 0.5,
});

await music.load();
music.play();
```

### One-Shot Sound Effects

```typescript
import { AudioSource } from 'bonk-engine';

const coinSound = new AudioSource({
  src: './audio/sfx/coin.wav',
  category: 'sfx',
});

await coinSound.load();

// Play rapid-fire sounds without cutting off
function collectCoin() {
  coinSound.playOneShot();
}
```

### Volume Control

```typescript
import { getAudioManager } from 'bonk-engine';

const audio = getAudioManager();

// Set category volumes (0-1)
audio.setVolume('master', 0.8);
audio.setVolume('music', 0.5);
audio.setVolume('sfx', 1.0);

// Get current volume
const musicVolume = audio.getVolume('music'); // 0.5
const effectiveMusic = audio.getEffectiveVolume('music'); // 0.4 (0.8 * 0.5)
```

## AudioSource

### Constructor Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | string | `''` | Audio file path |
| `volume` | number | `1` | Base volume (0-1) |
| `loop` | boolean | `false` | Loop playback |
| `category` | `'music' \| 'sfx'` | `'sfx'` | Volume category |
| `spatial` | boolean | `false` | Enable 2D spatial audio |
| `minDistance` | number | `100` | Distance for full volume |
| `maxDistance` | number | `500` | Distance where sound is silent |

### Methods

```typescript
// Load the audio (async)
await audioSource.load();

// Playback control
audioSource.play();      // Start playing
audioSource.pause();     // Pause playback
audioSource.resume();    // Resume from pause
audioSource.stop();      // Stop and reset position

// Seeking
audioSource.seek(5.0);   // Jump to 5 seconds

// Fading
audioSource.fade(1, 0, 2000);  // Fade out over 2 seconds

// One-shot (for rapid SFX)
audioSource.playOneShot();                    // Play component's src
audioSource.playOneShot('./audio/hit.wav');   // Play different sound

// State
audioSource.playing;        // boolean - is currently playing?
audioSource.getTime();      // number - current playback position
audioSource.getDuration();  // number - total duration
```

## AudioManager

### Initialization

AudioManager auto-initializes when the first AudioSource loads. You can also initialize manually:

```typescript
import { AudioManager } from 'bonk-engine';

AudioManager.init();
```

### Volume Categories

Three volume categories that multiply together:

```
effectiveVolume = master × category × audioSourceVolume
```

Example: master=0.8, music=0.5, audioSource=0.7 → effective=0.28

### Preloading

```typescript
import { getAudioManager } from 'bonk-engine';

const audio = getAudioManager();

// Preload sounds during loading screen
await audio.preload([
  './audio/music/theme.mp3',
  './audio/sfx/jump.wav',
  './audio/sfx/coin.wav',
]);
```

### Getting Sounds Directly

```typescript
// Async - loads if not cached
const sound = await audio.getSound('./audio/explosion.wav');

// Sync - returns null if not cached
const cachedSound = audio.getSoundSync('./audio/explosion.wav');
```

### Cleanup

```typescript
// Unload specific sound
audio.unload('./audio/music.mp3');

// Stop all sounds
audio.stopAll();

// Pause all sounds (e.g., when game pauses)
audio.pauseAll();

// Destroy everything (cleanup on game exit)
audio.destroy();
```

## Spatial Audio

2D spatial audio uses stereo panning and distance-based volume falloff.

```typescript
import { AudioSource, Transform } from 'bonk-engine';

const waterfall = new AudioSource({
  src: './audio/ambient/waterfall.mp3',
  spatial: true,
  minDistance: 100,
  maxDistance: 400,
  loop: true,
});

await waterfall.load();

// Set position
const transform = new Transform();
transform.position = [500, 0];
waterfall.setTransform(transform);

// Update spatial audio in your game loop
function gameLoop(renderer) {
  waterfall.updateSpatialAudio(renderer);
}

waterfall.play();
```

### How It Works

**Stereo Panning:**
- Objects to the left of camera → sound pans left
- Objects to the right of camera → sound pans right
- Objects at camera center → centered audio

**Volume Falloff:**
- Within `minDistance` → full volume
- Between `minDistance` and `maxDistance` → linear falloff
- Beyond `maxDistance` → silent

```
        Camera
          │
    ←─────┼─────→
   pan=-1 │ pan=+1
          │
          ▼
    minDistance: full volume
         ╲╱
          │
          │ (linear falloff)
          │
         ╲╱
    maxDistance: silent
```

## Browser Autoplay

Modern browsers block autoplay until user interaction. The audio system handles this automatically:

1. `AudioManager.init()` sets up click/touch/keydown listeners
2. On first interaction, the audio context is unlocked
3. Sounds queued before unlock will play after user interaction

### Checking Unlock Status

```typescript
import { getAudioManager } from 'bonk-engine';

const audio = getAudioManager();

if (audio.isUnlocked()) {
  // Audio will play immediately
} else {
  // Audio is queued until user interacts
}

// Run code when audio unlocks
audio.onUnlock(() => {
  console.log('Audio ready!');
});
```

### Events

```typescript
import { GlobalEvents, AudioEvents } from 'bonk-engine';

// Audio unlocked
GlobalEvents.on(AudioEvents.UNLOCKED, () => {
  // Hide "click to enable audio" UI
});

// Volume changed
GlobalEvents.on(AudioEvents.VOLUME_CHANGED, ({ category, value }) => {
  console.log(`${category} volume changed to ${value}`);
});
```

## Common Patterns

### Music Player with Crossfade

```typescript
import { AudioSource } from 'bonk-engine';

class MusicPlayer {
  private currentMusic: AudioSource | null = null;

  async playTrack(src: string) {
    // Fade out current
    if (this.currentMusic?.playing) {
      this.currentMusic.fade(1, 0, 1000);
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.currentMusic.stop();
    }

    // Create new audio source
    this.currentMusic = new AudioSource({
      src,
      category: 'music',
      loop: true,
    });

    await this.currentMusic.load();

    // Fade in
    this.currentMusic.play();
    this.currentMusic.fade(0, 1, 1000);
  }
}
```

### Sound Pool for Rapid SFX

```typescript
import { AudioSource } from 'bonk-engine';

class Weapon {
  private gunshotSound: AudioSource;

  constructor() {
    this.gunshotSound = new AudioSource({
      src: './audio/sfx/gunshot.wav',
      category: 'sfx',
    });
    this.gunshotSound.load();
  }

  fire() {
    // playOneShot creates independent instances
    // Won't cut off previous sounds
    this.gunshotSound.playOneShot();
  }
}
```

### Volume Settings UI

```typescript
import { getAudioManager } from 'bonk-engine';

class VolumeSettings {
  onMasterChange(value: number) {
    getAudioManager().setVolume('master', value);
  }

  onMusicChange(value: number) {
    getAudioManager().setVolume('music', value);
  }

  onSFXChange(value: number) {
    getAudioManager().setVolume('sfx', value);
  }
}
```

### Background Music with Auto-Unlock

```typescript
import { AudioSource, getAudioManager } from 'bonk-engine';

const music = new AudioSource({
  src: './audio/music.mp3',
  category: 'music',
  loop: true,
  volume: 0.5,
});

await music.load();

// Play when audio unlocks
const audio = getAudioManager();
if (audio.isUnlocked()) {
  music.play();
} else {
  audio.onUnlock(() => {
    music.play();
  });
}
```

## Supported Formats

Howler.js handles format compatibility. Recommended formats:

- **MP3** - Wide support, good for music
- **WAV** - Uncompressed, good for short SFX
- **OGG** - Good compression, limited iOS support
- **WebM** - Modern browsers

For best compatibility, provide MP3 as the primary format.
