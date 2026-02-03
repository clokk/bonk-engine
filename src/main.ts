/**
 * Bonk Engine - Demo Entry Point
 * Demonstrates loading a scene and running the game loop.
 */

// Register all behaviors
import '../behaviors';

// Register built-in components
import './engine/components';

// Import engine
import {
  loadSceneByName,
  World,
  Time,
  GlobalEvents,
  EngineEvents,
  setHotReloadScene,
  setupViteHMR,
} from './engine';

// Debug overlay element
let debugOverlay: HTMLDivElement | null = null;

function createDebugOverlay(): void {
  debugOverlay = document.createElement('div');
  debugOverlay.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: #0f0;
    font-family: monospace;
    font-size: 14px;
    padding: 10px;
    border-radius: 4px;
    z-index: 9999;
  `;
  document.body.appendChild(debugOverlay);
}

function updateDebugOverlay(): void {
  if (!debugOverlay) return;

  debugOverlay.innerHTML = `
    <div>FPS: ${Time.fps}</div>
    <div>Time: ${Time.time.toFixed(2)}s</div>
    <div>Frame: ${Time.frameCount}</div>
    <div>Scale: ${Time.timeScale}x</div>
  `;
}

async function main(): Promise<void> {
  console.log('Bonk Engine starting...');

  // Create a simple canvas for now (PixiJS would replace this)
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
      <div style="
        width: 800px;
        height: 600px;
        background: #2a1a4a;
        border: 2px solid #666;
        margin: 20px auto;
        position: relative;
        font-family: monospace;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="text-align: center;">
          <h1 style="margin: 0 0 20px 0;">Bonk Engine</h1>
          <p>Scene loading... Use Arrow Keys / WASD to move</p>
          <p id="scene-status">Loading Level1...</p>
        </div>
      </div>
    `;
  }

  // Create debug overlay
  createDebugOverlay();

  // Set up event listeners
  GlobalEvents.on(EngineEvents.SCENE_LOAD_START, (data) => {
    console.log('Scene load started:', data);
  });

  GlobalEvents.on(EngineEvents.SCENE_LOAD_END, (data: { name: string }) => {
    console.log('Scene loaded:', data);
    const status = document.getElementById('scene-status');
    if (status) {
      status.textContent = `Scene "${data.name}" loaded!`;
    }
  });

  // Set up hot reload
  setupViteHMR();

  try {
    // Load the demo scene
    const scene = await loadSceneByName('Level1');
    console.log('Scene loaded:', scene.name);
    console.log('GameObjects:', scene.getGameObjects().map((go) => go.name));

    // Set up hot reload for this scene
    setHotReloadScene(scene);

    // Custom update loop for now (WorldManager would handle this)
    let lastTime = performance.now();

    const gameLoop = (): void => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      Time.update(dt);

      // Update scene
      scene.fixedUpdate();
      scene.update();
      scene.lateUpdate();
      scene.processPendingDestroy();

      // Update debug overlay
      updateDebugOverlay();

      requestAnimationFrame(gameLoop);
    };

    // Start the loop
    scene.awake();
    scene.start();
    gameLoop();

    console.log('Game loop started');
  } catch (error) {
    console.error('Failed to start game:', error);
    const status = document.getElementById('scene-status');
    if (status) {
      status.textContent = `Error: ${error}`;
      status.style.color = '#f66';
    }
  }
}

// Start the engine
main().catch(console.error);
