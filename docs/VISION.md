# Bonk Engine Vision

A 2D game runtime library built for AI collaboration. TypeScript-first, cross-platform, web-native. Claude writes the game, Bonk provides the capabilities.

**Not a framework.** A library. Bonk provides rendering, physics, input, audio, and cross-platform builds. Games bring their own architecture — Claude picks what fits.

**The name:** Playful, memorable, approachable. Serious tech doesn't need a serious name. "Built with Bonk Engine" is both a flex and a conversation starter.

## Core Thesis

The best game engine for AI collaboration is a library, not a framework.

Claude thinks in TypeScript. TypeScript IS the scene format. When you force game ideas through JSON or a component hierarchy, you strip away the things Claude is best at — conditionals, computation, abstraction, and choosing the right architecture per game.

A platformer wants entity composition. A turn-based artillery game wants a state machine. A card game wants neither. The engine shouldn't impose an opinion. It should provide tools.

## Core Principles

1. **TypeScript is the scene format** — No JSON intermediary. Game code is the source of truth.
2. **Library, not framework** — Import what you need. No forced architecture.
3. **The library is never required** — Games are standalone TypeScript projects. `npm run dev` works without Bonk tooling. Bonk provides modules you import, not an environment you run inside.
4. **Tooling is optional visibility** — Bonk's dev tooling (viewport overlays, debug wireframes, runtime inspection) gives humans visibility into what Claude built. It's a Vite plugin you add to your config — not a dependency your game needs to function.
5. **Claude is the editor** — The terminal is the primary interface. The viewport is for visual feedback.
6. **Cross-platform from day one** — Web, desktop (Tauri/Steam), mobile (Capacitor).
7. **AI-readable everything** — All text, all TypeScript, all diffable and mergeable.
8. **Opinionated runtime, unopinionated structure** — The game loop, physics timestep, and render pipeline are well-defined. How you organize your game is up to you.
9. **Approachable over intimidating** — The meme-friendly name is intentional.

## Library vs Tooling

Bonk has two layers. Only the first is required.

**`bonk-engine`** (the library) — TypeScript modules for rendering, physics, input, audio. Import what you need. Your game is a standard Vite + TypeScript project. `npm run dev` works. `npm run build` works. No special runtime, no wrapper, no CLI.

**`bonk-vite-plugin`** (the tooling) — A Vite plugin that gives humans visibility into the game. Debug wireframes, physics body outlines, performance overlays, runtime state inspection. Add one line to `vite.config.ts` and it lights up. Remove it and nothing changes — your game still runs.

```typescript
// vite.config.ts — tooling is one optional line
import { defineConfig } from 'vite';
import bonk from 'bonk-vite-plugin'; // optional

export default defineConfig({
  plugins: [bonk()], // remove this line and your game still works
});
```

This is the React / React DevTools split. The game never knows the tooling exists. The tooling subscribes to engine events (body created, collision fired, sprite added) that the library emits at zero cost when nobody's listening. In production builds, the plugin isn't included.

**Why this matters for AI collaboration:** Claude writes game code against the library API. The human uses the tooling to see what Claude built — viewport, wireframes, state. Neither depends on the other. Claude doesn't need the tooling to write code. The human doesn't need Claude to use the tooling.

## AI Collaboration Design

**Why this architecture helps AI:**

1. **Full TypeScript expressiveness** — Claude uses conditionals, loops, abstractions, and any architecture pattern. No data format bottleneck.
2. **No translation layer** — Claude writes game code directly against the runtime API. No component registry, no scene loader, no serialization ceremony.
3. **Hot reload via Vite HMR** — Claude edits a file, saves it, the game updates. Same developer experience as JSON hot reload, but with full language capabilities.
4. **Each game gets the right architecture** — Claude evaluates the game's needs and picks the structure. A particle-heavy game gets object pools. A turn-based game gets a state machine. Nothing is forced.
5. **The viewport provides verification** — Claude writes code, the human watches the game. "The jump feels floaty" → Claude adjusts parameters → immediate visual feedback.

**The collaboration loop:**
```
1. Human: "Let's make a worms-style artillery game"
2. Claude: Creates terrain system, turn state machine, weapon definitions
3. Human: "The explosions feel weak"
4. Claude: Reads the code, adjusts blast radius / particle count / screen shake
5. Human: "Ship it to Steam and web"
6. Claude: npm run build:web / npm run build:tauri
```

## Why Not Scenes

The original architecture used JSON scenes + GameObject/Component/Behavior (Unity-style). This was retired because:

- **Scenes imposed one architecture.** Every game forced into spatial-objects-with-components, regardless of fit.
- **JSON is less expressive than TypeScript.** No conditionals, no computation, no abstraction.
- **The "editor" is Claude Code.** Inspector panels are a slower interface to the same data Claude reads/writes directly.
- **Scene infrastructure solved problems that don't exist in AI-first workflows.** Serialization for property panels, visual tweaking, non-programmer access — all handled by talking to Claude in English.

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Language | TypeScript (strict) | AI guardrails, type safety |
| Rendering | PixiJS v8 | Fast WebGL, lightweight |
| Physics | Matter.js + Verlet (planned) | 2D-native, dual-layer |
| Audio | Howler.js | Handles browser quirks |
| Input | Custom | Axes, buttons, raw keys |
| Desktop | Tauri | 3-8MB vs Electron's 150MB |
| Mobile | Capacitor | Clean native wrapper |
| Build | Vite | Fast HMR, standard tooling |

## Export Targets

```bash
npm run dev              # Hot-reload development
npm run build            # → dist/ (production web build)
```

Cross-platform builds (Tauri desktop, Capacitor mobile) are planned but not yet implemented. Web is the primary target.

## Branding

**Name:** Bonk Engine
**Domain:** bonkengine.com

**Why the name works:**
- Memorable, shareable, meme-native
- Approachable for beginners and AI-assisted devs
- Stands out from serious names (Unity, Unreal, Godot)
- "Built with Bonk Engine" is a conversation starter
- The contrast (cute name / serious tech) is the feature
