import { MODULE_CATALOG, type ModuleInfo, type ModuleTier } from "@akur/registry";

export interface ListOptions {
  all: boolean;
  flags: Record<string, string | boolean>;
}

const TIER_LABEL: Record<ModuleTier, string> = {
  core: "CORE (wajib, sudah termasuk)",
  community: "COMMUNITY (gratis, open source)",
  enterprise: "ENTERPRISE (berbayar, butuh lisensi)",
};

const TIER_ORDER: ModuleTier[] = ["core", "community", "enterprise"];

const STATUS_LABEL: Record<ModuleInfo["status"], string> = {
  stable: "stable",
  beta: "beta",
  alpha: "alpha",
  planned: "direncanakan",
};

export async function listModules(options: ListOptions): Promise<void> {
  const tiers: ModuleTier[] = options.all
    ? TIER_ORDER
    : TIER_ORDER.filter((t) => t !== "enterprise");

  console.log("\nModul Akur yang Tersedia\n");

  for (const tier of tiers) {
    const mods = MODULE_CATALOG.filter((m) => m.tier === tier);
    if (mods.length === 0) continue;

    console.log(`── ${TIER_LABEL[tier]} ──`);
    for (const m of mods) {
      const marker = m.status === "stable" ? "[✓]" : m.status === "planned" ? "[ ]" : "[~]";
      console.log(`  ${marker} ${m.name}@${m.version}  (${STATUS_LABEL[m.status]})`);
      console.log(`      ${m.description}`);
      console.log(`      tags: ${m.tags.join(", ")}`);
    }
    console.log("");
  }

  console.log("Penggunaan:");
  console.log("  akur module:install @akur/hr");
  console.log("  akur module:install @akur/mrp --version 0.1.0");
  console.log("  akur module:remove @akur/hr --force");
  console.log("  akur module:create my-module --type core\n");
}