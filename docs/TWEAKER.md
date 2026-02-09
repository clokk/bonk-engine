# Tweaker

Runtime constants editor for live-tuning game parameters during development. Register your constant objects; the engine renders a searchable HTML overlay with sliders, color pickers, and checkboxes. Toggle with backtick.

## Basic Usage

```typescript
import { Tweaker } from 'bonkjs';

Tweaker.init();
Tweaker.register('Physics', PHYSICS);
// Press ` to toggle overlay
```

## Configuration

Pass options to `Tweaker.init()`:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `hotkey` | `string` | `'Backquote'` | `KeyboardEvent.code` for toggle key |
| `position` | `'left' \| 'right'` | `'right'` | Panel side |
| `width` | `number` | `360` | Panel width in px |
| `storagePrefix` | `string` | `'bonk-tweaker'` | localStorage key prefix |

## Registering Constants

```typescript
// Basic registration
Tweaker.register('Physics', PHYSICS);

// With hints for ambiguous fields (hex colors look like numbers at runtime)
Tweaker.register('Terrain', TERRAIN, {
  hints: { FILL_COLOR: 'color', EDGE_COLOR: 'color' },
});

// Start collapsed
Tweaker.register('Circuit', CIRCUIT, { collapsed: true });

// Nested objects are auto-recursed as sub-groups
Tweaker.register('Wind', WIND);  // WIND.VISUAL becomes a collapsible sub-group
```

### RegisterOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `hints` | `Record<string, FieldHint>` | `{}` | Per-field rendering hints. Key is field name or dot path for nested fields |
| `collapsed` | `boolean` | `false` | Start this group collapsed |

## Field Types

The tweaker auto-detects field types and renders appropriate editors:

| Type | Detection | Editor |
|------|-----------|--------|
| Number | `typeof === 'number'` | Slider + number input |
| Color | Hint `'color'` OR key contains COLOR/TINT + value > 0xFF | Color picker + hex input |
| Boolean | `typeof === 'boolean'` | Checkbox |
| Nested object | Non-array object | Collapsible sub-group (recursed) |
| Getter | `Object.getOwnPropertyDescriptor().get` | Read-only display (auto-refreshed) |
| Array/other | Everything else | Read-only display |

Slider ranges are inferred from the default value. Type any value in the number input to go outside the slider range — the slider auto-expands.

## Persistence

Modified values save to `localStorage` keyed as `{storagePrefix}:{group}:{path}`. On `register()`, saved overrides are applied before the first frame. `reset()` clears localStorage entries and reverts to defaults.

## Presets

```typescript
// Export all current overrides as JSON
const json = Tweaker.exportPreset();

// Import a preset (applies overrides to registered groups)
Tweaker.importPreset(json);
```

The Export button copies JSON to clipboard. The Import button prompts for a JSON string.

## Complete Example

```typescript
import { Tweaker } from 'bonkjs';
import { PHYSICS, RENDERING, PARTICLES } from './constants';

if (import.meta.env.DEV) {
  Tweaker.init({ position: 'right' });

  Tweaker.register('Physics', PHYSICS);
  Tweaker.register('Rendering', RENDERING, {
    hints: { BACKGROUND_COLOR: 'color', GRID_COLOR: 'color' },
    collapsed: true,
  });
  Tweaker.register('Particles', PARTICLES, { collapsed: true });
}
```

## API Reference

| Method | Description |
|--------|-------------|
| `Tweaker.init(config?)` | Initialize the tweaker. Call once at startup |
| `Tweaker.register(name, target, options?)` | Register a constants object for live editing |
| `Tweaker.unregister(name)` | Remove a registered group |
| `Tweaker.show()` | Show the overlay |
| `Tweaker.hide()` | Hide the overlay |
| `Tweaker.toggle()` | Toggle overlay visibility |
| `Tweaker.reset(groupName?)` | Reset group (or all) to defaults, clear localStorage |
| `Tweaker.exportPreset()` | Export overrides as JSON string |
| `Tweaker.importPreset(json)` | Apply overrides from JSON string |
| `Tweaker.destroy()` | Remove overlay, unbind hotkey, clear state |

## Tips

- **Use `import.meta.env.DEV` guard** so the tweaker is tree-shaken from production builds.
- **Group related constants** into separate `register()` calls for organization.
- **Provide color hints** — hex colors and regular numbers are indistinguishable at runtime.
- **Slider ranges auto-infer** from default values; type exact values in the number input to go outside range.
- **Keyboard input is isolated** — typing in the tweaker won't trigger game actions.

## How It Works

- HTML overlay injected as `<body>` child (`position: fixed`), unaffected by game's CSS-transform viewport scaling.
- TypeScript `as const` is compile-time only; objects are mutable at runtime. The tweaker writes directly to registered objects via property mutation.
- All game code reads from the same object reference, so changes propagate instantly.
- No game loop integration; DOM events fire on user interaction only. Zero cost when hidden (`display: none`).
