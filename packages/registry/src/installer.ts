import { MODULE_CATALOG, type ModuleInfo } from "./catalog";

export interface ModuleInstallOptions {
  registry?: string;
  version?: string;
  force?: boolean;
  dryRun?: boolean;
}

export interface ModuleInstallResult {
  success: boolean;
  module: string;
  version: string;
  path: string;
  migrationsRun: string[];
  warnings: string[];
  errors: string[];
}

export interface ModuleSearchResult {
  name: string;
  version: string;
  description: string;
  tier: string;
  tags: string[];
}

export interface ModuleSearchOptions {
  query?: string;
  tier?: string;
  tag?: string;
  limit?: number;
}

export const DEFAULT_REGISTRY_URL = "https://registry.akur.id";

export class ModuleInstaller {
  private registryUrl: string;

  constructor(registryUrl = DEFAULT_REGISTRY_URL) {
    this.registryUrl = registryUrl;
  }

  get registry(): string {
    return this.registryUrl;
  }

  /** Cari modul di katalog lokal (offline). */
  async searchModules(options: ModuleSearchOptions = {}): Promise<ModuleSearchResult[]> {
    const { query, tier, tag, limit = 50 } = options;
    const q = query?.toLowerCase().trim();

    return MODULE_CATALOG.filter((m) => {
      if (tier && m.tier !== tier) return false;
      if (tag && !m.tags.includes(tag)) return false;
      if (!q) return true;
      const haystack = `${m.name} ${m.description} ${m.tags.join(" ")}`.toLowerCase();
      return haystack.includes(q);
    })
      .slice(0, limit)
      .map((m) => ({
        name: m.name,
        version: m.version,
        description: m.description,
        tier: m.tier,
        tags: m.tags,
      }));
  }

  /** Ambil manifest modul dari katalog lokal. */
  async fetchManifest(moduleName: string): Promise<ModuleInfo | null> {
    return MODULE_CATALOG.find((m) => m.name === moduleName) ?? null;
  }

  /** Periksa kompatibilitas versi Akur core. */
  async checkCompatibility(
    manifest: ModuleInfo,
    currentCoreVersion = "0.1.0"
  ): Promise<{ compatible: boolean; reason?: string }> {
    const [coreMajor] = currentCoreVersion.split(".");
    const [modMajor] = manifest.version.split(".");
    if (Number(modMajor) > Number(coreMajor)) {
      return {
        compatible: false,
        reason: `Modul membutuhkan Akur core >= ${modMajor}.0, tersedia ${currentCoreVersion}`,
      };
    }
    return { compatible: true };
  }

  async installModule(
    moduleName: string,
    options: ModuleInstallOptions = {}
  ): Promise<ModuleInstallResult> {
    const manifest = await this.fetchManifest(moduleName);
    if (!manifest) {
      return {
        success: false,
        module: "",
        version: "",
        path: "",
        migrationsRun: [],
        warnings: [],
        errors: [`Modul ${moduleName} tidak ditemukan di registry`],
      };
    }

    const compat = await this.checkCompatibility(manifest);
    if (!compat.compatible && !options.force) {
      return {
        success: false,
        module: "",
        version: "",
        path: "",
        migrationsRun: [],
        warnings: [],
        errors: [compat.reason ?? "Modul tidak kompatibel dengan versi core saat ini"],
      };
    }

    return {
      success: true,
      module: manifest.name,
      version: options.version ?? manifest.version,
      path: `packages/${manifest.name.replace("@akur/", "")}`,
      migrationsRun: [],
      warnings: ["Registry online belum aktif — instalasi disimulasikan"],
      errors: [],
    };
  }
}

export const moduleInstaller = new ModuleInstaller();