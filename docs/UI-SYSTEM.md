# Bonk Engine UI System

The UI system provides screen-space interface elements for menus, HUDs, and overlays. UI elements render on top of the game world and are unaffected by camera transforms.

## Key Concepts

### Screen-Space vs World-Space

- **Game objects** (sprites, physics bodies) exist in world-space and are affected by the camera
- **UIElements** render in screen-space — fixed on screen regardless of camera position/zoom

This separation keeps concerns clean. UI positioning works fundamentally differently from game object positioning.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PIXI.JS APPLICATION                          │
├─────────────────────────────────────────────────────────────────┤
│  app.stage                                                      │
│  ├── worldContainer (camera-affected)                           │
│  │   └── Game sprites, tilemaps, etc.                          │
│  │                                                              │
│  └── uiContainer (screen-space, fixed at 0,0)                  │
│      └── UI elements (panels, text, buttons)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Anchor System

Elements position themselves relative to screen edges using anchors:

```
┌─────────────────────────────────────────┐
│ top-left     top-center     top-right   │
│                                         │
│ center-left    center    center-right   │
│                                         │
│ bottom-left bottom-center bottom-right  │
└─────────────────────────────────────────┘
```

The `offset` then moves the element from that anchor point in pixels.

## Quick Start

```typescript
import {
  UIManager,
  UIPanel,
  UIHBox,
  UIImage,
  UIText,
  UIButton,
} from 'bonkjs';

// Create UI manager (pass your renderer)
const ui = new UIManager(renderer);

// Create a health bar in the top-left
const healthBar = new UIPanel({
  anchor: 'top-left',
  offset: [20, 20],
  padding: [8, 12, 8, 12],
  backgroundColor: 0x333333,
  borderRadius: 4,
});

const hbox = new UIHBox({ gap: 8, align: 'center' });
hbox.addChild(new UIImage({ src: './ui/heart.png', width: 24, height: 24 }));
hbox.addChild(new UIText({ text: '100', fontSize: 18, color: '#ff6666' }));

healthBar.addChild(hbox);
ui.addRoot(healthBar);

// In your game loop:
function gameLoop() {
  // Process UI input BEFORE game input
  const consumed = ui.processInput();
  if (!consumed) {
    // Handle game input only if UI didn't consume it
    handleGameInput();
  }

  // Update and layout UI
  ui.update();
  ui.layout();

  // ... rest of game loop
}
```

## UI Elements

### UIElement (Base Class)

All UI elements inherit from `UIElement`. Common properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `anchor` | `UIAnchor` | `'top-left'` | Screen anchor point |
| `offset` | `[x, y]` | `[0, 0]` | Pixel offset from anchor |
| `size` | `[w, h]` | `[0, 0]` | Explicit size (0 = auto) |
| `visible` | `boolean` | `true` | Whether element is rendered |
| `alpha` | `number` | `1` | Opacity (0-1) |
| `zIndex` | `number` | `0` | Render order (higher = on top) |

### UIText

Displays text using PixiJS Text rendering.

```typescript
const label = new UIText({
  text: 'Score: 0',
  fontSize: 24,
  fontFamily: 'Arial, sans-serif',
  color: '#ffffff',
  fontWeight: 'bold',
  align: 'center', // For multi-line text
  wordWrapWidth: 200, // 0 = no wrap
});

// Update text dynamically
label.text = 'Score: 100';
```

### UIImage

Displays an image with optional sizing and tinting.

```typescript
const icon = new UIImage({
  src: './ui/coin.png',
  width: 32,  // Explicit size (omit for natural size)
  height: 32,
  tint: 0xffff00, // Optional color tint
});
```

### UIPanel

A container with background, border, and padding. Children are positioned inside the padding area.

```typescript
const panel = new UIPanel({
  backgroundColor: 0x222222,
  borderColor: 0x666666,
  borderWidth: 2,
  borderRadius: 8,
  padding: [16, 16, 16, 16], // [top, right, bottom, left]
});

panel.addChild(new UIText({ text: 'Hello!' }));
```

### UIButton

