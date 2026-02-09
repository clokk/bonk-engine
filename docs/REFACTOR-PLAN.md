# Bonk Engine — Runtime Library Refactor Plan

**Status: COMPLETED** (February 2026)

Refactored bonkjs from a scene-based game engine (GameObject/Component/Behavior + JSON scenes) into a runtime library with importable modules and no forced architecture.

---

## Target Architecture

```
src/
├── runtime/       # Game, Time, Scheduler, EventSystem, Transform
├── render/        # Renderer, PixiRenderer, Sprite, AnimatedSprite, Camera
├── physics/       # PhysicsWorld, MatterPhysicsWorld, CollisionLayers, RigidBody
├── input/         # Input
├── audio/         # AudioManager, AudioSource
├── math/          # vec2
├── ui/            # UIManager, UIElement, primitives, layout
├── types.ts       # Shared types (Vector2, AxisConfig, TransformJson, etc.)
├── index.ts       # Public API barrel export
└── main.ts        # Example game
```

### Target API

```typescript
import { Game, Sprite, Camera, RigidBody, Input, Time, Transform } from 'bonkjs';

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

---

## What Was Done

### Phase 1: Atomic Restructure (DONE)

**1a. Deleted old code (~50 files)**
- Editor UI (`src/editor/`, `editor.html`), Tauri backend (`src-tauri/`), demo behaviors (`behaviors/`), tests (`src/tests/`)
- Scene system: `Scene.ts`, `GameObject.ts`, `Component.ts`, `Behavior.ts`, `SceneLoader.ts`, `BehaviorLoader.ts`, `BehaviorRegistry.ts`, `HotReload.ts`, `WorldManager.ts`
- All 7 component wrappers (`components/`)
- Editor configs: `postcss.config.js`, `tailwind.config.js`
- JSON scene/prefab files
- Stripped editor deps from `package.json` (react, zustand, tailwindcss, @tauri-apps/*, @radix-ui/*, etc.)

**1b. Moved clean modules to new structure**
- 16+ files moved via `git mv` from `src/engine/` to new directories
- All import paths updated

**1c. Created `src/types.ts`** — consolidated shared types from multiple old type files

**1d-1i. Created new standalone classes**
- `Game.ts` — central class with game loop, collision routing, body registration
- `Sprite.ts` — standalone sprite with optional Transform sync
- `AnimatedSprite.ts` — frame-rate independent animation
- `Camera.ts` — function-based follow target, deadzone, bounds
- `RigidBody.ts` — Transform + PhysicsBody coupling with collision callbacks
- `AudioSource.ts` — standalone audio playback with spatial audio

**1j-1m. Fixed interfaces, created barrel exports, updated build config**
- Renderer.ts: changed pixi.js Container types to `unknown`
- EventSystem.ts: removed scene-specific events
- Barrel exports for all modules
- vite.config.ts, tsconfig.json stripped of editor config

**1n-1o. Example game and verification**
- `src/main.ts`: player with physics, platforms, trigger zone, camera follow
- `npm run typecheck` — clean
- `npm run build` — passes
- `npm run dev` — game runs

### Phase 2: Collision Callbacks (DONE)

Implemented as part of Phase 1:
- RigidBody: `onCollisionEnter/Exit`, `onTriggerEnter/Exit`
- Game: collision routing via `Map<bodyId, RigidBody>`, subscribed to physics events
- Trigger zone test in example game

### Phase 3: Polish and Docs (DONE)

- Deleted legacy docs (SCENES-AND-PREFABS.md, EDITOR-MVP.md, EDITOR-STYLE-GUIDE.md)
- Rewrote all capability docs to use new API (PHYSICS, INPUT, TIME, EVENTS, CAMERA, AUDIO-SYSTEM, ANIMATED-SPRITES)
- Updated ARCHITECTURE.md, README.md, CLAUDE.md, VISION.md, UI-SYSTEM.md
- Updated `claudeverse/projects/bonkjs.md` roadmap

---

## Key Design Decisions

### Game owns renderer + physics, but NOT entities
Games manage their own objects. Game provides the loop, the renderer, and the physics world. This is the core library-not-framework principle.

### Singletons for Input and Time, instances for Renderer and Physics
`Input.getAxisRaw()` and `Time.deltaTime` stay as static globals — there's never a reason for two of these. Renderer and PhysicsWorld are instances owned by Game — you could theoretically have multiple.

### Camera.follow() takes a function
`camera.follow(() => player.worldPosition)` instead of `camera.follow(player)`. This avoids coupling the camera to any entity type. The game provides a position getter however it wants.

### RigidBody couples Transform + PhysicsBody
RigidBody owns the sync between a Transform and a PhysicsBody. Games call `syncFromPhysics()` (dynamic bodies) or `syncToPhysics()` (kinematic bodies) in their update loops. This is explicit rather than magic.

### Collision routing through Game.createBody()
`game.createBody()` auto-registers the RigidBody for collision routing. Games that want manual control can create RigidBody directly and register with `game.registerBody()`.

---

## File Change Summary

| Action | Count | Details |
|--------|-------|---------|
| DELETE | ~50 files | Editor, scene system, components, behaviors, tests, configs |
| MOVE | ~16 files | Clean runtime modules from engine/ to new structure |
| CREATE | ~12 files | Game, Sprite, AnimatedSprite, Camera, RigidBody, AudioSource, barrel exports, types |
| MODIFY | ~5 files | vite.config, tsconfig, package.json, main.ts, index.html |
