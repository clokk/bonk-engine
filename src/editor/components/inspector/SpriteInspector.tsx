import React, { useState, useCallback } from 'react';
import { Image, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@editor/components/ui';
import {
  EditableNumberInput,
  EditableCheckbox,
  EditableVector2Input,
} from './EditableInputs';
import { usePropertyChange } from '@editor/hooks/usePropertyChange';
import type { SpriteComponent } from '@engine/components/SpriteComponent';

interface SpriteInspectorProps {
  sprite: SpriteComponent | null;
}

export const SpriteInspector: React.FC<SpriteInspectorProps> = ({ sprite }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const markDirty = usePropertyChange();

  const handleAnchorChange = useCallback(
    (values: [number, number]) => {
      if (!sprite) return;
      sprite.anchor = values;
      markDirty();
    },
    [sprite, markDirty]
  );

  const handleAlphaChange = useCallback(
    (value: number) => {
      if (!sprite) return;
      sprite.alpha = value;
      markDirty();
    },
    [sprite, markDirty]
  );

  const handleFlipXChange = useCallback(
    (checked: boolean) => {
      if (!sprite) return;
      sprite.flipX = checked;
      markDirty();
    },
    [sprite, markDirty]
  );

  const handleFlipYChange = useCallback(
    (checked: boolean) => {
      if (!sprite) return;
      sprite.flipY = checked;
      markDirty();
    },
    [sprite, markDirty]
  );

  if (!sprite) return null;

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
        <Image size={12} className="text-green-400" />
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
          Sprite
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-2 pb-2 space-y-2">
          {/* Source (read-only) */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-zinc-500 w-12">Source</label>
            <Input
              value={sprite.src || '(none)'}
              readOnly
              className="flex-1 h-6 text-[11px]"
            />
          </div>

          {/* Anchor */}
          <EditableVector2Input
            label="Anchor"
            values={sprite.anchor as [number, number]}
            onChange={handleAnchorChange}
            step={0.1}
          />

          {/* Tint (read-only for now - color picker would need more work) */}
          {sprite.tint && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-500 w-12">Tint</label>
              <div className="flex items-center gap-1 flex-1">
                <div
                  className="w-6 h-6 rounded border border-zinc-700"
                  style={{ backgroundColor: sprite.tint }}
                />
                <Input
                  value={sprite.tint}
                  readOnly
                  className="flex-1 h-6 text-[11px]"
                />
              </div>
            </div>
          )}

          {/* Alpha */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-zinc-500 w-12">Alpha</label>
            <EditableNumberInput
              value={sprite.alpha}
              onChange={handleAlphaChange}
              step={0.1}
              min={0}
              max={1}
              className="flex-1 h-6 text-[11px]"
            />
          </div>

          {/* Flip */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-zinc-500 w-12">Flip</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-[10px] text-zinc-400 cursor-pointer">
                <EditableCheckbox
                  checked={sprite.flipX}
                  onChange={handleFlipXChange}
                  className="w-3 h-3"
                />
                X
              </label>
              <label className="flex items-center gap-1 text-[10px] text-zinc-400 cursor-pointer">
                <EditableCheckbox
                  checked={sprite.flipY}
                  onChange={handleFlipYChange}
                  className="w-3 h-3"
                />
                Y
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