An interactive panel with hover, pressed, and disabled states.

```typescript
const button = new UIButton({
  backgroundColor: 0x4488ff,
  hoverColor: 0x66aaff,    // Auto-generated if omitted
  pressedColor: 0x2266dd,  // Auto-generated if omitted
  padding: [8, 16, 8, 16],
  borderRadius: 4,
  onClick: () => {
    console.log('Button clicked!');
  },
});

button.addChild(new UIText({ text: 'Click Me' }));

// Disable the button
button.disabled = true;
```

## Layout Containers

### UIVBox

Stacks children vertically (top to bottom).

```typescript
const menu = new UIVBox({
  gap: 8,                   // Space between children
  padding: [16, 16, 16, 16], // Inner padding
  align: 'center',          // 'start' | 'center' | 'end'
  anchor: 'center',
});

menu.addChild(new UIText({ text: 'Main Menu', fontSize: 32 }));
menu.addChild(new UIButton({ ... }));
menu.addChild(new UIButton({ ... }));
```

### UIHBox

Stacks children horizontally (left to right).

```typescript
const toolbar = new UIHBox({
  gap: 8,
  align: 'center', // Vertical alignment
});

toolbar.addChild(new UIImage({ src: './ui/icon1.png' }));
toolbar.addChild(new UIImage({ src: './ui/icon2.png' }));
toolbar.addChild(new UIImage({ src: './ui/icon3.png' }));
```

## UIManager

The `UIManager` orchestrates the UI system:

```typescript
const ui = new UIManager(renderer);

// Add/remove root elements
ui.addRoot(element);
ui.removeRoot(element);

// Get all roots
const roots = ui.getRoots();

// Find elements
const element = ui.findById('my-element-id');
const element = ui.findByName('my-element-name');

// Enable/disable UI
ui.setActive(false);

// Clean up
ui.destroy();
```

### Game Loop Integration

The UI system processes input **before** the game to prevent clicks from passing through:

```typescript
function gameLoop() {
  Time.update();
  Input.update();

  // UI input first - returns true if UI consumed the input
  const uiConsumed = ui.processInput();

  if (!uiConsumed) {
    // Only handle game input if UI didn't consume it
    handleGameInput();
  }

  // Update game
  updateGame();

  // Update UI
  ui.update();
  ui.layout();

  // Render
  renderer.render();
}
```

## Input Handling

Interactive elements (like UIButton) implement the `UIInteractive` interface:

```typescript
interface UIInteractive {
  onPointerEnter?(event: UIPointerEvent): void;
  onPointerExit?(event: UIPointerEvent): void;
  onPointerDown?(event: UIPointerEvent): void;
  onPointerUp?(event: UIPointerEvent): void;
}
```

You can implement custom interactive elements:

```typescript
class UISlider extends UIElement implements UIInteractive {
  onPointerDown(event: UIPointerEvent): void {
    // Start dragging
    event.consumed = true; // Prevent game from receiving click
  }

  onPointerUp(event: UIPointerEvent): void {
    // Stop dragging
  }
}
```

## Hierarchy

UI elements can be nested:

```typescript
const parent = new UIPanel({ ... });
const child = new UIText({ text: 'Hello' });

parent.addChild(child);
parent.removeChild(child);

// Get children
const children = parent.getChildren();

// Destroy removes from parent and cleans up
child.destroy();
```

Child elements position relative to their parent's content area (inside padding for UIPanel).

## Example: Complete HUD

