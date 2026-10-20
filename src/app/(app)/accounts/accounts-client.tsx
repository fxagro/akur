"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createAccount,
  updateAccount,
  deleteAccount,
  toggleAccountActive,
} from "@/lib/actions/account-actions";
import { Badge, Card, Input, Label, PageHeader, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

type AccountRow = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: "DEBIT" | "CREDIT";
  parentId: string | null;
  level: number;
  isGroup: boolean;
  isActive: boolean;
  description: string | null;
};

const TYPE_LABEL: Record<AccountType, string> = {
  ASSET: "Aset",
  LIABILITY: "Liabilitas",
  EQUITY: "Ekuitas",
  REVENUE: "Pendapatan",
  EXPENSE: "Beban",
};

const TYPE_TONE: Record<AccountType, "blue" | "amber" | "green" | "slate" | "red"> = {
  ASSET: "blue",
  LIABILITY: "amber",
  EQUITY: "green",
  REVENUE: "green",
  EXPENSE: "red",
};

type FormState = {
  id?: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: "DEBIT" | "CREDIT";
  parentId: string;
  isGroup: boolean;
  description: string;
};

const emptyForm: FormState = {
  code: "",
  name: "",
  type: "ASSET",
  normalBalance: "DEBIT",
  parentId: "",
  isGroup: false,
  description: "",
};

export function AccountsClient({
  accounts,
  canManage,
}: {
  accounts: AccountRow[];
  canManage: boolean;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        TYPE_LABEL[a.type].toLowerCase().includes(q)
    );
  }, [accounts, search]);

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function openEdit(a: AccountRow) {
    setForm({
      id: a.id,
      code: a.code,
      name: a.name,
      type: a.type,
      normalBalance: a.normalBalance,
      parentId: a.parentId ?? "",
      isGroup: a.isGroup,
      description: a.description ?? "",
    });
    setError(null);
    setOpen(true);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const payload = {
        id: form.id,
        code: form.code,
        name: form.name,
        type: form.type,
        normalBalance: form.normalBalance,
        parentId: form.parentId || null,
        isGroup: form.isGroup,
        description: form.description || null,
      };
      const res = form.id
        ? await updateAccount(payload)
        : await createAccount(payload);
      if (res.ok) {
        setOpen(false);
      } else {
        setError(res.error);
      }
    });
  }

  function onToggle(a: AccountRow) {
    startTransition(async () => {
      const res = await toggleAccountActive(a.id, !a.isActive);
      if (!res.ok) alert(res.error);
    });
  }

  function onDelete(a: AccountRow) {
    if (!confirm(`Hapus akun ${a.code} ${a.name}?`)) return;
    startTransition(async () => {
      const res = await deleteAccount(a.id);
      if (!res.ok) alert(res.error);
    });
  }

  return (
    <div>
      <PageHeader
        title="Daftar Akun (COA)"
        description={`${accounts.length} akun terdaftar`}
      >
        <Input
          placeholder="Cari kode / nama akun..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        {canManage ? (
          <button
            onClick={openCreate}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Tambah Akun
          </button>
        ) : null}
      </PageHeader>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Kode</th>
                <th className="px-4 py-2.5 font-medium">Nama Akun</th>
                <th className="px-4 py-2.5 font-medium">Tipe</th>
                <th className="px-4 py-2.5 font-medium">Saldo Normal</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                {canManage ? (
                  <th className="px-4 py-2.5 text-right font-medium">Aksi</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-600">
                    {a.code}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      style={{ paddingLeft: `${Math.max(0, a.level - 1) * 16}px` }}
                      className={cn(a.isGroup ? "font-semibold text-slate-900" : "text-slate-700")}
                    >
                      {a.name}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={TYPE_TONE[a.type]}>{TYPE_LABEL[a.type]}</Badge>
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {a.normalBalance === "DEBIT" ? "Debit" : "Kredit"}
                  </td>
                  <td className="px-4 py-2">
                    {a.isActive ? (
                      <Badge tone="green">Aktif</Badge>
                    ) : (
                      <Badge tone="slate">Nonaktif</Badge>
                    )}
                  </td>
                  {canManage ? (
                    <td className="whitespace-nowrap px-4 py-2 text-right">
                      <button
                        onClick={() => openEdit(a)}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Ubah
                      </button>
                      <button
                        onClick={() => onToggle(a)}
                        className="ml-3 text-xs font-medium text-slate-500 hover:underline"
                      >
                        {a.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button
                        onClick={() => onDelete(a)}
                        className="ml-3 text-xs font-medium text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 6 : 5}
                    className="px-4 py-10 text-center text-sm text-slate-400"
                  >
                    Tidak ada akun yang cocok.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900">
              {form.id ? "Ubah Akun" : "Tambah Akun"}
            </h2>

            {error ? (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Kode Akun</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="1-1100"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipe</Label>
                <Select
                  id="type"
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as AccountType })
                  }
                >
                  {Object.entries(TYPE_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="name">Nama Akun</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Kas"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentId">Akun Induk</Label>
                <Select
                  id="parentId"
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                >
                  <option value="">(Tanpa induk)</option>
                  {accounts
                    .filter((a) => a.isGroup && a.id !== form.id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="normalBalance">Saldo Normal</Label>
                <Select
                  id="normalBalance"
                  value={form.normalBalance}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      normalBalance: e.target.value as "DEBIT" | "CREDIT",
                    })
                  }
                >
                  <option value="DEBIT">Debit</option>
                  <option value="CREDIT">Kredit</option>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="description">Keterangan</Label>
              <Textarea
                id="description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isGroup}
                onChange={(e) => setForm({ ...form, isGroup: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              Jadikan akun induk (header/grup)
            </label>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={submit}
                disabled={pending}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {pending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
