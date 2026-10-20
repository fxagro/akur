#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import { installModule } from "./commands/install";
import { listModules } from "./commands/list";
import { createModule } from "./commands/create";
import { removeModule } from "./commands/remove";
import { upgrade } from "./commands/upgrade";
import { init } from "./commands/init";

program
  .name("akur")
  .description("Akur ERP - Module Manager CLI")
  .version("0.1.0")
  .option("-v, --verbose", "Enable verbose logging");

program
  .command("init")
  .description("Initialize a new Akur project")
  .option("-n, --name <name>", "Project name")
  .option("-d, --dir <dir>", "Project directory", process.cwd())
  .action(init);

program
  .command("module:install <module>")
  .description("Install a module")
  .option("-v, --version <version>", "Module version")
  .action(installModule);

program
  .command("module:remove <module>")
  .description("Remove a module")
  .option("--force", "Force remove without confirmation")
  .action(removeModule);

program
  .command("module:list")
  .description("List available modules")
  .option("-a, --all", "Show all modules including enterprise")
  .action(listModules);

program
  .command("module:create <name>")
  .description("Create a new module scaffold")
  .option("-t, --type <type>", "Module type (core|enterprise)", "core")
  .option("-d, --dir <dir>", "Output directory", process.cwd())
  .action(createModule);

program
  .command("upgrade")
  .description("Upgrade Akur core and modules")
  .option("-c, --core", "Upgrade core only")
  .option("-m, --modules", "Upgrade modules only")
  .action(upgrade);

program.parse();