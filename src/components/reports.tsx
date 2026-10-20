import { Fragment } from "react";
import type { AccountNode } from "@/lib/accounting/reports";
import { formatCurrency } from "@/lib/format";
import { Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

export function ReportFilters({
  action,
  from,
  to,
  showFrom = true,
}: {
  action: string;
  from: string;
  to: string;
  showFrom?: boolean;
}) {
  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
      <form method="get" action={action} className="flex flex-wrap items-end gap-3">
        {showFrom ? (
          <div>
            <Label htmlFor="from">Dari</Label>
            <Input id="from" name="from" type="date" defaultValue={from} />
          </div>
        ) : null}
        <div>
          <Label htmlFor="to">Sampai</Label>
          <Input id="to" name="to" type="date" defaultValue={to} />
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Tampilkan
        </button>
      </form>
    </div>
  );
}

function Row({ node, depth }: { node: AccountNode; depth: number }) {
  return (
    <tr className={cn(node.isGroup && "bg-slate-50/70")}>
      <td className="px-4 py-2">
        <span
          style={{ paddingLeft: `${depth * 16}px` }}
          className={cn(
            node.isGroup ? "font-semibold text-slate-900" : "text-slate-700"
          )}
        >
          {node.code} · {node.name}
        </span>
      </td>
      <td className="px-4 py-2 text-right tabular-nums text-slate-800">
        {formatCurrency(node.total.toString())}
      </td>
    </tr>
  );
}

export function TreeRows({
  nodes,
  depth = 0,
}: {
  nodes: AccountNode[];
  depth?: number;
}) {
  return (
    <>
      {nodes.map((n) => (
        <Fragment key={n.id}>
          <Row node={n} depth={depth} />
          {n.children.length ? <TreeRows nodes={n.children} depth={depth + 1} /> : null}
        </Fragment>
      ))}
    </>
  );
}

export function ReportTotalRow({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "green" | "red";
}) {
  const color =
    tone === "green"
      ? "text-emerald-700"
      : tone === "red"
        ? "text-red-700"
        : "text-slate-900";
  return (
    <tr className="border-t-2 border-slate-200 bg-white font-semibold">
      <td className="px-4 py-3 text-slate-700">{label}</td>
      <td className={cn("px-4 py-3 text-right tabular-nums", color)}>{value}</td>
    </tr>
  );
}

/** Filter akun dengan saldo nol (daun saja) agar laporan ringkas. */
export function pruneZero(nodes: AccountNode[]): AccountNode[] {
  return nodes
    .map((n) => ({ ...n, children: pruneZero(n.children) }))
    .filter((n) => n.isGroup || !n.total.isZero() || n.children.length > 0)
    .filter((n) => !(n.total.isZero() && n.children.length === 0));
}
