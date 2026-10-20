# Akur ERP - Modular ERP System for Indonesia

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10-2D374B.svg)](https://www.prisma.io/)

> **Akur ERP** - Modular ERP System built for Indonesia. Inspired by Odoo, built for Indonesia.

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/fxagro/akur.git
cd akur

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database URL

# Setup database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Open http://localhost:3000 and login with:
- **Email**: admin@accurate.local
- **Password**: admin123

## 🏗 Architecture

```
akur/
├── apps/                    # Applications (future)
├── packages/
│   ├── core/               # @akur/core - Shared kernel
│   ├── cli/                # @akur/cli - Module manager CLI
│   ├── registry/           # @akur/registry - Module registry
│   └── cli/
│       └── templates/      # Module templates
├── prisma/                 # Database schema & migrations
├── src/                    # Main Next.js application
│   ├── app/                # Next.js App Router pages
│   ├── components/         # Shared React components
│   ├── lib/                # Utility functions
│   ├── actions/            # Server Actions
│   └── middleware.ts       # Next.js middleware
├── packages/               # Monorepo packages (workspace)
├── turbo.json              # Turborepo config
├── package.json            # Root package.json (workspaces)
└── turbo.json              # Turborepo config
```

## 🏗 Monorepo Structure

```
akur/
├── apps/                          # Applications (future)
├── packages/
│   ├── core/                      # @akur/core - Shared kernel
│   │   ├── src/
│   │   │   ├── lib/               # Shared utilities
│   │   │   ├── types/             # Core TypeScript types
│   │   │   └── utils/             # Helper functions
│   │   └── prisma/                # Prisma schema for core
│   ├── cli/                       # @akur/cli - Module manager CLI
│   ├── registry/                  # @akur/registry - Module registry
│   └── cli/
│       └── templates/             # Module scaffolding templates
├── prisma/                        # Database schema & migrations
├── src/                           # Main Next.js application
├── packages/                      # Monorepo packages (workspace)
├── turbo.json                     # Turborepo config
├── package.json                   # Root package.json (workspaces)
└── turbo.json                     # Turborepo config
```

## 🚀 Features

### Core Modules (Community - Free)
- 📊 **Accounting** - COA, Journal, General Ledger
- 📦 **Inventory** - Stock, Items, Warehouses, Stock Cards, HPP
- 💰 **Sales & AR** - Invoices, Receipts, Customers, Quotes
- 💸 **Purchase & AP** - Bills, Payments, Suppliers
- 📋 **Reports** - Trial Balance, P&L, Balance Sheet, Cash Flow
- 🏦 **Bank & Cash** - Accounts, Transactions, Reconciliation
- 🏷️ **Tax** - PPN, PPh 21/23/4(2), e-Faktur, SPT
- 🏭 **Fixed Assets** - Assets, Depreciation (Straight-line, Declining)

### Enterprise Modules (Paid)
- 👥 **HR/Payroll** - Employees, Contracts, Payroll, BPJS, PPh 21, THR
- 🏭 **Manufacturing (MRP)** - BOM, Routing, Work Orders, Costing
- 🛒 **POS** - Retail, Restaurant, Inventory Sync
- 🤝 **CRM** - Leads, Opportunities, Pipeline, Quotes
- 📋 **Projects** - Tasks, Timesheets, Billing
- 💱 **Multi-currency** - Exchange rates, Revaluation
- 🏢 **Multi-branch** - Multi-branch, Consolidation
- 📊 **Budgeting** - Budgeting & Forecasting
- ✅ **Quality** - QC, Inspections, NCR
- 🔧 **Maintenance** - PM, CM, Asset Management
- 🚚 **Fleet** - Vehicles, Fuel, Maintenance
- 🎫 **Helpdesk** - Tickets, SLA, KB, CSAT
- 🛒 **E-commerce** - Shopify, WooCommerce, Tokopedia connectors
- 🏪 **POS Integration** - EDC, Printers, Cash Drawers
- 🏦 **Bank Integration** - Auto-reconcile, Mutasi (BCA, Mandiri, BRI, BNI)

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router) + React 19 + Tailwind CSS v4 |
| **Backend** | Next.js Server Actions + Prisma ORM |
| **Database** | PostgreSQL 16 (Docker) |
| **ORM** | Prisma 7.10 (Standalone) |
| **Auth** | Session Cookie + bcryptjs + RBAC |
| **Validation** | Zod 4 |
| **Styling** | Tailwind CSS v4 |
| **Build** | Turborepo + Next.js 16 (Standalone) |
| **Deploy** | PM2 + Nginx + Docker + SSL |

