# Bonk Engine

A 2D game engine with MDX scene format, designed for AI collaboration.

## Quick Start

```bash
npm install
npm run dev
```

## Architecture

```
BUILD TIME                                    RUNTIME
─────────────────────────────────────────    ─────────────────────────────

scenes/Level1.mdx  ───┐
scenes/Level2.mdx  ───┼─► Vite Plugin ─────► /scenes/*.json ──► SceneLoader
prefabs/*.mdx      ───┘   (recma transform)                         │
                                                                    │
behaviors/*.ts     ───────► esbuild ───────► /behaviors/*.js ───────┤
                                                                    │
                                                                    ▼
                                              Vanilla TS Game Loop (No React)
```

## Project Structure

```
bonk-engine/
├── src/
│   └── engine/           # Core engine classes
│       ├── types/        # TypeScript type definitions
│       ├── physics/      # Physics abstraction (Matter.js)
│       └── components/   # Built-in components
├── tools/
│   └── vite-plugin-bonk-scenes/  # MDX → JSON compiler
├── behaviors/            # Game behaviors (scripts)
├── scenes/               # MDX scene files
├── prefabs/              # MDX prefab files
└── public/               # Compiled output
```

## Scene Format (MDX)

```mdx
# My Level

<Scene>
  <Scene.Settings gravity={[0, 980]} backgroundColor="#1a1a2e" />

  <GameObject name="Player" position={[100, 200]} tag="Player">
    <Sprite src="./sprites/player.png" />
    <Behavior src="./behaviors/PlayerController.ts" props={{ speed: 200 }} />
  </GameObject>
</Scene>
```

## Creating Behaviors

```typescript
import { Behavior } from '../src/engine/Behavior';

export default class MyBehavior extends Behavior {
  speed: number = 100;

  update(): void {
    this.transform.translate(this.speed * this.deltaTime, 0);
  }
}
```

## Core Classes

- **GameObject** - Entities with transform, components, and behaviors
- **Component** - Data/functionality attached to GameObjects
- **Behavior** - Scripts with lifecycle hooks (awake, start, update, fixedUpdate)
- **Scene** - Container for GameObjects
- **Transform** - 2D position, rotation, scale

## Lifecycle Hooks

```typescript
class MyBehavior extends Behavior {
  awake(): void {}        // Called once on creation
  start(): void {}        // Called after all awakes
  update(): void {}       // Called every frame
  fixedUpdate(): void {}  // Called at fixed timestep (60fps)
  lateUpdate(): void {}   // Called after update
  onDestroy(): void {}    // Called on destruction
}
```

## Coroutines

```typescript
*fadeOut() {
  for (let alpha = 1; alpha >= 0; alpha -= 0.1) {
    this.sprite.alpha = alpha;
    yield* this.wait(0.1);  // Respects Time.timeScale
  }
}

start(): void {
  this.startCoroutine(this.fadeOut());
}
```

## Hot Reload

- Behavior changes: Preserved props, reinitialize instances
- Scene changes: Diff and patch GameObjects
- Works automatically in dev mode

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run typecheck  # Type checking
```
