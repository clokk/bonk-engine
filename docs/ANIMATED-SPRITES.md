# Animated Sprites

Bonk Engine supports sprite sheet animation through the `AnimatedSprite` class.

## Basic Usage

Create an animated sprite using the runtime API:

```typescript
import { AnimatedSprite, Game, Transform } from 'bonk-engine';

const game = new Game({ width: 800, height: 600 });

// Create a transform for position/rotation/scale
const playerTransform = new Transform({
  position: { x: 400, y: 300 },
  rotation: 0,
  scale: { x: 1, y: 1 },
});

// Create animated sprite
const playerAnim = new AnimatedSprite(game.renderer, {
  src: './sprites/player-sheet.png',
  frameWidth: 32,
  frameHeight: 32,
  animations: {
    idle: { frames: [0, 1, 2, 3], frameRate: 8, loop: true },
    run: { frames: [4, 5, 6, 7, 8, 9], frameRate: 12, loop: true },
    jump: { frames: [10, 11], frameRate: 10, loop: false },
  },
  defaultAnimation: 'idle',
  transform: playerTransform, // Optional: auto-syncs position from transform
});

// Update in game loop
game.onUpdate((dt: number) => {
  playerAnim.update(dt); // Must call update() each frame
});
```

## Sprite Sheet Layout

Frames are numbered left-to-right, top-to-bottom:

```
┌───────┬───────┬───────┬───────┐
│   0   │   1   │   2   │   3   │  ← Row 0
├───────┼───────┼───────┼───────┤
│   4   │   5   │   6   │   7   │  ← Row 1
├───────┼───────┼───────┼───────┤
│   8   │   9   │  10   │  11   │  ← Row 2
└───────┴───────┴───────┴───────┘
```

## Constructor Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | `string` | - | Path to sprite sheet image |
| `frameWidth` | `number` | `32` | Width of each frame in pixels |
| `frameHeight` | `number` | `32` | Height of each frame in pixels |
| `animations` | `object` | - | Named animation definitions (see below) |
| `defaultAnimation` | `string` | - | Animation to play on start |
| `anchor` | `[x, y]` | `[0.5, 0.5]` | Anchor point (0-1) |
| `transform` | `Transform` | - | Optional Transform for auto-syncing position |

### Animation Definition

Each animation is an object with:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `frames` | `number[]` | - | Array of frame indices from the sprite sheet |
| `frameRate` | `number` | `12` | Frames per second |
| `loop` | `boolean` | `true` | Whether to loop or play once |

## Runtime Control

Control animations directly on the AnimatedSprite instance:

```typescript
import { AnimatedSprite } from 'bonk-engine';

// Switch animations
playerAnim.playAnimation('run');
playerAnim.playAnimation('attack', true); // Force restart even if already playing

// Pause/resume
playerAnim.stop();
playerAnim.play();

// Jump to specific frame
playerAnim.gotoFrame(0);       // Show frame, stay paused
playerAnim.gotoFrame(3, true); // Show frame and continue playing

// Query state
playerAnim.getCurrentAnimation();  // 'run'
playerAnim.isAnimationPlaying();   // true
playerAnim.hasAnimation('jump');   // true
playerAnim.getAnimationNames();    // ['idle', 'run', 'jump']

// Sync position from transform (if using separate Transform)
playerAnim.sync();
```

## Callbacks

React to animation events:

```typescript
// Called when a non-looping animation finishes
playerAnim.onAnimationComplete = (name: string) => {
  if (name === 'attack') {
    playerAnim.playAnimation('idle');
  }
};

// Called every time the frame changes
playerAnim.onFrameChange = (frameIndex: number, animName: string) => {
  if (animName === 'walk' && frameIndex === 2) {
    // Play footstep sound on specific frame
    playSound('footstep');
  }
};
```

## Frame Rate Guidelines

