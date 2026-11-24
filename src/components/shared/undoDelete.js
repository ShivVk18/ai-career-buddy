import { toast } from "sonner";
import { generationErrorMessage } from "@/components/shared/generationError";

/**
 * Delete now, offer a 5 s Undo (D60). No confirm dialog.
 * - hide(): optimistic removal from the list; show(): put it back (rollback or Undo).
 * - remove(): the soft-delete server action; restore(): its restore* counterpart.
 * - done(phase): refresh the list after either one succeeds; phase is "deleted" or "restored".
 */
export async function deleteWithUndo({ name, hide, show, remove, restore, done }) {
  hide();
  let res;
  try {
    res = await remove();
  } catch {
    res = { error: "We couldn't reach the server.", code: "FAILED" };
  }
  if (!res || res.error) {
    show(); // rollback
    toast.error(generationErrorMessage(res, `Couldn't delete ${name}. Nothing changed.`));
    return;
  }
  done?.("deleted");
  toast.success(`${name} deleted`, {
    duration: 5000,
    action: {
      label: "Undo",
      onClick: async () => {
        let back;
        try {
          back = await restore();
        } catch {
          back = { error: "We couldn't reach the server.", code: "FAILED" };
        }
        if (!back || back.error) {
          toast.error(generationErrorMessage(back, `Couldn't restore ${name}.`));
          return;
        }
        show();
        done?.("restored");
        toast.success(`${name} restored`);
      },
    },
  });
}
