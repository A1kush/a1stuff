/**
 * Runtime configuration bridge.
 * Fetches remote JSON from the FastAPI service and merges it with local defaults.
 * Consumers can subscribe to changes via `window.GameConfigManager.subscribe`.
 */
(function bootstrapConfigBridge() {
  const DEFAULT_CONFIG = {
    version: "local-dev",
    environment: "local",
    build: "dev",
    telemetry: {
      enabled: false,
      endpoint: "http://127.0.0.1:8000/telemetry"
    },
    tuning: {
      xpCurve: [0, 100, 250, 500, 900],
      dropRates: {
        common: 0.65,
        uncommon: 0.25,
        rare: 0.08,
        legendary: 0.02
      }
    }
  };

  const DEFAULT_FLAGS = {
    debugOverlay: true,
    missionBoard: true,
    missionTelemetry: true,
    inlineLoader: true
  };

  const CONFIG_ENDPOINT =
    window.GAME_CONFIG_ENDPOINT || "http://127.0.0.1:8000/config";
  const FLAG_ENDPOINT =
    window.GAME_FEATURE_FLAGS_ENDPOINT || `${CONFIG_ENDPOINT}/flags`;
  const LOCAL_FLAGS_PATH = "./config/feature-flags.json";

  const state = {
    config: { ...DEFAULT_CONFIG },
    featureFlags: { ...DEFAULT_FLAGS }
  };

  const subscribers = new Set();

  function notify(reason) {
    const payload = {
      config: { ...state.config },
      featureFlags: { ...state.featureFlags },
      reason,
      timestamp: Date.now()
    };
    subscribers.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        console.error("[GameConfigManager] subscriber error", err);
      }
    });
    if (window.A1KBus && typeof window.A1KBus.publish === "function") {
      window.A1KBus.publish("config:update", payload);
    }
  }

  async function fetchJson(url) {
    if (!url) return null;
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.warn("[GameConfigManager] fetch failed:", url, error.message);
      return null;
    }
  }

  async function hydrate(emitReason = "hydrate") {
    const [localFlags, remoteConfig, remoteFlags] = await Promise.all([
      fetchJson(LOCAL_FLAGS_PATH),
      fetchJson(CONFIG_ENDPOINT),
      fetchJson(FLAG_ENDPOINT)
    ]);

    if (remoteConfig) {
      state.config = {
        ...state.config,
        ...remoteConfig,
        version: remoteConfig.version || state.config.version
      };
    }

    state.featureFlags = {
      ...DEFAULT_FLAGS,
      ...(localFlags || {}),
      ...(remoteConfig?.featureFlags || {}),
      ...(remoteFlags || {})
    };

    const frozenConfig = {
      ...state.config,
      featureFlags: { ...state.featureFlags }
    };

    window.GameConfig = Object.freeze(frozenConfig);
    window.GameFeatures = Object.freeze({ ...state.featureFlags });

    notify(emitReason);
  }

  window.GameConfigManager = {
    snapshot() {
      return {
        config: { ...state.config },
        featureFlags: { ...state.featureFlags }
      };
    },
    subscribe(handler) {
      if (typeof handler !== "function") return () => {};
      subscribers.add(handler);
      handler(this.snapshot());
      return () => subscribers.delete(handler);
    },
    refresh() {
      return hydrate("manual-refresh");
    }
  };

  const frozenConfig = {
    ...state.config,
    featureFlags: { ...state.featureFlags }
  };
  window.GameConfig = Object.freeze(frozenConfig);
  window.GameFeatures = Object.freeze({ ...state.featureFlags });

  hydrate();
})();
