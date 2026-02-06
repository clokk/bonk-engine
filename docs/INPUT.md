# Input System

Bonk Engine provides a Unity-familiar input system with named axes and buttons, plus raw keyboard and mouse access.

## Axes

Axes return a value between -1 and 1, useful for continuous movement.

```typescript
import { Input } from 'bonk-engine';

// Smoothed value (accelerates/decelerates)
const moveX = Input.getAxis('horizontal');

// Raw value (instant -1, 0, or 1)
const moveX = Input.getAxisRaw('horizontal');
```

### Default Axes

| Name | Negative | Positive |
|------|----------|----------|
| `horizontal` | A / ArrowLeft | D / ArrowRight |
| `vertical` | W / ArrowUp | S / ArrowDown |

### Custom Axes

```typescript
import { Input } from 'bonk-engine';

Input.setAxis('strafe', {
  positive: ['KeyE'],
  negative: ['KeyQ'],
  smoothing: 10,
});
```

`smoothing` controls how fast the value ramps from 0 to 1. Higher = snappier.

## Buttons

Buttons are for discrete actions (jump, fire, interact).

```typescript
import { Input } from 'bonk-engine';

// Held down right now
if (Input.getButton('jump')) { ... }

// Pressed this frame (single-frame true)
if (Input.getButtonDown('fire')) { ... }

// Released this frame
if (Input.getButtonUp('jump')) { ... }
```

### Default Buttons

| Name | Keys |
|------|------|
| `jump` | Space |
| `fire` | X, Left Mouse |

### Custom Buttons

```typescript
Input.setButton('interact', {
  keys: ['KeyE'],
});
```

## Raw Keys

Access any key directly using [KeyboardEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) values:

```typescript
import { Input } from 'bonk-engine';

if (Input.getKey('ShiftLeft')) { ... }       // held
if (Input.getKeyDown('KeyP')) { ... }        // pressed this frame
if (Input.getKeyUp('Escape')) { ... }        // released this frame
```

## Mouse

```typescript
import { Input } from 'bonk-engine';

// Position relative to canvas
const [mx, my] = Input.mousePosition;

// Mouse buttons: 0=left, 1=middle, 2=right
if (Input.getMouseButton(0)) { ... }         // held
if (Input.getMouseButtonDown(2)) { ... }     // right-click this frame
```

## Using Input in Game Code

All input methods are static on the `Input` class:

```typescript
import { Input, Runtime } from 'bonk-engine';

class PlayerController {
  speed: number = 200;
  jumpForce: number = 400;
  entityId: string;

  constructor(entityId: string) {
    this.entityId = entityId;
  }

  update(dt: number): void {
    // Movement
    const dx = Input.getAxisRaw('horizontal') * this.speed * dt;
    Runtime.transform.translate(this.entityId, dx, 0);

    // Jump
    if (Input.getButtonDown('jump')) {
      Runtime.rigidbody.applyImpulse(this.entityId, [0, -this.jumpForce]);
    }
  }
}
```

## Replacing the Entire Config

```typescript
Input.setConfig({
  axes: {
    horizontal: { positive: ['KeyD', 'ArrowRight'], negative: ['KeyA', 'ArrowLeft'], smoothing: 10 },
    vertical: { positive: ['KeyS', 'ArrowDown'], negative: ['KeyW', 'ArrowUp'], smoothing: 10 },
  },
  buttons: {
    jump: { keys: ['Space'] },
    fire: { keys: ['KeyX'] },
    interact: { keys: ['KeyE'] },
  },
});
```

## Frame Timing

`Input.update()` is called at the end of each frame by the game loop. This means:
- `getButtonDown()` returns true for exactly one frame
- `getAxisRaw()` reflects the current key state
- `getAxis()` smoothly interpolates toward the target value

The engine handles this automatically -- you don't need to call `Input.update()` yourself.
