/**
 * UI System - Screen-space UI for Bonk Engine.
 *
 * The UI system provides a separate rendering layer for menus, HUDs, and
 * other interface elements that should remain fixed on screen regardless
 * of camera position.
 *
 * Key Concepts:
 * - UIElement: Base class for all UI elements (not related to Component/Behavior)
 * - UIManager: Central manager for root elements, layout, and input
 * - Anchor system: Position elements relative to screen edges/corners
 * - Layout containers: VBox/HBox for flexbox-style layouts
 *
 * Example:
 * ```typescript
 * import { UIManager, UIPanel, UIHBox, UIImage, UIText } from 'bonk-engine';
 *
 * const ui = new UIManager(renderer);
 *
 * const healthBar = new UIPanel({
 *   anchor: 'top-left',
 *   offset: [20, 20],
 *   padding: [8, 12, 8, 12],
 *   backgroundColor: 0x333333,
 *   borderRadius: 4,
 * });
 *
 * const hbox = new UIHBox({ gap: 8, align: 'center' });
 * hbox.addChild(new UIImage({ src: './ui/heart.png', width: 24, height: 24 }));
 * hbox.addChild(new UIText({ text: '100', fontSize: 18, color: '#ff6666' }));
 *
 * healthBar.addChild(hbox);
 * ui.addRoot(healthBar);
 *
 * // In game loop:
 * const consumed = ui.processInput();
 * ui.update();
 * ui.layout();
 * ```
 */

// Types
export * from './types';

// Core
export { UIElement } from './UIElement';
export { UIManager } from './UIManager';
export type { UIInteractive } from './UIManager';

// Primitives
export { UIText } from './primitives/UIText';
export { UIImage } from './primitives/UIImage';
export { UIPanel } from './primitives/UIPanel';
export { UIButton } from './primitives/UIButton';

// Layout
export { UIVBox } from './layout/UIVBox';
export { UIHBox } from './layout/UIHBox';
