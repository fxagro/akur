import Link from "next/link";
import { requireAuth } from "@/lib/auth-context";

export default async function ModulePlaceholder({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  await requireAuth();
  const { slug } = await params;
  const path = "/" + (slug ?? []).join("/");
  const title = (slug ?? []).join(" / ") || "Modul";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold capitalize text-slate-900">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
            {path}
          </code>
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-sm font-medium text-slate-700">
          Modul ini belum tersedia
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          Halaman ini akan dibangun pada fase berikutnya.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
