"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  postJournal,
  voidJournal,
  deleteJournal,
} from "@/lib/actions/journal-actions";

export function JournalRowActions({
  id,
  status,
  canPost,
  canVoid,
  canDelete,
}: {
  id: string;
  status: "DRAFT" | "POSTED" | "VOID";
  canPost: boolean;
  canVoid: boolean;
  canDelete: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) alert(res.error ?? "Gagal");
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-2 text-xs">
      {status === "DRAFT" && canPost ? (
        <button
          disabled={pending}
          onClick={() => run(() => postJournal(id), "Posting jurnal ini?")}
          className="font-medium text-emerald-600 hover:underline disabled:opacity-50"
        >
          Posting
        </button>
      ) : null}
      {status !== "VOID" && canVoid ? (
        <button
          disabled={pending}
          onClick={() => run(() => voidJournal(id), "Batalkan (void) jurnal ini?")}
          className="font-medium text-amber-600 hover:underline disabled:opacity-50"
        >
          Void
        </button>
      ) : null}
      {status === "DRAFT" && canDelete ? (
        <button
          disabled={pending}
          onClick={() => run(() => deleteJournal(id), "Hapus jurnal draft ini?")}
          className="font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          Hapus
        </button>
      ) : null}
    </div>
  );
}