| Speed | FPS | Use Case |
|-------|-----|----------|
| Slow | 6-8 | Idle, breathing, subtle effects |
| Normal | 10-12 | Walking, basic actions |
| Fast | 14-16 | Running, quick movements |
| Very Fast | 18-24 | Combat, impacts, rapid actions |

## Advanced Frame Sequences

The `frames` array gives you full control over playback order:

```typescript
const animations = {
  walk: { frames: [0, 1, 2, 3], frameRate: 12, loop: true },
  breathe: { frames: [0, 1, 2, 1], frameRate: 6, loop: true },
  dash: { frames: [0, 2, 4, 6], frameRate: 16, loop: false },
  charge: { frames: [0, 0, 0, 1, 2, 3], frameRate: 12, loop: false },
  rewind: { frames: [7, 6, 5, 4, 3, 2, 1, 0], frameRate: 12, loop: false },
};
```

## Flipping Sprites

Use `flipX` and `flipY` properties to mirror the sprite:

```typescript
// Create with initial flip
const flippedSprite = new AnimatedSprite(game.renderer, {
  src: './sprites/player.png',
  frameWidth: 32,
  frameHeight: 32,
  animations: {
    walk: { frames: [0, 1, 2, 3], frameRate: 12, loop: true },
  },
});

// Toggle at runtime
if (velocity.x < 0) {
  flippedSprite.flipX = true;  // Moving left, face left
} else if (velocity.x > 0) {
  flippedSprite.flipX = false; // Moving right, face right
}

// Vertical flip
flippedSprite.flipY = true; // Upside down
```

## Creating Sprite Sheets

Sprite sheets should be:
- A single PNG image
- Frames arranged in a grid (all same size)
- No padding between frames
- Power-of-2 dimensions recommended (64, 128, 256, etc.)

Tools for creating sprite sheets:
- **Aseprite** - Industry-standard pixel art editor
- **TexturePacker** - Automatic sprite sheet generation
- **Piskel** - Free online pixel art editor
- **LibreSprite** - Free Aseprite fork

## Example: Player Character

Complete player setup with multiple animations:

```typescript
import { AnimatedSprite, Game, Transform } from 'bonk-engine';

const game = new Game({ width: 800, height: 600 });

// Create player transform
const playerTransform = new Transform({
  position: { x: 400, y: 300 },
  rotation: 0,
  scale: { x: 1, y: 1 },
});

// Create animated sprite with multiple animations
const playerAnim = new AnimatedSprite(game.renderer, {
  src: './sprites/hero-sheet.png',
  frameWidth: 48,
  frameHeight: 64,
  animations: {
    idle: { frames: [0, 1, 2, 3], frameRate: 8, loop: true },
    run: { frames: [8, 9, 10, 11, 12, 13], frameRate: 12, loop: true },
    jump: { frames: [16, 17], frameRate: 10, loop: false },
    fall: { frames: [18], frameRate: 1, loop: false },
    attack: { frames: [24, 25, 26, 27], frameRate: 16, loop: false },
  },
  defaultAnimation: 'idle',
  anchor: [0.5, 1], // Bottom-center anchor for ground alignment
  transform: playerTransform,
});

// Player state
let velocity = { x: 0, y: 0 };
let isGrounded = true;

// Game loop
game.onUpdate((dt: number) => {
  // Update animation based on player state
  if (isGrounded) {
    if (Math.abs(velocity.x) > 10) {
      playerAnim.playAnimation('run');
      playerAnim.flipX = velocity.x < 0;
    } else {
      playerAnim.playAnimation('idle');
    }
  } else {
    if (velocity.y < 0) {
      playerAnim.playAnimation('jump');
    } else {
      playerAnim.playAnimation('fall');
    }
  }

  // Update animation (required each frame)
  playerAnim.update(dt);
});

// Handle attack animation completion
playerAnim.onAnimationComplete = (name: string) => {
  if (name === 'attack') {
    playerAnim.playAnimation('idle');
  }
};
```
