import { logoutAction } from "@/lib/actions/auth-actions";
import { CompanySwitcher } from "./company-switcher";

export function Topbar({
  userName,
  roleName,
  memberships,
  activeCompanyId,
}: {
  userName: string;
  roleName: string;
  memberships: Array<{ companyId: string; companyName: string }>;
  activeCompanyId: string;
}) {
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <CompanySwitcher
          memberships={memberships}
          activeCompanyId={activeCompanyId}
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-slate-800">
            {userName}
          </p>
          <p className="text-xs leading-tight text-slate-400">{roleName}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
          {initials || "U"}
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            Keluar
          </button>
        </form>
      </div>
    </header>
  );
}
