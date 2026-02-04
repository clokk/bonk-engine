/**
 * Scene serialization utilities for saving scenes to JSON.
 */

import type { Scene } from '@engine/Scene';
import { isTauri } from './filesystem';

/**
 * Get the project root directory path.
 */
async function getProjectRoot(): Promise<string> {
  const { invoke } = await import('@tauri-apps/api/core');
  const cwd = await invoke<string>('get_cwd');
  // Go up from src-tauri/ to project root
  return cwd.replace(/\/src-tauri\/?$/, '');
}

/**
 * Save a scene to a JSON file.
 * Saves to public/scenes/{sceneName}.json
 *
 * @param scene - The scene to save
 * @param sceneName - The name of the scene (used as filename)
 */
export async function saveSceneToJson(
  scene: Scene,
  sceneName: string
): Promise<void> {
  if (!isTauri()) {
    throw new Error('Scene saving requires Tauri desktop mode');
  }

  const { writeTextFile } = await import('@tauri-apps/plugin-fs');
  const projectRoot = await getProjectRoot();

  const json = scene.toJSON();
  const content = JSON.stringify(json, null, 2);
  const path = `${projectRoot}/public/scenes/${sceneName}.json`;

  await writeTextFile(path, content);
  console.log(`[sceneSerializer] Saved scene to ${path}`);
}
