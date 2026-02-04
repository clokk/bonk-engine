import React, { useState, useEffect, useCallback } from 'react';
import { Move, RotateCcw, Maximize2, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@editor/components/ui';
import { usePropertyChange } from '@editor/hooks/usePropertyChange';
import type { Transform } from '@engine/Transform';

interface TransformInspectorProps {
  transform: Transform;
}

interface EditableNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  className?: string;
}

/**
 * Number input with local state pattern to prevent jitter during editing.
 * Commits value on blur or Enter key.
 */
const EditableNumberInput: React.FC<EditableNumberInputProps> = ({
  value,
  onChange,
  step = 1,
  className = '',
}) => {
  const [localValue, setLocalValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);

  // Sync from external value when not focused
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value));
    }
  }, [value, isFocused]);

  const commit = useCallback(() => {
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed) && parsed !== value) {
      onChange(parsed);
    } else {
      // Reset to current value if invalid
      setLocalValue(String(value));
    }
    setIsFocused(false);
  }, [localValue, value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commit();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setLocalValue(String(value));
      setIsFocused(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <Input
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      step={step}
      className={className}
    />
  );
};

interface Vector2InputProps {
  label: string;
  icon: React.ReactNode;
  values: [number, number];
  onChange: (values: [number, number]) => void;
  step?: number;
}

const Vector2Input: React.FC<Vector2InputProps> = ({
  label,
  icon,
  values,
  onChange,
  step = 1,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 text-zinc-500">{icon}</div>
      <div className="flex-1 grid grid-cols-2 gap-1">
        <div className="relative">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-red-400 font-mono">
            X
          </span>
          <EditableNumberInput
            value={values[0]}
            onChange={(v) => onChange([v, values[1]])}
            step={step}
            className="h-6 text-[11px] pl-5 pr-1"
          />
        </div>
        <div className="relative">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-green-400 font-mono">
            Y
          </span>
          <EditableNumberInput
            value={values[1]}
            onChange={(v) => onChange([values[0], v])}
            step={step}
            className="h-6 text-[11px] pl-5 pr-1"
          />
        </div>
      </div>
    </div>
  );
};

interface NumberInputRowProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}

const NumberInputRow: React.FC<NumberInputRowProps> = ({
  label,
  icon,
  value,
  onChange,
  step = 1,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 text-zinc-500">{icon}</div>
      <EditableNumberInput
        value={value}
        onChange={onChange}
        step={step}
        className="flex-1 h-6 text-[11px]"
      />
    </div>
  );
};

export const TransformInspector: React.FC<TransformInspectorProps> = ({
  transform,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const markDirty = usePropertyChange();

  const handlePositionChange = useCallback(
    (values: [number, number]) => {
      transform.position = values;
      markDirty();
    },
    [transform, markDirty]
  );

  const handleRotationChange = useCallback(
    (value: number) => {
      transform.rotation = value;
      markDirty();
    },
    [transform, markDirty]
  );

  const handleScaleChange = useCallback(
    (values: [number, number]) => {
      transform.scale = values;
      markDirty();
    },
    [transform, markDirty]
  );

  const handleZIndexChange = useCallback(
    (value: number) => {
      transform.zIndex = value;
      markDirty();
    },
    [transform, markDirty]
  );

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
        <Move size={12} className="text-sky-400" />
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
          Transform
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-2 pb-2 space-y-2">
          <Vector2Input
            label="Position"
            icon={<Move size={12} />}
            values={transform.position as [number, number]}
            onChange={handlePositionChange}
          />
          <NumberInputRow
            label="Rotation"
            icon={<RotateCcw size={12} />}
            value={transform.rotation}
            onChange={handleRotationChange}
          />
          <Vector2Input
            label="Scale"
            icon={<Maximize2 size={12} />}
            values={transform.scale as [number, number]}
            onChange={handleScaleChange}
            step={0.1}
          />
          <NumberInputRow
            label="Z-Index"
            icon={<Layers size={12} />}
            value={transform.zIndex}
            onChange={handleZIndexChange}
          />
        </div>
      )}
    </div>
  );
};
