"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  savePartner,
  deletePartner,
  togglePartnerActive,
} from "@/lib/actions/partner-actions";
import { Badge, Card, EmptyState, Input, Label } from "@/components/ui";
import { formatCurrency } from "@/lib/format";

export type PartnerRow = {
  id: string;
  code: string;
  name: string;
  npwp: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  contactPerson: string | null;
  creditLimit: string;
  paymentTermDays: number;
  isActive: boolean;
  invoiceCount: number;
};

type FormState = {
  id?: string;
  code: string;
  name: string;
  npwp: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  contactPerson: string;
  creditLimit: string;
  paymentTermDays: string;
  isActive: boolean;
};

function emptyForm(): FormState {
  return {
    id: undefined,
    code: "",
    name: "",
    npwp: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    contactPerson: "",
    creditLimit: "0",
    paymentTermDays: "0",
    isActive: true,
  };
}

function toForm(r: PartnerRow): FormState {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    npwp: r.npwp ?? "",
    email: r.email ?? "",
    phone: r.phone ?? "",
    address: r.address ?? "",
    city: r.city ?? "",
    contactPerson: r.contactPerson ?? "",
    creditLimit: r.creditLimit,
    paymentTermDays: String(r.paymentTermDays),
    isActive: r.isActive,
  };
}

export function PartnersClient({
  kind,
  rows,
  canManage,
}: {
  kind: "customer" | "supplier";
  rows: PartnerRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isCustomer = kind === "customer";
  const label = isCustomer ? "Pelanggan" : "Supplier";

  function patch(p: Partial<FormState>) {
    setForm((prev) => (prev ? { ...prev, ...p } : prev));
  }

  function submit() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const res = await savePartner({
        id: form.id,
        kind,
        code: form.code,
        name: form.name,
        npwp: form.npwp,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        contactPerson: form.contactPerson,
        creditLimit: Number(form.creditLimit) || 0,
        paymentTermDays: Number(form.paymentTermDays) || 0,
        isActive: form.isActive,
      });
      if (res.ok) {
        setForm(null);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) alert(res.error ?? "Gagal");
      else router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        {canManage ? (
          <button
            onClick={() => {
              setError(null);
              setForm(emptyForm());
            }}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            + Tambah {label}
          </button>
        ) : null}
      </div>

      {form ? (
        <Card className="mb-4 p-5">
          <p className="mb-4 text-sm font-semibold text-slate-900">
            {form.id ? `Ubah ${label}` : `Tambah ${label}`}
          </p>
          {error ? (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Kode</Label>
              <Input value={form.code} onChange={(e) => patch({ code: e.target.value })} placeholder="CUST-001" />
            </div>
            <div>
              <Label>Nama</Label>
              <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder={`Nama ${label.toLowerCase()}`} />
            </div>
            <div>
              <Label>NPWP</Label>
              <Input value={form.npwp} onChange={(e) => patch({ npwp: e.target.value })} placeholder="00.000.000.0-000.000" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => patch({ email: e.target.value })} />
            </div>
            <div>
              <Label>Telepon</Label>
              <Input value={form.phone} onChange={(e) => patch({ phone: e.target.value })} />
            </div>
            <div>
              <Label>Kontak Person</Label>
              <Input value={form.contactPerson} onChange={(e) => patch({ contactPerson: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Alamat</Label>
              <Input value={form.address} onChange={(e) => patch({ address: e.target.value })} />
            </div>
            <div>
              <Label>Kota</Label>
              <Input value={form.city} onChange={(e) => patch({ city: e.target.value })} />
            </div>
            <div>
              <Label>Termin (hari)</Label>
              <Input
                type="number"
                min="0"
                value={form.paymentTermDays}
                onChange={(e) => patch({ paymentTermDays: e.target.value })}
              />
            </div>
            {isCustomer ? (
              <div>
                <Label>Limit Kredit</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.creditLimit}
                  onChange={(e) => patch({ creditLimit: e.target.value })}
                  className="text-right tabular-nums"
                />
              </div>
            ) : null}
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => patch({ isActive: e.target.checked })}
                />
                Aktif
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={submit}
              disabled={pending}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:bg-slate-400"
            >
              {pending ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              onClick={() => setForm(null)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              Batal
            </button>
          </div>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title={`Belum ada ${label.toLowerCase()}`} description={`Tambahkan ${label.toLowerCase()} untuk mulai membuat transaksi.`} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Kode</th>
                  <th className="px-4 py-2.5 font-medium">Nama</th>
                  <th className="px-4 py-2.5 font-medium">NPWP</th>
                  <th className="px-4 py-2.5 font-medium">Telepon</th>
                  <th className="px-4 py-2.5 text-right font-medium">Termin</th>
                  {isCustomer ? (
                    <th className="px-4 py-2.5 text-right font-medium">Limit</th>
                  ) : null}
                  <th className="px-4 py-2.5 text-right font-medium">Transaksi</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  {canManage ? <th className="px-4 py-2.5" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-500">{r.code}</td>
                    <td className="px-4 py-2 text-slate-800">{r.name}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">{r.npwp || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">{r.phone || "-"}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{r.paymentTermDays} hari</td>
                    {isCustomer ? (
                      <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                        {Number(r.creditLimit) > 0 ? formatCurrency(r.creditLimit) : "-"}
                      </td>
                    ) : null}
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{r.invoiceCount}</td>
                    <td className="px-4 py-2">
                      <Badge tone={r.isActive ? "green" : "slate"}>
                        {r.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    {canManage ? (
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => {
                              setError(null);
                              setForm(toForm(r));
                            }}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Ubah
                          </button>
                          <button
                            disabled={pending}
                            onClick={() =>
                              run(() => togglePartnerActive(kind, r.id, !r.isActive))
                            }
                            className="font-medium text-amber-600 hover:underline disabled:opacity-50"
                          >
                            {r.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                          <button
                            disabled={pending}
                            onClick={() =>
                              run(
                                () => deletePartner(kind, r.id),
                                `Hapus ${label.toLowerCase()} ${r.name}?`
                              )
                            }
                            className="font-medium text-red-600 hover:underline disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
