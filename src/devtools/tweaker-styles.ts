/**
 * Tweaker devtools — CSS styles (themed accent, Recursive + Space Grotesk, spring easing)
 */

export const TWEAKER_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Recursive:slnt,wght,CASL,MONO@0,400..900,0..1,1&family=Space+Grotesk:wght@400;700&display=swap');

/* Keyframes */
@keyframes bonk-letter-in {
  0%   { transform: scale(0, 0) translateY(20px); opacity: 0; }
  40%  { transform: scale(1.4, 0.7) translateY(-8px); opacity: 1; }
  60%  { transform: scale(0.85, 1.15) translateY(3px); }
  80%  { transform: scale(1.05, 0.95) translateY(-1px); }
  100% { transform: scale(1, 1) translateY(0); opacity: 1; }
}

@keyframes bonk-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3px); }
}

@keyframes bonk-star {
  0%   { transform: scale(0) rotate(0deg); opacity: 0.9; }
  50%  { transform: scale(1.2) rotate(20deg); opacity: 0.5; }
  100% { transform: scale(1.5) rotate(30deg); opacity: 0; }
}

.bonk-tweaker {
  --bonk-accent: #f59e0b;
  --bonk-accent-rgb: 245, 158, 11;
  --bonk-accent-glow: #fbbf24;
  --bonk-font-mono: 'Recursive', 'Consolas', monospace;
  --bonk-font-ui: 'Space Grotesk', sans-serif;
  --bonk-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --bonk-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --bonk-transition-fast: 0.15s var(--bonk-ease-out);
  --bonk-transition-bounce: 0.25s var(--bonk-ease-spring);

  position: fixed;
  top: 0;
  bottom: 0;
  width: 360px;
  background: rgba(9, 9, 11, 0.97);
  color: #a1a1aa;
  font-family: var(--bonk-font-mono);
  font-size: 12px;
  display: flex;
  flex-direction: column;
  z-index: 99999;
  border-left: 1px solid #27272a;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.6);
  border-radius: 6px 0 0 6px;
  overflow: hidden;
  user-select: none;
  transition: transform 400ms var(--bonk-ease-out), opacity 300ms var(--bonk-ease-out);
}

/* State classes */
.bonk-tweaker.state-hidden {
  display: none;
}
.bonk-tweaker.state-active {
  transform: translateX(0);
  opacity: 1;
}
.bonk-tweaker.state-dormant {
  opacity: 0.12;
  transform: translateX(calc(100% - 20px));
}
.bonk-tweaker.left.state-dormant {
  transform: translateX(calc(-100% + 20px));
}
.bonk-tweaker.state-dormant.waking {
  transition: transform 600ms var(--bonk-ease-spring), opacity 300ms var(--bonk-ease-out);
}
.bonk-tweaker.state-dormant > * {
  pointer-events: none;
}
/* Accent bar on the visible dormant edge */
.bonk-tweaker.right.state-dormant::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(to bottom, var(--bonk-accent), rgba(var(--bonk-accent-rgb), 0.2));
  z-index: 1;
}
.bonk-tweaker.left.state-dormant::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(to bottom, var(--bonk-accent), rgba(var(--bonk-accent-rgb), 0.2));
  z-index: 1;
}

/* Theme blocks */
.bonk-tweaker.theme-amber {
  --bonk-accent: #f59e0b;
  --bonk-accent-rgb: 245, 158, 11;
  --bonk-accent-glow: #fbbf24;
}
.bonk-tweaker.theme-lime {
  --bonk-accent: #84cc16;
  --bonk-accent-rgb: 132, 204, 22;
  --bonk-accent-glow: #a3e635;
}
.bonk-tweaker.theme-spring {
  --bonk-accent: #00e5a0;
  --bonk-accent-rgb: 0, 229, 160;
  --bonk-accent-glow: #34ffc6;
}

