import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Red confirm step for removing people, disabling accounts and deactivating warehouses.
const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmText = "Confirm" }) => (
  <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
    <AlertDialogContent className="max-w-md rounded-2xl">
      <AlertDialogTitle className="font-display text-lg font-bold">{title}</AlertDialogTitle>
      <AlertDialogDescription>{message}</AlertDialogDescription>
      <AlertDialogFooter>
        <AlertDialogCancel className="h-11 rounded-xl font-semibold">Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="h-11 rounded-xl bg-destructive font-bold text-destructive-foreground hover:bg-destructive/90">
          {confirmText}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ConfirmDialog;
