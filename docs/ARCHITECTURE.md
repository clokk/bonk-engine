# Bonk Engine Architecture

## Overview

Bonk Engine is a 2D game runtime library. It provides rendering, physics, input, audio, and cross-platform builds as importable TypeScript modules. Games bring their own architecture.

## Module Structure

```
@bonk/runtime     Game loop, time, lifecycle
@bonk/render      PixiJS: sprites, animated sprites, text, cameras
@bonk/physics     Matter.js rigid body + Verlet kinematic (planned)
@bonk/input       Keyboard, mouse, touch, gamepad
@bonk/audio       Howler.js: music, SFX, spatial audio
@bonk/math        vec2 utilities, common game math
@bonk/build       Build targets: browser, Tauri, Capacitor
```

A game imports what it needs:

```typescript
import { Game } from '@bonk/runtime';
import { Sprite, Camera } from '@bonk/render';
import { RigidBody, Collider } from '@bonk/physics';
import { Input } from '@bonk/input';
import { vec2 } from '@bonk/math';
```

## Game Loop

The `Game` class owns the core loop: fixed timestep for physics, variable timestep for rendering.

```typescript
function gameLoop() {
  const dt = calculateDeltaTime();
  Time.update(dt);

  // Fixed timestep for physics (accumulator pattern)
  accumulator += dt;
  while (accumulator >= fixedTimestep) {
    game.fixedUpdate();   // Physics, deterministic logic
    accumulator -= fixedTimestep;
  }

  // Variable timestep
  game.update();          // Game logic
  game.lateUpdate();      // Camera follow, post-processing

  // Render
  renderer.render();

  requestAnimationFrame(gameLoop);
}
```

Games register callbacks:

```typescript
const game = new Game({ width: 800, height: 600 });

game.onFixedUpdate(() => {
  // Physics-rate logic (60Hz)
});

game.onUpdate((dt) => {
  // Per-frame logic
});

game.onLateUpdate(() => {
  // Post-update (camera, etc.)
});

game.start();
```

## Rendering

PixiJS v8 abstracted behind a clean API. Games don't touch Pixi directly.

```
┌─────────────────────────────────────────────────────┐
│  @bonk/render                                       │
│  ┌───────────────────────────────────────────────┐  │
│  │  Sprite(src, position) → SpriteHandle         │  │
│  │  AnimatedSprite(config) → AnimatedHandle      │  │
│  │  Text(content, style) → TextHandle            │  │
│  │  Camera: follow, zoom, bounds                 │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  PixiJS v8 (internal)                               │
│  - PIXI.Application wrapper                         │
│  - Sortable container for z-index                   │
│  - Texture caching via PIXI.Assets                  │
└─────────────────────────────────────────────────────┘
```

## Physics

Matter.js for rigid body dynamics. Verlet kinematic system planned for projectiles, particles, and game-owned collision response.

```
┌─────────────────────────────────────────────────────┐
│  @bonk/physics                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  PhysicsWorld: step, gravity, raycast, query  │  │
│  │  RigidBody: create, forces, velocity          │  │
│  │  Collider: box, circle, polygon, sensor       │  │
│  │  CollisionLayers: name-to-bitmask registry    │  │
│  │  Callbacks: onCollision, onTrigger            │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  Matter.js (internal)                               │
│  - Rigid body dynamics                              │
│  - Shape-vs-shape collision                         │
│  - Contact solving                                  │
└─────────────────────────────────────────────────────┘
```

Planned: Verlet kinematic system for lightweight physics (projectiles, particles) where the game owns collision response.

## Input

```typescript
// Named axes and buttons (configurable)
const moveX = Input.getAxisRaw('horizontal');  // -1, 0, or 1
const jump = Input.getButtonDown('jump');       // true on press frame

// Raw key access
const shift = Input.getKey('ShiftLeft');

// Mouse
const [mx, my] = Input.mousePosition;
const click = Input.getMouseButtonDown(0);
```

## Audio

Howler.js with volume categories and spatial audio:

```typescript
import { AudioManager } from '@bonk/audio';

AudioManager.playMusic('bgm.mp3', { volume: 0.5, loop: true });
AudioManager.playSFX('explosion.wav', { volume: 0.8 });
```

## Cross-Platform Builds

Same game code runs everywhere. The build system handles platform differences.

```
TypeScript Game Code
        │
        ├── npm run build:web    → Vite → static site (any web host)
        ├── npm run build:tauri  → Tauri → native desktop (Steam-ready)
        └── npm run build:mobile → Capacitor → iOS/Android
```

## Project Structure

```
bonk-engine/
├── src/
│   ├── runtime/       # Game, Time, Scheduler, EventSystem, Transform
│   ├── render/        # Renderer, PixiRenderer, Sprite, AnimatedSprite, Camera
│   ├── physics/       # PhysicsWorld, MatterPhysicsWorld, CollisionLayers, RigidBody
│   ├── input/         # Input
│   ├── audio/         # AudioManager, AudioSource
│   ├── math/          # vec2
│   ├── ui/            # UIManager, UIElement, primitives, layout
│   ├── types.ts       # Shared types (Vector2, AxisConfig, TransformJson, etc.)
│   ├── index.ts       # Public API barrel export
│   └── main.ts        # Example game
└── docs/              # Documentation
```
