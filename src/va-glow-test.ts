/**
 * VA Glow Test — PixiJS Visual Prototype
 *
 * Phase 0 dealbreaker gate: Can PixiJS reproduce Void Artillery's
 * neon-on-void aesthetic? 7 interactive tests, switchable via number keys.
 *
 * NO engine source changes. Uses PixiJS directly via game.renderer internals.
 */

import { Game, Time, Input } from './index';
import {
  Application,
  Container,
  Graphics,
  Sprite,
  Texture,
  RenderTexture,
  BlurFilter,
  type Renderer as PixiRendererType,
} from 'pixi.js';
import { GlowFilter } from 'pixi-filters/glow';
import { RGBSplitFilter } from 'pixi-filters/rgb-split';

// ═══════════════════════════════════════════════════════════════════════════
// VA COLOR LANGUAGE
// ═══════════════════════════════════════════════════════════════════════════

const VA = {
  black: 0x000000,
  grid: 0x111122,
  cyan: 0x00ffff,
  magenta: 0xff00ff,
  yellow: 0xffff00,
  white: 0xffffff,
  orange: 0xff8800,
  red: 0xff4444,
  voidPurple: 0x1a0033,
  voidDeep: 0x0a0010,
  terrain: 0x050510,
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Particle {
  sprite: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  startAlpha: number;
  startScale: number;
  type: 'circle' | 'streak';
  gravity: number;
}

interface Shockwave {
  gfx: Graphics;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: number;
  lineWidth: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const W = 800;
  const H = 600;

  // Create game WITHOUT physics (we don't need it for visual tests)
  const game = new Game({ physics: { enabled: false } });
  const canvas = await game.init({ width: W, height: H, backgroundColor: 0x000000 });
  document.getElementById('app')?.appendChild(canvas);

  // Get PixiJS internals
  const pixiRenderer = (game.renderer as any);
  const app: Application = pixiRenderer.app;
  const stage = app.stage;
  const renderer: PixiRendererType = app.renderer;

  // ═══════════════════════════════════════════════════════════════════════
  // PRE-BAKED GLOW TEXTURES
  // ═══════════════════════════════════════════════════════════════════════

  function bakeGlowTexture(
    radius: number,
    blurAmount: number,
    color: number = 0xffffff
  ): Texture {
    const padding = blurAmount * 2;
    const size = (radius + padding) * 2;

    const gfx = new Graphics();
    gfx.circle(size / 2, size / 2, radius);
    gfx.fill({ color, alpha: 1 });

    const blur = new BlurFilter({ strength: blurAmount, quality: 4 });
    gfx.filters = [blur];

    const rt = RenderTexture.create({ width: size, height: size });
    renderer.render({ container: gfx, target: rt });

    gfx.destroy();
    return rt;
  }

  // Bake standard glow textures
  const glowSmall = bakeGlowTexture(4, 12);
  const glowMed = bakeGlowTexture(8, 16);
  const glowLarge = bakeGlowTexture(16, 24);
  const glowHuge = bakeGlowTexture(32, 30);

  // Bake streak texture (elongated)
  function bakeStreakTexture(w: number, h: number, blur: number): Texture {
    const padding = blur * 2;
    const tw = w + padding * 2;
    const th = h + padding * 2;

    const gfx = new Graphics();
    gfx.roundRect(padding, padding + h * 0.2, w, h * 0.6, h * 0.3);
    gfx.fill({ color: 0xffffff, alpha: 1 });

    const blurFilter = new BlurFilter({ strength: blur, quality: 3 });
    gfx.filters = [blurFilter];

    const rt = RenderTexture.create({ width: tw, height: th });
    renderer.render({ container: gfx, target: rt });
    gfx.destroy();
    return rt;
  }

  const glowStreak = bakeStreakTexture(16, 6, 10);

  // Bake a radial gradient for light bursts
  function bakeRadialGradient(radius: number): Texture {
    const size = radius * 2;
    const gfx = new Graphics();
    // Multiple concentric circles with decreasing alpha for gradient
    const steps = 12;
    for (let i = steps; i >= 0; i--) {
      const r = radius * (i / steps);
      const alpha = 1 - (i / steps);
      gfx.circle(radius, radius, r);
      gfx.fill({ color: 0xffffff, alpha: alpha * 0.6 });
    }

    const blur = new BlurFilter({ strength: 8, quality: 3 });
    gfx.filters = [blur];

    const rt = RenderTexture.create({ width: size, height: size });
    renderer.render({ container: gfx, target: rt });
    gfx.destroy();
    return rt;
  }

  const lightBurstTex = bakeRadialGradient(100);

  // Bake vignette texture
  function bakeVignette(w: number, h: number): Texture {
    const gfx = new Graphics();
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const scaleX = 1 - t * 0.5;
      const scaleY = 1 - t * 0.5;
      const alpha = t * t * 0.06;
      gfx.ellipse(w / 2, h / 2, w * scaleX / 2, h * scaleY / 2);
      gfx.fill({ color: 0x000000, alpha });
    }
    const rt = RenderTexture.create({ width: w, height: h });
    renderer.render({ container: gfx, target: rt });
    gfx.destroy();
    return rt;
  }

  const vignetteTex = bakeVignette(W, H);

  // Bake scanline texture
  function bakeScanlines(w: number, h: number, spacing: number): Texture {
    const gfx = new Graphics();
    for (let y = 0; y < h; y += spacing) {
      gfx.rect(0, y, w, 1);
      gfx.fill({ color: 0x000000, alpha: 0.15 });
    }
    const rt = RenderTexture.create({ width: w, height: h });
    renderer.render({ container: gfx, target: rt });
    gfx.destroy();
    return rt;
  }

  const scanlineTex = bakeScanlines(W, H, 4);

  // ═══════════════════════════════════════════════════════════════════════
  // PARTICLE SYSTEM
  // ═══════════════════════════════════════════════════════════════════════

  const MAX_PARTICLES = 1200;
  const particlePool: Particle[] = [];
  const activeParticles: Particle[] = [];
  const particleContainer = new Container();

  // Pre-allocate particle pool
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const sprite = new Sprite(glowMed);
    sprite.anchor.set(0.5);
    sprite.visible = false;
    sprite.blendMode = 'add';
    particleContainer.addChild(sprite);
    particlePool.push({
      sprite, x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0, startAlpha: 1, startScale: 1,
      type: 'circle', gravity: 0,
    });
  }

  function spawnParticle(
    x: number, y: number, vx: number, vy: number,
    life: number, color: number, scale: number,
    texture: Texture, gravity: number = 0, alpha: number = 1,
  ): Particle | null {
    if (particlePool.length === 0) return null;
    const p = particlePool.pop()!;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.life = life; p.maxLife = life;
    p.startAlpha = alpha; p.startScale = scale;
    p.gravity = gravity;
    p.sprite.texture = texture;
    p.sprite.tint = color;
    p.sprite.scale.set(scale);
    p.sprite.alpha = alpha;
    p.sprite.position.set(x, y);
    p.sprite.visible = true;
    p.sprite.rotation = 0;
    activeParticles.push(p);
    return p;
  }

  function updateParticles(dt: number) {
    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const p = activeParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.sprite.visible = false;
        particlePool.push(p);
        activeParticles.splice(i, 1);
        continue;
      }
      const t = p.life / p.maxLife; // 1→0
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.sprite.position.set(p.x, p.y);
      p.sprite.alpha = t * p.startAlpha;
      p.sprite.scale.set(t * p.startScale);
    }
  }

  function killAllParticles() {
    for (let i = activeParticles.length - 1; i >= 0; i--) {
      activeParticles[i].sprite.visible = false;
      particlePool.push(activeParticles[i]);
    }
    activeParticles.length = 0;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SHOCKWAVE SYSTEM
  // ═══════════════════════════════════════════════════════════════════════

  const MAX_SHOCKWAVES = 10;
  const activeShockwaves: Shockwave[] = [];
  const shockwaveContainer = new Container();

  function spawnShockwave(
    x: number, y: number, maxRadius: number, life: number,
    color: number, lineWidth: number
  ) {
    if (activeShockwaves.length >= MAX_SHOCKWAVES) return;
    const gfx = new Graphics();
    gfx.filters = [new GlowFilter({ distance: 15, outerStrength: 2, color, quality: 0.2 })];
    shockwaveContainer.addChild(gfx);
    activeShockwaves.push({ gfx, x, y, radius: 0, maxRadius, life, maxLife: life, color, lineWidth });
  }

  function updateShockwaves(dt: number) {
    for (let i = activeShockwaves.length - 1; i >= 0; i--) {
      const sw = activeShockwaves[i];
      sw.life -= dt;
      if (sw.life <= 0) {
        shockwaveContainer.removeChild(sw.gfx);
        sw.gfx.destroy();
        activeShockwaves.splice(i, 1);
        continue;
      }
      const progress = 1 - sw.life / sw.maxLife; // 0→1
      sw.radius = sw.maxRadius * progress;
      const alpha = 1 - progress;

      sw.gfx.clear();
      sw.gfx.circle(sw.x, sw.y, sw.radius);
      sw.gfx.stroke({ width: sw.lineWidth * (1 - progress * 0.7), color: sw.color, alpha });
    }
  }

  function killAllShockwaves() {
    for (const sw of activeShockwaves) {
      shockwaveContainer.removeChild(sw.gfx);
      sw.gfx.destroy();
    }
    activeShockwaves.length = 0;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SCREEN EFFECTS
  // ═══════════════════════════════════════════════════════════════════════

  let shakeIntensity = 0;
  const shakeDecay = 0.88;
  const stageBaseX = 0;
  const stageBaseY = 0;

  function triggerShake(intensity: number) {
    shakeIntensity = Math.max(shakeIntensity, intensity);
  }

  function updateScreenShake() {
    if (shakeIntensity > 0.5) {
      stage.position.set(
        stageBaseX + (Math.random() - 0.5) * shakeIntensity * 2,
        stageBaseY + (Math.random() - 0.5) * shakeIntensity * 2,
      );
      shakeIntensity *= shakeDecay;
    } else {
      shakeIntensity = 0;
      stage.position.set(stageBaseX, stageBaseY);
    }
  }

  // Screen flash
  const flashOverlay = new Graphics();
  flashOverlay.rect(0, 0, W, H);
  flashOverlay.fill({ color: 0xffffff });
  flashOverlay.alpha = 0;
  flashOverlay.blendMode = 'add';

  let flashAlpha = 0;
  function triggerFlash(alpha: number, color: number = VA.white) {
    flashAlpha = alpha;
    flashOverlay.clear();
    flashOverlay.rect(0, 0, W, H);
    flashOverlay.fill({ color });
  }

  function updateFlash(dt: number) {
    if (flashAlpha > 0.01) {
      flashAlpha *= 0.85;
      flashOverlay.alpha = flashAlpha;
    } else {
      flashAlpha = 0;
      flashOverlay.alpha = 0;
    }
  }

  // Light burst sprites
  const lightBursts: { sprite: Sprite; life: number; maxLife: number }[] = [];

  function spawnLightBurst(x: number, y: number, scale: number, life: number, color: number) {
    const s = new Sprite(lightBurstTex);
    s.anchor.set(0.5);
    s.position.set(x, y);
    s.scale.set(scale);
    s.tint = color;
    s.blendMode = 'add';
    s.alpha = 0.4;
    particleContainer.addChild(s);
    lightBursts.push({ sprite: s, life, maxLife: life });
  }

  function updateLightBursts(dt: number) {
    for (let i = lightBursts.length - 1; i >= 0; i--) {
      const lb = lightBursts[i];
      lb.life -= dt;
      if (lb.life <= 0) {
        particleContainer.removeChild(lb.sprite);
        lb.sprite.destroy();
        lightBursts.splice(i, 1);
        continue;
      }
      lb.sprite.alpha = 0.4 * (lb.life / lb.maxLife);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXPLOSION FUNCTION (VA 8-layer formula)
  // ═══════════════════════════════════════════════════════════════════════

  function spawnExplosion(x: number, y: number, weaponColor: number = VA.cyan) {
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const randAngle = () => Math.random() * Math.PI * 2;

    // Layer 1: Core flash (3-5) — tinted to weapon color, reduced scale/alpha
    for (let i = 0; i < 4; i++) {
      const a = randAngle();
      const spd = rand(50, 100);
      spawnParticle(x, y, Math.cos(a) * spd, Math.sin(a) * spd,
        rand(0.1, 0.2), weaponColor, rand(0.8, 1.4), glowLarge, 0, 0.6);
    }

    // Layer 2: Main burst (30-60)
    for (let i = 0; i < 45; i++) {
      const a = randAngle();
      const spd = rand(100, 300);
      spawnParticle(x, y, Math.cos(a) * spd, Math.sin(a) * spd,
        rand(0.3, 0.8), weaponColor, rand(0.4, 1.2), glowMed, 80, 1);
    }

    // Layer 3: Hot core (10-15) — yellow/weapon instead of white
    for (let i = 0; i < 12; i++) {
      const a = randAngle();
      const spd = rand(50, 150);
      const c = Math.random() > 0.5 ? VA.yellow : weaponColor;
      spawnParticle(x, y, Math.cos(a) * spd, Math.sin(a) * spd,
        rand(0.15, 0.3), c, rand(0.3, 0.8), glowSmall, 0, 0.7);
    }

    // Layer 4: Streaks (15-25)
    for (let i = 0; i < 20; i++) {
      const a = randAngle();
      const spd = rand(200, 500);
      const p = spawnParticle(x, y, Math.cos(a) * spd, Math.sin(a) * spd,
        rand(0.2, 0.5), weaponColor, rand(0.5, 1.0), glowStreak, 0, 0.9);
      if (p) p.sprite.rotation = a;
    }

    // Layer 5: Smoke (8-12) - normal blend, dark orange, upward drift
    for (let i = 0; i < 10; i++) {
      const a = randAngle();
      const spd = rand(20, 60);
      const p = spawnParticle(x, y, Math.cos(a) * spd, -Math.abs(Math.sin(a) * spd) - 20,
        rand(0.5, 1.5), 0x442200, rand(0.6, 1.5), glowLarge, -30, 0.25);
      if (p) p.sprite.blendMode = 'normal';
    }

    // Layer 6: Shockwave (1-2)
    spawnShockwave(x, y, rand(80, 150), rand(0.2, 0.5), weaponColor, 3);
    if (Math.random() > 0.5) {
      spawnShockwave(x, y, rand(120, 200), rand(0.3, 0.5), weaponColor, 2);
    }

    // Layer 7: Scatter sparks (5-10)
    for (let i = 0; i < 8; i++) {
      const a = randAngle();
      const spd = rand(150, 350);
      spawnParticle(x, y, Math.cos(a) * spd, Math.sin(a) * spd,
        rand(0.3, 0.6), VA.yellow, rand(0.2, 0.4), glowSmall, 200, 1);
    }

    // Layer 8: Debris ring (10-20)
    for (let i = 0; i < 15; i++) {
      const a = randAngle();
      const spd = rand(80, 200);
      const c = Math.random() > 0.5 ? VA.orange : VA.red;
      spawnParticle(x, y, Math.cos(a) * spd, Math.sin(a) * spd,
        rand(0.4, 0.8), c, rand(0.3, 0.6), glowSmall, 150, 0.8);
    }

    // Screen effects — flash uses weapon color at low alpha for photosensitivity
    triggerShake(25);
    triggerFlash(0.08, weaponColor);
    spawnLightBurst(x, y, 1.0, 0.15, weaponColor);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TERRAIN HEIGHTMAP (shared between tests)
  // ═══════════════════════════════════════════════════════════════════════

  const terrainHeights: number[] = [];
  for (let x = 0; x < W; x++) {
    terrainHeights[x] = H * 0.6
      + Math.sin(x * 0.01) * 60
      + Math.sin(x * 0.03) * 30
      + Math.sin(x * 0.07) * 15
      + Math.sin(x * 0.002) * 40;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TEST CONTAINERS (one per test, toggled via number keys)
  // ═══════════════════════════════════════════════════════════════════════

  const testContainers: Container[] = [];
  const testNames = [
    '1: Neon Shapes',
    '2: Terrain Profile',
    '3: Particle Explosion',
    '4: Void Edge',
    '5: Projectile + Trail',
    '6: Post-FX',
    '7: Perf Stress Test',
  ];

  for (let i = 0; i < 7; i++) {
    const c = new Container();
    c.visible = false;
    testContainers.push(c);
    stage.addChild(c);
  }

  // Add shared layers on top
  stage.addChild(particleContainer);
  stage.addChild(shockwaveContainer);
  stage.addChild(flashOverlay);

  let currentTest = 0;

  function switchTest(index: number) {
    killAllParticles();
    killAllShockwaves();
    flashAlpha = 0;
    flashOverlay.alpha = 0;
    shakeIntensity = 0;
    stage.position.set(0, 0);

    // Reset test-specific state
    projectiles.length = 0;
    voidY = H + 20;
    chromAbIntensity = 0;

    for (const c of testContainers) c.visible = false;
    testContainers[index].visible = true;
    currentTest = index;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 1: NEON SHAPES
  // ═══════════════════════════════════════════════════════════════════════

  {
    const c = testContainers[0];

    // Cyan filled circle with GlowFilter
    const cyanCircle = new Graphics();
    cyanCircle.circle(150, 250, 20);
    cyanCircle.fill({ color: VA.cyan });
    cyanCircle.filters = [new GlowFilter({ distance: 20, outerStrength: 3, color: VA.cyan, quality: 0.3 })];
    c.addChild(cyanCircle);

    // Magenta ring (stroke only)
    const magRing = new Graphics();
    magRing.circle(300, 250, 30);
    magRing.stroke({ width: 2, color: VA.magenta });
    magRing.filters = [new GlowFilter({ distance: 15, outerStrength: 3, color: VA.magenta, quality: 0.3 })];
    c.addChild(magRing);

    // Yellow line
    const yellowLine = new Graphics();
    yellowLine.moveTo(400, 200);
    yellowLine.lineTo(550, 300);
    yellowLine.stroke({ width: 2, color: VA.yellow });
    yellowLine.filters = [new GlowFilter({ distance: 20, outerStrength: 3, color: VA.yellow, quality: 0.3 })];
    c.addChild(yellowLine);

    // White particle-style glow (pre-baked texture)
    const whiteGlow = new Sprite(glowHuge);
    whiteGlow.anchor.set(0.5);
    whiteGlow.position.set(650, 250);
    whiteGlow.tint = VA.white;
    whiteGlow.blendMode = 'add';
    whiteGlow.scale.set(0.5);
    c.addChild(whiteGlow);

    // Orange explosion particle (pre-baked)
    const orangeGlow = new Sprite(glowLarge);
    orangeGlow.anchor.set(0.5);
    orangeGlow.position.set(150, 400);
    orangeGlow.tint = VA.orange;
    orangeGlow.blendMode = 'add';
    orangeGlow.scale.set(1.0);
    c.addChild(orangeGlow);

    // Comparison labels
    const labelGfx = new Graphics();
    // "GlowFilter" label area
    labelGfx.rect(100, 150, 200, 2);
    labelGfx.fill({ color: VA.cyan, alpha: 0.3 });
    // "Pre-baked" label area
    labelGfx.rect(600, 150, 100, 2);
    labelGfx.fill({ color: VA.white, alpha: 0.3 });
    c.addChild(labelGfx);

    // Additional: red warning glow
    const redGlow = new Graphics();
    redGlow.circle(300, 400, 15);
    redGlow.fill({ color: VA.red });
    redGlow.filters = [new GlowFilter({ distance: 25, outerStrength: 4, color: VA.red, quality: 0.3 })];
    c.addChild(redGlow);

    // Void purple glow
    const voidGlow = new Graphics();
    voidGlow.circle(450, 400, 18);
    voidGlow.fill({ color: VA.magenta });
    voidGlow.filters = [new GlowFilter({ distance: 30, outerStrength: 3, color: VA.voidPurple, quality: 0.3 })];
    c.addChild(voidGlow);

    // Pre-baked cyan particle
    const cyanParticle = new Sprite(glowMed);
    cyanParticle.anchor.set(0.5);
    cyanParticle.position.set(600, 400);
    cyanParticle.tint = VA.cyan;
    cyanParticle.blendMode = 'add';
    c.addChild(cyanParticle);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 2: TERRAIN PROFILE
  // ═══════════════════════════════════════════════════════════════════════

  {
    const c = testContainers[1];

    // Grid background
    const grid = new Graphics();
    const gridSpacing = 40;
    for (let x = 0; x <= W; x += gridSpacing) {
      grid.moveTo(x, 0);
      grid.lineTo(x, H);
    }
    for (let y = 0; y <= H; y += gridSpacing) {
      grid.moveTo(0, y);
      grid.lineTo(W, y);
    }
    grid.stroke({ width: 1, color: VA.grid, alpha: 0.5 });
    c.addChild(grid);

    // Terrain fill
    const terrainFill = new Graphics();
    terrainFill.moveTo(0, H);
    for (let x = 0; x < W; x++) {
      terrainFill.lineTo(x, terrainHeights[x]);
    }
    terrainFill.lineTo(W, H);
    terrainFill.closePath();
    terrainFill.fill({ color: VA.terrain });
    c.addChild(terrainFill);

    // Glowing terrain edge
    const terrainEdge = new Graphics();
    terrainEdge.moveTo(0, terrainHeights[0]);
    for (let x = 1; x < W; x++) {
      terrainEdge.lineTo(x, terrainHeights[x]);
    }
    terrainEdge.stroke({ width: 2, color: VA.cyan });
    terrainEdge.filters = [new GlowFilter({
      distance: 15, outerStrength: 3, color: VA.cyan, quality: 0.25,
    })];
    c.addChild(terrainEdge);

    // Circuit overlay
    const circuitContainer = new Container();
    const circuitNodes: { x: number; y: number }[] = [];
    const circuitEdges: [number, number][] = [];

    // Generate random nodes on the terrain surface
    for (let i = 0; i < 12; i++) {
      const nx = 50 + Math.random() * (W - 100);
      const ny = terrainHeights[Math.floor(nx)] + 5 + Math.random() * 40;
      circuitNodes.push({ x: nx, y: ny });
    }

    // Connect nearby nodes
    for (let i = 0; i < circuitNodes.length; i++) {
      for (let j = i + 1; j < circuitNodes.length; j++) {
        const dx = circuitNodes[i].x - circuitNodes[j].x;
        const dy = circuitNodes[i].y - circuitNodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < 150) {
          circuitEdges.push([i, j]);
        }
      }
    }

    // Draw circuit traces
    const traces = new Graphics();
    for (const [a, b] of circuitEdges) {
      traces.moveTo(circuitNodes[a].x, circuitNodes[a].y);
      traces.lineTo(circuitNodes[b].x, circuitNodes[b].y);
    }
    traces.stroke({ width: 1, color: VA.cyan, alpha: 0.3 });
    traces.filters = [new GlowFilter({ distance: 6, outerStrength: 1.5, color: VA.cyan, quality: 0.2 })];
    circuitContainer.addChild(traces);

    // Draw circuit nodes
    const nodes = new Graphics();
    for (const node of circuitNodes) {
      nodes.circle(node.x, node.y, 3);
      nodes.fill({ color: VA.cyan, alpha: 0.6 });
    }
    nodes.filters = [new GlowFilter({ distance: 8, outerStrength: 2, color: VA.cyan, quality: 0.2 })];
    circuitContainer.addChild(nodes);

    // Pulse dot animation state
    let pulseEdgeIndex = 0;
    let pulseT = 0;
    const pulseDot = new Sprite(glowSmall);
    pulseDot.anchor.set(0.5);
    pulseDot.tint = VA.white;
    pulseDot.blendMode = 'add';
    pulseDot.scale.set(1.5);
    circuitContainer.addChild(pulseDot);

    c.addChild(circuitContainer);

    // Store update function
    (c as any)._update = (dt: number) => {
      if (circuitEdges.length === 0) return;
      pulseT += dt * 1.5;
      if (pulseT >= 1) {
        pulseT -= 1;
        pulseEdgeIndex = (pulseEdgeIndex + 1) % circuitEdges.length;
      }
      const [a, b] = circuitEdges[pulseEdgeIndex];
      const na = circuitNodes[a], nb = circuitNodes[b];
      pulseDot.position.set(
        na.x + (nb.x - na.x) * pulseT,
        na.y + (nb.y - na.y) * pulseT,
      );
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 3: PARTICLE EXPLOSION (click to spawn)
  // ═══════════════════════════════════════════════════════════════════════

  {
    const c = testContainers[2];

    // Instructional text drawn as graphics
    const hint = new Graphics();
    hint.rect(250, 280, 300, 40);
    hint.fill({ color: VA.cyan, alpha: 0.02 });
    // Draw a simple crosshair in the center
    hint.moveTo(395, 290);
    hint.lineTo(395, 310);
    hint.moveTo(385, 300);
    hint.lineTo(405, 300);
    hint.stroke({ width: 1, color: VA.cyan, alpha: 0.3 });
    c.addChild(hint);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 4: VOID EDGE
  // ═══════════════════════════════════════════════════════════════════════

  let voidY = H + 20;

  {
    const c = testContainers[3];

    // The void container that moves upward
    const voidContainer = new Container();
    c.addChild(voidContainer);

    // Void gradient fill
    const voidGrad = new Graphics();
    // Layer 1: deep void
    voidGrad.rect(0, 0, W, 200);
    voidGrad.fill({ color: VA.voidDeep, alpha: 1 });
    // Layer 2: purple zone
    voidGrad.rect(0, -40, W, 40);
    voidGrad.fill({ color: VA.voidPurple, alpha: 0.7 });
    // Layer 3: fade zone
    voidGrad.rect(0, -70, W, 30);
    voidGrad.fill({ color: VA.voidPurple, alpha: 0.3 });
    voidContainer.addChild(voidGrad);

    // Glowing magenta edge line
    const edgeLine = new Graphics();
    edgeLine.moveTo(0, 0);
    edgeLine.lineTo(W, 0);
    edgeLine.stroke({ width: 2, color: VA.magenta });
    edgeLine.filters = [new GlowFilter({
      distance: 30, outerStrength: 4, color: VA.magenta, quality: 0.3,
    })];
    voidContainer.addChild(edgeLine);

    // Glitch bars
    const glitchBars: Graphics[] = [];
    for (let i = 0; i < 5; i++) {
      const bar = new Graphics();
      voidContainer.addChild(bar);
      glitchBars.push(bar);
    }

    voidY = H - 50;
    let glitchTimer = 0;

    (c as any)._update = (dt: number) => {
      // Slow rise
      voidY -= 0.3 * dt * 60; // ~0.3px per frame at 60fps
      if (voidY < 100) voidY = H - 50; // Reset
      voidContainer.position.y = voidY;

      // Glitch animation
      glitchTimer += dt;
      if (glitchTimer > 0.08) {
        glitchTimer = 0;
        for (const bar of glitchBars) {
          bar.clear();
          const bx = Math.random() * W * 0.3;
          const bw = 30 + Math.random() * 100;
          const offset = Math.sin(Time.time * 3 + Math.random() * 6) * 10;
          bar.moveTo(bx + offset, -2);
          bar.lineTo(bx + bw + offset, -2);
          bar.stroke({ width: 1 + Math.random() * 2, color: VA.magenta, alpha: 0.3 + Math.random() * 0.5 });
        }
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 5: PROJECTILE WITH TRAIL
  // ═══════════════════════════════════════════════════════════════════════

  interface Projectile {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alive: boolean;
    trail: { x: number; y: number }[];
    sprite: Sprite;
    trailSprites: Sprite[];
  }

  const projectiles: Projectile[] = [];

  {
    const c = testContainers[4];

    // Draw terrain for this test
    const tFill = new Graphics();
    tFill.moveTo(0, H);
    for (let x = 0; x < W; x++) tFill.lineTo(x, terrainHeights[x]);
    tFill.lineTo(W, H);
    tFill.closePath();
    tFill.fill({ color: VA.terrain });
    c.addChild(tFill);

    const tEdge = new Graphics();
    tEdge.moveTo(0, terrainHeights[0]);
    for (let x = 1; x < W; x++) tEdge.lineTo(x, terrainHeights[x]);
    tEdge.stroke({ width: 2, color: VA.cyan });
    tEdge.filters = [new GlowFilter({ distance: 12, outerStrength: 2, color: VA.cyan, quality: 0.2 })];
    c.addChild(tEdge);

    // Grid
    const grid5 = new Graphics();
    for (let gx = 0; gx <= W; gx += 40) {
      grid5.moveTo(gx, 0); grid5.lineTo(gx, H);
    }
    for (let gy = 0; gy <= H; gy += 40) {
      grid5.moveTo(0, gy); grid5.lineTo(W, gy);
    }
    grid5.stroke({ width: 1, color: VA.grid, alpha: 0.3 });
    c.addChildAt(grid5, 0);

    // Crosshair at mouse? We'll use a simple aiming indicator
    const aimLine = new Graphics();
    c.addChild(aimLine);

    (c as any)._update = (dt: number) => {
      // Draw aim line from bottom-left to mouse
      aimLine.clear();
      if (currentTest === 4) {
        const [mx, my] = Input.mousePosition;
        aimLine.moveTo(50, H - 50);
        aimLine.lineTo(mx, my);
        aimLine.stroke({ width: 1, color: VA.cyan, alpha: 0.3 });
      }

      // Update projectiles
      for (const proj of projectiles) {
        if (!proj.alive) continue;

        proj.vy += 150 * dt; // gravity
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;

        // Store trail
        proj.trail.push({ x: proj.x, y: proj.y });
        if (proj.trail.length > 20) proj.trail.shift();

        proj.sprite.position.set(proj.x, proj.y);

        // Update trail sprites
        for (let i = 0; i < proj.trailSprites.length; i++) {
          const ts = proj.trailSprites[i];
          const trailIdx = proj.trail.length - 1 - (proj.trailSprites.length - i);
          if (trailIdx >= 0 && trailIdx < proj.trail.length) {
            ts.visible = true;
            ts.position.set(proj.trail[trailIdx].x, proj.trail[trailIdx].y);
            const t = (i + 1) / proj.trailSprites.length;
            ts.alpha = t * 0.6;
            ts.scale.set(t * 0.6);
          } else {
            ts.visible = false;
          }
        }

        // Check terrain collision
        const ix = Math.floor(proj.x);
        if (ix >= 0 && ix < W && proj.y >= terrainHeights[ix]) {
          proj.alive = false;
          proj.sprite.visible = false;
          for (const ts of proj.trailSprites) ts.visible = false;
          spawnExplosion(proj.x, terrainHeights[ix], VA.cyan);
        }

        // Out of bounds
        if (proj.x < -50 || proj.x > W + 50 || proj.y > H + 50) {
          proj.alive = false;
          proj.sprite.visible = false;
          for (const ts of proj.trailSprites) ts.visible = false;
        }
      }
    };
  }

  function fireProjectile() {
    const [mx, my] = Input.mousePosition;
    const startX = 50;
    const startY = H - 50;
    const dx = mx - startX;
    const dy = my - startY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const speed = 400;

    const sprite = new Sprite(glowMed);
    sprite.anchor.set(0.5);
    sprite.tint = VA.cyan;
    sprite.blendMode = 'add';
    sprite.scale.set(0.8);
    particleContainer.addChild(sprite);

    const trailSprites: Sprite[] = [];
    for (let i = 0; i < 15; i++) {
      const ts = new Sprite(glowSmall);
      ts.anchor.set(0.5);
      ts.tint = VA.cyan;
      ts.blendMode = 'add';
      ts.visible = false;
      particleContainer.addChild(ts);
      trailSprites.push(ts);
    }

    projectiles.push({
      x: startX, y: startY,
      vx: (dx / len) * speed, vy: (dy / len) * speed,
      alive: true, trail: [],
      sprite, trailSprites,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 6: POST-FX
  // ═══════════════════════════════════════════════════════════════════════

  let bloomEnabled = false;
  let vignetteEnabled = false;
  let chromAbEnabled = false;
  let scanlinesEnabled = false;
  let chromAbIntensity = 0;

  // Bloom setup: render to texture, blur, overlay
  const bloomRT = RenderTexture.create({ width: W, height: H });
  const bloomSprite = new Sprite(bloomRT);
  bloomSprite.filters = [new BlurFilter({ strength: 4, quality: 2 })];
  bloomSprite.blendMode = 'add';
  bloomSprite.alpha = 0.3;
  bloomSprite.visible = false;

  // Vignette sprite
  const vignetteSprite = new Sprite(vignetteTex);
  vignetteSprite.alpha = 0.5;
  vignetteSprite.visible = false;

  // Scanline sprite
  const scanlineSprite = new Sprite(scanlineTex);
  scanlineSprite.alpha = 0.08;
  scanlineSprite.visible = false;

  // RGB Split filter (chromatic aberration)
  const rgbSplit = new RGBSplitFilter({ red: { x: 0, y: 0 }, green: { x: 0, y: 0 }, blue: { x: 0, y: 0 } });

  // Post-FX overlay container (added last to stage)
  const postFxContainer = new Container();
  postFxContainer.addChild(bloomSprite);
  postFxContainer.addChild(vignetteSprite);
  postFxContainer.addChild(scanlineSprite);
  stage.addChild(postFxContainer);

  {
    const c = testContainers[5];

    // Scene content for post-fx test: some neon shapes + particles
    const demoShapes = new Graphics();
    // Cyan hexagon
    const hexR = 40;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      const x = 200 + Math.cos(a) * hexR;
      const y = 250 + Math.sin(a) * hexR;
      if (i === 0) demoShapes.moveTo(x, y);
      else demoShapes.lineTo(x, y);
    }
    demoShapes.closePath();
    demoShapes.stroke({ width: 2, color: VA.cyan });
    demoShapes.filters = [new GlowFilter({ distance: 20, outerStrength: 3, color: VA.cyan, quality: 0.3 })];
    c.addChild(demoShapes);

    // Magenta triangle
    const triShape = new Graphics();
    triShape.moveTo(500, 180);
    triShape.lineTo(560, 320);
    triShape.lineTo(440, 320);
    triShape.closePath();
    triShape.stroke({ width: 2, color: VA.magenta });
    triShape.filters = [new GlowFilter({ distance: 20, outerStrength: 3, color: VA.magenta, quality: 0.3 })];
    c.addChild(triShape);

    // Yellow line cluster
    const lines = new Graphics();
    for (let i = 0; i < 5; i++) {
      lines.moveTo(300 + i * 40, 400);
      lines.lineTo(320 + i * 40, 200 + i * 20);
    }
    lines.stroke({ width: 2, color: VA.yellow });
    lines.filters = [new GlowFilter({ distance: 15, outerStrength: 2, color: VA.yellow, quality: 0.2 })];
    c.addChild(lines);

    // Floating particles
    const floaters: Sprite[] = [];
    for (let i = 0; i < 30; i++) {
      const s = new Sprite(glowSmall);
      s.anchor.set(0.5);
      s.tint = [VA.cyan, VA.magenta, VA.yellow][i % 3];
      s.blendMode = 'add';
      s.position.set(Math.random() * W, Math.random() * H);
      s.scale.set(0.3 + Math.random() * 0.5);
      s.alpha = 0.3 + Math.random() * 0.5;
      c.addChild(s);
      floaters.push(s);
    }

    (c as any)._update = (dt: number) => {
      for (const f of floaters) {
        f.y -= 15 * dt;
        f.x += Math.sin(Time.time * 2 + f.x * 0.01) * 10 * dt;
        if (f.y < -20) { f.y = H + 20; f.x = Math.random() * W; }
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TEST 7: PERFORMANCE STRESS TEST
  // ═══════════════════════════════════════════════════════════════════════

  let stressActive = false;

  {
    const c = testContainers[6];
    // Instructions hint
    const hint7 = new Graphics();
    hint7.circle(W / 2, H / 2, 3);
    hint7.fill({ color: VA.cyan, alpha: 0.3 });
    c.addChild(hint7);
  }

  function spawnStressParticles(count: number) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 50 + Math.random() * 200;
      const textures = [glowSmall, glowMed, glowLarge, glowStreak];
      const tex = textures[Math.floor(Math.random() * textures.length)];
      const colors = [VA.cyan, VA.magenta, VA.yellow, VA.white, VA.orange];
      const color = colors[Math.floor(Math.random() * colors.length)];
      spawnParticle(
        W / 2, H / 2,
        Math.cos(a) * spd, Math.sin(a) * spd,
        1 + Math.random() * 2, color,
        0.3 + Math.random() * 0.8, tex, 0, 1,
      );
    }
    stressActive = true;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HUD (always visible)
  // ═══════════════════════════════════════════════════════════════════════

  const hudEl = document.createElement('div');
  hudEl.style.cssText =
    'position:fixed;top:10px;left:10px;color:#00ffff;font:14px monospace;z-index:999;pointer-events:none;text-shadow:0 0 10px #00ffff80';
  document.body.appendChild(hudEl);

  const controlsEl = document.createElement('div');
  controlsEl.style.cssText =
    'position:fixed;bottom:10px;left:10px;color:#00ffff80;font:12px monospace;z-index:999;pointer-events:none';
  document.body.appendChild(controlsEl);

  function updateHud() {
    let info = `${testNames[currentTest]}  |  FPS: ${Time.fps}`;
    if (activeParticles.length > 0) {
      info += `  |  Particles: ${activeParticles.length}`;
    }
    if (currentTest === 5) {
      info += `  |  B:bloom(${bloomEnabled ? 'ON' : 'OFF'}) V:vignette(${vignetteEnabled ? 'ON' : 'OFF'}) C:chrom(${chromAbEnabled ? 'ON' : 'OFF'}) S:scan(${scanlinesEnabled ? 'ON' : 'OFF'})`;
    }
    hudEl.textContent = info;

    let controls = '[1-7] Switch test';
    if (currentTest === 2 || currentTest === 5 || currentTest === 6) controls += '  |  [Click] Explode';
    if (currentTest === 4) controls += '  |  [Space] Fire  [Click] Explode';
    if (currentTest === 5) controls += '  |  [B]loom [V]ignette [C]hromatic [S]canlines';
    if (currentTest === 6) controls += '  |  [P] Spawn 800';
    controlsEl.textContent = controls;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GAME LOOP
  // ═══════════════════════════════════════════════════════════════════════

  game.onUpdate(() => {
    const dt = Time.deltaTime;

    // Test switching
    for (let i = 0; i < 7; i++) {
      if (Input.getKeyDown(`Digit${i + 1}`)) {
        switchTest(i);
      }
    }

    // Click to explode (Tests 3, 5, 6, 7)
    if (Input.getMouseButtonDown(0)) {
      if (currentTest === 2 || currentTest === 4 || currentTest === 5 || currentTest === 6) {
        const [mx, my] = Input.mousePosition;
        const colors = [VA.cyan, VA.magenta, VA.yellow, VA.orange];
        spawnExplosion(mx, my, colors[Math.floor(Math.random() * colors.length)]);
        if (chromAbEnabled) chromAbIntensity = 3;
      }
    }

    // Space to fire (Test 5)
    if (Input.getKeyDown('Space') && currentTest === 4) {
      fireProjectile();
    }

    // P to spawn stress particles (Test 7)
    if (Input.getKeyDown('KeyP') && currentTest === 6) {
      spawnStressParticles(800);
    }

    // Post-FX toggles (Test 6)
    if (currentTest === 5) {
      if (Input.getKeyDown('KeyB')) bloomEnabled = !bloomEnabled;
      if (Input.getKeyDown('KeyV')) vignetteEnabled = !vignetteEnabled;
      if (Input.getKeyDown('KeyC')) chromAbEnabled = !chromAbEnabled;
      if (Input.getKeyDown('KeyS')) scanlinesEnabled = !scanlinesEnabled;
    }

    // Update particles
    updateParticles(dt);
    updateShockwaves(dt);
    updateLightBursts(dt);
    updateFlash(dt);
    updateScreenShake();

    // Per-test updates
    const activeContainer = testContainers[currentTest];
    if ((activeContainer as any)._update) {
      (activeContainer as any)._update(dt);
    }

    // Chromatic aberration decay
    if (chromAbIntensity > 0.1) {
      chromAbIntensity *= 0.92;
      rgbSplit.red = { x: -chromAbIntensity, y: 0 };
      rgbSplit.blue = { x: chromAbIntensity, y: 0 };
    } else {
      chromAbIntensity = 0;
      rgbSplit.red = { x: 0, y: 0 };
      rgbSplit.blue = { x: 0, y: 0 };
    }

    // Apply post-FX (only visible in Test 6, but toggles persist)
    bloomSprite.visible = bloomEnabled && currentTest === 5;
    vignetteSprite.visible = vignetteEnabled && currentTest === 5;
    scanlineSprite.visible = scanlinesEnabled && currentTest === 5;

    if (chromAbEnabled && currentTest === 5 && chromAbIntensity > 0.1) {
      stage.filters = [rgbSplit];
    } else {
      stage.filters = [];
    }

    // Update bloom RT
    if (bloomEnabled && currentTest === 5) {
      // Temporarily hide post-fx container to avoid recursion
      postFxContainer.visible = false;
      renderer.render({ container: stage, target: bloomRT });
      postFxContainer.visible = true;
    }

    // Stress test tracking
    if (currentTest === 6 && stressActive && activeParticles.length === 0) {
      stressActive = false;
    }

    updateHud();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // START
  // ═══════════════════════════════════════════════════════════════════════

  switchTest(0);
  game.start();
  console.log('VA Glow Test — PixiJS Visual Prototype running');
  console.log('Keys 1-7 to switch tests');
}

main().catch(console.error);
