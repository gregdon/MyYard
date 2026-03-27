import { create } from 'zustand'

// ─── Types ───────────────────────────────────────────────────────

export interface DialogButton {
  id: string
  label: string
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
}

interface DialogState {
  open: boolean
  title: string
  message: string
  buttons: DialogButton[]
  resolve: ((buttonId: string) => void) | null
}

interface NotificationStore {
  // Dialog state
  dialog: DialogState

  // Dialog methods — all return a promise that resolves when the user clicks a button
  showInfoDialog: (title: string, message: string) => Promise<void>
  showConfirmationDialog: (title: string, message: string) => Promise<boolean>
  showDialog: (title: string, message: string, buttons: DialogButton[]) => Promise<string>

  // Called by GlobalDialogs when user clicks a button or ✕
  closeDialog: (buttonId: string) => void
}

// ─── Initial state ───────────────────────────────────────────────

const initialDialog: DialogState = {
  open: false,
  title: '',
  message: '',
  buttons: [],
  resolve: null,
}

// ─── Store ───────────────────────────────────────────────────────

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  dialog: { ...initialDialog },

  showInfoDialog: (title, message) => {
    return new Promise<void>((resolve) => {
      set({
        dialog: {
          open: true,
          title,
          message,
          buttons: [{ id: 'close', label: 'Close', variant: 'default' }],
          resolve: () => resolve(),
        },
      })
    })
  },

  showConfirmationDialog: (title, message) => {
    return new Promise<boolean>((resolve) => {
      set({
        dialog: {
          open: true,
          title,
          message,
          buttons: [
            { id: 'cancel', label: 'Cancel', variant: 'outline' },
            { id: 'ok', label: 'OK', variant: 'default' },
          ],
          resolve: (buttonId) => resolve(buttonId === 'ok'),
        },
      })
    })
  },

  showDialog: (title, message, buttons) => {
    return new Promise<string>((resolve) => {
      set({
        dialog: {
          open: true,
          title,
          message,
          buttons,
          resolve: (buttonId) => resolve(buttonId),
        },
      })
    })
  },

  closeDialog: (buttonId) => {
    const { dialog } = get()
    if (dialog.resolve) {
      dialog.resolve(buttonId)
    }
    set({ dialog: { ...initialDialog } })
  },
}))
