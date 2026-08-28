import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface NewGameDialogProps {
  onConfirm: () => void;
  disabled?: boolean;
}

export function NewGameDialog({ onConfirm, disabled = false }: NewGameDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          className="w-full rounded-xl py-6 text-lg font-semibold"
          disabled={disabled}
        >
          New Game
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Start a new game?</AlertDialogTitle>
          <AlertDialogDescription>
            This will reset the score, inning, counts, and timer. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Reset Game
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
