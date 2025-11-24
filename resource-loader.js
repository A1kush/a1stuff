// ═══════════════════════════════════════════════════════════════════════════
// A1K RESOURCE LOADER WITH FALLBACKS
// ═══════════════════════════════════════════════════════════════════════════
// Provides robust resource loading with automatic fallbacks and error handling

(function() {
    'use strict';

    const ResourceLoader = {
        // Load CSS with fallback
        loadCSS: function(href, options = {}) {
            return new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.id = options.id || `css-${Date.now()}`;

                // Add onerror handler for fallback
                link.onerror = function() {
                    console.warn(`[ResourceLoader] Failed to load CSS: ${href}`);

                    if (options.fallback) {
                        console.log(`[ResourceLoader] Trying fallback: ${options.fallback}`);
                        ResourceLoader.loadCSS(options.fallback, { ...options, fallback: null })
                            .then(resolve)
                            .catch(() => {
                                if (options.onError) {
                                    options.onError();
                                }
                                resolve(null); // Resolve with null instead of rejecting
                            });
                    } else {
                        if (options.onError) {
                            options.onError();
                        }
                        resolve(null);
                    }
                };

                link.onload = function() {
                    console.log(`[ResourceLoader] CSS loaded: ${href}`);
                    resolve(link);
                };

                document.head.appendChild(link);

                // Timeout fallback
                if (options.timeout) {
                    setTimeout(() => {
                        if (!link.sheet) {
                            link.onerror();
                        }
                    }, options.timeout);
                }
            });
        },

        // Load script with fallback
        loadScript: function(src, options = {}) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = options.async !== false;
                script.defer = options.defer || false;

                script.onerror = function() {
                    console.warn(`[ResourceLoader] Failed to load script: ${src}`);

                    if (options.fallback) {
                        console.log(`[ResourceLoader] Trying fallback: ${options.fallback}`);
                        ResourceLoader.loadScript(options.fallback, { ...options, fallback: null })
                            .then(resolve)
                            .catch(() => {
                                if (options.onError) {
                                    options.onError();
                                }
                                resolve(null);
                            });
                    } else {
                        if (options.onError) {
                            options.onError();
                        }
                        resolve(null);
                    }
                };

                script.onload = function() {
                    console.log(`[ResourceLoader] Script loaded: ${src}`);
                    resolve(script);
                };

                document.head.appendChild(script);

                // Timeout fallback
                if (options.timeout) {
                    setTimeout(() => {
                        if (!script.textContent && !script.src) {
                            script.onerror();
                        }
                    }, options.timeout);
                }
            });
        },

        // Load bag system resources with automatic fallbacks
        loadBagSystem: function() {
            const config = window.A1KPathConfig || {
                getBagSystemFile: function(type) {
                    // Fallback if path config not available
                    const paths = {
                        css: 'bag-system/main-styles.css',
                        gameData: 'bag-system/game-data.js',
                        bagSystem: 'bag-system/A1KBagSystem.js'
                    };
                    return paths[type] || null;
                }
            };

            const promises = [];

            // Load CSS
            const cssPath = config.getBagSystemFile('css') || 'bag-system/main-styles.css';
            promises.push(
                this.loadCSS(cssPath, {
                    id: 'a1k-bag-system-styles',
                    fallback: 'bag last updte/main-styles.css',
                    onError: function() {
                        console.warn('[ResourceLoader] Bag system CSS not found, using inline styles fallback');
                    }
                })
            );

            // Load game-data.js first (required before A1KBagSystem.js)
            const gameDataPath = config.getBagSystemFile('gameData') || 'bag-system/game-data.js';
            promises.push(
                this.loadScript(gameDataPath, {
                    fallback: 'bag last updte/game-data.js',
                    onError: function() {
                        console.warn('[ResourceLoader] game-data.js not found - some features may not work');
                    }
                })
            );

            // Load A1KBagSystem.js after game-data.js
            const bagSystemPath = config.getBagSystemFile('bagSystem') || 'bag-system/A1KBagSystem.js';
            promises.push(
                this.loadScript(bagSystemPath, {
                    fallback: 'bag last updte/A1KBagSystem.js',
                    onError: function() {
                        console.warn('[ResourceLoader] A1KBagSystem.js not found - bag system will not function');
                    }
                })
            );

            return Promise.all(promises);
        }
    };

    // Export to window
    window.A1KResourceLoader = ResourceLoader;

    // Auto-load bag system if flag is set
    if (window.A1K_AUTO_LOAD_BAG_SYSTEM !== false) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                ResourceLoader.loadBagSystem();
            });
        } else {
            ResourceLoader.loadBagSystem();
        }
    }

    console.log('[ResourceLoader] Initialized');
})();
