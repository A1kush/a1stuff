/**
 * Lightweight overlay that surfaces loader/bus metrics plus HUD/combat health.
 */
(function initProfiler() {
  if (!window.A1KBus) return;

  const container = document.createElement("div");
  container.id = "a1k-debug-overlay";
  Object.assign(container.style, {
    position: "fixed",
    bottom: "12px",
    left: "12px",
    width: "240px",
    fontFamily: "Consolas, monospace",
    fontSize: "11px",
    color: "#00ffc8",
    background: "rgba(0,0,0,0.65)",
    border: "1px solid rgba(0,255,200,0.4)",
    padding: "6px",
    zIndex: 9999,
    display: "none"
  });
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;">
      <span>Loader</span><span id="dbg-loader-status">waiting</span>
    </div>
    <div style="display:flex;justify-content:space-between;">
      <span>Config</span><span id="dbg-config-version">local</span>
    </div>
    <div>Wanted: <span id="dbg-wanted">n/a</span></div>
    <div>Integrity: <span id="dbg-integrity">n/a</span></div>
    <div>FPS (est): <span id="dbg-fps">--</span></div>
    <button id="dbg-snapshot-btn" style="margin-top:6px;width:100%;background:#112;padding:4px;border:1px solid rgba(0,255,200,0.3);color:#00ffc8;cursor:pointer;">
      Snapshot Registry
    </button>
  `;
  document.body.appendChild(container);

  const qp = (id) => container.querySelector(id);
  const fpsNode = qp("#dbg-fps");
  const loaderNode = qp("#dbg-loader-status");
  const configNode = qp("#dbg-config-version");
  const snapshotBtn = qp("#dbg-snapshot-btn");
  let frameCount = 0;
  let lastTime = performance.now();

  function tick() {
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      fpsNode.textContent = (frameCount / ((now - lastTime) / 1000)).toFixed(1);
      frameCount = 0;
      lastTime = now;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  window.A1KBus.subscribe("loader:ready", (payload) => {
    loaderNode.textContent = `v${payload.manifestVersion} (${payload.modulesLoaded})`;
  });
  window.A1KBus.subscribe("hud:wanted:update", (payload) => {
    qp("#dbg-wanted").textContent = `${payload.level.toFixed(2)}★`;
  });
  window.A1KBus.subscribe("hud:integrity:update", (payload) => {
    qp("#dbg-integrity").textContent = `${payload.percent}%`;
  });

  const applyFlags = (flags) => {
    const enabled = flags && flags.debugOverlay !== false;
    container.style.display = enabled ? "block" : "none";
  };

  const syncConfigVersion = (snapshot) => {
    configNode.textContent = snapshot?.config?.version || "n/a";
  };

  if (window.GameConfigManager && typeof window.GameConfigManager.subscribe === "function") {
    window.GameConfigManager.subscribe((snapshot) => {
      applyFlags(snapshot.featureFlags);
      syncConfigVersion(snapshot);
    });
  } else {
    applyFlags(window.GameFeatures || {});
    configNode.textContent = window.GameConfig?.version || "n/a";
  }

  if (snapshotBtn) {
    snapshotBtn.addEventListener("click", () => {
      const dump = window.ModuleRegistry?.snapshot
        ? window.ModuleRegistry.snapshot()
        : { error: "ModuleRegistry snapshot unavailable" };
      console.log("[ModuleRegistry.snapshot]", dump);
    });
  }
})();
