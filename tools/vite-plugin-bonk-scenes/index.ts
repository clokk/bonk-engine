/**
 * vite-plugin-bonk-scenes
 *
 * Transforms MDX scene files into JSON at build time.
 * Provides hot module replacement for scene changes during development.
 */

import type { Plugin, ViteDevServer } from 'vite';
import { compile } from '@mdx-js/mdx';
import { transformJsxToScene, transformJsxToPrefab } from './jsx-to-scene';
import fs from 'fs/promises';
import path from 'path';

interface BonkScenesOptions {
  /** Directory containing scene MDX files */
  scenesDir?: string;
  /** Directory containing prefab MDX files */
  prefabsDir?: string;
  /** Output directory for compiled JSON */
  outDir?: string;
}

interface MdxProgram {
  type: 'Program';
  body: MdxNode[];
}

interface MdxNode {
  type: string;
  id?: { name: string };
  body?: {
    type: string;
    body?: unknown[];
  };
  declaration?: {
    type: string;
    body?: {
      type: string;
      body?: unknown[];
    };
  };
}

/** Extract JSX elements from compiled MDX AST */
function extractJsxElements(program: MdxProgram): unknown[] {
  // The MDX compiler produces a _createMdxContent function that contains the JSX
  // We need to find the JSX elements inside that function body's return statement
  const elements: unknown[] = [];

  for (const node of program.body) {
    // Look for the _createMdxContent function (FunctionDeclaration)
    if (
      node.type === 'FunctionDeclaration' &&
      node.id?.name === '_createMdxContent'
    ) {
      const body = node.body;
      if (body?.type === 'BlockStatement' && body.body) {
        // Find the return statement (last statement in the body)
        for (const statement of body.body as { type: string; argument?: unknown }[]) {
          if (statement.type === 'ReturnStatement' && statement.argument) {
            // Handle JSXFragment or JSXElement
            const arg = statement.argument as { type: string; children?: unknown[] };
            if (arg.type === 'JSXFragment' && arg.children) {
              elements.push(
                ...arg.children.filter(
                  (c: unknown) => (c as { type: string }).type === 'JSXElement'
                )
              );
            } else if (arg.type === 'JSXElement') {
              elements.push(arg);
            }
          }
        }
      }
    }
  }

  return elements;
}

/** Compile MDX to scene JSON */
async function compileMdxToScene(
  source: string,
  filePath: string
): Promise<{ json: string; isPrefab: boolean }> {
  const fileName = path.basename(filePath, path.extname(filePath));
  const isPrefab = filePath.includes('.prefab.mdx') || filePath.includes('/prefabs/');

  // Compile MDX to get the AST
  // We use the recma phase to intercept the final AST
  let programAst: MdxProgram | null = null;

  await compile(source, {
    jsx: true,
    recmaPlugins: [
      () => (tree: MdxProgram) => {
        programAst = tree;
        return tree;
      },
    ],
  });

  if (!programAst) {
    throw new Error(`Failed to parse MDX: ${filePath}`);
  }

  // Extract JSX elements from the AST
  const elements = extractJsxElements(programAst);

  // Transform to scene or prefab JSON
  if (isPrefab) {
    const prefab = transformJsxToPrefab(elements as never[], fileName);
    if (!prefab) {
      throw new Error(`No valid prefab found in: ${filePath}`);
    }
    return { json: JSON.stringify(prefab, null, 2), isPrefab: true };
  } else {
    const scene = transformJsxToScene(elements as never[], fileName);
    return { json: JSON.stringify(scene, null, 2), isPrefab: false };
  }
}

/** Get output path for a scene/prefab file */
function getOutputPath(
  filePath: string,
  outDir: string,
  isPrefab: boolean
): string {
  const fileName = path.basename(filePath).replace(/\.prefab\.mdx$/, '.json').replace(/\.mdx$/, '.json');
  const subDir = isPrefab ? 'prefabs' : 'scenes';
  return path.join(outDir, subDir, fileName);
}

