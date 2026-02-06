/**
 * UIText - Text display UI element.
 *
 * Wraps PixiJS Text for rendering text in the UI.
 * Auto-sizes to text content by default.
 *
 * Example:
 * ```typescript
 * const label = new UIText({
 *   text: 'Score: 0',
 *   fontSize: 24,
 *   color: '#ffffff',
 *   anchor: 'top-right',
 *   offset: [20, 20],
 * });
 * ```
 */

import { Text, TextStyle } from 'pixi.js';
import { UIElement } from '../UIElement';
import type { Vector2 } from '../../types';
import type { UITextConfig } from '../types';

export class UIText extends UIElement {
  /** The PixiJS Text object */
  private textDisplay: Text;

  /** Current text style settings */
  private _text: string;
  private _fontSize: number;
  private _fontFamily: string;
  private _color: string | number;
  private _fontWeight: 'normal' | 'bold' | number;
  private _align: 'left' | 'center' | 'right';
  private _wordWrapWidth: number;

  constructor(config: UITextConfig = {}) {
    super(config);

    // Store text properties
    this._text = config.text ?? '';
    this._fontSize = config.fontSize ?? 16;
    this._fontFamily = config.fontFamily ?? 'Arial, sans-serif';
    this._color = config.color ?? '#ffffff';
    this._fontWeight = config.fontWeight ?? 'normal';
    this._align = config.align ?? 'left';
    this._wordWrapWidth = config.wordWrapWidth ?? 0;

    // Create PixiJS Text
    const style = this.createStyle();
    this.textDisplay = new Text({ text: this._text, style });

    // Add to our container
    this.displayObject.addChild(this.textDisplay);
  }

  // ==================== Text Properties ====================

  /** Get the current text content */
  get text(): string {
    return this._text;
  }

  /** Set the text content */
  set text(value: string) {
    if (this._text === value) return;
    this._text = value;
    this.textDisplay.text = value;
    this.markLayoutDirty();
  }

  /** Get font size in pixels */
  get fontSize(): number {
    return this._fontSize;
  }

  /** Set font size in pixels */
  set fontSize(value: number) {
    if (this._fontSize === value) return;
    this._fontSize = value;
    this.updateStyle();
    this.markLayoutDirty();
  }

  /** Get font family */
  get fontFamily(): string {
    return this._fontFamily;
  }

  /** Set font family */
  set fontFamily(value: string) {
    if (this._fontFamily === value) return;
    this._fontFamily = value;
    this.updateStyle();
    this.markLayoutDirty();
  }

  /** Get text color */
  get color(): string | number {
    return this._color;
  }

  /** Set text color */
  set color(value: string | number) {
    if (this._color === value) return;
    this._color = value;
    this.updateStyle();
  }

  /** Get font weight */
  get fontWeight(): 'normal' | 'bold' | number {
    return this._fontWeight;
  }

  /** Set font weight */
  set fontWeight(value: 'normal' | 'bold' | number) {
    if (this._fontWeight === value) return;
    this._fontWeight = value;
    this.updateStyle();
    this.markLayoutDirty();
  }

  /** Get text alignment */
  get align(): 'left' | 'center' | 'right' {
    return this._align;
  }

  /** Set text alignment */
  set align(value: 'left' | 'center' | 'right') {
    if (this._align === value) return;
    this._align = value;
    this.updateStyle();
  }

  /** Get word wrap width (0 = no wrap) */
  get wordWrapWidth(): number {
    return this._wordWrapWidth;
  }

  /** Set word wrap width (0 = no wrap) */
  set wordWrapWidth(value: number) {
    if (this._wordWrapWidth === value) return;
    this._wordWrapWidth = value;
    this.updateStyle();
    this.markLayoutDirty();
  }

  // ==================== Internal ====================

  /**
   * Create a PixiJS TextStyle from our properties.
   */
  private createStyle(): TextStyle {
    // PixiJS expects specific font weight values
    const fontWeight = typeof this._fontWeight === 'number'
      ? (this._fontWeight >= 600 ? 'bold' : 'normal')
      : this._fontWeight;

    return new TextStyle({
      fontFamily: this._fontFamily,
      fontSize: this._fontSize,
      fontWeight: fontWeight as 'normal' | 'bold',
      fill: this._color,
      align: this._align,
      wordWrap: this._wordWrapWidth > 0,
      wordWrapWidth: this._wordWrapWidth || undefined,
    });
  }

  /**
   * Update the text style when properties change.
   */
  private updateStyle(): void {
    this.textDisplay.style = this.createStyle();
  }

  // ==================== Layout ====================

  /**
   * Measure the text bounds as the content size.
   */
  protected override measureContent(): Vector2 {
    const bounds = this.textDisplay.getBounds();
    return [bounds.width, bounds.height];
  }
}
