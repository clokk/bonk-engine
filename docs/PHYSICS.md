# Physics System

Bonk Engine uses Matter.js for 2D physics simulation.

## Creating Physics Bodies

Physics bodies are created through the Game instance and managed directly in TypeScript:

```typescript
import { Game, RigidBody, Transform, CollisionLayers } from 'bonk-engine';

const game = new Game({ width: 800, height: 600 });

// Create a transform for positioning
const transform = new Transform([100, 100], 0, [1, 1]);

// Create a physics body
const body = game.createBody(transform, {
  bodyType: 'dynamic',
  mass: 1,
  friction: 0.1,
  restitution: 0,
  gravityScale: 1,
  fixedRotation: false,
  linearDamping: 0.01
});

// Add a collider to define the shape
body.addCollider({
  type: 'box',
  width: 32,
  height: 32
});
```

## Configuration Options

**Body Configuration:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `bodyType` | `'dynamic' \| 'static' \| 'kinematic'` | `'dynamic'` | How the body behaves |
| `mass` | `number` | `1` | Body mass (affects forces) |
| `friction` | `number` | `0.1` | Surface friction |
| `restitution` | `number` | `0` | Bounciness (0-1) |
| `gravityScale` | `number` | `1` | Gravity multiplier (0 = no gravity) |
| `fixedRotation` | `boolean` | `false` | Prevent rotation |
| `linearDamping` | `number` | `0.01` | Air resistance |

**Body Types:**
- `dynamic` - Fully simulated, affected by gravity and forces
- `static` - Never moves, used for ground/walls
- `kinematic` - Moved by code, not affected by forces

## Collider Shapes

Bodies need at least one collider to participate in physics:

```typescript
// Box collider
body.addCollider({
  type: 'box',
  width: 32,
  height: 32,
  offset: [0, 0]  // optional offset from body position
});

// Circle collider
body.addCollider({
  type: 'circle',
  radius: 16,
  offset: [0, 0]
});

// Polygon collider (convex only)
body.addCollider({
  type: 'polygon',
  vertices: [[0, 0], [32, 0], [16, 32]],
  offset: [0, 0]
});
```

**Collider Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `'box' \| 'circle' \| 'polygon'` | required | Collision shape type |
| `offset` | `[x, y]` | `[0, 0]` | Offset from body position |
| `isTrigger` | `boolean` | `false` | Detect overlap without collision |
| `layer` | `string` | `'default'` | Collision layer this collider belongs to |
| `mask` | `string[]` | `[]` (all) | Layers this collider interacts with |

## Runtime API

### Velocity

```typescript
// Get current velocity
const [vx, vy] = body.velocity;

// Set velocity directly
body.velocity = [100, 0];

// Modify y-velocity while preserving x
const [vx, _] = body.velocity;
body.velocity = [vx, -500];
```

### Forces and Impulses

```typescript
// Apply continuous force (like wind, called every frame)
body.applyForce([10, 0]);

// Apply instant impulse (like explosion, called once)
body.applyImpulse([0, -500]);
```

### Synchronization

```typescript
// For dynamic bodies: update transform from physics simulation
body.syncFromPhysics();

// For kinematic bodies: push transform changes to physics
body.syncToPhysics();
```

## Collision Callbacks

Bodies can respond to collisions with other bodies:

```typescript
const player = game.createBody(playerTransform, { bodyType: 'dynamic' });
player.addCollider({ type: 'box', width: 32, height: 64 });

player.onCollisionEnter((other, contact) => {
  console.log('Hit body:', other);
  console.log('Contact point:', contact.point);
  console.log('Contact normal:', contact.normal);
});

player.onCollisionExit((other) => {
  console.log('Stopped touching:', other);
});
```

**ContactInfo properties:**
- `point: [x, y]` - World-space contact point
- `normal: [x, y]` - Surface normal at contact point

## Triggers

A collider with `isTrigger: true` is a **sensor** — it detects overlaps without physical collision response. Sensor collisions route to trigger callbacks instead of collision callbacks.

```typescript
const pickupZone = game.createBody(transform, { bodyType: 'kinematic', gravityScale: 0 });

// Add trigger collider
pickupZone.addCollider({
  type: 'box',
  width: 80,
  height: 80,
  isTrigger: true
});

// Register trigger callbacks
pickupZone.onTriggerEnter((other) => {
  console.log('Body entered trigger zone:', other);
  // Handle pickup logic
});

pickupZone.onTriggerExit((other) => {
  console.log('Body left trigger zone:', other);
});
```

**Key differences from collision callbacks:**
- Trigger callbacks do **not** receive `ContactInfo` — sensors don't generate contact points
- If either body in a pair is a sensor, trigger callbacks fire (not collision callbacks)
- Triggers don't affect movement — objects pass through freely

**Common use cases:** pickup zones, damage areas, checkpoints, level transitions, detection volumes.

## Collision Layers

Collision layers control which objects can collide with each other using bitmask filtering.

### Layer Configuration

Configure layers directly on colliders:

```typescript
import { CollisionLayers } from 'bonk-engine';

// Player collides with everything
const player = game.createBody(playerTransform, { bodyType: 'dynamic' });
player.addCollider({
  type: 'box',
  width: 32,
  height: 64,
  layer: 'player'
  // mask: [] means collide with all layers
});

// Enemy only collides with player and projectiles
const enemy = game.createBody(enemyTransform, { bodyType: 'dynamic' });
enemy.addCollider({
  type: 'circle',
  radius: 16,
  layer: 'enemy',
  mask: ['player', 'projectile']
});

// Bullet only hits enemies (passes through player)
const bullet = game.createBody(bulletTransform, { bodyType: 'dynamic' });
bullet.addCollider({
  type: 'circle',
  radius: 4,
  layer: 'projectile',
  mask: ['enemy']
});
```

