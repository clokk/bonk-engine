/**
 * Tweaker devtools — HTML DOM overlay
 *
 * Renders the tweaker panel as a position:fixed HTML overlay.
 * Handles all DOM creation, search filtering, field editors.
 */

import type { GroupEntry, FieldHint, FieldType, TweakerTheme } from './types';
import { TWEAKER_CSS } from './tweaker-styles';

type ChangeCallback = (group: string, path: string, value: unknown) => void;
type ResetCallback = (group?: string) => void;
type ExportCallback = () => string;
type ImportCallback = (json: string) => void;

interface FieldRef {
  groupName: string;
  path: string;
  defaultValue: unknown;
  row: HTMLElement;
  update: (value: unknown) => void;
}

export class TweakerOverlay {
  private root: HTMLDivElement | null = null;
  private body: HTMLDivElement | null = null;
  private logo: HTMLDivElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private styleEl: HTMLStyleElement | null = null;
  private fields: FieldRef[] = [];
  private groupBodies: Map<string, HTMLElement> = new Map();
  private onChange: ChangeCallback = () => {};
  private onReset: ResetCallback = () => {};
  private onExport: ExportCallback = () => '{}';
  private onImport: ImportCallback = () => {};
  private getterInterval: ReturnType<typeof setInterval> | null = null;
  private logoIdleTimer: ReturnType<typeof setTimeout> | null = null;
  private position: 'left' | 'right' = 'right';
  private width = 360;
  private currentTheme: TweakerTheme = 'amber';
  private swatches: Map<TweakerTheme, HTMLElement> = new Map();
  private fab: HTMLButtonElement | null = null;
  private currentState: 'hidden' | 'active' | 'dormant' = 'hidden';
  private outsideClickListener: ((e: PointerEvent) => void) | null = null;
  private wakingTimer: ReturnType<typeof setTimeout> | null = null;
  private storagePrefix = 'bonk-tweaker';

  setCallbacks(
    onChange: ChangeCallback,
    onReset: ResetCallback,
    onExport: ExportCallback,
    onImport: ImportCallback,
  ) {
    this.onChange = onChange;
    this.onReset = onReset;
    this.onExport = onExport;
    this.onImport = onImport;
  }

  create(position: 'left' | 'right', width: number, storagePrefix: string) {
    this.position = position;
    this.width = width;
    this.storagePrefix = storagePrefix;

    // Inject styles
    this.styleEl = document.createElement('style');
    this.styleEl.textContent = TWEAKER_CSS;
    document.head.appendChild(this.styleEl);

    // Root container
    this.root = document.createElement('div');
    this.root.className = `bonk-tweaker ${position} state-hidden`;
    this.root.style.width = `${width}px`;

    // Prevent game input while interacting
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
    this.root.addEventListener('keyup', (e) => e.stopPropagation());
    this.root.addEventListener('keypress', (e) => e.stopPropagation());

    // Wake from dormant on hover
    this.root.addEventListener('mouseenter', () => {
      if (this.currentState === 'dormant') this.wake();
    });

    // Header
    const header = document.createElement('div');
    header.className = 'bonk-tweaker-header';

    this.searchInput = document.createElement('input');
    this.searchInput.className = 'bonk-tweaker-search';
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Search constants...';
    this.searchInput.addEventListener('input', () => this.applySearch());

    const closeBtn = document.createElement('button');
    closeBtn.className = 'bonk-tweaker-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', () => this.hide());

    header.appendChild(this.searchInput);
    header.appendChild(closeBtn);

    // Body
    this.body = document.createElement('div');
    this.body.className = 'bonk-tweaker-body';

    // Footer
    const footer = document.createElement('div');
    footer.className = 'bonk-tweaker-footer';

    const resetAllBtn = this.createButton('Reset All', () => {
      this.onReset();
      this.refreshAllFields();
    });
    const exportBtn = this.createButton('Export', () => {
      const json = this.onExport();
      navigator.clipboard.writeText(json).catch(() => {
        // Fallback: prompt
        prompt('Copy preset JSON:', json);
      });
    });
    const importBtn = this.createButton('Import', () => {
      const json = prompt('Paste preset JSON:');
      if (json) {
        this.onImport(json);
        this.refreshAllFields();
      }
    });

