/**
 * PixiRenderer - PixiJS v8 implementation of the Renderer interface.
 */

import { Application, Container, Graphics, Sprite, Texture, Assets } from 'pixi.js';
import type { Renderer, RendererConfig, SpriteConfig, RenderObject } from './Renderer';

/** PixiJS implementation of RenderObject */
class PixiRenderObject implements RenderObject {
  private displayObject: Sprite | Graphics;
  private container: Container;
  private config: SpriteConfig;

  constructor(displayObject: Sprite | Graphics, container: Container, config: SpriteConfig) {
    this.displayObject = displayObject;
    this.container = container;
    this.config = config;
    container.addChild(displayObject);
  }

  /** Replace the display object (used when texture loads) */
  replaceDisplayObject(newObject: Sprite | Graphics): void {
    // Copy properties from old to new
    newObject.position.copyFrom(this.displayObject.position);
    newObject.rotation = this.displayObject.rotation;
    newObject.scale.copyFrom(this.displayObject.scale);
    newObject.alpha = this.displayObject.alpha;
    newObject.visible = this.displayObject.visible;
    newObject.zIndex = this.displayObject.zIndex;

    // Swap in container
    const index = this.container.getChildIndex(this.displayObject);
    this.container.removeChildAt(index);
    this.displayObject.destroy();
    this.container.addChildAt(newObject, index);
    this.displayObject = newObject;
  }

  setPosition(x: number, y: number): void {
    this.displayObject.position.set(x, y);
  }

  setRotation(degrees: number): void {
    this.displayObject.rotation = (degrees * Math.PI) / 180;
  }

  setScale(x: number, y: number): void {
    this.displayObject.scale.set(x, y);
  }

  setAlpha(alpha: number): void {
    this.displayObject.alpha = alpha;
  }

  setVisible(visible: boolean): void {
    this.displayObject.visible = visible;
  }

  get zIndex(): number {
    return this.displayObject.zIndex;
  }

  set zIndex(value: number) {
    this.displayObject.zIndex = value;
  }

  destroy(): void {
    this.container.removeChild(this.displayObject);
    this.displayObject.destroy();
  }
}

/** PixiJS v8 Renderer implementation */
export class PixiRenderer implements Renderer {
  private app: Application | null = null;
  private worldContainer: Container | null = null;
  private textureCache = new Map<string, Texture>();
  private viewportWidth: number = 800;
  private viewportHeight: number = 600;
  private cameraX: number = 0;
  private cameraY: number = 0;
  private cameraZoom: number = 1;

  async init(config: RendererConfig): Promise<HTMLCanvasElement> {
    this.app = new Application();
    this.viewportWidth = config.width;
    this.viewportHeight = config.height;

    await this.app.init({
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor ?? 0x1a1a2e,
      antialias: config.antialias ?? true,
      resolution: config.resolution ?? window.devicePixelRatio,
      autoDensity: true,
    });

    // Create world container with sortable children for z-index
    this.worldContainer = new Container();
    this.worldContainer.sortableChildren = true;
    this.app.stage.addChild(this.worldContainer);

    return this.app.canvas as HTMLCanvasElement;
  }

  createSprite(config: SpriteConfig): RenderObject {
    if (!this.worldContainer) {
      throw new Error('Renderer not initialized. Call init() first.');
    }

    const width = config.width ?? 32;
    const height = config.height ?? 32;
    const color = config.color ?? 0xff00ff; // Magenta default

    // Always start with a colored rectangle placeholder
    const graphics = new Graphics();
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill(color);

    // Set initial properties
    if (config.alpha !== undefined) {
      graphics.alpha = config.alpha;
    }
    if (config.zIndex !== undefined) {
      graphics.zIndex = config.zIndex;
    }

    const renderObject = new PixiRenderObject(graphics, this.worldContainer, config);

    // If there's a src, try to load the texture and swap to a Sprite on success
    if (config.src) {
      this.loadTexture(config.src).then((texture) => {
        if (texture && texture !== Texture.WHITE) {
          const sprite = new Sprite(texture);
          sprite.anchor.set(config.anchor?.[0] ?? 0.5, config.anchor?.[1] ?? 0.5);

          // Use explicit dimensions if provided, otherwise use texture size
          if (config.width || config.height) {
            sprite.width = width;
            sprite.height = height;
          }

          renderObject.replaceDisplayObject(sprite);
        }
      });
    }

    return renderObject;
  }

  removeObject(object: RenderObject): void {
    object.destroy();
  }

  render(): void {
    // PixiJS v8 uses its own render loop via requestAnimationFrame
    // If we need manual control, we can call app.render()
    // For now, PixiJS handles this automatically
  }

  resize(width: number, height: number): void {
    if (this.app) {
      this.app.renderer.resize(width, height);
      this.viewportWidth = width;
      this.viewportHeight = height;
      // Re-apply camera position after resize
      this.updateWorldContainer();
    }
  }

  getCanvas(): HTMLCanvasElement | null {
    return this.app?.canvas as HTMLCanvasElement | null;
  }

  destroy(): void {
    if (this.worldContainer) {
      this.worldContainer.destroy({ children: true });
      this.worldContainer = null;
    }
    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }
    this.textureCache.clear();
  }

  setCameraPosition(x: number, y: number): void {
    this.cameraX = x;
    this.cameraY = y;
    this.updateWorldContainer();
  }

  setCameraZoom(zoom: number): void {
    this.cameraZoom = zoom;
    this.updateWorldContainer();
  }

  getViewportSize(): { width: number; height: number } {
    return { width: this.viewportWidth, height: this.viewportHeight };
  }

  /** Update world container transform based on camera position and zoom */
  private updateWorldContainer(): void {
    if (!this.worldContainer) return;

    // Apply zoom
    this.worldContainer.scale.set(this.cameraZoom, this.cameraZoom);

    // Offset world container so camera position is at viewport center
    // The camera looks at (cameraX, cameraY), so we move the world in the opposite direction
    this.worldContainer.position.set(
      this.viewportWidth / 2 - this.cameraX * this.cameraZoom,
      this.viewportHeight / 2 - this.cameraY * this.cameraZoom
    );
  }

  /** Load a texture with caching */
  private async loadTexture(src: string): Promise<Texture | null> {
    if (this.textureCache.has(src)) {
      return this.textureCache.get(src)!;
    }

    try {
      const texture = await Assets.load(src);
      this.textureCache.set(src, texture);
      return texture;
    } catch {
      // Texture not found - this is normal during development when using placeholders
      // Use colored rectangles instead (already handled by createSprite)
      return null;
    }
  }
}
