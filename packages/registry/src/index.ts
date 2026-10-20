export interface ModuleManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  repository: string;
  homepage: string;
  keywords: string[];
  category: "core" | "enterprise" | "community";
  tags: string[];
  dependencies: string[];
  peerDependencies: string[];
  akurVersion: string;
  minAkurVersion: string;
  maxAkurVersion?: string;
  entryPoint: string;
  types: string;
  main: string;
  scripts: Record<string, string>;
  engines: { node: string };
  publishConfig: { access: "public" | "restricted" };
}

export interface ModuleRegistry {
  name: string;
  url: string;
  modules: ModuleManifest[];
  lastUpdated: string;
}

export const DEFAULT_REGISTRY: ModuleRegistry = {
  name: "akur-official",
  url: "https://registry.akur.id",
  modules: [],
  lastUpdated: new Date().toISOString(),
};

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
  category: string;
  tags: string[];
  downloads: number;
  stars: number;
  updatedAt: string;
}

export interface ModuleSearchOptions {
  query?: string;
  category?: string;
  tags?: string[];
  author?: string;
  limit?: number;
  offset?: number;
}

export interface ModuleListOptions {
  category?: "core" | "enterprise" | "community";
  installed?: boolean;
  updates?: boolean;
  limit?: number;
  offset?: number;
}

export const MODULE_CATEGORIES = {
  core: "Core modules (included in base installation)",
  enterprise: "Enterprise modules (paid, requires license)",
  community: "Community modules (free, open source)",
} as const;

export type ModuleCategory = keyof typeof MODULE_CATEGORIES;

export const MODULE_STATUSES = {
  stable: "Stable - Ready for production",
  beta: "Beta - Feature complete, testing phase",
  alpha: "Alpha - Early development, not for production",
  deprecated: "Deprecated - No longer maintained",
  archived: "Archived - No longer available",
} as const;

export type ModuleStatus = keyof typeof MODULE_STATUSES;