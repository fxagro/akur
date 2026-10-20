import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

config();

export default defineConfig({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  schema: "./prisma/schema.prisma",
  migrations: "./prisma/migrations",
  earlyAccess: true,
  generator: {
    provider: "prisma-client",
    output: "../src/generated/prisma",
  },
});