/**
 * UI System Comprehensive Test
 *
 * This test file demonstrates and verifies all key features of the UI system:
 * - All 9 anchor positions
 * - UIText with various styles
 * - UIImage loading
 * - UIPanel with borders, padding, radius
 * - UIButton with states and click handlers
 * - UIVBox and UIHBox layouts
 * - Nested elements
 * - Dynamic updates
 * - Input handling (buttons consume clicks)
 */

import type { Renderer } from '../engine/rendering';
import {
  UIManager,
  UIElement,
  UIText,
  UIImage,
  UIPanel,
  UIButton,
  UIVBox,
  UIHBox,
} from '../engine/ui';

/** Test state for dynamic updates */
interface UITestState {
  clickCount: number;
  score: number;
  health: number;
}

/**
 * Creates a comprehensive UI test setup.
 * Returns the UIManager and test controls.
 */
export function createUITest(renderer: Renderer): {
  ui: UIManager;
  state: UITestState;
  cleanup: () => void;
} {
  const ui = new UIManager(renderer);
  const state: UITestState = {
    clickCount: 0,
    score: 0,
    health: 100,
  };

  // ============================================================
  // TEST 1: Anchor Positions
  // Verify all 9 anchor points work correctly
  // ============================================================

  const anchorTestLabel = new UIText({
    text: 'Anchor Test',
    fontSize: 10,
    color: '#666666',
    anchor: 'top-center',
    offset: [0, 5],
  });
  ui.addRoot(anchorTestLabel);

  // Small markers at each anchor point
  const anchorMarkers = createAnchorMarkers();
  anchorMarkers.forEach((marker) => ui.addRoot(marker));

  // ============================================================
  // TEST 2: Health Bar (top-left) - UIPanel + UIHBox + UIImage + UIText
  // Tests: panel styling, horizontal layout, image loading, text updates
  // ============================================================

  const healthPanel = new UIPanel({
    name: 'HealthPanel',
    anchor: 'top-left',
    offset: [50, 50],
    padding: [8, 12, 8, 12],
    backgroundColor: 0x2a2a2a,
    borderColor: 0x444444,
    borderWidth: 2,
    borderRadius: 6,
  });

  const healthRow = new UIHBox({ gap: 8, align: 'center' });

  // Heart icon (will show placeholder if image doesn't exist)
  const heartIcon = new UIImage({
    src: './ui/heart.png',
    width: 20,
    height: 20,
    tint: 0xff4444,
  });
  healthRow.addChild(heartIcon);

  const healthText = new UIText({
    name: 'HealthText',
    text: '100',
    fontSize: 16,
    color: '#ff6666',
    fontWeight: 'bold',
  });
  healthRow.addChild(healthText);

  healthPanel.addChild(healthRow);
  ui.addRoot(healthPanel);

  // ============================================================
  // TEST 3: Score Display (top-right) - Standalone UIText
  // Tests: text styling, right anchor
  // ============================================================

  const scoreText = new UIText({
    name: 'ScoreText',
    text: 'Score: 0',
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    anchor: 'top-right',
    offset: [50, 50],
  });
  ui.addRoot(scoreText);

  // ============================================================
  // TEST 4: Button Panel (bottom-right) - UIVBox with UIButtons
  // Tests: vertical layout, button states, click handlers
  // ============================================================

  const buttonPanel = new UIPanel({
    name: 'ButtonPanel',
    anchor: 'bottom-right',
    offset: [20, 20],
    padding: [12, 12, 12, 12],
    backgroundColor: 0x333333,
    borderRadius: 8,
  });

  const buttonColumn = new UIVBox({ gap: 8, align: 'center' });

  // Click counter button
  const clickButton = new UIButton({
    name: 'ClickButton',
    backgroundColor: 0x4488ff,
    padding: [8, 16, 8, 16],
    borderRadius: 4,
    onClick: () => {
      state.clickCount++;
      clickCountText.text = `Clicks: ${state.clickCount}`;
      console.log(`Button clicked! Count: ${state.clickCount}`);
    },
  });
  clickButton.addChild(new UIText({ text: 'Click Me!', fontSize: 14 }));
  buttonColumn.addChild(clickButton);

  const clickCountText = new UIText({
    name: 'ClickCountText',
    text: 'Clicks: 0',
    fontSize: 12,
    color: '#aaaaaa',
  });
  buttonColumn.addChild(clickCountText);

  // Add score button
  const addScoreButton = new UIButton({
    name: 'AddScoreButton',
    backgroundColor: 0x44aa44,
    padding: [6, 12, 6, 12],
    borderRadius: 4,
    onClick: () => {
      state.score += 100;
      scoreText.text = `Score: ${state.score}`;
    },
  });
  addScoreButton.addChild(new UIText({ text: '+100 Score', fontSize: 12 }));
  buttonColumn.addChild(addScoreButton);

  // Damage button
  const damageButton = new UIButton({
    name: 'DamageButton',
    backgroundColor: 0xaa4444,
    padding: [6, 12, 6, 12],
    borderRadius: 4,
    onClick: () => {
      state.health = Math.max(0, state.health - 10);
      healthText.text = String(state.health);
      if (state.health <= 0) {
        healthText.color = '#666666';
      } else if (state.health <= 30) {
        healthText.color = '#ff0000';
      }
    },
  });
  damageButton.addChild(new UIText({ text: '-10 HP', fontSize: 12 }));
  buttonColumn.addChild(damageButton);

  // Disabled button (to test disabled state)
  const disabledButton = new UIButton({
    name: 'DisabledButton',
    backgroundColor: 0x666666,
    padding: [6, 12, 6, 12],
    borderRadius: 4,
    disabled: true,
    onClick: () => {
      console.log('This should never fire!');
    },
  });
  disabledButton.addChild(new UIText({ text: 'Disabled', fontSize: 12, color: '#888888' }));
  buttonColumn.addChild(disabledButton);

  buttonPanel.addChild(buttonColumn);
  ui.addRoot(buttonPanel);

  // ============================================================
  // TEST 5: Info Panel (bottom-left) - Nested panels, multiple text styles
  // Tests: nested panels, text alignment, word wrap
  // ============================================================

  const infoPanel = new UIPanel({
    name: 'InfoPanel',
    anchor: 'bottom-left',
    offset: [20, 20],
    padding: [10, 10, 10, 10],
    backgroundColor: 0x1a1a2e,
    borderColor: 0x4a4a6e,
    borderWidth: 1,
    borderRadius: 4,
  });

  const infoColumn = new UIVBox({ gap: 6 });

  infoColumn.addChild(
    new UIText({
      text: 'UI System Test',
      fontSize: 14,
      color: '#ffffff',
      fontWeight: 'bold',
    })
  );

  infoColumn.addChild(
    new UIText({
      text: 'WASD to move player',
      fontSize: 11,
      color: '#aaaaaa',
    })
  );

  infoColumn.addChild(
    new UIText({
      text: 'Click buttons to test',
      fontSize: 11,
      color: '#aaaaaa',
    })
  );

  infoColumn.addChild(
    new UIText({
      text: 'UI blocks game clicks',
      fontSize: 11,
      color: '#88aa88',
    })
  );

  infoPanel.addChild(infoColumn);
  ui.addRoot(infoPanel);

  // ============================================================
  // TEST 6: Center Panel - Complex nested layout
  // Tests: center anchor, deeply nested elements
  // ============================================================

  // This panel is hidden by default, shown on demand
  const centerPanel = new UIPanel({
    name: 'CenterPanel',
    anchor: 'center',
    padding: [16, 20, 16, 20],
    backgroundColor: 0x2a2a3a,
    borderColor: 0x5a5a7a,
    borderWidth: 2,
    borderRadius: 12,
    visible: false, // Hidden initially
  });

  const centerContent = new UIVBox({ gap: 12, align: 'center' });

  centerContent.addChild(
    new UIText({
      text: 'Paused',
      fontSize: 28,
      color: '#ffffff',
      fontWeight: 'bold',
    })
  );

  const resumeButton = new UIButton({
    backgroundColor: 0x44aa44,
    padding: [10, 24, 10, 24],
    borderRadius: 6,
    onClick: () => {
      centerPanel.visible = false;
    },
  });
  resumeButton.addChild(new UIText({ text: 'Resume', fontSize: 16 }));
  centerContent.addChild(resumeButton);

  centerPanel.addChild(centerContent);
  ui.addRoot(centerPanel);

  // Add toggle button for center panel
  const togglePauseButton = new UIButton({
    name: 'TogglePauseButton',
    anchor: 'top-center',
    offset: [0, 50],
    backgroundColor: 0x666688,
    padding: [6, 12, 6, 12],
    borderRadius: 4,
    onClick: () => {
      centerPanel.visible = !centerPanel.visible;
    },
  });
  togglePauseButton.addChild(new UIText({ text: 'Toggle Pause', fontSize: 12 }));
  ui.addRoot(togglePauseButton);

  // ============================================================
  // TEST 7: Horizontal layout with images (center-bottom)
  // Tests: HBox with multiple images, center-bottom anchor
  // ============================================================

  const itemBar = new UIPanel({
    name: 'ItemBar',
    anchor: 'bottom-center',
    offset: [0, 20],
    padding: [6, 10, 6, 10],
    backgroundColor: 0x333333,
    borderRadius: 4,
  });

  const itemRow = new UIHBox({ gap: 4 });

  // Create item slots
  for (let i = 0; i < 5; i++) {
    const slot = new UIPanel({
      size: [36, 36],
      backgroundColor: i === 0 ? 0x446688 : 0x222222,
      borderColor: i === 0 ? 0x88aacc : 0x444444,
      borderWidth: 2,
      borderRadius: 4,
    });

    // Add slot number
    slot.addChild(
      new UIText({
        text: String(i + 1),
        fontSize: 10,
        color: i === 0 ? '#ffffff' : '#666666',
        anchor: 'center',
      })
    );

    itemRow.addChild(slot);
  }

  itemBar.addChild(itemRow);
  ui.addRoot(itemBar);

  // ============================================================
  // TEST 8: Edge labels (center-left, center-right)
  // Tests: side anchors
  // ============================================================

  const leftLabel = new UIText({
    text: 'L',
    fontSize: 14,
    color: '#444444',
    anchor: 'center-left',
    offset: [10, 0],
  });
  ui.addRoot(leftLabel);

  const rightLabel = new UIText({
    text: 'R',
    fontSize: 14,
    color: '#444444',
    anchor: 'center-right',
    offset: [10, 0],
  });
  ui.addRoot(rightLabel);

  // ============================================================
  // Cleanup function
  // ============================================================

  const cleanup = (): void => {
    ui.destroy();
  };

  console.log('UI Test initialized with elements:');
  console.log('- Anchor markers (9 positions)');
  console.log('- Health bar (top-left)');
  console.log('- Score display (top-right)');
  console.log('- Button panel (bottom-right)');
  console.log('- Info panel (bottom-left)');
  console.log('- Toggle pause button (top-center)');
  console.log('- Pause dialog (center, hidden)');
  console.log('- Item bar (bottom-center)');
  console.log('- Edge labels (center-left, center-right)');

  return { ui, state, cleanup };
}

/**
 * Creates small marker elements at each of the 9 anchor positions.
 * Useful for visually verifying anchor placement.
 */
function createAnchorMarkers(): UIElement[] {
  const anchors = [
    'top-left',
    'top-center',
    'top-right',
    'center-left',
    'center',
    'center-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ] as const;

  return anchors.map((anchor) => {
    const marker = new UIPanel({
      name: `Marker_${anchor}`,
      anchor,
      offset: [15, 15],
      size: [8, 8],
      backgroundColor: 0x666666,
      borderRadius: 4,
      alpha: 0.5,
    });
    return marker;
  });
}

/**
 * Integration helper - call this in your game loop.
 */
export function updateUITest(ui: UIManager): boolean {
  // Process input (returns true if UI consumed the input)
  const consumed = ui.processInput();

  // Update UI elements
  ui.update();

  // Run layout pass
  ui.layout();

  return consumed;
}
