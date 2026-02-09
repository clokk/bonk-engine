# Event System

Bonk Engine provides an EventEmitter utility for decoupled communication in your game. The engine itself is event-agnostic — you manage your own event architecture.

## EventEmitter

Create your own EventEmitter instances for custom events:

```typescript
import { EventEmitter, GlobalEvents, EngineEvents } from 'bonkjs';

const gameEvents = new EventEmitter();
const uiEvents = new EventEmitter();
```

### Subscribe

```typescript
// Subscribe (returns unsubscribe function)
const unsub = gameEvents.on('playerDied', (data) => {
  console.log('Player died at', data.position);
});

// One-time listener
gameEvents.once('levelComplete', () => {
  loadNextLevel();
});

// Unsubscribe
unsub();
// or
gameEvents.off('playerDied', callback);
```

### Emit

```typescript
gameEvents.emit('playerDied', { position: [100, 200] });
gameEvents.emit('scoreChanged', { score: 500 });
```

### Cleanup

```typescript
gameEvents.removeAllListeners();        // Remove all
gameEvents.removeAllListeners('score'); // Remove all for one event
gameEvents.hasListeners('score');       // Check if anyone's listening
```

## Global Events

`GlobalEvents` is a singleton for game-wide events:

```typescript
import { GlobalEvents } from 'bonkjs';

// In one part of your game
GlobalEvents.emit('coin-collected', { value: 10 });

// In another part
GlobalEvents.on('coin-collected', ({ value }) => {
  updateScore(value);
});
```

## Built-in Engine Events

The engine emits these automatically via `GlobalEvents`:

| Event | Data | When |
|-------|------|------|
| `EngineEvents.PAUSE` | | Game paused |
| `EngineEvents.RESUME` | | Game resumed |
| `EngineEvents.COLLISION_ENTER` | `{ bodyA, bodyB }` | Physical collision starts (non-sensor bodies) |
| `EngineEvents.COLLISION_EXIT` | `{ bodyA, bodyB }` | Physical collision ends (non-sensor bodies) |
| `EngineEvents.TRIGGER_ENTER` | `{ bodyA, bodyB }` | Sensor overlap detected (`isTrigger: true` on either body) |
| `EngineEvents.TRIGGER_EXIT` | `{ bodyA, bodyB }` | Sensor overlap ended |

```typescript
import { GlobalEvents, EngineEvents } from 'bonkjs';

GlobalEvents.on(EngineEvents.PAUSE, () => {
  console.log('Game paused');
});

GlobalEvents.on(EngineEvents.COLLISION_ENTER, ({ bodyA, bodyB }) => {
  handleCollision(bodyA, bodyB);
});
```

## Event Architecture Patterns

How you structure events is up to you. Here are common patterns:

### Single Global Bus

Use `GlobalEvents` for everything:

```typescript
// Anywhere in your game
GlobalEvents.emit('enemy-killed', { type: 'boss', position: [100, 200] });

// Multiple systems react
GlobalEvents.on('enemy-killed', (data) => {
  updateScore(data.type);
  spawnParticles(data.position);
  checkQuestProgress(data.type);
});
```

**Pros:** Simple, everything in one place
**Cons:** Can become cluttered in large games

### Domain-Specific Emitters

Create separate EventEmitters for different game systems:

```typescript
const combatEvents = new EventEmitter();
const uiEvents = new EventEmitter();
const questEvents = new EventEmitter();

combatEvents.on('damage-dealt', handleDamage);
uiEvents.on('menu-opened', pauseGame);
questEvents.on('objective-complete', showNotification);
```

**Pros:** Better organization, easier to debug
**Cons:** Need to pass emitters to code that needs them

### Hybrid Approach

Use `GlobalEvents` for engine-level concerns and custom emitters for gameplay:

```typescript
// Engine-level: pause/resume, collisions
GlobalEvents.on(EngineEvents.PAUSE, handlePause);

// Gameplay-level: custom emitters
const playerEvents = new EventEmitter();
const enemyEvents = new EventEmitter();

playerEvents.on('level-up', showLevelUpEffect);
enemyEvents.on('spawned', addToEnemyList);
```

**Pros:** Clear separation of concerns
**Cons:** More boilerplate

## Example: Health System

```typescript
import { EventEmitter } from 'bonkjs';

class HealthSystem {
  private events = new EventEmitter();
  private hp: number = 100;

  takeDamage(amount: number): void {
    this.hp -= amount;
    this.events.emit('damaged', { hp: this.hp, amount });

    if (this.hp <= 0) {
      this.events.emit('died');
    }
  }

  onDamaged(callback: (data: { hp: number; amount: number }) => void) {
    return this.events.on('damaged', callback);
  }

  onDied(callback: () => void) {
    return this.events.on('died', callback);
  }
}

// Usage
const health = new HealthSystem();

health.onDamaged(({ hp }) => {
  updateHealthBar(hp);
});

health.onDied(() => {
  showDeathScreen();
});

health.takeDamage(50);
```

## Example: Pub/Sub for Decoupled Systems

```typescript
import { GlobalEvents } from 'bonkjs';

// Publisher: doesn't know who's listening
function killEnemy(enemyType: string, position: [number, number]) {
  GlobalEvents.emit('enemy-killed', { type: enemyType, position });
}

// Subscribers: independent systems react
class ScoreManager {
  constructor() {
    GlobalEvents.on('enemy-killed', ({ type }) => {
      this.addScore(type === 'boss' ? 1000 : 100);
    });
  }

  addScore(points: number) {
    // Update score
  }
}

class ParticleSpawner {
  constructor() {
    GlobalEvents.on('enemy-killed', ({ position }) => {
      this.spawnExplosion(position);
    });
  }

  spawnExplosion(position: [number, number]) {
    // Spawn particles
  }
}

class QuestTracker {
  constructor() {
    GlobalEvents.on('enemy-killed', ({ type }) => {
      this.checkQuest('kill-enemies', type);
    });
  }

  checkQuest(questId: string, enemyType: string) {
    // Update quest progress
  }
}
```

## Best Practices

1. **Clean up listeners** when systems are destroyed to avoid memory leaks:
   ```typescript
   class Game {
     private unsubs: Array<() => void> = [];

     init() {
       this.unsubs.push(
         GlobalEvents.on('game-over', this.handleGameOver)
       );
     }

     destroy() {
       this.unsubs.forEach(unsub => unsub());
     }
   }
   ```

2. **Use TypeScript for event type safety**:
   ```typescript
   type GameEvents = {
     'player-died': { position: [number, number] };
     'score-changed': { score: number };
     'level-complete': void;
   };

   const gameEvents = new EventEmitter<GameEvents>();

   // TypeScript will enforce correct event names and data types
   gameEvents.emit('player-died', { position: [100, 200] });
   ```

3. **Avoid event spam**: Debounce or throttle high-frequency events:
   ```typescript
   let scoreUpdateQueued = false;

   function updateScore(delta: number) {
     score += delta;

     if (!scoreUpdateQueued) {
       scoreUpdateQueued = true;
       requestAnimationFrame(() => {
         gameEvents.emit('score-changed', { score });
         scoreUpdateQueued = false;
       });
     }
   }
   ```

4. **Document your event contracts**: Make it clear what events exist and what data they carry:
   ```typescript
   /**
    * Game Events:
    * - 'player-died': { position: [x, y] } - Emitted when player health reaches 0
    * - 'coin-collected': { value: number } - Emitted when player picks up a coin
    * - 'level-complete': void - Emitted when all objectives are met
    */
   export const gameEvents = new EventEmitter();
   ```
