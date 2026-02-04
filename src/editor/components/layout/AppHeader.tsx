import React, { useState, useEffect, useCallback } from 'react';
import { Save, FolderOpen, Settings, PanelLeft, PanelRight, PanelBottom, Check, ChevronDown } from 'lucide-react';
import { useEditorStore } from '@editor/store/editorStore';
import { cn } from '@editor/lib/utils';
import { isTauri } from '@editor/lib/filesystem';

export const AppHeader: React.FC = () => {
  const isDirty = useEditorStore((state) => state.isDirty);
  const isSaving = useEditorStore((state) => state.isSaving);
  const currentSceneName = useEditorStore((state) => state.currentSceneName);
  const saveScene = useEditorStore((state) => state.saveScene);
  const loadScene = useEditorStore((state) => state.loadScene);

  const showHierarchy = useEditorStore((state) => state.showHierarchy);
  const setShowHierarchy = useEditorStore((state) => state.setShowHierarchy);
  const showInspector = useEditorStore((state) => state.showInspector);
  const setShowInspector = useEditorStore((state) => state.setShowInspector);
  const showBottomPanel = useEditorStore((state) => state.showBottomPanel);
  const setShowBottomPanel = useEditorStore((state) => state.setShowBottomPanel);

  const [justSaved, setJustSaved] = useState(false);
  const [showSceneDropdown, setShowSceneDropdown] = useState(false);
  const [availableScenes, setAvailableScenes] = useState<string[]>([]);

  // Load available scenes from filesystem
  useEffect(() => {
    const loadAvailableScenes = async () => {
      if (!isTauri()) {
        setAvailableScenes(['Level1']);
        return;
      }

      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const { readDir } = await import('@tauri-apps/plugin-fs');

        const cwd = await invoke<string>('get_cwd');
        const projectRoot = cwd.replace(/\/src-tauri\/?$/, '');
        const scenesPath = `${projectRoot}/public/scenes`;

        const entries = await readDir(scenesPath);
        const sceneNames = entries
          .filter((e) => e.name.endsWith('.json') && !e.isDirectory)
          .map((e) => e.name.replace('.json', ''))
          .sort();

        setAvailableScenes(sceneNames);
      } catch (err) {
        console.warn('Failed to load available scenes:', err);
        setAvailableScenes(['Level1']);
      }
    };

    loadAvailableScenes();
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (isSaving || !isDirty) return;
    try {
      await saveScene();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    } catch (err) {
      console.error('Failed to save scene:', err);
    }
  }, [saveScene, isSaving, isDirty]);

  // Handle scene selection
  const handleSceneSelect = useCallback((sceneName: string) => {
    if (sceneName === currentSceneName) {
      setShowSceneDropdown(false);
      return;
    }

    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to open a different scene?'
      );
      if (!confirmed) {
        setShowSceneDropdown(false);
        return;
      }
    }

    loadScene(sceneName);
    setShowSceneDropdown(false);
  }, [currentSceneName, isDirty, loadScene]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showSceneDropdown) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-scene-dropdown]')) {
          setShowSceneDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSceneDropdown]);

  return (
    <header className="flex items-center justify-between h-10 px-3 bg-zinc-900 border-b border-zinc-800 select-none">
      {/* Left: Logo, File Operations, Scene Name */}
      <div className="flex items-center gap-2">
        <span className="text-sky-400 font-bold text-sm tracking-wider">BONK</span>

        <div className="h-4 w-px bg-zinc-700 ml-1" />

        {/* Scene Selector */}
        <div className="relative" data-scene-dropdown>
          <button
            onClick={() => setShowSceneDropdown(!showSceneDropdown)}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
            title="Open Scene"
          >
            <FolderOpen size={14} />
            <span className="font-mono max-w-[140px] truncate">
              {currentSceneName}
            </span>
            {isDirty && <span className="text-yellow-400">*</span>}
            <ChevronDown size={12} className="text-zinc-500" />
          </button>

          {/* Dropdown Menu */}
          {showSceneDropdown && (
            <div className="absolute top-full left-0 mt-1 min-w-[180px] bg-zinc-900 border border-zinc-700 rounded-md shadow-xl overflow-hidden z-50">
              <div className="py-1">
                {availableScenes.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500">
                    No scenes found
                  </div>
                ) : (
                  availableScenes.map((sceneName) => (
                    <button
                      key={sceneName}
                      onClick={() => handleSceneSelect(sceneName)}
                      className={cn(
                        'w-full px-3 py-1.5 text-left text-xs transition-colors',
                        sceneName === currentSceneName
                          ? 'bg-sky-500/20 text-sky-400'
                          : 'text-zinc-300 hover:bg-zinc-800'
                      )}
                    >
                      {sceneName}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className={cn(
            'p-1.5 rounded transition-colors',
            justSaved
              ? 'text-green-400 bg-green-500/20'
              : isDirty
                ? 'text-sky-400 hover:bg-sky-400/20 animate-pulse'
                : 'text-zinc-600 cursor-not-allowed'
          )}
          title={isDirty ? 'Save Scene (Cmd+S)' : 'No changes to save'}
        >
          {justSaved ? <Check size={16} /> : <Save size={16} />}
        </button>
      </div>

      {/* Center: Empty */}
      <div />

      {/* Right: Panel Toggles & Settings */}
      <div className="flex items-center gap-2">
        {/* Panel toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHierarchy(!showHierarchy)}
            className={cn(
              'p-1.5 rounded transition-colors',
              showHierarchy ? 'text-sky-400 bg-sky-400/10' : 'text-zinc-500 hover:text-zinc-300'
            )}
            title="Toggle Hierarchy"
          >
            <PanelLeft size={16} />
          </button>
          <button
            onClick={() => setShowBottomPanel(!showBottomPanel)}
            className={cn(
              'p-1.5 rounded transition-colors',
              showBottomPanel ? 'text-sky-400 bg-sky-400/10' : 'text-zinc-500 hover:text-zinc-300'
            )}
            title="Toggle Bottom Panel"
          >
            <PanelBottom size={16} />
          </button>
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={cn(
              'p-1.5 rounded transition-colors',
              showInspector ? 'text-sky-400 bg-sky-400/10' : 'text-zinc-500 hover:text-zinc-300'
            )}
            title="Toggle Inspector"
          >
            <PanelRight size={16} />
          </button>
        </div>

        <div className="h-4 w-px bg-zinc-700" />

        {/* Settings */}
        <button
          className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Settings (coming soon)"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
};
