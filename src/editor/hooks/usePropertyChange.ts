import { useCallback } from 'react';
import { useEditorStore } from '@editor/store/editorStore';

/**
 * Hook that returns a function to call when a property is changed in the inspector.
 * Marks the scene as dirty and refreshes the hierarchy to reflect changes.
 */
export function usePropertyChange() {
  const setIsDirty = useEditorStore((s) => s.setIsDirty);
  const refreshHierarchy = useEditorStore((s) => s.refreshHierarchy);

  return useCallback(() => {
    setIsDirty(true);
    refreshHierarchy();
  }, [setIsDirty, refreshHierarchy]);
}
