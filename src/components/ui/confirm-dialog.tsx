"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** Confirmation modal for destructive actions. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  destructive = true,
  onConfirm,
  onClose,
  loading = false,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} className="max-w-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant={destructive ? "destructive" : "primary"}
          onClick={onConfirm}
          disabled={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
