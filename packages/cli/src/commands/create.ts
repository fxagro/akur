import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";

export async function createModule(program: any) {
  const name = program.args[0];
  const type = program.type || "core";
  const dir = program.dir || process.cwd();
  const modulePath = resolve(dir, name);

  const spinner = ora(`Creating module ${name}...`).start();

  if (existsSync(modulePath)) {
    spinner.fail(`Directory ${modulePath} already exists`);
    process.exit(1);
  }

  const moduleName = name.startsWith("@akur/") ? name : `@akur/${name}`;
  const modulePath = resolve(dir, name);

  mkdirSync(modulePath, { recursive: true });
  mkdirSync(join(modulePath, "src"), { recursive: true });
  mkdirSync(join(modulePath, "prisma"), { recursive: true });
  mkdirSync(join(modulePath, "tests"), { recursive: true });

  const packageJson = {
    name: name.startsWith("@akur/") ? name : `@akur/${name}`,
    version: "0.1.0",
    private: true,
    main: "dist/index.js",
    types: "dist/index.d.ts",
    exports: {
      ".": "./dist/index.js",
      "./lib/*": "./dist/lib/*.js",
    },
    scripts: {
      build: "tsc",
      dev: "tsc --watch",
      test: "jest",
      lint: "eslint src --ext .ts",
    },
    dependencies: {
      "@akur/core": "workspace:*",
      "zod": "^3.22.0",
    },
    devDependencies: {
      typescript: "^5.4.0",
      "@types/node": "^20.0.0",
      "jest": "^29.0.0",
      "@types/jest": "^29.0.0",
      "eslint": "^8.0.0",
      "tsx": "^4.0.0",
    },
  };

  writeFileSync(join(modulePath, "package.json"), JSON.stringify(packageJson, null, 2));

  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      lib: ["ES2022"],
      declaration: true,
      declarationMap: true,
      outDir: "./dist",
      rootDir: "./src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      resolvePackageJsonExports: true,
      resolvePackageJsonImports: true,
      baseUrl: ".",
      paths: {
        "@akur/core/*": ["../core/src/*"],
      },
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"],
  };

  writeFileSync(join(modulePath, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));

  const indexTs = `export * from "./lib";
export * from "./types";
export * from "./actions";

export { default as ${name.charAt(0).toUpperCase() + name.slice(1)}Client } from "./components/${name}-client";
`;

  writeFileSync(join(modulePath, "src", "index.ts"), indexTs);

  writeFileSync(join(modulePath, "src", "types", "index.ts"), "// Types for " + moduleName);

  writeFileSync(join(modulePath, "src", "lib", "index.ts"), "// Library functions for " + moduleName);

  writeFileSync(join(modulePath, "src", "actions", "index.ts"), "// Server actions for " + moduleName);

  writeFileSync(join(modulePath, "src", "components", `${name}-client.tsx`), "// Client component for " + moduleName);

  writeFileSync(join(modulePath, "README.md"), `# ${moduleName}\n\nAkur ${name} module.\n`);

  writeFileSync(join(modulePath, "prisma", "schema.prisma"), `// Prisma schema for ${moduleName}\n`);

  writeFileSync(join(modulePath, ".gitignore"), `# Dependencies
node_modules/
.pnp
.pnp.js

# Build
dist/

# Prisma
prisma/migrations/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
`);

  writeFileSync(join(modulePath, ".eslintrc.js"), `module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
  },
};
`);

  console.log(chalk.green(`\n✅ Module ${name} created at ${modulePath}`));
  console.log(chalk.cyan("\nNext steps:"));
  console.log(chalk.gray(`  cd ${name}`));
  console.log(chalk.gray("  npm install"));
  console.log(chalk.gray("  npm run dev"));
}

export async function createModuleCommand(name: string, type: string, dir: string) {
  console.log(`Creating module ${name} (${type}) in ${dir}...`);
}