export function bonkScenes(options: BonkScenesOptions = {}): Plugin {
  const {
    scenesDir = 'scenes',
    prefabsDir = 'prefabs',
    outDir = 'public',
  } = options;

  let server: ViteDevServer | null = null;
  const compiledScenes = new Map<string, string>();

  return {
    name: 'vite-plugin-bonk-scenes',

    configureServer(devServer) {
      server = devServer;
    },

    async buildStart() {
      // Compile all MDX files on build start
      const scenesPath = path.resolve(scenesDir);
      const prefabsPath = path.resolve(prefabsDir);

      // Ensure output directories exist
      await fs.mkdir(path.join(outDir, 'scenes'), { recursive: true });
      await fs.mkdir(path.join(outDir, 'prefabs'), { recursive: true });

      // Compile scenes
      try {
        const sceneFiles = await fs.readdir(scenesPath);
        for (const file of sceneFiles) {
          if (file.endsWith('.mdx')) {
            const filePath = path.join(scenesPath, file);
            const source = await fs.readFile(filePath, 'utf-8');
            const { json, isPrefab } = await compileMdxToScene(source, filePath);
            const outputPath = getOutputPath(filePath, outDir, isPrefab);
            await fs.writeFile(outputPath, json);
            compiledScenes.set(filePath, json);
            console.log(`[bonk-scenes] Compiled: ${file} → ${path.relative('.', outputPath)}`);
          }
        }
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      }

      // Compile prefabs
      try {
        const prefabFiles = await fs.readdir(prefabsPath);
        for (const file of prefabFiles) {
          if (file.endsWith('.mdx')) {
            const filePath = path.join(prefabsPath, file);
            const source = await fs.readFile(filePath, 'utf-8');
            const { json, isPrefab } = await compileMdxToScene(source, filePath);
            const outputPath = getOutputPath(filePath, outDir, isPrefab);
            await fs.writeFile(outputPath, json);
            compiledScenes.set(filePath, json);
            console.log(`[bonk-scenes] Compiled: ${file} → ${path.relative('.', outputPath)}`);
          }
        }
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      }
    },

    async handleHotUpdate({ file, read }) {
      if (!file.endsWith('.mdx')) return;

      // Check if it's a scene or prefab file
      const isScene = file.includes(scenesDir);
      const isPrefabFile = file.includes(prefabsDir) || file.includes('.prefab.mdx');

      if (!isScene && !isPrefabFile) return;

      try {
        const source = await read();
        const { json, isPrefab } = await compileMdxToScene(source, file);
        const outputPath = getOutputPath(file, outDir, isPrefab);

        // Write updated JSON
        await fs.writeFile(outputPath, json);
        compiledScenes.set(file, json);

        const fileName = path.basename(file);
        console.log(`[bonk-scenes] Hot recompiled: ${fileName}`);

        // Send HMR update to client
        if (server) {
          server.ws.send({
            type: 'custom',
            event: 'bonk:scene-update',
            data: {
              path: outputPath,
              json: JSON.parse(json),
              isPrefab,
            },
          });
        }
      } catch (error) {
        console.error(`[bonk-scenes] Failed to compile ${file}:`, error);
      }

      // Don't process this file further - we handled it
      return [];
    },

    // Serve compiled JSON for virtual imports
    resolveId(id) {
      if (id.startsWith('virtual:bonk-scene:')) {
        return id;
      }
      return null;
    },

    async load(id) {
      if (id.startsWith('virtual:bonk-scene:')) {
        const sceneName = id.replace('virtual:bonk-scene:', '');
        const jsonPath = path.join(outDir, 'scenes', `${sceneName}.json`);
        try {
          const json = await fs.readFile(jsonPath, 'utf-8');
          return `export default ${json}`;
        } catch {
          throw new Error(`Scene not found: ${sceneName}`);
        }
      }
      return null;
    },
  };
}

export default bonkScenes;
