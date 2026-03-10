import { create } from 'zustand'
import { useDesignStore } from './designStore'
import type { DesignSnapshot } from './designStore'
import { MAX_UNDO_DEPTH } from '@/constants/defaults'

interface HistoryState {
  undoStack: DesignSnapshot[]
  redoStack: DesignSnapshot[]

  pushSnapshot: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  clear: () => void
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  undoStack: [],
  redoStack: [],

  pushSnapshot: () => {
    const snapshot = useDesignStore.getState().getSnapshot()
    set((state) => ({
      undoStack: [...state.undoStack.slice(-(MAX_UNDO_DEPTH - 1)), snapshot],
      redoStack: [],
    }))
  },

  undo: () => {
    const state = get()
    if (state.undoStack.length === 0) return

    const currentSnapshot = useDesignStore.getState().getSnapshot()
    const previousSnapshot = state.undoStack[state.undoStack.length - 1]

    set({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, currentSnapshot],
    })

    useDesignStore.getState().restoreSnapshot(previousSnapshot)
  },

  redo: () => {
    const state = get()
    if (state.redoStack.length === 0) return

    const currentSnapshot = useDesignStore.getState().getSnapshot()
    const nextSnapshot = state.redoStack[state.redoStack.length - 1]

    set({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, currentSnapshot],
    })

    useDesignStore.getState().restoreSnapshot(nextSnapshot)
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,
  clear: () => set({ undoStack: [], redoStack: [] }),
}))
