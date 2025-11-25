(function initManifestUtils() {
  const utils = {
    warnInlineAssetCount(bundle) {
      if (!bundle) return;
      const assetCount = bundle?.assetManifest?.assets?.length || 0;
      const warnThreshold = window.MANIFEST_WARN_THRESHOLD || 50;
      if (assetCount > warnThreshold) {
        console.warn(
          `[ManifestUtils] Inline manifest contains ${assetCount} assets. Sync config/build-manifest.json or regenerate bundles.`
        );
      }
    },
  };

  window.ManifestUtils = Object.assign(window.ManifestUtils || {}, utils);
})();
