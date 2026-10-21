import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";

export interface InitOptions {
  name?: string | boolean;
  dir?: string | boolean;
  flags: Record<string, string | boolean>;
}

export async function init(options: InitOptions): Promise<void> {
  const name = typeof options.name === "string" ? options.name : "my-akur-project";
  const baseDir = typeof options.dir === "string" ? options.dir : process.cwd();
  const projectPath = resolve(baseDir, name);

  if (existsSync(projectPath)) {
    console.error(`Direktori ${projectPath} sudah ada.`);
    process.exitCode = 1;
    return;
  }

  mkdirSync(join(projectPath, "src"), { recursive: true });
  mkdirSync(join(projectPath, "prisma"), { recursive: true });
  mkdirSync(join(projectPath, "public"), { recursive: true });

  writeFileSync(
    join(projectPath, "package.json"),
    JSON.stringify(
      {
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
          react: "^19.3.0",
          "react-dom": "^19.3.0",
          "@akur/core": "workspace:*",
          zod: "^4.6.7",
          bcryptjs: "^3.0.3",
          "date-fns": "^4.4.0",
        },
        devDependencies: {
          typescript: "^5",
          "@types/node": "^20",
          "@types/react": "^19",
          "@types/react-dom": "^19",
          tailwindcss: "^4",
          postcss: "^8.4.0",
          autoprefixer: "^10.4.0",
          eslint: "^9",
          "eslint-config-next": "^16.4.0",
          prisma: "^7.10.1",
          tsx: "^4.23.15",
        },
      },
      null,
      2
    )
  );

  writeFileSync(
    join(projectPath, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
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
            "@akur/core/*": ["../../packages/core/src/*"],
          },
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"],
      },
      null,
      2
    )
  );

  writeFileSync(
    join(projectPath, "next.config.js"),
    `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
};

module.exports = nextConfig;
`
  );

  writeFileSync(
    join(projectPath, ".env.example"),
    `# Database
DATABASE_URL="postgresql://postgres:password@localhost:15432/accurate?schema=public"

# Auth
AUTH_SECRET="ganti-dengan-secret-acak-minimal-32-karakter"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="AccurateClone"
`
  );

  writeFileSync(
    join(projectPath, ".gitignore"),
    `node_modules/
.next/
out/
dist/
coverage/
.env
.env.local
*.tsbuildinfo
next-env.d.ts
prisma/migrations/
.DS_Store
`
  );

  writeFileSync(
    join(projectPath, "README.md"),
    `# ${name}

Aplikasi ERP Akur - sistem akuntansi modular untuk Indonesia.

## Menjalankan

\`\`\`bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
\`\`\`

## Perintah

- \`npm run dev\` - server pengembangan
- \`npm run build\` - build produksi
- \`npm run lint\` - linting
- \`npm run db:push\` - push skema database
- \`npm run db:studio\` - buka Prisma Studio

## Lisensi

MIT
`
  );

  writeFileSync(
    join(projectPath, "prisma", "schema.prisma"),
    `// Skema Prisma untuk ${name}

generator client {
  provider = "prisma-client"
  output   = "../node_modules/@prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`
  );

  console.log(`\nProyek Akur berhasil dibuat di: ${projectPath}\n`);
  console.log("Langkah berikutnya:");
  console.log(`  cd ${name}`);
  console.log("  cp .env.example .env");
  console.log("  # edit .env dengan DATABASE_URL");
  console.log("  npm install");
  console.log("  npm run db:push");
  console.log("  npm run dev\n");
}