import React, { useState, useCallback } from 'react';
import { Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { EditableNumberInput, EditableCheckbox } from './EditableInputs';
import { usePropertyChange } from '@editor/hooks/usePropertyChange';
import type { RigidBody2DComponent } from '@engine/components/RigidBody2DComponent';

interface RigidBodyInspectorProps {
  rigidBody: RigidBody2DComponent | null;
}

export const RigidBodyInspector: React.FC<RigidBodyInspectorProps> = ({
  rigidBody,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const markDirty = usePropertyChange();

  const handleMassChange = useCallback(
    (value: number) => {
      if (!rigidBody) return;
      rigidBody.mass = value;
      markDirty();
    },
    [rigidBody, markDirty]
  );

  const handleFrictionChange = useCallback(
    (value: number) => {
      if (!rigidBody) return;
      rigidBody.friction = value;
      markDirty();
    },
    [rigidBody, markDirty]
  );

  const handleRestitutionChange = useCallback(
    (value: number) => {
      if (!rigidBody) return;
      rigidBody.restitution = value;
      markDirty();
    },
    [rigidBody, markDirty]
  );

  const handleGravityScaleChange = useCallback(
    (value: number) => {
      if (!rigidBody) return;
      rigidBody.gravityScale = value;
      markDirty();
    },
    [rigidBody, markDirty]
  );

  const handleLinearDampingChange = useCallback(
    (value: number) => {
      if (!rigidBody) return;
      rigidBody.linearDamping = value;
      markDirty();
    },
    [rigidBody, markDirty]
  );

  const handleAngularDampingChange = useCallback(
    (value: number) => {
      if (!rigidBody) return;
      rigidBody.angularDamping = value;
      markDirty();
    },
    [rigidBody, markDirty]
  );

  const handleFixedRotationChange = useCallback(
    (checked: boolean) => {
      if (!rigidBody) return;
      rigidBody.fixedRotation = checked;
      markDirty();
    },
    [rigidBody, markDirty]
  );

  if (!rigidBody) return null;

  return (
    <div className="bg-zinc-950/50 rounded border border-zinc-800">
      {/* Header */}
      <button
        className="flex items-center gap-2 w-full px-2 py-1.5 text-left hover:bg-zinc-800"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown size={12} className="text-zinc-500" />
        ) : (
          <ChevronRight size={12} className="text-zinc-500" />
        )}
        <Activity size={12} className="text-orange-400" />
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
          Rigid Body 2D
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-2 pb-2 space-y-2">
          {/* Body Type (read-only - changing this at runtime would require recreating the body) */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-zinc-500 w-16">Body Type</label>
            <div className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-zinc-900 text-zinc-300 capitalize">
              {rigidBody.bodyType}
            </div>
          </div>

          {/* Mass */}
          {rigidBody.mass !== undefined && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-500 w-16">Mass</label>
              <EditableNumberInput
                value={rigidBody.mass}
                onChange={handleMassChange}
                min={0.01}
                className="flex-1 h-6 text-[11px]"
              />
            </div>
          )}

          {/* Friction */}
          {rigidBody.friction !== undefined && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-500 w-16">Friction</label>
              <EditableNumberInput
                value={rigidBody.friction}
                onChange={handleFrictionChange}
                step={0.01}
                min={0}
                max={1}
                className="flex-1 h-6 text-[11px]"
              />
            </div>
          )}

          {/* Restitution */}
          {rigidBody.restitution !== undefined && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-500 w-16">Bounce</label>
              <EditableNumberInput
                value={rigidBody.restitution}
                onChange={handleRestitutionChange}
                step={0.1}
                min={0}
                max={1}
                className="flex-1 h-6 text-[11px]"
              />
            </div>
          )}

          {/* Gravity Scale */}
          {rigidBody.gravityScale !== undefined && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-500 w-16">Gravity</label>
              <EditableNumberInput
                value={rigidBody.gravityScale}
                onChange={handleGravityScaleChange}
                step={0.1}
                className="flex-1 h-6 text-[11px]"
              />
            </div>
          )}

          {/* Linear Damping */}
          {rigidBody.linearDamping !== undefined && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-500 w-16">Lin. Damp</label>
              <EditableNumberInput
                value={rigidBody.linearDamping}
                onChange={handleLinearDampingChange}
                step={0.01}
                min={0}
                className="flex-1 h-6 text-[11px]"
              />
            </div>
          )}

          {/* Angular Damping */}
          {rigidBody.angularDamping !== undefined && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-500 w-16">Ang. Damp</label>
              <EditableNumberInput
                value={rigidBody.angularDamping}
                onChange={handleAngularDampingChange}
                step={0.01}
                min={0}
                className="flex-1 h-6 text-[11px]"
              />
            </div>
          )}

          {/* Fixed Rotation */}
          {rigidBody.fixedRotation !== undefined && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-500 w-16">Fixed Rot</label>
              <EditableCheckbox
                checked={rigidBody.fixedRotation}
                onChange={handleFixedRotationChange}
              />
              <span className="text-[10px] text-zinc-500">
                {rigidBody.fixedRotation ? 'No rotation' : 'Can rotate'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
