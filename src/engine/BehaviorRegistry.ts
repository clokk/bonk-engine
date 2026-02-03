/**
 * BehaviorRegistry - Central registry for all behavior classes.
 * Re-exports registration functions and provides utilities.
 */

export {
  registerBehavior,
  registerBehaviors,
  getBehavior,
  getRegisteredBehaviorNames,
  clearBehaviorRegistry,
  type BehaviorClass,
} from './BehaviorLoader';
