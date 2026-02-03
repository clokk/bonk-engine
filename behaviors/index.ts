/**
 * Behavior Registry - Auto-imports and registers all behaviors.
 * This file is the source of truth for production behavior resolution.
 */

import { registerBehaviors } from '../src/engine/BehaviorRegistry';

// Import all behaviors
import PlayerController from './PlayerController';
import Rotator from './Rotator';
import Follower from './Follower';

// Register all behaviors
registerBehaviors({
  PlayerController,
  Rotator,
  Follower,
});

// Export for type checking
export { PlayerController, Rotator, Follower };
