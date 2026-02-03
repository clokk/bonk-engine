/**
 * Generates a simple test sprite sheet for AnimatedSprite testing.
 *
 * Creates a 4x2 grid (8 frames, 32x32 each = 128x64 total):
 * - Row 0 (frames 0-3): "idle" - pulsing circle
 * - Row 1 (frames 4-7): "alert" - spinning indicator
 *
 * Run: node scripts/generate-test-spritesheet.js
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const FRAME_WIDTH = 32;
const FRAME_HEIGHT = 32;
const COLUMNS = 4;
const ROWS = 2;

const canvas = createCanvas(FRAME_WIDTH * COLUMNS, FRAME_HEIGHT * ROWS);
const ctx = canvas.getContext('2d');

// Fill with transparent background
ctx.clearRect(0, 0, canvas.width, canvas.height);

// Draw each frame
for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLUMNS; col++) {
    const frameIndex = row * COLUMNS + col;
    const x = col * FRAME_WIDTH;
    const y = row * FRAME_HEIGHT;
    const centerX = x + FRAME_WIDTH / 2;
    const centerY = y + FRAME_HEIGHT / 2;

    // Draw frame background (subtle, for debugging)
    ctx.fillStyle = `rgba(50, 50, 50, 0.3)`;
    ctx.fillRect(x + 1, y + 1, FRAME_WIDTH - 2, FRAME_HEIGHT - 2);

    if (row === 0) {
      // Row 0: "idle" animation - pulsing circle
      const pulsePhase = col / COLUMNS;
      const radius = 8 + Math.sin(pulsePhase * Math.PI * 2) * 4;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${120 + col * 10}, 70%, 50%)`; // Green shades
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Row 1: "alert" animation - spinning indicator
      const angle = (col / COLUMNS) * Math.PI * 2;

      // Draw base circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4444';
      ctx.fill();

      // Draw spinning indicator line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * 12,
        centerY + Math.sin(angle) * 12
      );
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw center dot
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    // Draw frame number (small, in corner)
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText(frameIndex.toString(), x + 2, y + 10);
  }
}

// Ensure output directory exists
const outputDir = path.join(__dirname, '..', 'public', 'sprites');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Save the sprite sheet
const outputPath = path.join(outputDir, 'animated-enemy.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);

console.log(`Generated sprite sheet: ${outputPath}`);
console.log(`  Size: ${canvas.width}x${canvas.height} pixels`);
console.log(`  Frames: ${COLUMNS * ROWS} (${COLUMNS}x${ROWS} grid)`);
console.log(`  Frame size: ${FRAME_WIDTH}x${FRAME_HEIGHT} pixels`);
