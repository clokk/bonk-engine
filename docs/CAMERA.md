# Camera System

bonkjs provides a Camera class for viewport control with smooth following, zoom, bounds, and deadzone support. The camera operates directly on a PixiJS Container.

## Basic Usage

```typescript
import { Game, Camera } from 'bonkjs';

const game = new Game();
const { world } = await game.init({ width: 1920, height: 1080 });

const camera = new Camera(world, {
  viewport: { width: 1920, height: 1080 },
  followSmoothing: 8,
});
```

The first argument is the PixiJS Container the camera controls (typically the `world` container from `Game.init()`). The `viewport` config tells the camera the logical viewport dimensions for bounds clamping.

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
const camera = new Camera(world, {
  viewport: { width: 1920, height: 1080 },
  followSmoothing: 10,
});

// Follow the player — pass a function that returns [x, y]
camera.follow(() => [player.x, player.y]);

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
const camera = new Camera(world, {
  viewport: { width: 1920, height: 1080 },
  bounds: {
    minX: 0,
    minY: 0,
    maxX: 2560,
    maxY: 1440,
  },
});
```

The camera will stop scrolling when it reaches the edge of bounds, preventing the viewport from showing empty space outside your level.

## Deadzone

Allow the target to move within a zone before camera follows:

```typescript
camera.deadzone = {
  width: 100,
  height: 50,
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
import { Game, Camera } from 'bonkjs';

const game = new Game();
const { world } = await game.init({ width: 1920, height: 1080 });

// Player position (your game manages this however it wants)
const player = { x: 400, y: 300 };

// Create camera with smooth following
const camera = new Camera(world, {
  viewport: { width: 1920, height: 1080 },
  zoom: 0.75,
  followSmoothing: 8,
  bounds: {
    minX: 0,
    minY: 0,
    maxX: 2560,
    maxY: 1440,
  },
});

// Follow the player
camera.follow(() => [player.x, player.y]);
camera.offset = [0, -30];
camera.deadzone = { width: 80, height: 40 };

// Update camera every frame (after positions are final)
game.onLateUpdate(() => {
  camera.update();
});

// Change target dynamically
const boss = { x: 1200, y: 600 };

// Switch to boss during cutscene
camera.follow(() => [boss.x, boss.y]);
camera.followSmoothing = 3; // Slower for cinematic effect

// Later: snap back to player
camera.snapTo(player.x, player.y);
camera.follow(() => [player.x, player.y]);
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

The Camera class must be updated in `lateUpdate()` to ensure it moves after all physics and movement updates. It transforms the PixiJS world Container directly by setting `scale` and `position`:

```typescript
// Every frame in camera.update():
container.scale.set(zoom, zoom);
container.position.set(
  viewportWidth / 2 - cameraX * zoom,
  viewportHeight / 2 - cameraY * zoom,
);
```

This moves the entire world container rather than individual sprites, which is efficient for large scenes.

The camera calculates its position by:

1. Getting target position from the follow function (or staying at current position)
2. Applying offset
3. Applying deadzone logic (if configured)
4. Smoothly interpolating to new position using `followSmoothing`
5. Clamping to bounds (if configured)
6. Applying position and zoom to the container