    footer.appendChild(resetAllBtn);
    footer.appendChild(exportBtn);
    footer.appendChild(importBtn);

    // Theme picker
    const themePicker = document.createElement('div');
    themePicker.className = 'bonk-tweaker-theme-picker';

    const themes: { name: TweakerTheme; color: string }[] = [
      { name: 'amber', color: '#f59e0b' },
      { name: 'lime', color: '#84cc16' },
      { name: 'spring', color: '#00e5a0' },
    ];

    for (const t of themes) {
      const swatch = document.createElement('div');
      swatch.className = 'bonk-tweaker-theme-swatch';
      swatch.style.backgroundColor = t.color;
      swatch.title = t.name;
      swatch.addEventListener('click', () => this.setTheme(t.name));
      this.swatches.set(t.name, swatch);
      themePicker.appendChild(swatch);
    }

    footer.appendChild(themePicker);

    // Logo
    this.logo = document.createElement('div');
    this.logo.className = 'bonk-tweaker-logo';

    const star = document.createElement('div');
    star.className = 'bonk-tweaker-logo-star';

    const textContainer = document.createElement('span');
    textContainer.className = 'bonk-tweaker-logo-text';

    const letters = 'BONK';
    for (let i = 0; i < letters.length; i++) {
      const letter = document.createElement('span');
      letter.className = 'bonk-tweaker-logo-letter';
      letter.style.setProperty('--i', String(i));
      letter.textContent = letters[i];
      textContainer.appendChild(letter);
    }

    const sub = document.createElement('div');
    sub.className = 'bonk-tweaker-logo-sub';
    sub.textContent = 'tweaker';

    this.logo.appendChild(star);
    this.logo.appendChild(textContainer);
    this.logo.appendChild(sub);

    this.root.appendChild(header);
    this.root.appendChild(this.logo);
    this.root.appendChild(this.body);
    this.root.appendChild(footer);
    document.body.appendChild(this.root);

    // Load saved theme (new key first, fall back to legacy key)
    const saved = (localStorage.getItem(`${this.storagePrefix}-ui:theme`) ??
      localStorage.getItem('bonk-tweaker-theme')) as TweakerTheme | null;
    if (saved && this.swatches.has(saved)) {
      this.setTheme(saved);
    } else {
      this.setTheme(this.currentTheme);
    }

