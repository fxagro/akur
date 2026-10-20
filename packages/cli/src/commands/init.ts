import { Command } from "commander";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import chalk from "chalk";
import ora from "ora";

export async function init(program: any) {
  const name = program.name || "my-akur-project";
  const dir = program.dir || process.cwd();
  const projectPath = resolve(program.dir, name);

  const spinner = ora("Initializing Akur project...").start();

  if (existsSync(projectPath)) {
    spinner.fail(chalk.red(`Directory ${projectPath} already exists`));
    process.exit(1);
  }

  mkdirSync(projectPath, { recursive: true });
  mkdirSync(join(projectPath, "src"), { recursive: true });
  mkdirSync(join(projectPath, "prisma"), { recursive: true });
  mkdirSync(join(projectPath, "public"), { recursive: true });

  const packageJson = {
    name: name.toLowerCase().replace(/\s+/g, "-"),
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint",
      "db:push": "prisma db push",
      "db:migrate": "prisma migrate dev",
      "db:studio": "prisma studio",
      "db:seed": "tsx prisma/seed.ts",
    },
    dependencies: {
      next: "^16.4.0",
      react: "^18.3.0",
      "react-dom": "^18.3.0",
      "@prisma/client": "^5.0.0",
      "@akur/core": "workspace:*",
      "next-auth": "^5.0.0",
      "zod": "^3.22.0",
      "bcryptjs": "^2.4.3",
      "date-fns": "^3.6.0",
      "ulid": "^2.3.0",
      "zod": "^3.22.0",
    },
    devDependencies: {
      typescript: "^5.4.0",
      "@types/node": "^20.0.0",
      "@types/react": "^18.3.0",
      "@types/react-dom": "^18.3.0",
      "@types/bcryptjs": "^2.4.3",
      "tailwindcss": "^3.4.0",
      "postcss": "^8.4.0",
      "autoprefixer": "^10.4.0",
      "eslint": "^8.0.0",
      "eslint-config-next": "^16.4.0",
      "prisma": "^5.0.0",
      "tsx": "^4.0.0",
    },
  };

  writeFileSync(join(projectPath, "package.json"), JSON.stringify(packageJson, null, 2));

  const tsconfig = {
    compilerOptions: {
      target: "ES2017",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: {
        "@/*": ["./src/*"],
        "@akur/core/*": ["../packages/core/src/*"],
      },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  };

  writeFileSync(join(projectPath, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));

  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
`;

  writeFileSync(join(projectPath, "next.config.js"), nextConfig);

  const envExample = `# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/akur?schema=public"

# Auth
AUTH_SECRET="your-super-secret-key-here-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Akur ERP"

# Email (optional)
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_USER="your-email@gmail.com"
# SMTP_PASS="your-app-password"

# Redis (optional)
# REDIS_URL="redis://localhost:6379"
`;

  writeFileSync(join(projectPath, ".env.example"), envExample);

  const gitignore = `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/

# Production
dist/

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Prisma
prisma/migrations/

# IDE
.idea/
.vscode/
*.swp
*.swo
`;

  writeFileSync(join(projectPath, ".gitignore"), gitignore);

  const readme = `# ${name}

Akur ERP - Modular ERP System for Indonesia

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Setup database
cp .env.example .env
# Edit .env with your database URL

# Setup database
npm run db:push

# Run development server
npm run dev
\`\`\`

## Commands

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run db:push\` - Push schema to database
- \`npm run db:migrate\` - Run migrations
- \`npm run db:studio\` - Open Prisma Studio
- \`npm run db:seed\` - Seed database

## Project Structure

\`\`\`
src/
├── app/                    # Next.js App Router pages
├── components/             # Shared React components
├── lib/                    # Utility functions
├── actions/                # Server Actions
└── middleware.ts           # Next.js middleware
\`\`\`

## License

MIT
`;

  writeFileSync(join(projectPath, "README.md"), readme);

  const prismaSchema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client"
  output   = "../node_modules/@prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Add your models here
`;

  writeFileSync(join(projectPath, "prisma", "schema.prisma"), prismaSchema);

  spinner.succeed(chalk.green(`Akur project created at ${projectPath}`));
  console.log(chalk.cyan("\nNext steps:"));
  console.log(chalk.gray(`  cd ${name}`));
  console.log(chalk.gray("  cp .env.example .env"));
  console.log(chalk.gray("  # Edit .env with your database URL"));
  console.log(chalk.gray("  npm install"));
  console.log(chalk.gray("  npm run db:push"));
  console.log(chalk.gray("  npm run dev"));
  console.log(chalk.cyan("\nHappy coding! 🚀"));
}

export default { init };