- **`layer`** — Which layer this collider belongs to. Default: `"default"`.
- **`mask`** — Which layers this collider interacts with. Empty array = collides with everything.

### Example Setup

| Object | Layer | Mask | Result |
|--------|-------|------|--------|
| Player | `"player"` | `[]` (empty) | Collides with everything |
| Enemy | `"enemy"` | `["player", "projectile"]` | Collides with player and projectiles only |
| Bullet | `"projectile"` | `["enemy"]` | Passes through player, hits enemies |
| Ground | `"default"` | `[]` (empty) | Collides with everything |

### Runtime API

```typescript
import { CollisionLayers } from 'bonk-engine';

// Pre-register layers (optional - auto-registers on first use)
CollisionLayers.register('player');
CollisionLayers.register('enemy');
CollisionLayers.register('projectile');

// Get bitmask for a layer (auto-registers if new)
const playerCategory = CollisionLayers.category('player');

// Get combined bitmask for multiple layers
const enemyMask = CollisionLayers.mask(['player', 'enemy']);

// Get all registered layer names
const allLayers = CollisionLayers.getLayerNames();
```

## Physics Queries

Query the physics world for raycasting and area checks:

```typescript
// Raycast - find first body along a ray
const hit = game.physics.raycast(
  [100, 100],    // origin point
  [1, 0],        // direction vector (should be normalized)
  200            // max distance
);

if (hit) {
  console.log('Hit at:', hit.point);           // [x, y] contact point
  console.log('Surface normal:', hit.normal);  // [x, y] surface normal
  console.log('Distance:', hit.distance);      // distance to hit
  console.log('Body:', hit.body);              // RigidBody that was hit
}

// Query AABB - find all bodies in a rectangular area
const bodies = game.physics.queryAABB(
  [0, 0],        // min corner [x, y]
  [100, 100]     // max corner [x, y]
);

bodies.forEach(body => {
  console.log('Found body in area:', body);
});
```

## Complete Example

```typescript
import { Game, Transform, CollisionLayers } from 'bonk-engine';

const game = new Game({
  width: 800,
  height: 600,
  gravity: [0, 980]  // pixels/second²
});

// Register collision layers
CollisionLayers.register('player');
CollisionLayers.register('enemy');
CollisionLayers.register('projectile');

// Create player
const playerTransform = new Transform([100, 100], 0, [1, 1]);
const player = game.createBody(playerTransform, {
  bodyType: 'dynamic',
  fixedRotation: true
});
player.addCollider({
  type: 'box',
  width: 32,
  height: 64,
  layer: 'player'
});

// Create static ground
const groundTransform = new Transform([400, 550], 0, [1, 1]);
const ground = game.createBody(groundTransform, {
  bodyType: 'static'
});
ground.addCollider({
  type: 'box',
  width: 800,
  height: 32
});

// Create enemy with collision filtering
const enemyTransform = new Transform([300, 100], 0, [1, 1]);
const enemy = game.createBody(enemyTransform, {
  bodyType: 'dynamic'
});
enemy.addCollider({
  type: 'circle',
  radius: 16,
  layer: 'enemy',
  mask: ['player', 'projectile']  // doesn't collide with other enemies
});

// Create trigger zone (pickup)
const coinTransform = new Transform([200, 200], 0, [1, 1]);
const coin = game.createBody(coinTransform, {
  bodyType: 'kinematic',
  gravityScale: 0
});
coin.addCollider({
  type: 'circle',
  radius: 16,
  isTrigger: true
});
coin.onTriggerEnter((other) => {
  console.log('Coin collected!');
  // Remove coin from game
});

// Game loop with fixed timestep physics
game.start();
```

## Timing

Physics runs at a fixed 60Hz timestep (by default):
- Physics updates happen at consistent intervals regardless of framerate
- Use fixed timestep for physics calculations
- Rendering can run at variable framerate

## Velocity and Movement

Matter.js velocity is in **pixels per physics step**, not pixels per second. When setting velocity for continuous movement, scale appropriately:

```typescript
const speed = 250;  // pixels per second
const fixedDeltaTime = 1 / 60;  // 60Hz physics

// Continuous horizontal movement (applied every frame)
const [_, vy] = body.velocity;
body.velocity = [speed * fixedDeltaTime, vy];

// One-time velocity change (like jump) - also scale
const jumpForce = 500;  // pixels per second
const [vx, _] = body.velocity;
body.velocity = [vx, -jumpForce * fixedDeltaTime];
```

With `speed = 250` and `fixedDeltaTime = 1/60`:
- Velocity per step: ~4.17 pixels
- Effective speed: 250 pixels/second

## Tips

1. **Performance**: Use simple shapes (box, circle) over polygons when possible
2. **Tunneling**: For fast-moving objects, use smaller colliders or increase physics step rate
3. **Stacking**: Use low restitution (0) for stable stacks of objects
4. **One-way platforms**: Use collision layers to filter which objects interact
5. **Layer optimization**: Only include necessary layers in mask arrays to reduce collision checks
6. **Trigger zones**: Use kinematic bodies with `gravityScale: 0` for stationary triggers
7. **Cleanup**: Remove bodies from the game when no longer needed to free resources
