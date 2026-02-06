# Bonk Engine - AI Collaboration Context

## What This Is

A 2D game runtime library for AI collaboration. TypeScript-first. Claude writes the game, Bonk provides rendering, physics, input, audio as importable modules.

**Core thesis:** The game code IS the scene. No JSON intermediary, no scene hierarchy. Claude decides the architecture per game.

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
└── docs/              # Architecture & API docs
```

## Conventions

### Naming
- TypeScript strict mode everywhere
- PascalCase for classes, camelCase for functions/variables
- `Vector2 = [number, number]` tuple convention throughout

### Code Style
- Prefer composition over inheritance
- No forced base classes — games structure code however they want
- Use generators for async game logic (coroutines)

## How Games Use Bonk

```typescript
import { Game, Sprite, Camera, RigidBody, Input, Time, Transform } from 'bonk-engine';

const game = new Game({ physics: { gravity: [0, 980] } });
const canvas = await game.init({ width: 800, height: 600 });
document.getElementById('app')?.appendChild(canvas);

const player = new Transform({ position: [400, 300] });
const sprite = new Sprite(game.renderer, { width: 48, height: 64, color: 0x00ff00, transform: player });
const body = game.createBody(player, { type: 'dynamic', fixedRotation: true });
body.addCollider({ type: 'box', width: 48, height: 64 });

const camera = new Camera(game.renderer, { followSmoothing: 8 });
camera.follow(() => player.worldPosition);

game.onFixedUpdate(() => { body.syncFromPhysics(); });
game.onUpdate(() => {
  const h = Input.getAxisRaw('horizontal');
  body.velocity = [h * 300, body.velocity[1]];
  sprite.sync();
});
game.onLateUpdate(() => { camera.update(); });

game.start();
```

No scene format. No component hierarchy. Claude picks the right architecture per game.

## Key Runtime Capabilities

### Rendering
- Sprites, animated sprites
- Camera follow/zoom/bounds/deadzone
- Z-index ordering
- PixiJS abstracted — games don't touch Pixi directly

### Physics
- Matter.js rigid body (dynamic, static, kinematic)
- Collider shapes (box, circle, polygon)
- Collision layers (string names → bitmask filtering)
- Triggers (sensor bodies, onTrigger callbacks)
- Collision callbacks routed through Game class
- Raycasting with surface normals

### Input
- Named axes and buttons with configurable bindings
- Raw key/mouse access
- Smoothed and raw axis variants

### Audio
- Howler.js: music, SFX, spatial audio
- Volume categories
- Browser autoplay policy handling

### Math
- `vec2` module: add, sub, normalize, dot, cross, lerp, rotate, distance, etc.

### Game Loop
- Fixed timestep physics (60Hz) with accumulator pattern
- Variable timestep rendering
- Time scaling
- Coroutine scheduler (generator-based)

## Commands

```bash
npm run dev          # Hot-reload dev server (browser)
npm run build        # Production build
npm run typecheck    # Type check only
```

## Key Files

| File | Purpose |
|------|---------|
| `src/runtime/Game.ts` | Central game class — loop, physics, collision routing |
| `src/runtime/Transform.ts` | 2D positioning with hierarchy |
| `src/render/Sprite.ts` | Standalone sprite (sync from Transform) |
| `src/render/Camera.ts` | Camera follow/zoom/bounds |
| `src/physics/RigidBody.ts` | Physics body with collision callbacks |
| `src/input/Input.ts` | Input system (axes, buttons, keys) |
| `src/audio/AudioSource.ts` | Per-source audio playback |
| `src/types.ts` | Shared types |
| `docs/ARCHITECTURE.md` | Full architecture |