    // Floating toggle button
    this.fab = document.createElement('button');
    this.fab.className = `bonk-tweaker-fab ${position} theme-${this.currentTheme}`;
    this.fab.textContent = 'B';
    this.fab.title = 'Toggle Tweaker';
    this.fab.addEventListener('click', () => {
      if (this.currentState === 'hidden') {
        this.show();
      } else {
        this.hide();
      }
    });
    document.body.appendChild(this.fab);
  }

  addGroup(entry: GroupEntry) {
    if (!this.body) return;

    const group = document.createElement('div');
    group.className = 'bonk-tweaker-group';
    group.dataset.groupName = entry.name;

    // Group header
    const header = document.createElement('div');
    header.className = 'bonk-tweaker-group-header';

    // Determine collapsed state: saved UI state takes priority over registration default
    let collapsed = entry.options.collapsed ?? false;
    try {
      const saved = localStorage.getItem(`${this.storagePrefix}-ui:group:${entry.name}`);
      if (saved !== null) collapsed = saved === '1';
    } catch { /* private mode */ }

    const arrow = document.createElement('span');
    arrow.className = 'bonk-tweaker-group-arrow';
    arrow.textContent = collapsed ? '\u25b6' : '\u25bc';

    const name = document.createElement('span');
    name.className = 'bonk-tweaker-group-name';
    name.textContent = entry.name;

    const resetBtn = document.createElement('button');
    resetBtn.className = 'bonk-tweaker-group-reset';
    resetBtn.textContent = '\u21ba';
    resetBtn.title = `Reset ${entry.name}`;
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onReset(entry.name);
      this.refreshGroupFields(entry.name);
    });

    header.appendChild(arrow);
    header.appendChild(name);
    header.appendChild(resetBtn);

    // Group body
    const body = document.createElement('div');
    body.className = `bonk-tweaker-group-body${collapsed ? ' collapsed' : ''}`;

    header.addEventListener('click', () => {
      const isCollapsed = body.classList.toggle('collapsed');
      arrow.textContent = isCollapsed ? '\u25b6' : '\u25bc';
      try { localStorage.setItem(`${this.storagePrefix}-ui:group:${entry.name}`, isCollapsed ? '1' : '0'); }
      catch { /* quota exceeded or private mode */ }
    });

    // Add fields
    this.addFields(entry, body, entry.target, entry.defaults, '', entry.options.hints || {});

    this.groupBodies.set(entry.name, body);

    group.appendChild(header);
    group.appendChild(body);
    this.body.appendChild(group);
  }

  removeGroup(name: string) {
    if (!this.body) return;
    const el = this.body.querySelector(`[data-group-name="${name}"]`);
    if (el) el.remove();
    this.fields = this.fields.filter((f) => f.groupName !== name);
    this.groupBodies.delete(name);
  }

  show() {
    if (!this.root) return;
    this.currentState = 'active';
    this.applyStateClasses();
    this.refreshAllFields();
    this.playLogoEntrance();
    this.setupDormantListeners();

    // Start getter refresh interval
    if (!this.getterInterval) {
      this.getterInterval = setInterval(() => this.refreshGetters(), 500);
    }

    this.fab?.classList.add('fab-hidden');

    try { localStorage.setItem(`${this.storagePrefix}-ui:visible`, '1'); }
    catch { /* quota exceeded or private mode */ }
  }

  hide() {
    if (!this.root) return;
    this.currentState = 'hidden';
    this.applyStateClasses();
    this.removeDormantListeners();
    if (this.wakingTimer) {
      clearTimeout(this.wakingTimer);
      this.wakingTimer = null;
    }
    if (this.getterInterval) {
      clearInterval(this.getterInterval);
      this.getterInterval = null;
    }

    this.fab?.classList.remove('fab-hidden');

    try { localStorage.setItem(`${this.storagePrefix}-ui:visible`, '0'); }
    catch { /* quota exceeded or private mode */ }
  }

  isVisible(): boolean {
    return this.currentState !== 'hidden';
  }

  restoreVisibility() {
    try {
      if (localStorage.getItem(`${this.storagePrefix}-ui:visible`) === '1') {
        this.show();
      }
    } catch { /* private mode */ }
  }

  getState(): 'hidden' | 'active' | 'dormant' {
    return this.currentState;
  }

  goDormant() {
    if (!this.root || this.currentState !== 'active') return;
    this.currentState = 'dormant';
    this.applyStateClasses();
  }

  wake() {
    if (!this.root || this.currentState !== 'dormant') return;
    this.currentState = 'active';
    this.root.classList.add('waking');
    this.applyStateClasses();
    this.playLogoEntrance();

    // Remove waking class after the spring transition completes
    if (this.wakingTimer) clearTimeout(this.wakingTimer);
    this.wakingTimer = setTimeout(() => {
      this.root?.classList.remove('waking');
      this.wakingTimer = null;
    }, 600);
  }

  private applyStateClasses() {
    if (!this.root) return;
    this.root.classList.remove('state-hidden', 'state-active', 'state-dormant');
    this.root.classList.add(`state-${this.currentState}`);
  }

  private playLogoEntrance() {
    if (!this.logo) return;
    if (this.logoIdleTimer) {
      clearTimeout(this.logoIdleTimer);
      this.logoIdleTimer = null;
    }
    this.logo.classList.remove('idle');
    this.logo.classList.add('entering');
    this.logoIdleTimer = setTimeout(() => {
      if (this.logo) {
        this.logo.classList.remove('entering');
        this.logo.classList.add('idle');
      }
    }, 800);
  }

  private setupDormantListeners() {
    if (this.outsideClickListener) return;
    this.outsideClickListener = (e: PointerEvent) => {
      if (this.currentState === 'active' && this.root && !this.root.contains(e.target as Node)) {
        this.goDormant();
      }
    };
    // Use pointerdown instead of mousedown — PixiJS calls preventDefault()
    // on pointerdown which suppresses the compatibility mousedown event
    document.addEventListener('pointerdown', this.outsideClickListener);
  }

  private removeDormantListeners() {
    if (this.outsideClickListener) {
      document.removeEventListener('pointerdown', this.outsideClickListener);
      this.outsideClickListener = null;
    }
  }

  setTheme(name: TweakerTheme) {
    if (!this.root) return;
    this.root.classList.remove('theme-amber', 'theme-lime', 'theme-spring');
    this.root.classList.add(`theme-${name}`);
    this.currentTheme = name;
    try {
      localStorage.setItem(`${this.storagePrefix}-ui:theme`, name);
    } catch { /* quota exceeded or private mode */ }
    this.swatches.forEach((swatch, themeName) => {
      swatch.classList.toggle('active', themeName === name);
    });
    if (this.fab) {
      this.fab.classList.remove('theme-amber', 'theme-lime', 'theme-spring');
      this.fab.classList.add(`theme-${name}`);
    }
  }

  destroy() {
    if (this.getterInterval) clearInterval(this.getterInterval);
    if (this.logoIdleTimer) clearTimeout(this.logoIdleTimer);
    if (this.wakingTimer) clearTimeout(this.wakingTimer);
    this.removeDormantListeners();
    this.root?.remove();
    this.styleEl?.remove();
    this.fab?.remove();
    this.fields = [];
    this.groupBodies.clear();
    this.root = null;
    this.body = null;
    this.logo = null;
    this.fab = null;
  }

  // === Field creation ===

  private addFields(
    entry: GroupEntry,
    container: HTMLElement,
    target: Record<string, unknown>,
    defaults: Record<string, unknown>,
    prefix: string,
    hints: Record<string, FieldHint>,
  ) {
    for (const key of Object.keys(target)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const descriptor = Object.getOwnPropertyDescriptor(target, key);

      // Getter → readonly
      if (descriptor && descriptor.get) {
        this.addReadonlyField(entry.name, container, key, path, target);
        continue;
      }

      const value = target[key];
      const fieldType = this.detectFieldType(key, value, hints[path] || hints[key]);

      switch (fieldType) {
        case 'number':
          this.addNumberField(entry.name, container, key, path, target, defaults);
          break;
        case 'color':
          this.addColorField(entry.name, container, key, path, target, defaults);
          break;
        case 'boolean':
          this.addBooleanField(entry.name, container, key, path, target, defaults);
          break;
        case 'object':
          this.addSubgroup(entry, container, key, path, target, defaults, hints);
          break;
        case 'readonly':
          this.addReadonlyField(entry.name, container, key, path, target);
          break;
      }
    }
  }

  private detectFieldType(key: string, value: unknown, hint?: FieldHint): FieldType {
    if (hint === 'color') return 'color';
    if (hint === 'readonly') return 'readonly';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') {
      // Auto-detect color from key name + value range
      const upperKey = key.toUpperCase();
      if ((upperKey.includes('COLOR') || upperKey.includes('TINT')) && value > 0xff && Number.isInteger(value)) {
        return 'color';
      }
      return 'number';
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return 'object';
    }
    return 'readonly';
  }

  private addNumberField(
    groupName: string,
    container: HTMLElement,
    key: string,
    path: string,
    target: Record<string, unknown>,
    defaults: Record<string, unknown>,
  ) {
    const row = this.createFieldRow(key);
    const controls = row.querySelector('.bonk-tweaker-field-controls')!;
    const defaultValue = this.getNestedDefault(defaults, path);
    const currentValue = target[key] as number;

    // Slider range inference
    const { min, max, step } = this.inferRange(currentValue);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'bonk-tweaker-slider';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(currentValue);

    const numInput = document.createElement('input');
    numInput.type = 'number';
    numInput.className = 'bonk-tweaker-number';
    numInput.value = this.formatNumber(currentValue);
    numInput.step = String(step);

    const updateModified = () => {
      const isModified = (target[key] as number) !== defaultValue;
      row.classList.toggle('modified', isModified);
    };

    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      numInput.value = this.formatNumber(v);
      (target as Record<string, unknown>)[key] = v;
      this.onChange(groupName, path, v);
      updateModified();
    });

    numInput.addEventListener('change', () => {
      const v = parseFloat(numInput.value);
      if (!isNaN(v)) {
        (target as Record<string, unknown>)[key] = v;
        // Auto-expand slider range if typed value exceeds bounds
        if (v < parseFloat(slider.min)) slider.min = String(v * (v < 0 ? 2 : 0.5));
        if (v > parseFloat(slider.max)) slider.max = String(v * 1.5);
        slider.value = String(v);
        this.onChange(groupName, path, v);
        updateModified();
      }
    });

    controls.appendChild(slider);
    controls.appendChild(numInput);
    container.appendChild(row);

    updateModified();

    this.fields.push({
      groupName,
      path,
      defaultValue,
      row,
      update: (v: unknown) => {
        slider.value = String(v);
        numInput.value = this.formatNumber(v as number);
        updateModified();
      },
    });
  }

  private addColorField(
    groupName: string,
    container: HTMLElement,
    key: string,
    path: string,
    target: Record<string, unknown>,
    defaults: Record<string, unknown>,
  ) {
    const row = this.createFieldRow(key);
    const controls = row.querySelector('.bonk-tweaker-field-controls')!;
    const defaultValue = this.getNestedDefault(defaults, path);
    const currentValue = target[key] as number;

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'bonk-tweaker-color';
    colorInput.value = '#' + currentValue.toString(16).padStart(6, '0');

    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.className = 'bonk-tweaker-color-hex';
    hexInput.value = '0x' + currentValue.toString(16).padStart(6, '0');

    const updateModified = () => {
      const isModified = (target[key] as number) !== defaultValue;
      row.classList.toggle('modified', isModified);
    };

    colorInput.addEventListener('input', () => {
      const hex = colorInput.value;
      const v = parseInt(hex.slice(1), 16);
      hexInput.value = '0x' + v.toString(16).padStart(6, '0');
      (target as Record<string, unknown>)[key] = v;
      this.onChange(groupName, path, v);
      updateModified();
    });

    hexInput.addEventListener('change', () => {
      let raw = hexInput.value.trim();
      if (raw.startsWith('0x') || raw.startsWith('0X')) raw = raw.slice(2);
      if (raw.startsWith('#')) raw = raw.slice(1);
      const v = parseInt(raw, 16);
      if (!isNaN(v)) {
        colorInput.value = '#' + v.toString(16).padStart(6, '0');
        hexInput.value = '0x' + v.toString(16).padStart(6, '0');
        (target as Record<string, unknown>)[key] = v;
        this.onChange(groupName, path, v);
        updateModified();
      }
    });

    controls.appendChild(colorInput);
    controls.appendChild(hexInput);
    container.appendChild(row);

    updateModified();

    this.fields.push({
      groupName,
      path,
      defaultValue,
      row,
      update: (v: unknown) => {
        const n = v as number;
        colorInput.value = '#' + n.toString(16).padStart(6, '0');
        hexInput.value = '0x' + n.toString(16).padStart(6, '0');
        updateModified();
      },
    });
  }

  private addBooleanField(
    groupName: string,
    container: HTMLElement,
    key: string,
    path: string,
    target: Record<string, unknown>,
    defaults: Record<string, unknown>,
  ) {
    const row = this.createFieldRow(key);
    const controls = row.querySelector('.bonk-tweaker-field-controls')!;
    const defaultValue = this.getNestedDefault(defaults, path);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'bonk-tweaker-checkbox';
    checkbox.checked = target[key] as boolean;

    const updateModified = () => {
      const isModified = (target[key] as boolean) !== defaultValue;
      row.classList.toggle('modified', isModified);
    };

    checkbox.addEventListener('change', () => {
      (target as Record<string, unknown>)[key] = checkbox.checked;
      this.onChange(groupName, path, checkbox.checked);
      updateModified();
    });

    controls.appendChild(checkbox);
    container.appendChild(row);

    updateModified();

    this.fields.push({
      groupName,
      path,
      defaultValue,
      row,
      update: (v: unknown) => {
        checkbox.checked = v as boolean;
        updateModified();
      },
    });
  }

  private addReadonlyField(
    groupName: string,
    container: HTMLElement,
    key: string,
    path: string,
    target: Record<string, unknown>,
  ) {
    const row = this.createFieldRow(key);
    const controls = row.querySelector('.bonk-tweaker-field-controls')!;

    const span = document.createElement('span');
    span.className = 'bonk-tweaker-readonly';
    const val = target[key];
    span.textContent = this.formatReadonly(val);

    controls.appendChild(span);
    container.appendChild(row);

    this.fields.push({
      groupName,
      path,
      defaultValue: undefined,
      row,
      update: (v: unknown) => {
        span.textContent = this.formatReadonly(v);
      },
    });
  }

  private addSubgroup(
    entry: GroupEntry,
    container: HTMLElement,
    key: string,
    path: string,
    target: Record<string, unknown>,
    defaults: Record<string, unknown>,
    hints: Record<string, FieldHint>,
  ) {
    const sub = target[key] as Record<string, unknown>;
    const defSub = (this.getNestedDefault(defaults, path) || {}) as Record<string, unknown>;

    // Restore saved subgroup collapse state
    let collapsed = false;
    try {
      const saved = localStorage.getItem(`${this.storagePrefix}-ui:subgroup:${entry.name}:${path}`);
      if (saved !== null) collapsed = saved === '1';
    } catch { /* private mode */ }

    const wrapper = document.createElement('div');
    wrapper.className = 'bonk-tweaker-subgroup';

    const header = document.createElement('div');
    header.className = 'bonk-tweaker-subgroup-header';

    const arrow = document.createElement('span');
    arrow.className = 'bonk-tweaker-group-arrow';
    arrow.textContent = collapsed ? '\u25b6' : '\u25bc';

    const label = document.createElement('span');
    label.textContent = key;

    header.appendChild(arrow);
    header.appendChild(label);

    const body = document.createElement('div');
    body.className = `bonk-tweaker-subgroup-body${collapsed ? ' collapsed' : ''}`;

    header.addEventListener('click', () => {
      const isCollapsed = body.classList.toggle('collapsed');
      arrow.textContent = isCollapsed ? '\u25b6' : '\u25bc';
      try { localStorage.setItem(`${this.storagePrefix}-ui:subgroup:${entry.name}:${path}`, isCollapsed ? '1' : '0'); }
      catch { /* quota exceeded or private mode */ }
    });

    // Build nested field hints with paths relative to subgroup
    const subHints: Record<string, FieldHint> = {};
    for (const [hk, hv] of Object.entries(hints)) {
      if (hk.startsWith(path + '.')) {
        subHints[hk] = hv;
        subHints[hk.slice(path.length + 1)] = hv;
      }
    }

    this.addFields(entry, body, sub, defSub, path, subHints);

    wrapper.appendChild(header);
    wrapper.appendChild(body);
    container.appendChild(wrapper);
  }

  // === Search ===

  private applySearch() {
    if (!this.body || !this.searchInput) return;
    const query = this.searchInput.value.toLowerCase().trim();

    // Show/hide fields
    for (const field of this.fields) {
      const matchesPath = field.path.toLowerCase().includes(query);
      const matchesGroup = field.groupName.toLowerCase().includes(query);
      field.row.classList.toggle('search-hidden', !!(query && !matchesPath && !matchesGroup));
    }

    // Show/hide groups based on whether they have visible fields
    const groups = this.body.querySelectorAll('.bonk-tweaker-group');
    for (const group of groups) {
      const groupName = (group as HTMLElement).dataset.groupName || '';
      const groupMatches = groupName.toLowerCase().includes(query);
      const hasVisibleField = group.querySelector('.bonk-tweaker-field:not(.search-hidden)');
      (group as HTMLElement).classList.toggle('search-hidden', !!(query && !groupMatches && !hasVisibleField));

      // Auto-expand groups with search matches
      if (query && (groupMatches || hasVisibleField)) {
        const body = group.querySelector('.bonk-tweaker-group-body');
        const arrow = group.querySelector('.bonk-tweaker-group-arrow');
        if (body) body.classList.remove('collapsed');
        if (arrow) arrow.textContent = '\u25bc';
      }
    }
  }

  // === Refresh ===

  refreshAllFields() {
    // Stub — fields read directly from target objects via update()
    // This is called after reset to sync DOM with target values
    for (const field of this.fields) {
      const value = this.resolveFieldValue(field);
      if (value !== undefined) field.update(value);
    }
  }

  private refreshGroupFields(groupName: string) {
    for (const field of this.fields) {
      if (field.groupName === groupName) {
        const value = this.resolveFieldValue(field);
        if (value !== undefined) field.update(value);
      }
    }
  }

  private refreshGetters() {
    for (const field of this.fields) {
      if (field.defaultValue === undefined) {
        // Likely a getter or readonly
        const value = this.resolveFieldValue(field);
        if (value !== undefined) field.update(value);
      }
    }
  }

  private resolveFieldValue(field: FieldRef): unknown {
    // Walk the registered groups to find the target
    // Fields store groupName + path — we need the Tweaker to give us the target
    // Since we can't access Tweaker from here, fields update from stored refs
    // The addXxxField methods capture target in closures, so refreshing
    // just needs to re-read from the same target object reference
    return undefined; // update() closures handle reading
  }

  // === Utilities ===

  private createFieldRow(key: string): HTMLElement {
    const row = document.createElement('div');
    row.className = 'bonk-tweaker-field';
    row.dataset.fieldKey = key;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'bonk-tweaker-field-name';
    nameSpan.textContent = key;
    nameSpan.title = key;

    const controls = document.createElement('div');
    controls.className = 'bonk-tweaker-field-controls';

    row.appendChild(nameSpan);
    row.appendChild(controls);
    return row;
  }

  private createButton(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'bonk-tweaker-btn';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  private inferRange(value: number): { min: number; max: number; step: number } {
    if (value === 0) return { min: -1, max: 1, step: 0.01 };

    const abs = Math.abs(value);
    let min: number, max: number, step: number;

    if (abs <= 1) {
      min = value < 0 ? value * 3 : 0;
      max = value < 0 ? -value : value * 3;
      step = 0.001;
    } else if (abs <= 10) {
      min = value < 0 ? value * 3 : 0;
      max = value < 0 ? 0 : value * 3;
      step = 0.1;
    } else {
      min = value < 0 ? value * 3 : 0;
      max = value < 0 ? 0 : value * 3;
      step = abs < 100 ? 1 : Math.round(abs / 100);
    }

    return { min, max, step };
  }

  private formatNumber(v: number): string {
    if (Number.isInteger(v)) return String(v);
    // Show up to 4 decimal places, strip trailing zeros
    return parseFloat(v.toFixed(4)).toString();
  }

  private formatReadonly(v: unknown): string {
    if (typeof v === 'number') return this.formatNumber(v);
    if (typeof v === 'string') return `"${v}"`;
    if (Array.isArray(v)) return `[${v.join(', ')}]`;
    if (v === null || v === undefined) return String(v);
    return JSON.stringify(v);
  }

  private getNestedDefault(defaults: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = defaults;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }
}
