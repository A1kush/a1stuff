/**
 * Manifest-driven loader. Reads config/build-manifest.json, hydrates config,
 * and loads dependency scripts in stage order.
 */
const manifestPath = "./config/build-manifest.json";
const INLINE_SELECTOR = "script[data-inline-module]";

async function loadManifest() {
  try {
    const response = await fetch(manifestPath, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Manifest fetch failed: ${response.status}`);
    }
    const json = await response.json();
    window.ModuleRegistry.manifest = json;
    return json;
  } catch (error) {
    console.warn("[Loader] Unable to fetch manifest, falling back to stub", error);
    return window.ModuleRegistry.manifest || { modules: [], legacySegments: [] };
  }
}

function injectScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.type = "module";
    script.onload = () => resolve(script);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

async function loadConfigBridge(path) {
  if (window.GameConfig) return;
  try {
    await injectScript(path);
  } catch (err) {
    console.warn("[Loader] Config bridge failed, falling back to defaults", err);
    window.GameConfig = window.GameConfig || { environment: "unspecified" };
  }
}

async function loadModules(modules) {
  for (const mod of modules) {
    window.ModuleRegistry.register(mod);
    try {
      if (mod.type === "config") {
        await loadConfigBridge(mod.path);
      } else if (mod.type === "script") {
        await injectScript(mod.path);
      } else {
        console.info("[Loader] Skipping unmanaged module type:", mod);
      }
      window.ModuleRegistry.mark(mod.id, "loaded");
    } catch (error) {
      window.ModuleRegistry.mark(mod.id, "error");
      console.error(`[Loader] Failed to load module ${mod.id}`, error);
    }
  }
}

function sortModulesByStage(manifest) {
  const stageOrder = manifest.stages || [];
  return [...manifest.modules].sort((a, b) => {
    return stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage);
  });
}

function warnLegacySegments(legacySegments = []) {
  legacySegments.forEach((legacy) => {
    console.warn(
      `[Loader] Legacy module \"${legacy.id}\" still inline at ${legacy.path}`
    );
    if (window.A1KBus && typeof window.A1KBus.publish === "function") {
      window.A1KBus.publish("loader:legacy-module", legacy);
    }
  });
}

function updateManifestVersionDisplay(version) {
  const node = document.getElementById("manifest-version");
  if (node) {
    node.textContent = `Manifest v${version}`;
  }
}

function collectInlineModules() {
  const scripts = Array.from(document.querySelectorAll(INLINE_SELECTOR));
  return scripts.map((script, index) => {
    const id = script.dataset.inlineModule || `inline-${index}`;
    const stage = script.dataset.inlineStage || "systems";
    const segments = [];
    if (script.dataset.segment) {
      segments.push(script.dataset.segment);
    }
    const entry = {
      id,
      stage,
      segments,
      format: script.dataset.inlineFormat || "module",
      code: script.textContent,
    };
    script.parentNode?.removeChild(script);
    return entry;
  });
}

async function executeInlineModules(entries) {
  for (const entry of entries) {
    window.ModuleRegistry.register({
      id: entry.id,
      stage: entry.stage,
      type: "inline",
      segments: entry.segments,
    });
    try {
      if (entry.format === "module") {
        const blob = new Blob([entry.code], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);
        await import(url);
        URL.revokeObjectURL(url);
      } else {
        // eslint-disable-next-line no-eval
        (0, eval)(entry.code);
      }
      window.ModuleRegistry.mark(entry.id, "loaded");
    } catch (error) {
      window.ModuleRegistry.mark(entry.id, "error");
      console.error(`[Loader] Inline module ${entry.id} failed`, error);
    }
  }
}

async function bootstrap() {
  const manifest = await loadManifest();
  window.ModuleRegistry.manifest = manifest;
  const modules = sortModulesByStage(manifest);
  await loadModules(modules);
  updateManifestVersionDisplay(manifest.version);
  warnLegacySegments(manifest.legacySegments || []);
  const inlineEntries = collectInlineModules();
  const enableInline =
    !window.GameFeatures || window.GameFeatures.inlineLoader !== false;
  if (enableInline && inlineEntries.length) {
    await executeInlineModules(inlineEntries);
  } else if (!enableInline && inlineEntries.length) {
    console.info("[Loader] Inline loader disabled via feature flag");
  }
  window.A1KBus.publish("loader:ready", {
    manifestVersion: manifest.version,
    modulesLoaded: modules.length
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
