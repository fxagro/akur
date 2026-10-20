# Akur CLI

CLI tool for managing Akur ERP modules.

## Installation

```bash
npm install -g @akur/cli
```

Or use with npx:

```bash
npx @akur/cli <command>
```

## Commands

### `akur init`

Initialize a new Akur project.

```bash
akur init -n my-akur-project
```

Options:
- `-n, --name <name>` - Project name
- `-d, --dir <dir>` - Project directory (default: current directory)

### `akur module:install <module>`

Install a module from the registry.

```bash
akur module:install @akur/hr
akur module:install @akur/hr --version 0.2.0
```

Options:
- `-v, --version <version>` - Module version (default: latest)

### `akur module:remove <module>`

Remove an installed module.

```bash
akur module:remove @akur/hr
akur module:remove @akur/hr --force
```

Options:
- `--force` - Force remove without confirmation

### `akur module:list`

List available modules.

```bash
akur module:list
akur module:list --all
```

Options:
- `-a, --all` - Show all modules including enterprise

### `akur module:create <name>`

Create a new module scaffold.

```bash
akur module:create my-module
akur module:create my-module --type enterprise
akur module:create my-module --dir ./packages
```

Options:
- `-t, --type <type>` - Module type (core|enterprise), default: core
- `-d, --dir <dir>` - Output directory

### `akur upgrade`

Upgrade Akur core and modules.

```bash
akur upgrade
akur upgrade --core
akur upgrade --modules
```

Options:
- `-c, --core` - Upgrade core only
- `-m, --modules` - Upgrade modules only

## Module Development

### Module Structure

```
my-module/
├── src/
│   ├── index.ts          # Main exports
│   ├── types/            # TypeScript types
│   ├── lib/              # Library functions
│   ├── actions/          # Server actions
│   └── components/       # React components
├── prisma/
│   └── schema.prisma     # Prisma schema
├── tests/                # Unit tests
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

### Module Package.json

```json
{
  "name": "@akur/my-module",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./lib/*": "./dist/lib/*.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "@akur/core": "workspace:*",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "eslint": "^8.0.0",
    "tsx": "^4.0.0"
  }
}
```

### Module Structure

```
my-module/
├── src/
│   ├── index.ts          # Main exports
│   ├── types/            # TypeScript types
│   │   └── index.ts      # Type definitions
│   ├── lib/              # Library functions
│   │   └── index.ts      # Utility functions
│   ├── actions/          # Server actions
│   │   └── index.ts      # Server actions
│   └── components/       # React components
│       └── my-module-client.tsx
├── prisma/
│   └── schema.prisma     # Prisma schema
├── tests/                # Unit tests
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

## Module Development Guidelines

1. **Naming**: Use `@akur/<module-name>` format
2. **Versioning**: Follow semantic versioning (MAJOR.MINOR.PATCH)
3. **Dependencies**: Use `workspace:*` for `@akur/core`
4. **Types**: Export all types from `src/types/index.ts`
4. **Actions**: Use Server Actions pattern with Zod validation
5. **Components**: Use Client Components for interactive UI
5. **Tests**: Write unit tests in `tests/` directory

## Module Registry

Modules are published to the Akur registry at `https://registry.akur.id`.

### Publishing a Module

```bash
# Build the module
npm run build

# Publish to registry (requires auth)
npm publish --registry=https://registry.akur.id
```

### Module Manifest (package.json)

```json
{
  "name": "@akur/my-module",
  "version": "0.1.0",
  "description": "Module description",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./lib/*": "./dist/lib/*.js"
  },
  "keywords": ["akur", "module", "erp"],
  "author": "Author Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/fxagro/akur-modules.git"
  },
  "homepage": "https://github.com/fxagro/akur-modules#readme",
  "bugs": {
    "url": "https://github.com/fxagro/akur-modules/issues"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

## Module Registry API

### Search Modules

```
GET /api/v1/modules/search?q=hr&category=enterprise&limit=10
```

### Get Module Manifest

```
GET /api/v1/modules/@akur/hr/manifest
```

### List Modules

```
GET /api/v1/modules?category=enterprise&limit=50&offset=0
```

## Module Installation Process

1. **Fetch manifest** from registry
2. **Check compatibility** with current Akur version
3. **Download** module package
5. **Verify** package integrity (checksum)
5. **Extract** to `packages/<module-name>`
6. **Run migrations** (if any)
6. **Register** module routes
7. **Update** module registry

## Module Lifecycle

1. **Development** - Local development with `npm run dev`
2. **Testing** - Unit tests with `npm test`
3. **Build** - `npm run build` produces `dist/`
4. **Publish** - `npm publish --registry=https://registry.akur.id`
6. **Install** - `akur module:install @akur/my-module`
7. **Update** - `akur module:upgrade @akur/my-module`
8. **Remove** - `akur module:remove @akur/my-module`

## Best Practices

1. **Keep modules small** - Single responsibility
2. **Use TypeScript** - Strict mode enabled
3. **Validate inputs** - Use Zod schemas
4. **Handle errors** - Return `{ ok: true } | { ok: false; error: string }`
5. **Revalidate paths** - Use `revalidatePath()` after mutations
6. **Follow conventions** - File structure, naming, code style
7. **Document** - README, API docs, changelog