.bonk-tweaker.right { right: 0; border-radius: 6px 0 0 6px; }
.bonk-tweaker.left { left: 0; border-left: none; border-right: 1px solid #27272a; box-shadow: 4px 0 20px rgba(0, 0, 0, 0.6); border-radius: 0 6px 6px 0; }

/* Header */
.bonk-tweaker-header {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  gap: 8px;
  border-bottom: 1px solid #27272a;
  flex-shrink: 0;
}
.bonk-tweaker-search {
  flex: 1;
  background: #09090b;
  border: 1px solid #3f3f46;
  color: #e4e4e7;
  padding: 5px 8px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 12px;
  outline: none;
  transition: border-color var(--bonk-transition-bounce);
}
.bonk-tweaker-search:focus {
  border-color: var(--bonk-accent);
  box-shadow: 0 0 0 1px var(--bonk-accent);
}
.bonk-tweaker-search::placeholder {
  color: #71717a;
}
.bonk-tweaker-close {
  background: none;
  border: none;
  color: #71717a;
  cursor: pointer;
  font-size: 18px;
  padding: 0 4px;
  line-height: 1;
  transition: color var(--bonk-transition-fast);
}
.bonk-tweaker-close:hover { color: #f87171; }

/* Logo */
.bonk-tweaker-logo {
  text-align: center;
  padding: 12px 0 8px;
  border-bottom: 1px solid #27272a;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}
.bonk-tweaker-logo-star {
  position: absolute;
  width: 60px;
  height: 60px;
  left: 50%;
  top: 50%;
  margin-left: -30px;
  margin-top: -34px;
  background: radial-gradient(circle, rgba(var(--bonk-accent-rgb), 0.3) 0%, rgba(var(--bonk-accent-rgb), 0.1) 30%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
}
.bonk-tweaker-logo.entering .bonk-tweaker-logo-star {
  animation: bonk-star 0.6s 0.1s ease-out both;
}
.bonk-tweaker-logo-text {
  display: inline-flex;
  gap: 2px;
  position: relative;
}
.bonk-tweaker-logo-letter {
  display: inline-block;
  font-size: 28px;
  font-weight: 900;
  color: var(--bonk-accent);
  letter-spacing: 0.15em;
  text-shadow: 0 0 20px rgba(var(--bonk-accent-rgb), 0.3);
  opacity: 0;
}
.bonk-tweaker-logo.entering .bonk-tweaker-logo-letter {
  animation: bonk-letter-in 0.5s calc(var(--i) * 0.08s) ease-out both;
}
.bonk-tweaker-logo.idle .bonk-tweaker-logo-letter {
  opacity: 1;
  animation: bonk-float 3s calc(var(--i) * 0.15s) ease-in-out infinite;
}
.bonk-tweaker-logo-sub {
  font-family: var(--bonk-font-ui);
  font-size: 10px;
  color: #71717a;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-top: 2px;
}

/* Scrollable body */
.bonk-tweaker-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #3f3f46 #18181b;
}
.bonk-tweaker-body::-webkit-scrollbar { width: 6px; }
.bonk-tweaker-body::-webkit-scrollbar-track { background: #18181b; }
.bonk-tweaker-body::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
.bonk-tweaker-body::-webkit-scrollbar-thumb:hover { background: var(--bonk-accent); }

/* Group */
.bonk-tweaker-group {
  border-bottom: 1px solid #27272a;
}
.bonk-tweaker-group-header {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  cursor: pointer;
  background: rgba(var(--bonk-accent-rgb), 0.03);
  transition: background var(--bonk-transition-fast);
}
.bonk-tweaker-group-header:hover {
  background: rgba(var(--bonk-accent-rgb), 0.06);
}
.bonk-tweaker-group-header:active {
  transform: scale(0.995) translateX(1px);
}
.bonk-tweaker-group-arrow {
  width: 16px;
  font-size: 10px;
  color: #71717a;
  flex-shrink: 0;
}
.bonk-tweaker-group-name {
  flex: 1;
  font-weight: 700;
  color: var(--bonk-accent);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.bonk-tweaker-group-reset {
  background: none;
  border: none;
  color: #71717a;
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
  transition: color var(--bonk-transition-fast);
}
.bonk-tweaker-group-reset:hover { color: #facc15; }
.bonk-tweaker-group-body {
  padding: 2px 0;
}
.bonk-tweaker-group-body.collapsed {
  display: none;
}

/* Sub-group (nested object) */
.bonk-tweaker-subgroup {
  margin-left: 12px;
  border-left: 1px solid #27272a;
}
.bonk-tweaker-subgroup-header {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 11px;
  color: #a1a1aa;
  transition: background var(--bonk-transition-fast);
}
.bonk-tweaker-subgroup-header:hover {
  background: rgba(var(--bonk-accent-rgb), 0.04);
}

.bonk-tweaker-subgroup-body.collapsed {
  display: none;
}

/* Field row */
.bonk-tweaker-field {
  display: flex;
  align-items: center;
  padding: 3px 10px 3px 26px;
  gap: 6px;
  min-height: 24px;
  transition: background var(--bonk-transition-fast);
}
.bonk-tweaker-field:hover {
  background: rgba(var(--bonk-accent-rgb), 0.03);
}
.bonk-tweaker-field.modified .bonk-tweaker-field-name {
  color: #facc15;
}
.bonk-tweaker-field.search-hidden {
  display: none;
}
.bonk-tweaker-field-name {
  flex: 0 0 auto;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: #a1a1aa;
}
.bonk-tweaker-field-controls {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

/* Number slider */
.bonk-tweaker-slider {
  flex: 1;
  max-width: 100px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #3f3f46;
  border-radius: 2px;
  outline: none;
}
.bonk-tweaker-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 14px;
  background: var(--bonk-accent);
  border-radius: 2px;
  cursor: pointer;
}
.bonk-tweaker-slider::-moz-range-thumb {
  width: 10px;
  height: 14px;
  background: var(--bonk-accent);
  border-radius: 2px;
  cursor: pointer;
  border: none;
}

/* Number input */
.bonk-tweaker-number {
  width: 60px;
  background: #09090b;
  border: 1px solid #3f3f46;
  color: #e4e4e7;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 11px;
  text-align: right;
  outline: none;
  transition: border-color var(--bonk-transition-bounce);
}
.bonk-tweaker-number:focus {
  border-color: var(--bonk-accent);
  box-shadow: 0 0 0 1px var(--bonk-accent);
}

/* Color picker */
.bonk-tweaker-color {
  width: 24px;
  height: 18px;
  border: 1px solid #3f3f46;
  border-radius: 4px;
  padding: 0;
  cursor: pointer;
  background: none;
}
.bonk-tweaker-color-hex {
  width: 70px;
  background: #09090b;
  border: 1px solid #3f3f46;
  color: #e4e4e7;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 11px;
  outline: none;
  transition: border-color var(--bonk-transition-bounce);
}
.bonk-tweaker-color-hex:focus {
  border-color: var(--bonk-accent);
  box-shadow: 0 0 0 1px var(--bonk-accent);
}

/* Checkbox */
.bonk-tweaker-checkbox {
  accent-color: var(--bonk-accent);
  cursor: pointer;
}

/* Readonly display */
.bonk-tweaker-readonly {
  color: #71717a;
  font-size: 11px;
  font-style: italic;
}

/* Footer */
.bonk-tweaker-footer {
  display: flex;
  padding: 8px 10px;
  gap: 6px;
  border-top: 1px solid #27272a;
  flex-shrink: 0;
  align-items: center;
}
.bonk-tweaker-btn {
  flex: 1;
  background: #27272a;
  border: 1px solid rgba(var(--bonk-accent-rgb), 0.3);
  color: var(--bonk-accent);
  padding: 5px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  text-align: center;
  transition: background var(--bonk-transition-fast), color var(--bonk-transition-fast), transform var(--bonk-transition-bounce);
}
.bonk-tweaker-btn:hover {
  background: rgba(var(--bonk-accent-rgb), 0.1);
  color: var(--bonk-accent);
}
.bonk-tweaker-btn:active {
  transform: scale(0.96);
}

/* Theme picker */
.bonk-tweaker-theme-picker {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px;
}
.bonk-tweaker-theme-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform var(--bonk-transition-bounce), border-color var(--bonk-transition-fast);
}
.bonk-tweaker-theme-swatch:hover {
  transform: scale(1.2);
}
.bonk-tweaker-theme-swatch.active {
  border-color: #e4e4e7;
}

/* Group hidden by search */
.bonk-tweaker-group.search-hidden {
  display: none;
}

/* Floating toggle button */
.bonk-tweaker-fab {
  --bonk-fab-accent: #f59e0b;
  position: fixed;
  bottom: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(9, 9, 11, 0.9);
  border: 1px solid #27272a;
  color: var(--bonk-fab-accent);
  cursor: pointer;
  z-index: 99998;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 900;
  font-family: 'Space Grotesk', sans-serif;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease-out, border-color 0.15s ease-out;
  opacity: 0.5;
  padding: 0;
  line-height: 1;
}
.bonk-tweaker-fab:hover {
  opacity: 1;
  transform: scale(1.15);
  border-color: var(--bonk-fab-accent);
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.5), 0 0 8px rgba(var(--bonk-fab-accent-rgb, 245, 158, 11), 0.2);
}
.bonk-tweaker-fab:active {
  transform: scale(0.92);
}
.bonk-tweaker-fab.right { right: 16px; }
.bonk-tweaker-fab.left { left: 16px; }
.bonk-tweaker-fab.theme-amber { --bonk-fab-accent: #f59e0b; --bonk-fab-accent-rgb: 245, 158, 11; }
.bonk-tweaker-fab.theme-lime { --bonk-fab-accent: #84cc16; --bonk-fab-accent-rgb: 132, 204, 22; }
.bonk-tweaker-fab.theme-spring { --bonk-fab-accent: #00e5a0; --bonk-fab-accent-rgb: 0, 229, 160; }
.bonk-tweaker-fab.fab-hidden { display: none; }
`;
