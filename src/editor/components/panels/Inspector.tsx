import React, { useState, useCallback, useEffect } from 'react';
import { Panel, ScrollArea, Input } from '@editor/components/ui';
import { useSelectedGameObject } from '@editor/hooks/useSelectedGameObject';
import { usePropertyChange } from '@editor/hooks/usePropertyChange';
import { useEditorStore } from '@editor/store/editorStore';
import {
  TransformInspector,
  SpriteInspector,
  ColliderInspector,
  RigidBodyInspector,
  CameraInspector,
  BehaviorInspector,
} from '@editor/components/inspector';
import { EditableCheckbox } from '@editor/components/inspector/EditableInputs';
import { SpriteComponent } from '@engine/components/SpriteComponent';
import { AnimatedSpriteComponent } from '@engine/components/AnimatedSpriteComponent';
import { Collider2DComponent } from '@engine/components/Collider2DComponent';
import { RigidBody2DComponent } from '@engine/components/RigidBody2DComponent';
import { Camera2DComponent } from '@engine/components/Camera2DComponent';
import { AudioSourceComponent } from '@engine/components/AudioSourceComponent';
import { Box } from 'lucide-react';

export const Inspector: React.FC = () => {
  const { gameObject, isMultiSelect, selectedCount } = useSelectedGameObject();
  const markDirty = usePropertyChange();
  const renameGameObject = useEditorStore((s) => s.renameGameObject);

  // Local state for editable name
  const [localName, setLocalName] = useState('');
  const [isNameFocused, setIsNameFocused] = useState(false);

  // Local state for editable tag
  const [localTag, setLocalTag] = useState('');
  const [isTagFocused, setIsTagFocused] = useState(false);

  // Sync from gameObject when not focused
  useEffect(() => {
    if (gameObject && !isNameFocused) {
      setLocalName(gameObject.name);
    }
  }, [gameObject, gameObject?.name, isNameFocused]);

  useEffect(() => {
    if (gameObject && !isTagFocused) {
      setLocalTag(gameObject.tag || '');
    }
  }, [gameObject, gameObject?.tag, isTagFocused]);

  const handleNameCommit = useCallback(() => {
    if (gameObject && localName && localName !== gameObject.name) {
      renameGameObject(gameObject.id, localName);
    }
    setIsNameFocused(false);
  }, [gameObject, localName, renameGameObject]);

  const handleTagCommit = useCallback(() => {
    if (gameObject && localTag !== (gameObject.tag || '')) {
      gameObject.tag = localTag || undefined;
      markDirty();
    }
    setIsTagFocused(false);
  }, [gameObject, localTag, markDirty]);

  const handleEnabledChange = useCallback(
    (checked: boolean) => {
      if (!gameObject) return;
      gameObject.enabled = checked;
      markDirty();
    },
    [gameObject, markDirty]
  );

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameCommit();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setLocalName(gameObject?.name || '');
      setIsNameFocused(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTagCommit();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setLocalTag(gameObject?.tag || '');
      setIsTagFocused(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  // Multi-selection
  if (isMultiSelect) {
    return (
      <Panel title="Inspector" className="h-full">
        <div className="p-4 text-center">
          <p className="text-zinc-400 text-sm font-semibold">
            {selectedCount} Objects Selected
          </p>
          <p className="text-zinc-500 text-xs mt-1">
            Multi-editing not yet supported
          </p>
        </div>
      </Panel>
    );
  }

  // No selection
  if (!gameObject) {
    return (
      <Panel title="Inspector" className="h-full">
        <div className="flex flex-col items-center justify-center h-full text-zinc-500">
          <Box size={32} className="mb-2 opacity-30" />
          <p className="text-xs">No object selected</p>
        </div>
      </Panel>
    );
  }

  // Get components from the selected GameObject
  const sprite = gameObject.getComponent(SpriteComponent) ?? null;
  const animatedSprite = gameObject.getComponent(AnimatedSpriteComponent) ?? null;
  const collider = gameObject.getComponent(Collider2DComponent) ?? null;
  const rigidBody = gameObject.getComponent(RigidBody2DComponent) ?? null;
  const camera = gameObject.getComponent(Camera2DComponent) ?? null;
  const audio = gameObject.getComponent(AudioSourceComponent) ?? null;
  const behaviors = gameObject.getAllBehaviors();

  // Component badges for header
  const componentBadges = [
    (sprite || animatedSprite) && { label: 'Sprite', color: 'bg-green-400/20 text-green-400' },
    collider && { label: 'Collider', color: 'bg-yellow-400/20 text-yellow-400' },
    rigidBody && { label: 'RigidBody', color: 'bg-orange-400/20 text-orange-400' },
    camera && { label: 'Camera', color: 'bg-purple-400/20 text-purple-400' },
    audio && { label: 'Audio', color: 'bg-cyan-400/20 text-cyan-400' },
  ].filter(Boolean) as { label: string; color: string }[];

  return (
    <Panel title="Inspector" className="h-full">
      <ScrollArea className="h-full">
        <div className="p-3 space-y-3">
          {/* Header */}
          <div className="pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <EditableCheckbox
                checked={gameObject.enabled}
                onChange={handleEnabledChange}
              />
              <Input
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onFocus={() => setIsNameFocused(true)}
                onBlur={handleNameCommit}
                onKeyDown={handleNameKeyDown}
                className="flex-1 h-7 text-sm font-semibold text-zinc-200 bg-transparent border-transparent hover:border-zinc-700 focus:border-sky-400"
              />
              <Input
                value={localTag}
                onChange={(e) => setLocalTag(e.target.value)}
                onFocus={() => setIsTagFocused(true)}
                onBlur={handleTagCommit}
                onKeyDown={handleTagKeyDown}
                placeholder="Tag"
                className="w-20 h-6 text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 border-transparent hover:border-zinc-700 focus:border-sky-400"
              />
            </div>
            {componentBadges.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1.5 ml-6">
                {componentBadges.map(badge => (
                  <span key={badge.label} className={`text-[9px] px-1.5 py-0.5 rounded ${badge.color}`}>
                    {badge.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Transform (always present) */}
          <TransformInspector transform={gameObject.transform} />

          {/* Sprite (if has sprite component) */}
          <SpriteInspector sprite={sprite} />

          {/* Collider (if has collider component) */}
          <ColliderInspector collider={collider} />

          {/* RigidBody (if has rigidbody component) */}
          <RigidBodyInspector rigidBody={rigidBody} />

          {/* Camera (if has camera component) */}
          <CameraInspector camera={camera} />

          {/* Behaviors */}
          <BehaviorInspector behaviors={behaviors} />
        </div>
      </ScrollArea>
    </Panel>
  );
};
