export type {
  PhysicsWorld,
  PhysicsBody,
  RigidBodyConfig as PhysicsRigidBodyConfig,
  ColliderConfig,
  RaycastHit,
  CollisionEvent,
  CollisionCallback,
  PhysicsWorldConfig,
} from './PhysicsWorld';

export {
  registerPhysicsBackend,
  createPhysicsWorld,
  getPhysicsBackends,
} from './PhysicsWorld';

export { MatterPhysicsWorld } from './MatterPhysicsWorld';
export { CollisionLayers } from './CollisionLayers';
export { RigidBody, type RigidBodyConfig, type ContactInfo } from './RigidBody';

// Auto-register Matter.js backend
import './MatterPhysicsWorld';