## 📦 Module System

Akur uses a **modular architecture** inspired by Odoo:

```
@akur/core          # Shared kernel (auth, RBAC, utils, Prisma)
@akur/accounting    # Accounting core
@akur/inventory     # Inventory management
@akur/sales         # Sales & AR
@akur/purchase      # Purchase & AP
@akur/inventory     # Inventory management
@akur/tax           # Tax (PPN, PPh, e-Faktur)
@akur/bank          # Bank & Cash
@akur/assets        # Fixed Assets & Depreciation
@akur/reports       # Financial Reports
@akur/hr            # HR & Payroll (Enterprise)
@akur/mrp           # Manufacturing (Enterprise)
@akur/pos           # Point of Sale (Enterprise)
@akur/crm           # CRM (Enterprise)
```

## 🚀 Deployment

### VPS (Recommended)
```bash
# Server requirements
# - Ubuntu 22.04+ / Debian 12+
# - 2GB+ RAM, 20GB+ SSD
# - Docker & Docker Compose

# Deploy
git clone https://github.com/fxagro/akur.git
cd akur
cp .env.example .env
# Edit .env with your config

# Build & Deploy
docker-compose up -d --build

# Or with PM2 + Nginx (manual)
npm run build
pm2 start ecosystem.config.js
nginx -s reload
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: akur
      POSTGRES_USER: akur
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports: ["15432:5432"]

  app:
    build: .
    environment:
      DATABASE_URL: postgresql://akur:${DB_PASSWORD}@postgres:5432/akur
      AUTH_SECRET: ${AUTH_SECRET}
      NEXT_PUBLIC_APP_URL: https://your-domain.com
    ports: ["3000:3000"]
    depends_on: [postgres]

volumes:
  postgres_data:
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Start all dev servers
npm run dev

# Or run individually
npm run dev --filter=@akur/core
npm run dev --filter=@akur/cli
npm run dev --filter=@akur/registry
npm run dev --filter=@akur/core

# Type checking
npm run typecheck

# Linting
npm run lint

# Testing
npm run test

# Database
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
```

## 📦 Module Development

### Create New Module
```bash
akur module:create my-module --type core
```

### Module Structure
```
my-module/
├── src/
│   ├── index.ts          # Main exports
│   ├── types/            # TypeScript types
│   ├── lib/              # Library functions
│   ├── actions/          # Server Actions
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

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Watch mode
npm run test -- --watch
```

## 📝 Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended + custom rules
- **Prettier**: Configured via `.prettierrc`
- **Conventional Commits**: Required for commit messages

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [Module Development Guide](docs/module-development.md)
- [API Reference](docs/api-reference.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guide](CONTRIBUTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Odoo](https://www.odoo.com/) - Inspiration for modular ERP architecture
- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Zod](https://zod.dev/) - TypeScript-first schema validation

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/fxagro/akur/issues)
- **Discussions**: [GitHub Discussions](https://github.com/fxagro/akur/discussions)
- **Discord**: [Join our community](https://discord.gg/akur)
- **Email**: support@akur.id

---

**Made with ❤️ for Indonesia** 🇮🇩

*Building the first Indonesian ERP that truly understands local business needs.*