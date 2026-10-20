"use client";

import { useRef } from "react";
import { switchCompanyAction } from "@/lib/actions/auth-actions";

export function CompanySwitcher({
  memberships,
  activeCompanyId,
}: {
  memberships: Array<{ companyId: string; companyName: string }>;
  activeCompanyId: string;
}) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form ref={ref} action={switchCompanyAction}>
      <select
        name="companyId"
        defaultValue={activeCompanyId}
        onChange={() => ref.current?.requestSubmit()}
        className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 outline-none transition hover:bg-slate-50 focus:border-slate-900"
        aria-label="Pilih perusahaan"
      >
        {memberships.map((m) => (
          <option key={m.companyId} value={m.companyId}>
            {m.companyName}
          </option>
        ))}
      </select>
    </form>
  );
}
