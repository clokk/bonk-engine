import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@editor/components/ui';

interface EditableNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  className?: string;
  min?: number;
  max?: number;
}

/**
 * Number input with local state pattern to prevent jitter during editing.
 * Commits value on blur or Enter key.
 */
export const EditableNumberInput: React.FC<EditableNumberInputProps> = ({
  value,
  onChange,
  step = 1,
  className = '',
  min,
  max,
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
    let parsed = parseFloat(localValue);
    if (isNaN(parsed)) {
      setLocalValue(String(value));
      setIsFocused(false);
      return;
    }

    // Clamp to min/max if specified
    if (min !== undefined) parsed = Math.max(min, parsed);
    if (max !== undefined) parsed = Math.min(max, parsed);

    if (parsed !== value) {
      onChange(parsed);
    }
    setLocalValue(String(parsed));
    setIsFocused(false);
  }, [localValue, value, onChange, min, max]);

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

interface EditableTextInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Text input with local state pattern to prevent jitter during editing.
 * Commits value on blur or Enter key.
 */
export const EditableTextInput: React.FC<EditableTextInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Sync from external value when not focused
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value);
    }
  }, [value, isFocused]);

  const commit = useCallback(() => {
    if (localValue !== value) {
      onChange(localValue);
    }
    setIsFocused(false);
  }, [localValue, value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commit();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setLocalValue(value);
      setIsFocused(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <Input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className={className}
      placeholder={placeholder}
    />
  );
};

interface EditableCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/**
 * Checkbox that triggers onChange immediately.
 */
export const EditableCheckbox: React.FC<EditableCheckboxProps> = ({
  checked,
  onChange,
  className = '',
}) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className={`w-4 h-4 rounded bg-zinc-950 border-zinc-700 cursor-pointer ${className}`}
    />
  );
};

interface Vector2InputProps {
  label: string;
  icon?: React.ReactNode;
  values: [number, number];
  onChange: (values: [number, number]) => void;
  step?: number;
  labelWidth?: string;
  xLabel?: string;
  yLabel?: string;
}

/**
 * Vector2 input with editable X and Y components.
 */
export const EditableVector2Input: React.FC<Vector2InputProps> = ({
  label,
  icon,
  values,
  onChange,
  step = 1,
  labelWidth = 'w-12',
  xLabel = 'X',
  yLabel = 'Y',
}) => {
  return (
    <div className="flex items-center gap-2">
      {icon && <div className="w-5 text-zinc-500">{icon}</div>}
      {!icon && <label className={`text-[10px] text-zinc-500 ${labelWidth}`}>{label}</label>}
      <div className="flex-1 grid grid-cols-2 gap-1">
        <div className="relative">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">
            {xLabel}
          </span>
          <EditableNumberInput
            value={values[0]}
            onChange={(v) => onChange([v, values[1]])}
            step={step}
            className="h-6 text-[11px] pl-5"
          />
        </div>
        <div className="relative">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">
            {yLabel}
          </span>
          <EditableNumberInput
            value={values[1]}
            onChange={(v) => onChange([values[0], v])}
            step={step}
            className="h-6 text-[11px] pl-5"
          />
        </div>
      </div>
    </div>
  );
};
