# Time System

Bonk Engine's `Time` class provides frame timing and time scaling.

## Core Properties

| Property | Type | Description |
|----------|------|-------------|
| `Time.deltaTime` | `number` | Seconds since last frame, scaled by `timeScale` |
| `Time.unscaledDeltaTime` | `number` | Raw seconds since last frame (ignores timeScale) |
| `Time.fixedDeltaTime` | `number` | Fixed physics timestep (1/60 = 0.01667s) |
| `Time.time` | `number` | Total elapsed time (scaled) |
| `Time.unscaledTime` | `number` | Total elapsed time (unscaled) |
| `Time.timeScale` | `number` | Time multiplier. 1 = normal, 0 = paused, 0.5 = half speed |
| `Time.frameCount` | `number` | Total frames since start |
| `Time.fps` | `number` | Current frames per second |

## Basic Usage

Import and use `Time` directly:

```typescript
import { Time, Input } from 'bonkjs';

game.onUpdate(() => {
  // Frame-rate independent movement
  const speed = 200;
  if (Input.getButton('right')) {
    player.transform.translate(speed * Time.deltaTime, 0);
  }
});

game.onFixedUpdate(() => {
  // Physics uses fixedDeltaTime
  player.rigidbody?.applyForce([10 * Time.fixedDeltaTime, 0]);
});
```

## Time Scale

`Time.timeScale` multiplies `deltaTime`. This affects everything that reads `deltaTime` or uses coroutines.

```typescript
// Slow motion
Time.timeScale = 0.25;

// Pause (deltaTime becomes 0)
Time.timeScale = 0;

// Normal speed
Time.timeScale = 1;

// Fast forward
Time.timeScale = 2;
```

### Pausing

Set `timeScale` to 0 to pause gameplay. Use `unscaledDeltaTime` for things that should still animate during pause (menu transitions, UI):

```typescript
import { Time, Input } from 'bonkjs';

game.onUpdate(() => {
  if (Input.getButtonDown('pause')) {
    if (Time.timeScale === 0) {
      Time.timeScale = 1;
    } else {
      Time.timeScale = 0;
    }
  }

  // UI animation that continues during pause
  menuAlpha += 2 * Time.unscaledDeltaTime;
});
```

### Hit Freeze

Classic hit-stop effect using coroutines:

```typescript
import { GlobalScheduler, Time } from 'bonkjs';

function* hitFreeze() {
  Time.timeScale = 0.05;

  // Wait using scaled time - this waits 0.1 game seconds
  // which is ~2 real seconds at timeScale 0.05
  const start = Time.time;
  while (Time.time - start < 0.1) {
    yield;
  }

  Time.timeScale = 1;
}

// Trigger hit freeze on collision
game.onCollisionEnter((collision) => {
  if (collision.other.tag === 'enemy') {
    GlobalScheduler.start(hitFreeze);
  }
});
```

For a real-time duration instead:

```typescript
function* hitFreezeRealtime() {
  Time.timeScale = 0.05;

  // Wait using unscaled time - always 0.1 real seconds
  const start = Time.unscaledTime;
  while (Time.unscaledTime - start < 0.1) {
    yield;
  }

  Time.timeScale = 1;
}
```

## Game Loop Timing

The engine runs two update loops:

1. **Fixed update** (60 Hz) -- Runs at a constant rate using an accumulator pattern. Physics runs here.
2. **Variable update** -- `onUpdate()` and `onLateUpdate()` run once per rendered frame. Use `deltaTime` for frame-rate independent logic.

```
Each frame:
  Time.update(rawDeltaTime)
  fixedUpdate()  ×N (catches up to real time at 1/60s intervals)
  update()       ×1
  lateUpdate()   ×1
  Input.update()
  render()
```

### Callbacks

Register callbacks with the game instance:

```typescript
import { Time, Input } from 'bonkjs';

// Variable timestep - runs every frame
game.onUpdate(() => {
  console.log(`Frame ${Time.frameCount}, dt: ${Time.deltaTime}`);
});

// Fixed timestep - runs at 60 Hz
game.onFixedUpdate(() => {
  // Physics and deterministic logic here
  console.log(`Fixed update, dt: ${Time.fixedDeltaTime}`);
});

// After all updates - useful for cameras
game.onLateUpdate(() => {
  camera.followTarget(player.transform.position);
});
```

## Common Patterns

### Frame-rate Independent Movement

```typescript
import { Time, Input } from 'bonkjs';

const speed = 100; // units per second

game.onUpdate(() => {
  let dx = 0;
  let dy = 0;

  if (Input.getButton('left')) dx -= 1;
  if (Input.getButton('right')) dx += 1;
  if (Input.getButton('up')) dy -= 1;
  if (Input.getButton('down')) dy += 1;

  // Scale by deltaTime for smooth movement at any framerate
  entity.transform.translate(
    dx * speed * Time.deltaTime,
    dy * speed * Time.deltaTime
  );
});
```

### Timers and Delays

```typescript
import { GlobalScheduler, Time } from 'bonkjs';

function* delayedAction() {
  console.log('Starting...');

  // Wait 2 seconds (scaled time)
  const start = Time.time;
  while (Time.time - start < 2) {
    yield;
  }

  console.log('2 seconds later!');
}

GlobalScheduler.start(delayedAction);
```

### FPS Display

```typescript
import { Time } from 'bonkjs';

game.onUpdate(() => {
  fpsText.text = `FPS: ${Math.round(Time.fps)}`;
});
```
