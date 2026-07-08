import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * ConfirmDialog — accessible confirmation dialog to replace window.confirm
 * (which is blocked inside sandboxed preview iframes).
 *
 * Usage:
 *   <ConfirmDialog
 *     trigger={<Button>Delete</Button>}
 *     title="Delete this invitation?"
 *     description="This cannot be undone."
 *     confirmLabel="Delete"
 *     destructive
 *     onConfirm={handleDelete}
 *     confirmTestId="confirm-delete-invite"
 *   />
 */
export default function ConfirmDialog({
  trigger,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  confirmTestId,
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="confirm-cancel">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            data-testid={confirmTestId || "confirm-ok"}
            className={destructive ? "bg-red-600 text-white hover:bg-red-700" : ""}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