```typescript
function createHUD(ui: UIManager): void {
  // Health bar (top-left)
  const healthPanel = new UIPanel({
    anchor: 'top-left',
    offset: [20, 20],
    padding: [8, 12, 8, 12],
    backgroundColor: 0x333333,
    borderRadius: 4,
  });

  const healthRow = new UIHBox({ gap: 8, align: 'center' });
  healthRow.addChild(new UIImage({ src: './ui/heart.png', width: 24, height: 24 }));
  const healthText = new UIText({ text: '100', fontSize: 18, color: '#ff6666' });
  healthRow.addChild(healthText);

  healthPanel.addChild(healthRow);
  ui.addRoot(healthPanel);

  // Score (top-right)
  const scoreText = new UIText({
    text: 'Score: 0',
    fontSize: 24,
    color: '#ffffff',
    anchor: 'top-right',
    offset: [20, 20],
  });
  ui.addRoot(scoreText);

  // Pause button (bottom-right)
  const pauseButton = new UIButton({
    anchor: 'bottom-right',
    offset: [20, 20],
    padding: [8, 16, 8, 16],
    backgroundColor: 0x444444,
    borderRadius: 4,
    onClick: () => togglePause(),
  });
  pauseButton.addChild(new UIText({ text: 'Pause' }));
  ui.addRoot(pauseButton);

  // Update health from game state
  function updateHealth(hp: number): void {
    healthText.text = String(hp);
  }

  function updateScore(score: number): void {
    scoreText.text = `Score: ${score}`;
  }
}
```

## Extending the UI System

### Creating Custom Layout Containers

When creating custom layout containers that override child positioning, you must keep `computedPosition` in sync for hit testing to work correctly on nested elements.

**Key methods for custom layouts:**

| Method | Purpose |
|--------|---------|
| `setComputedPosition(x, y)` | Completely override child position (use in VBox/HBox-style layouts) |
| `offsetComputedPosition(dx, dy)` | Adjust child position by offset (use for padding) |
| `getWorldPosition()` | Get absolute screen position (walks up parent chain) |

**Example: Custom Grid Layout**

```typescript
class UIGrid extends UIElement {
  columns: number = 3;
  cellSize: [number, number] = [50, 50];
  gap: number = 4;

  protected override layoutChildren(viewport: { width: number; height: number }): void {
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      const col = i % this.columns;
      const row = Math.floor(i / this.columns);

      // Layout child to compute its size
      child.layout({ width: this.cellSize[0], height: this.cellSize[1] });

      // Calculate grid position
      const x = col * (this.cellSize[0] + this.gap);
      const y = row * (this.cellSize[1] + this.gap);

      // IMPORTANT: Use setComputedPosition to keep hit testing in sync
      child.setComputedPosition(x, y);
    }
  }
}
```

**Why this matters:**

The UI uses `computedPosition` for hit testing. When layout containers position children, they must update `computedPosition`—not just the PixiJS display object—or clicks won't register on nested elements.

```
Screen coordinates (mouse position)
         ↓
    hitTest() uses getWorldPosition()
         ↓
    getWorldPosition() walks up parent chain using computedPosition
         ↓
    If computedPosition is stale, hit test fails!
```

### Hit Testing Details

Hit testing converts screen coordinates to element bounds:

1. `UIManager.processInput()` gets mouse position in screen coordinates
2. Calls `hitTest(point)` on each root element
3. `hitTest` recursively checks children (highest zIndex first)
4. `containsPoint(point)` uses `getWorldPosition()` to get absolute bounds
5. `getWorldPosition()` accumulates positions up the parent chain

This ensures deeply nested elements (e.g., button inside VBox inside Panel) receive clicks correctly.

## Type Reference

### UIAnchor

```typescript
type UIAnchor =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';
```

### UIPadding

```typescript
type UIPadding = [top: number, right: number, bottom: number, left: number];
```

### UILayoutAlign

```typescript
type UILayoutAlign = 'start' | 'center' | 'end';
```

### UIButtonState

```typescript
type UIButtonState = 'normal' | 'hover' | 'pressed' | 'disabled';
```

### UIElement Methods (for extension)

```typescript
// Position management (for custom layout containers)
getWorldPosition(): Vector2           // Absolute screen position
setComputedPosition(x, y): void       // Set position (updates display + hit test)
offsetComputedPosition(dx, dy): void  // Offset position (for padding)

// Layout
layout(viewport): void                // Compute size and position
measureContent(): Vector2             // Return intrinsic content size (override this)
layoutChildren(viewport): void        // Position children (override for custom layouts)

// Hit testing
containsPoint(point): boolean         // Check if screen point is inside bounds
hitTest(point): UIElement | null      // Find topmost element at point
```
