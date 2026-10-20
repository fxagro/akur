"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createJournal, updateJournal } from "@/lib/actions/journal-actions";
import { Card, Input, Label, PageHeader, Select } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type AccountOption = { id: string; code: string; name: string; type: string };

type Line = {
  accountId: string;
  description: string;
  debit: string;
  credit: string;
};

function newLine(): Line {
  return { accountId: "", description: "", debit: "", credit: "" };
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export type JournalInitial = {
  id: string;
  date: string;
  description: string;
  reference: string;
  lines: Line[];
};

export function JournalForm({
  accounts,
  initial,
}: {
  accounts: AccountOption[];
  initial?: JournalInitial;
}) {
  const router = useRouter();
  const [date, setDate] = useState(initial?.date ?? todayInput());
  const [description, setDescription] = useState(initial?.description ?? "");
  const [reference, setReference] = useState(initial?.reference ?? "");
  const [lines, setLines] = useState<Line[]>(
    initial?.lines?.length ? initial.lines : [newLine(), newLine()]
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const totals = useMemo(() => {
    const debit = lines.reduce((a, l) => a + (Number(l.debit) || 0), 0);
    const credit = lines.reduce((a, l) => a + (Number(l.credit) || 0), 0);
    return { debit, credit, diff: debit - credit };
  }, [lines]);

  const balanced =
    totals.debit > 0 && Math.abs(totals.diff) < 0.005;

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        const next = { ...l, ...patch };
        if (patch.debit && patch.debit !== "0") next.credit = "";
        if (patch.credit && patch.credit !== "0") next.debit = "";
        return next;
      })
    );
  }

  function addLine() {
    setLines((prev) => [...prev, newLine()]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const payload = {
        id: initial?.id,
        date,
        description: description || null,
        reference: reference || null,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          description: l.description || null,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          partnerType: "NONE" as const,
        })),
      };
      const res = initial
        ? await updateJournal(payload)
        : await createJournal(payload);
      if (res.ok) {
        router.push(`/journals/${res.id}`);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div>
      <PageHeader
        title={initial ? "Ubah Jurnal Umum" : "Buat Jurnal Umum"}
        description="Isi baris debit dan kredit dengan total seimbang."
      >
        <Link
          href={initial ? `/journals/${initial.id}` : "/journals"}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Kembali
        </Link>
      </PageHeader>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card className="p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="date">Tanggal</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="reference">Referensi</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="INV-001 / Bukti"
            />
          </div>
          <div className="sm:col-span-1">
            <Label htmlFor="description">Keterangan</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Keterangan jurnal"
            />
          </div>
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2.5 font-medium">Akun</th>
                <th className="px-3 py-2.5 font-medium">Keterangan</th>
                <th className="w-40 px-3 py-2.5 text-right font-medium">Debit</th>
                <th className="w-40 px-3 py-2.5 text-right font-medium">Kredit</th>
                <th className="w-10 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((l, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">
                    <Select
                      value={l.accountId}
                      onChange={(e) => updateLine(i, { accountId: e.target.value })}
                    >
                      <option value="">Pilih akun...</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={l.description}
                      onChange={(e) => updateLine(i, { description: e.target.value })}
                      placeholder="Opsional"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.debit}
                      onChange={(e) => updateLine(i, { debit: e.target.value })}
                      className="text-right tabular-nums"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.credit}
                      onChange={(e) => updateLine(i, { credit: e.target.value })}
                      className="text-right tabular-nums"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    {lines.length > 2 ? (
                      <button
                        onClick={() => removeLine(i)}
                        className="text-slate-400 hover:text-red-600"
                        title="Hapus baris"
                      >
                        x
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50 text-sm">
              <tr>
                <td className="px-3 py-3" colSpan={2}>
                  <button
                    onClick={addLine}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    + Tambah baris
                  </button>
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                  {formatCurrency(totals.debit)}
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                  {formatCurrency(totals.credit)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm">
          {balanced ? (
            <span className="font-medium text-emerald-600">Seimbang (balance)</span>
          ) : (
            <span className="text-red-600">
              Belum seimbang: selisih {formatCurrency(Math.abs(totals.diff))}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={initial ? `/journals/${initial.id}` : "/journals"}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            Batal
          </Link>
          <button
            onClick={submit}
            disabled={pending || !balanced}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium text-white transition",
              pending || !balanced
                ? "cursor-not-allowed bg-slate-400"
                : "bg-slate-900 hover:bg-slate-800"
            )}
          >
            {pending
              ? "Menyimpan..."
              : initial
                ? "Simpan Perubahan"
                : "Simpan sebagai Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}
