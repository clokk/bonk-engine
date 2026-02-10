# bonkjs Vision

A PixiJS game toolkit built for AI collaboration. TypeScript-first, web-native. Claude writes the game, bonkjs provides the plumbing.

**Not an engine.** A toolkit. bonkjs provides the game loop, input, camera, and devtools. Games use PixiJS directly for rendering and bring their own physics, audio, and architecture.

## Core Thesis

The best game toolkit for AI collaboration is a library, not a framework.

Claude thinks in TypeScript. TypeScript IS the scene format. When you force game ideas through JSON or a component hierarchy, you strip away the things Claude is best at — conditionals, computation, abstraction, and choosing the right architecture per game.

A platformer wants entity composition. A turn-based artillery game wants a state machine. A card game wants neither. The toolkit shouldn't impose an opinion. It should provide the 5% of plumbing every game needs and get out of the way.

## Core Principles

1. **TypeScript is the scene format** — No JSON intermediary. Game code is the source of truth.
2. **Toolkit, not framework** — Import what you need. No forced architecture.
3. **PixiJS is the renderer** — No abstraction layer. `app`, `world`, and `ui` are raw PixiJS objects.
4. **Claude is the editor** — The terminal is the primary interface. The viewport is for visual feedback.
5. **AI-readable everything** — All text, all TypeScript, all diffable and mergeable.
6. **Opinionated loop, unopinionated structure** — The game loop and timestep are well-defined. How you organize your game is up to you.
7. **Lean over comprehensive** — Ship 7 modules, not 30. Every module must earn its place by being needed in every game.

## The Sandwich Model

bonkjs sandwiches the game in three layers. The game-specific code (Layer 2) is where Claude has total creative freedom. Layer 1 is the toolkit. Layer 3 is optional devtools.

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Dev Tools (optional, dev-only)                 │
│  Tweaker overlay for live-tuning constants               │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Game Code (your code, game-specific)           │
│  Whatever architecture THIS game needs — turn systems,   │
│  terrain, inventory, AI, state machines, ECS, nothing    │
├─────────────────────────────────────────────────────────┤
│  Layer 1: bonkjs (game-agnostic toolkit)                 │
│  Game loop, input, camera, math                          │
└─────────────────────────────────────────────────────────┘
```

**Layer 1** (`bonkjs`) — Game loop, input, camera, vec2. Your game is a standard Vite + TypeScript project. `npm run dev` works. `npm run build` works. No special runtime, no CLI.

**Layer 2** (game code) — Whatever Claude decides. Each game gets a fresh architecture. Use PixiJS directly for rendering. Use whatever physics/audio libraries fit.

**Layer 3** (devtools) — The Tweaker overlay for live-editing constants. Wrap in `import.meta.env.DEV` and it's tree-shaken from production.

**Layer 2 is disposable — per game and per era.** Each game gets a fresh architecture. Layers 1 and 3 don't care *how* Layer 2 gets authored. Today it's "Claude writes TypeScript." If the authoring model changes, you swap the middle, keep the bread.

## AI Collaboration Design

**Why this architecture helps AI:**

1. **Full TypeScript expressiveness** — Claude uses conditionals, loops, abstractions, and any architecture pattern. No data format bottleneck.
2. **No translation layer** — Claude writes game code directly against PixiJS + bonkjs. No component registry, no scene loader, no serialization ceremony.
3. **Hot reload via Vite HMR** — Claude edits a file, saves it, the game updates. Same developer experience as JSON hot reload, but with full language capabilities.
4. **Each game gets the right architecture** — Claude evaluates the game's needs and picks the structure. A particle-heavy game gets object pools. A turn-based game gets a state machine. Nothing is forced.

## Why Not More

bonkjs deliberately doesn't include physics, audio, sprites, UI, entity systems, or networking. These are game-specific decisions:

- Some games need Matter.js. Others need custom Euler integration. Others need no physics at all.
- Some games need Howler.js. Others use the Web Audio API directly. Others are silent.
- Some games need a sprite abstraction. Others draw everything with PixiJS Graphics.

Wrapping these in engine abstractions creates leaky abstractions that games fight against. Better to use the libraries directly and let each game make its own choices.

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Language | TypeScript (strict) | AI guardrails, type safety |
| Rendering | PixiJS v8 (direct) | Fast WebGL/WebGPU, rich API |
| Input | bonkjs Input | Axes, buttons, raw keys — needed by every game |
| Game Loop | bonkjs Game | Fixed + variable timestep — needed by every game |
| Camera | bonkjs Camera | Follow, shake, bounds — needed by most games |
| Math | bonkjs vec2 | Immutable tuple math — needed by every 2D game |
| Dev Tools | bonkjs Tweaker | Live constant editing — invaluable for tuning |
| Build | Vite | Fast HMR, standard tooling |
