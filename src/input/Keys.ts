/**
 * Typed key code constants for use with Input.getKey(), getKeyDown(), getKeyUp().
 * Values are KeyboardEvent.code strings (physical key position, layout-independent).
 *
 * Use these instead of raw strings to avoid event.key vs event.code mismatches —
 * Input stores keys by event.code, so event.key strings like 'g' silently fail.
 *
 * @example
 * import { Input, Keys } from 'bonkjs';
 * if (Input.getKey(Keys.Space)) { jump(); }
 */
export const Keys = {
    // Letters
    A: 'KeyA', B: 'KeyB', C: 'KeyC', D: 'KeyD', E: 'KeyE', F: 'KeyF',
    G: 'KeyG', H: 'KeyH', I: 'KeyI', J: 'KeyJ', K: 'KeyK', L: 'KeyL',
    M: 'KeyM', N: 'KeyN', O: 'KeyO', P: 'KeyP', Q: 'KeyQ', R: 'KeyR',
    S: 'KeyS', T: 'KeyT', U: 'KeyU', V: 'KeyV', W: 'KeyW', X: 'KeyX',
    Y: 'KeyY', Z: 'KeyZ',
    // Arrows
    ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown',
    ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
    // Common
    Space: 'Space', Enter: 'Enter', Escape: 'Escape',
    ShiftLeft: 'ShiftLeft', ShiftRight: 'ShiftRight',
    ControlLeft: 'ControlLeft', ControlRight: 'ControlRight',
    Tab: 'Tab', Backspace: 'Backspace',
    // Numbers
    Digit0: 'Digit0', Digit1: 'Digit1', Digit2: 'Digit2', Digit3: 'Digit3',
    Digit4: 'Digit4', Digit5: 'Digit5', Digit6: 'Digit6', Digit7: 'Digit7',
    Digit8: 'Digit8', Digit9: 'Digit9',
} as const;
