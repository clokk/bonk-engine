# Camera System

Bonk Engine provides a Camera class for viewport control with smooth following, zoom, bounds, and deadzone support.

## Basic Usage

Import and create a Camera:

```typescript
import { Camera, Game } from 'bonkjs';

const game = new Game({ width: 800, height: 600 });
const camera = new Camera(game.renderer, { followSmoothing: 8 });
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `zoom` | `number` | `1` | Zoom level (1 = 100%) |
| `followSmoothing` | `number` | `5` | Follow speed (higher = faster) |
| `offset` | `[x, y]` | `[0, 0]` | Offset from target |
| `bounds` | `object` | - | World bounds to constrain camera |
| `deadzone` | `object` | - | Area target can move without camera moving |

## Following a Target

The camera smoothly follows a target using a function that returns the target's position:

```typescript
import { Camera, Game, Transform } from 'bonkjs';

const game = new Game({ width: 800, height: 600 });
const camera = new Camera(game.renderer, { followSmoothing: 10 });

// Create a player transform
const player = new Transform();
player.position = [100, 100];

// Follow the player - pass a function that returns [x, y]
camera.follow(() => player.worldPosition);

// Optional: add offset to show more ahead of player
camera.offset = [0, -50];

// Must call update() in lateUpdate
game.onLateUpdate(() => {
  camera.update();
});
```

Higher `followSmoothing` = tighter follow. Use lower values (3-5) for a looser, more cinematic feel. Use higher values (8-12) for responsive action games.

## Zoom

```typescript
// Zoom in (2x magnification)
camera.zoom = 2;

// Zoom out (0.5x magnification)
camera.zoom = 0.5;
```

## Bounds

Constrain the camera to world limits:

```typescript
camera.bounds = {
  minX: 0,
  minY: 0,
  maxX: 1600,
  maxY: 900
};
```

The camera will stop scrolling when it reaches the edge of bounds, preventing the viewport from showing empty space outside your level.

## Deadzone

Allow the target to move within a zone before camera follows:

```typescript
camera.deadzone = {
  width: 100,
  height: 50
};
```

Useful for platformers where you don't want constant horizontal camera movement. The target can move within the deadzone rectangle without the camera moving.

## Instant Positioning

Snap the camera to a position without smoothing:

```typescript
// Teleport camera immediately
camera.snapTo(500, 300);
```

Useful for level transitions or respawning.

## Complete Example

```typescript
import { Camera, Game, Transform } from 'bonkjs';

const game = new Game({ width: 800, height: 600 });

// Create player
const player = new Transform();
player.position = [400, 300];

// Create camera with smooth following
const camera = new Camera(game.renderer, {
  followSmoothing: 8
});

// Configure camera
camera.follow(() => player.worldPosition);
camera.offset = [0, -30]; // Show more ahead
camera.zoom = 1;
camera.bounds = {
  minX: 0,
  minY: 0,
  maxX: 1600,
  maxY: 900
};
camera.deadzone = {
  width: 80,
  height: 40
};

// Update camera every frame
game.onLateUpdate(() => {
  camera.update();
});

// Change target dynamically
const boss = new Transform();
boss.position = [1200, 600];

// Switch to boss during cutscene
camera.follow(() => boss.worldPosition);
camera.followSmoothing = 3; // Slower for cinematic effect

// Later: snap back to player
camera.snapTo(player.position[0], player.position[1]);
camera.follow(() => player.worldPosition);
camera.followSmoothing = 8;
```

## Tips

1. **Smoothing**: Start with 5-10, adjust based on feel
   - Fast action games: 8-12
   - Platformers: 5-8
   - Cinematic sequences: 2-4

2. **Offset**: Use negative Y offset to show more ahead of player
   - Top-down: `[0, 0]` (centered)
   - Platformers: `[0, -50]` (show more above)
   - Side-scrollers: `[50, 0]` (show more ahead)

3. **Bounds**: Set to your level size to prevent showing empty space
   - Always set for finite levels
   - Omit for infinite procedural worlds

4. **Deadzone**: Great for platformers, use sparingly for top-down
   - Platformers: `{ width: 80, height: 40 }`
   - Top-down action: `{ width: 30, height: 30 }` or none
   - Racing games: none (tight follow)

## How It Works

The Camera class must be updated in `lateUpdate()` to ensure it moves after all physics and movement updates. It transforms the PixiJS `worldContainer`, not individual sprites, which is efficient for large scenes.

The camera calculates its position by:

1. Getting target position from the follow function (or staying at current position)
2. Applying offset
3. Applying deadzone logic (if configured)
4. Smoothly interpolating to new position using `followSmoothing`
5. Clamping to bounds (if configured)
6. Applying position and zoom to the renderer's world container
