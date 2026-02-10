# Event Patterns

bonkjs is a toolkit, not a framework — it doesn't ship an event system. Your game manages its own event architecture using whatever pattern fits.

This doc covers common event patterns for games built with bonkjs.

## Simple EventEmitter

A minimal pub/sub implementation fits in ~30 lines and works for most games:

```typescript
type Listener<T = any> = (data: T) => void;

class EventEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on<T>(event: string, callback: Listener<T>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  emit<T>(event: string, data?: T): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  removeAll(event?: string): void {
    if (event) this.listeners.delete(event);
    else this.listeners.clear();
  }
}
```

## Event Architecture Patterns

### Single Global Bus

One emitter for everything. Simple, good for small games:

```typescript
const events = new EventEmitter();

// Anywhere in your game
events.emit('enemy-killed', { type: 'boss', position: [100, 200] });

// Multiple systems react
events.on('enemy-killed', (data) => {
  updateScore(data.type);
  spawnParticles(data.position);
  checkQuestProgress(data.type);
});
```

**Pros:** Simple, everything in one place
**Cons:** Can become cluttered in large games

### Domain-Specific Emitters

Separate emitters for different game systems:

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

### Direct Callbacks (No Events)

For many games, you don't need events at all. Direct function calls or callback registrations work fine:

```typescript
// Instead of events, just call functions directly
function killEnemy(enemy: Enemy) {
  score += enemy.points;
  spawnExplosion(enemy.x, enemy.y);
  enemies.splice(enemies.indexOf(enemy), 1);
}

// Or use callback arrays for decoupling
const onPlayerDied: Array<() => void> = [];
onPlayerDied.push(() => showDeathScreen());
onPlayerDied.push(() => playDeathSound());

function playerDied() {
  onPlayerDied.forEach(cb => cb());
}
```

## Example: Health System

```typescript
class HealthSystem {
  private events = new EventEmitter();
  private hp = 100;

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

## Best Practices

1. **Clean up listeners** when systems are destroyed to avoid memory leaks:
   ```typescript
   class GameScreen {
     private unsubs: Array<() => void> = [];

     init() {
       this.unsubs.push(
         events.on('game-over', this.handleGameOver)
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

   // Typed emitter prevents typos and wrong data shapes
   const gameEvents = new EventEmitter<GameEvents>();
   gameEvents.emit('player-died', { position: [100, 200] });
   ```

3. **Avoid event spam**: Debounce or throttle high-frequency events.

4. **Document your event contracts**: Make it clear what events exist and what data they carry.

5. **Consider whether you need events at all.** For small games with 2-3 systems, direct function calls are simpler and easier to trace. Events shine when you need decoupling between systems that shouldn't know about each other.
