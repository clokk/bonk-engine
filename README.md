# bonkjs

A 2D game toolkit for AI collaboration. TypeScript-first. No scene format, no component hierarchy — Claude decides the architecture per game.

## Install

```bash
npm install bonkjs
```

## Quick Start

```typescript
import { Game, Sprite, Camera, RigidBody, Input, Transform } from 'bonkjs';

const game = new Game();
const canvas = await game.init({ width: 800, height: 600 });
document.getElementById('app')!.appendChild(canvas);

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

No scene format. No component hierarchy. Import what you need — tree-shaking handles the rest.

## What It Provides

- **Rendering** — Sprites, animated sprites, camera follow/zoom/bounds, z-ordering, screen shake (PixiJS v8)
- **Physics** — Rigid body, collider shapes, collision layers, triggers, raycasting (Matter.js)
- **Input** — Named axes and buttons, raw key/mouse access, smoothed variants
- **Audio** — Music, SFX, spatial audio, browser autoplay handling (Howler.js)
- **Math** — vec2 operations (add, sub, normalize, dot, cross, lerp, rotate, distance)
- **Game Loop** — Fixed timestep physics (60Hz), variable render, time scaling, coroutines

## What It Does NOT Provide

- Scene format or scene loader
- GameObject/Component/Behavior hierarchy
- Editor panels or inspector
- Entity-component framework

Games build their own architecture. The game code IS the scene.

## Architecture — The Sandwich Model

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Bonk Overlay (game-agnostic dev tools)        │
│  Debug wireframes, performance overlays, build targets  │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Game Code (your code, game-specific)          │
│  Whatever architecture THIS game needs                  │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Bonk Runtime (game-agnostic tools)            │
│  Rendering, physics, input, audio, math, camera, UI     │
└─────────────────────────────────────────────────────────┘
```

Layer 1 is the npm package. Layer 2 is whatever your game needs. Layer 3 is optional dev tooling (planned).

## Commands

```bash
npm run dev          # Hot-reload dev server (port 3000)
npm run build        # Library build (ESM + declarations → dist/)
npm run build:watch  # Library build with file watching
npm run typecheck    # Type check only
```

## Documentation

- [CLAUDE.md](./CLAUDE.md) — AI collaboration context, new game setup recipe, npm link workflow
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Full architecture
- [docs/CAMERA.md](./docs/CAMERA.md) — Camera system
- [docs/PHYSICS.md](./docs/PHYSICS.md) — Physics and collision
- [docs/INPUT.md](./docs/INPUT.md) — Input system
- [docs/AUDIO-SYSTEM.md](./docs/AUDIO-SYSTEM.md) — Audio
- [docs/EVENTS.md](./docs/EVENTS.md) — Event system
- [docs/UI-SYSTEM.md](./docs/UI-SYSTEM.md) — UI system
