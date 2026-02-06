# Bonk Engine Documentation

## Start Here

| Your goal | Read |
|-----------|------|
| Understand what Bonk Engine is | [VISION.md](./VISION.md) |
| Get the architecture picture | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Contribute to the engine codebase | [../CLAUDE.md](../CLAUDE.md) (conventions, key files) |

## Runtime Capabilities

| Doc | Capability | Module |
|-----|------------|--------|
| [PHYSICS.md](./PHYSICS.md) | Rigid bodies, colliders, collision layers, triggers, raycasting | `physics/` |
| [INPUT.md](./INPUT.md) | Keyboard, mouse, axes, buttons, configuration | `input/` |
| [TIME.md](./TIME.md) | Delta time, timeScale, pause, slow-motion | `runtime/` |
| [EVENTS.md](./EVENTS.md) | EventEmitter, global events, cross-system messaging | `runtime/` |
| [CAMERA.md](./CAMERA.md) | Camera follow, zoom, bounds, deadzone | `render/` |
| [AUDIO-SYSTEM.md](./AUDIO-SYSTEM.md) | Music, SFX, spatial audio, volume categories | `audio/` |
| [ANIMATED-SPRITES.md](./ANIMATED-SPRITES.md) | Sprite sheet animation, frame control, callbacks | `render/` |
| [UI-SYSTEM.md](./UI-SYSTEM.md) | Screen-space UI elements, layout, hit testing | `ui/` |

## Reference

| Doc | What it covers |
|-----|----------------|
| [VISION.md](./VISION.md) | Design principles, AI collaboration philosophy, tech stack |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Module structure, game loop, project layout |
| [UI-RESEARCH.md](./UI-RESEARCH.md) | Research notes on UI system design (Godot/Unity/Phaser comparison) |
| [../CLAUDE.md](../CLAUDE.md) | AI collaboration context, conventions, key files |
| [REFACTOR-PLAN.md](./REFACTOR-PLAN.md) | Runtime library refactor plan (completed) |
