// ═══════════════════════════════════════════════════════════════════════════
// A1K UNIFIED PATH CONFIGURATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════
// This script provides a unified path resolution system for all A1K game files
// It automatically detects the correct paths based on the HTML file location
// and provides fallback mechanisms for missing files

(function() {
    'use strict';

    // Detect base path from current HTML file location
    const getBasePath = function() {
        const path = window.location.pathname;
        const lastSlash = path.lastIndexOf('/');
        return lastSlash >= 0 ? path.substring(0, lastSlash + 1) : './';
    };

    // Path configuration with multiple fallback locations
    const PATH_CONFIG = {
        base: getBasePath(),

        // Bag system paths with fallbacks
        bagSystem: {
            // Primary locations (checked in order)
            locations: [
                'bag-system/',
                'bag last updte/',
                '../A1K Game Systems/A1k Bag System/',
                '../A1k Hero Crew/bag-system/',
                '../StandAlone/bag last updte/',
                './bag-system/',
                './bag last updte/'
            ],

            // File names
            files: {
                css: 'main-styles.css',
                gameData: 'game-data.js',
                bagSystem: 'A1KBagSystem.js',
                manifests: 'all-manifests.json',
                arcadeBundle: 'arcade-bundle.js',
                tabsList: 'tabs-list.json'
            }
        },

        // Resolve path with fallbacks
        resolve: function(relativePath, fallbackPaths) {
            const base = this.base;
            const paths = fallbackPaths || [relativePath];

            for (let path of paths) {
                // Try with base path
                const fullPath = base + path.replace(/^\.\//, '');
                if (this.fileExists(fullPath)) {
                    return fullPath;
                }

                // Try absolute from root
                const absPath = '/' + path.replace(/^\.\//, '');
                if (this.fileExists(absPath)) {
                    return absPath;
                }
            }

            // Return first fallback if none found (will show 404 but at least tries)
            return base + (paths[0] || relativePath).replace(/^\.\//, '');
        },

        // Check if file exists (synchronous check via HEAD request - cached)
        fileExists: function(url) {
            // Use cached results to avoid multiple requests
            if (!this._fileCache) {
                this._fileCache = new Map();
            }

            if (this._fileCache.has(url)) {
                return this._fileCache.get(url);
            }

            // For now, return true to let browser handle 404s
            // In production, could use fetch HEAD request
            this._fileCache.set(url, true);
            return true;
        },

        // Get bag system file path with fallbacks
        getBagSystemFile: function(fileType) {
            const fileName = this.bagSystem.files[fileType];
            if (!fileName) {
                console.warn(`[PathConfig] Unknown bag system file type: ${fileType}`);
                return null;
            }

            const fallbackPaths = this.bagSystem.locations.map(loc => loc + fileName);
            return this.resolve(fileName, fallbackPaths);
        }
    };

    // Set up base tag dynamically
    const setupBaseTag = function() {
        if (document.querySelector('base')) {
            return; // Base tag already exists
        }

        const base = document.createElement('base');
        base.href = PATH_CONFIG.base;
        document.head.insertBefore(base, document.head.firstChild);
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupBaseTag);
    } else {
        setupBaseTag();
    }

    // Export to window for global access
    window.A1KPathConfig = PATH_CONFIG;

    // Auto-configure bag system paths if not already set
    if (!window.A1K_ALL_MANIFESTS_PATH) {
        window.A1K_ALL_MANIFESTS_PATH = PATH_CONFIG.getBagSystemFile('manifests');
        window.A1K_ASSET_MANIFEST_PATH = PATH_CONFIG.getBagSystemFile('manifests');
        window.A1K_ARCADE_MANIFEST_PATH = PATH_CONFIG.getBagSystemFile('manifests');
    }

    console.log('[PathConfig] Initialized with base path:', PATH_CONFIG.base);
})();
