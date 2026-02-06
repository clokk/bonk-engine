/**
 * UIButton - Interactive button UI element.
 *
 * Extends UIPanel with hover, pressed, and disabled states.
 * Fires onClick when the button is clicked.
 *
 * Example:
 * ```typescript
 * const button = new UIButton({
 *   backgroundColor: 0x4488ff,
 *   hoverColor: 0x66aaff,
 *   pressedColor: 0x2266dd,
 *   padding: [8, 16, 8, 16],
 *   borderRadius: 4,
 *   onClick: () => console.log('Clicked!'),
 * });
 * button.addChild(new UIText({ text: 'Click Me' }));
 * ```
 */

import { UIPanel } from './UIPanel';
import type { UIInteractive } from '../UIManager';
import type { UIPointerEvent, UIButtonState, UIButtonConfig } from '../types';

export class UIButton extends UIPanel implements UIInteractive {
  /** Current button state */
  private _state: UIButtonState = 'normal';

  /** Click handler */
  private _onClick: (() => void) | null;

  /** Color when hovered */
  private _hoverColor: number;

  /** Color when pressed */
  private _pressedColor: number;

  /** Color when disabled */
  private _disabledColor: number;

  /** Whether the button is disabled */
  private _disabled: boolean;

  /** Store the normal background color for state changes */
  private _normalColor: number;

  constructor(config: UIButtonConfig = {}) {
    super(config);

    this._onClick = config.onClick ?? null;
    this._normalColor = config.backgroundColor ?? 0x333333;
    this._hoverColor = config.hoverColor ?? this.lightenColor(this._normalColor, 0.2);
    this._pressedColor = config.pressedColor ?? this.darkenColor(this._normalColor, 0.2);
    this._disabledColor = config.disabledColor ?? 0x666666;
    this._disabled = config.disabled ?? false;

    // Apply initial state
    this.updateVisualState();
  }

  // ==================== Properties ====================

  /** Get current button state */
  get state(): UIButtonState {
    return this._state;
  }

  /** Get onClick handler */
  get onClick(): (() => void) | null {
    return this._onClick;
  }

  /** Set onClick handler */
  set onClick(value: (() => void) | null) {
    this._onClick = value;
  }

  /** Get hover color */
  get hoverColor(): number {
    return this._hoverColor;
  }

  /** Set hover color */
  set hoverColor(value: number) {
    this._hoverColor = value;
    this.updateVisualState();
  }

  /** Get pressed color */
  get pressedColor(): number {
    return this._pressedColor;
  }

  /** Set pressed color */
  set pressedColor(value: number) {
    this._pressedColor = value;
    this.updateVisualState();
  }

  /** Get disabled color */
  get disabledColor(): number {
    return this._disabledColor;
  }

  /** Set disabled color */
  set disabledColor(value: number) {
    this._disabledColor = value;
    this.updateVisualState();
  }

  /** Check if button is disabled */
  get disabled(): boolean {
    return this._disabled;
  }

  /** Set disabled state */
  set disabled(value: boolean) {
    if (this._disabled === value) return;
    this._disabled = value;
    this._state = value ? 'disabled' : 'normal';
    this.updateVisualState();
  }

  // ==================== Pointer Events (UIInteractive) ====================

  /**
   * Called when pointer enters button bounds.
   */
  onPointerEnter(event: UIPointerEvent): void {
    if (this._disabled) return;
    this._state = 'hover';
    this.updateVisualState();
  }

  /**
   * Called when pointer exits button bounds.
   */
  onPointerExit(event: UIPointerEvent): void {
    if (this._disabled) return;
    this._state = 'normal';
    this.updateVisualState();
  }

  /**
   * Called when pointer button is pressed on button.
   */
  onPointerDown(event: UIPointerEvent): void {
    if (this._disabled) return;
    this._state = 'pressed';
    this.updateVisualState();
    event.consumed = true;
  }

  /**
   * Called when pointer button is released on button.
   * Fires onClick if the button was being pressed.
   */
  onPointerUp(event: UIPointerEvent): void {
    if (this._disabled) return;

    // Only fire click if we're in pressed state (pointer stayed on button)
    if (this._state === 'pressed') {
      this._state = 'hover';
      this.updateVisualState();

      // Fire click handler
      if (this._onClick) {
        this._onClick();
      }
    }

    event.consumed = true;
  }

  // ==================== Internal ====================

  /**
   * Update visual appearance based on current state.
   */
  private updateVisualState(): void {
    let color: number;

    switch (this._state) {
      case 'hover':
        color = this._hoverColor;
        break;
      case 'pressed':
        color = this._pressedColor;
        break;
      case 'disabled':
        color = this._disabledColor;
        break;
      default:
        color = this._normalColor;
    }

    // Directly update the protected _backgroundColor from parent
    this._backgroundColor = color;
    this.redrawBackground();
  }

  /**
   * Override backgroundColor setter to also update normalColor.
   */
  override set backgroundColor(value: number) {
    this._normalColor = value;
    this._backgroundColor = value;
    // Recalculate auto-generated hover/pressed colors
    this._hoverColor = this.lightenColor(value, 0.2);
    this._pressedColor = this.darkenColor(value, 0.2);
    this.updateVisualState();
  }

  override get backgroundColor(): number {
    return this._normalColor;
  }

  // ==================== Color Utilities ====================

  /**
   * Lighten a color by a factor (0-1).
   */
  private lightenColor(color: number, factor: number): number {
    const r = Math.min(255, ((color >> 16) & 0xff) + 255 * factor);
    const g = Math.min(255, ((color >> 8) & 0xff) + 255 * factor);
    const b = Math.min(255, (color & 0xff) + 255 * factor);
    return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
  }

  /**
   * Darken a color by a factor (0-1).
   */
  private darkenColor(color: number, factor: number): number {
    const r = ((color >> 16) & 0xff) * (1 - factor);
    const g = ((color >> 8) & 0xff) * (1 - factor);
    const b = (color & 0xff) * (1 - factor);
    return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
  }
}
