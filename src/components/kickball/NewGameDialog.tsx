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
import { cn } from "@/lib/utils";

interface NewGameDialogProps {
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
}

export function NewGameDialog({ onConfirm, disabled = false, className }: NewGameDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-center rounded-2xl bg-destructive py-4 text-base font-extrabold uppercase tracking-wider text-destructive-foreground shadow-lg transition-colors active:bg-destructive/90 disabled:opacity-40",
            className,
          )}
          disabled={disabled}
        >
          New Game
        </button>
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
