#!/usr/bin/env node

/**
 * Akur CLI - Module Manager untuk Akur ERP
 * Tanpa dependensi eksternal (zero-dependency).
 */

import { init } from "./commands/init";
import { installModule } from "./commands/install";
import { removeModule } from "./commands/remove";
import { listModules } from "./commands/list";
import { createModule } from "./commands/create";
import { upgrade } from "./commands/upgrade";
import { HELP_TEXT } from "./help";

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  let command = "";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith("--")) {
      const [key, inlineValue] = arg.slice(2).split("=");
      if (inlineValue !== undefined) {
        flags[key!] = inlineValue;
      } else if (argv[i + 1] && !argv[i + 1]!.startsWith("-")) {
        flags[key!] = argv[++i]!;
      } else {
        flags[key!] = true;
      }
    } else if (arg.startsWith("-") && arg.length > 1) {
      const key = arg.slice(1);
      if (argv[i + 1] && !argv[i + 1]!.startsWith("-")) {
        flags[key] = argv[++i]!;
      } else {
        flags[key] = true;
      }
    } else if (!command) {
      command = arg;
    } else {
      positional.push(arg);
    }
  }

  return { command, positional, flags };
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const { command, positional, flags } = parseArgs(argv);

  if (!command || flags.help || flags.h) {
    console.log(HELP_TEXT);
    return;
  }

  if (flags.version || flags.v) {
    console.log("akur v0.1.0");
    return;
  }

  switch (command) {
    case "init":
      await init({ name: flags.name, dir: flags.dir, flags });
      break;
    case "module:install":
      await installModule({ moduleName: positional[0] ?? "", version: flags.version, flags });
      break;
    case "module:remove":
      await removeModule({ moduleName: positional[0] ?? "", force: flags.force === true, flags });
      break;
    case "module:list":
      await listModules({ all: flags.all === true, flags });
      break;
    case "module:create":
      await createModule({ name: positional[0] ?? "", type: flags.type, dir: flags.dir, flags });
      break;
    case "upgrade":
      await upgrade({ core: flags.core === true, modules: flags.modules === true, flags });
      break;
    default:
      console.error(`Perintah tidak dikenal: ${command}`);
      console.log(HELP_TEXT);
      process.exitCode = 1;
  }
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  (process.argv[1].endsWith("index.js") || process.argv[1].endsWith("akur.js"));

if (isDirectRun) {
  main().catch((error) => {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}