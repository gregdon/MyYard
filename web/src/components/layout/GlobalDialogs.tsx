import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useNotificationStore } from '@/store/notificationStore'

export function GlobalDialogs() {
  const dialog = useNotificationStore((s) => s.dialog)
  const closeDialog = useNotificationStore((s) => s.closeDialog)

  return (
    <AlertDialog
      open={dialog.open}
      onOpenChange={(open) => {
        if (!open) closeDialog('close')
      }}
    >
      <AlertDialogContent className="sm:max-w-[420px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
          <AlertDialogDescription>{dialog.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {dialog.buttons.map((btn) => {
            // Use AlertDialogCancel for cancel/close buttons, AlertDialogAction for others
            const isCancel = btn.id === 'cancel' || btn.id === 'close'
            if (isCancel) {
              return (
                <AlertDialogCancel
                  key={btn.id}
                  variant={btn.variant ?? 'outline'}
                  onClick={() => closeDialog(btn.id)}
                >
                  {btn.label}
                </AlertDialogCancel>
              )
            }
            return (
              <AlertDialogAction
                key={btn.id}
                variant={btn.variant ?? 'default'}
                onClick={() => closeDialog(btn.id)}
              >
                {btn.label}
              </AlertDialogAction>
            )
          })}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
