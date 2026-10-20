"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  postSalesInvoice,
  voidSalesInvoice,
  deleteSalesInvoice,
  postSalesReceipt,
  voidSalesReceipt,
  deleteSalesReceipt,
} from "@/lib/actions/sales-actions";
import {
  postPurchaseInvoice,
  voidPurchaseInvoice,
  deletePurchaseInvoice,
  postPurchasePayment,
  voidPurchasePayment,
  deletePurchasePayment,
} from "@/lib/actions/purchase-actions";

export type DocKind =
  | "sales-invoice"
  | "sales-receipt"
  | "purchase-invoice"
  | "purchase-payment";

type Res = { ok: boolean; error?: string };
type Fn = (id: string) => Promise<Res>;

const MAP: Record<DocKind, { post: Fn; void: Fn; del: Fn; listPath: string; noun: string }> = {
  "sales-invoice": {
    post: postSalesInvoice,
    void: voidSalesInvoice,
    del: deleteSalesInvoice,
    listPath: "/sales",
    noun: "faktur",
  },
  "sales-receipt": {
    post: postSalesReceipt,
    void: voidSalesReceipt,
    del: deleteSalesReceipt,
    listPath: "/sales/receipts",
    noun: "penerimaan",
  },
  "purchase-invoice": {
    post: postPurchaseInvoice,
    void: voidPurchaseInvoice,
    del: deletePurchaseInvoice,
    listPath: "/purchases",
    noun: "faktur",
  },
  "purchase-payment": {
    post: postPurchasePayment,
    void: voidPurchasePayment,
    del: deletePurchasePayment,
    listPath: "/purchases/payments",
    noun: "pembayaran",
  },
};

export function DocumentActions({
  kind,
  id,
  status,
  canManage,
  canPost,
  blocksVoid = false,
  variant = "row",
}: {
  kind: DocKind;
  id: string;
  status: "DRAFT" | "POSTED" | "VOID";
  canManage: boolean;
  canPost: boolean;
  blocksVoid?: boolean;
  variant?: "row" | "detail";
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const cfg = MAP[kind];

  function run(fn: Fn, confirmMsg?: string, thenPush?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    startTransition(async () => {
      const res = await fn(id);
      if (!res.ok) {
        alert(res.error ?? "Gagal");
        return;
      }
      if (thenPush) router.push(thenPush);
      else router.refresh();
    });
  }

  const detail = variant === "detail";
  const btn = detail
    ? "rounded-md px-4 py-2 text-sm font-medium transition border"
    : "text-xs font-medium hover:underline disabled:opacity-50";

  return (
    <div className={detail ? "flex flex-wrap items-center gap-2" : "flex items-center justify-end gap-2 text-xs"}>
      {status === "DRAFT" && canPost ? (
        <button
          disabled={pending}
          onClick={() => run(cfg.post, `Posting ${cfg.noun} ini? Jurnal otomatis akan dibuat.`)}
          className={
            detail
              ? `${btn} border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50`
              : "font-medium text-emerald-600 hover:underline disabled:opacity-50"
          }
        >
          Posting
        </button>
      ) : null}

      {status === "POSTED" && canPost ? (
        <button
          disabled={pending}
          onClick={() =>
            run(
              cfg.void,
              blocksVoid
                ? `Batalkan (void) ${cfg.noun} ini? Dokumen sudah ada pelunasan; batalkan pelunasan dulu.`
                : `Batalkan (void) ${cfg.noun} ini?`
            )
          }
          className={
            detail
              ? `${btn} border-amber-500 text-amber-700 hover:bg-amber-50 disabled:opacity-50`
              : "font-medium text-amber-600 hover:underline disabled:opacity-50"
          }
          title={blocksVoid ? "Batalkan pelunasan terkait terlebih dahulu" : undefined}
        >
          Void
        </button>
      ) : null}

      {status === "DRAFT" && canManage ? (
        <button
          disabled={pending}
          onClick={() => run(cfg.del, `Hapus draft ${cfg.noun} ini?`, cfg.listPath)}
          className={
            detail
              ? `${btn} border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50`
              : "font-medium text-red-600 hover:underline disabled:opacity-50"
          }
        >
          Hapus
        </button>
      ) : null}
    </div>
  );
}
