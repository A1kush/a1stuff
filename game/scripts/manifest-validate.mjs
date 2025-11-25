#!/usr/bin/env node
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const manifestPath = resolve(projectRoot, "config/build-manifest.json");

function loadManifest() {
  try {
    const raw = readFileSync(manifestPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("[manifest] Failed to read manifest:", error.message);
    process.exit(1);
  }
}

function checkModule(mod) {
  if (!mod?.path) return { ok: true };
  if (mod.type === "inline") return { ok: true };
  if (!mod.path.startsWith(".")) return { ok: true };

  const absolutePath = resolve(projectRoot, mod.path);
  const exists = existsSync(absolutePath);
  return {
    ok: exists,
    id: mod.id,
    path: mod.path,
  };
}

function run() {
  const manifest = loadManifest();
  let hasErrors = false;

  manifest.modules.forEach((mod) => {
    const result = checkModule(mod);
    if (!result.ok) {
      hasErrors = true;
      console.error(`[manifest] Missing file for module "${result.id}": ${result.path}`);
    }
  });

  const summary = `[manifest] validated ${manifest.modules.length} modules, ${manifest.legacySegments?.length || 0} legacy segments`;
  if (hasErrors) {
    console.error(summary);
    process.exitCode = 1;
  } else {
    console.log(summary);
  }
}

run();
