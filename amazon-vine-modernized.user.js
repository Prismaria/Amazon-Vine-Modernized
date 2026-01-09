// ==UserScript==
// @name         Amazon Vine Modernized
// @namespace    http://tampermonkey.net/
// @version      0.4.8
// @description  Modernizes the Amazon Vine UI for a cleaner, more accessible experience. Now with smart cloud sync!
// @author       Your Name
// @match        https://www.amazon.com/vine*
// @match        https://www.amazon.ca/vine*
// @match        https://www.amazon.co.uk/vine*
// @match        https://www.amazon.de/vine*
// @match        https://www.amazon.fr/vine*
// @match        https://www.amazon.it/vine*
// @match        https://www.amazon.es/vine*
// @match        https://www.amazon.in/vine*
// @match        https://www.amazon.com.au/vine*
// @match        https://www.amazon.com.br/vine*
// @match        https://www.amazon.com.mx/vine*
// @match        https://www.amazon.nl/vine*
// @match        https://www.amazon.pl/vine*
// @match        https://www.amazon.sg/vine*
// @match        https://www.amazon.tr/vine*
// @match        https://www.amazon.ae/vine*
// @match        https://www.amazon.se/vine*
// @match        https://www.amazon.sa/vine*
// @match        https://www.amazon.be/vine*
// @match        https://www.amazon.eg/vine*
// @match        https://www.amazon.cn/vine*
// @match        https://www.amazon.jp/vine*
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @run-at       document-start
// @resource     sleekCSS https://raw.githubusercontent.com/PrismarisTech/Amazon-Vine-Modernized/active-dev/amazon-vine-sleek-dark-theme-standalone.user.css?r=7bd5
// @connect      www.amazon.com
// @connect      www.amazon.ca
// @connect      www.amazon.co.uk
// @connect      www.amazon.de
// @connect      www.amazon.fr
// @connect      www.amazon.it
// @connect      www.amazon.es
// @connect      www.amazon.in
// @connect      www.amazon.com.au
// @connect      www.amazon.com.br
// @connect      www.amazon.com.mx
// @connect      www.amazon.nl
// @connect      www.amazon.pl
// @connect      www.amazon.sg
// @connect      www.amazon.tr
// @connect      www.amazon.ae
// @connect      www.amazon.se
// @connect      www.amazon.sa
// @connect      www.amazon.be
// @connect      www.amazon.eg
// @connect      www.amazon.cn
// @connect      www.amazon.jp
// @connect      pastebin.com
// @connect      api.vinehelper.ovh
// ==/UserScript==

(function () {
    'use strict';

    const EARLY_THEME_STYLE_ID = 'vh-early-theme-style';
    const VM_CSS_THEMING_CRITICAL = `
        :root { color-scheme: light; }
        body { background: #f6f6f6 !important; color: #111 !important; }
        #a-page { background: transparent !important; }
    `;

    function stripMozDocumentWrapper(css) {
        if (!css || !css.includes('@-moz-document')) return css;
        let cleaned = css.replace(/@-moz-document[^{]*\{/, '');
        cleaned = cleaned.replace(/}\s*$/, '');
        return cleaned;
    }

    function removeEarlyThemeStyle() {
        const existing = document.getElementById(EARLY_THEME_STYLE_ID);
        if (existing) {
            existing.remove();
        }
    }

    function injectEarlyThemeCss() {
        const isDark = localStorage.getItem('vvp_sleek_dark_theme') === 'true';
        document.documentElement.setAttribute('data-vm-theme', isDark ? 'dark' : 'light');

        let css = isDark ? GM_getResourceText('sleekCSS') : VM_CSS_THEMING_CRITICAL;
        css = stripMozDocumentWrapper(css);
        if (!css || document.getElementById(EARLY_THEME_STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = EARLY_THEME_STYLE_ID;
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    }

    injectEarlyThemeCss();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMain, { once: true });
    } else {
        initMain();
    }

    function initMain() {
        // --- Set custom tab title based on URL, with delay to avoid override ---
        (function setCustomTabTitle() {
            const path = window.location.pathname;
            const searchParams = new URLSearchParams(window.location.search);
            let customTitle = null;
            if (path === '/vine/vine-reviews') {
                customTitle = 'Vine – Reviews';
            } else if (path === '/vine/orders') {
                customTitle = 'Vine – Orders';
            } else if (path === '/vine/account') {
                customTitle = 'Vine – Account';
            } else if (path === '/vine/resources') {
                customTitle = 'Vine – Resources';
            } else if (path === '/vine/vine-items') {
                const queue = searchParams.get('queue');
                if (queue === 'potluck') {
                    customTitle = 'Vine - RFY';
                } else if (queue === 'last_chance') {
                    customTitle = 'Vine - AFA';
                } else if (queue === 'encore') {
                    customTitle = 'Vine - AI';
                } else {
                    customTitle = 'Vine - Home';
                }
            }
            if (customTitle) {
                setTimeout(() => { document.title = customTitle; }, 1500);
            }
        })();

        // --- ROOT PAGE CLEANUP ---
        (function handleRootPageCleanup() {
            // Check if we're on the exact root page (no query params, no hash)
            function isRootPage() {
                const url = window.location.href;
                // Use current origin to support all Amazon domains (.com, .ca, .co.uk, etc.)
                const rootUrl = `${window.location.origin}/vine/vine-items`;
                // Check if URL matches root exactly (no query params, no hash, trailing slash optional)
                return url === rootUrl || url === rootUrl + '/';
            }

            function performRootPageCleanup() {
                if (!isRootPage()) return;

                // Clear contents of .a-section.vvp-items-container (but keep the container)
                const itemsContainer = document.querySelector('.a-section.vvp-items-container');
                if (itemsContainer) {
                    itemsContainer.innerHTML = '';
                    console.log('Vine Modernized: Cleared contents of .a-section.vvp-items-container on root page');
                }

                // Change button class from a-button-selected to a-button-normal
                const allButton = document.getElementById('vvp-items-button--all');
                if (allButton) {
                    if (allButton.classList.contains('a-button-selected')) {
                        allButton.classList.remove('a-button-selected');
                        allButton.classList.add('a-button-normal');
                        console.log('Vine Modernized: Changed vvp-items-button--all from a-button-selected to a-button-normal');
                    }
                }
            }

            // Wait for DOM to be ready and elements to exist
            function waitForElementsAndCleanup(attempt = 0) {
                const itemsContainer = document.querySelector('.a-section.vvp-items-container');
                const allButton = document.getElementById('vvp-items-button--all');

                if (itemsContainer || allButton) {
                    performRootPageCleanup();
                } else if (attempt < 20) {
                    setTimeout(() => waitForElementsAndCleanup(attempt + 1), 250);
                }
            }

            // Run on initial load
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => waitForElementsAndCleanup());
            } else {
                waitForElementsAndCleanup();
            }

            // Also run on navigation (in case of dynamic updates)
            window.addEventListener('popstate', () => {
                if (isRootPage()) {
                    setTimeout(() => waitForElementsAndCleanup(), 100);
                }
            });

            // Watch for URL changes (for SPA-like navigation)
            let lastUrl = window.location.href;
            const checkUrlChange = setInterval(() => {
                const currentUrl = window.location.href;
                if (currentUrl !== lastUrl) {
                    lastUrl = currentUrl;
                    if (isRootPage()) {
                        setTimeout(() => waitForElementsAndCleanup(), 100);
                    }
                }
            }, 100);
        })();

        // --- REMOVE EWC NAV FLYOUT (CART POPOVER) ON VINE PAGES ---
        (function removeEwcFlyout() {
            const TARGET_SELECTORS = [
                '#nav-flyout-ewc',
                '#ewc-smart-wagon-desktop-sideSheet',
                '#ewc-smart-wagon-popover-lgtbox',
                '.ewc-compact-wrap',
                '.ewc-compact',
                '.dummy-content-for-ewc',
            ];
            const CLASS_TARGETS = [
                'nav-ewc-compact-view',
                'nav-ewc-full-height-persistent-hover',
                'nav-ewc-persistent-hover',
            ];
            let observer = null;

            function removeIfPresent(root = document) {
                let removed = false;
                for (const selector of TARGET_SELECTORS) {
                    root.querySelectorAll(selector).forEach((el) => {
                        el.remove();
                        removed = true;
                    });
                }

                [document.documentElement, document.body, document.getElementById('navbar')]
                    .filter(Boolean)
                    .forEach((el) => {
                        CLASS_TARGETS.forEach((cls) => el.classList.remove(cls));
                    });

                return removed;
            }

            function startObserver() {
                if (observer || !document.body) return;
                observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                        for (const node of mutation.addedNodes) {
                            if (node && node.nodeType === 1) {
                                if (removeIfPresent(node)) return;
                            }
                        }
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    removeIfPresent();
                    startObserver();
                });
            } else {
                removeIfPresent();
                startObserver();
            }
        })();

        // --- MAIN DOCUMENT HORIZONTAL SCROLLBAR GUARD ---
        // Goal: prevent the *document-level* horizontal scrollbar unless content is truly protruding.
        function ensureNoMainHorizontalScrollbar(options = {}) {
            const CLASS = 'vh-no-main-x-scroll';
            const STYLE_ID = 'vh-no-main-x-scroll-style';

            const conspicuousPx = Number.isFinite(options.conspicuousPx) ? options.conspicuousPx : 40; // ~2× scrollbar width
            const pollMs = Number.isFinite(options.pollMs) ? options.pollMs : 2500;
            const log = options.log === true;

            let debounceTimer = null;
            let rafId = null;
            let intervalId = null;

            function ensureStyle() {
                if (document.getElementById(STYLE_ID)) return;
                const style = document.createElement('style');
                style.id = STYLE_ID;
                style.textContent = `
                html.${CLASS}, html.${CLASS} body { overflow-x: hidden !important; }
                @supports (overflow-x: clip) {
                    html.${CLASS}, html.${CLASS} body { overflow-x: clip !important; }
                }
            `;
                (document.head || document.documentElement).appendChild(style);
            }

            function getOverflowDeltaPx() {
                const de = document.documentElement;
                const body = document.body;
                if (!de) return 0;

                const docDelta = Math.max(0, Math.ceil(de.scrollWidth - de.clientWidth));
                const bodyDelta = body ? Math.max(0, Math.ceil(body.scrollWidth - body.clientWidth)) : 0;
                return Math.max(docDelta, bodyDelta);
            }

            function apply() {
                ensureStyle();
                const html = document.documentElement;
                if (!html) return 0;

                const delta = getOverflowDeltaPx();
                const shouldAllow = delta > conspicuousPx;

                if (shouldAllow) {
                    html.classList.remove(CLASS);
                    if (log) console.warn('Vine Modernized: [WARN] Horizontal overflow detected; allowing horizontal scroll.', { delta });
                } else {
                    html.classList.add(CLASS);
                }
                return delta;
            }

            function scheduleApply() {
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    if (rafId) cancelAnimationFrame(rafId);
                    rafId = requestAnimationFrame(() => apply());
                }, 75);
            }

            // Default behavior: hide doc-level horizontal scrolling immediately, then re-evaluate after layout.
            ensureStyle();
            document.documentElement?.classList.add(CLASS);
            scheduleApply();

            window.addEventListener('resize', scheduleApply, { passive: true });
            window.addEventListener('orientationchange', scheduleApply, { passive: true });
            window.addEventListener('load', scheduleApply, { passive: true });
            window.addEventListener('popstate', scheduleApply);

            if (pollMs > 0) intervalId = setInterval(scheduleApply, pollMs);

            return {
                apply,
                scheduleApply,
                disconnect() {
                    if (debounceTimer) clearTimeout(debounceTimer);
                    if (rafId) cancelAnimationFrame(rafId);
                    if (intervalId) clearInterval(intervalId);
                    debounceTimer = null;
                    rafId = null;
                    intervalId = null;
                },
            };
        }

        // Enable globally for all Vine pages (prevents common 100vw/rounding overflow causing a phantom scrollbar).
        ensureNoMainHorizontalScrollbar({ conspicuousPx: 40, pollMs: 2500, log: false });

        // --- CONFIGURATION ---
        const ENABLE_FAVORITES_FEATURE = true;
        const ENABLE_INFINITE_SCROLL = true; // Set to false to disable infinite scrolling
        const INFINITE_SCROLL_TRIGGER_OFFSET = 500; // Load when 500px from the bottom
        const ENABLE_AUTO_OPEN_ADDITIONAL_ITEMS = false; // Set to true to re-enable, but may cause page reloads
        const USE_MODERN_SEARCH_SHADOW = true; // or false

        let g_lastClickedItemData = null; // To hold data of the item being viewed in modal

        // --- PASTEBIN CONFIGURATION FOR FAVORITES ---
        const PASTEBIN_FAVORITES_PASTE_NAME = 'Amazon Vine Favorites';
        const PASTEBIN_FEED_BACKUP_PASTE_NAME = 'Amazon Vine Feed Backup';
        const PASTEBIN_RECOVERY_PASTE_NAME = 'Vine - Account Token';
        const PASTEBIN_DAILY_LIMIT = 20;
        const PASTEBIN_WARNING_THRESHOLD = 15;
        const PASTEBIN_AUTO_DISABLE_THRESHOLD = 18;
        const PASTEBIN_TOTAL_PASTE_LIMIT = 25;
        const PASTEBIN_TOTAL_PASTE_WARNING = 20;
        const PASTEBIN_LOGIN_URL = 'https://pastebin.com/api/api_login.php';
        const PASTEBIN_POST_URL = 'https://pastebin.com/api/api_post.php';
        const PASTEBIN_DEFAULT_AVATAR_URL = '/themes/pastebin/img/guest.png';
        const FAVORITES_INACTIVITY_THRESHOLD = 1800000; // 30 minutes in milliseconds
        let g_favoritesHasUnsavedChanges = false;
        let g_favoritesSyncInProgress = false;
        let g_favoritesChangedCount = 0;
        let g_hasSessionAutoSynced = false; // Track if we've done session auto-sync
        let g_favoritesInactivityTimeout = null; // Timer for inactivity-based sync

        // --- PASTEBIN HELPER FUNCTIONS ---

        // Quota tracking functions
        function getSyncQuota() {
            const today = new Date().toDateString();
            const stored = localStorage.getItem('vine_favorites_sync_quota');
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    // Reset if it's a new day
                    if (data.date !== today) {
                        return { date: today, count: 0 };
                    }
                    return data;
                } catch (e) {
                    console.error('Vine Modernized: Failed to parse sync quota:', e);
                }
            }
            return { date: today, count: 0 };
        }

        function incrementSyncQuota() {
            const quota = getSyncQuota();
            quota.count++;
            localStorage.setItem('vine_favorites_sync_quota', JSON.stringify(quota));
            return quota.count;
        }

        function canAutoSync() {
            const quota = getSyncQuota();
            const autoSyncEnabled = localStorage.getItem('vine_favorites_auto_sync') === 'true';
            return autoSyncEnabled &&
                isPastebinConfigured() &&
                quota.count < PASTEBIN_AUTO_DISABLE_THRESHOLD;
        }

        // Dedicated gate for NM feed auto-sync (separate from Favorites)
        function canAutoSyncFeed() {
            const quota = getSyncQuota();
            const autoSyncEnabled = localStorage.getItem('vine_feed_backup_auto_sync') === 'true';
            return autoSyncEnabled &&
                isPastebinConfigured() &&
                quota.count < PASTEBIN_AUTO_DISABLE_THRESHOLD;
        }

        function getAutoSyncFeedGateReason() {
            const reasons = [];
            const quota = getSyncQuota();
            const autoSyncEnabled = localStorage.getItem('vine_feed_backup_auto_sync') === 'true';
            if (!autoSyncEnabled) reasons.push('auto-sync toggle is OFF');
            if (!isPastebinConfigured()) reasons.push('Pastebin not configured');
            if (quota.count >= PASTEBIN_AUTO_DISABLE_THRESHOLD) reasons.push(`daily quota reached (${quota.count}/${PASTEBIN_DAILY_LIMIT})`);
            return reasons.length ? reasons.join(', ') : 'unknown reason';
        }

        function getQuotaWarningMessage() {
            const quota = getSyncQuota();
            if (quota.count >= PASTEBIN_WARNING_THRESHOLD) {
                return `⚠️ ${quota.count}/${PASTEBIN_DAILY_LIMIT} syncs used today`;
            }
            return null;
        }

        function loadPastebinConfig() {
            // First try to load from shared key (amazon_pastebin_config)
            let stored = localStorage.getItem('amazon_pastebin_config');

            // If not found, try to migrate from old key (vine_pastebin_config)
            if (!stored) {
                const oldStored = localStorage.getItem('vine_pastebin_config');
                if (oldStored) {
                    // Migrate old config to new shared key
                    localStorage.setItem('amazon_pastebin_config', oldStored);
                    stored = oldStored;
                    console.log('Vine Modernized: Migrated Pastebin config from vine_pastebin_config to amazon_pastebin_config');
                }
            }

            if (stored) {
                try {
                    return JSON.parse(stored);
                } catch (e) {
                    console.error('Vine Modernized: Failed to parse Pastebin config:', e);
                }
            }
            return {
                api_dev_key: null,
                api_user_key: null,
                api_user_name: null,
                api_user_password: null,
                api_user_key_paste_id: null
            };
        }

        function savePastebinConfig(config) {
            try {
                // Use shared key for compatibility with amazon-review-textbox-tools.user.js
                localStorage.setItem('amazon_pastebin_config', JSON.stringify(config));
                console.log('Vine Modernized: Pastebin config saved');
            } catch (e) {
                console.error('Vine Modernized: Failed to save Pastebin config:', e);
            }
        }

        async function generatePastebinUserKey(apiDevKey, username, password) {
            if (!apiDevKey) {
                throw new Error('API Dev Key is required to generate User Key');
            }

            const params = new URLSearchParams({
                api_dev_key: apiDevKey,
                api_user_name: username,
                api_user_password: password
            });

            console.log('Vine Modernized: Generating Pastebin User Key for username:', username);

            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: PASTEBIN_LOGIN_URL,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: params.toString(),
                    onload: (response) => {
                        const result = response.responseText.trim();
                        console.log('Vine Modernized: Pastebin login response:', result);

                        if (response.status === 200) {
                            // Check for API errors
                            if (result.startsWith('Bad API request')) {
                                console.error('Vine Modernized: Pastebin login failed:', result);
                                reject(new Error(`Login failed: ${result}`));
                                return;
                            }

                            // Check if response looks like a valid user key (32 character hex string)
                            if (result.length === 32 && /^[a-f0-9]+$/i.test(result)) {
                                console.log('Vine Modernized: Successfully generated User Key');
                                resolve(result);
                            } else {
                                console.error('Vine Modernized: Unexpected login response format:', result);
                                reject(new Error('Invalid response from Pastebin login API'));
                            }
                        } else {
                            reject(new Error(`HTTP ${response.status}`));
                        }
                    },
                    onerror: (error) => {
                        console.error('Vine Modernized: Pastebin login request failed:', error);
                        reject(new Error('Network error during login. Please check your internet connection.'));
                    }
                });
            });
        }

        function isPastebinConfigured() {
            const config = loadPastebinConfig();
            const hasDevKey = !!config.api_dev_key;
            if (hasDevKey) {
                console.log('Vine Modernized: Pastebin configured with dev key length:', config.api_dev_key.length);
            }
            return hasDevKey;
        }

        function getPastebinAuthErrorHint(error) {
            const msg = String(error?.message || error || '').toLowerCase();
            if (!msg) return '';
            if (msg.includes('api_user_key') && (msg.includes('invalid') || msg.includes('not valid') || msg.includes('expired'))) {
                return 'Pastebin API User Key appears invalid or expired. Open Pastebin Settings to regenerate or update it.';
            }
            if (msg.includes('api_dev_key') && msg.includes('invalid')) {
                return 'Pastebin API Dev Key appears invalid. Re-check your Pastebin API key in settings.';
            }
            return '';
        }

        async function attemptPastebinKeyRecovery() {
            const config = loadPastebinConfig();
            if (!config.api_user_key_paste_id) {
                console.log('Vine Modernized: Cannot attempt key recovery - No Recovery Paste ID configured.');
                return false;
            }

            console.log('Vine Modernized: Attempting to recover User Key from Paste ID:', config.api_user_key_paste_id);

            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `https://pastebin.com/raw/${config.api_user_key_paste_id}`,
                    onload: (response) => {
                        if (response.status === 200) {
                            try {
                                const encoded = response.responseText.trim();
                                const decoded = atob(encoded);
                                if (decoded.length === 32 && /^[a-f0-9]+$/i.test(decoded)) {
                                    console.log('Vine Modernized: Successfully recovered User Key from cloud.');
                                    config.api_user_key = decoded;
                                    savePastebinConfig(config);
                                    resolve(true);
                                } else {
                                    console.error('Vine Modernized: Recovered data does not look like a valid User Key.');
                                    resolve(false);
                                }
                            } catch (e) {
                                console.error('Vine Modernized: Failed to decode recovered User Key:', e);
                                resolve(false);
                            }
                        } else {
                            console.error('Vine Modernized: Failed to fetch recovery paste. Status:', response.status);
                            resolve(false);
                        }
                    },
                    onerror: (err) => {
                        console.error('Vine Modernized: Recovery request failed:', err);
                        resolve(false);
                    }
                });
            });
        }

        async function pastebinRequest(data, isRetry = false) {
            const params = new URLSearchParams(data);
            console.log('Vine Modernized: [DEBUG] pastebinRequest starting...', { option: data.api_option, name: data.api_paste_name, isRetry });

            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: PASTEBIN_POST_URL,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: params.toString(),
                    timeout: 30000, // 30 second timeout
                    onload: async (response) => {
                        console.log('Vine Modernized: [DEBUG] pastebinRequest onload', { status: response.status });
                        if (response.status === 200) {
                            const text = response.responseText.trim();
                            if (text.startsWith('Bad API request')) {
                                console.error('Vine Modernized: [DEBUG] pastebinRequest Bad API request:', text);

                                // Check for invalid user key and attempt recovery if not already retrying
                                if (!isRetry && text.includes('api_user_key') && (text.includes('invalid') || text.includes('expired'))) {
                                    console.log('Vine Modernized: Invalid User Key detected. Triggering auto-recovery...');
                                    const recovered = await attemptPastebinKeyRecovery();
                                    if (recovered) {
                                        console.log('Vine Modernized: Key recovered. Retrying request...');
                                        const newConfig = loadPastebinConfig();
                                        data.api_user_key = newConfig.api_user_key;
                                        try {
                                            const retryResult = await pastebinRequest(data, true);
                                            resolve(retryResult);
                                        } catch (retryError) {
                                            reject(retryError);
                                        }
                                        return;
                                    }
                                }

                                reject(new Error(text));
                            } else {
                                resolve(text);
                            }
                        } else {
                            // Include response text for better debugging
                            const errorMsg = `HTTP ${response.status}${response.responseText ? ': ' + response.responseText : ''}`;
                            console.error('Vine Modernized: Pastebin API error:', errorMsg);
                            reject(new Error(errorMsg));
                        }
                    },
                    onerror: (err) => {
                        console.error('Vine Modernized: [DEBUG] pastebinRequest onerror:', err);
                        reject(err);
                    },
                    ontimeout: () => {
                        console.error('Vine Modernized: [DEBUG] pastebinRequest timed out');
                        reject(new Error('Pastebin request timed out'));
                    }
                });
            });
        }

        // --- COMPRESSION UTILITIES ---
        const PASTE_COMPRESSION_MARKER = '__COMPRESSED_V1__\n';

        // Minimal LZ-String base64 (subset) fallback implementation
        // Source adapted from pieroxy/lz-string (public domain-like license)
        const LZString = (() => {
            const f = String.fromCharCode;
            const keyStrBase64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            const getBaseValue = (alphabet, character) => alphabet.indexOf(character);
            return {
                compressToBase64: function (input) {
                    if (input == null) return '';
                    let res = '';
                    let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                    let i = 0;
                    const bytes = new TextEncoder().encode(input);
                    while (i < bytes.length) {
                        chr1 = bytes[i++];
                        chr2 = i < bytes.length ? bytes[i++] : NaN;
                        chr3 = i < bytes.length ? bytes[i++] : NaN;
                        enc1 = chr1 >> 2;
                        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                        enc4 = chr3 & 63;
                        if (isNaN(chr2)) { enc3 = enc4 = 64; }
                        else if (isNaN(chr3)) { enc4 = 64; }
                        res += keyStrBase64.charAt(enc1) + keyStrBase64.charAt(enc2) + keyStrBase64.charAt(enc3) + keyStrBase64.charAt(enc4);
                    }
                    return res;
                },
                decompressFromBase64: function (input) {
                    if (!input) return '';
                    let i = 0, output = [];
                    let enc1, enc2, enc3, enc4;
                    while (i < input.length) {
                        enc1 = getBaseValue(keyStrBase64, input.charAt(i++));
                        enc2 = getBaseValue(keyStrBase64, input.charAt(i++));
                        enc3 = getBaseValue(keyStrBase64, input.charAt(i++));
                        enc4 = getBaseValue(keyStrBase64, input.charAt(i++));
                        const chr1 = (enc1 << 2) | (enc2 >> 4);
                        const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                        const chr3 = ((enc3 & 3) << 6) | enc4;
                        output.push(chr1);
                        if (enc3 !== 64) output.push(chr2);
                        if (enc4 !== 64) output.push(chr3);
                    }
                    return new TextDecoder().decode(new Uint8Array(output));
                }
            };
        })();

        function getCompressionCtors() {
            // Try multiple realms (userscript sandbox vs page context)
            const g = (typeof unsafeWindow !== 'undefined' && unsafeWindow) || (typeof window !== 'undefined' && window) || globalThis;
            const CS = (typeof CompressionStream !== 'undefined' && CompressionStream) || (g && g.CompressionStream);
            const DS = (typeof DecompressionStream !== 'undefined' && DecompressionStream) || (g && g.DecompressionStream);
            return { CS, DS };
        }

        function hasGzipWebStreamsSupport() {
            const { CS, DS } = getCompressionCtors();
            return (typeof CS === 'function' && typeof DS === 'function');
        }

        // Helper: Safe Uint8Array → base64 without using spread/apply (prevents call stack overflow on large arrays)
        function base64FromBytes(bytes) {
            const lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            let base64 = '';
            const len = bytes.length;
            let i;
            for (i = 0; i + 2 < len; i += 3) {
                const triple = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
                base64 +=
                    lookup[(triple >> 18) & 63] +
                    lookup[(triple >> 12) & 63] +
                    lookup[(triple >> 6) & 63] +
                    lookup[triple & 63];
            }
            if (i < len) {
                const byte1 = bytes[i];
                const byte2 = (i + 1 < len) ? bytes[i + 1] : 0;
                const triple = (byte1 << 16) | (byte2 << 8);
                base64 +=
                    lookup[(triple >> 18) & 63] +
                    lookup[(triple >> 12) & 63] +
                    (i + 1 < len ? lookup[(triple >> 6) & 63] : '=') +
                    '=';
            }
            return base64;
        }

        // Compress string to base64 using GZIP when available. If GZIP is not available, throw so callers can fallback.
        async function compressString(str) {
            const useGzip = hasGzipWebStreamsSupport();
            try {
                if (useGzip) {
                    const encoder = new TextEncoder();
                    const data = encoder.encode(str);
                    const stream = new ReadableStream({
                        start(controller) {
                            controller.enqueue(data);
                            controller.close();
                        }
                    });
                    const { CS } = getCompressionCtors();
                    const compressedStream = stream.pipeThrough(new CS('gzip'));
                    const chunks = [];
                    const reader = compressedStream.getReader();
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        chunks.push(value);
                    }
                    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
                    const combined = new Uint8Array(totalLength);
                    let offset = 0;
                    for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.length; }
                    // Use safe encoder to avoid RangeError: Maximum call stack size exceeded
                    const base64 = base64FromBytes(combined);
                    return PASTE_COMPRESSION_MARKER + 'ALG:GZIP\n' + base64;
                }
            } catch (e) {
                console.warn('Vine Modernized: GZIP compression failed:', e);
            }
            // No supported compression available in this environment
            throw new Error('Compression not supported in this browser environment');
        }

        // Decompress base64 to string (supports GZIP via Web Streams and LZ fallback)
        async function decompressString(compressedStr) {
            // Check for compression marker
            if (!compressedStr.startsWith(PASTE_COMPRESSION_MARKER)) {
                // Not compressed, return as-is (backwards compatibility)
                return compressedStr;
            }

            // After marker, try to detect algorithm header line: ALG:<NAME>\n
            let rest = compressedStr.slice(PASTE_COMPRESSION_MARKER.length);
            let algorithm = 'GZIP';
            if (rest.startsWith('ALG:')) {
                const nl = rest.indexOf('\n');
                if (nl !== -1) {
                    algorithm = rest.slice(4, nl).trim().toUpperCase();
                    rest = rest.slice(nl + 1);
                }
            }

            if (algorithm === 'LZ') {
                try {
                    return LZString.decompressFromBase64(rest);
                } catch (e) {
                    console.error('Vine Modernized: LZ decompression failed:', e);
                    throw new Error('LZ decompression failed: ' + e.message);
                }
            }

            // Default: GZIP
            // Decode base64 (be lenient with stored/legacy payloads)
            const cleaned = String(rest || '').replace(/\s+/g, '').replace(/={3,}$/, '==');
            const binaryString = atob(cleaned);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            if (!hasGzipWebStreamsSupport()) {
                throw new Error('GZIP decompression not supported in this browser environment');
            }

            // Decompress (Web Streams)
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(bytes);
                    controller.close();
                }
            });
            const { DS } = getCompressionCtors();
            const decompressedStream = stream.pipeThrough(new DS('gzip'));
            const chunks = [];
            const reader = decompressedStream.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }
            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const combined = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.length; }
            const decoder = new TextDecoder();
            return decoder.decode(combined);
        }

        // Compute a stable signature of feed items (works with compressed/uncompressed backup objects)
        async function computeFeedSignatureAsync(backupObject) {
            try {
                if (!backupObject || typeof backupObject !== 'object') return '';
                let items = [];
                let raw = backupObject.items;
                if (Array.isArray(raw)) {
                    items = raw;
                } else if (typeof raw === 'string' && raw.startsWith(PASTE_COMPRESSION_MARKER)) {
                    try {
                        const jsonStr = await decompressString(raw);
                        const parsed = JSON.parse(jsonStr);
                        if (Array.isArray(parsed)) items = parsed;
                    } catch (_) { /* ignore, fallthrough */ }
                } else if (Array.isArray(backupObject.feed)) items = backupObject.feed;
                else if (Array.isArray(backupObject.list)) items = backupObject.list;
                else if (Array.isArray(backupObject.data)) items = backupObject.data;

                if (!Array.isArray(items) || items.length === 0) return '';

                const stableIdFromHtmlString = (html) => {
                    try {
                        const s = String(html || '');
                        // Prefer ASINs (stable across refreshes) over entire HTML (which can change due to injected buttons/attributes).
                        let m = s.match(/data-asin=["']([A-Z0-9]{10})["']/i);
                        if (m && m[1]) return `ASIN:${m[1].toUpperCase()}`;
                        // Notification Monitor id pattern
                        m = s.match(/vh-notification-([A-Z0-9]{10})/i);
                        if (m && m[1]) return `ASIN:${m[1].toUpperCase()}`;
                        // Common product URL patterns
                        m = s.match(/\/dp\/([A-Z0-9]{10})/i) || s.match(/\/gp\/product\/([A-Z0-9]{10})/i);
                        if (m && m[1]) return `ASIN:${m[1].toUpperCase()}`;
                        return '';
                    } catch {
                        return '';
                    }
                };

                const ids = items.map((it) => {
                    if (it == null) return '';
                    if (typeof it === 'string') {
                        const stable = stableIdFromHtmlString(it);
                        return stable || String(it);
                    }
                    if (typeof it === 'number') return String(it);
                    const asin = it.asin || it.ASIN;
                    const offer = it.offerId || it.offerID || it.offer_id;
                    const id = it.id || it.productId || it.productID || it.sku || it.SKU;
                    const url = it.url || it.link || it.detailPageURL;
                    const key = asin || offer || id || url;
                    if (key) return String(key);
                    try {
                        const minimal = { asin: asin || undefined, id: id || undefined, offer: offer || undefined, title: it.title || undefined };
                        return JSON.stringify(minimal);
                    } catch { return ''; }
                });
                ids.sort();
                const joined = ids.join('\n');
                let hash = 5381;
                for (let i = 0; i < joined.length; i++) { hash = ((hash << 5) + hash) + joined.charCodeAt(i); hash |= 0; }
                return (hash >>> 0).toString(16);
            } catch {
                return '';
            }
        }

        // Generic function to create or update a paste (used by favorites and feed backups)
        async function createOrUpdatePaste(pasteName, content, storageKeyPrefix, useCompression = false) {
            const config = loadPastebinConfig();
            if (!config.api_dev_key || !config.api_user_key) {
                throw new Error('Pastebin not configured (missing API keys)');
            }

            // Check original content size
            const originalSizeKB = new Blob([content]).size / 1024;
            console.log(`Vine Modernized: [DEBUG] createOrUpdatePaste: ${pasteName}, Size: ${originalSizeKB.toFixed(2)} KB`);

            let finalContent = content;
            let finalSizeKB = originalSizeKB;

            // Compress the content if requested
            if (useCompression) {
                try {
                    const compressedContent = await compressString(content);
                    const compressedSizeKB = new Blob([compressedContent]).size / 1024;
                    const compressionRatio = ((1 - compressedSizeKB / originalSizeKB) * 100).toFixed(1);
                    // Try to detect algorithm header
                    let algo = 'UNKNOWN';
                    if (typeof compressedContent === 'string' && compressedContent.startsWith(PASTE_COMPRESSION_MARKER)) {
                        const rest = compressedContent.slice(PASTE_COMPRESSION_MARKER.length);
                        if (rest.startsWith('ALG:')) {
                            const nl = rest.indexOf('\n');
                            if (nl !== -1) algo = rest.slice(4, nl).trim();
                        }
                    }
                    console.log(`Vine Modernized: Compressed size: ${compressedSizeKB.toFixed(2)} KB (${compressionRatio}% reduction) via ${algo}`);

                    finalContent = compressedContent;
                    finalSizeKB = compressedSizeKB;
                } catch (compressErr) {
                    console.warn('Vine Modernized: Compression unavailable, proceeding without compression for paste content.', compressErr);
                    // Fall back to uncompressed content; finalSizeKB remains originalSizeKB
                }
            }

            // Check if final size exceeds Pastebin limit
            if (finalSizeKB > 512) {
                // Emit detailed debug logs for diagnosis
                const detail = {
                    pasteName,
                    originalSizeKB: Number(originalSizeKB.toFixed(2)),
                    finalSizeKB: Number(finalSizeKB.toFixed(2)),
                    useCompression,
                    limitKB: 512,
                    note: useCompression ? 'Compression attempted but still too large or compression unavailable' : 'No compression requested or available'
                };
                console.error('Vine Modernized: [QUOTA] Pastebin size limit exceeded', detail);

                const errorMsg = useCompression
                    ? `Content too large even after compression (${finalSizeKB.toFixed(0)} KB compressed from ${originalSizeKB.toFixed(0)} KB). `
                    : `Content too large for Pastebin free account (${finalSizeKB.toFixed(0)} KB). `;

                throw new Error(
                    errorMsg +
                    `Pastebin free accounts have a 512 KB limit. Consider: ` +
                    `1) Using local Export/Import instead, 2) Upgrading to Pastebin PRO (10MB limit), ` +
                    `or 3) Creating smaller backups with fewer items.`
                );
            }

            // Try to find existing paste first
            const existingPaste = await findPaste(pasteName, storageKeyPrefix);

            if (existingPaste) {
                // Update existing paste (delete + recreate)
                const data = {
                    api_dev_key: config.api_dev_key,
                    api_user_key: config.api_user_key,
                    api_option: 'paste',
                    api_paste_code: finalContent,
                    api_paste_name: pasteName,
                    api_paste_format: 'json',
                    api_paste_private: '1', // Unlisted
                    api_paste_expire_date: 'N' // Never expire
                };

                // Delete old paste and create new one (Pastebin doesn't have direct update API)
                try {
                    await deletePastebinPaste(existingPaste.key);
                } catch (e) {
                    console.warn('Vine Modernized: Failed to delete old paste:', e);
                }

                const pasteUrl = await pastebinRequest(data);
                const pasteKey = pasteUrl.split('/').pop();

                // Store paste info and increment quota
                localStorage.setItem(`${storageKeyPrefix}_paste_key`, pasteKey);
                localStorage.setItem(`${storageKeyPrefix}_last_sync`, Date.now().toString());
                incrementSyncQuota();

                return pasteKey;
            } else {
                // Create new paste
                const data = {
                    api_dev_key: config.api_dev_key,
                    api_user_key: config.api_user_key,
                    api_option: 'paste',
                    api_paste_code: finalContent,
                    api_paste_name: pasteName,
                    api_paste_format: 'json',
                    api_paste_private: '1',
                    api_paste_expire_date: 'N'
                };

                const pasteUrl = await pastebinRequest(data);
                const pasteKey = pasteUrl.split('/').pop();

                localStorage.setItem(`${storageKeyPrefix}_paste_key`, pasteKey);
                localStorage.setItem(`${storageKeyPrefix}_last_sync`, Date.now().toString());
                incrementSyncQuota();

                return pasteKey;
            }
        }

        // Wrapper function for favorites (backwards compatibility) - NO compression for human readability
        async function createOrUpdateFavoritesPaste(content) {
            return await createOrUpdatePaste(PASTEBIN_FAVORITES_PASTE_NAME, content, 'vine_favorites', false);
        }

        async function deletePastebinPaste(pasteKey, overrideDevKey = null, overrideUserKey = null) {
            const config = loadPastebinConfig();
            const data = {
                api_dev_key: overrideDevKey || config.api_dev_key,
                api_user_key: overrideUserKey || config.api_user_key,
                api_option: 'delete',
                api_paste_key: pasteKey
            };
            return await pastebinRequest(data);
        }

        async function getPastebinPaste(pasteKey) {
            const url = `https://pastebin.com/raw/${pasteKey}`;
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    onload: async (response) => {
                        if (response.status === 200) {
                            // Decompress if needed (handles both compressed and uncompressed pastes)
                            try {
                                let rawText = response.responseText;

                                // Strip comment header if present (starts with /* and ends with */)
                                // We use a simple check since the comment is always at the start
                                if (rawText.trim().startsWith('/*')) {
                                    const commentEndIndex = rawText.indexOf('*/');
                                    if (commentEndIndex !== -1) {
                                        rawText = rawText.substring(commentEndIndex + 2).trim();
                                    }
                                }

                                const decompressed = await decompressString(rawText);
                                resolve(decompressed);
                            } catch (err) {
                                console.error('Vine Modernized: Decompression failed:', err);
                                reject(new Error(`Failed to decompress paste: ${err.message}`));
                            }
                        } else {
                            reject(new Error(`HTTP ${response.status}`));
                        }
                    },
                    onerror: (err) => reject(err)
                });
            });
        }

        async function listUserPastes(overrideDevKey = null, overrideUserKey = null) {
            const config = loadPastebinConfig();
            const data = {
                api_dev_key: overrideDevKey || config.api_dev_key,
                api_user_key: overrideUserKey || config.api_user_key,
                api_option: 'list',
                api_results_limit: '100'
            };

            const xml = await pastebinRequest(data);
            console.log('Vine Modernized: [DEBUG] listUserPastes response received');
            // console.log('Vine Modernized: Pastebin API response:', xml);

            // Wrap the XML in a root element since Pastebin returns multiple <paste> elements without a wrapper
            const wrappedXml = `<pastes>${xml}</pastes>`;

            const parser = new DOMParser();
            const doc = parser.parseFromString(wrappedXml, 'text/xml');
            const pastes = [];

            doc.querySelectorAll('paste').forEach(paste => {
                const key = paste.querySelector('paste_key')?.textContent || '';
                const title = paste.querySelector('paste_title')?.textContent || '';
                const date = paste.querySelector('paste_date')?.textContent || '';
                const privacy = paste.querySelector('paste_private')?.textContent || '0';
                console.log('Vine Modernized: Found paste - key:', key, 'title:', title, 'privacy:', privacy);
                pastes.push({ key, title, date, privacy });
            });

            const unlistedCount = pastes.filter(p => p.privacy === '1').length;
            console.log('Vine Modernized: [DEBUG] Paste count - Total:', pastes.length, 'Unlisted:', unlistedCount);
            try { localStorage.setItem('vine_pastebin_total_count', unlistedCount.toString()); } catch (e) { }
            return pastes;
        }

        // Generic function to find a paste by name (used by favorites and feed backups)
        async function findPaste(pasteName, storageKeyPrefix) {
            try {
                console.log('Vine Modernized: [DEBUG] findPaste starting for:', pasteName);
                const pastes = await listUserPastes();
                const targetPaste = pastes.find(p => p.title === pasteName);

                if (targetPaste) {
                    console.log('Vine Modernized: Found paste:', targetPaste);
                    return targetPaste;
                }

                console.log('Vine Modernized: Paste not found in list, checking localStorage');
                // Fallback: check stored key
                const storedKey = localStorage.getItem(`${storageKeyPrefix}_paste_key`);
                if (storedKey) {
                    console.log('Vine Modernized: Using stored key:', storedKey);
                    return { key: storedKey, title: pasteName, date: '' };
                }

                console.log('Vine Modernized: No paste found anywhere');
                return null;
            } catch (e) {
                console.error('Vine Modernized: Failed to find paste:', e);
                return null;
            }
        }

        // Wrapper function for favorites (backwards compatibility)
        async function findFavoritesPaste() {
            return await findPaste(PASTEBIN_FAVORITES_PASTE_NAME, 'vine_favorites');
        }

        // Helper function to format timestamp as readable date/time string
        function formatDateTime(ts) {
            try {
                const d = new Date(ts);
                return d.toLocaleString();
            } catch { return String(ts); }
        }

        function createGenericUserSVG(size = 48) {
            return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="#999" style="display:block;">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>`;
        }

        async function fetchPastebinProfilePic(username) {
            if (!username) return null;

            const cacheKey = `pb_avatar_${username}`;
            try {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) return cached;
            } catch (e) { }

            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `https://pastebin.com/u/${username}`,
                    onload: (response) => {
                        try {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(response.responseText, 'text/html');
                            const img = doc.querySelector('.user-icon img');
                            if (img) {
                                const src = img.getAttribute('src');
                                const finalUrl = (src === PASTEBIN_DEFAULT_AVATAR_URL) ? 'DEFAULT' : (src.startsWith('http') ? src : `https://pastebin.com${src}`);
                                try { sessionStorage.setItem(cacheKey, finalUrl); } catch (e) { }
                                resolve(finalUrl);
                            } else {
                                resolve('DEFAULT');
                            }
                        } catch (e) {
                            resolve('DEFAULT');
                        }
                    },
                    onerror: () => resolve('DEFAULT')
                });
            });
        }

        // Wrapper functions for feed backups - WITH compression to reduce size
        async function syncFeedBackupToCloud(backupObject) {
            // Compute a stable signature to prevent uploading identical content from non-milestone triggers
            const LS_LAST_SIGNATURE_KEY = 'vine_nm_feed_last_backup_sig';

            function getLastSignature() {
                try { return localStorage.getItem(LS_LAST_SIGNATURE_KEY) || ''; } catch { return ''; }
            }
            function setLastSignature(sig) {
                try { localStorage.setItem(LS_LAST_SIGNATURE_KEY, sig || ''); } catch { }
            }

            const signature = await computeFeedSignatureAsync(backupObject);
            if (signature) {
                const lastSig = getLastSignature();
                if (signature === lastSig) {
                    console.log('Vine Modernized: [INFO] syncFeedBackupToCloud skipped — feed unchanged.');
                    // Return the most recent paste key if available; otherwise null to signal skip
                    const existingKey = localStorage.getItem('vine_feed_backup_paste_key');
                    return existingKey || null;
                }
            }

            // Generate timestamped paste name for this backup
            const timestamp = backupObject.timestamp || Date.now();
            const formattedDate = formatDateTime(timestamp);
            const pasteName = `Vine Feed Backup - ${formattedDate}`;
            console.log('Vine Modernized: [DEBUG] syncFeedBackupToCloud starting...', { pasteName });

            // Add important comment at the top explaining what this backup is
            const comment = `/*
 * FYI:
 * What you are seeing here is a large JSON file encoded in Base64,
 * containing Amazon product listings from the Amazon Vine Program.
 *
 * It is strictly used for cloud synchronization and restoration of
 * feed items from the Vine Helper's notification monitor page.
 *
 * Vine Helper is a browser extension for the Amazon Vine Program.
 *
 * This backup was created automatically and is essential for restoring
 * the feed. Please refrain from reporting this paste as spam. Thank you!
 */\n\n`;

            const jsonContent = JSON.stringify(backupObject, null, 2);
            const content = comment + jsonContent;

            let pasteKey = null;
            try {
                pasteKey = await createOrUpdatePaste(
                    pasteName,  // Timestamped name (creates new paste each time)
                    content,
                    'vine_feed_backup',  // Storage key prefix (stores latest paste key)
                    true  // Enable compression for feed backups
                );
            } catch (e) {
                console.error('Vine Modernized: Paste sync failed:', e);
                throw e;
            }

            // Record the signature only after a successful sync
            if (signature) setLastSignature(signature);

            // --- BACKUP ROTATION: Keep only the 5 most recent backups to stay within the 25 total unlisted paste limit ---
            try {
                const pastes = await listUserPastes(); // This also updates the total count in localStorage
                const feedBackups = pastes
                    .filter(p => p.title.startsWith('Vine Feed Backup - '))
                    .sort((a, b) => parseInt(b.date) - parseInt(a.date)); // Sort newest first based on Pastebin date

                if (feedBackups.length > 5) {
                    const toDelete = feedBackups.slice(5);
                    console.log(`Vine Modernized: Cleaning up ${toDelete.length} old feed backups to stay within account limit.`);
                    for (const oldPaste of toDelete) {
                        try {
                            await deletePastebinPaste(oldPaste.key);
                            console.log(`Vine Modernized: Deleted old backup: ${oldPaste.title}`);
                        } catch (e) {
                            console.warn('Vine Modernized: Failed to delete old backup during rotation:', e);
                        }
                    }
                    // Refresh count after deletions
                    await listUserPastes();
                }
                // Trigger UI update if menu is open
                updateSyncStatus();
            } catch (e) {
                console.warn('Vine Modernized: Backup rotation failed:', e);
            }

            return pasteKey;
        }

        async function syncFeedBackupFromCloud() {
            // Find the most recent backup using the list function
            const cloudBackups = await listCloudBackups();

            if (cloudBackups.length === 0) {
                throw new Error('No feed backup found in cloud');
            }

            // Get the most recent one (listCloudBackups sorts by date desc)
            const latestBackup = cloudBackups[0];
            console.log(`Vine Modernized: Restoring latest backup: ${latestBackup.title}`);

            const content = await getPastebinPaste(latestBackup.key);
            return JSON.parse(content);
        }

        // List all feed backup pastes from cloud
        async function listCloudBackups() {
            const pastes = await listUserPastes();
            // Filter for feed backup pastes (start with "Vine Feed Backup - ")
            const backupPastes = pastes.filter(p => p.title.startsWith('Vine Feed Backup - '));

            // Sort by date (newest first)
            backupPastes.sort((a, b) => parseInt(b.date) - parseInt(a.date));

            return backupPastes;
        }

        // Restore multiple backups from cloud
        async function restoreCloudBackups() {
            const cloudPastes = await listCloudBackups();

            if (cloudPastes.length === 0) {
                throw new Error('No feed backups found in cloud');
            }

            // Fetch and parse all backup pastes
            const backups = [];
            for (const paste of cloudPastes) {
                try {
                    const content = await getPastebinPaste(paste.key);
                    const backup = JSON.parse(content);
                    backups.push(backup);
                } catch (error) {
                    console.error(`Vine Modernized: Failed to fetch backup ${paste.title}:`, error);
                }
            }

            return backups;
        }

        // Sync all local backups to cloud
        async function syncAllBackupsToCloud() {
            const backups = getMonitorFeedBackups();

            if (backups.length === 0) {
                throw new Error('No backups to sync');
            }

            let successCount = 0;
            let errorCount = 0;
            let skippedCount = 0;

            for (const backup of backups) {
                try {
                    const key = await syncFeedBackupToCloud(backup);
                    if (key) successCount++; else skippedCount++;
                } catch (error) {
                    console.error(`Vine Modernized: Failed to sync backup ${backup.name}:`, error);
                    errorCount++;
                }
            }

            return { successCount, skippedCount, errorCount, total: backups.length };
        }


        async function testPastebinConnection() {
            const config = loadPastebinConfig();
            if (!config.api_dev_key) {
                throw new Error('No API Dev Key configured');
            }

            // Test by listing pastes (requires user key if available)
            if (config.api_user_key) {
                await listUserPastes();
            } else {
                // Just verify the dev key format is valid
                if (!/^[a-zA-Z0-9_-]+$/.test(config.api_dev_key)) {
                    throw new Error('API Dev Key format appears invalid');
                }
            }

            return true;
        }

        // --- MONITOR HEADER MINIMIZE FEATURE ---
        (function initMonitorMinimizeFeature() {
            const STORAGE_KEY = 'vine_monitor_minimized';
            const HEADER_ID = 'vh-notifications-monitor-header-ui';
            const HEADER_ROW_CLASS = 'vh-header-row';
            const MINIMIZED_CLASS = 'vh-minimized';

            function isMinimized() {
                return localStorage.getItem(STORAGE_KEY) === 'true';
            }

            function setMinimized(state) {
                localStorage.setItem(STORAGE_KEY, state);
                // Keep specialized MiniBar keys in sync
                try {
                    const isMin = state === 'true';
                    localStorage.setItem('vine_nm_header_barminimized', isMin ? '1' : '0');
                    localStorage.setItem('vine_nm_header_minimized', isMin ? '1' : '0');
                    localStorage.setItem('vine_nm_header_minimized_bool', String(isMin));
                } catch { }
            }

            function toggleMonitorMinimize() {
                const header = document.getElementById(HEADER_ID);
                if (!header) return;

                const currentState = header.classList.contains(MINIMIZED_CLASS);
                const newState = !currentState;

                if (newState) {
                    enableMinimize(header);
                } else {
                    disableMinimize(header);
                }
            }

            function enableMinimize(header) {
                header.classList.add(MINIMIZED_CLASS);
                setMinimized('true');

                // Move status elements to header row
                const headerRow = header.querySelector(`.${HEADER_ROW_CLASS}`);
                const statusMode = document.getElementById('statusSW');
                const statusConn = document.getElementById('statusWS');

                if (headerRow && statusMode && statusConn) {
                    // Create a container for statuses if it doesn't exist, to keep them grouped
                    let statusContainer = headerRow.querySelector('.vh-minimized-status-container');
                    if (!statusContainer) {
                        statusContainer = document.createElement('div');
                        statusContainer.className = 'vh-minimized-status-container';
                        statusContainer.style.display = 'flex';
                        statusContainer.style.gap = '15px';
                        statusContainer.style.marginLeft = 'auto'; // Push to right
                        statusContainer.style.alignItems = 'center';
                        headerRow.appendChild(statusContainer);
                    }

                    statusContainer.appendChild(statusMode);
                    statusContainer.appendChild(statusConn);
                }
            }

            function disableMinimize(header) {
                header.classList.remove(MINIMIZED_CLASS);
                setMinimized('false');

                // Restore status elements
                const statusMode = document.getElementById('statusSW');
                const statusConn = document.getElementById('statusWS');

                // Restore to: <div style="..." data-vvp-hide-observer="true">
                const originalContainer = header.querySelector('div[data-vvp-hide-observer="true"]');

                if (originalContainer && statusMode && statusConn) {
                    // Mode goes first
                    originalContainer.insertBefore(statusMode, originalContainer.firstChild);
                    // Connection goes after Mode
                    originalContainer.insertBefore(statusConn, statusMode.nextSibling);

                    // Remove the temporary container from header row if empty
                    const headerRow = header.querySelector(`.${HEADER_ROW_CLASS}`);
                    const statusContainer = headerRow?.querySelector('.vh-minimized-status-container');
                    if (statusContainer) {
                        statusContainer.remove();
                    }
                }
            }

            function injectMinimizeButton(header) {
                if (header.querySelector('.vh-minimize-btn')) return;

                const btn = document.createElement('div');
                btn.className = 'vh-minimize-btn';
                btn.title = 'Minimize/Maximize Header';
                btn.setAttribute('tabindex', '0');
                btn.setAttribute('role', 'button');
                btn.innerHTML = '<div class="vh-minimize-icon"></div>';

                // Use the Mini Bar toggler when available; fall back to legacy toggler if present
                const handleToggle = () => {
                    try {
                        if (window.VHMiniBar && typeof window.VHMiniBar.toggle === 'function') {
                            window.VHMiniBar.toggle();
                        } else if (typeof toggleMonitorMinimize === 'function') {
                            toggleMonitorMinimize();
                        }
                    } catch (e) { /* no-op */ }
                };

                btn.addEventListener('click', handleToggle);
                btn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(); }
                });

                // Insert as first child of header
                header.insertBefore(btn, header.firstChild);
            }

            // Watch for header appearance
            let legacyObsInitialized = false;
            const observer = new MutationObserver(() => {
                const header = document.getElementById(HEADER_ID);
                if (header && !legacyObsInitialized) {
                    injectMinimizeButton(header);

                    // Apply initial state if needed (and not already applied)
                    if (isMinimized()) {
                        // Prefer new Mini Bar engine if available; otherwise defer to its own boot
                        if (window.VHMiniBar && typeof window.VHMiniBar.set === 'function') {
                            try {
                                if (!window.VHMiniBar.isMinimized || !window.VHMiniBar.isMinimized()) {
                                    window.VHMiniBar.set(true);
                                }
                            } catch { }
                        }
                    }

                    // Done with legacy bootstrapping; disconnect to avoid repeated work on every DOM mutation
                    legacyObsInitialized = true;
                    try { observer.disconnect(); } catch { }
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            // Initial check
            const header = document.getElementById(HEADER_ID);
            if (header) {
                injectMinimizeButton(header);
                if (isMinimized()) {
                    if (window.VHMiniBar && typeof window.VHMiniBar.set === 'function') {
                        try {
                            if (!window.VHMiniBar.isMinimized || !window.VHMiniBar.isMinimized()) {
                                window.VHMiniBar.set(true);
                            }
                        } catch { }
                    }
                }
            }
        })();

        // --- MONITOR TILE SCALE CONTROLS (+/-) ---
        // Adds +/- buttons to a-tabs (before search container) to scale item tiles dynamically across all vine-items pages.
        // Each queue page has its own sizing state (encore and encore#monitor share the same state).
        (function initMonitorTileScaleControls() {
            const STORAGE_KEY_PREFIX = 'vine_tile_scale_';
            const CSS_VAR = '--vh-monitor-tile-scale';
            const CONTROLS_ID = 'vh-monitor-tile-scale-controls';
            const SEARCH_CONTAINER_ID = 'vvp-tabs-search-container';

            const STEP = 0.1;
            const MIN = 0.6;
            const MAX = 1.6;

            function clampScale(value) {
                if (!Number.isFinite(value)) return 1;
                return Math.min(MAX, Math.max(MIN, value));
            }

            function roundScale(value) {
                // Keep storage stable and avoid float drift
                return Math.round(value * 100) / 100;
            }

            // Get normalized queue name (encore and encore#monitor share the same state)
            function getQueueKey() {
                const queue = new URLSearchParams(window.location.search).get('queue');
                const hash = window.location.hash;
                // encore and encore#monitor share the same state
                if (queue === 'encore') {
                    return 'encore#monitor';
                }
                return queue || 'default';
            }

            function getStorageKey() {
                return STORAGE_KEY_PREFIX + getQueueKey();
            }

            function readScale() {
                try {
                    const raw = localStorage.getItem(getStorageKey());
                    const n = raw == null ? 1 : parseFloat(raw);
                    return clampScale(Number.isFinite(n) ? n : 1);
                } catch {
                    return 1;
                }
            }

            function writeScale(value) {
                try { localStorage.setItem(getStorageKey(), String(value)); } catch { }
            }

            function applyScale(value) {
                try {
                    if (!document.body) {
                        return;
                    }
                    document.body.style.setProperty(CSS_VAR, String(value));
                    // Map scale to a step for title clamping.
                    let step = 'normal';
                    if (value >= 1.19) {
                        step = 'large';
                    } else if (value <= 0.61) {
                        step = 'xs';
                    } else if (value <= 0.71) {
                        step = 'small';
                    }

                    document.body.setAttribute('data-vh-scale-step', step);
                    document.body.classList.remove('vh-tile-scale-large');
                } catch (e) {
                    // Silently fail if scale cannot be applied
                }
            }

            let minusBtn = null;
            let plusBtn = null;

            function updateButtons() {
                if (!minusBtn || !plusBtn) return;
                const value = readScale();
                const pct = Math.round(value * 100);

                minusBtn.disabled = value <= (MIN + 0.0001);
                plusBtn.disabled = value >= (MAX - 0.0001);

                minusBtn.title = `Decrease item tile size (${pct}%)`;
                plusBtn.title = `Increase item tile size (${pct}%)`;
            }

            function setScale(next) {
                const value = roundScale(clampScale(next));
                writeScale(value);
                applyScale(value);
                updateButtons();
            }

            function ensureControls() {
                // Only work on vine-items pages
                if (window.location.pathname !== '/vine/vine-items') return;

                const tabs = document.querySelector('body .a-tabs[data-action="a-tabs"]');
                if (!tabs) return;

                let container = document.getElementById(CONTROLS_ID);
                if (!container) {
                    container = document.createElement('li');
                    container.id = CONTROLS_ID;
                    container.className = 'vh-control-buttons vh-monitor-tile-scale-controls';

                    const minus = document.createElement('input');
                    minus.type = 'button';
                    minus.value = '−';
                    minus.setAttribute('aria-label', 'Decrease item tile size');
                    minus.dataset.vhAction = 'tileScaleMinus';
                    minus.addEventListener('click', () => setScale(readScale() - STEP));

                    const plus = document.createElement('input');
                    plus.type = 'button';
                    plus.value = '+';
                    plus.setAttribute('aria-label', 'Increase item tile size');
                    plus.dataset.vhAction = 'tileScalePlus';
                    plus.addEventListener('click', () => setScale(readScale() + STEP));

                    container.append(minus, plus);

                    minusBtn = minus;
                    plusBtn = plus;
                } else {
                    minusBtn = container.querySelector('input[data-vh-action="tileScaleMinus"]');
                    plusBtn = container.querySelector('input[data-vh-action="tileScalePlus"]');
                }

                // Place controls between the search container and theme toggle when possible.
                const searchContainer = document.getElementById(SEARCH_CONTAINER_ID);
                const themeToggle = document.getElementById('vvp-theme-toggle-container');
                if (themeToggle && themeToggle.parentElement === tabs) {
                    if (container.parentElement !== tabs || container.nextSibling !== themeToggle) {
                        tabs.insertBefore(container, themeToggle);
                    }
                } else if (searchContainer && searchContainer.parentElement === tabs) {
                    if (container.parentElement !== tabs || searchContainer.nextSibling !== container) {
                        tabs.insertBefore(container, searchContainer.nextSibling);
                    }
                } else if (container.parentElement !== tabs) {
                    tabs.appendChild(container);
                }

                updateButtons();
            }

            function boot() {
                // Only work on vine-items pages
                if (window.location.pathname !== '/vine/vine-items') {
                    return;
                }
                const scale = readScale();
                applyScale(scale);
                ensureControls();
            }

            const bodyObserver = new MutationObserver(() => ensureControls());
            function startObserver() {
                try { bodyObserver.observe(document.body, { childList: true, subtree: true }); } catch { }
            }

            window.addEventListener('hashchange', boot);
            window.addEventListener('popstate', boot);
            window.addEventListener('load', boot);

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => { boot(); startObserver(); });
            } else {
                boot();
                startObserver();
            }

            // Also apply scale when body is ready (in case script runs before body exists)
            if (!document.body) {
                const bodyObserver = new MutationObserver((mutations, obs) => {
                    if (document.body) {
                        obs.disconnect();
                        boot();
                    }
                });
                bodyObserver.observe(document.documentElement, { childList: true, subtree: true });
            }
        })();

        // --- NM FEED BACKUP TRIGGER (every 250 items) ---
        // This section adds a hardcoded trigger to perform NM feed backups at
        // every 250 items processed (e.g., 250, 500, 750, ...), while obeying
        // existing feed backup rules (cloud quota, throttling handled upstream).
        (function initNmFeedBackupTrigger() {
            const LS_LAST_MULTIPLE_KEY = 'vine_nm_feed_last_backup_multiple';
            const LS_LAST_TRIGGER_TS_KEY = 'vine_nm_feed_last_backup_ts';
            const LS_LAST_SIGNATURE_KEY = 'vine_nm_feed_last_backup_sig';
            const MULTIPLE = 250;
            const MIN_DEBOUNCE_MS = 30_000; // simple debounce to avoid rapid repeats

            // Helper to get last backed multiple (0 if none)
            function getLastMultiple() {
                const raw = localStorage.getItem(LS_LAST_MULTIPLE_KEY);
                const n = raw ? parseInt(raw, 10) : 0;
                return Number.isFinite(n) && n >= 0 ? n : 0;
            }

            function setLastMultiple(m) {
                try { localStorage.setItem(LS_LAST_MULTIPLE_KEY, String(m)); } catch { }
            }

            function getLastTriggerTs() {
                const raw = localStorage.getItem(LS_LAST_TRIGGER_TS_KEY);
                const n = raw ? parseInt(raw, 10) : 0;
                return Number.isFinite(n) && n > 0 ? n : 0;
            }

            function setLastTriggerTs(ts) {
                try { localStorage.setItem(LS_LAST_TRIGGER_TS_KEY, String(ts)); } catch { }
            }

            function getLastSignature() {
                try { return localStorage.getItem(LS_LAST_SIGNATURE_KEY) || ''; } catch { return ''; }
            }

            function setLastSignature(sig) {
                try { localStorage.setItem(LS_LAST_SIGNATURE_KEY, sig || ''); } catch { }
            }

            // Compute a stable signature of the feed items so we don't back up identical data
            // Uses a simple, fast djb2 hash over a canonicalized list of item identifiers
            function computeFeedSignature(backupObject) {
                if (!backupObject || typeof backupObject !== 'object') return '';

                // Try common containers
                let items = [];
                if (Array.isArray(backupObject.items)) items = backupObject.items;
                else if (Array.isArray(backupObject.feed)) items = backupObject.feed;
                else if (Array.isArray(backupObject.list)) items = backupObject.list;
                else if (Array.isArray(backupObject.data)) items = backupObject.data;

                if (!Array.isArray(items) || items.length === 0) return '';

                // Extract stable identifiers
                const ids = items.map((it) => {
                    if (it == null) return '';
                    if (typeof it === 'string' || typeof it === 'number') return String(it);
                    // Prefer stable product identifiers if available
                    const asin = it.asin || it.ASIN;
                    const offer = it.offerId || it.offerID || it.offer_id;
                    const id = it.id || it.productId || it.productID || it.sku || it.SKU;
                    const url = it.url || it.link || it.detailPageURL;
                    const key = asin || offer || id || url;
                    if (key) return String(key);
                    // Fallback: a minimal, stable subset
                    try {
                        // Avoid huge blobs by picking a subset of fields
                        const minimal = {
                            asin: asin || undefined,
                            id: id || undefined,
                            offer: offer || undefined,
                            title: it.title || undefined,
                        };
                        return JSON.stringify(minimal);
                    } catch { return ''; }
                });

                // Canonicalize order to avoid order-only changes
                ids.sort();
                const joined = ids.join('\n');

                // djb2 hash
                let hash = 5381;
                for (let i = 0; i < joined.length; i++) {
                    hash = ((hash << 5) + hash) + joined.charCodeAt(i);
                    // Force 32-bit
                    hash = hash | 0;
                }
                // Return unsigned hex
                return (hash >>> 0).toString(16);
            }

            // Public API so other scripts/pages can signal item count updates and provide a backup snapshot
            // Usage: window.VineFeedBackup.triggerIfNeeded(totalCount, backupObject)
            async function triggerIfNeeded(totalCount, backupObject) {
                try {
                    if (!Number.isFinite(totalCount) || totalCount <= 0) return;

                    const now = Date.now();
                    const lastTs = getLastTriggerTs();
                    if (now - lastTs < MIN_DEBOUNCE_MS) {
                        return; // debounce
                    }

                    const currentMultiple = Math.floor(totalCount / MULTIPLE);
                    const lastMultiple = getLastMultiple();

                    if (currentMultiple > lastMultiple) {
                        // Only trigger on exact boundaries (250, 500, ...)
                        if (totalCount % MULTIPLE === 0) {
                            if (!backupObject || typeof backupObject !== 'object') {
                                console.warn('Vine Modernized: Feed backup trigger called without a valid backup object. Skipping.');
                                return;
                            }
                            // Compute signature and skip if unchanged
                            const signature = await computeFeedSignatureAsync(backupObject);
                            if (!signature) {
                                console.log('Vine Modernized: Backup skipped - no items found to sign.');
                                return;
                            }
                            const lastSig = getLastSignature();
                            if (signature === lastSig) {
                                console.log('Vine Modernized: Backup skipped - feed unchanged since last backup.');
                                setLastMultiple(currentMultiple); // still advance multiple to avoid re-check loop at same boundary
                                setLastTriggerTs(now);
                                return;
                            }

                            // Ensure a timestamp exists for naming, but let upstream sync handle quotas/throttles
                            if (!backupObject.timestamp) backupObject.timestamp = now;

                            console.log(`Vine Modernized: Triggering NM feed backup at ${totalCount} items (multiple ${currentMultiple}×${MULTIPLE}).`);
                            try {
                                await syncFeedBackupToCloud(backupObject);
                                setLastMultiple(currentMultiple);
                                setLastTriggerTs(now);
                                setLastSignature(signature);
                            } catch (err) {
                                console.error('Vine Modernized: Feed backup sync failed:', err);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Vine Modernized: triggerIfNeeded error:', e);
                }
            }

            // Optional helper to reset tracking (manual use only)
            function resetCounter() {
                setLastMultiple(0);
                setLastTriggerTs(0);
                setLastSignature('');
            }

            // Expose minimal API
            window.VineFeedBackup = Object.freeze({
                triggerIfNeeded,
                resetCounter,
                multiple: MULTIPLE
            });
        })();

        function openAdditionalItemsTab() {
            const tabBtn = Array.from(document.querySelectorAll('button, a')).find(
                el => el.textContent && el.textContent.trim().toLowerCase().includes('additional items')
            );

            if (tabBtn && !tabBtn.classList.contains('a-active')) {
                tabBtn.click();
                console.log('Amazon Vine Modernized: Additional Items tab clicked');
            }
        }

        // Handle navigation bar visibility based on mouse position
        let navShowTimeout = null;
        let isNearTop = false;

        function handleNavVisibility(e) {
            const navElements = document.querySelectorAll('#navbar, #nav-belt, #nav-main');

            // Check if mouse is over vvp-header-links-container or vvp-logo-link
            const headerLinks = document.querySelector('.vvp-header-links-container');
            const logoLink = document.querySelector('#vvp-logo-link');
            const isOverHeaderElement = (headerLinks && headerLinks.contains(e.target)) ||
                (logoLink && logoLink.contains(e.target));

            // Don't show nav if hovering over header elements
            if (isOverHeaderElement) {
                isNearTop = false;
                if (navShowTimeout) {
                    clearTimeout(navShowTimeout);
                    navShowTimeout = null;
                }
                navElements.forEach(nav => {
                    nav.classList.remove('show-nav');
                });
                return;
            }

            const wasNearTop = isNearTop;
            isNearTop = e.clientY <= 50; // Show nav when mouse is within 50px of top

            if (isNearTop && !wasNearTop) {
                // Mouse just entered the top area - start 0.5-second timer
                navShowTimeout = setTimeout(() => {
                    navElements.forEach(nav => {
                        nav.classList.add('show-nav');
                    });
                }, 500); // 0.5 second delay
            } else if (!isNearTop && wasNearTop) {
                // Mouse just left the top area - clear timeout and hide immediately
                if (navShowTimeout) {
                    clearTimeout(navShowTimeout);
                    navShowTimeout = null;
                }
                navElements.forEach(nav => {
                    nav.classList.remove('show-nav');
                });
            }
            // If mouse is still in the top area, don't do anything - let the timeout complete
        }

        function hideNavBar() {
            const navElements = document.querySelectorAll('#navbar, #nav-belt, #nav-main');
            if (navShowTimeout) {
                clearTimeout(navShowTimeout);
                navShowTimeout = null;
            }
            isNearTop = false;
            navElements.forEach(nav => {
                nav.classList.remove('show-nav');
            });
        }

        // Only run the auto-open function if enabled (DISABLED BY DEFAULT TO PREVENT RELOADS)
        if (ENABLE_AUTO_OPEN_ADDITIONAL_ITEMS) {
            setTimeout(openAdditionalItemsTab, 500);
        }

        // Add mouse move listener for nav visibility
        document.addEventListener('mousemove', handleNavVisibility);
        // Add mouse leave listener to handle when cursor goes out of bounds
        document.addEventListener('mouseleave', hideNavBar);

        // --- INFINITE SCROLL ---
        // Only initialize items-page infinite scroll on /vine/vine-items without aborting the whole script
        if (ENABLE_INFINITE_SCROLL && window.location.pathname === '/vine/vine-items') {
            const MONITOR_HASHES = ['#monitor'];
            const MONITOR_CONSENT_KEY = 'vine_monitor_encore_scroll_enabled';
            const isMonitorPage = () => MONITOR_HASHES.includes(window.location.hash);
            const hasMonitorConsent = () => localStorage.getItem(MONITOR_CONSENT_KEY) === 'true';
            const setMonitorConsent = (val) => localStorage.setItem(MONITOR_CONSENT_KEY, val ? 'true' : 'false');

            function showMonitorConsentUI() {
                // Avoid duplicates
                if (document.getElementById('vine-monitor-actions')) return;
                const container = document.createElement('div');
                container.id = 'vine-monitor-actions';
                container.style.cssText = 'text-align:center; margin: 12px 0 24px 0;';

                // Create action buttons container
                const actionsRight = document.createElement('div');
                actionsRight.style.cssText = 'display:inline-flex; gap:8px; vertical-align:middle;';

                // Backup Feed Now button
                const backupNowBtn = document.createElement('button');
                backupNowBtn.id = 'backup-feed-now-btn';
                backupNowBtn.className = 'vine-encore-consent-btn';
                backupNowBtn.textContent = 'Backup Feed Now';
                backupNowBtn.title = 'Create a backup snapshot of the current feed';
                backupNowBtn.addEventListener('click', () => {
                    createManualFeedBackup();
                });

                // Cloud Sync Buttons
                const cloudRestoreBtn = document.createElement('button');
                cloudRestoreBtn.className = 'vine-encore-consent-btn';
                cloudRestoreBtn.textContent = '☁️ Restore from Cloud';
                cloudRestoreBtn.title = 'Download and restore backup from Pastebin';
                cloudRestoreBtn.onclick = handleFeedBackupRestoreFromCloud;

                const cloudSyncBtn = document.createElement('button');
                cloudSyncBtn.className = 'vine-encore-consent-btn';
                cloudSyncBtn.textContent = '☁️ Sync to Cloud';
                cloudSyncBtn.title = 'Upload latest backup to Pastebin (Long-press: sync all backups)';
                cloudSyncBtn.style.marginLeft = '8px';

                // Add long-click: normal = sync latest, long-press = sync all
                // Wrap async functions to catch unhandled promise rejections
                addLongClick(
                    cloudSyncBtn,
                    () => handleFeedBackupSyncToCloud().catch(err => {
                        console.error('Vine Modernized: [DEBUG] Unhandled error in handleFeedBackupSyncToCloud:', err);
                    }),
                    () => handleSyncAllBackupsToCloud().catch(err => {
                        console.error('Vine Modernized: [DEBUG] Unhandled error in handleSyncAllBackupsToCloud:', err);
                    }),
                    800  // 800ms for long-press
                );

                // Append in correct order: Cloud Restore, Backup Now, Cloud Sync
                actionsRight.appendChild(cloudRestoreBtn);
                actionsRight.appendChild(backupNowBtn);
                actionsRight.appendChild(cloudSyncBtn);

                container.appendChild(actionsRight);

                // Place the actions container after the monitor header UI if available, else at body end
                const headerUI = document.getElementById('vh-notifications-monitor-header-ui');
                if (headerUI && headerUI.parentNode) {
                    headerUI.parentNode.appendChild(container);
                } else {
                    document.body.appendChild(container);
                }
                return container;
            }

            // Cloud Sync Handler Functions
            async function handleFeedBackupSyncToCloud() {
                console.log('Vine Modernized: [DEBUG] handleFeedBackupSyncToCloud called');

                if (!isPastebinConfigured()) {
                    console.log('Vine Modernized: [DEBUG] Pastebin not configured');
                    alert('Please configure Pastebin in settings first (Favorites tab -> Cloud Sync -> Settings)');
                    return;
                }

                console.log('Vine Modernized: [DEBUG] Pastebin is configured, checking for backups...');
                const backups = getMonitorFeedBackups();
                if (backups.length === 0) {
                    console.log('Vine Modernized: [DEBUG] No backups found');
                    alert('No backup to sync. Create a backup first.');
                    return;
                }

                console.log(`Vine Modernized: [DEBUG] Found ${backups.length} backup(s), syncing latest...`);
                const latest = backups[backups.length - 1];
                const btn = document.querySelector('#vine-monitor-actions button[title*="Upload latest backup"]');

                if (btn) {
                    const originalText = btn.textContent;
                    btn.textContent = '⏳ Syncing...';
                    btn.disabled = true;

                    try {
                        console.log('Vine Modernized: [DEBUG] Calling syncFeedBackupToCloud...');
                        await syncFeedBackupToCloud(latest);
                        console.log('Vine Modernized: [DEBUG] syncFeedBackupToCloud completed successfully');
                        showToast('Feed backup synced to cloud successfully!', 'success');
                    } catch (error) {
                        console.error('Vine Modernized: [DEBUG] Feed backup cloud sync failed:', error);
                        console.error('Vine Modernized: [DEBUG] Error stack:', error.stack);
                        const hint = getPastebinAuthErrorHint(error);
                        const extra = hint ? `\n\n${hint}` : '';
                        alert(`Failed to sync to cloud: ${error.message}${extra}`);
                    } finally {
                        btn.textContent = originalText;
                        btn.disabled = false;
                    }
                } else {
                    console.warn('Vine Modernized: [DEBUG] Could not find sync button');
                    try {
                        console.log('Vine Modernized: [DEBUG] Calling syncFeedBackupToCloud without button UI update...');
                        await syncFeedBackupToCloud(latest);
                        console.log('Vine Modernized: [DEBUG] syncFeedBackupToCloud completed successfully');
                        showToast('Feed backup synced to cloud successfully!', 'success');
                    } catch (error) {
                        console.error('Vine Modernized: [DEBUG] Feed backup cloud sync failed:', error);
                        console.error('Vine Modernized: [DEBUG] Error stack:', error.stack);
                        const hint = getPastebinAuthErrorHint(error);
                        const extra = hint ? `\n\n${hint}` : '';
                        alert(`Failed to sync to cloud: ${error.message}${extra}`);
                    }
                }
            }
            async function handleFeedBackupRestoreFromCloud() {
                if (!isPastebinConfigured()) {
                    alert('Please configure Pastebin in settings first (Favorites tab -> Cloud Sync -> Settings)');
                    return;
                }

                const confirmed = confirm('Import feed backups from cloud? This will merge with your local backups.');
                if (!confirmed) return;

                const btn = this;
                const originalText = btn.textContent;
                btn.textContent = '⏳ Importing...';
                btn.disabled = true;

                try {
                    const cloudBackups = await restoreCloudBackups();

                    if (cloudBackups.length === 0) {
                        alert('No backups found in cloud');
                        return;
                    }

                    // Merge with local backups
                    const localBackups = getMonitorFeedBackups();
                    const allBackups = [...localBackups, ...cloudBackups];

                    // Remove duplicates by timestamp
                    const uniqueBackups = Array.from(
                        new Map(allBackups.map(b => [b.timestamp, b])).values()
                    );

                    // Sort by timestamp (oldest first)
                    uniqueBackups.sort((a, b) => a.timestamp - b.timestamp);

                    // Apply retention policy
                    const filtered = applyRetentionPolicy(uniqueBackups);

                    // Save merged backups
                    saveMonitorFeedBackups(filtered);

                    showToast(`Imported ${cloudBackups.length} backup(s) from cloud`, 'success');
                } catch (error) {
                    console.error('Vine Modernized: Cloud restore failed:', error);
                    alert(`Failed to restore from cloud: ${error.message}`);
                } finally {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            }

            async function handleSyncAllBackupsToCloud() {
                if (!isPastebinConfigured()) {
                    alert('Please configure Pastebin in settings first (Favorites tab -> Cloud Sync -> Settings)');
                    return;
                }

                const backups = getMonitorFeedBackups();
                if (backups.length === 0) {
                    alert('No backups to sync. Create a backup first.');
                    return;
                }

                const confirmed = confirm(`Sync all ${backups.length} backup(s) to cloud?`);
                if (!confirmed) return;

                const btn = this;
                const originalText = btn.textContent;
                btn.textContent = `⏳ Syncing ${backups.length}...`;
                btn.disabled = true;

                try {
                    const result = await syncAllBackupsToCloud();

                    if (result.errorCount > 0) {
                        showToast(`Synced ${result.successCount}/${result.total} backups (${result.errorCount} failed)`, 'warning');
                    } else {
                        showToast(`All ${result.successCount} backup(s) synced successfully!`, 'success');
                    }
                } catch (error) {
                    console.error('Vine Modernized: Sync all failed:', error);
                    alert(`Failed to sync backups: ${error.message}`);
                } finally {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            }

            function getMonitorFeedBackups() {
                try {
                    const stored = localStorage.getItem('vine_monitor_feed_backups');
                    if (!stored) return [];
                    const arr = JSON.parse(stored);
                    return Array.isArray(arr) ? arr : [];
                } catch (e) {
                    console.error('Vine Modernized: Failed to parse backups:', e);
                    return [];
                }
            }

            function saveMonitorFeedBackups(backups) {
                localStorage.setItem('vine_monitor_feed_backups', JSON.stringify(backups));
                // Dispatch custom event to update preview
                window.dispatchEvent(new CustomEvent('vine-backup-updated'));
            }

            function removeExpiredBackups(backups) {
                return backups;
            }

            function limitBackupCount(backups) {
                return backups.slice(-1);
            }

            function applyRetentionPolicy(backups) {
                const retentionDays = parseInt(localStorage.getItem('vine_monitor_retention_days') || '7');
                const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

                // Filter out backups older than retention period
                const filtered = backups.filter(backup => backup.timestamp >= cutoffTime);

                console.log(`Vine Modernized: Applied retention policy (${retentionDays} days). Kept ${filtered.length}/${backups.length} backups.`);
                return filtered;
            }

            // Helper function to get start of day (midnight) for a given timestamp
            function getStartOfDay(timestamp) {
                const date = new Date(timestamp);
                date.setHours(0, 0, 0, 0);
                return date.getTime();
            }

            // Helper function to get date string key for grouping (YYYY-MM-DD)
            function getDateKey(timestamp) {
                const date = new Date(timestamp);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            }

            // Auto cleanup function: keeps only the most recent backup per day
            function performDailyBackupCleanup() {
                try {
                    let backups = getMonitorFeedBackups();
                    if (!Array.isArray(backups) || backups.length === 0) {
                        console.log('Vine Modernized: No backups to clean up');
                        return;
                    }

                    const beforeCount = backups.length;

                    // Group backups by date (YYYY-MM-DD)
                    const backupsByDate = {};
                    backups.forEach(backup => {
                        const dateKey = getDateKey(backup.timestamp);
                        if (!backupsByDate[dateKey]) {
                            backupsByDate[dateKey] = [];
                        }
                        backupsByDate[dateKey].push(backup);
                    });

                    // For each day, keep only the most recent backup
                    const cleanedBackups = [];
                    Object.keys(backupsByDate).forEach(dateKey => {
                        const dayBackups = backupsByDate[dateKey];
                        // Sort by timestamp descending and take the first (most recent)
                        dayBackups.sort((a, b) => b.timestamp - a.timestamp);
                        cleanedBackups.push(dayBackups[0]);
                    });

                    // Apply retention policy
                    const finalBackups = applyRetentionPolicy(cleanedBackups);

                    // Save cleaned backups
                    saveMonitorFeedBackups(finalBackups);

                    const afterCount = finalBackups.length;
                    console.log(`Vine Modernized: Daily cleanup completed. Reduced from ${beforeCount} to ${afterCount} backups (keeping most recent per day).`);

                    // Update preview if it exists
                    if (typeof updateBackupPreview === 'function') {
                        updateBackupPreview();
                    }

                    // Store last cleanup timestamp
                    localStorage.setItem('vine_monitor_last_cleanup', Date.now().toString());

                    return true;
                } catch (error) {
                    console.error('Vine Modernized: Error during daily backup cleanup:', error);
                    return false;
                }
            }

            // Check if cleanup should have happened and perform it if needed
            function checkAndPerformCleanupIfNeeded() {
                const lastCleanup = localStorage.getItem('vine_monitor_last_cleanup');

                // If no previous cleanup, do it now
                if (!lastCleanup) {
                    console.log('Vine Modernized: First cleanup check - performing initial cleanup');
                    performDailyBackupCleanup();
                    return;
                }

                const lastCleanupTime = parseInt(lastCleanup);
                const lastCleanupDate = new Date(lastCleanupTime);
                const nowDate = new Date(now);

                // Check if we've moved to a new day since last cleanup
                const lastCleanupDay = getDateKey(lastCleanupTime);
                const currentDay = getDateKey(now);

                if (lastCleanupDay !== currentDay) {
                    // We're on a new day, check if cleanup should have happened yesterday at 11:59pm
                    const yesterday = new Date(now);
                    yesterday.setDate(yesterday.getDate() - 1);
                    yesterday.setHours(23, 59, 0, 0);
                    const yesterday1159 = yesterday.getTime();

                    // If last cleanup was before yesterday 11:59pm, we missed it - do cleanup now
                    if (lastCleanupTime < yesterday1159) {
                        console.log('Vine Modernized: Missed cleanup detected - performing cleanup now');
                        performDailyBackupCleanup();
                    }
                }
            }

            // Schedule cleanup to run at 11:59pm daily
            function scheduleDailyCleanup() {
                const now = new Date();
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(23, 59, 0, 0);

                const msUntil1159 = tomorrow.getTime() - now.getTime();

                console.log(`Vine Modernized: Scheduled daily cleanup for ${tomorrow.toLocaleString()}`);

                setTimeout(() => {
                    performDailyBackupCleanup();
                    // Schedule next cleanup (24 hours later)
                    scheduleDailyCleanup();
                }, msUntil1159);
            }

            // Initialize cleanup system
            function initDailyBackupCleanup() {
                // Check if cleanup is needed on script load
                checkAndPerformCleanupIfNeeded();

                // Schedule future cleanups
                scheduleDailyCleanup();
            }

            function extractItemHtmlFromTile(tileElement) {
                if (!tileElement) return null;
                return tileElement.outerHTML;
            }

            function isTileUnavailable(tileElement) {
                if (!tileElement) return true;
                return !!tileElement.querySelector('.unavailable-banner');
            }

            function extractAllCurrentFeedItems() {
                const grid = document.querySelector('#vvp-items-grid');
                if (!grid) return [];
                const tiles = grid.querySelectorAll('.vvp-item-tile');
                const items = [];
                tiles.forEach(tile => {
                    if (isTileUnavailable(tile)) return;
                    const html = extractItemHtmlFromTile(tile);
                    if (html) items.push(html);
                });
                return items;
            }

            // --- AUTO BACKUP (DELTA-BASED, ASIN SET DIFF) ---
            const AUTO_BACKUP_DELTA_THRESHOLD = 100;
            const LS_LAST_BACKUP_ASINS_KEY = 'vine_nm_feed_last_backup_asins';
            const LS_LAST_BACKUP_ASINS_META_KEY = 'vine_nm_feed_last_backup_asins_meta';
            let g_lastBackupAsinSet = null; // Set<string> for the most recent successful backup (available items only)

            function normalizeAsin(asin) {
                const s = String(asin || '').trim().toUpperCase();
                return /^[A-Z0-9]{10}$/.test(s) ? s : null;
            }

            function extractAsinFromItemHtml(html) {
                try {
                    const s = String(html || '');
                    let m = s.match(/data-asin=["']([A-Z0-9]{10})["']/i);
                    if (m && m[1]) return normalizeAsin(m[1]);
                    m = s.match(/vh-notification-([A-Z0-9]{10})/i);
                    if (m && m[1]) return normalizeAsin(m[1]);
                    m = s.match(/\/dp\/([A-Z0-9]{10})/i) || s.match(/\/gp\/product\/([A-Z0-9]{10})/i);
                    if (m && m[1]) return normalizeAsin(m[1]);
                    return null;
                } catch {
                    return null;
                }
            }

            function getAsinSetFromItemsArray(items) {
                const set = new Set();
                if (!Array.isArray(items)) return set;
                for (const it of items) {
                    const asin = extractAsinFromItemHtml(it);
                    if (asin) set.add(asin);
                }
                return set;
            }

            function getTileAsin(tile) {
                if (!tile) return null;
                // Prefer explicit data-asin, fallback to input[data-asin], then NM id pattern
                const direct = normalizeAsin(tile.getAttribute?.('data-asin'));
                if (direct) return direct;
                const input = tile.querySelector?.('input[data-asin]');
                const fromInput = normalizeAsin(input?.dataset?.asin);
                if (fromInput) return fromInput;
                const id = String(tile.id || '');
                if (id.startsWith('vh-notification-')) {
                    const m = id.match(/vh-notification-([A-Z0-9]{10})/i);
                    if (m && m[1]) return normalizeAsin(m[1]);
                }
                return null;
            }

            function getCurrentAvailableAsinSetFromDom() {
                const set = new Set();
                const grid = document.querySelector('#vvp-items-grid');
                if (!grid) return set;
                const tiles = grid.querySelectorAll('.vvp-item-tile');
                tiles.forEach(tile => {
                    if (isTileUnavailable(tile)) return;
                    const asin = getTileAsin(tile);
                    if (asin) set.add(asin);
                });
                return set;
            }

            async function getAsinSetFromBackupObjectAsync(backupObject) {
                try {
                    if (!backupObject || typeof backupObject !== 'object') return new Set();
                    let items = backupObject.items;
                    if (typeof items === 'string' && items.startsWith(PASTE_COMPRESSION_MARKER)) {
                        const jsonStr = await decompressString(items);
                        const parsed = JSON.parse(jsonStr);
                        items = parsed;
                    }
                    if (!Array.isArray(items)) return new Set();
                    return getAsinSetFromItemsArray(items);
                } catch (e) {
                    console.warn('Vine Modernized: Failed to compute ASIN set from backup object:', e);
                    return new Set();
                }
            }

            function loadLastBackupAsinSetFromStorage() {
                try {
                    const raw = localStorage.getItem(LS_LAST_BACKUP_ASINS_KEY);
                    if (!raw) return null;
                    const arr = JSON.parse(raw);
                    if (!Array.isArray(arr)) return null;
                    const set = new Set();
                    for (const a of arr) {
                        const asin = normalizeAsin(a);
                        if (asin) set.add(asin);
                    }
                    return set;
                } catch {
                    return null;
                }
            }

            function persistLastBackupAsins(asinSet, backupObject) {
                try {
                    const arr = Array.from(asinSet || []).filter(Boolean);
                    localStorage.setItem(LS_LAST_BACKUP_ASINS_KEY, JSON.stringify(arr));
                    localStorage.setItem(LS_LAST_BACKUP_ASINS_META_KEY, JSON.stringify({
                        updatedAt: Date.now(),
                        backupTimestamp: backupObject?.timestamp || null,
                        backupName: backupObject?.name || null,
                        asinCount: arr.length
                    }));
                    g_lastBackupAsinSet = new Set(arr);
                } catch (e) {
                    console.warn('Vine Modernized: Failed to persist last-backup ASIN baseline:', e);
                }
            }

            async function ensureLastBackupAsinSetLoaded() {
                if (g_lastBackupAsinSet) return;
                // 1) Prefer persisted baseline
                const stored = loadLastBackupAsinSetFromStorage();
                if (stored && stored.size) {
                    g_lastBackupAsinSet = stored;
                    return;
                }
                // 2) Fallback: derive from latest local backup and persist for next time
                try {
                    const backups = getMonitorFeedBackups();
                    if (Array.isArray(backups) && backups.length) {
                        let latest = backups[0];
                        for (const b of backups) {
                            const bt = Number(b?.timestamp || 0);
                            const lt = Number(latest?.timestamp || 0);
                            if (bt > lt) latest = b;
                        }
                        const set = await getAsinSetFromBackupObjectAsync(latest);
                        if (set.size) {
                            persistLastBackupAsins(set, latest);
                            return;
                        }
                    }
                } catch { /* ignore */ }
                g_lastBackupAsinSet = new Set(); // no baseline yet
            }

            async function saveMonitorFeedBackup(backupObject) {
                try {
                    // Compute ASIN baseline from the uncompressed items when available (cheap + avoids decompressing later)
                    let asinSetForBaseline = null;
                    try {
                        if (Array.isArray(backupObject.items)) {
                            asinSetForBaseline = getAsinSetFromItemsArray(backupObject.items);
                        }
                    } catch (e) {
                        console.warn('Vine Modernized: Failed to precompute backup ASIN baseline:', e);
                    }

                    // Compress items if not already compressed
                    if (backupObject.items && !backupObject.compressed) {
                        try {
                            const jsonStr = JSON.stringify(backupObject.items);
                            backupObject.items = await compressString(jsonStr);
                            backupObject.compressed = true;
                        } catch (e) {
                            console.error('Vine Modernized: Compression failed, saving uncompressed', e);
                        }
                    }

                    // Get existing backups and append new one
                    let backups = getMonitorFeedBackups();
                    backups.push(backupObject);

                    // Apply retention policy (time-based cleanup)
                    backups = applyRetentionPolicy(backups);

                    saveMonitorFeedBackups(backups);
                    console.log('Vine Modernized: Backup saved successfully');

                    // Update last-backup ASIN baseline (used by delta-based auto backups)
                    try {
                        if (!asinSetForBaseline) {
                            asinSetForBaseline = await getAsinSetFromBackupObjectAsync(backupObject);
                        }
                        if (asinSetForBaseline && asinSetForBaseline.size) {
                            persistLastBackupAsins(asinSetForBaseline, backupObject);
                        } else {
                            console.warn('Vine Modernized: Last-backup ASIN baseline unavailable (ASIN set empty).', {
                                name: backupObject?.name,
                                timestamp: backupObject?.timestamp,
                                itemCount: backupObject?.itemCount
                            });
                        }
                    } catch (e) {
                        console.warn('Vine Modernized: Failed to update last-backup ASIN baseline after save:', e);
                    }

                    // Update last signature locally to prevent redundant future auto-backups even if cloud sync fails
                    try {
                        const sig = await computeFeedSignatureAsync(backupObject);
                        if (sig) localStorage.setItem('vine_nm_feed_last_backup_sig', sig);
                    } catch (e) {
                        console.warn('Vine Modernized: Failed to compute/store last backup signature after save.', e);
                    }

                    // Auto-sync logic (feed)
                    if (localStorage.getItem('vine_feed_backup_auto_sync') === 'true') {
                        if (canAutoSyncFeed()) {
                            console.log('Vine Modernized: Triggering auto-sync for feed backup...');
                            // Don't await this, let it run in background
                            syncFeedBackupToCloud(backupObject).then(() => {
                                showToast('Feed backup auto-synced to cloud', 'success');
                            }).catch(err => {
                                console.error('Vine Modernized: Auto-sync failed:', err);
                                const hint = getPastebinAuthErrorHint(err);
                                if (hint) {
                                    showToast(hint, 'error');
                                }
                            });
                        } else {
                            console.log('Vine Modernized: Auto-sync (feed) skipped —', getAutoSyncFeedGateReason());
                        }
                    } else {
                        console.log('Vine Modernized: Auto-sync (feed) disabled.');
                    }

                    return true;
                } catch (error) {
                    if (error && (error.name === 'QuotaExceededError' || error.code === 22)) {
                        try {
                            const existing = getMonitorFeedBackups();
                            const approxExistingSizeKB = (new Blob([JSON.stringify(existing)]).size / 1024).toFixed(2);
                            const approxNewEntrySizeKB = (new Blob([JSON.stringify(backupObject)]).size / 1024).toFixed(2);
                            console.error('Vine Modernized: [QUOTA] Local storage quota exceeded while saving backup', {
                                existingBackups: existing.length,
                                approxExistingSizeKB,
                                approxNewEntrySizeKB
                            });
                        } catch { }
                        handleQuotaExceeded();
                    } else {
                        console.error('Vine Modernized: Failed to save backup:', error);
                    }
                    return false;
                }
            }

            function deleteMonitorFeedBackup(timestamp) {
                try {
                    const backups = getMonitorFeedBackups();
                    const filtered = backups.filter(b => b.timestamp !== timestamp);
                    saveMonitorFeedBackups(filtered);
                    return true;
                } catch (error) {
                    console.error('Vine Modernized: Failed to delete backup:', error);
                    return false;
                }
            }

            function formatDateTime(ts) {
                try {
                    const d = new Date(ts);
                    return d.toLocaleString();
                } catch { return String(ts); }
            }

            let isPerformingBackupOrRestore = false;

            async function createManualFeedBackup() {
                if (isPerformingBackupOrRestore) {
                    showToast('Backup or restore already in progress', 'warning');
                    return;
                }
                isPerformingBackupOrRestore = true;
                try {
                    const items = extractAllCurrentFeedItems();
                    if (items.length === 0) {
                        showToast('No items to backup', 'warning');
                        return;
                    }
                    const now = Date.now();
                    const backup = {
                        timestamp: now,
                        name: `Manual Backup ${formatDateTime(now)}`,
                        itemCount: items.length,
                        items
                    };
                    const success = await saveMonitorFeedBackup(backup);
                    if (success) {
                        showToast(`Backup created with ${items.length} items`, 'success');
                    } else {
                        showToast('Failed to create backup', 'error');
                    }
                } finally {
                    isPerformingBackupOrRestore = false;
                }
            }

            let g_toastQueue = [];
            let g_toastShowing = false;

            function showNextToast() {
                if (g_toastShowing) return;
                const next = g_toastQueue.shift();
                if (!next) return;
                g_toastShowing = true;

                const toast = document.createElement('div');
                toast.className = `vine-backup-toast vine-toast-${next.type}`;
                toast.textContent = next.message;
                toast.style.cssText = 'position:fixed; left:50%; transform:translateX(-50%); bottom:24px; background:#111; color:#fff; padding:10px 14px; border-radius:8px; z-index:9999; box-shadow:0 6px 16px rgba(0,0,0,0.25);';
                document.body.appendChild(toast);

                let autoDismissStarted = false;
                const finish = () => {
                    toast.style.opacity = '0';
                    toast.style.transition = 'opacity 0.3s';
                    setTimeout(() => {
                        toast.remove();
                        g_toastShowing = false;
                        showNextToast();
                    }, 300);
                };
                const startAutoDismiss = () => {
                    if (autoDismissStarted) return;
                    autoDismissStarted = true;
                    setTimeout(finish, 3000);
                };

                if (document.visibilityState === 'visible') {
                    startAutoDismiss();
                } else {
                    const onVisible = () => {
                        if (document.visibilityState === 'visible') {
                            document.removeEventListener('visibilitychange', onVisible);
                            startAutoDismiss();
                        }
                    };
                    document.addEventListener('visibilitychange', onVisible);
                }
            }

            function showToast(message, type = 'info') {
                g_toastQueue.push({ message, type });
                showNextToast();
            }

            function updateStatusMessage(message) {
                const statusEl = document.querySelector('#backup-status-message');
                if (!statusEl) return;
                statusEl.textContent = message;
                statusEl.style.opacity = '1';
                setTimeout(() => { statusEl.style.opacity = '0'; }, 5000);
            }

            function handleQuotaExceeded() {
                const msg = 'Backup failed: Storage quota exceeded.\n\nTry: Delete older backups, Export backups, Reduce backup frequency';
                alert(msg);
            }

            // Long-click utility: Adds normal click and long-press functionality to an element
            function addLongClick(element, normalAction, longAction, duration = 500) {
                let pressTimer = null;
                let isLongPress = false;

                const startPress = (e) => {
                    isLongPress = false;
                    pressTimer = setTimeout(() => {
                        isLongPress = true;
                        if (longAction) longAction(e);
                    }, duration);
                };

                const cancelPress = () => {
                    if (pressTimer) {
                        clearTimeout(pressTimer);
                        pressTimer = null;
                    }
                };

                const handleClick = (e) => {
                    cancelPress();
                    if (!isLongPress && normalAction) {
                        normalAction(e);
                    }
                    isLongPress = false;
                };

                // Mouse events
                element.addEventListener('mousedown', startPress);
                element.addEventListener('mouseup', cancelPress);
                element.addEventListener('mouseleave', cancelPress);
                element.addEventListener('click', handleClick);

                // Touch events
                element.addEventListener('touchstart', startPress);
                element.addEventListener('touchend', cancelPress);
                element.addEventListener('touchcancel', cancelPress);
            }

            function ensureBackupPanelStyles() {
                // Basic layout CSS only - animation moved to userstyle file
                if (document.getElementById('vine-backup-panel-layout-styles')) return;
                const style = document.createElement('style');
                style.id = 'vine-backup-panel-layout-styles';
                style.textContent = `
                #monitor-backup-panel-content{width:100%;margin-top:6px;overflow:hidden}
                #monitor-backup-panel-content .backup-management-section{display:flex;align-items:center;gap:8px;flex-wrap:nowrap}
                /* Ensure all buttons in the group stay on the same row */
                #monitor-backup-panel-content .backup-buttons-group{display:flex;align-items:center;gap:8px;flex-wrap:nowrap}
                /* Align Import Backup label with buttons */
                #monitor-backup-panel-content .backup-buttons-group .import-btn-label{display:inline-flex;align-items:center;vertical-align:middle}
                /* Keep the expand icon to the far right when placed in header row */
                #monitor-backup-panel-trigger{margin-left:auto}
            `;
                document.head.appendChild(style);
            }

            function initBackupManagementPanel() {
                if (document.getElementById('monitor-backup-panel-trigger')) return;
                const headerUI = document.getElementById('vh-notifications-monitor-header-ui');
                if (!headerUI) return;
                ensureBackupPanelStyles();

                // Hide only the external "Enable monitor and assisted load" row in the header (keep Mode/Connection visible)
                (function hideExternalEnableMonitorRow() {
                    const checkbox = document.getElementById('notification.active');
                    if (!checkbox) return;
                    // checkbox is inside <strong> which is inside the row <div> we want to hide
                    const strong = checkbox.closest('strong');
                    const rowDiv = strong ? strong.parentElement : null;
                    if (rowDiv && !rowDiv.dataset.vvpHidden) {
                        rowDiv.style.display = 'none';
                        rowDiv.dataset.vvpHidden = 'true';
                    } else if (rowDiv && rowDiv.dataset.vvpHidden) {
                        // Re-assert in case other scripts toggled it
                        rowDiv.style.display = 'none';
                    }

                    // Observe the container to re-apply hiding if DOM updates reinsert the row
                    const container = rowDiv ? rowDiv.parentElement : null;
                    if (container && !container.dataset.vvpHideObserver) {
                        const mo = new MutationObserver(() => {
                            const cb = document.getElementById('notification.active');
                            const st = cb ? cb.closest('strong') : null;
                            const rd = st ? st.parentElement : null;
                            if (rd) {
                                rd.style.display = 'none';
                                rd.dataset.vvpHidden = 'true';
                            }
                        });
                        mo.observe(container, { childList: true, subtree: true });
                        container.dataset.vvpHideObserver = 'true';
                    }
                })();

                // Create a thin, invisible strip anchored to the bottom of the header card.
                const trigger = document.createElement('div');
                trigger.id = 'monitor-backup-panel-trigger';
                trigger.className = 'backup-panel-trigger';
                const toggleBtn = document.createElement('button');
                toggleBtn.id = 'backup-expand-btn';
                toggleBtn.className = 'backup-expand-strip';
                toggleBtn.setAttribute('aria-label', 'Show/hide backup controls');
                toggleBtn.title = 'Expand/Collapse backup controls';
                // No visible text; CSS will render an upward-only glow on hover/expanded
                toggleBtn.textContent = '';
                trigger.appendChild(toggleBtn);

                const panel = document.createElement('div');
                panel.id = 'monitor-backup-panel-content';
                panel.className = 'backup-panel-content collapsed';
                panel.innerHTML = `
                <div class="backup-management-section">
                    <div class="backup-buttons-group">
                        <button id="manual-backup-btn" class="backup-action-btn vine-backup-btn"><span class="vine-backup-btn-text">Create Backup</span></button>
                        <button id="export-backups-btn" class="backup-action-btn vine-backup-btn" title="Long-click to export all backups"><span class="vine-backup-btn-text">Export Backup</span></button>
                        <label for="import-backups-input" class="backup-action-btn vine-backup-btn import-btn-label"><span class="vine-backup-btn-text">Import Backup</span></label>
                        <button id="restore-backup-btn" class="backup-action-btn vine-backup-btn" title="Long-click to manage backups"><span class="vine-backup-btn-text">Restore Backup</span></button>
                        <input type="file" id="import-backups-input" accept=".json" style="display:none;" />
                    </div>
                    <div class="backup-auto-section">
                        <label class="backup-toggle-label"><input type="checkbox" id="auto-backup-toggle"> <span>Auto Backup</span></label>
                        <label class="backup-input-label" id="min-items-label">Min Items: <input type="number" id="min-items-input" min="50" max="500" value="150"></label>
                        <label class="backup-input-label" id="retention-days-label">Keep for: <input type="range" id="retention-days-slider" min="1" max="14" value="7"> <span id="retention-days-value">7</span> days</label>
                        <span id="backup-status-message" style="margin-left:8px; font-size:12px; opacity:0;"></span>
                    </div>
                    <div class="backup-preview-section" style="margin-left: auto; width: 120px; font-family: 'Courier New', monospace; font-size: 11px; color: #666; white-space: nowrap;">
                        <span id="backup-preview-text">No backup</span>
                    </div>
                </div>
            `;

                const headerRow = headerUI.querySelector('.vh-header-row') || headerUI;
                // Ensure header row layout stays intact
                if (headerRow) {
                    headerRow.style.display = headerRow.style.display || 'flex';
                    headerRow.style.alignItems = headerRow.style.alignItems || 'center';
                    headerRow.style.gap = headerRow.style.gap || '8px';
                    headerRow.style.maxWidth = headerRow.style.maxWidth || '500px';
                }
                // Place the trigger as an absolutely positioned element at the very bottom of the card
                headerUI.appendChild(trigger);
                headerUI.appendChild(panel);

                const setExpandedState = (expanded) => {
                    panel.classList.toggle('collapsed', !expanded);
                    toggleBtn.classList.toggle('expanded', expanded);
                    localStorage.setItem('vine_monitor_backup_panel_expanded', expanded.toString());
                };
                const isExpanded = () => !panel.classList.contains('collapsed');
                const togglePanel = () => setExpandedState(!isExpanded());

                // Stats popover function for long-press
                const showStatsPopover = () => {
                    const backups = getMonitorFeedBackups();
                    if (!backups || backups.length === 0) {
                        showToast('No backup statistics available', 'info');
                        return;
                    }

                    const count = backups.length;
                    const oldest = new Date(backups[0].timestamp).toLocaleString();
                    const newest = new Date(backups[backups.length - 1].timestamp).toLocaleString();
                    const totalSize = formatBytes(calculateBackupStorageSize());
                    const retentionDays = parseInt(localStorage.getItem('vine_monitor_retention_days') || '7');

                    const stats = `📊 Backup Statistics\n\n` +
                        `Total Backups: ${count}\n` +
                        `Oldest: ${oldest}\n` +
                        `Newest: ${newest}\n` +
                        `Storage Used: ${totalSize}\n` +
                        `Retention: ${retentionDays} day(s)`;

                    alert(stats);
                };

                // Hover-and-hold to toggle after 1s; click toggles immediately; long-press shows stats
                let hoverTimer = null;
                const HOVER_DELAY = 1000;
                toggleBtn.addEventListener('mouseenter', () => {
                    toggleBtn.classList.add('hovering');
                    hoverTimer = setTimeout(() => {
                        hoverTimer = null;
                        togglePanel();
                    }, HOVER_DELAY);
                });
                toggleBtn.addEventListener('mouseleave', () => {
                    toggleBtn.classList.remove('hovering');
                    if (hoverTimer) {
                        clearTimeout(hoverTimer);
                        hoverTimer = null;
                    }
                });
                // Click to toggle immediately
                toggleBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    togglePanel();
                });
                // Long-press shows stats (do not attach another normal click via addLongClick)
                addLongClick(toggleBtn, null, () => showStatsPopover(), 600);
                // Right-click to show stats
                toggleBtn.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    showStatsPopover();
                });

                const savedExpanded = localStorage.getItem('vine_monitor_backup_panel_expanded') === 'true';
                setExpandedState(!!savedExpanded);

                // Helper: Calculate storage size of backups in bytes
                function calculateBackupStorageSize() {
                    try {
                        const backupsJson = localStorage.getItem('vine_monitor_feed_backups') || '[]';
                        return new Blob([backupsJson]).size;
                    } catch (e) {
                        return 0;
                    }
                }

                // Helper: Format bytes to human-readable size
                function formatBytes(bytes) {
                    if (bytes < 1024) return bytes + ' B';
                    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
                }

                // Update backup preview function
                function updateBackupPreview() {
                    const previewEl = document.getElementById('backup-preview-text');
                    if (!previewEl) return;

                    const backups = getMonitorFeedBackups();
                    if (!backups || backups.length === 0) {
                        previewEl.textContent = 'No backups';
                        previewEl.style.color = '#666';
                        return;
                    }

                    const count = backups.length;
                    const storageSize = calculateBackupStorageSize();
                    const storageMB = storageSize / (1024 * 1024);
                    const quotaMB = 5; // localStorage typically ~5-10MB per domain

                    // Show count and storage
                    const countText = count === 1 ? '1 backup' : `${count} backups`;
                    const sizeText = formatBytes(storageSize);
                    previewEl.textContent = `${countText} • ${sizeText}`;

                    // Visual warning if approaching quota (>70% of 5MB)
                    if (storageMB > quotaMB * 0.7) {
                        previewEl.style.color = '#d32f2f';
                        previewEl.title = 'Warning: High storage usage. Consider reducing retention days or clearing old backups.';
                    } else {
                        previewEl.style.color = '#666';
                        previewEl.title = '';
                    }
                }

                // Initial preview update
                updateBackupPreview();

                // Listen for backup updates
                window.addEventListener('vine-backup-updated', updateBackupPreview);

                document.getElementById('manual-backup-btn')?.addEventListener('click', () => {
                    createManualFeedBackup();
                    updateBackupPreview();
                });

                // Export button: Normal click = Export latest, Long-press = Export all
                const exportBtn = document.getElementById('export-backups-btn');
                if (exportBtn) {
                    addLongClick(
                        exportBtn,
                        () => exportMonitorFeedBackups(), // Normal click: Export latest
                        () => exportAllMonitorFeedBackups(), // Long-press: Export all
                        500 // 500ms hold duration
                    );
                }

                // Append cloud sync button that reuses the Favorites dropdown
                const btnGroup = panel.querySelector('.backup-buttons-group');
                if (btnGroup && !btnGroup.querySelector('#backup-cloud-btn')) {
                    const cloudBtn = document.createElement('button');
                    cloudBtn.id = 'backup-cloud-btn';
                    cloudBtn.className = 'backup-action-btn vine-backup-btn';
                    cloudBtn.title = 'Cloud Sync (Monitor Feed)';
                    cloudBtn.textContent = '☁️';
                    cloudBtn.style.fontSize = '16px';
                    cloudBtn.style.padding = '6px 10px';
                    btnGroup.appendChild(cloudBtn);

                    // Settings gear button (opens Monitor Settings modal)
                    const settingsBtn = document.createElement('button');
                    settingsBtn.id = 'backup-settings-btn';
                    settingsBtn.className = 'backup-action-btn vine-backup-btn';
                    settingsBtn.title = 'Monitor Settings';
                    settingsBtn.textContent = '⚙️';
                    settingsBtn.style.fontSize = '16px';
                    settingsBtn.style.padding = '6px 10px';
                    settingsBtn.style.marginLeft = '0px';
                    btnGroup.appendChild(settingsBtn);

                    settingsBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        try { showMonitorSettings(); } catch (err) { console.error('Open monitor settings failed', err); }
                    });

                    // Click opens the same dropdown, anchored near this button, wired for feed
                    cloudBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        try { openCloudMenu(cloudBtn, 'feed'); } catch (err) { console.error('Open cloud menu failed', err); }
                    });
                    // Long-press opens settings
                    addLongClick(cloudBtn, null, () => showPastebinSettings(), 700);
                }

                document.getElementById('import-backups-input')?.addEventListener('change', (e) => {
                    importMonitorFeedBackups(e);
                    updateBackupPreview();
                });

                // Restore button: Normal click = Restore latest, Long-press = Open modal
                const restoreBtn = document.getElementById('restore-backup-btn');
                if (restoreBtn) {
                    addLongClick(
                        restoreBtn,
                        () => {
                            const backups = getMonitorFeedBackups();
                            if (backups.length > 0) {
                                const lastBackup = backups[backups.length - 1];
                                restoreMonitorFeed(lastBackup);
                            } else {
                                showToast('No backups available to restore', 'warning');
                            }
                        }, // Normal click: Restore latest
                        () => openBackupsModal(), // Long-press: Open modal
                        500 // 500ms hold duration
                    );
                }

                const autoToggle = document.getElementById('auto-backup-toggle');
                const minItemsInput = document.getElementById('min-items-input');
                const minItemsLabel = document.getElementById('min-items-label');

                function updateMinItemsVisibility() {
                    if (minItemsLabel) {
                        // If we've moved this control into the Settings modal, keep it hidden permanently here
                        if (minItemsLabel.dataset.movedToSettings === 'true') {
                            minItemsLabel.style.display = 'none';
                        } else {
                            minItemsLabel.style.display = autoToggle.checked ? '' : 'none';
                        }
                    }
                }

                if (autoToggle) {
                    autoToggle.checked = localStorage.getItem('vine_monitor_auto_backup_enabled') === 'true';
                    autoToggle.addEventListener('change', () => {
                        localStorage.setItem('vine_monitor_auto_backup_enabled', autoToggle.checked ? 'true' : 'false');
                        updateMinItemsVisibility();
                        if (autoToggle.checked) {
                            try { attachAutoBackupDeltaObservers(); } catch { }
                            try { scheduleAutoBackupDeltaEval('auto-backup enabled'); } catch { }
                        }
                    });
                    // Set initial visibility
                    updateMinItemsVisibility();
                    // Move this control into the new Settings modal: hide original UI here
                    const autoLabel = autoToggle.closest('label');
                    if (autoLabel) autoLabel.style.display = 'none';
                }
                if (minItemsInput) {
                    const currentMin = parseInt(localStorage.getItem('vine_monitor_min_items_backup') || '100');
                    minItemsInput.value = String(currentMin);
                    minItemsInput.addEventListener('change', () => {
                        const val = Math.max(50, Math.min(500, parseInt(minItemsInput.value || '100')));
                        localStorage.setItem('vine_monitor_min_items_backup', String(val));
                        minItemsInput.value = String(val);
                        try { scheduleAutoBackupDeltaEval('min-items changed'); } catch { }
                    });
                    // Hide original UI; lives in Settings modal now
                    if (minItemsLabel) {
                        minItemsLabel.style.display = 'none';
                        minItemsLabel.dataset.movedToSettings = 'true';
                    }
                }

                // Retention days slider handler
                const retentionSlider = document.getElementById('retention-days-slider');
                const retentionValue = document.getElementById('retention-days-value');
                if (retentionSlider && retentionValue) {
                    const currentRetention = parseInt(localStorage.getItem('vine_monitor_retention_days') || '7');
                    retentionSlider.value = String(currentRetention);
                    retentionValue.textContent = String(currentRetention);

                    retentionSlider.addEventListener('input', () => {
                        const days = parseInt(retentionSlider.value);
                        retentionValue.textContent = String(days);
                        localStorage.setItem('vine_monitor_retention_days', String(days));
                    });
                }

                const clearMonitorButton = document.getElementById('clear-monitor');
                if (clearMonitorButton) {
                    clearMonitorButton.addEventListener('click', () => {
                        // Removed the confirmation dialog as per user request
                        vhModernized_isRestoredFeedActive = false;
                        document.querySelectorAll('#vvp-items-grid .vvp-item-tile[data-userscript-injected]').forEach(el => el.remove());
                        const searchInputEl = document.getElementById('search-input');
                        if (searchInputEl) {
                            searchInputEl.value = '';
                            applyCustomSearchToRestoredFeed('');
                        }
                    });
                }

                const clearUnavailableButton = document.getElementById('clear-unavailable');
                if (clearUnavailableButton) {
                    clearUnavailableButton.addEventListener('click', () => {
                        vhModernized_isRestoredFeedActive = false;
                        document.querySelectorAll('#vvp-items-grid .vvp-item-tile[data-userscript-injected][data-unavailable="true"]').forEach(el => el.remove());
                        const searchInputEl = document.getElementById('search-input');
                        if (searchInputEl) {
                            searchInputEl.value = '';
                            applyCustomSearchToRestoredFeed('');
                        }
                    });
                }

                const fetchLastButton = document.getElementById('fetch-last');
                if (fetchLastButton) {
                    fetchLastButton.addEventListener('click', () => {
                        vhModernized_isRestoredFeedActive = false;
                        document.querySelectorAll('#vvp-items-grid .vvp-item-tile[data-userscript-injected]').forEach(el => el.remove());
                        const searchInputEl = document.getElementById('search-input');
                        if (searchInputEl) {
                            searchInputEl.value = '';
                            applyCustomSearchToRestoredFeed('');
                        }
                    });
                }

                updateBackupsList();
            }

            function updateBackupsList() {
                const container = document.getElementById('backup-list-container');
                if (!container) return;
                const backups = getMonitorFeedBackups();
                container.innerHTML = '';
                backups.sort((a, b) => a.timestamp - b.timestamp).reverse();
                backups.forEach(b => {
                    const entry = document.createElement('div');
                    entry.className = 'backup-entry';
                    entry.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 0; border-bottom:1px solid #eee;';
                    const info = document.createElement('div');
                    info.innerHTML = `<div>${b.name || formatDateTime(b.timestamp)}</div><div style="font-size:12px; color:#666;">${formatDateTime(b.timestamp)} • ${b.itemCount} item(s)</div>`;
                    const actions = document.createElement('div');
                    const restore = document.createElement('button');
                    restore.className = 'a-button';
                    restore.innerHTML = '<span class="a-button-inner"><span class="a-button-text">Restore</span></span>';
                    restore.addEventListener('click', () => restoreMonitorFeed(b));
                    const del = document.createElement('button');
                    del.className = 'a-button';
                    del.innerHTML = '<span class="a-button-inner"><span class="a-button-text">Delete</span></span>';
                    del.addEventListener('click', () => { deleteMonitorFeedBackup(b.timestamp); updateBackupsList(); });
                    actions.appendChild(restore);
                    actions.appendChild(del);
                    entry.appendChild(info);
                    entry.appendChild(actions);
                    container.appendChild(entry);
                });
            }

            function exportMonitorFeedBackups() {
                try {
                    const backups = getMonitorFeedBackups();
                    if (!backups || backups.length === 0) { showToast('No backups to export', 'warning'); return; }
                    const latest = backups[backups.length - 1]; // Export latest backup
                    const dataStr = JSON.stringify(latest, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `vine-monitor-backup-${latest.timestamp || Date.now()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast('Exported latest backup', 'success');
                } catch (error) {
                    console.error('Vine Modernized: Export failed:', error);
                    showToast('Failed to export backup', 'error');
                }
            }

            function exportAllMonitorFeedBackups() {
                try {
                    const backups = getMonitorFeedBackups();
                    if (!backups || backups.length === 0) { showToast('No backups to export', 'warning'); return; }
                    const dataStr = JSON.stringify(backups, null, 2); // Export entire array
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `vine-monitor-backups-all-${Date.now()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast(`Exported all ${backups.length} backup(s)`, 'success');
                } catch (error) {
                    console.error('Vine Modernized: Export all failed:', error);
                    showToast('Failed to export all backups', 'error');
                }
            }

            function validateBackupJSON(jsonString) {
                try {
                    const data = JSON.parse(jsonString);
                    // Two valid formats:
                    // 1) Single backup object
                    // 2) Array of backup objects
                    if (!Array.isArray(data) && !data.items) {
                        throw new Error('Invalid backup format');
                    }

                    // Helper: validate a single backup object (supports compressed + uncompressed)
                    const validateBackupObject = (obj) => {
                        if (!obj || !obj.timestamp || !obj.name || !obj.items) {
                            throw new Error('Invalid backup object');
                        }

                        // items can be:
                        // - an array of HTML strings (legacy backups)
                        // - a compressed string starting with our marker (new backups)
                        if (Array.isArray(obj.items)) {
                            return;
                        }
                        if (typeof obj.items === 'string' && obj.items.startsWith(PASTE_COMPRESSION_MARKER)) {
                            return;
                        }

                        throw new Error('Invalid backup object');
                    };

                    if (Array.isArray(data)) {
                        // Validate each entry in the array (ignore nulls defensively)
                        data.forEach(item => {
                            if (item) validateBackupObject(item);
                        });
                    } else {
                        validateBackupObject(data);
                    }

                    return { valid: true, data };
                } catch (error) {
                    return { valid: false, error: error.message };
                }
            }

            function importMonitorFeedBackups(event) {
                const file = event.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onerror = () => { showToast('Failed to read file', 'error'); };
                reader.onload = (e) => {
                    try {
                        const validation = validateBackupJSON(e.target.result);
                        if (!validation.valid) {
                            showToast(`Invalid backup file: ${validation.error}`, 'error');
                            return;
                        }
                        const importedData = validation.data;
                        const selectedBackup = Array.isArray(importedData) ? importedData[importedData.length - 1] : importedData;

                        // After validation we accept:
                        // - selectedBackup.items as an array (legacy)
                        // - or a compressed string with our marker
                        if (
                            !selectedBackup ||
                            (
                                !Array.isArray(selectedBackup.items) &&
                                !(typeof selectedBackup.items === 'string' && selectedBackup.items.startsWith(PASTE_COMPRESSION_MARKER))
                            )
                        ) {
                            showToast('Invalid backup file: invalid backup object', 'error');
                            return;
                        }

                        saveMonitorFeedBackups([selectedBackup]);
                        showToast('Imported backup', 'success');
                        updateBackupsList();
                    } catch (error) {
                        console.error('Vine Modernized: Import failed:', error);
                        showToast('Failed to import backups', 'error');
                    } finally {
                        event.target.value = '';
                    }
                };
                reader.readAsText(file);
            }

            function ensureBackupPanelInit(attempt = 0) {
                if (document.getElementById('monitor-backup-panel-trigger')) return;
                const headerUI = document.getElementById('vh-notifications-monitor-header-ui');
                if (!headerUI) {
                    if (attempt < 50) setTimeout(() => ensureBackupPanelInit(attempt + 1), 200);
                    return;
                }
                initBackupManagementPanel();
            }
            // Initialize daily backup cleanup system
            initDailyBackupCleanup();

            setTimeout(() => { ensureBackupPanelInit(); }, 1000);
            window.addEventListener('DOMContentLoaded', () => { ensureBackupPanelInit(); });
            window.addEventListener('hashchange', () => { ensureBackupPanelInit(); });

            let vhModernized_isRestoredFeedActive = false;
            function isRestoredFeedActive() {
                return vhModernized_isRestoredFeedActive && window.location.hash === '#monitor';
            }

            function applyCustomSearchToRestoredFeed(query) {
                const tiles = document.querySelectorAll('#vvp-items-grid .vvp-item-tile');
                const normalizedQuery = (query || '').toLowerCase().trim();
                tiles.forEach(tile => {
                    const asin = tile.getAttribute('data-asin') || '';
                    const queue = tile.getAttribute('data-queue') || '';
                    const titleElement = tile.querySelector('.vvp-item-product-title-container .a-truncate-full');
                    const title = titleElement ? titleElement.textContent.toLowerCase() : '';
                    const isMatch = normalizedQuery === '' || asin.toLowerCase().includes(normalizedQuery) || queue.toLowerCase().includes(normalizedQuery) || title.includes(normalizedQuery);
                    tile.style.display = isMatch ? 'flex' : 'none';
                });
            }

            let vhModernized_customSearchHandler = null;
            let vhModernized_customSearchKeydownHandler = null;
            let vhModernized_customSearchSubmitHandler = null;
            function initCustomSearchForRestoredFeed() {
                const searchInput = document.getElementById('search-input');
                if (!searchInput) return;

                // Remove existing handlers if they exist
                if (vhModernized_customSearchHandler) {
                    searchInput.removeEventListener('input', vhModernized_customSearchHandler);
                }
                if (vhModernized_customSearchKeydownHandler) {
                    searchInput.removeEventListener('keydown', vhModernized_customSearchKeydownHandler);
                }
                if (vhModernized_customSearchSubmitHandler) {
                    searchInput.removeEventListener('submit', vhModernized_customSearchSubmitHandler);
                }

                // Input event handler for real-time search
                vhModernized_customSearchHandler = function (event) {
                    if (isRestoredFeedActive()) {
                        // Prevent default search behavior from interfering
                        event.stopPropagation();
                        applyCustomSearchToRestoredFeed(event.target.value);
                    }
                };

                // Keydown handler to prevent Enter key from triggering default search
                vhModernized_customSearchKeydownHandler = function (event) {
                    if (isRestoredFeedActive()) {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            event.stopPropagation();
                            event.stopImmediatePropagation();
                            applyCustomSearchToRestoredFeed(event.target.value);
                            return false;
                        }
                    }
                };

                // Submit handler to prevent form submission
                vhModernized_customSearchSubmitHandler = function (event) {
                    if (isRestoredFeedActive()) {
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                        applyCustomSearchToRestoredFeed(event.target.value);
                        return false;
                    }
                };

                // Attach all handlers
                searchInput.addEventListener('input', vhModernized_customSearchHandler, true);
                searchInput.addEventListener('keydown', vhModernized_customSearchKeydownHandler, true);
                searchInput.addEventListener('submit', vhModernized_customSearchSubmitHandler, true);

                // Also check if search input is in a form and prevent form submission
                const searchForm = searchInput.closest('form');
                if (searchForm) {
                    const formSubmitHandler = function (event) {
                        if (isRestoredFeedActive()) {
                            event.preventDefault();
                            event.stopPropagation();
                            event.stopImmediatePropagation();
                            applyCustomSearchToRestoredFeed(searchInput.value);
                            return false;
                        }
                    };
                    searchForm.addEventListener('submit', formSubmitHandler, true);
                    // Store reference for potential cleanup
                    searchForm._vineModernizedSubmitHandler = formSubmitHandler;
                }

                if (isRestoredFeedActive()) {
                    applyCustomSearchToRestoredFeed(searchInput.value);
                }
            }

            function parseItemDataFromHtml(htmlString) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlString;
                const tile = tempDiv.querySelector('.vvp-item-tile');
                if (!tile) return null;
                const asin = tile.getAttribute('data-asin') || '';
                const titleElement = tile.querySelector('.vvp-item-product-title-container .a-truncate-full');
                const title = titleElement ? titleElement.textContent.trim() : '';
                const imgElement = tile.querySelector('img');
                const imgUrl = imgElement ? imgElement.src : '';
                const queue = tile.getAttribute('data-queue') || '';
                const unavailable = tile.hasAttribute('data-unavailable') ? tile.getAttribute('data-unavailable') : null;
                return { asin, title, imgUrl, queue, unavailable };
            }

            async function loadMonitorFeedItemsFromBackup(backupObject) {
                const meta = {
                    name: backupObject?.name,
                    timestamp: backupObject?.timestamp,
                    itemCount: backupObject?.itemCount,
                    compressed: backupObject?.compressed
                };

                const logFailure = (stage, err, extra = {}) => {
                    try {
                        console.groupCollapsed('Vine Modernized: Failed to restore backup', meta);
                        console.error('Stage:', stage);
                        if (err) console.error(err);
                        console.log('Backup object:', backupObject);
                        const raw = backupObject?.items;
                        console.log('Items meta:', {
                            type: Array.isArray(raw) ? 'array' : typeof raw,
                            arrayLength: Array.isArray(raw) ? raw.length : undefined,
                            stringLength: typeof raw === 'string' ? raw.length : undefined,
                            hasMarker: typeof raw === 'string' ? raw.startsWith(PASTE_COMPRESSION_MARKER) : false,
                            gzipSupport: (() => { try { return hasGzipWebStreamsSupport(); } catch { return 'unknown'; } })()
                        });
                        if (typeof raw === 'string') {
                            const rest = raw.startsWith(PASTE_COMPRESSION_MARKER) ? raw.slice(PASTE_COMPRESSION_MARKER.length) : raw;
                            const nl = rest.indexOf('\n');
                            const head = (nl !== -1 ? rest.slice(0, nl) : rest).slice(0, 80);
                            console.log('Items header preview:', head);
                            console.log('Items string preview:', rest.slice(0, 200));
                        } else if (Array.isArray(raw) && raw.length) {
                            console.log('First item preview:', String(raw[0]).slice(0, 200));
                        }
                        if (extra && Object.keys(extra).length) console.log('Extra:', extra);
                    } catch { /* no-op */ }
                    try { console.groupEnd(); } catch { /* no-op */ }
                };

                if (!backupObject || !('items' in backupObject)) {
                    logFailure('validate-backup', new Error('Backup object missing items'));
                    return { ok: false, stage: 'validate-backup' };
                }

                try {
                    const rawItems = backupObject.items;
                    let itemsArray = null;

                    // Legacy: uncompressed array of HTML strings
                    if (Array.isArray(rawItems)) {
                        itemsArray = rawItems;
                    } else if (typeof rawItems === 'string') {
                        // New: compressed string with marker
                        if (rawItems.startsWith(PASTE_COMPRESSION_MARKER)) {
                            let jsonStr = '';
                            try {
                                jsonStr = await decompressString(rawItems);
                            } catch (e) {
                                logFailure('decompress-items', e);
                                return { ok: false, stage: 'decompress-items' };
                            }
                            let parsed;
                            try {
                                parsed = JSON.parse(jsonStr);
                            } catch (e) {
                                logFailure('parse-items-json', e, { jsonPreview: String(jsonStr).slice(0, 200) });
                                return { ok: false, stage: 'parse-items-json' };
                            }
                            if (!Array.isArray(parsed)) {
                                logFailure('parse-items-json', new Error('Decompressed items JSON is not an array'), { parsedType: typeof parsed });
                                return { ok: false, stage: 'parse-items-json' };
                            }
                            itemsArray = parsed;
                        } else {
                            // Defensive: some legacy exports may store the array as a JSON string
                            try {
                                const parsed = JSON.parse(rawItems);
                                if (Array.isArray(parsed)) itemsArray = parsed;
                                else {
                                    logFailure('parse-items-legacy-json', new Error('Items string JSON is not an array'), { parsedType: typeof parsed });
                                    return { ok: false, stage: 'parse-items-legacy-json' };
                                }
                            } catch (e) {
                                logFailure('parse-items-legacy-json', e);
                                return { ok: false, stage: 'parse-items-legacy-json' };
                            }
                        }
                    } else {
                        logFailure('items-type', new Error(`Unsupported items type: ${Array.isArray(rawItems) ? 'array' : typeof rawItems}`));
                        return { ok: false, stage: 'items-type' };
                    }

                    if (!Array.isArray(itemsArray)) {
                        logFailure('items-not-array', new Error('Backup items are not an array after processing'));
                        return { ok: false, stage: 'items-not-array' };
                    }

                    const grid = document.querySelector('#vvp-items-grid');
                    if (!grid) {
                        logFailure('grid-missing', new Error('Items grid not found'));
                        return { ok: false, stage: 'grid-missing' };
                    }

                    try {
                        grid.innerHTML = itemsArray.join('');
                    } catch (e) {
                        logFailure('render-grid', e, { itemsLength: itemsArray.length });
                        return { ok: false, stage: 'render-grid' };
                    }

                    try {
                        grid.querySelectorAll('.vvp-item-tile').forEach(el => el.setAttribute('data-userscript-injected', 'true'));
                    } catch (e) {
                        logFailure('mark-tiles', e);
                        return { ok: false, stage: 'mark-tiles' };
                    }

                    try {
                        reinitializeItemDependentFeatures();
                    } catch (e) {
                        logFailure('reinit-features', e);
                        return { ok: false, stage: 'reinit-features' };
                    }

                    console.log(`Vine Modernized: Restored ${backupObject.itemCount ?? itemsArray.length} items from backup`);
                    return { ok: true, itemsLength: itemsArray.length };
                } catch (error) {
                    logFailure('unexpected', error);
                    return { ok: false, stage: 'unexpected' };
                }
            }

            function reinitializeItemDependentFeatures() {
                if (typeof observeItemsGrid === 'function') {
                    console.log('Vine Modernized: Re-initializing favorites observer after restore');
                    observeItemsGrid();
                }
            }

            async function restoreMonitorFeed(backupObject) {
                if (!backupObject) return;
                const grid = document.querySelector('#vvp-items-grid');
                const currentItemCount = grid ? grid.querySelectorAll('.vvp-item-tile').length : 0;
                if (currentItemCount > 0) {
                    const confirmed = confirm(
                        `The feed currently has ${currentItemCount} items.\n\n` +
                        `Restoring from backup will replace them with ${backupObject.itemCount} items.\n\n` +
                        `Continue?`
                    );
                    if (!confirmed) return;
                }
                isPerformingBackupOrRestore = true;
                try {
                    const result = await loadMonitorFeedItemsFromBackup(backupObject);
                    if (result && result.ok) {
                        vhModernized_isRestoredFeedActive = true;
                        showToast(`Restored ${backupObject.itemCount} items from backup`, 'success');
                        document.title = `VHNM (${backupObject.itemCount})`;
                        initCustomSearchForRestoredFeed();
                    } else {
                        showToast('Failed to restore backup (see console for details)', 'error');
                    }
                } finally {
                    isPerformingBackupOrRestore = false;
                }
            }

            function openBackupsModal() {
                const existing = document.getElementById('monitor-backup-modal');
                if (existing) { existing.remove(); }

                const backups = getMonitorFeedBackups();
                if (!Array.isArray(backups) || backups.length === 0) {
                    alert('No backups available');
                    return;
                }

                const overlay = document.createElement('div');
                overlay.id = 'monitor-backup-modal';
                overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:9999; display:flex; align-items:center; justify-content:center;';

                const panel = document.createElement('div');
                panel.className = 'vine-backup-modal-panel';
                panel.style.cssText = 'background:#fff; color:#111; border-radius:8px; min-width:300px; max-width:640px; width:90%; max-height:80vh; overflow:auto; box-shadow:0 8px 24px rgba(0,0,0,0.2);';

                const header = document.createElement('div');
                header.className = 'vine-backup-modal-header';
                header.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid #ddd;';
                const title = document.createElement('h3');
                title.textContent = 'Restore a Backup';
                title.style.cssText = 'margin:0; font-size:18px;';
                const headerActions = document.createElement('div');
                headerActions.style.cssText = 'display:flex; align-items:center; gap:8px;';
                const deleteAllBtn = document.createElement('button');
                deleteAllBtn.className = 'a-button';
                deleteAllBtn.innerHTML = '<span class="a-button-inner"><span class="a-button-text">Delete All</span></span>';
                deleteAllBtn.style.cssText = 'background-color:#d32f2f; color:#fff;';
                deleteAllBtn.addEventListener('click', () => {
                    const confirmed = confirm('Delete ALL backups? This cannot be undone.');
                    if (!confirmed) return;
                    saveMonitorFeedBackups([]);
                    showToast('All backups cleared', 'success');
                    overlay.remove();
                });
                const closeBtn = document.createElement('button');
                closeBtn.className = 'a-button a-button-close';
                closeBtn.textContent = '×';
                closeBtn.style.cssText = 'font-size:18px; line-height:18px; padding:6px 10px;';
                closeBtn.addEventListener('click', () => overlay.remove());
                headerActions.appendChild(deleteAllBtn);
                headerActions.appendChild(closeBtn);
                header.appendChild(title);
                header.appendChild(headerActions);

                const searchWrap = document.createElement('div');
                searchWrap.style.cssText = 'padding:10px 16px; border-bottom:1px solid #eee;';
                const searchInput = document.createElement('input');
                searchInput.type = 'search';
                searchInput.placeholder = 'Filter backups by name/date…';
                searchInput.style.cssText = 'width:100%; padding:8px 10px; border:1px solid #cfd6e4; border-radius:6px;';
                searchWrap.appendChild(searchInput);

                const list = document.createElement('div');
                list.className = 'backup-list';
                list.style.cssText = 'padding:8px 0;';

                const renderList = (filter = '') => {
                    list.innerHTML = '';
                    const rows = backups
                        .slice()
                        .sort((a, b) => a.timestamp - b.timestamp)
                        .reverse()
                        .filter(b => {
                            const t = `${b.name} ${formatDateTime(b.timestamp)} ${b.itemCount}`.toLowerCase();
                            return t.includes(filter.toLowerCase());
                        });
                    rows.forEach(b => {
                        const row = document.createElement('div');
                        row.className = 'backup-row';
                        row.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 16px; border-bottom:1px solid #f0f0f0;';
                        const info = document.createElement('div');
                        info.style.cssText = 'display:flex; flex-direction:column;';
                        const name = document.createElement('div');
                        name.textContent = b.name || formatDateTime(b.timestamp);
                        const meta = document.createElement('div');
                        meta.textContent = `${formatDateTime(b.timestamp)} • ${b.itemCount} item(s)`;
                        meta.style.cssText = 'font-size:12px; color:#666;';
                        info.appendChild(name);
                        info.appendChild(meta);

                        const actions = document.createElement('div');
                        actions.style.cssText = 'display:flex; gap:8px;';
                        const restore = document.createElement('button');
                        restore.className = 'a-button';
                        restore.innerHTML = '<span class="a-button-inner"><span class="a-button-text">Restore</span></span>';
                        restore.addEventListener('click', () => { restoreMonitorFeed(b); overlay.remove(); });
                        const del = document.createElement('button');
                        del.className = 'a-button';
                        del.innerHTML = '<span class="a-button-inner"><span class="a-button-text">Delete</span></span>';
                        del.addEventListener('click', () => {
                            if (deleteMonitorFeedBackup(b.timestamp)) {
                                // Refresh backups from storage
                                const updatedBackups = getMonitorFeedBackups();
                                backups.length = 0;
                                backups.push(...updatedBackups);
                                renderList(searchInput.value);
                                // Also update the preview if it exists
                                if (typeof updateBackupPreview === 'function') {
                                    updateBackupPreview();
                                }
                            }
                        });
                        actions.appendChild(restore);
                        actions.appendChild(del);

                        row.appendChild(info);
                        row.appendChild(actions);
                        list.appendChild(row);
                    });
                };

                searchInput.addEventListener('input', () => renderList(searchInput.value));
                renderList();

                panel.appendChild(header);
                panel.appendChild(searchWrap);
                panel.appendChild(list);
                overlay.appendChild(panel);

                overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
                document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); } });
                document.body.appendChild(overlay);
            }

            // --- AUTO BACKUP (DELTA-BASED): trigger only when NEW ASINs since last backup >= 100 ---
            // This replaces the previous inactivity/cooldown scheduler.
            let g_autoBackupDeltaDebounceTimer = null;
            let g_autoBackupDeltaEvalInProgress = false;
            let g_autoBackupDeltaGridObserver = null;
            let g_autoBackupDeltaContainerObserver = null;
            let g_autoBackupDeltaObservedGrid = null;

            function scheduleAutoBackupDeltaEval(reason = 'mutation') {
                try {
                    if (!isMonitorPage()) return;
                    if (g_autoBackupDeltaDebounceTimer) clearTimeout(g_autoBackupDeltaDebounceTimer);
                    g_autoBackupDeltaDebounceTimer = setTimeout(() => {
                        g_autoBackupDeltaDebounceTimer = null;
                        evaluateAutoBackupDelta(reason).catch(err => {
                            console.warn('Vine Modernized: Auto-backup delta evaluation failed:', err);
                        });
                    }, 1500);
                } catch { /* no-op */ }
            }

            async function evaluateAutoBackupDelta(reason = 'scheduled') {
                if (g_autoBackupDeltaEvalInProgress) return;
                if (isPerformingBackupOrRestore) return;
                if (!isMonitorPage()) return;
                if (typeof isRestoredFeedActive === 'function' && isRestoredFeedActive()) return;

                const autoBackupEnabled = localStorage.getItem('vine_monitor_auto_backup_enabled') === 'true';
                if (!autoBackupEnabled) return;

                const minItems = parseInt(localStorage.getItem('vine_monitor_min_items_backup') || '100', 10);
                const currentAsins = getCurrentAvailableAsinSetFromDom();
                const currentCount = currentAsins.size;
                if (!Number.isFinite(minItems) || minItems <= 0) return;

                if (currentCount < minItems) {
                    console.log('Vine Modernized: Auto-backup delta check skipped (below min items).', { reason, minItems, currentCount });
                    return;
                }

                g_autoBackupDeltaEvalInProgress = true;
                try {
                    await ensureLastBackupAsinSetLoaded();
                    const baseline = g_lastBackupAsinSet || new Set();

                    let newCount = 0;
                    for (const asin of currentAsins) {
                        if (!baseline.has(asin)) newCount++;
                    }

                    console.log('Vine Modernized: Auto-backup delta check', {
                        reason,
                        minItems,
                        threshold: AUTO_BACKUP_DELTA_THRESHOLD,
                        baselineCount: baseline.size,
                        currentCount,
                        newCount
                    });

                    if (newCount < AUTO_BACKUP_DELTA_THRESHOLD) return;

                    console.log('Vine Modernized: Auto-backup delta threshold met; creating backup...', { newCount });
                    await createAutomaticFeedBackup({ reason, newCount, baselineCount: baseline.size, currentCount, minItems });
                } finally {
                    g_autoBackupDeltaEvalInProgress = false;
                }
            }

            function attachAutoBackupDeltaObservers() {
                try {
                    if (!isMonitorPage()) return;

                    const grid = document.querySelector('#vvp-items-grid');
                    if (grid && grid !== g_autoBackupDeltaObservedGrid) {
                        g_autoBackupDeltaObservedGrid = grid;
                        try { g_autoBackupDeltaGridObserver?.disconnect?.(); } catch { }
                        g_autoBackupDeltaGridObserver = new MutationObserver(() => scheduleAutoBackupDeltaEval('grid mutation'));
                        g_autoBackupDeltaGridObserver.observe(grid, { childList: true, subtree: true });
                        scheduleAutoBackupDeltaEval('grid attach');
                    }

                    const container = document.querySelector('#vvp-items-grid-container');
                    if (container && !g_autoBackupDeltaContainerObserver) {
                        g_autoBackupDeltaContainerObserver = new MutationObserver(() => {
                            // Grid can be replaced (clear/fetch/restore); re-attach as needed.
                            setTimeout(() => attachAutoBackupDeltaObservers(), 80);
                        });
                        g_autoBackupDeltaContainerObserver.observe(container, { childList: true, subtree: true });
                    }
                } catch { /* no-op */ }
            }

            (function initAutoBackupDeltaSystem() {
                // Attach when entering monitor and when the DOM settles.
                window.addEventListener('hashchange', () => setTimeout(() => {
                    attachAutoBackupDeltaObservers();
                    if (isMonitorPage()) scheduleAutoBackupDeltaEval('hashchange');
                }, 120));

                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
                        attachAutoBackupDeltaObservers();
                        if (isMonitorPage()) scheduleAutoBackupDeltaEval('DOMContentLoaded');
                    }, 400));
                } else {
                    setTimeout(() => {
                        attachAutoBackupDeltaObservers();
                        if (isMonitorPage()) scheduleAutoBackupDeltaEval('boot');
                    }, 400);
                }
            })();

            async function createAutomaticFeedBackup(triggerInfo = null) {
                if (isPerformingBackupOrRestore) return;
                if (!isMonitorPage()) return;
                if (typeof isRestoredFeedActive === 'function' && isRestoredFeedActive()) return;
                if (localStorage.getItem('vine_monitor_auto_backup_enabled') !== 'true') return;

                isPerformingBackupOrRestore = true;
                try {
                    const items = extractAllCurrentFeedItems();
                    const minItems = parseInt(localStorage.getItem('vine_monitor_min_items_backup') || '100', 10);
                    if (!Number.isFinite(minItems) || items.length < minItems) {
                        console.log('Vine Modernized: Auto-backup aborted (below min items after extraction).', { minItems, itemCount: items.length, triggerInfo });
                        return;
                    }

                    const now = Date.now();
                    const backup = {
                        timestamp: now,
                        name: `Auto Backup ${formatDateTime(now)}`,
                        itemCount: items.length,
                        items
                    };

                    // Skip if unchanged since last backup (signature is the final guard)
                    try {
                        const sig = await computeFeedSignatureAsync(backup);
                        const lastSig = localStorage.getItem('vine_nm_feed_last_backup_sig') || '';
                        if (sig && sig === lastSig) {
                            console.log('Vine Modernized: Auto-backup skipped - feed unchanged since last backup.', { triggerInfo });
                            return;
                        }
                    } catch (e) {
                        console.warn('Vine Modernized: Failed to compute signature for auto-backup; proceeding cautiously.', e);
                    }

                    const success = await saveMonitorFeedBackup(backup);
                    if (success) {
                        updateStatusMessage(`Auto-backup created (${items.length} items)`);
                        console.log('Vine Modernized: Auto-backup created', { itemCount: items.length, triggerInfo });
                    }
                } finally {
                    isPerformingBackupOrRestore = false;
                }
            }

            function ensureMonitorConsentOnScrollEnd() {
                // Show the toggle button for monitor page
                if (!isMonitorPage()) return;
                // Always show the toggle button on monitor page
                showMonitorConsentUI();
            }

            // ========================================
            // VINE HELPER BRIDGE - Toolbar Integration
            // ========================================
            // This module bridges the gap between the Vine Helper extension and
            // dynamically loaded items from infinite scroll, injecting VH toolbars
            // and fetching ETV data from the VH API.
            //
            // Setup Required:
            // 1. Extract credentials from VH extension's localStorage:
            //    - general.uuid
            //    - crypto.privateKey (JWK format)
            //    - crypto.publicKey (JWK format)
            // 2. Store in userscript's localStorage:
            //    localStorage.setItem('vh_bridge_credentials', JSON.stringify({...}))
            // 3. Refresh page
            //
            // The bridge will automatically:
            // - Inject VH toolbar HTML into new tiles
            // - Fetch ETV data from api.vinehelper.ovh
            // - Update toolbars with ETV values

            const VH_BRIDGE = {
                // Configuration
                API_URL: 'https://api.vinehelper.ovh',
                API_VERSION: 5,

                // Credentials storage
                credentials: null,

                // Initialize credentials (call once on page load)
                async initCredentials() {
                    // Try to load from localStorage first
                    const stored = localStorage.getItem('vh_bridge_credentials');
                    if (stored) {
                        try {
                            this.credentials = JSON.parse(stored);
                            if (this.credentials && this.credentials.uuid && this.credentials.privateKey && this.credentials.publicKey) {
                                console.log('VH Bridge: Credentials loaded from storage');
                                // Validate that keys are valid JWK format
                                if (this.credentials.privateKey.kty && this.credentials.publicKey.kty) {
                                    return true;
                                } else {
                                    console.warn('VH Bridge: Stored credentials appear invalid (missing JWK fields)');
                                    this.credentials = null;
                                }
                            }
                        } catch (e) {
                            console.warn('VH Bridge: Failed to parse stored credentials', e);
                            this.credentials = null;
                        }
                    }

                    // If no valid credentials, show one-time setup message
                    const hasShownSetup = sessionStorage.getItem('vh_bridge_setup_shown');
                    if (!hasShownSetup) {
                        sessionStorage.setItem('vh_bridge_setup_shown', 'true');
                        console.log(
                            '%cVH Bridge Setup Required',
                            'color: #ff6b6b; font-weight: bold; font-size: 14px;',
                            '\n\nTo enable Vine Helper toolbar integration for infinite scroll items:\n\n' +
                            '1. Open Chrome DevTools (F12)\n' +
                            '2. Go to Application > Local Storage > chrome-extension://[VH-EXT-ID]\n' +
                            '3. Copy these values:\n' +
                            '   - general.uuid (string)\n' +
                            '   - crypto.privateKey (JSON object)\n' +
                            '   - crypto.publicKey (JSON object)\n\n' +
                            '4. Run in console:\n' +
                            'localStorage.setItem("vh_bridge_credentials", JSON.stringify({\n' +
                            '  uuid: "your-uuid-here",\n' +
                            '  privateKey: { /* paste privateKey JSON */ },\n' +
                            '  publicKey: { /* paste publicKey JSON */ }\n' +
                            '}));\n\n' +
                            '5. Refresh the page.\n\n' +
                            'Note: This is a one-time setup. Credentials are stored locally.'
                        );
                    }

                    return false;
                },

                // Convert base64 to ArrayBuffer
                base64ToBuffer(base64) {
                    const binary = atob(base64);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                        bytes[i] = binary.charCodeAt(i);
                    }
                    return bytes.buffer;
                },

                // Convert ArrayBuffer to base64
                bufferToBase64(buffer) {
                    const bytes = new Uint8Array(buffer);
                    let binary = '';
                    for (let i = 0; i < bytes.byteLength; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    return btoa(binary);
                },

                // Sign data using ECDSA (matching VH extension's crypto logic)
                async signData(data) {
                    if (!this.credentials || !this.credentials.privateKey) {
                        throw new Error('VH Bridge: Credentials not initialized');
                    }

                    try {
                        // Convert object to JSON string if necessary
                        const dataString = typeof data === 'string' ? data : JSON.stringify(data);

                        // Convert string to ArrayBuffer
                        const encoder = new TextEncoder();
                        const dataBuffer = encoder.encode(dataString);

                        // Import the private key
                        const privateKey = await crypto.subtle.importKey(
                            'jwk',
                            this.credentials.privateKey,
                            { name: 'ECDSA', namedCurve: 'P-256' },
                            true,
                            ['sign']
                        );

                        // Sign the data
                        const signature = await crypto.subtle.sign(
                            { name: 'ECDSA', hash: { name: 'SHA-256' } },
                            privateKey,
                            dataBuffer
                        );

                        // Convert to base64
                        return this.bufferToBase64(signature);
                    } catch (error) {
                        console.error('VH Bridge: Signing failed', error);
                        throw error;
                    }
                },

                // Get exported public key
                async getExportedPublicKey() {
                    if (!this.credentials || !this.credentials.publicKey) {
                        throw new Error('VH Bridge: Credentials not initialized');
                    }
                    return this.credentials.publicKey;
                },

                // Extract ASIN from a tile element
                extractASIN(tileElement) {
                    // Try multiple methods to find ASIN
                    const direct = tileElement.getAttribute('data-asin');
                    if (direct) return direct;

                    const input = tileElement.querySelector('input[data-asin]');
                    if (input) return input.dataset.asin || input.getAttribute('data-asin');

                    const dataAsin = tileElement.querySelector('[data-asin]');
                    if (dataAsin) return dataAsin.dataset.asin || dataAsin.getAttribute('data-asin');

                    return null;
                },

                // Extract product data from a tile (matching VH's getAllProductsData format)
                extractProductData(tileElement) {
                    const asin = this.extractASIN(tileElement);
                    if (!asin) return null;

                    const btn = tileElement.querySelector(`input[data-asin="${asin}"]`);
                    if (!btn) return null;

                    // Convert to boolean (matching extension behavior: == "true" converts to boolean)
                    const isParent = btn.dataset.isParentAsin == "true";
                    const isPreRelease = btn.dataset.isPreRelease == "true";
                    const recommendationId = btn.dataset.recommendationId || '';
                    const recommendationType = btn.dataset.recommendationType || '';

                    // Extract enrollment GUID from recommendation ID
                    let enrollmentGUID = '';
                    if (recommendationId.includes('vine.enrollment.')) {
                        enrollmentGUID = recommendationId.split('vine.enrollment.')[1];
                    }

                    // Get title
                    const titleLink = tileElement.querySelector('.a-link-normal');
                    const title = titleLink?.getAttribute('data-tooltip') ||
                        titleLink?.textContent?.trim() || '';

                    // Get thumbnail
                    const img = tileElement.querySelector('img');
                    const thumbnail = img?.src || '';

                    // Determine queue from recommendation type
                    let queue = 'encore'; // default
                    if (recommendationType === 'VENDOR_TARGETED') queue = 'potluck';
                    else if (recommendationType === 'VENDOR_VINE_FOR_ALL') queue = 'last_chance';
                    else if (recommendationType === 'VINE_FOR_ALL') queue = 'encore';
                    else if (recommendationType === 'ALL_ITEMS') queue = 'all_items';

                    if (!title || !thumbnail) return null;

                    return {
                        asin: asin,
                        title: title,
                        thumbnail: thumbnail,
                        is_parent_asin: isParent,
                        is_pre_release: isPreRelease,
                        enrollment_guid: enrollmentGUID,
                        queue: queue
                    };
                },

                // Inject VH toolbar into a tile element
                injectToolbar(tileElement) {
                    const asin = this.extractASIN(tileElement);
                    if (!asin) {
                        return false;
                    }

                    // Check if toolbar already exists
                    if (tileElement.querySelector('.vh-status')) {
                        return true; // Already has toolbar
                    }

                    // Wrap image in vh-img-container if not already done
                    let imgContainer = tileElement.querySelector('.vh-img-container');
                    if (!imgContainer) {
                        const img = tileElement.querySelector('.vvp-item-tile-content img');
                        if (img) {
                            imgContainer = document.createElement('div');
                            imgContainer.classList.add('vh-img-container');
                            img.parentNode.insertBefore(imgContainer, img);
                            imgContainer.appendChild(img);
                        }
                    }

                    // Create toolbar HTML structure
                    const toolbarId = `vh-toolbar-${asin}`;
                    const toolbar = document.createElement('div');
                    toolbar.id = toolbarId;
                    toolbar.className = 'vh-status';

                    toolbar.innerHTML = `
                    <div class="vh-status-container">
                        <div class="vh-status-container2">
                            <a href="#${asin}" id="vh-details-link-${asin}" class="vh-floating-icon vh-details-link" title="Details" onclick="return false;">
                                <div class="vh-toolbar-icon vh-icon-question"></div>
                            </a>
                            <div class="vh-toolbar-etv" style="display: flex;">
                                <span class="etv" title="ETV: Loading...">...</span>
                                <span class="price"></span>
                            </div>
                        </div>
                    </div>
                `;

                    // Insert toolbar into tile
                    const tileContent = tileElement.querySelector('.vvp-item-tile-content');
                    if (tileContent) {
                        // Insert at the beginning of tile content
                        tileContent.insertBefore(toolbar, tileContent.firstChild);
                    } else {
                        // Fallback: prepend to tile
                        tileElement.insertBefore(toolbar, tileElement.firstChild);
                    }

                    // Add vh-gridview class if not present
                    if (!tileElement.classList.contains('vh-gridview') && !tileElement.classList.contains('vh-listview')) {
                        tileElement.classList.add('vh-gridview');
                    }

                    return true;
                },

                // Get country code from current page
                getCountryCode() {
                    const hostname = window.location.hostname;
                    // Handle various Amazon domains
                    if (hostname.includes('.ca')) return 'ca';
                    if (hostname.includes('.co.uk')) return 'co.uk';
                    if (hostname.includes('.de')) return 'de';
                    if (hostname.includes('.fr')) return 'fr';
                    if (hostname.includes('.it')) return 'it';
                    if (hostname.includes('.es')) return 'es';
                    if (hostname.includes('.jp')) return 'jp';
                    return 'com'; // Default
                },

                // Fetch ETV data from VH API for a list of ASINs
                async fetchETVData(productsData) {
                    if (!this.credentials) {
                        console.warn('VH Bridge: Cannot fetch ETV - credentials not initialized');
                        return null;
                    }

                    if (!productsData || productsData.length === 0) {
                        return null;
                    }

                    try {
                        const countryCode = this.getCountryCode();

                        // Extract queue from URL if available
                        const urlParams = new URLSearchParams(window.location.search);
                        const queueParam = urlParams.get('queue') || null;

                        // Build request payload (matching VH extension's format)
                        const content = {
                            api_version: this.API_VERSION,
                            app_version: '3.8.7', // Current VH version
                            action: 'get_info',
                            country: countryCode,
                            uuid: this.credentials.uuid,
                            fid: this.credentials.fid || null,
                            cid: this.credentials.cid || null,
                            tier: 0, // Default tier (matching extension behavior)
                            queue: queueParam,
                            items: productsData,
                            request_variants: false,
                            p: null
                        };

                        // Sign the request
                        const signature = await this.signData(content);
                        content.s = signature;
                        content.pk = await this.getExportedPublicKey();

                        // Make API request
                        return new Promise((resolve, reject) => {
                            GM_xmlhttpRequest({
                                method: 'POST',
                                url: this.API_URL,
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                data: JSON.stringify(content),
                                timeout: 10000, // 10 second timeout
                                onload: (response) => {
                                    if (response.status !== 200) {
                                        console.error('VH Bridge: API returned status', response.status);
                                        reject(new Error(`API returned status ${response.status}`));
                                        return;
                                    }

                                    try {
                                        const data = JSON.parse(response.responseText);

                                        if (data.invalid_uuid) {
                                            console.error('VH Bridge: Invalid UUID - credentials may need refresh');
                                            // Clear invalid credentials
                                            localStorage.removeItem('vh_bridge_credentials');
                                            reject(new Error('Invalid UUID - credentials cleared'));
                                        } else if (data.products) {
                                            resolve(data);
                                        } else {
                                            console.warn('VH Bridge: Unexpected API response format - missing products key');
                                            resolve(data); // Still resolve, might have partial data
                                        }
                                    } catch (e) {
                                        console.error('VH Bridge: Failed to parse API response', e);
                                        reject(e);
                                    }
                                },
                                onerror: (error) => {
                                    console.error('VH Bridge: API request failed', error);
                                    reject(error);
                                },
                                ontimeout: () => {
                                    console.error('VH Bridge: API request timed out');
                                    reject(new Error('Request timeout'));
                                }
                            });
                        });
                    } catch (error) {
                        console.error('VH Bridge: Error fetching ETV data', error);
                        return null;
                    }
                },

                // Update toolbar with ETV data
                updateToolbarWithETV(asin, etvData) {
                    const toolbar = document.querySelector(`#vh-toolbar-${asin}`);
                    if (!toolbar) return;

                    const etvSpan = toolbar.querySelector('.vh-toolbar-etv .etv');
                    if (!etvSpan) return;

                    if (etvData && etvData.etv_min != null) {
                        const etvMin = parseFloat(etvData.etv_min);
                        const etvMax = parseFloat(etvData.etv_max || etvData.etv_min);

                        let etvText = '';
                        if (etvMin === etvMax) {
                            etvText = `$${etvMin.toFixed(2)}`;
                        } else {
                            etvText = `$${etvMin.toFixed(2)} - $${etvMax.toFixed(2)}`;
                        }

                        etvSpan.textContent = etvText;
                        etvSpan.setAttribute('title', `ETV: ${etvText}`);
                        etvSpan.setAttribute('data-etv-min', etvMin);
                        etvSpan.setAttribute('data-etv-max', etvMax);

                        // Show the toolbar
                        const etvContainer = toolbar.querySelector('.vh-toolbar-etv');
                        if (etvContainer) {
                            etvContainer.style.display = 'flex';
                        }
                    } else {
                        etvSpan.textContent = '--';
                        etvSpan.setAttribute('title', 'ETV: Unknown');
                    }
                },

                // Process newly added tiles (main entry point)
                async processNewTiles(newTileElements) {
                    if (!this.credentials) {
                        // Try to initialize if not done yet
                        const initialized = await this.initCredentials();
                        if (!initialized || !this.credentials) {
                            console.log('VH Bridge: Skipping toolbar injection - no credentials');
                            return;
                        }
                    }

                    const productsData = [];

                    // Extract product data and inject toolbars
                    for (const tileElement of newTileElements) {
                        const productData = this.extractProductData(tileElement);
                        if (productData) {
                            productsData.push(productData);
                            // Inject toolbar immediately for visual feedback
                            this.injectToolbar(tileElement);
                        }
                    }

                    if (productsData.length === 0) {
                        return;
                    }

                    // Fetch ETV data from API
                    try {
                        const apiResponse = await this.fetchETVData(productsData);
                        if (apiResponse && apiResponse.products) {
                            // Update each toolbar with ETV data
                            for (const [asin, etvData] of Object.entries(apiResponse.products)) {
                                this.updateToolbarWithETV(asin, etvData);
                            }
                        }
                    } catch (error) {
                        console.warn('VH Bridge: Failed to fetch ETV data', error);
                    }
                }
            };

            // Initialize VH Bridge on page load
            VH_BRIDGE.initCredentials().then(initialized => {
                if (initialized) {
                    console.log('VH Bridge: Ready for toolbar injection');
                }
            });

            let isLoading = false;
            let nextUrl = null;

            function getNextPageUrl(doc = document) {
                const nextLink = doc.querySelector('.a-pagination .a-last:not(.a-disabled) a');
                return nextLink ? nextLink.href : null;
            }

            async function loadMoreItems() {
                if (isLoading || !nextUrl) return;
                isLoading = true;
                showLoadingIndicator(true);

                try {
                    const response = await fetch(nextUrl);
                    const text = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'text/html');

                    const newItems = doc.querySelectorAll('#vvp-items-grid .vvp-item-tile');
                    const itemsGrid = document.querySelector('#vvp-items-grid');

                    if (newItems.length > 0 && itemsGrid) {
                        // Import and append new items
                        const importedItems = [];
                        newItems.forEach(item => {
                            const imported = document.importNode(item, true);
                            itemsGrid.appendChild(imported);
                            importedItems.push(imported);
                        });

                        // Process new tiles with VH Bridge (inject toolbars and fetch ETV)
                        // Run asynchronously so it doesn't block the UI
                        VH_BRIDGE.processNewTiles(importedItems).catch(error => {
                            console.warn('VH Bridge: Error processing new tiles', error);
                        });
                    }

                    const newNextUrl = getNextPageUrl(doc);
                    if (newNextUrl) {
                        history.pushState(null, '', nextUrl); // Update URL to trigger extensions like VineHelper
                        nextUrl = newNextUrl;
                    } else {
                        nextUrl = null; // No more pages
                        showLoadingIndicator(false, 'No more items.');
                        window.removeEventListener('scroll', handleScroll);
                    }

                    if (nextUrl) {
                        showLoadingIndicator(false);
                    }

                } catch (error) {
                    console.error('Vine Infinite Scroll Error:', error);
                    showLoadingIndicator(false, 'Error loading items.');
                } finally {
                    isLoading = false;
                }
            }

            function handleScroll() {
                const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (window.scrollY >= scrollableHeight - INFINITE_SCROLL_TRIGGER_OFFSET) {
                    loadMoreItems();
                }
            }

            function showLoadingIndicator(show, message = 'Loading more items...') {
                let indicator = document.querySelector('#infinite-scroll-indicator');
                if (!indicator) {
                    indicator = document.createElement('div');
                    indicator.id = 'infinite-scroll-indicator';
                    const gridContainer = document.querySelector('#vvp-items-grid-container');
                    if (gridContainer) gridContainer.appendChild(indicator);
                }

                if (show) {
                    indicator.innerHTML = `<span>${message}</span>`;
                    indicator.style.display = 'block';
                } else if (message) {
                    indicator.innerHTML = `<span>${message}</span>`;
                    indicator.style.display = 'block';
                } else {
                    indicator.style.display = 'none';
                }
            }

            function initInfiniteScroll() {
                // Reset existing state for potential re-initialization (e.g. after category change)
                isLoading = false;
                window.removeEventListener('scroll', handleScroll);

                // On Notification Monitor page, show toggle button and check consent
                if (isMonitorPage()) {
                    console.log('Vine Infinite Scroll: Monitor page detected.');
                    ensureMonitorConsentOnScrollEnd();
                    // Only proceed with infinite scroll if consent is granted
                    if (!hasMonitorConsent()) {
                        console.log('Vine Infinite Scroll: Waiting for user consent to load Encore items.');
                        return;
                    }
                }
                const pagination = document.querySelector('.a-pagination');
                nextUrl = getNextPageUrl();

                if (nextUrl && pagination) {
                    pagination.style.display = 'none'; // Hide original pagination
                    window.addEventListener('scroll', handleScroll);
                    console.log('Vine Infinite Scroll Initialized. Next page:', nextUrl);
                } else {
                    console.log('Vine Infinite Scroll: No pagination or next page found.');
                }
            }
            // Expose to window so it can be re-triggered by the sidebar category sync
            window.vineInfiniteScrollInit = initInfiniteScroll;

            // Wait for page to be ready
            setTimeout(initInfiniteScroll, 1000);
        }

        // --- FAVORITES FEATURE ---
        if (ENABLE_FAVORITES_FEATURE) {
            console.log('Vine Modernized: Initializing Favorites Feature...');
            initFavoritesFeature();

            // Initialize tab close sync watcher (wait for tab to be created)
            setTimeout(() => {
                setupFavoritesTabCloseSync();
            }, 2000);

            // Check for unsaved changes on page load and sync if needed (with delay for page load)
            setTimeout(() => {
                checkPageLoadSync();
            }, 3000);
        }

        function exportFavorites(e) {
            e.preventDefault();
            const favorites = getFavorites();
            if (favorites.length === 0) {
                alert('You have no favorites to export.');
                return;
            }
            const dataStr = JSON.stringify(favorites, null, 2); // Pretty print JSON
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'amazon-vine-favorites.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log('Vine Modernized: Favorites exported.');
        }

        function importFavorites(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (event) {
                try {
                    const importedFavorites = JSON.parse(event.target.result);
                    if (!Array.isArray(importedFavorites)) {
                        throw new Error('Imported file is not a valid favorites array.');
                    }

                    const validImported = importedFavorites.filter(item => item.asin && item.title);
                    let currentFavorites = getFavorites();
                    const currentAsins = new Set(currentFavorites.map(item => item.asin));
                    const newFavorites = validImported.filter(item => !currentAsins.has(item.asin));

                    if (newFavorites.length === 0) {
                        alert('No new favorites to import. All items in the file are already in your favorites.');
                        return;
                    }

                    const mergedFavorites = [...currentFavorites, ...newFavorites];
                    saveFavorites(mergedFavorites);
                    alert(`Successfully imported ${newFavorites.length} new favorite items!`);

                    if (document.querySelector('#vvp-favorites-container')?.style.display !== 'none') {
                        renderFavoritesPage();
                    }

                    newFavorites.forEach(item => {
                        const tile = document.querySelector(`.vvp-item-tile input[data-asin="${item.asin}"]`)?.closest('.vvp-item-tile');
                        if (tile) {
                            const btn = tile.querySelector('.favorite-btn');
                            if (btn && !btn.classList.contains('favorited')) {
                                btn.classList.add('favorited');
                                btn.innerHTML = createFavoritedHeartSVG();
                                btn.title = 'Remove from Favorites';
                            }
                        }
                    });

                } catch (error) {
                    alert('Error importing favorites. Please make sure the file is a valid JSON export.');
                    console.error('Vine Modernized: Import Error:', error);
                } finally {
                    e.target.value = '';
                }
            };
            reader.readAsText(file);
        }

        function initFavoritesFeature() {
            createFavoritesTab();
            createFavoritesContainer();
            observeItemsGrid();
            observeDetailsModal(); // Watch for the modal popup
            observeBuyNowGlobally(); // Ensure Buy Now appears outside the main grid as well (e.g., Notifications Monitor)

            // Auto-show favorites if flag is present in URL
            if (window.location.search.includes('favorites')) {
                setTimeout(() => {
                    if (typeof showFavoritesPage === 'function') {
                        showFavoritesPage(true);
                    }
                }, 800);
            }
        }

        function observeItemsGrid() {
            let itemsGridObserver = null;
            let containerObserver = null;
            const tilesSkippedForNoAsin = new WeakSet(); // Track tiles without ASIN to avoid infinite retries

            const processNewTiles = (node) => {
                if (node.nodeType === 1 && node.classList?.contains('vvp-item-tile')) {
                    addFavoriteButton(node);
                    addBuyNowButton(node);
                    // Only log if button addition failed (ASIN missing) - successful additions are silent
                }
            };

            const updateResultsCountText = () => {
                const container = document.querySelector('#vvp-items-grid-container');
                if (!container) return;
                const p = container.querySelector('p');
                if (!p) return;

                const text = p.textContent;
                const match = text.match(/of\s+([\d,]+)/i) || text.match(/Showing\s+[\d-]+\s+of\s+([\d,]+)/i);
                if (match && match[1]) {
                    p.textContent = `Displaying ${match[1]} results`;
                }
            };

            const attachObserverToGrid = (grid) => {
                if (!grid) {
                    console.warn('Vine Modernized: Cannot attach observer to null grid');
                    return false;
                }

                // Disconnect old observer if exists
                if (itemsGridObserver) {
                    itemsGridObserver.disconnect();
                }

                // Process any existing tiles
                const existingTiles = grid.querySelectorAll('.vvp-item-tile');
                if (existingTiles.length > 0) {
                    console.log(`Vine Modernized: Processing ${existingTiles.length} existing tiles`);
                }
                existingTiles.forEach(tile => {
                    addFavoriteButton(tile);
                    addBuyNowButton(tile);
                });

                updateResultsCountText();

                // Create new observer for this grid
                itemsGridObserver = new MutationObserver(mutations => {
                    updateResultsCountText();
                    mutations.forEach(mutation => {
                        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                            // Only log bulk additions (more than 10 nodes) to reduce noise
                            const totalAdded = mutation.addedNodes.length;
                            if (totalAdded > 10) {
                                console.log(`Vine Modernized: Grid added ${totalAdded} nodes (bulk addition)`);
                            }

                            mutation.addedNodes.forEach(node => {
                                // Handle both regular nodes and document fragments
                                if (node.nodeType === 11) { // DocumentFragment
                                    const children = Array.from(node.children || []);
                                    if (children.length > 10) {
                                        console.log(`Vine Modernized: Processing document fragment with ${children.length} children`);
                                    }
                                    children.forEach(child => processNewTiles(child));
                                } else {
                                    processNewTiles(node);
                                }
                            });
                        }
                    });
                });

                itemsGridObserver.observe(grid, { childList: true });
                console.log('Vine Modernized: Favorites observer attached to items grid');
                return true;
            };

            // Wait for grid to exist with retries
            let attempts = 0;
            const maxAttempts = 50;

            const tryAttachObserver = () => {
                const grid = document.querySelector('#vvp-items-grid');
                if (grid) {
                    attachObserverToGrid(grid);
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(tryAttachObserver, 100);
                } else {
                    console.warn('Vine Modernized: Could not find item grid after retries');
                }
            };

            // Watch for grid container being replaced/recreated (handles NM clearing/fetching)
            const setupContainerObserver = () => {
                const container = document.querySelector('#vvp-items-grid-container');
                if (!container) {
                    // Retry if container doesn't exist yet
                    setTimeout(setupContainerObserver, 200);
                    return;
                }

                if (containerObserver) {
                    containerObserver.disconnect();
                }

                containerObserver = new MutationObserver(mutations => {
                    updateResultsCountText();
                    mutations.forEach(mutation => {
                        if (mutation.addedNodes) {
                            mutation.addedNodes.forEach(node => {
                                if (node.nodeType === 1) {
                                    const gridInNode = node.querySelector?.('#vvp-items-grid');
                                    if (gridInNode) {
                                        console.log('Vine Modernized: Items grid detected in added node, re-attaching observer');
                                        attachObserverToGrid(gridInNode);
                                    }
                                }
                            });
                        }
                    });
                });

                containerObserver.observe(container, { childList: true, subtree: true });
                console.log('Vine Modernized: Container observer attached to:', container.id);
            };

            // Also watch the entire document for ANY grid appearance (belt-and-suspenders approach)
            const globalDocumentObserver = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.addedNodes) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                // Check if this IS the grid
                                if (node.id === 'vvp-items-grid' && node.classList.contains('a-section')) {
                                    console.log('Vine Modernized: Grid element itself was added to DOM, re-attaching observer');
                                    attachObserverToGrid(node);
                                }
                                // Or check if it contains the grid
                                const gridInNode = node.querySelector?.('#vvp-items-grid');
                                if (gridInNode) {
                                    console.log('Vine Modernized: Grid found in added subtree, re-attaching observer');
                                    attachObserverToGrid(gridInNode);
                                }
                            }
                        });
                    }
                });
            });

            globalDocumentObserver.observe(document.body, { childList: true, subtree: true });
            console.log('Vine Modernized: Global document observer attached');

            // Start both processes
            tryAttachObserver();
            setupContainerObserver();

            // Persistent polling safety net for edge cases (checks every 5 seconds, lightweight)
            // This catches any tiles that weren't picked up by observers for any reason
            setInterval(() => {
                const grid = document.querySelector('#vvp-items-grid');
                if (grid) {
                    const tilesWithoutButtons = Array.from(grid.querySelectorAll('.vvp-item-tile')).filter(
                        tile => !tile.querySelector('.favorite-btn') && !tilesSkippedForNoAsin.has(tile)
                    );
                    if (tilesWithoutButtons.length > 0) {
                        let successful = 0;
                        tilesWithoutButtons.forEach(tile => {
                            // Try to add button, count successful additions
                            const hadButton = tile.querySelector('.favorite-btn');
                            addFavoriteButton(tile);
                            if (tile.querySelector('.favorite-btn')) {
                                successful++;
                            } else {
                                // Button wasn't added - likely no ASIN. Add to skip list to avoid infinite retries
                                tilesSkippedForNoAsin.add(tile);
                            }
                        });
                        // Only log if we successfully added some buttons (not just ASIN-less placeholders)
                        if (successful > 0) {
                            console.log(`Vine Modernized: Added favorite buttons to ${successful} tile(s) via polling safety net`);
                        }
                    }
                }
            }, 5000); // Check every 5 seconds
        }

        function observeDetailsModal() {
            const modalObserver = new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    // When modal is added
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1 && node.querySelector('#vvp-product-details-modal--content')) {
                            console.log('Vine Modernized: Details modal opened, waiting for content...');
                            // Use a small timeout to ensure modal content is fully loaded by Amazon's scripts
                            setTimeout(injectFavoriteButtonIntoModal, 200);
                            return;
                        }
                    }
                    // When modal is removed
                    for (const node of mutation.removedNodes) {
                        if (node.nodeType === 1 && node.querySelector('#vvp-product-details-modal--content')) {
                            console.log('Vine Modernized: Details modal closed.');
                            g_lastClickedItemData = null; // Clear the data
                            return;
                        }
                    }
                }
            });
            modalObserver.observe(document.body, { childList: true });
        }

        // Observe the whole document for any tiles (covers Notifications Monitor and other dynamic areas)
        function observeBuyNowGlobally() {
            const injectAll = (root) => {
                (root.querySelectorAll ? root.querySelectorAll('.vvp-item-tile') : []).forEach(el => addBuyNowButton(el));
                // Some NM layouts may wrap differently; try closest ancestor by id pattern too
                if (root.id && root.id.startsWith('vh-notification-')) {
                    const tile = root.querySelector?.('.vvp-item-tile') || root.closest?.('.vvp-item-tile');
                    if (tile) addBuyNowButton(tile);
                }
            };

            // Initial injection
            injectAll(document);

            // Mutation observer for dynamic content
            const mo = new MutationObserver(mutations => {
                for (const m of mutations) {
                    for (const node of m.addedNodes) {
                        if (node.nodeType !== 1) continue;
                        if (node.classList?.contains('vvp-item-tile')) {
                            addBuyNowButton(node);
                        }
                        injectAll(node);
                    }
                }
            });
            mo.observe(document.documentElement, { childList: true, subtree: true });

            // Lightweight periodic backstop for missed cases
            setInterval(() => {
                document.querySelectorAll('.vvp-item-tile').forEach(el => addBuyNowButton(el));
            }, 7000);
        }

        function injectFavoriteButtonIntoModal() {
            // Helper to extract item data from modal
            function extractItemDataFromModal(modal) {
                let asin = '';
                let title = '';
                let imgUrl = '';
                let link = '';
                let isParentAsin = 'false';
                let isPreRelease = 'false';
                let recommendationId = '';
                let recommendationType = 'VINE_FOR_ALL';

                const asinInput = modal.querySelector('input[data-asin]');
                if (asinInput) {
                    asin = asinInput.dataset.asin;
                    isParentAsin = asinInput.dataset.isParentAsin || 'false';
                    isPreRelease = asinInput.dataset.isPreRelease || 'false';
                    recommendationId = asinInput.dataset.recommendationId || '';
                    recommendationType = asinInput.dataset.recommendationType || 'VINE_FOR_ALL';
                }
                const titleEl = modal.querySelector('.a-truncate-full, .vvp-product-title, h1, h2, h3');
                if (titleEl) {
                    title = titleEl.textContent.trim();
                }
                const imgEl = modal.querySelector('img');
                if (imgEl) {
                    imgUrl = imgEl.src;
                }
                const linkEl = modal.querySelector('.a-link-normal[href]');
                if (linkEl) {
                    link = linkEl.href;
                }
                if (asin) {
                    return {
                        asin,
                        title: title || 'Unknown Title',
                        imgUrl: imgUrl || '',
                        link: link || '#',
                        isParentAsin,
                        isPreRelease,
                        recommendationId,
                        recommendationType
                    };
                }
                return null;
            }

            // Wait for ASIN input to appear in modal, up to 2 seconds
            const tryInject = (attempt = 0) => {
                const modal = document.querySelector('#vvp-product-details-modal--content');
                if (!modal) {
                    if (attempt < 20) setTimeout(() => tryInject(attempt + 1), 100);
                    else console.warn('Vine Modernized: Modal DOM not found after waiting.');
                    return;
                }
                let itemData = g_lastClickedItemData;
                if (!itemData) {
                    itemData = extractItemDataFromModal(modal);
                    if (!itemData) {
                        if (attempt < 20) setTimeout(() => tryInject(attempt + 1), 100);
                        else console.warn('Vine Modernized: Could not extract ASIN from modal after waiting.');
                        return;
                    }
                    g_lastClickedItemData = itemData;
                    console.log('Vine Modernized: Fallback - extracted item data from modal (async):', itemData);
                }
                const targetContainer = document.querySelector('#vvp-product-details-img-container');
                if (!targetContainer) {
                    if (attempt < 20) setTimeout(() => tryInject(attempt + 1), 100);
                    else console.error("Vine Modernized: Could not find target container '#vvp-product-details-img-container' in modal after waiting.");
                    return;
                }
                if (targetContainer.querySelector('.favorite-btn')) {
                    console.log('Vine Modernized: Favorite button already exists in modal.');
                    return;
                }
                const asin = itemData.asin;
                const btn = document.createElement('span');
                btn.className = 'favorite-btn';
                btn.dataset.asin = asin;
                if (isFavorited(asin)) {
                    btn.classList.add('favorited');
                    btn.innerHTML = createFavoritedHeartSVG();
                    btn.title = 'Remove from Favorites';
                } else {
                    btn.innerHTML = createUnfavoritedHeartSVG();
                    btn.title = 'Add to Favorites';
                }
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleFavoriteByData(itemData);
                });
                targetContainer.appendChild(btn);
                console.log(`Vine Modernized: Injected favorite button for ASIN ${asin} into modal image container.`);
            };
            tryInject();
        }

        // Check if we're on a page where favorites tab should be shown
        function shouldShowFavoritesTab() {
            const url = window.location.href;
            // Check for encore, potluck, or last_chance queues
            return /queue=(encore|potluck|last_chance)(\D|$)/.test(url);
        }

        function createFavoritesTab() {
            const tabsContainer = document.querySelector('ul.a-tabs');
            if (!tabsContainer || document.querySelector('#vvp-favorites-tab')) return;

            // Only create tab on specific pages
            if (!shouldShowFavoritesTab()) {
                console.log('Vine Modernized: Favorites tab not shown on this page (not encore/potluck/last_chance).');
                return;
            }

            const favoritesTab = document.createElement('li');
            favoritesTab.id = 'vvp-favorites-tab';
            favoritesTab.className = 'a-tab-heading';
            favoritesTab.setAttribute('role', 'presentation');

            // Start with opacity 0 for fade-in animation
            favoritesTab.style.opacity = '0';
            favoritesTab.style.transition = 'opacity 0.8s ease-in';

            const link = document.createElement('a');
            link.href = '#';
            link.setAttribute('role', 'tab');
            link.textContent = 'Favorites';
            favoritesTab.appendChild(link);

            link.addEventListener('click', e => {
                console.log('Vine Modernized: Favorites tab clicked.');
                e.preventDefault();
                showFavoritesPage();
            });

            document.querySelectorAll('ul.a-tabs li[id^="vvp-"]:not(#vvp-favorites-tab) a').forEach(tabLink => {
                tabLink.addEventListener('click', () => {
                    console.log('Vine Modernized: Original tab clicked, hiding favorites page.');
                    hideFavoritesPage();
                });
            });

            // Insert before the search container if it exists (highest priority for layout)
            const searchContainer = tabsContainer.querySelector('#vvp-tabs-search-container');
            // Insert before the theme toggle if it exists, otherwise append
            const themeToggle = tabsContainer.querySelector('#vvp-theme-toggle-container');

            if (searchContainer) {
                tabsContainer.insertBefore(favoritesTab, searchContainer);
            } else if (themeToggle) {
                tabsContainer.insertBefore(favoritesTab, themeToggle);
            } else {
                tabsContainer.appendChild(favoritesTab);
            }

            // Trigger fade-in animation after a small delay
            setTimeout(() => {
                favoritesTab.style.opacity = '1';
            }, 100);

            console.log('Vine Modernized: Favorites tab created with fade-in animation.');
        }

        // Reusable cloud menu (singleton) that can be opened next to any trigger
        // context: 'favorites' | 'feed'
        function ensureGlobalCloudMenu() {
            let menu = document.getElementById('cloud-sync-menu');
            if (menu) return menu;

            const wrapper = document.createElement('div');
            wrapper.id = 'vvp-global-cloud-menu-wrapper';
            wrapper.style.cssText = 'position: fixed; z-index: 10000; display: none;';

            // Keep the original IDs so existing logic like updateSyncStatus() continues to work
            wrapper.innerHTML = `
            <div id="cloud-sync-menu" style="background: white; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 280px; max-width: 320px;">
                <div style="padding: 16px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1; padding-right: 12px;">
                        <div style="font-weight: 600; margin-bottom: 8px;">Cloud Sync</div>
                        <div id="sync-status" style="font-size: 13px; color: #666;"></div>
                        <div id="sync-quota" style="font-size: 12px; color: #888; margin-top: 4px;"></div>
                        <div id="unsaved-changes-notice" style="display: none; margin-top: 8px; padding: 8px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; font-size: 12px; color: #856404;">
                            <strong>⚠️ Unsaved changes detected</strong>
                            <div id="unsaved-count" style="margin-top: 4px;"></div>
                        </div>
                    </div>
                    <a id="pastebin-account-link" href="#" target="_blank" style="display: none; flex-direction: column; align-items: center; text-decoration: none; color: #333; min-width: 70px;">
                        <div id="pastebin-profile-pic" style="width: 48px; height: 48px; border-radius: 50%; background: #eee; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 4px; border: 1px solid #ddd;">
                            ${createGenericUserSVG()}
                        </div>
                        <div id="pastebin-username-display" style="font-size: 11px; font-weight: 500; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center;"></div>
                    </a>
                </div>
                <div style="padding: 8px 0;">
                    <button id="sync-to-cloud-btn" class="cloud-menu-btn" style="width: 100%; text-align: left; padding: 10px 16px; border: none; background: none; cursor: pointer; display: flex; align-items: center; gap: 8px; color: #000;">
                        <span style="font-size: 16px;">⬆️</span>
                        <span>Sync to Cloud</span>
                    </button>
                    <button id="sync-from-cloud-btn" class="cloud-menu-btn" style="width: 100%; text-align: left; padding: 10px 16px; border: none; background: none; cursor: pointer; display: flex; align-items: center; gap: 8px; color: #000;">
                        <span style="font-size: 16px;">⬇️</span>
                        <span>Import from Cloud</span>
                    </button>
                    <button id="auto-sync-toggle-btn" class="cloud-menu-btn" style="width: 100%; text-align: left; padding: 10px 16px; border: none; background: none; cursor: pointer; display: flex; align-items: center; gap: 8px; justify-content: space-between; color: #000;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 16px;">🔄</span>
                            <span>Auto-Sync</span>
                        </div>
                        <label class="vine-switch" style="margin: 0;">
                            <input type="checkbox" id="auto-sync-checkbox">
                            <span class="vine-slider"></span>
                        </label>
                    </button>
                    <div style="border-top: 1px solid #eee; margin: 8px 0;"></div>
                    <button id="pastebin-settings-btn" class="cloud-menu-btn" style="width: 100%; text-align: left; padding: 10px 16px; border: none; background: none; cursor: pointer; display: flex; align-items: center; gap: 8px; color: #000;">
                        <span style="font-size: 16px;">⚙️</span>
                        <span>Pastebin Settings</span>
                    </button>
                    <button id="delete-cloud-favorites-btn" class="cloud-menu-btn" style="width: 100%; text-align: left; padding: 10px 16px; border: none; background: none; cursor: pointer; display: flex; align-items: center; gap: 8px; color: #b12704;">
                        <span style="font-size: 16px;">🗑️</span>
                        <span>Delete Cloud Data</span>
                    </button>
                </div>
            </div>`;

            document.body.appendChild(wrapper);

            // Common hover effects
            wrapper.querySelectorAll('.cloud-menu-btn').forEach(btn => {
                btn.addEventListener('mouseenter', () => btn.style.background = '#f5f5f5');
                btn.addEventListener('mouseleave', () => btn.style.background = 'none');
            });

            // Close when clicking anywhere else
            document.addEventListener('click', (e) => {
                if (!wrapper.contains(e.target)) {
                    wrapper.style.display = 'none';
                }
            });

            // Settings button
            wrapper.querySelector('#pastebin-settings-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                showPastebinSettings();
            });

            return wrapper.querySelector('#cloud-sync-menu');
        }

        function openCloudMenu(anchorBtn, context = 'favorites') {
            const menu = ensureGlobalCloudMenu();
            const wrapper = document.getElementById('vvp-global-cloud-menu-wrapper');

            // Position the wrapper under the anchor (right-aligned)
            const rect = anchorBtn.getBoundingClientRect();
            const top = rect.bottom + 6;
            const left = Math.min(window.innerWidth - 320, Math.max(8, rect.right - 300));
            wrapper.style.top = `${top}px`;
            wrapper.style.left = `${left}px`;

            // Wire actions per context
            const toCloud = menu.querySelector('#sync-to-cloud-btn');
            const fromCloud = menu.querySelector('#sync-from-cloud-btn');
            const autoToggleBtn = menu.querySelector('#auto-sync-toggle-btn');
            const autoCheckbox = menu.querySelector('#auto-sync-checkbox');
            const deleteCloudBtn = menu.querySelector('#delete-cloud-favorites-btn');

            // Clear previous handlers
            toCloud.onclick = null;
            fromCloud.onclick = null;
            autoToggleBtn.onclick = null;
            deleteCloudBtn.onclick = null;

            if (context === 'feed') {
                deleteCloudBtn.style.display = 'none';
                toCloud.onclick = (e) => { e.stopPropagation(); handleFeedBackupSyncToCloud(); };
                fromCloud.onclick = (e) => { e.stopPropagation(); handleFeedBackupRestoreFromCloud.call(fromCloud); };
                autoCheckbox.checked = localStorage.getItem('vine_feed_backup_auto_sync') === 'true';
                autoToggleBtn.onclick = (e) => {
                    e.stopPropagation();
                    autoCheckbox.checked = !autoCheckbox.checked;
                    localStorage.setItem('vine_feed_backup_auto_sync', autoCheckbox.checked ? 'true' : 'false');
                    if (autoCheckbox.checked && !isPastebinConfigured()) {
                        autoCheckbox.checked = false;
                        localStorage.setItem('vine_feed_backup_auto_sync', 'false');
                        showPastebinSettings();
                        return;
                    }
                };
            } else {
                deleteCloudBtn.style.display = 'flex';
                toCloud.onclick = (e) => { e.stopPropagation(); handleSyncToCloud(false); };
                fromCloud.onclick = async (e) => { e.stopPropagation(); await handleSyncFromCloud(); };
                autoCheckbox.checked = localStorage.getItem('vine_favorites_auto_sync') === 'true';
                autoToggleBtn.onclick = (e) => handleAutoSyncToggle(e);

                deleteCloudBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete your favorites from the cloud? This will only remove the data from your Pastebin account.')) {
                        const statusText = deleteCloudBtn.querySelector('span:last-child');
                        const originalText = statusText.textContent;
                        statusText.textContent = 'Deleting...';
                        deleteCloudBtn.disabled = true;

                        try {
                            const paste = await findFavoritesPaste();
                            if (paste) {
                                await deletePastebinPaste(paste.key);
                                localStorage.removeItem('vine_favorites_paste_key');
                                localStorage.removeItem('vine_favorites_last_sync');
                                updateSyncStatus();
                                alert('Cloud favorites deleted successfully.');
                            } else {
                                alert('No cloud favorites found in your account.');
                            }
                        } catch (err) {
                            alert('Failed to delete cloud favorites: ' + err.message);
                        } finally {
                            statusText.textContent = originalText;
                            deleteCloudBtn.disabled = false;
                            wrapper.style.display = 'none';
                        }
                    }
                };
            }

            // Update dynamic status text
            updateSyncStatus();

            // Toggle visibility
            wrapper.style.display = (wrapper.style.display === 'none' || wrapper.style.display === '') ? 'block' : 'none';
        }

        function createFavoritesContainer() {
            const anyPanel = document.querySelector('div[data-a-name]');
            const panelContainer = anyPanel?.parentNode;

            if (!panelContainer || document.querySelector('#vvp-favorites-container')) {
                console.warn('Vine Modernized: Could not find panel container or favorites container already exists.');
                return;
            }

            // Only create container on specific pages
            if (!shouldShowFavoritesTab()) {
                console.log('Vine Modernized: Favorites container not created on this page (not encore/potluck/last_chance).');
                return;
            }

            const container = document.createElement('div');
            container.id = 'vvp-favorites-container';
            container.className = 'a-box a-box-tab a-tab-content';
            container.setAttribute('data-a-name', 'favorites');
            container.setAttribute('role', 'tabpanel');
            container.style.display = 'none';

            container.innerHTML = `
            <div class="a-box-inner">
                <div class="vvp-tab-content">
                     <div class="a-section" style="display: flex; justify-content: space-between; align-items: center;">
                         <div style="display:flex; align-items:center; gap:8px;">
                            <span id="vvp-fav-back-btn" class="a-button a-button-secondary" style="display:none;"><span class="a-button-inner"><a href="#" class="a-button-text">Back to Monitor</a></span></span>
                            <h3 class="a-spacing-medium" style="font-size: 24px; font-weight: 300; margin: 0;">Your Favorited Items</h3>
                         </div>
                         <div style="display: flex; align-items: center; gap: 8px;">
                            <span id="export-favorites-btn-wrapper" class="a-button a-button-secondary"><span class="a-button-inner"><a href="#" class="a-button-text">Export</a></span></span>
                            <label for="import-favorites-input" class="a-button a-button-secondary" style="cursor: pointer;"><span class="a-button-inner"><span class="a-button-text">Import</span></span></label>
                            <input type="file" id="import-favorites-input" accept=".json" style="display: none;">
                            <div id="cloud-sync-container" style="position: relative;">
                                <button id="cloud-sync-btn" class="a-button a-button-secondary" style="font-size: 18px; padding: 8px 12px; position: relative;" title="Cloud Sync">
                                    ☁️
                                    <span id="unsaved-changes-badge" style="display: none; position: absolute; top: -4px; right: -4px; background: #ff9900; color: white; border-radius: 50%; width: 12px; height: 12px; font-size: 8px; line-height: 12px; text-align: center;">●</span>
                                </button>
                            </div>
                        </div>
                     </div>
                     <div id="vvp-favorites-grid" class="a-section" style="padding-top: 20px;"></div>
                </div>
            </div>`;
            panelContainer.appendChild(container);

            // --- Add listeners for the new buttons ---
            container.querySelector('#export-favorites-btn-wrapper a').addEventListener('click', exportFavorites);
            container.querySelector('#import-favorites-input').addEventListener('change', importFavorites);

            // Back button (visible when opened from #monitor)
            const backBtn = container.querySelector('#vvp-fav-back-btn a');
            if (backBtn) {
                backBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    returnToMonitorFromFavorites();
                });
            }

            // --- Cloud sync trigger uses the global singleton menu ---
            const cloudBtn = container.querySelector('#cloud-sync-btn');
            cloudBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openCloudMenu(cloudBtn, 'favorites');
            });

            console.log('Vine Modernized: Favorites container created with native panel structure and cloud sync.');
        }

        // --- CLOUD SYNC HANDLER FUNCTIONS ---
        function updateSyncStatus() {
            const statusEl = document.querySelector('#sync-status');
            const quotaEl = document.querySelector('#sync-quota');
            const unsavedNotice = document.querySelector('#unsaved-changes-notice');
            const unsavedCount = document.querySelector('#unsaved-count');
            const badge = document.querySelector('#unsaved-changes-badge');

            if (!statusEl) return;

            const accountLink = document.querySelector('#pastebin-account-link');
            const usernameDisplay = document.querySelector('#pastebin-username-display');
            const profilePicContainer = document.querySelector('#pastebin-profile-pic');

            // Update main status
            if (!isPastebinConfigured()) {
                statusEl.innerHTML = '<span style="color: #b12704;">⚠️ Not configured</span>';
                if (quotaEl) quotaEl.innerHTML = '';
                if (accountLink) accountLink.style.display = 'none';
            } else {
                const config = loadPastebinConfig();

                // Update Account Icon & Username
                if (config.api_user_name && accountLink) {
                    accountLink.style.display = 'flex';
                    accountLink.href = `https://pastebin.com/u/${config.api_user_name}`;
                    if (usernameDisplay) usernameDisplay.textContent = config.api_user_name;

                    fetchPastebinProfilePic(config.api_user_name).then(picUrl => {
                        if (profilePicContainer) {
                            if (picUrl && picUrl !== 'DEFAULT') {
                                profilePicContainer.innerHTML = `<img src="${picUrl}" style="width:100%; height:100%; object-fit:cover;">`;
                            } else {
                                profilePicContainer.innerHTML = createGenericUserSVG();
                            }
                        }
                    });
                } else if (accountLink) {
                    accountLink.style.display = 'none';
                }

                const lastSync = localStorage.getItem('vine_favorites_last_sync');
                if (lastSync) {
                    const date = new Date(parseInt(lastSync));
                    const timeAgo = getTimeAgo(date);
                    statusEl.innerHTML = `Last synced: ${timeAgo}`;
                } else {
                    statusEl.innerHTML = '<span style="color: #666;">Never synced</span>';
                }

                // Update quota display
                if (quotaEl) {
                    const quota = getSyncQuota();
                    let quotaText = `${quota.count}/${PASTEBIN_DAILY_LIMIT} syncs today`;
                    let quotaColor = '#888';

                    if (quota.count >= PASTEBIN_AUTO_DISABLE_THRESHOLD) {
                        quotaText = `🚫 ${quotaText} (auto-sync disabled)`;
                        quotaColor = '#b12704';
                    } else if (quota.count >= PASTEBIN_WARNING_THRESHOLD) {
                        quotaText = `⚠️ ${quotaText}`;
                        quotaColor = '#ff9900';
                    }

                    quotaEl.innerHTML = `<span style="color: ${quotaColor};">${quotaText}</span>`;
                }

                // Update total account paste count warning
                const totalCount = parseInt(localStorage.getItem('vine_pastebin_total_count') || '0');
                if (totalCount >= PASTEBIN_TOTAL_PASTE_WARNING) {
                    const totalQuotaEl = document.createElement('div');
                    totalQuotaEl.id = 'total-paste-quota-warning';
                    totalQuotaEl.style.cssText = 'font-size: 11px; margin-top: 4px; padding: 4px 8px; border-radius: 4px;';

                    if (totalCount >= PASTEBIN_TOTAL_PASTE_LIMIT) {
                        totalQuotaEl.style.background = '#fee';
                        totalQuotaEl.style.color = '#b12704';
                        totalQuotaEl.innerHTML = `🚫 Account Full: ${totalCount}/${PASTEBIN_TOTAL_PASTE_LIMIT} unlisted pastes used. Please delete old pastes on Pastebin.`;
                    } else {
                        totalQuotaEl.style.background = '#fff3cd';
                        totalQuotaEl.style.color = '#856404';
                        totalQuotaEl.innerHTML = `⚠️ Account Near Limit: ${totalCount}/${PASTEBIN_TOTAL_PASTE_LIMIT} unlisted pastes used.`;
                    }

                    // Append after daily quota if possible
                    const existingWarning = document.querySelector('#total-paste-quota-warning');
                    if (existingWarning) existingWarning.remove();
                    if (quotaEl) quotaEl.parentElement.appendChild(totalQuotaEl);
                } else {
                    const existingWarning = document.querySelector('#total-paste-quota-warning');
                    if (existingWarning) existingWarning.remove();
                }
            }

            // Update unsaved changes UI
            if (g_favoritesHasUnsavedChanges && g_favoritesChangedCount > 0) {
                if (badge) badge.style.display = 'block';
                if (unsavedNotice) {
                    unsavedNotice.style.display = 'block';
                    if (unsavedCount) {
                        let message = `${g_favoritesChangedCount} item${g_favoritesChangedCount !== 1 ? 's' : ''} changed`;
                        if (g_favoritesChangedCount >= 5) {
                            message += '. Consider syncing now!';
                        }
                        unsavedCount.textContent = message;
                    }
                }
            } else {
                if (badge) badge.style.display = 'none';
                if (unsavedNotice) unsavedNotice.style.display = 'none';
            }
        }

        function getTimeAgo(date) {
            const seconds = Math.floor((new Date() - date) / 1000);
            if (seconds < 60) return 'just now';
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes}m ago`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours}h ago`;
            const days = Math.floor(hours / 24);
            return `${days}d ago`;
        }

        async function handleSyncToCloud(isAutoSync = false, favoritesToPush = null) {
            if (g_favoritesSyncInProgress) {
                if (!isAutoSync) alert('Sync already in progress...');
                return;
            }

            if (!isPastebinConfigured()) {
                if (!isAutoSync) showPastebinSettings();
                return;
            }

            // Check quota limit
            const quota = getSyncQuota();
            if (quota.count >= PASTEBIN_DAILY_LIMIT) {
                if (!isAutoSync) {
                    alert(`⚠️ Daily sync limit reached (${PASTEBIN_DAILY_LIMIT}/${PASTEBIN_DAILY_LIMIT}).\nPlease try again tomorrow.`);
                }
                console.warn('Vine Modernized: Daily sync limit reached');
                return;
            }

            g_favoritesSyncInProgress = true;
            const statusEl = document.querySelector('#sync-status');
            if (statusEl) statusEl.innerHTML = '<span style="color: #007185;">Syncing... ⏳</span>';

            try {
                const favorites = favoritesToPush || getFavorites();
                const content = JSON.stringify(favorites, null, 2);
                await createOrUpdateFavoritesPaste(content);

                g_favoritesHasUnsavedChanges = false;
                g_favoritesChangedCount = 0;

                // Clear inactivity timer since we just synced
                if (g_favoritesInactivityTimeout) {
                    clearTimeout(g_favoritesInactivityTimeout);
                    g_favoritesInactivityTimeout = null;
                }

                updateSyncStatus();

                if (!isAutoSync) {
                    const newQuota = getSyncQuota();
                    alert(`✓ Favorites synced to cloud successfully!\n(${newQuota.count}/${PASTEBIN_DAILY_LIMIT} syncs used today)`);
                }
                console.log(`Vine Modernized: Favorites synced to cloud (${isAutoSync ? 'auto' : 'manual'})`);
            } catch (error) {
                console.error('Vine Modernized: Sync to cloud failed:', error);
                if (!isAutoSync) {
                    const hint = getPastebinAuthErrorHint(error);
                    const extra = hint ? `\n\n${hint}` : '';
                    alert(`Failed to sync to cloud: ${error.message}${extra}`);
                } else {
                    const hint = getPastebinAuthErrorHint(error);
                    if (hint) showToast(hint, 'error');
                }
                if (statusEl) statusEl.innerHTML = '<span style="color: #b12704;">Sync failed ✗</span>';
            } finally {
                g_favoritesSyncInProgress = false;
            }
        }

        async function handleSyncFromCloud(isAutoSync = false) {
            if (g_favoritesSyncInProgress) {
                if (!isAutoSync) alert('Sync already in progress...');
                return isAutoSync ? [] : undefined;
            }

            if (!isPastebinConfigured()) {
                if (!isAutoSync) showPastebinSettings();
                return isAutoSync ? [] : undefined;
            }

            if (!isAutoSync) {
                const confirmed = confirm('This will merge cloud favorites with your local favorites. Continue?');
                if (!confirmed) return;
            }

            g_favoritesSyncInProgress = true;
            const statusEl = document.querySelector('#sync-status');
            if (statusEl) statusEl.innerHTML = `<span style="color: #007185;">${isAutoSync ? 'Updating' : 'Importing'}... ⏳</span>`;

            try {
                const paste = await findFavoritesPaste();
                if (!paste) {
                    if (!isAutoSync) alert('No favorites found in cloud. Please sync to cloud first.');
                    updateSyncStatus();
                    return isAutoSync ? [] : undefined;
                }

                const content = await getPastebinPaste(paste.key);
                const cloudFavorites = JSON.parse(content);

                if (!Array.isArray(cloudFavorites)) {
                    throw new Error('Invalid favorites data in cloud');
                }

                if (isAutoSync) {
                    return cloudFavorites;
                }

                // Manual merge with local favorites
                const localFavorites = getFavorites();
                const mergedFavorites = mergeFavorites(localFavorites, cloudFavorites);

                // Save merged favorites
                saveFavorites(mergedFavorites);

                // Update UI
                renderFavoritesPage();
                updateSyncStatus();

                alert(`✓ Successfully imported ${cloudFavorites.length} favorites from cloud.\nMerged with ${localFavorites.length} local favorites.\nTotal: ${mergedFavorites.length} favorites.`);
                return mergedFavorites;
            } catch (error) {
                console.error('Vine Modernized: Import from cloud failed:', error);
                if (!isAutoSync) alert(`Failed to import from cloud: ${error.message}`);
                if (statusEl) statusEl.innerHTML = '<span style="color: #b12704;">Import failed ✗</span>';
                return isAutoSync ? [] : undefined;
            } finally {
                g_favoritesSyncInProgress = false;
            }
        }

        function handleAutoSyncToggle(e) {
            e.stopPropagation();
            const checkbox = document.querySelector('#auto-sync-checkbox');
            // Toggle checkbox (since we're clicking the button wrapper, not the checkbox directly)
            checkbox.checked = !checkbox.checked;

            const enabled = checkbox.checked;
            localStorage.setItem('vine_favorites_auto_sync', enabled ? 'true' : 'false');

            if (enabled) {
                if (!isPastebinConfigured()) {
                    checkbox.checked = false;
                    localStorage.setItem('vine_favorites_auto_sync', 'false');
                    showPastebinSettings();
                    return;
                }
                console.log('Vine Modernized: Auto-sync enabled (multiple smart triggers)');
                alert('✓ Auto-sync enabled!\n\nYour favorites will automatically sync:\n• After 30min of inactivity (after favoriting items)\n• When you load the page (if unsaved changes exist)\n• When you close the Favorites tab\n• When you leave the page (once per session)\n\nManual sync is always available.');
            } else {
                console.log('Vine Modernized: Auto-sync disabled');
            }
            updateSyncStatus();
        }

        function markFavoritesAsChanged() {
            g_favoritesHasUnsavedChanges = true;
            g_favoritesChangedCount++;
            updateSyncStatus();
            console.log(`Vine Modernized: Favorites changed (${g_favoritesChangedCount} changes)`);

            // Start/reset inactivity timer for auto-sync
            if (canAutoSync()) {
                clearTimeout(g_favoritesInactivityTimeout);

                g_favoritesInactivityTimeout = setTimeout(() => {
                    console.log('Vine Modernized: 30min inactivity detected after favoriting, syncing...');
                    attemptAutoSync('inactivity');
                }, FAVORITES_INACTIVITY_THRESHOLD);

                console.log('Vine Modernized: Inactivity timer started/reset (30 minutes)');
            }
        }

        // Sync when favorites tab is hidden/closed
        function setupFavoritesTabCloseSync() {
            const favTab = document.querySelector('#vvp-favorites-tab');
            if (!favTab) return;

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const wasActive = mutation.oldValue?.includes('a-active');
                        const isActive = favTab.classList.contains('a-active');

                        // Tab was closed (was active, now inactive)
                        if (wasActive && !isActive) {
                            attemptAutoSync('tab close');
                        }
                    }
                });
            });

            observer.observe(favTab, {
                attributes: true,
                attributeOldValue: true,
                attributeFilter: ['class']
            });

            console.log('Vine Modernized: Favorites tab close sync watcher initialized');
        }

        // Attempt auto-sync with checks
        async function attemptAutoSync(trigger) {
            if (!canAutoSync()) {
                console.log(`Vine Modernized: Auto-sync skipped on ${trigger} (conditions not met)`);
                return;
            }

            console.log(`Vine Modernized: Auto-sync triggered on ${trigger} - performing merge sync`);

            try {
                // Get local favorites
                const localFavorites = getFavorites();
                console.log(`Vine Modernized: Retrieved ${localFavorites.length} local favorites`);

                // Fetch cloud favorites (silent/auto-sync mode)
                const cloudFavorites = await handleSyncFromCloud(true);
                if (!cloudFavorites || !Array.isArray(cloudFavorites)) {
                    console.warn(`Vine Modernized: Auto-sync failed on ${trigger} - could not fetch cloud favorites`);
                    // Fallback to regular push if we have unsaved changes
                    if (g_favoritesHasUnsavedChanges) {
                        await handleSyncToCloud(true);
                    }
                    return;
                }
                console.log(`Vine Modernized: Retrieved ${cloudFavorites.length} cloud favorites`);

                // Merge favorites (newest timestamp wins, handles soft-deletions)
                const mergedFavorites = mergeFavorites(localFavorites, cloudFavorites);
                console.log(`Vine Modernized: Merged into ${mergedFavorites.length} total items (including tombstones)`);

                // Save merged favorites locally
                saveFavorites(mergedFavorites);

                // Update UI if we're on the favorites page
                if (document.querySelector('#vvp-favorites-container')?.style.display !== 'none') {
                    renderFavoritesPage();
                }

                // Push merged favorites back to cloud
                await handleSyncToCloud(true, mergedFavorites);

                console.log(`Vine Modernized: Merge sync completed successfully on ${trigger}`);
            } catch (error) {
                console.error(`Vine Modernized: Merge sync failed on ${trigger}:`, error);
                // Fallback to regular sync if merge fails
                if (g_favoritesHasUnsavedChanges) {
                    console.log(`Vine Modernized: Falling back to regular sync on ${trigger}`);
                    await handleSyncToCloud(true);
                }
            }
        }

        // Check for unsaved changes on page load and sync if needed
        function checkPageLoadSync() {
            // Garbage Collection: Purge tombstones older than 30 days
            try {
                const favorites = getFavorites();
                const now = Date.now();
                const retentionMs = 30 * 24 * 60 * 60 * 1000; // 30 days
                const filtered = favorites.filter(item => {
                    if (item.deleted && item.timestamp && (now - item.timestamp > retentionMs)) {
                        console.log(`Vine Modernized: [GC] Purging old tombstone for ASIN ${item.asin}`);
                        return false;
                    }
                    return true;
                });
                if (filtered.length !== favorites.length) {
                    saveFavorites(filtered);
                }
            } catch (e) { console.error('Vine Modernized: GC failed:', e); }

            if (!canAutoSync()) {
                console.log('Vine Modernized: Page load sync skipped (auto-sync disabled or not configured)');
                return;
            }

            // If there are ANY unsaved changes, sync them now
            if (g_favoritesHasUnsavedChanges && g_favoritesChangedCount > 0) {
                console.log(`Vine Modernized: Unsaved changes detected on page load (${g_favoritesChangedCount} items), syncing...`);
                // Use a small delay to ensure page is fully loaded
                setTimeout(() => {
                    attemptAutoSync('page load');
                }, 2000);
            } else {
                console.log('Vine Modernized: Page load sync skipped (no unsaved changes)');
            }
        }

        function showPastebinSettings() {
            const config = loadPastebinConfig();

            const modal = document.createElement('div');
            modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 10000;
        `;

            const content = document.createElement('div');
            content.style.cssText = `
            background: white; padding: 20px; border-radius: 8px;
            max-width: 460px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            max-height: 85vh; overflow-y: auto;
        `;

            content.innerHTML = `
            <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 500;">Pastebin API Settings</h2>
            <p style="margin: 0 0 16px 0; color: #666; font-size: 13px;">
                Configure your Pastebin API credentials to enable cloud sync for favorites.
                Get your API Dev Key from <a href="https://pastebin.com/doc_api" target="_blank" style="color: #007185;">Pastebin API documentation</a>
            </p>

            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">API Dev Key *</label>
                <input type="text" id="api-dev-key" value="${config.api_dev_key || ''}"
                    placeholder="Enter your Pastebin API Dev Key" required
                    style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-family: monospace;">
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                    Required to access Pastebin API
                </div>
            </div>

            <div style="margin-bottom: 12px; display: flex; gap: 12px;">
                <div style="flex: 1;">
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">Pastebin Username</label>
                    <input type="text" id="api-username" value="${config.api_user_name || ''}"
                        placeholder="Enter your Pastebin username"
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="flex: 1;">
                    <label style="display: block; margin-bottom: 4px; font-weight: 500;">Pastebin Password</label>
                    <input type="password" id="api-password" value="${config.api_user_password || ''}"
                        placeholder="Enter your Pastebin password"
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
            </div>

            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">API User Key (Auto-generated)</label>
                <div style="position: relative; display: flex; align-items: center;">
                    <input type="text" id="api-user-key" value="${config.api_user_key || ''}"
                        placeholder="Will be generated automatically" readonly
                        style="width: 100%; padding: 8px 40px 8px 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; background: #f5f5f5; font-family: monospace;">
                    <button type="button" id="api-user-key-edit-btn" title="Edit User Key"
                        style="position: absolute; right: 8px; background: none; border: none; cursor: pointer; padding: 4px; font-size: 16px; color: #666; display: flex; align-items: center; justify-content: center;">✏️</button>
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                    This will be automatically generated from your username/password
                </div>
            </div>

            <div style="margin-bottom: 12px;">
                <label style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-weight: 500;">
                    Recovery Paste ID
                    <span title="This ID links to a secure, unlisted paste on your account that stores your API User Key. If you use this script on multiple computers, adding this ID allows all your devices to share and update the same User Key automatically. This ensures that when you generate a new key on one device, all your other devices can 'self-heal' and retrieve the latest key without manual intervention." style="display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; border-radius: 50%; border: 1px solid #888; color: #888; font-size: 10px; cursor: help; font-weight: bold; font-family: sans-serif;">?</span>
                </label>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="text" id="recovery-paste-id" value="${config.api_user_key_paste_id || ''}"
                        placeholder="e.g. QweRTy12"
                        style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-family: monospace;">
                    <button type="button" id="find-recovery-paste-btn" class="a-button a-button-secondary" title="Search your account for 'Vine - Account Token' paste" style="height: 33px; margin: 0; display: flex; align-items: center; justify-content: center;">
                        <span class="a-button-inner"><span class="a-button-text" style="font-size: 11px;">🔍 Find Paste ID</span></span>
                    </button>
                    <button type="button" id="pull-recovery-key-btn" class="a-button a-button-secondary" title="Fetch User Key from this Paste ID" style="height: 33px; margin: 0; display: flex; align-items: center; justify-content: center;">
                        <span class="a-button-inner"><span class="a-button-text" style="font-size: 11px;">📥 Fetch User Key</span></span>
                    </button>
                </div>
                <div style="font-size: 11px; color: #666; margin-top: 4px;">
                    Enter a Paste ID to recover your User Key from another device, or click search to find the latest "Vine - Account Token" on your account.
                </div>
            </div>

            <div id="pastebin-status" style="margin-bottom: 16px; padding: 10px; border-radius: 4px; display: none; font-size: 14px;"></div>

            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button id="generate-user-key-btn" class="a-button a-button-secondary">
                    <span class="a-button-inner"><span class="a-button-text">Generate User Key</span></span>
                </button>
                <button id="pastebin-test-btn" class="a-button a-button-secondary">
                    <span class="a-button-inner"><span class="a-button-text">Test Connection</span></span>
                </button>
                <button id="pastebin-cancel-btn" class="a-button a-button-secondary">
                    <span class="a-button-inner"><span class="a-button-text">Cancel</span></span>
                </button>
                <button id="pastebin-save-btn" class="a-button a-button-primary">
                    <span class="a-button-inner"><span class="a-button-text">Save</span></span>
                </button>
            </div>
        `;

            modal.appendChild(content);
            document.body.appendChild(modal);

            const devKeyInput = content.querySelector('#api-dev-key');
            const usernameInput = content.querySelector('#api-username');
            const passwordInput = content.querySelector('#api-password');
            const userKeyInput = content.querySelector('#api-user-key');
            const statusDiv = content.querySelector('#pastebin-status');

            function showStatus(message, isError = false) {
                statusDiv.textContent = message;
                statusDiv.style.display = 'block';
                statusDiv.style.background = isError ? '#fee' : '#efe';
                statusDiv.style.color = isError ? '#c00' : '#060';
                statusDiv.style.border = `1px solid ${isError ? '#fcc' : '#cfc'}`;
            }

            // Generate User Key button
            content.querySelector('#generate-user-key-btn').addEventListener('click', async () => {
                const devKey = devKeyInput.value.trim();
                const username = usernameInput.value.trim();
                const password = passwordInput.value;

                if (!devKey) {
                    showStatus('Please enter an API Dev Key first.', true);
                    return;
                }

                if (!username || !password) {
                    showStatus('Please enter both username and password to generate User Key.', true);
                    return;
                }

                const generateBtn = content.querySelector('#generate-user-key-btn .a-button-text');
                const originalText = generateBtn.textContent;
                generateBtn.textContent = 'Generating...';
                content.querySelector('#generate-user-key-btn').disabled = true;

                try {
                    const userKey = await generatePastebinUserKey(devKey, username, password);
                    userKeyInput.value = userKey;

                    // Create/Update the recovery paste with the new key (base64 encoded)
                    showStatus('User Key generated. Creating recovery paste...');
                    const encodedKey = btoa(userKey);
                    const recoveryPasteData = {
                        api_dev_key: devKey,
                        api_user_key: userKey,
                        api_option: 'paste',
                        api_paste_code: encodedKey,
                        api_paste_name: PASTEBIN_RECOVERY_PASTE_NAME,
                        api_paste_private: '1', // Unlisted
                        api_paste_expire_date: 'N' // Never expires
                    };

                    // Find and delete existing recovery paste if it exists
                    const pastes = await listUserPastes(devKey, userKey);
                    const existingRecovery = pastes.find(p => p.title === PASTEBIN_RECOVERY_PASTE_NAME);
                    if (existingRecovery) {
                        showStatus('Found old recovery paste. Deleting...');
                        try {
                            await deletePastebinPaste(existingRecovery.key, devKey, userKey);
                        } catch (deleteErr) {
                            console.warn('Vine Modernized: Failed to delete old recovery paste (non-critical):', deleteErr);
                        }
                    }

                    showStatus('Creating new recovery paste...');
                    const recoveryPasteUrl = await pastebinRequest(recoveryPasteData);
                    const recoveryPasteId = recoveryPasteUrl.split('/').pop();

                    // Automatically save the configuration
                    const newConfig = {
                        api_dev_key: devKey,
                        api_user_name: username,
                        api_user_password: password,
                        api_user_key: userKey,
                        api_user_key_paste_id: recoveryPasteId
                    };
                    savePastebinConfig(newConfig);

                    showStatus(`✓ User Key generated and recovery paste updated (${recoveryPasteId})!`);
                } catch (error) {
                    showStatus(`✗ Failed to generate User Key: ${error.message}`, true);
                } finally {
                    generateBtn.textContent = originalText;
                    content.querySelector('#generate-user-key-btn').disabled = false;
                }
            });

            // Test Connection button
            content.querySelector('#pastebin-test-btn').addEventListener('click', async () => {
                const devKey = devKeyInput.value.trim();
                const userKey = userKeyInput.value.trim();

                if (!devKey) {
                    showStatus('Please enter an API Dev Key first.', true);
                    return;
                }

                const testBtn = content.querySelector('#pastebin-test-btn .a-button-text');
                const originalText = testBtn.textContent;
                testBtn.textContent = 'Testing...';
                content.querySelector('#pastebin-test-btn').disabled = true;

                try {
                    // Temporarily set keys for testing
                    const tempConfig = {
                        api_dev_key: devKey,
                        api_user_key: userKey || null,
                        api_user_name: usernameInput.value.trim() || null,
                        api_user_password: passwordInput.value || null
                    };
                    const originalConfig = loadPastebinConfig();
                    savePastebinConfig(tempConfig);

                    await testPastebinConnection();
                    showStatus('✓ Connection successful!');

                    // Restore original config if test was just a test
                    // (actual save happens with Save Settings button)
                } catch (error) {
                    showStatus(`✗ Connection failed: ${error.message}`, true);
                } finally {
                    testBtn.textContent = originalText;
                    content.querySelector('#pastebin-test-btn').disabled = false;
                }
            });

            // Save Settings button
            content.querySelector('#pastebin-save-btn').addEventListener('click', () => {
                const devKey = devKeyInput.value.trim();
                const username = usernameInput.value.trim();
                const password = passwordInput.value;
                const userKey = userKeyInput.value.trim();

                if (!devKey) {
                    showStatus('Please enter an API Dev Key.', true);
                    return;
                }

                const newConfig = {
                    api_dev_key: devKey || null,
                    api_user_name: username || null,
                    api_user_password: password || null,
                    api_user_key: userKey || null,
                    api_user_key_paste_id: content.querySelector('#recovery-paste-id').value.trim() || null
                };

                savePastebinConfig(newConfig);
                showStatus('✓ Settings saved!');
                setTimeout(() => {
                    modal.remove();
                    updateSyncStatus(); // Refresh status in cloud sync menu
                }, 1000);
            });

            // Cancel button
            content.querySelector('#pastebin-cancel-btn').addEventListener('click', () => {
                modal.remove();
            });

            // Handle Find Recovery Paste button
            content.querySelector('#find-recovery-paste-btn').addEventListener('click', async () => {
                const devKey = devKeyInput.value.trim();
                const userKey = userKeyInput.value.trim();

                if (!devKey || !userKey) {
                    showStatus('API Dev Key and User Key are required to search for recovery pastes.', true);
                    return;
                }

                const findBtn = content.querySelector('#find-recovery-paste-btn .a-button-text');
                const originalText = findBtn.textContent;
                findBtn.textContent = 'Searching...';
                content.querySelector('#find-recovery-paste-btn').disabled = true;

                try {
                    const pastes = await listUserPastes();
                    const recoveryPaste = pastes.find(p => p.title === PASTEBIN_RECOVERY_PASTE_NAME);
                    if (recoveryPaste) {
                        content.querySelector('#recovery-paste-id').value = recoveryPaste.key;
                        showStatus('✓ Found recovery paste: ' + recoveryPaste.key);
                    } else {
                        showStatus('✗ No recovery paste found on your account.', true);
                    }
                } catch (error) {
                    showStatus('✗ Error searching for recovery paste: ' + error.message, true);
                } finally {
                    findBtn.textContent = originalText;
                    content.querySelector('#find-recovery-paste-btn').disabled = false;
                }
            });

            // Handle Pull Recovery Key button
            content.querySelector('#pull-recovery-key-btn').addEventListener('click', async () => {
                const pasteId = content.querySelector('#recovery-paste-id').value.trim();

                if (!pasteId) {
                    showStatus('Please enter a Recovery Paste ID first.', true);
                    return;
                }

                const pullBtn = content.querySelector('#pull-recovery-key-btn .a-button-text');
                const originalText = pullBtn.textContent;
                pullBtn.textContent = 'Fetching...';
                content.querySelector('#pull-recovery-key-btn').disabled = true;

                try {
                    const response = await new Promise((resolve, reject) => {
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: `https://pastebin.com/raw/${pasteId}`,
                            onload: (res) => resolve(res),
                            onerror: (err) => reject(err)
                        });
                    });

                    if (response.status === 200) {
                        const encoded = response.responseText.trim();
                        try {
                            const decoded = atob(encoded);
                            if (decoded.length === 32 && /^[a-f0-9]+$/i.test(decoded)) {
                                userKeyInput.value = decoded;
                                showStatus('✓ User Key successfully pulled from recovery paste!');
                            } else {
                                throw new Error('Retrieved data is not a valid User Key (wrong format).');
                            }
                        } catch (e) {
                            throw new Error('Failed to decode the recovery paste content: ' + e.message);
                        }
                    } else {
                        throw new Error(`Failed to fetch paste (HTTP ${response.status})`);
                    }
                } catch (error) {
                    showStatus(`✗ Error: ${error.message}`, true);
                } finally {
                    pullBtn.textContent = originalText;
                    content.querySelector('#pull-recovery-key-btn').disabled = false;
                }
            });

            // Handle API User Key edit button
            const editBtn = content.querySelector('#api-user-key-edit-btn');

            if (editBtn && userKeyInput) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userKeyInput.readOnly = false;
                    userKeyInput.style.background = '#fff';
                    userKeyInput.style.cursor = 'text';
                    userKeyInput.focus();
                });

                // Make field readonly when clicking outside
                userKeyInput.addEventListener('blur', () => {
                    userKeyInput.readOnly = true;
                    userKeyInput.style.background = '#f5f5f5';
                    userKeyInput.style.cursor = 'default';
                });
            }

            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        }

        // Monitor Settings modal (styled like Pastebin API Settings)
        function showMonitorSettings() {
            const autoEnabled = localStorage.getItem('vine_monitor_auto_backup_enabled') === 'true';
            const minItems = parseInt(localStorage.getItem('vine_monitor_min_items_backup') || '100');

            // Try to detect existing "Enable monitor and assisted load" checkbox on page
            const monitorCheckbox = document.getElementById('notification.active');
            const currentMonitorEnabled = monitorCheckbox ? !!monitorCheckbox.checked : (localStorage.getItem('vine_monitor_enabled') === 'true');

            const modal = document.createElement('div');
            modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 10000;`;

            const content = document.createElement('div');
            content.style.cssText = `
            background: white; padding: 24px; border-radius: 8px;
            max-width: 560px; width: 92%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            max-height: 90vh; overflow-y: auto;`;

            content.innerHTML = `
            <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 400;">Monitor Settings</h2>

            <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
                <div>
                    <label style="display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" id="ms-auto-backup"> <span>Auto Backup</span>
                    </label>
                    <div style="margin-top:8px; display:flex; align-items:center; gap:8px;" id="ms-min-items-row">
                        <label for="ms-min-items" style="white-space:nowrap;">Min Items:</label>
                        <input type="number" id="ms-min-items" min="50" max="500" step="10" style="width:90px; padding:6px; border:1px solid #ddd; border-radius:4px;" />
                    </div>
                </div>

                <div style="border-top:1px solid #eee; padding-top:12px;">
                    <label style="display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" id="ms-enable-monitor">
                        <span>Enable monitor and assisted load</span>
                    </label>
                </div>

                <div style="border-top:1px solid #eee; padding-top:12px;">
                    <label style="display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" id="ms-show-buy-now">
                        <span>Show "Buy Now" buttons</span>
                    </label>
                </div>
            </div>
        `;

            modal.appendChild(content);
            document.body.appendChild(modal);

            const autoBackupInput = content.querySelector('#ms-auto-backup');
            const minItemsInput = content.querySelector('#ms-min-items');
            const minItemsRow = content.querySelector('#ms-min-items-row');
            const enableMonitorInput = content.querySelector('#ms-enable-monitor');
            const buyNowInput = content.querySelector('#ms-show-buy-now');
            // Immediate-apply behavior: persist and sync on change

            // Initialize
            autoBackupInput.checked = !!autoEnabled;
            minItemsInput.value = String(isFinite(minItems) ? minItems : 100);
            enableMonitorInput.checked = !!currentMonitorEnabled;
            const updateMinItemsVisibility = () => {
                minItemsRow.style.display = autoBackupInput.checked ? 'flex' : 'none';
            };
            updateMinItemsVisibility();
            autoBackupInput.addEventListener('change', () => {
                const enabled = !!autoBackupInput.checked;
                localStorage.setItem('vine_monitor_auto_backup_enabled', enabled ? 'true' : 'false');
                // Sync hidden in-panel control
                const panelAutoToggle = document.getElementById('auto-backup-toggle');
                if (panelAutoToggle) {
                    panelAutoToggle.checked = enabled;
                    panelAutoToggle.dispatchEvent(new Event('change', { bubbles: true }));
                }
                updateMinItemsVisibility();
            });

            const clampMinItems = (val) => Math.max(50, Math.min(500, parseInt(val || '100')));
            const persistMinItems = () => {
                const minVal = clampMinItems(minItemsInput.value);
                minItemsInput.value = String(minVal);
                localStorage.setItem('vine_monitor_min_items_backup', String(minVal));
                const panelMinInput = document.getElementById('min-items-input');
                if (panelMinInput) {
                    panelMinInput.value = String(minVal);
                    panelMinInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            };
            minItemsInput.addEventListener('change', persistMinItems);
            minItemsInput.addEventListener('input', () => {
                // Light validation without spamming storage too much
                const val = minItemsInput.value;
                if (val === '') return;
                persistMinItems();
            });

            enableMonitorInput.addEventListener('change', () => {
                const enabled = !!enableMonitorInput.checked;
                // Sync external checkbox if present
                if (monitorCheckbox) {
                    monitorCheckbox.checked = enabled;
                    monitorCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
                // Persist fallback key
                localStorage.setItem('vine_monitor_enabled', enabled ? 'true' : 'false');
            });

            // Initialize and bind Buy Now visibility toggle
            try {
                if (window.VHBuyNow && typeof window.VHBuyNow.isEnabled === 'function') {
                    buyNowInput.checked = !!window.VHBuyNow.isEnabled();
                } else {
                    buyNowInput.checked = (localStorage.getItem('vine_monitor_buy_now_enabled') !== '0');
                }
            } catch { buyNowInput.checked = true; }
            buyNowInput.addEventListener('change', () => {
                const on = !!buyNowInput.checked;
                try {
                    if (window.VHBuyNow && typeof window.VHBuyNow.setEnabled === 'function') {
                        window.VHBuyNow.setEnabled(on);
                    } else {
                        localStorage.setItem('vine_monitor_buy_now_enabled', on ? '1' : '0');
                    }
                } catch { }
            });

            // Close modal when clicking outside
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        }


        // ===== CSS THEMING (Copied from amazon-vine-modernized.user.css) =====
        const VM_CSS_THEMING_CONTENT = `
  @font-face {
    font-family: 'Ember Modern Display Standard';
    src: url('data:font/woff2;charset=utf-8;base64,d09GMgABAAAAAFRwABEAAAAA1HAAAFQPAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGkwb+lQchVgGYAA8CIFQCZwMEQgKgesEgc1TC4MuAAE2AiQDhkoEIAWHPQeHRgyBVhvnwifQm+2SAnQHCE/VreYqmG7zUG4Hv05BmzU7UDPGAYxhfQHZ//+fkZyMIcwOc6ZVvSCykImkRE+YCiORtPekudborEFHWjgmzEKR56QUvGip8Qy18aLriOZddLFvuqknFAlXYIdqyUjPE/bQ+PfBSRmoh2ocJMXjfLGzY7NYLDY7XtucrLiibKkood9Yo/3d80ce0Vz0dFQFxlIJ7laW4BTmf0cvqFDIJDcu7B0HRgZFigxFhx2darHopMI72ZbC7zOnFZ1QdNibj7ibbn6av7hvtwqMXWYj1olKXwLR9vGOZHnfHnwgohBAicR1uMv56J3rZ5M2tGkxKxykiNcCDwJeSDFN5c6LPaTCiVs5zE/Mvsz8SwbIbSnKIQfImIKpoThzIIiQmoOpG5yIIOLYKOAKJ46m4piZub/sS7P3R/1bfWNKZWt9/X+2/reN/23910yrqrv/0JpI0pLsAIGMkjW7a1ZY+abx+BQ++k3weA708Nt8VzseEhOFifqf+ADb/P7qd8ZVxG57kb5Fpwt7YQUmIaGkhegQUYdjCRCAO19evplsMyVvvem0r2cmKeCTcM0WTLY6grhCM1NwKnyRh//W+N2Rnf3q8wVxTTBoeodQSYGY+D+blb+qAdVM1V1qAY3UkkYa6IHF2dk9pig4Q3QOEr97ubMjjEyZn0MHiQmisXbz4g6HSYgkNmZiJAJMs6X9ASJLK++Dp6ky2ipMh+qTpgxaeDmwl4H6AK38Q0zun4IdM9sEnBOalLUiNaHlvc3lKPmZ5Lf2WJSo6peZZ2iDXFuP5bjav7aUi8phBUb54X23ATKgjoygH5R86ytqF7W6aiSzkzYSYIdMDflzfnj+f79+dfbIR/Qg1r5YYv1EFa0sSuGH9rgzrLfOHMweDzNvNPFQJetgqqGSvyRCh1AqJVQW85XOvmuVGhlp8MxHP2beMD/kdxfhh5Bv/286plJVtaqrqlsttSSPaAEmOICw/SQEHownqCXBtAT8NWA8IeEfUhTgANj+ATbZG3N495Cve9rT7OG2/7aH++ZrOpz2fNmlUE8vD0olqnGVBzQI10R7lyQM/lUnnGwpbH0mpmrkGPy7JtqSx4dCoSaFSnsyTrdxd5E1k3NqcvLkjJxtK2qU00/7CImIQyJkaCeWVnKXvQfp67abCSaEYIQxwghhTDiC8J5vWTM0EOZNLtW40EOIdrzad4+x2c7YZ7hyjgEmRwnaH/f7mf/BYIppX/fVTbaJinaaMwyou55AQNvcoZImZqW9A/8tFMAqAImEpEMyZMCxuljrMQOi1yxr28yztt0iiF2WWNvrOIjDrkIQsEwpDe/kU/M5kNw0eYwJJLeNqaoHyd3GcRaQ4AHGQCDuumWMBQRAAgFDbP4mEAIYsv8eYsIDDnDDQSfd9imCQhOH4/O4lFjunn4pyIIcywv5pklaaNO0smZsLe1k2dWhNVmf1O26Vx96dv3Xnbqkk7qkJ/RrneuqXtZrens/11f0c/0SIZiKwwOLFNjAAEeX4GUyjgrhugAMwpFFieJARYVKTY1m3jxHX7pqA2vUaqBQLSG0jhSLGsoxAqCSE311ZgV66PWqcbo4FDQUpxjxhlQqoBNLH84UzkyqO1wPb73EliKspEKDZ4TuWwjwiBDILaAj4ZUVEkCOQIFGFUZdSA+DXvH60sFB9S2YegV3E14PC4ES2h/F20IBJasZRTbSJzOGa+6PJpox1YwTcE6ydwoSBLpe+k7w6CvFX6w9XD+Gz48YjVQGuRWUEhzyooVwjCIPpIgo9tuL6GsJHC4LahReNiF5hOcXVQ95IkUV6rys4aJAkSvjhQiPEI9MnswOrgBq6pcgJLbIjYtqXtXns0dB5YALRSiKWB21OHpevPRCooR3ICqZPICi5A4FaUCOVCVJcUiJLHPgPfLkXtEjloY4U7Cx/J0gAQXAM0D3R7guwkcg9zAHzEpL5dqW8iQBi6br4S+oRzhlAlERBrE2yYhUlSCNEzeRREdmH4h43oqg2Yj9W6ezpY5ijZodGhogXqdKajrh9BGMRZlKMdPoLq2Hv14lRgMtxVnuyAobOGhU+CwIjSDGIzmBUM7t0B5qerT8HHNzqhvn+TEzwTj9Xfs+Q6giwNfzSDfr2v8Umwp4NdE0azd5rauo4IFQhaDh4PMilNSf94gPHg9gdlwIOCPPdp8qq0qldGLooxjDmGn14OlVqy+XUVgV2WdTiwvLOnp619Y+o/lGy2afCeuzhftcSJ9P0xdi+lLhywJ9RaTwJflKD2g5oOsdrZ24HE/pemqfT1m4gnWDmP0zUX0Ju69pYRWkONKn4/vMrJ/tuM8JW3axL1Tsi7J0keMahdWfsoXS+5xetO0p1b5JCUg2Jhi7O9zXUA04JZa/jtXqXb/2+Xupr+L7WuHrhW8Uvmmxbyn2bbmNe7/ruO+lBJFQ4jG/tPLl5YrpW0S27/g4YuaGCIM5BOkl1lpRiqAAkzAvFy7q4AGC/w/FxNtcWgKDxUk0P5MddeWTfTLUg3uMqE16hNmzYFGgRTpJM/gtE8PQ049cGzQlRYpevhSxEOBvQKrsAcRySlcoKv5nw430jDRGYiOQGDKjLuxIPIZtU+emOQUQBI/uVIRRsY/lnwqxSw6YG3QeHIThAGzkHQR0vP4UGltaZz4c/vsog5eXbb6XBLRnHKIkm79nnVVXf6vJDMIB8fXLZ7OkolHMZYE2RKfhy6/9653zewzUnzzgQlw0GS6S13xeVGmRftG//Jl9QMbQhE4ctvYj1cVO9OrccdmX2OJPFt1PlRcbp6pr2YFGH6OCGgq1klD190+d3CrNO7T/4ML4eqRFuGF4yTzJ/2CDmWCSKH5bwfBJxoqQOQxKfQro0KVhTnGtkeQuRvkfAyuXhLgkp6h13PoJQFLEhOw326u8wD5eZYPZNoJ/MnNx2wletAjJ+nSZk9pBNuloYRzKDYEIotuVgZ+KOm3HhSJ5PI78f8gzabPJGWusKfN2ofoZjOXPz3u1V5bTEbYtfKD5GY3u48VwN89cey2GwgN3bdKrx4JbkNm6T4hGqV9FEkIJDBq/D0dqKZPy5tT8HwgWZTENaW7P9/nJwgWyc/B4E38Kl4MzCoMahjOoIk8LR7rXViUr9qOXCFexkoJIULvWYYsBk97AvgMbXBNYIGcffqpRr1JBvGrZd98kB7jan8/5/oGELfEKsvt31fwHltfdDqTqjMsQL9t13mDgrHzo1zbl77A0zNzegpwd44goCBgfgx7IPlD8GRDpcUY93uSfJik4+6LgOjSWwwjLp55F/PoqQLO23FcNm4z0vYF7hABm2wbay33/iDuZjMEBiwYYuoyoQgQu9CLXrqU+8IHMRz6S+8o2lN9dVMJKDIaFxVJxOAKJxCCTCRRKFKpBdTBEpAvPEIYpPEs0tuQcibiS8eqnfALxhJKIYrG4kpKhVAarZICI6VIkfRrlX4Mek2MKXt/uGbZ/+y8HwviPgU4L8JaplRmygDOS3FwssFXxlEILDh+PB+CWA2SFsYKUNzylwtSXe2cRp0ZqS40Ta2MUeA1MjhTOZhWljs46R2RVBKHsVRpdxLAzs2EDN4EElpCsAaow+aA4Lb2xcsRVURJnW7vkyDSwTIdg5uj7B547AyBviC6aFtHHzmmKNu2vRyJiqBwJBAMHvubS6Yux2/k/Fvhba9aSWo1J9U1vrR/jeLr1aZltzkzvFLzecV/MhOzMoZzLT+bMhmzPa4v9cWHzhsuty9wiqMFAzywpakKCvLfcyvv4kY8Xu1prxxxVV+rKXceHeuQYlvvb3bp3F3RjH0vPQPscFBBqTPSUMTVN7ZO5rTKNTOPT3HRyQVg0LV5Z70yZowQxA5LlnuXWhWzYXLT03TIThLo2bhcB6fsMFvx/citJwlgTEXMUTcpJinQe5LL4yJbNn0adAEYmYu22SbTTTjKd+iUbNUphwoQsU6YozZilsuA4NRhe40L4iScmz0/BhxHGKBIbvLaEpKMoDQvOHioeLhAhERmIGoteHi+jkFzCc4hq1WC4LEpdjD7VSvnOjOUAnhO6P8PVDV8GsWOkVORsKIkc4tAqcUziWlRIoqhuIg+lCKaPYSppW/PMMnUH65F/atwxZilza087AcyRfCNbZuVwYC+tUfYgVxCNh1g6S8egIKH7PVxLLW8ww5z2S0hnSfJnquoDsTj+eCEQ8ch6kNjSV9YjQS9vo1VB9MjTi4ME3U30RZjyaO1G7T2poybb6rarf+jsfl21lVJF92L7e8hAfzfUfYZ7wUitxjtvqjlL6TixRQFvAroHzYxZHQilEGMYqfQpPuS3aEUFRwvmGIEexbUVUTWSZ6coRB/BlMW2FnQ1wUyvO7MeSXo16usRI41bygykj3UeyTKTFOFBqkaKyTk9CGyhLII0PrjGCKTKyEVQKnHIhxZlSp2bXoxrQfJO05dmNO7Ig75kgb7mjILyrMUrsSjmLGItHq6imioNE9ommyz2zxtzBc8FhQDXOHwiUqLYEOzQuFHaOS/dRq7RFhhnAN9lN3X79PH60rKmLw8DXhoKDb4KAgRyLpSqHJJRy6Bz42qnWdAmCxWo2c3Z165RYIZBMRucCGWsbDSVjVKQGLVIysSTfWAloHS8I8UrselswA/RrNEAWvlXPFtt74Hq37/eEcgRUr4IKmoltNxVCFTpLp2Pd6idaSxFODHaTmx6eFWt9/aRbJZzksAFB9l217o5UUik0AQREdRlNCdsMKIpdyP6gkxptPa09n6so7tUwmN8j1Z09LPpxNUGetRQ3zPcLQqhmbUP0w8OXRdc63itCekx4TlF9Rh5JEU+6nbBwdnBReC1YuDhwagcAW1UIZkcQJhh9SIpHIpxo0YIwWcOBIUMF1Ga+aKRl3dLR2QrB1QBUAEkqQgaQqFihYrDEY8jQahEodS0TEKZPdadAG1w0aRMmsVxNFgqSmWrErQa8MqQvKDo0NWI4EcoWWzLjhMuPjtBssRJasFMmLMdWgdig7zXbuF6VtPrkWFIk5LNCndUuCXhJFRRQw1i4ommhAwyKKCADDKozZShizuzi7rteB4vWmAEwzgXkEEBBY6bKbg86NoJMSH6mUaJaqFioFOyzNhaVJHNhkYBj45ijQ5JniozSirYyAI1wZSDkGeb8zAzTl2sQLIEEZ8piYpNJFsRnA6DF+cVl0yOcOnhWSMI9t/CWCOxRmHNgTWqBDTWHFmjc8QAck/iAeQJ5AXkncQHaBOQH5A/UAAQEygwCQuInSQIiJMiWCguDB6JzfhCcIWKEYYmHEeEzeLQxaNLB5WNRk2kOEkJUClQGVA5kBaoAqgSSAekT2EAqkpSnaQmSW2SuiTGJPUwGmA0wmiC0SxGC1B7nI442+J0RuqKZGbS3YlVdut1Qn+qoUjDkUYi7etEeye6QMzAmEW3COMouqVOHALVBxy/kquHG8fRS9POQ4cI2yTotEEXoRgj6qp7uod9qV+AIRsM4xjBt4+zcaEHp3CJWiKEkWIZgU+Y7D8R9BmmgLyYLaud71X528yKA4gZ6e9s+vwJReGnt2vI/rG/iIYaARmy6jmNIropCAAaCdHhIgcn3hUOGTk16eZrgkTCVkDkkCheum5+/T2DbRgM7DrY+6B2WYBSOhAWs29KbUwvSgcNY30aZLmUDU9oNYTL42efkmdM8XDGYR6NSCRu+2QTxQxqQEPKNsLtAXdZJ/AkQ1SPDvMLioeZiJTQ5NjuvPoHwidZiKA+3SKv0lHiYDMZZ5Kn4ZLACszxpBsmgPngkkw/KYSLySLMzoRPJaIEDRmoqyEUtQKcW0CupF1wtLIS3dNXQsIcLz6BoqWQhEzi8FS0fDpa9bUQPD4cdErG9D0XWCJOxvuPFk6Fmc3uW7Jom74NZSl6wRpoOQXxP8Aay7FHSgYkGLF4VsQmUo5By1k5IHoHn2e9XRkD1y9oUNyfsNmKBnkvueAn3kY2qqaAdA8uaHKGB37/T4GDmelNm9D09vE7K8etk1sJzE/JyyXj65IVoAxUJt9swpR2h5sNsmpxNErtAKnUK2swqgR4hEEcYvEguZoqKk0Sp4LSDp0loPJ0SvZxyjh0JO2nww9J1ZhSTFWgJc6JsDktyt4NiaQzzIdhnObYSYMRVpUap6hkX9f+RLzfuA/5n2viK5K/6iYPeup9YCony/sqwRMK6gWjMhDb6rk3WvYP7/bm56mu1xGa4GV1KOTmdKwTLxiw0SoD0Nx61O0vEXZvtk9Mlw2drdeEJJBFEHqjmHMTWjEWw87joJcgqOA8MRe6+rw4cCL1T+KsqK2mvbQRNjnH1FeCz8fHNPqsG723jX0PQuMRp12JqNOVyP0W1M0O5t0jMZXnrPlN5HfzF/3J++OVeFQD2e9pqG2qYBkGJgcq/zhc7jIEsji9BssjZu2h7mzvkA945QzCC+yoqIzdFGmvvWTvorvGfSqRS2j6pKZUhPJMJ6ncshQ5kT32BiETuhgVb3DgPP3FYol5f3T2+RgFo6s3ZmJAp1IupuXU3r1QG7QA6JfhZGW0P+asCeVetDoPFCQLUBr9cYIp35N8+uSkdmfG7NEzs3LOOwoTME5u9omsDrop3anq2wCy3Y6rMFBf0iQloyf/iFCbaTd11aZCXh887Y0KOn0w2G2a2MiPimgEQb3vvkvilmxDHx6U0sWC+u3YxAcGMGH35P7Wu09P7sNe6J1eHNfzo6tYPLI/KrZ9u6S17XunL9DfazzK2kOAntqnvdXXO6rX2bqTvdBD6Zw2/Wz2RiR7ZdNp7iOemdJjvQFlVTcoMHjMFEiaGCaplou5w19dmOIYr4pUtJafsatU5RTTCYO2KhsN4D0tJ6JBMvbCYPTLIklHff0MrRsq1DrJthT0kr9gpYK42Kn3po53YHAcss/iTft6O/CWIgBDMYRJjTIqda6LY20a1WBoSw4+TAuukazxXvDyig7yQ2GAhrbq3oD7lkDmbHjdkIeuW42YD/gkgu1qV475r9Wy+QeJh9oifA7VmhhLXSq9mP7BXe4u2NrQKbNNRX5NLdLTRwJ/dwbnt7fJ32Tk41425d7cdxxa9EsBJlQfaLuJSZlsad/Xtg8Ziuq0JfeE2s44TCCGpQVBsbXYWqCsm0SNuj61BwVulgeF5bm8h5Vx+bhEyNFdFLWPJr7kIMkYaMQ4WSs00r1bYnKx+jKdNL9egd6jj5NE0nhJVVh7/1GELgZjvTxFWZsxaecPejro9BiejB26RYyjQ5E6WdrahlJA+0R7TfF3vHCZXl+km9il9uEH46KxlDk2A2YynYjQNid5jCzqMswBKHCgQG/Hqg162kr2iq8Ul7Yo8aXBbvJZlqWffoa3ucJuo/moZk9zOpXOm8LXxfzmp4Ddg2iJojZCVi3Pq7JuAv1UXdsqTmo8XfZaiPHKOEvjyq0ynECvBa84WMLeljDDNyAhNdIRYpggiKo2sgqlZbUcaypI/uP0ROn4mwUedL/uVwcbjH5/ZCH7Ksljdr4Wy42trygT7HKootSJ0qW/IVLik7Z46Ckm/ZZUPv9c2N3ZOo3S9VF9SZSPJROlS09yZmtPeARUKdta7V8diE8XGP5hejpOcTptWEObugDlMs8GQPHPquyOZ3kFk3cr99Utxk01lEhZz7/pmjVjyLThVgMpelhdsIpVA/2zsOlUq0XzBR4ioqKCWxRZw5GF4unSIqzNV9qxG1fXZsGmn1VYFZmcDzAdlwavuLSigCTYCKfEFOl8lWzbg3LgrIgEWjwASJ8+MrXmpAf7SzXNYJNy+V4RUPREg78caZxG+9JTsr3NPk3i4NUTBH8clNHY1hhWRlZksGXPmDg6qz3s6u+Oc/OfzJ/RaMPmSkwCL9O+WLHY2xiE3TYTzXG59b4zwdku+VcFvtTFZHPHxv2EJ0Ak35GZ7Q7FtSAYo8bicHgC8bW8JQ2JTKEaGNK0dAbc6CaLzeHy+CKBQMgZbamkllwilclNFKZKlXlagTDvElwa0/uQDxYNuqyjxsx8l81NBOkR+JAPutz7xFJKE6wWwgNOtId3wdFMXHbz/sJJR9tU/DoNuDoJPKDqs1xq5PaIVKJSimR2dgCc4xvbQrYu5ZWKHzpIVkNYLlNbZZRZBG4Ds40BE64uwcZ8sGGhA0cyvSplWbOtOVrguRC4gTYhWQNUQfkgYUvnbW0IVQaJuSUR0zNoAqusDsfG33pQzQHAJRwVMjL8fygT9jke8M8qmMTt+ASTEAhJoKcCJXzo0YWg9LK9B6ZSC0bEFE7hFU7xFVcxlFBxFE0ZKLZiKaqiK4JiKlKwfP+BD30ofs8IWPJlfpxaWSrL+o2nqbLjgq0BrtEc4oQrNRTknlTKzcBZ6iGN5+azNnOxehG4uDSP7HTFRML6VJ1wkP8rKbjpBtM4oG+qMDcAc7PFaoaU/8L/FMDeXfu/EQrvtlaYgHsaPeTe8eYxMEqKGBSAQr21KxJKHBWkYNjUh5IoR+O0hxU6OLaFpM8YiMPx9aqhmvVwGcZacrsjIHLkP40ogjaEhKrEI/LxlmEsXrXCAFF5TekBIXulN1bQa6ersqd4lHxWK3sIktxLKQwpmx0nXighotAY+9nkYPv8kvkOgtA7gLY3P5erFNlu+Wnt0KqheA99PRE4P203ay5yKH9ERCNPodnMuvXoNWnW0XJjLeKCcNkNC4Dvl2kgBCurvbbFqlSCueHEjSHZ5txSywCIuPJdxUkttEnOst/4n5OzLp6/apdcBgV941pk5XW+qxx1Mv4DuTK3zGLk0zzQgBd4yVn6Qujk4t+iuWYLMF+edkAA2uhdYHsuQBaasjEcCoUnjGlJBDPDvzE4D+2T49/4y+hmPbjo6SmCdk1eVRuwBmuG///R540X5TOYNV1qJbq388gTdDT+6kHyqTXm6qBj2MhWVR9PUuTo6KwZP07vk4tGCKnZFJC/N5vS87vP6IOGjVMQXvddBTZuQbvbIP/wy3NzxPYtDJFefyX2eCfKvLQDOTXWEt4m3EinABIG1yICi2rIRTDEiiW7KgM0F8z2/RHXpk2E+oNmvN12uZliLg/PQTXdarZjQ/b2vODBgDHDsn9qCblF2xk9f4p7jrhi61Z5JSG85M+0eDqoDbA5TNClRyQHnno126AB/x7iavlXaXWF3UGXfPFWOOi6/9tjyqS3qrGXbre81xb3+z37N0WG3tiw1WoK1TxLseQCf8/CEOmLOAOZh50oyELee7ZgmwqqbesQO1UOCK94wt0Nt7lmtCcbnl3EW0MG1Jq3nDSqTVSiYBU90M8jPYrTFjmgC7IeG1DgrqeQHEXqMNa291ct8rpGCCKThcbhCpZVN6LjrxS5KqAYm9iDsydS8f/taOTljJPNez7smrivXtQq2D94FMYkqhjHalEAJVYFsI2BmC0lJyDcHywSN0OiNkVhEmwJQJqtcXDLShM4oN1Xej0eOuHJZBRpVdh1H6zTAMXpRLpaQQcKKfWQ9ZDtTaRGo2kLYmugZfsRe22lyHhV75Q/nUHeGOsLEEpGQMPSrHYxWJapsuutEasfrBmjI+NB4WeS3hYNBA1g61zPHRpRs6YFnIKvQAOpmImJaKQWbllpE6lp8oKWAmJ0CGRVCxuHPrNdR19x0Mv5Dtg79vzGwV3M2KDYzR1ksNpHmtWPI6odzVB5Mthd1u+hMYZoV0DG7yLrLkp2a6cvUGevMbFyJnzUDQ3gEJHHAaXOvkcqVChiqXLsd8oMsJF0iEi4KEj1YXUXIxlwOfS0kkOXWj/AQSJXXgfhJtgflY2RqRHnnPLcAeUvVGdnPviX6uiltughg1sxPyQIC2NEseI4Sbw0QZYoT9oJxPRP8tXGoRfURF89ZfydXlmzihf/bXlWhcb/DlqBEeqh4lii+urOwSqqUVJQYRCMGqPBoBhDjBZjhDHGGPbPgXlnBYvcwKBCW9bYH3hkdIT9NbpE1CJok0lbNVwf9NGSfRKnZVAvnyqM4uCE3vZlbbZ420pcTTKnO13/SRXU17opn96/Ab6j7uowAlOU5myiwFGatC54lwA4eVGm80Z31Hy7bIF59LGnCDcO+YEd6ofzw4z2bIhRMdQ69hQZy+5r1NYmkJ4ysJa+6KeUifCnZsQdm1zZq+7c+6BzDyB49J8x1j+EJZVVWddUWJ2leQLm0x5aOSZQVxUlvwtzopX4aDwZ29/5C9YmzfSZPHmobpQdkolEuKPSi3Py7KoijHR0RqrBMjRCjrFxoVUsGhRhlCvK3xEFwqwsvThtgi2zN1uhgTQwb0AkBLgURbBEB+eRijLYZLMAHudMr46iBc1o+oycmYGjkOQypGR++nv9eZwyTesBrhG3YOSCTCShRka7B3vN15gXa8J3ApgM9mqM96xibd1CLVjS09WWEsndI5cvxPDqowiLm6Lyhu0b7TGJ2oCIVvfpd82+esxrnZe6XVVaXj35vtmd+rpY2dyv9w14iNqyb8FjpOKG/esw054N1XpZcykGD+Lg+aaejZ6KVCOVGz9p0r4TtUxXnf8QWZ52B5PszjeLvgdjdfAY9urzMm2sryStYgSPuuFQGYQ/ztAtaSVWFWHywye62+WtAr1bmyr5tpP2PB24Qwa0inGH2rM6Px3A/YnA6wpq9BKpDWU9hzOjg9Cc8wKF7FKmPRHDgMSAyQhSm5RlOiAzYDbiP4cLCTKM+YTChMUMoqeEjBNKE5YzrkpzaqK6B9QGrEfQ2KRsmwGtAdsRq4NJNrt7SG/CfsYawA4OE0YTjjN+E2RZ1lvT1Jeer5n+Ndf4ERi8Fl8/0Fk2uWpY37IrdFO227LXDo5n9+czh4Zjw+mW8+y5HC/laMrxegK3hnvzfsDD9Vmur3J9l+vnBL4Nv6Z77/+jKF9e1a62k6d9uELaKZcHSn2kgweXL7dzIf+DjNv5kybqry8ZIGgMRwB+Doj3svJ3sNk/wHb7AbSdQfwH7PZ34AOQb590HB8OubEEYqNx2BhjpNRiFEo/0bd2ocQYNPZVgXgnVrDwNUlpZ9b5eD0J510YK9qKkcoAVlxZgNQAkClQjiEnmu3Atk7OvJdSDVV9XK9mwTLm6FzMvrUnyaaODEMzxHh6JWU6osaJqhI1NIywMt4gA8aTpJkp1vlpbRTUHRaG6kqROpHOosKnTVxEWuQbYzlTJ5lKhJOpOjSM1KDGkRpqlr7U67MV9cctLbbGlsyZV7s1DUQxki5vSOGVe6qhaY0o5qphFKlpBsTQtVRrbcxf5fIXTj1dupTFqO2lzIlYc1RqGhDUaluhcRG5r2HQ81+iQrEenjDr5FywIV07hGccYhg5VFzLN9wHr3SIEoVlsZJECN0WNegmNN24QQq+hZweCiDqCBCSkC+pzAw12PxovSO+veISEakaSaHwOBbd0ri9zYkIQj/2B9XrZGRDkleLb49xT81YDOqGkJGFS26AQjGtTa7dQvv4tr4kwhz6MnYQnuHGtpJCyxKQm/gkV8p6/9ATm7NRyBwjc5gLWboRZXViZixRa//QjNYhmYbv1xdCmdzX7rGYQsBiSP2Xypc16vodtwMHlzyK6/GC/0fVQfK3S+PCb7mhkkAqCAUu7NDd5U4BGEfmXI9qAMLQdPccQT/uP4MQaLrDaRM/R4/RyM/+Gljxod96QvMqU/1s4/u1pHEbYhjLYR9HMBxlglgDaXeiJBi0QzJRN18yUUa3WK05gZq4OhRoUEm/ca+f52KsOlKbmSi56zEt2UoiE6aAu+COtp8OVrd6ojYVUVhac1VV43YM6Q3yPh8rSM1Uy6GGZus8XrT5rPoIF8Zz4hUeN5OxDPOxiCJ/ZMQ0BWqoSLX5IwZGUuwRVCJzcj+hhuTa4/DKGmiFIAqZtFV8Z7+BrpZGnNDBm7txuH2yb5wyDrAYhUZy7z1ppMbmH6P39YEhlfe2uN3fNkIycS8muiO/Gz3mKyyu78UidJBM6n2YllJxZKXq9gfl5PYpkSV0aS+CmCy7FiVsapM9ocOE3JgZNd0qP6//DA1V0gPZ4lz8pNppDrUfiQ7p9Ynm41IGEutJeQl4DgnOHsLvCaqTsat1tWH6mpYVCfiZETe9hT9dE88nOs9sR8lz6Cry9j5o7As740xJb8wSAG/AbeD8oiGGpTak3Vk1q1CLEmly1I1q8TvmyIKULYJaNC56cRqabjaqNSLsQWeRYiViVQbuPCE5/XAvsgaodZF5jEul10WM9VqMXoV7Jh6sYQIKDx+SN55qODoMdq9zEtwtjIu0EhMId3ZdfU97HBBs30ADCJ0Rie8ZOg+Kt7lxEoU0MWmpkDdRpYn9DLcUDWNDq3xpII7FuDm7Ljuxm4mNb2kMdzIexvgRK07re0EeUdIoQwlUU0pNYjZ0nN1ns3bqNfFC7NCR7OwtfHwQvOEuLhkG6+qv5ZltRM+jupZKhmxwo+hJ3Q23DqHCLLMTN0VXVA4//DNsBjNMCBuPdnWLFE13TUUUgzNTv6Gjh8KRL8FSU1DqpJkkYueU3kw+ZbW5aTW6BATy115VI8vOKuuLjKZq9GdkYm5FRVSDbMSXf0FsvEsDtKuV4ZdZbNCCTBQzAYqvsgR17AfwiqfCbompzmmSFMZlmem6ruevTtm9iLMR/TRHuJbZKUGM1pTMZRh24qeuPNZ5V+Yc0zgL01OQ+tsKJrGHJ6RPAcBF5jPVjsZqLlkhra3fS0mm9mJGwxiAetd77N5tQz65FTckMQpz5lX+y6Phfgid5MinT8GCAdCAgxqP021KTEPkOpiglBpWObM//L1oMBXZNqv1oGsrH8X3asqHA0jqFVsyW49yP1E/DnFof6a819Y54ZpDZ7GyCzDVlLKFoxExLq32RKaXcr8JgcN5YX3cxcyCX4v3Rt9DNHVIXtedQpUqE4dhVtGlbvK2x/6nwUMxwYLCdunOsEfbAJef5SXe6hTLiKb7FvJVRCHIAwXQ8zjExqOSaOwT/YddxRRKZjEJzWPpaT2Bejw1qvq3pGIXtfijebOw79oCzrMU10vB6DFkG1yQYfhmH0AENYexIj/K5bE2IOxG4ppYINS7Ds7op4bnpVn4/xorUVRiNX0z1vWH9GPlXIYL0MtVLB5OPPdKsETyGMI6ZdpVlIBzkRjmEmX8YV/xfDzAgDa09A3KYqF94XvuCPng2CXOUawkSV7a6tYMY+jMSOgVxjKFBiPPVx/1NvKHmiBlBIUp0whLMp7FpGtzN4reCW2nry+9NqOIMR/KP+Tm2+h7cI9KfXpBfZU94X8BT8IbHXrusCZJ/rE5U7qYUjU9/JJbsGz9DiYON6G/CtAzWNMCCJ8M+mAZQx+LAycPGSrD4N3EpgKCzIxUdPSpWn2CTkUj+AgaPu6zhfoHDHy3327wlBxuzPzaZxj6rvaJW1cVdN22EaeEWRr/ihKFdp17fU9NKzLKpF2bgY5IiLoIaqjLZiwYxo8I+4OMFr2KNUzOHYQPC/2y9AdARBXeGD/fJ53QGSu4wuF/qe/VNn6s6DVrHYIBvOy/1n24sgVBwdUZg08hePnGwGkIeTD7MlQYv6DNcnMXjQhmXBY2lN+RgmLK4kINd18v2Yupdw+b/ls0OKiqy16J7a1mWP+Yzo4ceHLz3NLHzAxpl8pIgoHCJkOw1KnSZG+hkIFS50dPhAgRCpUWm/sbMyqHUzCC1b59qi9kUc94BEVSbrRd4uu+CPbMXdqjh8THlbUlA6ZblQFIh1SfUGUxRiFO/jYKuZXl3bohA6K9yXZmr/PwMBm7JT14aepTDkoYQi+yLpPwFhxNHi3vyjzZl4u70f+lMr2Fj5LiQcvureBUCZ207w+PiOtH5vXDe3/EPn4EXtqZeOS/He7AxTRYIfJpSR3RToWUVhfT6Yhp2TSByqnDzP6xwpqUfNP76u3KCpA4ZZFO7v2U+/SXb1u8reW76O9rDC39WyGfO/DbjSF9bNatxNzJr5c9fgF5awTIJ/HYpzj4O1C4NkA5m/yLn1Tmx2ZL/brbs1h+MrQAmSbDsbi2ZMo8BaA/F4IPaEgY/o01oLA+GXB97jK07LjZ94+EQDbpOvJlcBBhQZygnWeY/+4F8zvKxJmiUvZO+x1Si9avw5fm2B7k8zH+LgaAvHiypgpANHomFKcLEYJ2xqHE+pnt1UXHT1eawDGEBaGirIlu3J19oeVsKOL1WY0BKtxQRINuI6fZ9bC0brq9rmj5pKERNbH9GoEPmKO23EOv8MVBomdhYqb/1e1ovx8PwAAxE7p5EjcBDsNgHCZxcwth3J6wM3aiOzNXoxFbBfnH8zS52fkPY1i5Af7qRxobH6gJCGBp4hl1FHdBgeTDOKoRy/3XX33Wx2iPHu1l07Iqb6Gmte1UZxwnzbcjqihv/1GVtuyQPGdM/XJT49L7nzfmNrhibXRnI1K5G1dM27NbNaodMBTBnRmTpUyOFrp/z8uMKf4onRr3XMwIlwYFOfr6sSO4u1qsJnUdqqrrisG//ooGeBU1cQU8ZgchS+6E9/70MyFYhQyxOwauBGGJzyrzr2W2aH8rpFatJFjAORgML74b0ffjjxG9nYbPas2BFo6wwg5R1vxb+hrLQsKqx3RDoF3t/NI3DDc0hLz5i2x7GHO1wOUnxAnkWeQJmvOP1/NlACop5BgFzf6GsbBUAAeH5EttOv/agiCgERbEuUcMTTBz30dk1g1y+EcscNz4vvk37rNSg1gO+jGzONJA3wxugupObs9uJIxZ7+cQ/okFsSZNnkUkaecJsudWZ3n0CR2o+GVHwotzQaTvkbux7r20tf21US/W6PZrB6anQ8xfwIPtn56nLSx8+unmPUQWxLOCzEmWC4Aj/uUelOM8mBMinMf91sM480jR3Pn4ZX4M+3hl8ed/yi8q4/iyiGhljb0W+efUC/+pcZDY037jakVb24XysvMmXdadK68OdB7z9xCdtdzdj/bm4KYJCBQDXZXoIPZSEl8jkiQpM2Kl6pSsqmN+Hb726lIy4mP5qUmSKJWYLEiyB5jXZO/QmBw4+v300Z031Pqj1XUlI0WMCnfDfuPWrccf5/fwMy0IYMO1A09hG5xZwm5C9NLPaUVY3qxWQN+nJztcQ17lsGnPppkHIAAGeqPxwR5AkCOWyJWl+TmZFUmbRG76ReyPDpTAt0RgjfjzBHDotWqPKN2CPuf6tqG6R99V7Y3ZQgOVCTrHVuyhh6PsSTIE/e6ajAnYJ1GilOKoQv1h7KesiH6BouqLqsLVjt76R9/VDh9tz9bJpMrKnBylTipbLpATPHqC5vqmuGA2rPkQqRnNpsdzHDvW9AtXRyK5ueyhrZWalquL86aymKkBir25hsZjT4o6O78p4pGG3Ky9+95KZvnIxdWty2ulPYuV2UqpTBdJSMrOlkmLJiGfyeUxsZFYyYiNmX0zc60dnpWIueDjR3vZEw3QSeTooU4G+JkDFoRYTY399Dp1MBwearsZYjcKXiYGoRbTGYOIl8FRO4guIAcRTIAQgnlmYHzNgjiPeOCehEHks6kU7Erc8bXiv0Gpp8jIC3iHNmHFtjRxpHjzTvoK4vX0WmC1iNRmWj6f29j8tabos7qusesfxcMqSeSzKSP735Sb/5/h2rW6P99Y6usf/f1hdOaM5sdh1fOjDXWfx9duaYhMV/WKpC2y9Mymg1HV24URcaGB0T4SLQqQ7ZfeQwDugQUnC3fUHZWpRgoZHnZOHM6uoSUT8Lf50yW7PWbHk2d6HICBI/FdDnFUnY19NnOHBxQcXLzjX2qsnGaGR6rkxqBV79/sLABCyeclkwykZMogDwLgiJuIgvD3y8Lfx5AZZxgNLxtfBmX1sdf1bcep5Px95YXy0QTPv9JxRu3iDWUP6vl/MrksLlGeKvtMYIhITI2XiFLjEqu8Ihdp/+7YLnj0mD7RvwuHj1ml2Tcgtli3v9JcoHbH7RwMOcXRZfqHFov+YVlcfiW+lPZn97sIAg4KIe/qOH+lsGVTk2XWveI41R/0+GEPhzB9ZqbZaWLPBcswJ8mbqkLFjwH178VOX8OwnY7k7KAoLksisOH/2fo+g//iVFqgRzK2j+vP8CaPkNgenWzVjKrQ/Gp2B//Fk50CyMJiwxVl5yGXKqINbK8OKXKBYvik5Oxkob7mvuW68UFNlmEnfOvyxUFPjHVBG/JPxz+Y/HHK7YXcQd6S5svUDR6MmkY7lbZ1GqsFsO8fqWUAbI8dNi0tnR8tzCupKtpC5rT259WWbncoMjk3bCVlAu8ODsMAMf8F8XsJA2o3B7LxrWusgcv59Ep6XTHPv5H/QRf7uZJOkkKS/dzxc7uBIMGCdbNU9ONQDXGQqHnME6mL//PjzUcTdBQ+lcDiyNosFOxpLP0YDbKwS/D4CWVD5heOWC/sXrTHoFnHrNeQ2gd6PSSvXk1Mj+qW37n0r6Ht2fS6qw1WrhF5WNt2g1FrCH92KefYTz4s5xaGFY2jXn3WwFst9efsw0LmeEykur97hx2KwNR/U3q955ftu547Kv1i3c5ti8YN+2NCN1WiMrE6ZIyLtpkBwOZAOr77Cc5Emgdjj/B7f9fUhhzbUGnK1MREZUraYHSYkgYZEw0viMZeacqFoZReyc3ls4lTScI3faXwkDo0ec4kVc90NDacflbaP/f/mGv7MkTcWy3OBRBNDEm9NEaUKtq86ctMRjK1xXM2qWaqo6310qvyAcYuC8InVrQQGc8SK9bH2pd1X6C9bGr5dS6l1Y6jLM+uS0lW11QoXeEc0/abfnvROOi5K5k8yINA8SRfEht96wbacENA8ib2bhCUS6ylb2bj8ms1cSQvxCM43FCGsik32jPZ1zIyuQqebGCQnEk4KARXzWOTnchsxFkOconDJjl5wjEAo+xwTCsDwBA5BNOZvuU+HYELHoABnOQm7eK3jRCCibpvzz06l0MMdv/IgoBT1iOjNfwJmu/I35I1hA0EDMBAAUcfdfI0ox9ixlyT2TAZYzWI3f1hd7vi2W49Iz4/rjuun+5s1XYh8DajtYL6a59OGJeLDyK8OOe4jPyedHtJP4jwlgVhyNG6YWmSBw6AoNexyUQ8MVkPUOyOg7dcdBqWspKJqx5MQMPP4Bck3KgHljYpk/er83MHjie0HEiSpki4KUGV4+8337Hslygog1t3t35o26Xs0qN1WxEWxCckAaXAK7o/PjfYMzKEG5dsKBkJFYawjShav8wvllrOJp/qJLjLfLR7Jw1sse5wu+rt1LRq/VCH/vWe6F0iIflaTT6haEOmknLa/baq9dlZw+9323qHz/QFjMyO/kvSbwRpvCQ8ICZpl8kk2x1X7N4ktbeVXhFDMRCy775zw2OMTbRDHar16SnV28PtOrGBPbm3Tlr7UqdIAmq5X2y/LJMdG4Qi8vxlaSo10p52GN9OTda8vd9h3rnSWv7bNCOUQeKjshX5sbyMIFMTAsg9lv0SqX6t1QZzt9k+PSkzIpIQZ3M+tyCetSE8v6eWb0NXZB08nFXVeLDcowj18Rf5TBjCvIvp58dDLDGIJWf/uiCw48Wr5TwdA0De+0wtA5CNo3JmcJqirAyRktVdebhJ9bRzSPX8UINO3ifzi6GW80marB3dV/vocW2/4Q9JrVBIvXq9pI6PqtO3xGr5uDOzDdxY9R552j7NwfPlsoW8aI4gusa6AhbxAKl+fUuTWpDPXH0lUq+gIJlXF/XzIy5bPNLPhmgUj7IhR3y6xd62fyeJQeSeKvIT526pdHSPrLhQ5oPYFp6zMgnTOe37L2we5ww/AAAZHqWJGWw72Bzoh++5pI1Vglu3FyfbG1Qxf9W+JvKpWv/YQZlC3p3kLfaX9CXKVQPyZPXeI0sSGMVvqPnrzCtwp5cCKl773uRs9Yh+OkXRjZy1Ygtpt9r067Oz+t851dNze4G/+9ZvX948Gr1bKIzZbfKdUR4xPhbE35WertwvZkAm1x/qUL2dnlKt++F5U9m2x8EYp7vlTlPbYMzuVk3vqWT2VI+A6/BtQj5gbT/xa/F3EGXNnQg1p3a1tAL22ovb6uQ45+QNNa5JNalxZe0HgUVbztkoHcRuN8Im3jPSLYBbmL9xM1zsRruzNdToZtaRrGH5nGdywiKDhQEeTuf5xAj7QvI2ds7W4sLc4S+ljV23akKqub4SP5bnQpFNZ3J4ocF8P/cN54TEn4pJO9h5xtLigrETKc2MedpHaelT2vlOl/Z3OnO8TjqfzfyW7+zOyKv+vq+rYAhl9Fd4O+SDnC07toSw/rdBRmjAG1ZXacvQyKw9mSOZLDJhgG/Et60Op9GpKZil6xNAFhHxEK5TpJ3wh4gnhz6HNyCKLQczcz2F8L+Oaun63ITE/1s0BwM4pDfIB2IAdgBkECobfqr+SU10Akl3Rz0kv+bAuWa6jv8bR/58uaRNnt3fJW70ooyAME7BQj0c1nEqyOXSX0T8L6gehsifSe1OZZGOm/vc1dWC+BwzvxfRbATLFnEGxuAQvL+ko0+p1eHOYQUvnuVq+fgjy5UVy1UOu+Rk2Ci+CshkBATmpDemUuaZdzaukkzw4q6wEqXVkA9/UveZIMydZ/PV3SaORQ/QWXEt5y9gMh+NHvBrpe/VG01UFTMF9/10Gp5ZquR2APaEi7gLv5Z5KXDACL+4mTQHAxhe1Zt1BNQ69DYmR7TgL7j+vLat5l8dkRcE8ab/J03AirO9DrDtUGuZbjoIqmvzRlIBkbCdgPmwHwZU1X6OAhiPu8k3jlcEXFhDb2rj2dfPF1A/8q2y1FuiKuMztjrLLOPt3JXUBXVoszOkEsZaVXfijyC4DjzCjpzug8Frn7/5Vh62a1ctHCxMYUCQqAHJOMBwHmwYA4LTAYdp2/ICJXe7VkIVER8GFmpi+fz298wrYYn3gwvBVX4ptI/XbezKqDY+vD58cAD1qRJ07K5y+9L20B75olD5MujpOXDdaZn05xgAwv06HAO4XHQUC5XxclmGyMfXsilEkCtIEb1HJ0YIY1XSL/vUHzML26sv3S/v2Xk1R3uwKC9vPMPL6G46trNW88WxgkZtaIvj12UhuT55H5fWFU9J5QPqfE3fsbiWj2yTElMkXNkaANw+Zu5YiHh7T4hsx+XWsqkShNw7Iz+Gmya/YPs8Bddebej62/NvJlaqsyqyhfK5bK6JiZInKCIiCPEN+/9ohzd8MDpH6MgznelPzCuCS/oMHRvpgT58/NZ0QkO7Wa190N9d+OCzmsrGBBHDEF0ZH/gK3Q0OQeFfnGqMSktK2AoAB8CNuENpr1/h+mEFUPj9A+VPXTtcfpO/3t0UWy0QxNRocmM0WnbkRo4T/z1KuiOC1F/7PIopdx8fQirjE5mWEgnGB3D7kD8rrEFauVAxjxsCDwB2aTnN2Z135xiz/5IPlj7gxw9YKnFwfY3pX+I+JAVwEpN7t5c7BA3RHT4bK3H7rNNl1SrtK8amkUmYdqqGTf4palJtj2cbSCPJXKDb77E6QRBNr/3hNkPf5cHXqzNKoFzY/zYDsCdyiJr038kQuznwO3eIrRIHQDJ+l5E48AMAXHjg7Tj+W3frc0oMwDGvNxPiCc1d60P0WSzj5guaC5vncct+zs9TBc6dvU8xxHGfYOLg40Db+q3d+YFC5/ovnw3vrR6kAcR1FLC1rjP3HDibIl2QKFJ2rOkO5qXEeXqLfX29RRxlMsHnJfJ7ibven/M6h97Qm1wD4lqIc/y8YG7Oli1cjY6Gh2sfT+Pn5exLOwpxd3+PB7r9pav+u8sOi/D8pf913v2M/GzP1o6/UdnUZC7sz6qQIVmkG3gcEJBOKalC87esyxZ27/OcxgxFztT0inMDBPbL0/Lx/VFCsfBxVlVZgtc9lA05cDncHpBhGYEhXDS5/nOmMlScGqEZup+eZHH6+v//Yn8BRO4rQ5FZmUmrULKP/Q//PodPy3tOf34C6jN5tT0fzjMzpyyzdN3aTFLQvLKOBlY75ZiSfbmstV5Ntvgmdv7p6ur8txMTFOKzfzpR+lVZ+dv3o7L3jCcWRPDXGicXAE8aIAorXaLjLNi+C9xepQ67s8yXUSn2x7b8oU5+GcvnhJfPjkOSvB20KhGx5WBffWorX7w1Ud12fNTwi4V3qHEb3FbQwznOyr+O12zwktrYVz477R14wt3nCU9wxGvV140oqMSTLvFN3CjQomBMo/87Rx5PV/QrK+XbeDHF4miBIpIkIsfkRkcnlHeHqiK7LQhz6hohF23mfjuBvzqLR/9LwOpYrNloBxq/8v7Z/zfHgu1WuWjIEDS03lsHQWc7i9K5B4M5Eibv1+NYswPF5RhAeS7id2IRYmBNLqkQhjVIFQkd/aK80pvY+dsrj4+vHS3rSqNn4gH0O2OADoJqsp/0CBerEGpCtgcvtkYU1ZiYkdjeL9FU/GZhBS6z2cuBLAs7SHuCRr9Qj6/tTyydu9CXRBlmvrZztwiz6E466mSPHYxIMUjCwrK74oIVISJZRU+4IrNDHBWF5NG4rtJ6YZIU/WCksuLVWRbrrLfP10P6wKgt/v4tXh57PbguS0kC3qu8M5Ouqu3PhKG0LoLESEkWIqdT3Lc2JNQslx9msS1s1lV24HI3702yB4B3L/87t8de8ZEN9Ir/AbmuOGw6osxeJiilXZYn1lXyM6v4JjmbXeo1T9t43jwudQMv3E9c7Mkvk+dy3ojQZ6/tc48QK4GBCvZyIAswTlTLql7KShQIqCMuTsFAcei7eyc87iCfgRQujw+uzOubDSbkpF0m29jNgetOkLXlOTsoI/WyDv+Pm5Ze//Icx697QTqWh2F2wl0rC7h4/PiuFaEdbBj8CmvJLy0oXcZ95YI4P53H4WomZchROPjohHW8Xao/EVP2n/TFuO8SEpYN+dDK2lbNJklWYax2DQXT1rTkLIMuf+5izqBhyZeZGWM1vO0COaEwVsPYd3zkbqlarROZGri65gIMeSYsEewUAM4bgPPCyscyLNvquBl0H8Ss+lntn/4/CKzfrC5HFMQr0R6v+hGv2xsvWefXop6weNnDeCWKzqv63ml16ZQtUc3lzzRX9tmuPvsu6DdHYKnQsKFoJZCJpkM0P0WzTzTri6kAkRimixnXU4nbHqokHqbCzv36gnMgEn7SauNTts2mo7+2nM7tW61XdkXsVfZnenhs1JHF7fze/dj0P2cbOD65p2ER+o2RMEqw3EWrtEHGVEqGSse2MAtwajZuF5ahMFMyoJRh7A4ztEtrGM8TJriIdhj5XhCn+27worzQe77WKwcsbcplFN43R99R+ddO0Ff4qr6fYENpDTAB1geOO+5xx8fHmI1WAew30tHczJhr39XBv1AcSxlP+gx2oL4y7d14z9fdH7MoVQTaV2vlwMj74x6IN4EvN4iNLoCnwz7tFMCkGnXStCJyMNXblRGwIPBIJswoDSG4BwHqEUB+eVpTbwLvNm934C2Kn4IyIHfl6GQVz4K7p4DcPjYuAzwEtmkHACbltK/3BTZKtStQRsJogZW48GRpQNBs/Fn7ZDupQqCbz/rpfYg9qNN7O8FgqsE0vSBeW+JbtPat9Kzv+fbuoMMwjkLHMnlaQcpaAEawrlL+n+aqkrhG8WDbDnzbtV1acuds7icCRbCtSKwB+gGSZWaLEhB4hnY1qN4p90zuU89U7CDbAkDrjPzS/sP1esl2lHv1c4kdX/TxZWq/fJu99FbfGvpjtiGBhm5BSl8OrSH3WC9WFXFpDJCzFL2nMSa/LAt/kkdl6ok+e/zW7syX5dMnjx7cXB0Pp7vVsnIqalKnsk3pl/vJ8/vbm7Pj+qROYtsa6Ih8foBff/mijODNdxdFhns6331rvfRWPwQWltx6CVWZqqcikDNj7CtL5lnE6gsuQl8iQpk0H3DH7KsXWVEs5ohe+/nc0KamUWRI5W439uvE2YeqFO+80Yi1Xi4Sbm2/BE2PsK8ELpBbnLfQ8ZAL4MkA98Nr2u99Th9ha2azSIo2EL30cEjG05rvJPe+YrWlEOmiGkvcs/nu2+Clt0Ik2VhckVua5ousLnxY8CB6OQFiCFumZ3JECo4UewCExdUNtCLMhVDgS7IfxQh652VGIv31ElSLgogB4M+kL3NcnlOm52T+k8GX56hGcNvAWmJoVdCJIDpSrIXi4CJ1CLUV3OPxIKJ4poZ1dQp7+kSRiEwlIYpfaa5JjxvkKBdmJICOw8+rCEejlQSEf5klIqWG/ogfmzpvfw2M6ZzYoZu5ltLvOZZREixvticMwNMItYBEaEB2wrxZjittJ/V+ZMjQJIHTtlppSPvTSe/r609D3NGJBoU7jiZoFLgEe2aRRcCGAXyepbRoAdD7oiX1tp6JmvqCrCtEnqkRmjCsbWXJCBeeipTlPqtx/q0Rs0lCndYWOs79oxrZXoKYIP60t0RYGYMAFey5Y636ZdP3v4E1oWTdt/HRqHgcIVzRI82Hi3blhlZUWnY6pjVUUNazWpiaa6S2YsVs6m51nXqNO4cHjmeuR7Mi9LKlnXK1mIwakqcQQzQVeqY1OgvdUXTRNhA3V12qRGvezXeI/+fP/rt/DvpBA9/OvWpvmbMGlgASJpe1AMNkD8wZ/006UwAASGBHZlpperzsIH6mhDapKm2JLkuxBLaTlBu6BwPZrJln7osaMJ/SGkrIxyPevQEZ95OJULDtf1sNQQZ64PA74eZhA8NGYRv9skJkVbBXlrrQEjSmtFyxquq8qq6vLEWv8nD7XWletaHmqR5J0erZOfuzUjGFs7/WJA9PY8XbUzbu/T9vvwl33cHcxpZUAUq10/QnITJqUmobVconyJ3mikL2rIMAIIhSPvjgWl1nVGMvGAQO0/wEnLHhwE4lSp33q6TkRs7lvkfrfFgM09jL/GzSiRDQMdK3fihbK/ZJ3hoyw2BSzylXExjFDG1JM9nB7HJbpu+agRXQjpMpOyOKnkI4bNu4tS+7XNalxE0xEObEbIorZpLNm7ko8zyM2LB7i4vCgnNsn75uHh8KDhdaAkpEp6bABsIxAAgJRTcrJB5PCTMpWU5znIt6ysaUdAdpkWsrgxM5pfW2FLuVz4lBN+1tF4/9Cgg3epfpS4K91EWHfmivFD/BtvukZhXE08RmgIFiQh4A56Kp8QA5ZM2cFRiXl0XuKkpuJJN8nGD81Y9zbXhfMCCOohuroVM/uh53Goy5/aSM5FzD1MK0l7R5rQ+y6tihy1tad5P6NuVxZCtb3x0ub5uuXA9yYejbJoCV4Z0Sk/nEZWCrftH2LbvnJpGbeilpOr6dQ41nYcDsRYwmDuY/DeWVuFQl4/r1g/Xb8ucDS+Y2hTNAZ9R8qluTk+VkPV2P24akUYecuyrAwqFZAJPvOcJh9ibMIgaZv5tTBLUZelPtpim1u5BubPY9maVMkqpC1ESSl57L1GgeBOCBs+m0nN+UlkI3OVKGFC8pXQ6gAdJttg3f2JshhT+wP/rYoprm1VAd6n1Trx57rioBCU/pq5udMcjWK4kxcUOxYTlYA/U6lG5hE+eEzjAQdmYb9VwQTrmCMzsBZnV+PIOD+NmktJRDwxNFZbGbKR/qf4RfdxqgefckypxwpBDVaHj9YAAfcAUn7Mw+Ul9bUxQm477jH37qEwtlpKmOJhk69UqHji1czlN+7EXZ6P80x06Em8gwnmCsgfQshzwvlAVb6DbdiVDcnR0QeUHEYjLCovzhswmMoN16CyHNyxNrDYrHjUQ44C1KADHSJxWNQ25FAVdaqVpcCpWcQcvpojcAhk2ZQwoJpa+Ryi+0enfvMYzq2Y+P3iRYMzCyMbsC0ACAIibqYAVVl8tutW1o51pAvAa7glKsQNZFAkBGCb1wsNNXUSq+W6vWgQOvOV3MlkI7OABiiUsjfvxZi4u0mtbUFrq5ClpR3jo6BqG2HygWXvHw/L9HP0EoIllM6XA2z9z3FG2Sq91ml3xJMYH1ojcBuvViBhMY1zTQBKPlZwyIhsbpEJMG4wDIIWhlLrE6QSkJyp9tFVsirCLuAMX1Rowbf+Pq51rMC0K2fT9pBCuQkSY6mIGfHAfA90l7qmMXWp/nxy+0HjYjAhF0AMRzVYxfqnbpq2xyXELrNWSO94fBYMiwbJeH7gk+3vlmCOW+3ofwHV+AxKOkZpi6b3++NLSh7nxqo9OwS4O0Qmn5Fyt5T7JsVHpZsVHHPcRyZMeYF2z/XbbeMAXOos/PReQiu2LgosZOcA81cFPiylCUPHRMGy6W4QE1SqcDsjjEoJWN0/qGRjQAIPuPILmiSXV6MAN4NMBjwgJ4dABCNWbzKY2AsB0exyYTsGCAXnQ32yqp5/bEz820DiaYN27v8kRHDdS4TvCFJXZa/1Y3riuLItL95VvjEhbc+RCWre4HWKrBBY1jbZIOjsP9BLiSqCdCa6J3eH/WIj06abwdN4/WOC1u7mcEw2Y3vDAloT5Mzo5Lx/oQ1/Umjs2gaE+KS2wl3Ae4t/9oOyW1Mvx425eG6UvS83nTbxmkVoK1MIyyHgGW6A2IQRFXJpiivLQrwr/OkfK4qYE2AB2sjx65SgGOYLBISQCirmpQajJ+dPWPoL9yPN8kMUa0to3hEXCEm2YAZKCKYtaVnJS6tFOyr3PMZ0qIjw8s9C9vamBxqy4h1jS+jiNiPQR5JHXz0qiu4gcA/53KT4uG75hk7V0H+jklWCnrFpVIUaaFTnyWanfe2tLEK2fFY1EZhYYpz/fYtkrCGTR+1g1wTsQvHISzR2xq2GDP7j0VeQU8OKQywqWVX3FzPLs4229b6kyXfpkLEcGNG4EVZx4KmmP1qAaBAyJ3ATHE9Y/jyYhUZR5Pk6lD1420wPeXCp1BG7CNAZ0vXKKQHXcKATvkTAsx7NkWAD6LubsWCVN8WOSaxEnyGCJWqoo0Bh88a2g9+DtGnsIfC0clHv1aANi+HqDHoGWjMo+quCJN3Qhz4fLyN9oFAzAwilVRpF+5rzQfCMDlhar0dx29ry9z+E5EgGDYWh1jAMAFnA/DUFdXQymk8AQPdkIXUaBdcAMrfOB9EvG28FfyDBhRxmFtQ6yZCqZumeR54r4ckqJAXq0JeGK/wpnsv1zA8SZJYdn5+uti2zUNn2gFNeLtPr2/B9z/Tht9+cXTxw9v4aLZBVq3hNBa71b+yd69vP0M+AAJh0rwp4IQltwW9Cws4f60gj29j4mYF4hGgsl4m90vci8Ez1Lcg/VcAHjZja93T5+cH3fdzFGkgXERukpIqIop8wB8IMGFWIM0CWxpgAcWp4DT3XoFC5g304a+GEtsfI8cAY/+hprna0++w83LdUO8O3Uzf2rf4d33IfU29Ey9ymBtLusvtWe50mI2bqEGQibkQT/EpSsFz6GPSP5aboyCX6rT2yCt3PSOc0VKvnGbgEBnpKxYwzcJu642k5s+ehKmFg080aEYrWsJsF93zGL5toVSgeL3DYYDGKA998KSOYktp6sUlPNoH1y6ckzffRvth+QxguwXceun6kr9+qa6nYsj4U7e7LtQepXr8DGkcBRMXrbAZ2m0bwW3djh0Yc9qcEVgtaKja/n2M1km9dUNqVmxKfF8rWR4E+gtn09XGHn0HH0lSvroTyLHytmibA4pla3PcaAsJEwyB8NGx9YBDVfpMsoC/JAJfIFaXyFHi2W4KOc3eizPlNV1aeA4jm5iX20sIM8NgLoWhlVda+Bvc5VV1XVeOl+bczzaA8bl+a7DZZqaOsRplG5vkZ8RwS7UCL7kwNoKkozdBSogJhyObzmqGpCT9er3Eksv77C3ZI5dKSsSeRFQLnwO0nqlJmmyJBLjFelPlhHIFGsNyxRbLnrnlZeeP3v6+OqyrXhxnEUG2c59Czb8zOcjs6gXOsOoIca90/Z6Rc/LDJoC0HqxrNf9tZbqetyAbb5qDLYbCEeNQjAR+xglc7Sko3/jOoll4ai1Ltnw10//O3LkCV2JAD9ChZgIdS+ffPTBW2+8+vLz+yePbm9UH8JUVQ1f3bYp3HHdpPsCwTF0850pVrm6kjA2b7tLL7RxiJ1rWRuB+ZlaWZlyt6/WlWaVeUVZQlqriKnS92thcGj0m3v+RZxaDlyAMlEOXwsoiJNdD+StV182ob6Ht+fHZ2zBFtFZRr5i0Ed4Nq88Um4VRcpLUtpdatN5KiZ+xBzvapmNW19tLUL0hkPTFEv0qxIG/vrXWV1zPISR1rOnt9eX5467255QVXUfg10ipddrBD9WXE+NyhY/A1uqYhpnwC9WssHR40rNfJSZ7Fv576/A6QL7lWjnxsa4gMDxvEU258nj2+tdBwRtpM0+/7ePQcSl1YL45hxL1i4B8e8ckrherleFvb/l90MXMM3++dKzp48eODH06aNOpVYRqZCcbXh4pieyDO1Fg/pCOfePWz3l1xqOwRDm/JLsTwAT/RMc+7wRzGO72DcLmIepd5HZuzK91yVctFVb4dbuf/ePQ6qVMUyPclhiA1/AxgnlZVJg4GHemfLZiDrxwoBt7jKRawPFkYb6wStYVpSc1NPWGSd7yxytEOoeM9sQrTrdWYYJxJbMxk3vRvVWN6gb6faVmwE4R6j7y+y9jSlMw4nX0dgVaOr95bArgMqCAiOghKKetiNdAibyyKNbYQsvGVtQt/BdI+YtwjvPKv0dsptMoc3L/SEwIT36LQHYpYv3G6rzbOHZHP7f80uOmIkNsKbV3xLI0fav85cGpQVKW4J3xSwg5LvdHk3+fCUyhC3pSEH/AUypmT62bBNKStoawXbi5z1ftIX4T/4jvXt+hRQQgPBoiWDuRudishFjxoZSVESWlxJFO1xW/LjItfXPaEqH6BkT9PeLV4JdgQ9cpThnS7NTJ2Rn5ezLdDsakxGNgtwod98W4fzf++FDoIQCVCA0lk1rRSdpmI9+mqL/AI9BOKYbdsJK8RXJAAGbg9esev99pHHof2f/xSrgz7X9B8v7z/rKtO3/3qGixW+ZIyACGECA3yIbXf1N4VMKycUxf9//QfVIBOSbWMUOIH4kOn8Q3F0Eloi0zyHWxzBhEJxQkQnl2zKEldGaOICactExxynboOt2MXmfR1vnU1awafF5lS1pKcW0rxArFV1ZwuIKRdykKqP2FKE4m/52FHL6BNe6zK4uU1TZImufxPZD4ysZfgKO++PN4HOium1pl+Drplj1Kb9WGWEOFnzb9+FcApLaRVTHgdOboOupo1JTEbXMJ3Hysg0mcYJaLc/GFBz/8G2rPAsmpU1yKZiA9hSV5zgU2KH9KyVOi4zTo6o9+4rUN9H87T/7N9I9ZDv3zbl1HNtMjLNjmgW/303QXj9+tWPjT5vGI7fyjVOka8irjNaWXOrhoOnP43GNEsUBAwzRcQ/Eg679Rl+95orFMd+op24axIMDMPAzeJsjpeSSzjeB2M3RnkJvnB6dgCl8Cfatau9IOSgKpL62VC4PDsSA+cIepxlREdhm4vYywNbA9gjPh3vCfcdvGzvWwqWF7B/wdlyPZvkp+/bMvO7MYfozkrVYvwZrPwMy/yo41rjlHvicbr/ebnDPWdR8IjiN3PKhoPyG/5aLeuRHaPnNreq4fnM+RQFX8hfIj59iOnNYAz+3AMx6UJgwnOWsvDn3sYWALWOL+uB+MPATH5To1JR48puaYMVNJcD4ps5eY9NEordphjsevNS0ws2p4FX3+pTKBsfDoVoCrnXz5TQhCcFqwgjiniZcblQ38bBxqolPkjZNhJjc0CRA5AXBwiaRsEwPFrud8DiLd1nDJWRGb1PXJ2C95KmVFpewjqFqx421JGrUWI25vGqMlbeq/RhhkwCxoYVC1fV7WNi2TDyOBmqA0KqUHVD+FQQVqrZOkEuVWV6j0FioCP7Xk8VokU+aPEUBm7hQiRcvlgxNiRYjCkXNzGgKKwu5ClbmbTwn8wqHFB+DpWuNMxbFqFq1cZNwo/Mqz9cwK1d1DC9gZeX8y9+Cwqo1VgMTo8koZcYxsqhkNEaldFYmlVTklO2BibTy6BV2dk1n5IxI1F1JdpUr6zlMKpa649Nj1X4RF/Vkk/80vPASKFTDx9WDYyVQDGViWs5y/19vcpNMNoUCBmAcrhJw9Z8D7QEEERdoJ4EsiYpoI7G/F28SPhpIIEui/wUKFCRYiFBhwkWIFEVGTkFJhRYtxn9ixWHES5AoSbIUqdKopcvA0nQlImIS0WLEihMvQaIkUjLJUqRKky6DXCaFLEoq2dRyzLvsogUauXrkWZHvkiuus7jqmtcK3LLqhiMK/arXXbfdUeQHP9mpRLFS5cpoTaqgU0nPoFqVGrXeqGO0Vb1GDY6Z0qxJC5Mf/exL916kraikrKKqpq6hmUz20j7W1tHVMy3bcT0/CKM4SbO8KCtSN3TYjsaT6Wy+WNqRmdFnYsV32lXfW6uko+OEhQ8aJ1RVWM3lwpybxo+bku1atHsNYdUdpso1I27sZdJqp5wT7JG5cl0QhgrzWWHxdBhXmkcU7KtDQsKpdu+Wuoyg4LpqeamRI3JBtYoJCCJ11I3zVglhx5BgZRR2CCrurSJR9diaJG0uprEQGmOgTpN3TDjm1oY7JhHTE2hOLEmgeVJ7x8Xo9bFKCxgywRAopCSQKYGAIRmFlBQCgUwN8QfETh00Hb49XSRfiqEeVkEXurpg/4Uuhq/HBsrvWqwTXSG7TwN5n4RLF0bsQtYvu2InEqq7zv27AHbix8HqrMMC+VYRC2c4XqwqWW2ZvWfKArq8ukJeZqRkYk8b+2ht5Imf90+67TmeXD45peET/QA2CREt5YyfYgNO/lCNdlxg2NkvemvZ03YeFK1CLDfd2nW1zDostrAuybZPuY24GUgTqyulcA7zppm6gK675yfT/8/9oHd9SFbsR7i8yYo9GQ==')
    format('woff2');
    font-weight: 100 900;
    font-style: normal;
    font-display: swap;
  }

  :root {
    --vine-green: #659C43;
    --vine-font-weight: 700;
    --vine-font-display: 'Ember Modern Display Standard', sans-serif;
    --color-dropdown-border: #e0e6ef;
  }

  /* Fade-in animation for key elements */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pureFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* Modern Search Bar (toggleable shadow/outline) */

  /* Default: original outline style */
  .vvp-container-search.vvp-container-right-align .a-search {
    border: 1px solid #888 !important;
    box-shadow: none !important;
    border-radius: 24px !important;
    background: inherit !important;
    padding: 0 !important;
    transition: box-shadow 0.2s, border 0.2s;
    position: relative !important;
    display: flex !important;
    align-items: center !important;
    width: 100% !important;
    max-width: 600px !important;
    overflow: hidden !important;
  }

  .vvp-container-search.vvp-container-right-align .a-search:hover {
    border-color: #619EE7 !important;
  }

  .vvp-container-search.vvp-container-right-align input[type="search"] {
    border: none !important;
    outline: none !important;
    background: inherit !important;
    color: inherit !important;
    height: 48px !important;
    font-size: 16px !important;
    border-radius: 24px !important;
    padding: 0 20px 0 52px !important;
    flex: 1 1 0% !important;
    box-sizing: border-box !important;
    box-shadow: none !important;
    transition: background 0.2s, color 0.2s;
  }

  /* Modern shadow style (enabled by .modern-search-shadow) */
  .vvp-container-search.modern-search-shadow .a-search {
    border: none !important;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.45) !important;
    border-radius: 24px !important;
    background: inherit !important;
    padding: 0 !important;
    transition: box-shadow 0.2s;
    position: relative !important;
    display: flex !important;
    align-items: center !important;
    width: 100% !important;
    max-width: 600px !important;
    overflow: hidden !important;
  }

  .vvp-container-search.modern-search-shadow .a-search:hover {
    box-shadow: 0 6px 24px 0 rgba(0, 0, 0, 0.32) !important;
  }

  /* Search Button (shadow toggle) */
  .vvp-container-search #vvp-search-button.a-button-search {
    height: 48px !important;
    border-radius: 24px !important;
    min-width: 100px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border: none !important;
    margin-left: 8px !important;
    background: #ffce12 !important;
    transition: background 0.2s, box-shadow 0.2s;
    box-shadow: none !important;
  }

  .vvp-container-search.modern-search-shadow #vvp-search-button.a-button-search {
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.45) !important;
  }

  .vvp-container-search.modern-search-shadow #vvp-search-button.a-button-search:hover {
    box-shadow: 0 6px 24px 0 rgba(0, 0, 0, 0.32) !important;
  }

  .vvp-container-search #vvp-search-button.a-button-search .a-button-inner {
    height: 100% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 24px !important;
  }

  .vvp-container-search #vvp-search-button.a-button-search .a-button-input {
    height: 100% !important;
    min-width: 100px !important;
    font-size: 16px !important;
    background: transparent !important;
    color: #222 !important;
    border: none !important;
    cursor: pointer !important;
    border-radius: 24px !important;
    padding: 0 24px !important;
  }

  .vvp-container-search #vvp-search-button.a-button-search .a-button-text {
    font-size: 14px !important;
    color: #222 !important;
    font-weight: bold !important;
    letter-spacing: 0.03em !important;
    border-radius: 24px !important;
  }

  /* Animation for sidebar node expansion */
  @keyframes slideDownFadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Modernize filter tab buttons */
  #vvp-items-button-container {
    display: flex !important;
    justify-content: center !important;
    gap: 12px !important;
    margin-bottom: 24px !important;
    padding: 10px 0 !important;
    /* Apply fade-in animation */
    animation: fadeIn 0.5s ease-out 0.1s backwards !important;
  }

  /* Keyframe for center-reveal underline animation */
  @keyframes underlineReveal {
    from {
      width: 0;
    }

    to {
      width: 100%;
    }
  }

  /* Remove the outer boxy container style from the buttons */
  .vvp-items-button,
  .vvp-items-button:hover,
  .vvp-items-button:focus,
  .vvp-items-button.a-button-focus {
    background: none !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    /* Remove default padding that can cause layout shifts */
  }

  .vvp-items-button .a-button-inner {
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    transition: all 0.2s ease !important;
    padding: 0 !important;
    position: relative !important;
    outline: none !important;
    box-shadow: none !important;
  }

  .vvp-items-button .a-button-text {
    color: #444 !important;
    /* Near black for inactive */
    text-decoration: none !important;
    display: inline-block !important;
    padding: 8px 16px !important;
    font-weight: normal !important;
    position: relative !important;
  }

  /* Underline pseudo-element for hover animation */
  .vvp-items-button:not(.a-button-selected) .a-button-text::after {
    content: '' !important;
    position: absolute !important;
    bottom: 2px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 0 !important;
    height: 3px !important;
    background: var(--vine-green) !important;
    transition: width 0.3s ease !important;
  }

  /* Hover state for non-selected buttons - reveal underline from center */
  .vvp-items-button:not(.a-button-selected) .a-button-inner:hover .a-button-text::after {
    width: 80% !important;
  }

  .vvp-items-button:not(.a-button-selected) .a-button-inner:hover .a-button-text {
    color: var(--vine-green) !important;
  }

  /* Selected state - bold underline, black text */
  .vvp-items-button.a-button-selected .a-button-inner {
    background: transparent !important;
    border: none !important;
  }

  .vvp-items-button.a-button-selected .a-button-text {
    color: #000 !important;
    font-weight: bold !important;
  }

  /* Active tab underline indicator */
  .vvp-items-button.a-button-selected .a-button-text::after {
    content: '' !important;
    position: absolute !important;
    bottom: 2px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 80% !important;
    height: 3px !important;
    background: var(--vine-green) !important;
  }

  /* Disabled/inactive state for buttons */
  .vvp-items-button .a-button-text[aria-disabled="true"],
  .vvp-items-button .a-button-inner[aria-disabled="true"],
  .vvp-items-button[aria-disabled="true"] .a-button-text {
    color: #888 !important;
    opacity: 1 !important;
  }

  /* Remove default Amazon focus ring */
  .vvp-items-button .a-button-inner:focus {
    box-shadow: none !important;
  }

  /* Floating Filter Sidebar Overlay */
  #vvp-filter-container {
    position: absolute !important;
    top: 45px !important; /* Aligned with the start of the items grid, skipping results text */
    left: 20px !important;
    width: 260px !important;
    z-index: 10 !important;
    background: #fff !important;
    border-radius: 18px !important;
    padding: 16px !important;
    box-shadow: none !important;
    transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    border: none !important;
    max-height: none !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }

  #vvp-filter-container:hover {
    box-shadow: none !important;
    transform: translateY(-2px);
  }

  /* The parent of both the filter and the grid container */
  .vvp-items-container {
    position: relative !important;
    padding-top: 10px !important;
  }

  /* Ensure the grid container provides room for sidebar */
  #vvp-items-grid-container {
    position: relative !important;
    padding-left: 300px !important;
    margin-top: 0 !important;
    transition: padding-left 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  /* Monitor page: remove sidebar padding since sidebar is hidden */
  body[data-hash="monitor"] #vvp-items-grid-container {
    padding-left: 0 !important;
  }

  /* Ensure the search/tabs container above doesn't overlap or get obscured */
  .vvp-items-button-and-search-container {
    position: relative !important;
    z-index: 1 !important;
    margin-bottom: 20px !important;
  }

  /* Adjust for mobile or smaller screens */
  @media (max-width: 1024px) {
    #vvp-filter-container {
      position: relative !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      margin-bottom: 20px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
    }
    #vvp-items-grid-container {
      padding-left: 0 !important;
    }
    body[data-vh-filter-grid-collapsed="true"] #vvp-items-grid-container {
      padding-left: 0 !important;
    }
  }

  #vvp-browse-nodes-container {
    display: flex !important;
    flex-direction: column !important;
    gap: 2px !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  #vvp-browse-nodes-container>p {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    margin-bottom: 8px !important;
    font-size: 1em !important;
    padding: 0 2px !important;
    font-family: var(--vine-font-display) !important;
    font-weight: var(--vine-font-weight) !important;
  }

  #vvp-browse-nodes-container p a.a-link-normal {
    font-family: var(--vine-font-display) !important;
    font-weight: var(--vine-font-weight) !important;
  }

  #vh-filter-toggle {
    cursor: pointer !important;
  }

  #vh-filter-toggle::before {
    content: "|" !important;
    margin: 0 8px 0 0 !important;
    color: #c8c8c8 !important;
    font-weight: normal !important;
  }

  body[data-vh-filter-collapsed="true"] #vvp-filter-container {
    height: 20px !important;
    padding: 0 8px !important;
  }

  body[data-vh-filter-collapsed="true"] #vvp-browse-nodes-container > :not(p:first-child) {
    pointer-events: none !important;
  }

  body[data-vh-filter-collapsed="true"] #vvp-browse-nodes-container > p {
    margin-bottom: 0 !important;
    line-height: 20px !important;
  }

  body[data-vh-filter-grid-collapsed="true"] #vvp-items-grid-container {
    padding-left: 20px !important;
  }

  .parent-node {
    display: flex !important;
    align-items: center !important;
    padding: 0 !important;
    border-radius: 8px !important;
    margin: 0 !important;
    min-height: unset !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  .parent-node:hover,
  .parent-node.active,
  .child-node:hover,
  .child-node.active {
    background: #f5f7fa !important;
  }

  /* Hover & Active text states */
  .parent-node:hover .a-link-normal,
  .parent-node .a-link-normal:hover,
  .parent-node .a-link-normal:focus,
  .parent-node:hover span,
  .child-node:hover .a-link-normal,
  .child-node .a-link-normal:hover,
  .child-node .a-link-normal:focus,
  .child-node:hover span,
  #vvp-browse-nodes-container p a.a-link-normal:hover {
    color: var(--vine-green) !important;
    background: #f5f7fa !important;
  }

  .parent-node .a-link-normal {
    flex: 1 1 auto !important;
    font-weight: 600 !important;
    color: #222 !important;
    font-size: 0.98em !important;
    padding: 6px 0 6px 6px !important;
    border-radius: 8px !important;
    text-decoration: none !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    width: 100% !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  .child-node .a-link-normal {
    flex: 1 1 auto !important;
    font-weight: normal !important;
    color: #222 !important;
    font-size: 0.95em !important;
    padding: 3px 0 3px 6px !important; /* Tighter vertical spacing */
    border-radius: 8px !important;
    text-decoration: none !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    width: 100% !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  .child-node {
    display: flex !important;
    align-items: center !important;
    padding: 0 0 0 20px !important; /* Indentation for subcategories */
    border-radius: 8px !important;
    margin: 0 !important;
    min-height: unset !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    animation: slideDownFadeIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
  }

  /* When switching children in the same parent, no transition animations */
  #vvp-browse-nodes-container.vvp-no-slide .child-node {
    animation: none !important;
    opacity: 1 !important;
  }

  #vvp-browse-nodes-container.vvp-no-slide {
    animation: none !important;
    opacity: 1 !important;
  }

  /* Active Node Styling */
  .parent-node.active,
  .parent-node.active .a-link-normal,
  .child-node.active,
  .child-node.active .a-link-normal,
  #vvp-browse-nodes-container .a-link-normal.selectedNode,
  #vvp-browse-nodes-container .selectedNode .a-link-normal {
    color: #fff !important;
    background: var(--vine-green) !important;
    border-radius: 8px !important;
  }

  .parent-node.active span,
  .child-node.active span,
  #vvp-browse-nodes-container .selectedNode + span {
    color: rgba(255, 255, 255, 0.9) !important;
  }

  .parent-node span,
  .child-node span {
    color: #888 !important;
    font-size: 0.95em !important;
    margin-left: 6px !important;
    padding-right: 2px !important;
    transition: color 0.3s ease !important;
  }

  #vvp-browse-nodes-container {
    display: flex !important;
    flex-direction: column !important;
    gap: 2px !important;
    margin: 0 !important;
    padding: 0 !important;
    animation: fadeIn 0.4s ease-out !important;
  }

  #vvp-items-grid-container>p {
    text-align: center !important;
    font-family: var(--vine-font-display) !important;
    font-weight: var(--vine-font-weight) !important;
    font-size: 1.4em !important;
    animation: fadeIn 0.5s ease-out 0.4s backwards !important;
  }

  #vvp-items-grid,
  /* The grid of product cards */
  #vvp-items-grid-container .a-pagination {
    /* Pagination controls */
    animation: fadeIn 0.5s ease-out 0.4s backwards !important;
  }

  /* Hide nav-subnav (deals bar) */
  #nav-subnav {
    display: none !important;
  }

  /* --- Modern Material Design Orders Table (non-destructive) --- */
  /* All vvp-orders-table and heading-top table modifications have been removed below */

  /* --- Modernize Reviews Page --- */

  /* Main container for the Reviews tab content */
  div[data-a-name="vine-reviews"] .vvp-tab-content {
    border: none !important;
    padding: 8px 4px !important;
  }

  /* Filter buttons (Awaiting Review / Reviewed) */
  #vvp-review-button-container {
    display: flex !important;
    justify-content: flex-start !important;
    gap: 12px !important;
    margin: 0 12px 24px 12px !important;
    padding: 10px 0 !important;
    animation: fadeIn 0.5s ease-out 0.1s backwards !important;
  }

  /* Remove the outer boxy container style from the review filter buttons */
  #vvp-review-button-container .a-button-toggle {
    background: none !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    /* Remove default padding that can cause layout shifts */
  }

  #vvp-review-button-container .a-button-toggle .a-button-inner {
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    transition: all 0.2s ease !important;
    padding: 0 !important;
    position: relative !important;
    outline: none !important;
    box-shadow: none !important;
  }

  #vvp-review-button-container .a-button-toggle .a-button-text {
    color: #444 !important;
    /* Near black for inactive */
    text-decoration: none !important;
    display: inline-block !important;
    padding: 8px 16px !important;
    font-weight: normal !important;
    position: relative !important;
  }

  /* Underline pseudo-element for hover animation */
  #vvp-review-button-container .a-button-toggle:not(.a-button-selected) .a-button-text::after {
    content: '' !important;
    position: absolute !important;
    bottom: 2px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 0 !important;
    height: 3px !important;
    background: var(--vine-green) !important;
    transition: width 0.3s ease !important;
  }

  /* Hover state for non-selected buttons - reveal underline from center */
  #vvp-review-button-container .a-button-toggle:not(.a-button-selected) .a-button-inner:hover .a-button-text::after {
    width: 80% !important;
  }

  #vvp-review-button-container .a-button-toggle:not(.a-button-selected) .a-button-inner:hover .a-button-text {
    color: var(--vine-green) !important;
  }

  /* Selected state - bold underline, black text */
  #vvp-review-button-container .a-button-toggle.a-button-selected .a-button-inner {
    background: transparent !important;
    border: none !important;
  }

  #vvp-review-button-container .a-button-toggle.a-button-selected .a-button-text {
    color: #000 !important;
    font-weight: bold !important;
  }

  /* Active tab underline indicator */
  #vvp-review-button-container .a-button-toggle.a-button-selected .a-button-text::after {
    content: '' !important;
    position: absolute !important;
    bottom: 2px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 80% !important;
    height: 3px !important;
    background: var(--vine-green) !important;
  }

  /* Disabled/inactive state for buttons */
  #vvp-review-button-container .a-button-toggle .a-button-text[aria-disabled="true"],
  #vvp-review-button-container .a-button-toggle .a-button-inner[aria-disabled="true"],
  #vvp-review-button-container .a-button-toggle[aria-disabled="true"] .a-button-text {
    color: #888 !important;
    opacity: 1 !important;
  }

  /* Remove default Amazon focus ring */
  #vvp-review-button-container .a-button-toggle .a-button-inner:focus {
    box-shadow: none !important;
  }

  /* Reviews heading (reserved for future stylizations) */
  div[data-a-name="vine-reviews"] .vvp-reviews-table--heading-top h3,
  div[data-a-name="orders"] .vvp-orders-table--heading-top h3 {}

  /* Reviews and Orders table (reserved for future stylizations) */
  div[data-a-name="vine-reviews"] .vvp-reviews-table,
  div[data-a-name="orders"] .vvp-orders-table {}

  /* Reviews and Orders table rows (reserved for future stylizations) */
  div[data-a-name="vine-reviews"] .vvp-reviews-table tbody tr,
  div[data-a-name="orders"] .vvp-orders-table tbody tr {}

  /* Reviews and Orders table cells (reserved for future stylizations) */
  div[data-a-name="vine-reviews"] .vvp-reviews-table th,
  div[data-a-name="vine-reviews"] .vvp-reviews-table td,
  div[data-a-name="orders"] .vvp-orders-table th,
  div[data-a-name="orders"] .vvp-orders-table td {}

  /* Reviews and Orders table last row cells (reserved for future stylizations) */
  div[data-a-name="vine-reviews"] .vvp-reviews-table tr:last-child td,
  div[data-a-name="orders"] .vvp-orders-table tr:last-child td {}

  /* "Review item" button */
  div[data-a-name="vine-reviews"] .vvp-reviews-table .a-button-primary .a-button-inner {
    border-radius: 20px !important;
    border: 1px solid #c89617 !important;

    box-shadow: none !important;
    transition: all 0.2s ease !important;
  }

  div[data-a-name="vine-reviews"] .vvp-reviews-table .a-button-primary .a-button-inner:hover {

    border-color: #e4ae1a !important;
  }

  div[data-a-name="vine-reviews"] .vvp-reviews-table .a-button-primary .a-button-text {
    color: #fff !important;
    font-weight: normal !important;
    text-decoration: none !important;
  }

  div[data-a-name="vine-reviews"] .vvp-reviews-table .a-button-primary .a-button-inner .a-button-text {
    color: var(--tab-bg) !important;
  }

  div[data-a-name="vine-reviews"] .vvp-reviews-table .a-button-primary .a-button-inner:hover .a-button-text {
    color: var(--tab-bg) !important;
  }

  /* Hide "recently viewed items and featured recommendations" */
  #rhf {
    display: none !important;
  }

  /* --- Infinite Scroll Indicator --- */
  #infinite-scroll-indicator {
    text-align: center;
    padding: 40px;
    display: none;
    /* Hidden by default */
  }

  #infinite-scroll-indicator span {
    font-size: 16px;
    color: #888;
    vertical-align: middle;
  }

  #infinite-scroll-indicator span::before {
    content: '';
    display: inline-block;
    width: 24px;
    height: 24px;
    margin-right: 12px;
    border: 3px solid rgba(255, 255, 255, 0.2);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    vertical-align: middle;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* --- Favorites Feature Styles --- */
  #vvp-favorites-tab a {
    cursor: pointer;
  }

  #vvp-favorites-tab.a-active a {
    /* Style to match other active tabs */
    color: #c45500;
    border-bottom-color: #c45500;
  }

  #vvp-product-details-img-container {
    position: relative !important;
  }

  .vvp-item-image-container {
    position: relative;
    display: inline-block;
    line-height: 0;
    /* Removes extra space below the image */
  }

  /* Simpler soft bounce animation */
  @keyframes buttonSoftBounce {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1.1); }
  }

  .favorite-btn {
    position: absolute;
    bottom: 12px;
    right: 8px;
    cursor: pointer;
    z-index: 10;
    color: #666; /* Note: Replaced #999 with #666 for darker outline */
    /* Darker gray for better contrast */
    transition: transform 0.2s ease-out, color 0.2s ease, box-shadow 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: white;
    width: calc(40px * var(--vh-monitor-tile-scale, 1));
    height: calc(40px * var(--vh-monitor-tile-scale, 1));
    border-radius: 50%;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }

  .favorite-btn svg {
    width: calc(24px * var(--vh-monitor-tile-scale, 1));
    height: calc(24px * var(--vh-monitor-tile-scale, 1));
    transition: transform 0.3s ease;
  }

  .favorite-btn:hover {
    animation: buttonSoftBounce 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }

  /* Shrink effect on click/hold */
  .favorite-btn:active {
    animation: none; /* Override hover animation */
    transform: scale(0.9);
    transition: transform 0.1s cubic-bezier(0.25, 1, 0.5, 1);
  }

  .favorite-btn:hover svg {
    /* Prevent double scaling */
  }

  .favorite-btn.favorited {
    color: #ffc107;
    /* Gold color for favorited */
  }

  #vvp-favorites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }

  .a-popover-header {
    position: relative !important;
    /* Make it a positioning context */
  }

  /* Remove unused details-modal-favorite-btn rules */
  /* Removed: .details-modal-favorite-btn, .details-modal-favorite-btn:hover, .details-modal-favorite-btn.favorited */

  .vvp-container-search.vvp-container-right-align {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 8px !important;
    width: 100% !important;
    max-width: none !important;
    margin: 32px 0 !important;
    padding: 0 16px !important;
    box-sizing: border-box !important;
    float: none !important;
    animation: fadeIn 0.5s ease-out 0.2s backwards !important;
  }

  #vvp-items-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fill, minmax(calc(200px * var(--vh-monitor-tile-scale)), 1fr)) !important;
    gap: calc(24px * var(--vh-monitor-tile-scale)) !important;
    background: none !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 16px !important;
    max-width: 100% !important;
    margin: 0 auto !important;
    justify-content: start !important;
  }

  /* Base grid rule - applies when no media query matches */
  #vvp-items-grid {
    grid-template-columns: repeat(auto-fill, minmax(calc(200px * var(--vh-monitor-tile-scale)), 1fr)) !important;
    gap: calc(24px * var(--vh-monitor-tile-scale)) !important;
  }

  /* Responsive breakpoints for optimal grid behavior */
  @media (max-width: 480px) {
    #vvp-items-grid {
      grid-template-columns: repeat(auto-fill, minmax(calc(160px * var(--vh-monitor-tile-scale)), 1fr)) !important;
      gap: calc(16px * var(--vh-monitor-tile-scale)) !important;
      padding: 0 12px !important;
    }
  }

  @media (min-width: 481px) and (max-width: 768px) {
    #vvp-items-grid {
      grid-template-columns: repeat(auto-fill, minmax(calc(180px * var(--vh-monitor-tile-scale)), 1fr)) !important;
      gap: calc(20px * var(--vh-monitor-tile-scale)) !important;
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    #vvp-items-grid {
      grid-template-columns: repeat(auto-fill, minmax(calc(200px * var(--vh-monitor-tile-scale)), 1fr)) !important;
      gap: calc(24px * var(--vh-monitor-tile-scale)) !important;
    }
  }

  @media (min-width: 1025px) and (max-width: 1440px) {
    #vvp-items-grid {
      grid-template-columns: repeat(auto-fill, minmax(calc(220px * var(--vh-monitor-tile-scale)), 1fr)) !important;
      gap: calc(28px * var(--vh-monitor-tile-scale)) !important;
    }
  }

  @media (min-width: 1441px) {
    #vvp-items-grid {
      grid-template-columns: repeat(auto-fill, minmax(calc(240px * var(--vh-monitor-tile-scale)), 1fr)) !important;
      gap: calc(32px * var(--vh-monitor-tile-scale)) !important;
    }
  }

  /* Potluck: center the grid so a small number of tiles starts centered */
  body[data-queue="potluck"] #vvp-items-grid {
    grid-template-columns: repeat(auto-fit, minmax(calc(200px * var(--vh-monitor-tile-scale)), calc(260px * var(--vh-monitor-tile-scale)))) !important;
    justify-content: center !important;
    gap: calc(24px * var(--vh-monitor-tile-scale)) !important;
  }

  @media (max-width: 480px) {
    body[data-queue="potluck"] #vvp-items-grid {
      grid-template-columns: repeat(auto-fit, minmax(calc(160px * var(--vh-monitor-tile-scale)), calc(220px * var(--vh-monitor-tile-scale)))) !important;
    }
  }

  @media (min-width: 481px) and (max-width: 768px) {
    body[data-queue="potluck"] #vvp-items-grid {
      grid-template-columns: repeat(auto-fit, minmax(calc(180px * var(--vh-monitor-tile-scale)), calc(240px * var(--vh-monitor-tile-scale)))) !important;
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    body[data-queue="potluck"] #vvp-items-grid {
      grid-template-columns: repeat(auto-fit, minmax(calc(200px * var(--vh-monitor-tile-scale)), calc(260px * var(--vh-monitor-tile-scale)))) !important;
    }
  }

  @media (min-width: 1025px) and (max-width: 1440px) {
    body[data-queue="potluck"] #vvp-items-grid {
      grid-template-columns: repeat(auto-fit, minmax(calc(220px * var(--vh-monitor-tile-scale)), calc(280px * var(--vh-monitor-tile-scale)))) !important;
    }
  }

  @media (min-width: 1441px) {
    body[data-queue="potluck"] #vvp-items-grid {
      grid-template-columns: repeat(auto-fit, minmax(calc(240px * var(--vh-monitor-tile-scale)), calc(280px * var(--vh-monitor-tile-scale)))) !important;
    }
  }

  #vvp-items-grid .vvp-item-tile {
    background: var(--tile-bg, #fff) !important;
    border: none !important;
    border-radius: 18px !important;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.10) !important;
    transition: box-shadow 0.28s cubic-bezier(0.4, 0.0, 0.2, 1), transform 0.28s cubic-bezier(0.4, 0.0, 0.2, 1);
    margin: 0 !important;
    padding: 10px 8px 12px 8px !important;
    position: relative !important;
    overflow: hidden !important;
    min-height: 320px !important;
  }

  #vvp-items-grid .vvp-item-tile.vh-placeholder-tile {
    opacity: 1 !important;
    filter: none !important;
  }

  #vvp-items-grid .vvp-item-tile:hover {
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.18) !important;
    z-index: 2 !important;
    transform: translateY(-2px) scale(1.025);
  }

  #vvp-items-grid .vvp-item-image-container,
  #vvp-items-grid .vh-img-container {
    margin-bottom: 8px !important;
  }

  #vvp-items-grid .vh-img-container img {
    max-height: none !important;
    width: 100% !important;
    object-fit: contain !important;
    display: block !important;
    margin: 0 auto !important;
  }

  #vvp-items-grid .vvp-item-product-title-container {
    margin: 8px 0 4px 0 !important;
    padding: 0 4px !important;
    min-height: 0 !important;
  }

  #vvp-items-grid .vvp-item-product-title-container>a {
    font-weight: bold !important;
  }

  #vvp-items-grid .vvp-item-product-title-container .a-truncate,
  #vvp-items-grid .vvp-item-product-title-container .a-truncate-cut {
    max-height: 3.9em !important;
    height: auto !important;
  }

  #vvp-items-grid .vvp-item-product-title-container .a-truncate-cut {
    font-size: 13px !important;
    line-height: 1.3 !important;
    white-space: normal !important;
  }

  body[data-vh-scale-step="large"] #vvp-items-grid .vvp-item-product-title-container .a-truncate,
  body[data-vh-scale-step="large"] #vvp-items-grid .vvp-item-product-title-container .a-truncate-cut {
    max-height: 2.6em !important;
  }

  body[data-vh-scale-step="small"] #vvp-items-grid .vvp-item-product-title-container .a-truncate,
  body[data-vh-scale-step="small"] #vvp-items-grid .vvp-item-product-title-container .a-truncate-cut {
    max-height: 5.2em !important;
  }

  body[data-vh-scale-step="xs"] #vvp-items-grid .vvp-item-product-title-container .a-truncate,
  body[data-vh-scale-step="xs"] #vvp-items-grid .vvp-item-product-title-container .a-truncate-cut {
    max-height: 5.2em !important;
  }

  #vvp-items-grid .vh-date-added {
    font-size: 11px !important;
    margin-bottom: 2px !important;
  }

  #vvp-items-grid .vh-btn-container {
    margin-top: 4px !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: stretch !important;
    gap: 8px !important;
    flex-wrap: nowrap !important;
    justify-content: center !important;
    margin-left: auto !important;
    margin-right: auto !important;
    width: fit-content !important;
  }

  #vvp-items-grid .vh-btn-container > .a-button {
    height: calc((36px * var(--vh-monitor-tile-scale, 1)) + (12px * (1 - min(1, var(--vh-monitor-tile-scale, 1))))) !important;
    border-radius: calc(18px * var(--vh-monitor-tile-scale, 1)) !important;
    outline: 1.5px solid var(--color-dropdown-border, #e0e6ef) !important;
    outline-offset: -1px !important;
  }

  #vvp-items-grid .vh-btn-container .a-button-inner,
  #vvp-items-grid .vh-btn-container .a-button-input,
  #vvp-items-grid .vh-btn-container .a-button-text {
    height: 100% !important;
  }

  #vvp-items-grid .vh-btn-container .a-button-text {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: clamp(0.72rem, calc(1rem * var(--vh-monitor-tile-scale, 1)), 1.05rem) !important;
    line-height: 1 !important;
  }

  #vvp-items-grid .vh-btn-container>.a-button {
    flex: 1 1 0 !important;
    min-width: 0 !important;
  }

  #vvp-items-grid .vh-btn-container>.a-button+.a-button {
    margin-left: 0 !important;
  }

  /* Buy Now button: accent "paintbrush" hover */
  #vvp-items-grid .vh-btn-container .vvp-buy-now-btn .a-button-inner {
    position: relative !important;
    overflow: hidden !important;
  }

  #vvp-items-grid .vh-btn-container .vvp-buy-now-btn .a-button-inner::before {
    content: "" !important;
    position: absolute !important;
    top: -1px !important;
    right: -25% !important;
    bottom: -1px !important;
    left: -25% !important;
    background: var(--tab-bg-active, var(--vine-green)) !important;
    background-image: repeating-linear-gradient(115deg,
        rgba(255, 255, 255, 0.16) 0 10px,
        rgba(255, 255, 255, 0) 10px 20px) !important;
    transform: translateX(-120%) skewX(-20deg);
    transition: transform 360ms cubic-bezier(0.2, 0, 0, 1);
    will-change: transform;
    pointer-events: none !important;
    z-index: 0;
  }

  #vvp-items-grid .vh-btn-container .vvp-buy-now-btn:hover .a-button-inner::before,
  #vvp-items-grid .vh-btn-container .vvp-buy-now-btn:focus-within .a-button-inner::before {
    transform: translateX(0) skewX(-20deg);
  }

  #vvp-items-grid .vh-btn-container .vvp-buy-now-btn .a-button-inner>* {
    position: relative !important;
    z-index: 1;
  }

  #vvp-items-grid .vh-btn-container .vvp-buy-now-btn:hover .a-button-text,
  #vvp-items-grid .vh-btn-container .vvp-buy-now-btn:focus-within .a-button-text {
    color: #fff !important;
  }

  #vvp-items-grid .vh-btn-container .vvp-buy-now-btn:hover .a-button-inner,
  #vvp-items-grid .vh-btn-container .vvp-buy-now-btn:focus-within .a-button-inner {
    border-color: var(--tab-bg-active, var(--vine-green)) !important;
  }

  @media (prefers-reduced-motion: reduce) {
    #vvp-items-grid .vh-btn-container .vvp-buy-now-btn .a-button-inner::before {
      transition: none !important;
    }
  }

  .vh-status-container,
  .vh-status-container * {
    background-color: #fff !important;
    color: #191919 !important;
  }

  .vh-status {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }

  .vh-status-container .vh-toolbar-etv {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    align-self: center !important;
    gap: 2px !important;
    width: fit-content !important;
    max-width: 72px !important;
    min-width: 0 !important;
    padding: 0 2px !important;
    white-space: nowrap !important;
    overflow: hidden !important;
  }

  /* Makes logo transparent for better theme compatibility */
  #vvp-logo-link img {
    content: url('https://i.imgur.com/diIZttP.png') !important;
    height: 80px !important;
    width: auto !important;
    object-fit: contain !important;
    background: none !important;
    box-shadow: none !important;
    border: none !important;
  }

  /* Modernized Vine Tabs */
  :root {
    --tab-bg: inherit;
    --tab-bg-active: var(--vine-green);
    --tab-text: inherit;
    --tab-text-active: #fff;
    --tab-hover-bg: rgba(0, 0, 0, 0.06);
    --scrollbar-size: 8px;
    --scrollbar-page-size: 12px;
    --scrollbar-track: #f1f1f1;
    --scrollbar-thumb: #888;
    --scrollbar-thumb-hover: #555;
    --scrollbar-track-radius: 24px;
    --scrollbar-thumb-radius: 4px;
  }

  /* If a dark theme class is present, override for dark mode */
  body.amazon-vine-dark-theme :root,
  body.dark :root {
    --tab-bg: #181a1b;
    --tab-bg-active: var(--vine-green);
    --tab-text: #e0e0e0;
    --tab-text-active: #fff;
    --tab-hover-bg: rgba(255, 255, 255, 0.08);
    --scrollbar-track: #2a2d2f;
    --scrollbar-thumb: #888;
    --scrollbar-thumb-hover: #b1b1b1;
  }

  /* Global custom scrollbars (WebKit + Firefox) */
  * {
    scrollbar-width: thin !important;
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track) !important;
  }

  *::-webkit-scrollbar {
    width: var(--scrollbar-size);
    height: var(--scrollbar-size);
  }

  *::-webkit-scrollbar-track {
    background: var(--scrollbar-track);
    border-radius: var(--scrollbar-track-radius);
  }

  *::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: var(--scrollbar-thumb-radius);
    transition: background 0.2s;
  }

  *::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover);
  }

  /* Page scrollbars: thicker than element scrollbars */
  html,
  body {
    scrollbar-width: auto !important;
  }

  html::-webkit-scrollbar,
  body::-webkit-scrollbar {
    width: var(--scrollbar-page-size);
    height: var(--scrollbar-page-size);
  }

  /* ===== MODERN STYLE (Default) ===== */
  body:not(.vvp-legacy-style) .a-tabs[data-action="a-tabs"],
  body.vvp-modern-style .a-tabs[data-action="a-tabs"] {
    display: flex !important;
    gap: 12px !important;
    justify-content: flex-start !important;
    align-items: flex-end !important;
    border-bottom: 1.5px solid #d1d5db !important;
    background: #EEF0F2 !important;
    margin: -22px calc(-50vw + 50%) 0 calc(-50vw + 50%) !important;
    padding: 0px 16px !important;
    position: relative !important;
    border-radius: 0 !important;
    width: 100vw !important;
    max-width: none !important;
    transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  /* Monitor page specific: increase upper margins to 0px */
  body[data-hash="monitor"]:not(.vvp-legacy-style) .a-tabs[data-action="a-tabs"],
  body[data-hash="monitor"].vvp-modern-style .a-tabs[data-action="a-tabs"] {
    margin: 0 calc(-50vw + 50%) 0 calc(-50vw + 50%) !important;
  }

  /* ===== LEGACY STYLE ===== */
  body.vvp-legacy-style .a-tabs[data-action="a-tabs"] {
    display: flex !important;
    gap: 12px !important;
    justify-content: flex-start !important;
    align-items: flex-end !important;
    border-bottom: 1.5px solid #d1d5db !important;
    background: #EEF0F2 !important;
    margin: 30px 0 0 0 !important;
    padding: 0 !important;
    position: relative !important;
    border-radius: 0 !important;
    transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  body .a-tabs[data-action="a-tabs"] .a-tab-heading {
    list-style: none !important;
    margin: 0 !important;
    padding: 0 !important;
    position: relative !important;
    z-index: 1;
  }

  /* ===== MODERN STYLE TABS ===== */
  body:not(.vvp-legacy-style) .a-tabs[data-action="a-tabs"] .a-tab-heading a,
  body.vvp-modern-style .a-tabs[data-action="a-tabs"] .a-tab-heading a {
    display: inline-block !important;
    padding: 12px 30px 14px 30px !important;
    border-radius: 0 !important;
    font-size: 1.13em !important;
    font-weight: 500 !important;
    color: var(--tab-text, inherit) !important;
    background: none !important;
    text-decoration: none !important;
    box-shadow: none !important;
    border: none !important;
    transition: color 0.18s, font-weight 0.18s;
    position: relative;
    top: 1.5px;
  }

  /* Modern: Underline pseudo-element for hover animation on inactive tabs */
  body:not(.vvp-legacy-style) .a-tabs[data-action="a-tabs"] .a-tab-heading:not(.a-active) a::after,
  body.vvp-modern-style .a-tabs[data-action="a-tabs"] .a-tab-heading:not(.a-active) a::after {
    content: '' !important;
    position: absolute !important;
    bottom: 0 !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 0 !important;
    height: 3px !important;
    background: var(--tab-bg-active, var(--vine-green)) !important;
    transition: width 0.3s ease !important;
  }

  body:not(.vvp-legacy-style) .a-tabs[data-action="a-tabs"] .a-tab-heading:not(.a-active) a:hover,
  body.vvp-modern-style .a-tabs[data-action="a-tabs"] .a-tab-heading:not(.a-active) a:hover {
    background: none !important;
    color: var(--tab-bg-active, var(--vine-green)) !important;
  }

  /* Modern: Hover state - reveal underline from center */
  body:not(.vvp-legacy-style) .a-tabs[data-action="a-tabs"] .a-tab-heading:not(.a-active) a:hover::after,
  body.vvp-modern-style .a-tabs[data-action="a-tabs"] .a-tab-heading:not(.a-active) a:hover::after {
    width: 80% !important;
  }

  body:not(.vvp-legacy-style) .a-tabs[data-action="a-tabs"] .a-tab-heading.a-active a,
  body.vvp-modern-style .a-tabs[data-action="a-tabs"] .a-tab-heading.a-active a {
    background: none !important;
    color: #000 !important;
    font-weight: 700 !important;
    box-shadow: none !important;
    border-bottom: none !important;
    z-index: 2;
    top: 1.5px;
  }

  /* Modern: Active tab underline indicator */
  body:not(.vvp-legacy-style) .a-tabs[data-action="a-tabs"] .a-tab-heading.a-active a::after,
  body.vvp-modern-style .a-tabs[data-action="a-tabs"] .a-tab-heading.a-active a::after {
    content: '' !important;
    position: absolute !important;
    bottom: 0 !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 80% !important;
    height: 3px !important;
    background: var(--tab-bg-active, var(--vine-green)) !important;
  }

  /* ===== LEGACY STYLE TABS ===== */
  body.vvp-legacy-style .a-tabs[data-action="a-tabs"] .a-tab-heading a {
    display: inline-block !important;
    padding: 12px 30px 14px 30px !important;
    border-radius: 0 !important;
    font-size: 1.13em !important;
    font-weight: 500 !important;
    color: var(--tab-text, inherit) !important;
    background: none !important;
    text-decoration: none !important;
    box-shadow: none !important;
    border: none !important;
    transition: background 0.18s, color 0.18s, font-weight 0.18s, box-shadow 0.18s;
    position: relative;
    top: 1.5px;
  }

  body.vvp-legacy-style .a-tabs[data-action="a-tabs"] .a-tab-heading:not(.a-active) a:hover {
    background: var(--tab-hover-bg, rgba(0, 0, 0, 0.06)) !important;
    color: var(--tab-bg-active, var(--vine-green)) !important;
  }

  body.vvp-legacy-style .a-tabs[data-action="a-tabs"] .a-tab-heading.a-active a {
    background: var(--vine-green) !important;
    color: #fff !important;
    font-weight: 700 !important;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.10);
    border-bottom: none !important;
    z-index: 2;
    top: 0;
  }

  .vvp-header-links-container {
    display: flex !important;
    flex-direction: row !important;
    justify-content: flex-end !important;
    align-items: center !important;
    gap: 18px !important;
    margin: 0 24px 0 0 !important;
    padding: 0 !important;
    list-style: none !important;
    border: none !important;
    background: none !important;
  }

  .vvp-header-links-container .vvp-header-link {
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    background: none !important;
    position: relative;
  }

  .vvp-header-links-container .vvp-header-link a {
    display: inline-block !important;
    padding: 6px 16px !important;
    border-radius: 999px !important;
    font-size: 1em !important;
    color: #225199 !important;
    background: none !important;
    text-decoration: none !important;
    font-weight: 500 !important;
    min-width: 80px !important;
    transition: background 0.16s, color 0.16s, font-weight 0.16s;
    text-align: center !important;
    font-family: inherit !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    letter-spacing: 0.01em;
  }

  .vvp-header-links-container .vvp-header-link a:hover,
  .vvp-header-links-container .vvp-header-link a:focus {
    background: rgba(0, 102, 192, 0.08) !important;
    color: #619EE7 !important;
    font-weight: 700 !important;
    text-decoration: none !important;
  }

  .vvp-header-links-container .vvp-header-link:not(:last-child)::after {
    content: none !important;
  }

  /* ===== MODERN STYLE HEADER ===== */
  body:not(.vvp-legacy-style) .a-section.vvp-header-margins,
  body.vvp-modern-style .a-section.vvp-header-margins {
    background: #EEF0F2 !important;
    margin: -16px calc(-50vw + 50%) 0 calc(-50vw + 50%) !important;
    padding: 42px 64px 24px 32px !important;
    width: 100vw !important;
    max-width: none !important;
    position: relative !important;
  }

  /* ===== LEGACY STYLE HEADER ===== */
  body.vvp-legacy-style .a-section.vvp-header-margins {
    background: none !important;
    margin: 0 !important;
    padding: 0 !important;
    width: auto !important;
    max-width: none !important;
    position: relative !important;
  }

  /* Hide Vine Help and Feedback header links */
  #vvp-vine-help-link,
  #vvp-feedback-link {
    display: none !important;
  }

  /* Restore original Orders page styles (non-table) */

  /* Main container for the Orders tab content */
  div[data-a-name="orders"] .vvp-tab-content {
    border: none !important;
    padding: 8px 4px !important;
  }

  /* Fully hide the top nav bar by default */
  #navbar,
  #nav-belt {
    position: fixed !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 10000 !important;
    width: 100% !important;
    transition: transform 0.3s ease, opacity 0.3s ease !important;
  }

  #nav-belt {
    top: 0 !important;
    height: 56px !important;
    /* Match this to your search bar's height */
    min-height: 56px !important;
    display: flex !important;
    align-items: center !important;
  }

  #nav-belt>.nav-left,
  #nav-belt>.nav-fill,
  #nav-belt>.nav-right {
    height: 100% !important;
    display: flex !important;
    align-items: center !important;
  }

  #navbar {
    top: 0 !important;
  }

  #navbar,
  #nav-belt {
    transform: translateY(-100%) !important;
    opacity: 0 !important;
  }

  #navbar.show-nav,
  #nav-belt.show-nav {
    transform: translateY(0) !important;
    opacity: 1 !important;
  }

  /* Remove nav-main from all autohide logic */
  #nav-main {
    display: none !important;
  }

  /* Add some space for fixed nav */
  body,
  #a-page {
    padding-top: 0 !important;
  }

  #navbar:focus-within,
  #nav-belt:focus-within,
  #nav-search:focus-within,
  #nav-search input:focus {
    transform: translateY(0) !important;
    opacity: 1 !important;
  }

  .navLeftFooter.nav-sprite-v1,
  .navLeftFooter.nav-sprite-v1~* {
    display: none !important;
  }

  @media (max-width: 900px) {

    /* Tab bar: allow wrapping into multiple rows */
    body .a-tabs[data-action="a-tabs"] {
      flex-wrap: wrap !important;
      overflow-x: visible !important;
      max-height: none !important;
    }
  }

  @media (max-width: 768px) {

    /* Tab bar: wrap into rows, not just scroll */
    body .a-tabs[data-action="a-tabs"] {
      flex-wrap: wrap !important;
      overflow-x: visible !important;
      max-height: none !important;
    }

    body .a-tabs[data-action="a-tabs"] .a-tab-heading a {
      min-width: 90px !important;
      white-space: normal !important;
    }

    /* Search bar: prevent squashing, allow wrapping */
    .vvp-container-search.vvp-container-right-align {
      flex-wrap: wrap !important;
      gap: 8px !important;
    }

    .vvp-container-search.vvp-container-right-align .a-search {
      min-width: 180px !important;
      flex: 1 1 180px !important;
    }

    .vvp-container-search.vvp-container-right-align input[type="search"] {
      min-width: 120px !important;
      flex: 1 1 120px !important;
    }

    .vvp-container-search #vvp-search-button.a-button-search {
      min-width: 70px !important;
      flex: 0 0 auto !important;
    }
  }

  @media (max-width: 480px) {

    /* Tab bar: wrap, reduce min-width */
    body .a-tabs[data-action="a-tabs"] {
      flex-wrap: wrap !important;
      overflow-x: visible !important;
      max-height: none !important;
    }

    body .a-tabs[data-action="a-tabs"] .a-tab-heading a {
      min-width: 70px !important;
      white-space: normal !important;
      font-size: 0.92em !important;
    }

    /* Search bar: stack vertically if needed */
    .vvp-container-search.vvp-container-right-align {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 6px !important;
    }

    .vvp-container-search.vvp-container-right-align .a-search {
      min-width: 120px !important;
      width: 100% !important;
    }

    .vvp-container-search.vvp-container-right-align input[type="search"] {
      min-width: 80px !important;
      width: 100% !important;
    }

    .vvp-container-search #vvp-search-button.a-button-search {
      min-width: 48px !important;
      width: 100% !important;
      margin-left: 0 !important;
    }
  }

  @media (max-width: 600px) {
    body .a-tabs[data-action="a-tabs"] {
      flex-wrap: wrap !important;
      justify-content: flex-start !important;
      align-items: stretch !important;
      width: 100% !important;
      min-width: 0 !important;
      margin: 8px 0 0 0 !important;
      padding: 0 2px !important;
      gap: 0 !important;
    }

    body .a-tabs[data-action="a-tabs"] .a-tab-heading {
      flex: 1 1 50% !important;
      max-width: 50% !important;
      min-width: 120px !important;
      margin-bottom: 4px !important;
      display: flex !important;
      justify-content: center !important;
    }

    body .a-tabs[data-action="a-tabs"] .a-tab-heading a {
      font-size: 0.92em !important;
      padding: 8px 2px 10px 2px !important;
      width: 100% !important;
      min-width: 0 !important;
      text-align: center !important;
      box-sizing: border-box !important;
    }
  }

  @media (max-width: 400px) {
    body {
      width: 100vw !important;
      overflow-x: hidden !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    body .a-tabs[data-action="a-tabs"] {
      width: 100vw !important;
      min-width: 0 !important;
      max-width: 100vw !important;
      box-sizing: border-box !important;
      flex-direction: column !important;
      flex-wrap: nowrap !important;
      align-items: stretch !important;
      gap: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow-x: hidden !important;
    }

    body .a-tabs[data-action="a-tabs"] .a-tab-heading {
      display: block !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      margin: 0 0 6px 0 !important;
      box-sizing: border-box !important;
    }

    body .a-tabs[data-action="a-tabs"] .a-tab-heading a {
      display: block !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      font-size: 0.88em !important;
      padding: 10px 2px !important;
      text-align: left !important;
      box-sizing: border-box !important;
      white-space: normal !important;
      word-break: break-word !important;
      overflow-x: hidden !important;
    }
  }

  /* Linked text color */
  a,
  a:link,
  a:visited {
    color: var(--vine-green) !important;
  }

  #vvp-product-details-modal--product-title {
    font-weight: bold !important;
  }


  /* Modernized: Notification Monitor for #monitor page - new DOM structure */
  body[data-hash="monitor"] #vh-notifications-monitor-header {
    background: none;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
    margin: 0;
    max-width: none;
    min-width: 0;
    font-family: inherit;
    display: block;
    flex-direction: unset;
    align-items: unset;
    position: static;
  }

  /* Main header UI container - modern card design */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui {
    background: var(--vh-bg-main, #fff) !important;
    color: var(--vh-text-main, #1a1a1a) !important;
    border-radius: 18px;
    box-shadow: var(--vh-shadow, 0 4px 20px 0 rgba(30, 60, 120, 0.15));
    padding: 20px 24px 16px 24px;
    /* Centered container that shrinks/grows to fit its contents */
    margin: 0 auto 32px auto !important;
    min-width: 320px;
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    display: block !important;
    /* Override inline display:flex - use block + width:fit-content so margin:auto centers */
    /* Internal stacks remain flex within child rows; the card itself can be block */
    position: relative;
    transform: none;
    width: fit-content !important;
    max-width: none !important;
    /* Override inline max-width: 500px that causes square collapse */
    box-sizing: border-box;
    transition: box-shadow 0.2s ease;
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui:hover {
    box-shadow: 0 6px 28px 0 rgba(30, 60, 120, 0.20);
  }



  /* Header row styling - contains icon, title, and user tier info within vh-notifications-monitor-header-ui */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-header-row {
    display: flex;
    align-items: flex-end;
    margin-top: 0;
    margin-bottom: 0;
    margin-right: 0;
    width: auto;
    /* allow container to size to content */
    gap: 10px;
    position: relative;
    z-index: 10;
    flex-wrap: wrap;
  }

  @media (max-width: 900px) {
    body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-header-row {
      margin-right: 0;
    }
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-header-row .vh-icon-48.vh-icon-vh-48 {
    flex-shrink: 0;
    margin-right: 0;
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-header-row h2 {
    font-size: 1.8rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
    letter-spacing: 0.01em;
    line-height: 1.2;
    flex-shrink: 1;
    max-width: 60%;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  @media (max-width: 900px) {
    body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-header-row h2 {
      font-size: 1.4rem;
      max-width: 100%;
    }
  }

  @media (max-width: 600px) {
    body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-header-row h2 {
      font-size: 1.2rem;
    }
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-header-row span {
    display: flex;
    align-items: flex-end;
    margin-left: auto;
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-header-row #user-tier-info {
    color: #444;
    font-size: 1em;
    margin: 0;
  }

  /* Override inline styles for status info child divs to ensure two-column layout */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui div[style*="display: flex; flex-wrap: wrap; gap: 10px; width: 100%; max-width: 600px"]>div {
    flex: none !important;
    max-width: none !important;
    min-width: none !important;
    margin-bottom: 0 !important;
  }

  /* Constrain status container to prevent overflow */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui div[style*="flex: 1 1 300px"] {
    max-width: 300px !important;
    min-width: 180px !important;
    width: 300px !important;
    flex: 0 0 300px !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }

  /* Status info div - prevent overlap with header row */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui div[style*="display: flex; flex-wrap: wrap; gap: 10px; width: 100%; max-width: 600px"] {
    margin-top: 4px;
    padding-top: 2px;
    clear: both;
    position: relative;
    z-index: 5;
    width: 100%;
    max-width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    align-items: start;
  }

  @media (max-width: 600px) {
    body[data-hash="monitor"] #vh-notifications-monitor-header-ui div[style*="display: flex; flex-wrap: wrap; gap: 10px; width: 100%; max-width: 600px"] {
      grid-template-columns: 1fr;
      gap: 15px;
    }
  }

  /* Main content area styling - 3 column grid layout */
  /* Use minmax() to ensure columns maintain minimum widths and prevent premature collapse */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"] {
    background: none !important;
    color: inherit !important;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
    margin: 0;
    max-width: 100% !important;
    min-width: 0;
    font-family: inherit;
    display: grid !important;
    /* Column 1: left stack (header + status) - flexible sizing, min 250px */
    /* Column 2: controls - flexible sizing, min 240px to prevent squashing */
    /* Column 3: filters - allow slight compression from 520px to 480px if needed */
    grid-template-columns: minmax(250px, auto) minmax(240px, auto) minmax(480px, 520px) !important;
    grid-template-rows: auto auto !important;
    gap: 12px !important;
    position: static;
    box-sizing: border-box !important;
    /* Allow inner rows to render fully (no clipping) */
    overflow: visible !important;
  }

  /* Header (title + minimize) - placed in column 1, row 1 */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"]>.vh-header-row {
    grid-column: 1 !important;
    grid-row: 1 !important;
  }

  /* Status info section - column 1, row 2 */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"]>div[style*="display: flex; flex-wrap: wrap; gap: 10px; width: 100%; max-width: 600px"] {
    grid-column: 1 !important;
    grid-row: 2 !important;
  }

  /* Controls wrapper - column 2, spans rows 1-2 */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"]>div[style*="display: flex; flex-wrap: wrap; gap: 5px; margin: 5px 0"] {
    grid-column: 2 !important;
    grid-row: 1 / 3 !important;
    min-width: 240px !important;
    /* Prevent controls from getting squashed */
    width: 100% !important;
    /* Take full column width */
  }

  /* Filters section - column 3, spans rows 1-2 */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"]>#vh-nm-filters {
    grid-column: 3 !important;
    grid-row: 1 / 3 !important;
    width: 100% !important;
    /* Take full column width */
    min-width: 480px !important;
    /* Allow slight compression from 520px if needed for 1080p */
    max-width: 520px !important;
    /* Preferred width - grid column minmax handles this */
    box-sizing: border-box !important;
    /* Ensure filters content is not clipped */
    overflow: visible !important;
    flex: none !important;
    /* Remove flex when in grid - flex doesn't work in grid */
  }

  /* Responsive: When space is tight, stack filters below, keep controls adjacent */
  /* Breakpoint at 1100px - only collapse when truly necessary (accounts for padding/gaps) */
  @media (max-width: 1100px) and (min-width: 769px) {
    body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"] {
      /* Switch to 2 columns: left stack + controls side by side, filters below */
      /* Maintain minimum widths to prevent squashing */
      grid-template-columns: minmax(250px, auto) minmax(240px, auto) !important;
      grid-template-rows: auto auto auto !important;
    }

    /* Header stays column 1, row 1 */
    body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"]>.vh-header-row {
      grid-column: 1 !important;
      grid-row: 1 !important;
    }

    /* Status stays column 1, row 2 */
    body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"]>div[style*="display: flex; flex-wrap: wrap; gap: 10px; width: 100%; max-width: 600px"] {
      grid-column: 1 !important;
      grid-row: 2 !important;
    }

    /* Controls stay column 2, spans rows 1-2 */
    body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"]>div[style*="display: flex; flex-wrap: wrap; gap: 5px; margin: 5px 0"] {
      grid-column: 2 !important;
      grid-row: 1 / 3 !important;
    }

    /* Filters move to row 3, span both columns */
    body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"]>#vh-nm-filters {
      grid-column: 1 / -1 !important;
      grid-row: 3 !important;
      margin-left: 0 !important;
    }
  }

  /* Responsive: Mobile portrait - everything stacks */
  @media (max-width: 768px) {
    body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"] {
      grid-template-columns: 1fr !important;
      grid-template-rows: auto !important;
    }

    /* Header - row 1 */
    body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"]>.vh-header-row {
      grid-column: 1 !important;
      grid-row: 1 !important;
    }

    /* Status - row 2 */
    body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"]>div[style*="display: flex; flex-wrap: wrap; gap: 10px; width: 100%; max-width: 600px"] {
      grid-column: 1 !important;
      grid-row: 2 !important;
    }

    /* Controls - row 3 */
    body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"]>div[style*="display: flex; flex-wrap: wrap; gap: 5px; margin: 5px 0"] {
      grid-column: 1 !important;
      grid-row: 3 !important;
    }

    /* Filters - row 4 */
    body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"]>#vh-nm-filters {
      grid-column: 1 !important;
      grid-row: 4 !important;
      margin-left: 0 !important;
    }
  }

  /* Date and status information styling */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh_flex_column {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui strong {
    color: var(--vh-text-main, #1a1a1a);
    font-weight: 600;
    font-size: 1em;
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui span {
    color: var(--vh-text-alt, #444);
    font-size: 1em;
  }

  /* Notice boxes styling */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .notice {
    background: var(--vh-bg-alt, #f7f8fa);
    border-radius: 8px;
    padding: 7px 14px;
    margin-bottom: 3px;
    font-size: 0.98em;
    color: var(--vh-text-main, #1a1a1a);
    display: flex;
    align-items: center;
    box-shadow: var(--vh-shadow-small, 0 1px 4px 0 rgba(30, 60, 120, 0.06));
    min-width: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }

  /* Constrain notice inner div to prevent overflow (but exclude switch) */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .notice>div:not(.vh-switch-32) {
    min-width: 0 !important;
    flex: 1 1 0% !important;
    overflow: hidden !important;
    max-width: 100% !important;
    word-wrap: normal !important;
    overflow-wrap: normal !important;
    font-weight: bold !important;
    white-space: nowrap !important;
    line-height: 1.5 !important;
  }

  /* Make description spans normal weight and ensure inline alignment */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .notice>div:not(.vh-switch-32)>span {
    font-weight: normal !important;
    display: inline !important;
    vertical-align: baseline !important;
  }

  /* Ensure switch icons maintain their original size */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-switch-32,
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .notice .vh-switch-32,
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-switch-32.vh-icon-switch-on,
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-switch-32.vh-icon-switch-off,
  body[data-hash="monitor"] #statusSW .vh-switch-32,
  body[data-hash="monitor"] #statusWS .vh-switch-32,
  body[data-hash="monitor"] .notice .vh-switch-32 {
    width: 32px !important;
    height: 32px !important;
    min-width: 32px !important;
    max-width: 32px !important;
    min-height: 32px !important;
    max-height: 32px !important;
    margin-right: 10px !important;
    flex: 0 0 32px !important;
    box-sizing: border-box !important;
    transform: scale(1) !important;
  }

  /* Override inline margin on the div containing notification monitor controls */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"]>div[style*="display: flex; flex-wrap: wrap; gap: 5px; margin: 5px 0"] {
    margin: 0 !important;
    width: auto !important;
  }

  /* Add spacing between controls and filters when side by side */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"]>#vh-nm-filters {
    margin-left: 16px !important;
  }

  /* Notification monitor controls styling */
  body[data-hash="monitor"] .vh-notification-monitor-controls {
    margin-right: 0 !important;
    margin-left: 0 !important;
    transform: none;
    display: grid;
    grid-template-columns: 7fr 6fr;
    gap: 4px;
    width: 100%;
    min-width: 240px !important;
    /* Prevent controls grid from collapsing */
  }

  /* Clear - placed in left column, first row */
  body[data-hash="monitor"] .vh-notification-monitor-controls>.vh-control-group:nth-child(1) {
    grid-column: 1;
    grid-row: 1;
    min-width: 0;
  }

  /* Fetch - placed in right column, first row */
  body[data-hash="monitor"] .vh-notification-monitor-controls>.vh-control-group:nth-child(2) {
    grid-column: 2;
    grid-row: 1;
    min-width: 0;
  }

  /* Feed control - placed in right column, second row */
  body[data-hash="monitor"] .vh-notification-monitor-controls>.vh-control-group:nth-child(3) {
    grid-column: 2;
    grid-row: 2;
    min-width: 0;
  }

  /* Auto truncate - placed in left column, second row */
  body[data-hash="monitor"] .vh-notification-monitor-controls>.vh-control-group:nth-child(4) {
    grid-column: 1;
    grid-row: 2;
    min-width: 0;
  }

  @media (max-width: 900px) {
    body[data-hash="monitor"] .vh-notification-monitor-controls {
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
  }

  @media (max-width: 600px) {
    body[data-hash="monitor"] .vh-notification-monitor-controls {
      grid-template-columns: 1fr;
    }
  }

  /* Control groups styling */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-control-group {
    background: var(--vh-bg-alt, #f7f8fa);
    border-radius: 12px;
    border: 1px solid var(--vh-border, #e0e6ef);
    padding: 8px 16px 10px 16px;
    margin-right: 2px;
    margin-bottom: 4px;
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    min-width: 0;
    max-width: none;
    box-shadow: var(--vh-shadow-small, 0 2px 8px 0 rgba(30, 60, 120, 0.08));
    transition: box-shadow 0.2s ease;
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-control-group:hover {
    box-shadow: 0 4px 16px 0 rgba(30, 60, 120, 0.12);
  }

  @media (max-width: 900px) {
    body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-control-group {
      min-width: 0;
      width: 100%;
      margin-right: 0;
    }
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-control-header {
    background: none !important;
    font-weight: bold !important;
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-control-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;
    align-items: center;
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-control-buttons label {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-control-buttons input[type="button"],
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-control-buttons input[type="checkbox"] {
    text-align: center;
  }

  /* Input and button styling */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui input[type="button"],
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui input[type="checkbox"] {
    border: 1.5px solid var(--vh-border, #e0e6ef);
    border-radius: 7px;
    background: var(--vh-bg-white, #fff);
    color: var(--vh-text-main, #1a1a1a);
    font-size: 0.98em;
    padding: 6px 14px;
    transition: border 0.18s, box-shadow 0.18s;
    outline: none;
    box-shadow: none;
    cursor: pointer;
    min-width: 0;
    box-sizing: border-box;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  /* Make "Pause & Buffer Feed" button text smaller */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui input[name="pauseFeed"],
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui input#pauseFeed {
    font-size: 0.88em;
  }

  @media (max-width: 600px) {

    body[data-hash="monitor"] #vh-notifications-monitor-header-ui input[type="button"],
    body[data-hash="monitor"] #vh-notifications-monitor-header-ui input[type="checkbox"] {
      font-size: 0.88em;
      padding: 6px 10px;
    }
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui input[type="button"]:hover {
    border-color: #5E9BE6;
    box-shadow: 0 0 0 2px #5E9BE633;
    background: #f7f8fa;
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin-right: 4px;
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui select {
    background: var(--vh-bg-white, #fff);
    border: 1.5px solid var(--vh-border, #e0e6ef);
    border-radius: 7px;
    font-size: 0.98em;
    padding: 6px 12px;
    color: var(--vh-text-main, #1a1a1a);
    outline: none;
    transition: border 0.18s, box-shadow 0.18s;
    box-shadow: none;
    margin: 0 4px 0 0;
    min-width: 70px;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui select:focus {
    border-color: #5E9BE6;
    box-shadow: 0 0 0 2px #5E9BE633;
  }

  body[data-hash="monitor"] #vh-notifications-monitor-header-ui option {
    color: #1a1a1a;
    background: #fff;
  }

  /* Tile scaling controls (+/-) in a-tabs */
  .a-tabs[data-action="a-tabs"] #vh-monitor-tile-scale-controls {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0 8px;
    list-style: none;
    background: transparent !important;
    height: 100%;
    align-self: center;
  }

  .a-tabs[data-action="a-tabs"] #vh-monitor-tile-scale-controls input[type="button"] {
    background: transparent !important;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 6px 10px;
    font-size: 22px;
    line-height: 1;
    margin: 0 3px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: auto;
  }

  .a-tabs[data-action="a-tabs"] #vh-monitor-tile-scale-controls input[type="button"]:hover:not(:disabled) {
    opacity: 0.7;
  }

  .a-tabs[data-action="a-tabs"] #vh-monitor-tile-scale-controls input[type="button"]:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  /* Tile scaling (dynamic columns + proportional spacing) - applies to all vine-items pages */
  body {
    --vh-monitor-tile-scale: 1;
    --vh-monitor-grid-min: 200px;
    --vh-monitor-grid-gap: 24px;
  }

  @media (max-width: 480px) {
    body {
      --vh-monitor-grid-min: 160px;
      --vh-monitor-grid-gap: 16px;
    }
  }

  @media (min-width: 481px) and (max-width: 768px) {
    body {
      --vh-monitor-grid-min: 180px;
      --vh-monitor-grid-gap: 20px;
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    body {
      --vh-monitor-grid-min: 200px;
      --vh-monitor-grid-gap: 24px;
    }
  }

  @media (min-width: 1025px) and (max-width: 1440px) {
    body {
      --vh-monitor-grid-min: 220px;
      --vh-monitor-grid-gap: 28px;
    }
  }

  @media (min-width: 1441px) {
    body {
      --vh-monitor-grid-min: 240px;
      --vh-monitor-grid-gap: 32px;
    }
  }

  /* Base grid rule - media queries above handle responsive scaling */
  #vvp-items-grid {
    grid-template-columns: repeat(auto-fill, minmax(calc(var(--vh-monitor-grid-min) * var(--vh-monitor-tile-scale)), 1fr)) !important;
    gap: calc(var(--vh-monitor-grid-gap) * var(--vh-monitor-tile-scale)) !important;
  }

  #vvp-items-grid .vvp-item-tile {
    border-radius: calc(18px * var(--vh-monitor-tile-scale)) !important;
    padding: calc(10px * var(--vh-monitor-tile-scale)) calc(8px * var(--vh-monitor-tile-scale)) calc(12px * var(--vh-monitor-tile-scale)) !important;
    min-height: calc(320px * var(--vh-monitor-tile-scale)) !important;
    font-size: calc(1rem * var(--vh-monitor-tile-scale)) !important;
  }

  /* Allow tile content to shrink cleanly at very small scales (e.g., 60%) */
  #vvp-items-grid .vvp-item-tile,
  #vvp-items-grid .vvp-item-tile-content {
    min-width: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  #vvp-items-grid .vvp-item-image-container,
  #vvp-items-grid .vvp-item-product-title-container,
  #vvp-items-grid .vh-btn-container {
    min-width: 0 !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  /* Keep the two action buttons from momentarily "stacking" full-width */
  #vvp-items-grid .vh-btn-container > .a-button {
    min-width: 0 !important;
    width: auto !important;
    flex: 1 1 0 !important;
    border-radius: calc(18px * var(--vh-monitor-tile-scale, 1)) !important;
    outline: 1.5px solid var(--color-dropdown-border, #e0e6ef) !important;
    outline-offset: -1px !important;
  }

  #vvp-items-grid .vvp-item-image-container,
  #vvp-items-grid .vh-img-container {
    margin-bottom: calc(8px * var(--vh-monitor-tile-scale)) !important;
  }

  #vvp-items-grid .vvp-item-tile-content {
    padding-bottom: 0 !important;
    margin-bottom: calc(-4px * var(--vh-monitor-tile-scale, 1)) !important;
  }

  #vvp-items-grid .vh-btn-container {
    margin-top: calc(6px * var(--vh-monitor-tile-scale)) !important;
  }

  /* Slightly scale button text with tile scale */
  #vvp-items-grid .vh-btn-container .vvp-details-btn .a-button-text,
  #vvp-items-grid .vh-btn-container .vvp-buy-now-btn .a-button-text {
    font-size: clamp(0.72rem, calc(1rem * var(--vh-monitor-tile-scale, 1)), 1.05rem) !important;
  }

  /* Encore/Potluck/Last Chance queues: use same scaling as monitor */
  body[data-queue="encore"]:not([data-hash="monitor"]) #vvp-items-grid .vvp-item-tile,
  body[data-queue="potluck"]:not([data-hash="monitor"]) #vvp-items-grid .vvp-item-tile,
  body[data-queue="last_chance"]:not([data-hash="monitor"]) #vvp-items-grid .vvp-item-tile {
    border-radius: calc(18px * var(--vh-monitor-tile-scale)) !important;
    padding: calc(10px * var(--vh-monitor-tile-scale)) calc(8px * var(--vh-monitor-tile-scale)) calc(12px * var(--vh-monitor-tile-scale)) !important;
    min-height: calc(320px * var(--vh-monitor-tile-scale)) !important;
    font-size: calc(1rem * var(--vh-monitor-tile-scale)) !important;
  }

  body[data-queue="encore"]:not([data-hash="monitor"]) #vvp-items-grid .vvp-item-image-container,
  body[data-queue="potluck"]:not([data-hash="monitor"]) #vvp-items-grid .vvp-item-image-container,
  body[data-queue="last_chance"]:not([data-hash="monitor"]) #vvp-items-grid .vvp-item-image-container,
  body[data-queue="encore"]:not([data-hash="monitor"]) #vvp-items-grid .vh-img-container,
  body[data-queue="potluck"]:not([data-hash="monitor"]) #vvp-items-grid .vh-img-container,
  body[data-queue="last_chance"]:not([data-hash="monitor"]) #vvp-items-grid .vh-img-container {
    margin-bottom: calc(8px * var(--vh-monitor-tile-scale)) !important;
  }

  body[data-queue="encore"]:not([data-hash="monitor"]) #vvp-items-grid .vh-btn-container,
  body[data-queue="potluck"]:not([data-hash="monitor"]) #vvp-items-grid .vh-btn-container,
  body[data-queue="last_chance"]:not([data-hash="monitor"]) #vvp-items-grid .vh-btn-container {
    margin-top: calc(6px * var(--vh-monitor-tile-scale)) !important;
  }

  /* Encore/Potluck/Last Chance: slightly scale button text with tile scale (same as monitor) */
  body[data-queue="encore"]:not([data-hash="monitor"]) #vvp-items-grid .vh-btn-container .vvp-details-btn .a-button-text,
  body[data-queue="potluck"]:not([data-hash="monitor"]) #vvp-items-grid .vh-btn-container .vvp-details-btn .a-button-text,
  body[data-queue="last_chance"]:not([data-hash="monitor"]) #vvp-items-grid .vh-btn-container .vvp-details-btn .a-button-text,
  body[data-queue="encore"]:not([data-hash="monitor"]) #vvp-items-grid .vh-btn-container .vvp-buy-now-btn .a-button-text,
  body[data-queue="potluck"]:not([data-hash="monitor"]) #vvp-items-grid .vh-btn-container .vvp-buy-now-btn .a-button-text,
  body[data-queue="last_chance"]:not([data-hash="monitor"]) #vvp-items-grid .vh-btn-container .vvp-buy-now-btn .a-button-text {
    font-size: clamp(0.72rem, calc(1rem * var(--vh-monitor-tile-scale, 1)), 1.05rem) !important;
  }

  /* Filters section styling - now within flex-grow container */
  body[data-hash="monitor"] #vh-nm-filters {
    background: var(--vh-bg-alt, #f7f8fa);
    border-radius: 14px;
    border: 1px solid var(--vh-border, #e0e6ef);
    padding: 24px 28px 18px 28px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    transform: none;
    box-shadow: var(--vh-shadow-small, 0 2px 8px 0 rgba(30, 60, 120, 0.08));
    transition: box-shadow 0.2s ease;
  }

  body[data-hash="monitor"] #vh-nm-filters:hover {
    box-shadow: 0 4px 16px 0 rgba(30, 60, 120, 0.12);
  }

  @media (max-width: 900px) {
    body[data-hash="monitor"] #vh-nm-filters {
      padding: 16px;
      margin-left: 2vw;
      margin-right: 2vw;
    }
  }

  @media (max-width: 600px) {
    body[data-hash="monitor"] #vh-nm-filters {
      padding: 12px;
    }
  }

  /* Filters grid layout - modified to place labels beside controls */
  body[data-hash="monitor"] #vh-nm-filters>div[style*="display: grid"] {
    display: grid !important;
    grid-template-columns: auto 1fr !important;
    align-items: center !important;
    gap: 8px 12px !important;
  }

  body[data-hash="monitor"] #vh-nm-filters>div[style*="display: flex"] {
    display: flex !important;
    flex-direction: column;
    gap: 10px 0 !important;
  }

  body[data-hash="monitor"] #vh-nm-filters label,
  body[data-hash="monitor"] #vh-nm-filters select,
  body[data-hash="monitor"] #vh-nm-filters input[type="text"] {
    white-space: nowrap !important;
  }

  body[data-hash="monitor"] #vh-nm-filters label {
    display: inline-flex !important;
    align-items: center !important;
    min-width: 90px;
    margin-bottom: 0 !important;
    justify-self: start !important;
    margin-top: 0 !important;
  }

  body[data-hash="monitor"] #vh-nm-filters label+* {
    display: inline-flex !important;
    align-items: center !important;
    width: 100%;
  }

  /* Input and select styling in filters */
  body[data-hash="monitor"] #vh-nm-filters input[type="text"],
  body[data-hash="monitor"] #vh-nm-filters select {
    min-height: 44px !important;
    padding-top: 10px !important;
    padding-bottom: 10px !important;
    font-size: 1.08em !important;
    box-sizing: border-box !important;
    max-width: 100% !important;
    min-width: 0 !important;
  }

  /* Fall back to full width on small screens */
  @media (max-width: 720px) {
    body[data-hash="monitor"] #vh-nm-filters {
      flex: 1 1 100% !important;
      width: 100% !important;
      max-width: 100% !important;
    }
  }

  /* Ensure filter wrapper respects boundaries */
  body[data-hash="monitor"] #vh-nm-filters>div[style*="display: grid"] {
    max-width: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }

  body[data-hash="monitor"] #vh-nm-filters label+* {
    max-width: 100% !important;
    min-width: 0 !important;
  }

  /* Tile size container styling */
  body[data-hash="monitor"] #vh-nm-tile-size-container {
    margin-top: 16px;
  }

  body[data-hash="monitor"] #vh-nm-tile-size-container #openTileSizeTool {
    background: var(--vh-bg-alt, #f7f8fa);
    border: 1.5px solid var(--vh-border, #e0e6ef);
    border-radius: 7px;
    padding: 8px 16px;
    color: var(--vh-text-main, #1a1a1a);
    text-decoration: none;
    transition: border 0.18s, box-shadow 0.18s;
    display: inline-block;
  }

  body[data-hash="monitor"] #vh-nm-tile-size-container #openTileSizeTool:hover {
    border-color: #5E9BE6;
    box-shadow: 0 0 0 2px #5E9BE633;
    background: #fff;
  }

  body[data-hash="monitor"] #vh-nm-tile-size-container #tileSizeTool {
    background: var(--vh-bg-alt, #f7f8fa);
    border: 1.5px solid var(--vh-border, #e0e6ef);
    border-radius: 7px;
    padding: 12px 16px;
    margin-top: 8px;
  }

  body[data-hash="monitor"] #vh-nm-tile-size-container #tileSizeTool label {
    display: block;
    margin-bottom: 8px;
    font-size: 0.98em;
    color: #1a1a1a;
  }

  body[data-hash="monitor"] #vh-nm-tile-size-container #tileSizeTool input[type="range"] {
    width: 100%;
    margin: 4px 0;
  }

  body[data-hash="monitor"] #vh-nm-tile-size-container #tileSizeTool a {
    color: #5E9BE6;
    text-decoration: none;
    font-size: 0.98em;
  }

  body[data-hash="monitor"] #vh-nm-tile-size-container #tileSizeTool a:hover {
    text-decoration: underline;
  }

  /* Fixed toolbar styling */
  body[data-hash="monitor"] #fixed-toolbar {
    background: var(--vh-bg-main, #fff) !important;
    color: var(--vh-text-main, #1a1a1a) !important;
    border-radius: 12px;
    box-shadow: var(--vh-shadow, 0 4px 16px 0 rgba(30, 60, 120, 0.15));
    padding: 12px 16px;
    border: 1.5px solid var(--vh-border, #e0e6ef);
  }

  body[data-hash="monitor"] #fixed-toolbar input[type="button"] {
    border: 1.5px solid var(--vh-border, #e0e6ef);
    border-radius: 7px;
    background: var(--vh-bg-white, #fff);
    color: var(--vh-text-main, #1a1a1a);
    font-size: 0.98em;
    padding: 6px 14px;
    transition: border 0.18s, box-shadow 0.18s;
    outline: none;
    box-shadow: none;
    cursor: pointer;
  }

  body[data-hash="monitor"] #fixed-toolbar input[type="button"]:hover {
    border-color: #5E9BE6;
    box-shadow: 0 0 0 2px #5E9BE633;
    background: #f7f8fa;
  }

  /* Vine Helper notifications */
  .vh-notification-box {
    background: var(--vh-bg-main, #fff) !important;
    color: var(--vh-text-main, #1a1a1a) !important;
    border: 1px solid var(--vh-border, #e0e6ef) !important;
    border-radius: 14px !important;
    box-shadow: var(--vh-shadow, 0 4px 16px rgba(30, 60, 120, 0.10)) !important;
    overflow: hidden !important;
  }

  .vh-notification-box .vh-notification-container {
    background: transparent !important;
    color: inherit !important;
    border: none !important;
    border-radius: inherit !important;
    box-shadow: inset 0 0 0 1px var(--vh-border, #e0e6ef) !important;
    overflow: hidden !important;
  }

  .vh-notification-box .vh-notification-toolbar {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    padding: 10px 12px !important;
    background: var(--vh-bg-alt, #f7f8fa) !important;
    border-bottom: 1px solid var(--vh-border, #e0e6ef) !important;
  }

  .vh-notification-box .vh-notification-toggle {
    opacity: 0.9 !important;
  }

  .vh-notification-box .vh-notification-title {
    font-weight: 600 !important;
    color: inherit !important;
  }

  .vh-notification-box .vh-notification-close {
    margin-left: auto !important;
    font-size: 0.92em !important;
    color: #6b7280 !important;
  }

  .vh-notification-box .vh-notification-close a {
    color: var(--tab-bg-active, #659C43) !important;
    text-decoration: none !important;
  }

  .vh-notification-box .vh-notification-close a:hover,
  .vh-notification-box .vh-notification-close a:focus {
    text-decoration: underline !important;
  }

  .vh-notification-box .vh-notification-content {
    padding: 10px 12px 12px !important;
    color: #374151 !important;
    line-height: 1.4 !important;
    max-width: 100% !important;
    min-width: 0 !important;
    white-space: normal !important;
    overflow-wrap: anywhere !important;
    word-break: break-word !important;
  }

  body.amazon-vine-dark-theme .vh-notification-box .vh-notification-container,
  body.dark .vh-notification-box .vh-notification-container {
    box-shadow: inset 0 0 0 1px #2a2d2f !important;
  }

  body.amazon-vine-dark-theme .vh-notification-box,
  body.dark .vh-notification-box {
    background: #181a1b !important;
    color: #e0e0e0 !important;
    border-color: #2a2d2f !important;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35) !important;
  }

  body.amazon-vine-dark-theme .vh-notification-box .vh-notification-toolbar,
  body.dark .vh-notification-box .vh-notification-toolbar {
    background: #1c1f21 !important;
    border-bottom-color: #2a2d2f !important;
  }

  body.amazon-vine-dark-theme .vh-notification-box .vh-notification-toggle,
  body.dark .vh-notification-box .vh-notification-toggle {
    filter: invert(1) brightness(1.05) !important;
  }

  body.amazon-vine-dark-theme .vh-notification-box .vh-notification-close,
  body.dark .vh-notification-box .vh-notification-close {
    color: #a1a1a1 !important;
  }

  body.amazon-vine-dark-theme .vh-notification-box .vh-notification-content,
  body.dark .vh-notification-box .vh-notification-content {
    color: #d5d5d5 !important;
  }

  /* Remove background and color from .a-section.vvp-tab-content for #monitor */
  body[data-hash="monitor"] .a-section.vvp-tab-content {
    background: unset !important;
    color: unset !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }

  /* Ensure all text inherits the card colors */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui *,
  body[data-hash="monitor"] #vh-nm-filters * {
    color: inherit;
  }

  /* Prevent text overflow and ensure proper wrapping for all elements in monitor header */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui * {
    box-sizing: border-box;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  /* Exception: status container should not wrap text */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui div[style*="flex: 1 1 300px"],
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui div[style*="flex: 1 1 300px"] * {
    word-wrap: normal !important;
    overflow-wrap: normal !important;
  }

  /* Ensure spans and small text elements wrap properly */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui span,
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh_flex_column span {
    display: inline-block;
    max-width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  /* Exception: descriptionSW and descriptionWS should not wrap */
  body[data-hash="monitor"] #descriptionSW,
  body[data-hash="monitor"] #descriptionWS {
    word-wrap: normal !important;
    overflow-wrap: normal !important;
  }

  /* Truncate descriptionSW and descriptionWS text to prevent stretching */
  body[data-hash="monitor"] #descriptionSW,
  body[data-hash="monitor"] #descriptionWS {
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    max-width: 100% !important;
    display: inline-block !important;
    min-width: 0 !important;
    word-wrap: normal !important;
    overflow-wrap: normal !important;
    word-break: normal !important;
  }

  /* --- Modern Table Design for Reviews and Orders --- */

  /* Table container (applies to the parent of the table if possible) */
  div[data-a-name="vine-reviews"] .a-section.vvp-tab-content,
  div[data-a-name="orders"] .a-section.vvp-tab-content {
    background: #f6f8fa;
    border-radius: 16px !important;
    /* Modern shadow for table container */
    box-shadow: 0 2px 12px 0 rgba(30, 60, 120, 0.10), 0 4px 24px 0 rgba(30, 60, 120, 0.13) !important;
    padding: 0 !important;
    margin: 24px 0 !important;
    overflow: hidden !important;
  }

  /* Table header row */
  div[data-a-name="vine-reviews"] .vvp-reviews-table--heading-top,
  div[data-a-name="orders"] .vvp-orders-table--heading-top {
    display: flex !important;
    align-items: center !important;
    background: var(--tab-bg-active, #659C43) !important;
    color: var(--tab-text-active, #fff) !important;
    padding: 24px 32px 12px 32px !important;
    border-top-left-radius: 16px !important;
    border-top-right-radius: 16px !important;
    font-size: 1.3em !important;
    font-weight: 700 !important;
    gap: 64px !important;
    padding-top: 36px !important;
    padding-bottom: 24px !important;
    /* Modern shadow for table header row */
    box-shadow: 0 4px 24px 0 rgba(30, 60, 120, 0.13) !important;
    animation: fadeIn 0.5s ease-out 0.15s backwards !important;
  }

  div[data-a-name="vine-reviews"] .vvp-reviews-table--heading-top h3,
  div[data-a-name="orders"] .vvp-orders-table--heading-top h3 {
    font-size: 1.2em !important;
    font-weight: 700 !important;
    margin: 0 !important;
  }

  /* Action buttons in header */
  div[data-a-name="vine-reviews"] .vvp-reviews-table--heading-top .a-button,
  div[data-a-name="orders"] .vvp-orders-table--heading-top .a-button {
    background: var(--tab-bg-active, #659C43) !important;
    color: var(--tab-text-active, #fff) !important;
    border: none !important;
    border-radius: 999px !important;
    padding: 8px 24px !important;
    font-size: 1em !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: background 0.18s;
    margin-left: 12px !important;
  }

  div[data-a-name="vine-reviews"] .vvp-reviews-table--heading-top .a-button:hover,
  div[data-a-name="orders"] .vvp-orders-table--heading-top .a-button:hover {
    background: var(--tab-hover-bg, #619EE7) !important;
    color: var(--tab-bg-active, #659C43) !important;
  }

  /* Table itself */
  div[data-a-name="vine-reviews"] .vvp-reviews-table,
  div[data-a-name="orders"] .vvp-orders-table {
    width: 100% !important;
    border-collapse: separate !important;
    border-spacing: 0 12px !important;
    background: none !important;
    margin: 0 !important;
    padding: 0 32px 24px 32px !important;
    animation: fadeIn 0.5s ease-out 0.1s backwards !important;
  }

  /* Table header cells */
  div[data-a-name="vine-reviews"] .vvp-reviews-table th,
  div[data-a-name="orders"] .vvp-orders-table th {
    color: #b3d0f7 !important;
    background: none !important;
    font-weight: 600 !important;
    font-size: 1em !important;
    letter-spacing: 0.01em !important;
    box-shadow: none !important;
    border: none !important;
    padding: 18px 20px !important;
    text-align: left !important;
    animation: fadeIn 0.5s ease-out 0.2s backwards !important;
  }

  /* Table body cells */
  div[data-a-name="vine-reviews"] .vvp-reviews-table td,
  div[data-a-name="orders"] .vvp-orders-table td {
    background: #fff !important;
    border: none !important;
    padding: 18px 20px !important;
    font-size: 1em !important;
    text-align: left !important;
    vertical-align: middle !important;
    border-radius: 12px !important;
    box-shadow: 0 1px 4px 0 rgba(30, 60, 120, 0.06) !important;
  }

  /* Selected row */
  div[data-a-name="vine-reviews"] .vvp-reviews-table tr.selected td,
  div[data-a-name="orders"] .vvp-orders-table tr.selected td {
    background: #eaf3fc !important;
  }

  /* Pill label for type */
  div[data-a-name="vine-reviews"] .vvp-reviews-table .vvp-pill,
  div[data-a-name="orders"] .vvp-orders-table .vvp-pill {
    display: inline-block !important;
    background: #eaf3fc !important;
    color: #4a5a6a !important;
    border-radius: 999px !important;
    padding: 6px 18px !important;
    font-size: 0.98em !important;
    font-weight: 500 !important;
  }

  /* Checkbox styling */
  div[data-a-name="vine-reviews"] .vvp-reviews-table input[type="checkbox"],
  div[data-a-name="orders"] .vvp-orders-table input[type="checkbox"] {
    accent-color: var(--tab-bg-active, #659C43) !important;
    width: 20px !important;
    height: 20px !important;
  }

  /* Make reviews and orders table heading rows less tall and uncolored (increased specificity) */
  div[data-a-name="vine-reviews"] .vvp-reviews-table tr.vvp-reviews-table--heading-row,
  div[data-a-name="vine-reviews"] .vvp-reviews-table tr.vvp-reviews-table--heading-row th,
  div[data-a-name="orders"] .vvp-orders-table tr.vvp-orders-table--heading-row,
  div[data-a-name="orders"] .vvp-orders-table tr.vvp-orders-table--heading-row th {
    background: none !important;
    color: inherit !important;
  }

  /* Modern export button container and buttons */
  .vine-export-btn-container {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .vine-export-btn-container .vine-export-btn {
    background: #f5f6fa;
    color: #222;
    border: none;
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 0.92em;
    font-weight: 600;
    box-shadow: 0 1px 4px 0 rgba(30, 60, 120, 0.08);
    cursor: pointer;
    transition: background 0.18s, color 0.18s, box-shadow 0.18s;
    outline: none;
    letter-spacing: 0.01em;
    display: inline-flex;
    align-items: center;
  }

  .vine-export-btn-container .vine-export-btn:hover:not(:disabled) {
    background: #ececec;
    color: #111;
    box-shadow: 0 2px 8px 0 rgba(30, 60, 120, 0.13);
  }

  .vine-export-btn-container .vine-export-btn:active:not(:disabled) {
    background: #e0e0e0;
    color: #000;
  }

  .vine-export-btn-container .vine-export-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  /* Modernized: Account Page Boxes - match notification monitor card */
  .vvp-account-box {
    border-radius: 18px !important;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.10) !important;
    outline: none !important;
    transition: box-shadow 0.28s cubic-bezier(0.4, 0.0, 0.2, 1), transform 0.28s cubic-bezier(0.4, 0.0, 0.2, 1);
  }

  /* =============================
     Center Floating Card
     ============================= */

  .vvp-account-box:hover,
  .vvp-account-box:focus,
  .vvp-account-box:active {
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.18) !important;
    outline: none !important;
    transform: translateY(-2px) scale(1.025);
  }

  .vvp-learning-resource-container {
    border-radius: 18px !important;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.10) !important;
    outline: none !important;
    transition: box-shadow 0.28s cubic-bezier(0.4, 0.0, 0.2, 1), transform 0.28s cubic-bezier(0.4, 0.0, 0.2, 1);
  }

  .vvp-learning-resource-container:hover,
  .vvp-learning-resource-container:focus,
  .vvp-learning-resource-container:active {
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.18) !important;
    outline: none !important;
    transform: translateY(-2px) scale(1.025);
  }

  #vvp-resources-page {
    animation: fadeIn 0.5s ease-out 0.1s backwards !important;
  }

  #vvp-account-dashboard {
    animation: fadeIn 0.5s ease-out 0.1s backwards !important;
  }

  .a-section.vvp-items-button-and-search-container {
    margin-bottom: -40px !important;
  }

  /* === SEARCH AUTOCOMPLETE DROPDOWN STYLING === */
  #vine-search-autocomplete-dropdown {
    /* Width is set dynamically by JavaScript to match search bar */
    border-radius: 24px !important;
  }

  .vine-autocomplete-item {
    min-height: 50px !important;
    padding: 8px 12px !important;
  }

  .vine-autocomplete-item:last-child {
    border-bottom: none !important;
  }

  /* Custom scrollbar for autocomplete dropdown */
  #vine-search-autocomplete-dropdown::-webkit-scrollbar {
    width: var(--scrollbar-size);
    height: var(--scrollbar-size);
  }

  #vine-search-autocomplete-dropdown::-webkit-scrollbar-track {
    background: var(--scrollbar-track);
    border-radius: var(--scrollbar-track-radius);
  }

  #vine-search-autocomplete-dropdown::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: var(--scrollbar-thumb-radius);
    transition: background 0.2s;
  }

  #vine-search-autocomplete-dropdown::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover);
  }

  /* Firefox scrollbar */
  #vine-search-autocomplete-dropdown {
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
  }

  /* === Encore Consent Button Styling === */
  .vine-encore-consent-btn {
    background: var(--vh-bg-white, #fff) !important;
    color: var(--vh-text-main, #1a1a1a) !important;
    border: 1.5px solid var(--vh-border, #e0e6ef) !important;
    border-radius: 12px !important;
    padding: 12px 20px !important;
    font-size: 0.98em !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.18s ease !important;
    box-shadow: var(--vh-shadow-small, 0 2px 8px 0 rgba(30, 60, 120, 0.10)) !important;
    outline: none !important;
    letter-spacing: 0.01em !important;
    min-width: 180px !important;
  }

  .vine-encore-consent-btn:hover {
    background: #f7f8fa !important;
    border-color: #5E9BE6 !important;
    box-shadow: 0 4px 16px 0 rgba(30, 60, 120, 0.15) !important;
    transform: translateY(-1px) !important;
  }

  .vine-encore-consent-btn:active {
    background: #eaf3fc !important;
    border-color: #4a8bd6 !important;
    box-shadow: 0 2px 4px 0 rgba(30, 60, 120, 0.20) !important;
    transform: translateY(0) !important;
  }

  .vine-encore-consent-btn:focus {
    border-color: #5E9BE6 !important;
    box-shadow: 0 0 0 3px rgba(94, 155, 230, 0.20) !important;
  }

  /* Close prior grouping block if left open by upstream sections */
/* ===== THEME TOGGLE DROPDOWN UI ===== */
#vvp-theme-toggle-container {
  position: relative;
  display: inline-block;
  margin-left: auto;
}

#vvp-theme-toggle-btn {
  background: none !important;
  border: none !important;
  cursor: pointer !important;
  padding: 8px 12px !important;
  display: flex !important;
  align-items: center !important;
  color: #666 !important;
  font-size: 18px !important;
  transition: color 0.2s !important;
}

#vvp-theme-toggle-btn:hover {
  color: #659C43 !important;
}

#vvp-theme-toggle-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  min-width: 160px;
  display: none;
  z-index: 10000;
}

#vvp-theme-toggle-dropdown.show {
  display: block !important;
}

#vvp-theme-toggle-dropdown .theme-option {
  padding: 10px 20px !important;
  cursor: pointer !important;
  display: block !important;
  color: #222 !important;
  font-size: 14px !important;
  transition: background 0.2s !important;
  border: none !important;
  background: none !important;
  width: 100% !important;
  text-align: left !important;
}

#vvp-theme-toggle-dropdown .theme-option:hover {
  background: #f5f7fa !important;
}

#vvp-theme-toggle-dropdown .theme-option.active {
  background: #eaf3fc !important;
  color: #659C43 !important;
  font-weight: 600 !important;
}

#vvp-theme-toggle-dropdown .theme-option .checkmark {
  float: right;
  color: #659C43;
  font-weight: bold;
  display: none;
}

#vvp-theme-toggle-dropdown .theme-option.active .checkmark {
  display: block;
}

/* Hide specific elements on Vine pages */
#a-page>div.a-container.vvp-body>div.a-tab-container.vvp-tab-set-container>div:nth-child(2)>div>div.a-section.vvp-tab-content>div.a-section.vvp-no-offers-msg {
  display: none !important;
}

#bookmark {
  display: none !important;
}

/* Latest Changes Summary:
      * - Replaced filled background active tab indicators with bolded underline indicators for both vvp-items-button (filter tabs) and a-tabs (main navigation tabs)
      * - Changed active tab text color from white to black for better contrast
      * - Added smooth center-reveal hover animations for underline indicators (0.3s ease transition)
      * - Removed button-like outlines and borders from filter tab buttons for cleaner appearance
      * - Added hiding rules for specific elements on Vine pages
      */
/* === Monitor Backup/Restore UI (Light/Modern) === */


/* Monitor backup panel trigger styling â€” thin invisible strip at card bottom */
#monitor-backup-panel-trigger {
  position: absolute !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  height: 18px !important;
  /* strip height (slightly taller hitbox) */
  pointer-events: none !important;
  /* let the button receive events */
}

#backup-expand-btn {
  position: absolute !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 18px !important;
  /* interactive area (slightly taller hitbox) */
  background: transparent !important;
  border: none !important;
  outline: none !important;
  cursor: pointer !important;
  padding: 0 !important;
  pointer-events: auto !important;
}

/* Upward-only glow using a blurred gradient pseudo-element */
#backup-expand-btn::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 18px;
  /* slightly tighter reach to reduce diffusion */
  /* Greyscale upward gradient to read as an inward shadow instead of a colored glow */
  background: linear-gradient(to top,
      rgba(0, 0, 0, 0.18) 0%,
      rgba(0, 0, 0, 0.12) 35%,
      rgba(0, 0, 0, 0.05) 65%,
      rgba(0, 0, 0, 0.00) 100%);
  filter: blur(6px);
  opacity: 0;
  transition: opacity 220ms ease;
  pointer-events: none;
}

/* Bright glow while actively hovering */
#backup-expand-btn.hovering::before,
#backup-expand-btn:hover::before {
  opacity: 1;
}

/* Persist subtle glow when expanded and not hovered */
#backup-expand-btn.expanded::before {
  opacity: 0.32;
}

/* When expanded AND hovered, be fully bright */
#backup-expand-btn.expanded.hovering::before,
#backup-expand-btn.expanded:hover::before {
  opacity: 1;
}

/* Smooth expand/collapse animation for backup panel - like window blinds */
#monitor-backup-panel-content {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transform: translateY(-4px);
  transition: max-height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  margin-top: 0 !important;
  pointer-events: none;
  width: 100% !important;
  will-change: max-height, opacity, transform;
  contain: layout style paint;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

#monitor-backup-panel-content:not(.collapsed) {
  max-height: 500px !important;
  /* Large enough to accommodate content */
  opacity: 1 !important;
  transform: translateY(0);
  margin-top: 6px !important;
  pointer-events: auto !important;
}

#monitor-backup-panel-content.collapsed {
  max-height: 0 !important;
  opacity: 0 !important;
  transform: translateY(-4px) !important;
  margin-top: 0 !important;
  pointer-events: none !important;
}

/* Monitor Backup/Restore UI Theming - Custom button styling */
#monitor-backup-panel-content .backup-management-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px;
  background: var(--vh-bg-alt, #f8f9fa);
  border-radius: 12px;
  border: 1px solid var(--vh-border, #e0e6ef);
  box-shadow: var(--vh-shadow-small, 0 2px 8px 0 rgba(30, 60, 120, 0.08));
  transition: box-shadow 0.2s ease;
}

#monitor-backup-panel-content .backup-auto-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-height: 40px;
}

#monitor-backup-panel-content .backup-management-section:hover {
  box-shadow: var(--vh-shadow, 0 4px 16px 0 rgba(30, 60, 120, 0.12));
}

/* Custom backup buttons - no Amazon classes */
.vine-backup-btn {
  background: var(--vh-bg-white, #fff);
  border: 1.5px solid var(--vh-border, #e0e6ef);
  border-radius: 8px;
  box-shadow: var(--vh-shadow-small, 0 1px 3px 0 rgba(30, 60, 120, 0.08));
  transition: all 0.18s ease;
  padding: 0;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  min-height: 36px;
}

.vine-backup-btn:hover {
  border-color: var(--vh-accent, #5E9BE6);
  box-shadow: 0 0 0 3px var(--vh-accent-glow, rgba(94, 155, 230, 0.15)), var(--vh-shadow, 0 2px 8px 0 rgba(30, 60, 120, 0.12));
  background: var(--vh-bg-alt, #f7f8fa);
  transform: translateY(-1px);
}

.vine-backup-btn:focus {
  border-color: #5E9BE6;
  box-shadow: 0 0 0 3px rgba(94, 155, 230, 0.20);
  outline: none;
}

.vine-backup-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px 0 rgba(30, 60, 120, 0.15);
}

.vine-backup-btn-text {
  color: var(--vh-text-main, #1a1a1a);
  font-size: 0.95em;
  font-weight: 500;
  padding: 8px 16px;
  letter-spacing: 0.01em;
  text-decoration: none;
  white-space: nowrap;
}

/* Input styling - match modernized input theming */
#monitor-backup-panel-content input[type="number"] {
  border: 1.5px solid var(--vh-border, #e0e6ef) !important;
  border-radius: 8px !important;
  background: var(--vh-bg-white, #fff) !important;
  color: var(--vh-text-main, #1a1a1a) !important;
  font-size: 0.95em !important;
  padding: 8px 12px !important;
  transition: border 0.18s ease, box-shadow 0.18s ease !important;
  outline: none !important;
  box-shadow: none !important;
  min-width: 60px !important;
  text-align: center !important;
}

#monitor-backup-panel-content input[type="number"]:focus {
  border-color: var(--vh-accent, #5E9BE6) !important;
  box-shadow: 0 0 0 3px var(--vh-accent-glow, rgba(94, 155, 230, 0.15)) !important;
}

#monitor-backup-panel-content input[type="number"]:hover {
  border-color: var(--vh-accent, #5E9BE6) !important;
}

/* Checkbox styling - match modernized checkbox theming */
#monitor-backup-panel-content input[type="checkbox"] {
  width: 18px !important;
  height: 18px !important;
  border: 1.5px solid var(--vh-border, #e0e6ef) !important;
  border-radius: 0 !important;
  background: var(--vh-bg-white, #fff) !important;
  cursor: pointer !important;
  transition: border 0.18s ease, box-shadow 0.18s ease !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  -o-appearance: none !important;
  position: relative !important;
  margin: 0 !important;
  padding: 0 !important;
  outline: none !important;
  box-sizing: border-box !important;
}

#monitor-backup-panel-content input[type="checkbox"]:checked {
  background: var(--vh-accent, #5E9BE6) !important;
  border-color: var(--vh-accent, #5E9BE6) !important;
}

#monitor-backup-panel-content input[type="checkbox"]:checked::after {
  content: 'âœ“' !important;
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  color: #fff !important;
  font-size: 12px !important;
  font-weight: bold !important;
}

#monitor-backup-panel-content input[type="checkbox"]:hover {
  border-color: var(--vh-accent, #5E9BE6) !important;
  box-shadow: 0 0 0 2px var(--vh-accent-glow, rgba(94, 155, 230, 0.15)) !important;
}

#monitor-backup-panel-content input[type="checkbox"]:focus {
  border-color: var(--vh-accent, #5E9BE6) !important;
  box-shadow: 0 0 0 3px var(--vh-accent-glow-strong, rgba(94, 155, 230, 0.20)) !important;
}

/* Label styling */
#monitor-backup-panel-content .backup-toggle-label,
#monitor-backup-panel-content .backup-input-label {
  display: inline-flex;
  align-items: center !important;
  gap: 6px !important;
  font-size: 0.95em !important;
  font-weight: 500 !important;
  color: var(--vh-text-main, #1a1a1a) !important;
  margin: 0 !important;
  white-space: nowrap !important;
  line-height: 18px !important;
  vertical-align: middle !important;
}

#monitor-backup-panel-content .backup-toggle-label span,
#monitor-backup-panel-content .backup-input-label {
  color: var(--vh-text-alt, #444) !important;
  font-weight: 400 !important;
}

/* Status message styling */
#monitor-backup-panel-content #backup-status-message {
  font-size: 0.9em !important;
  font-weight: 500 !important;
  padding: 6px 12px !important;
  border-radius: 6px !important;
  margin-left: auto !important;
  transition: opacity 0.3s ease !important;
  white-space: nowrap !important;
}

/* Ensure buttons are not clickable when panel is collapsed */
#monitor-backup-panel-content.collapsed .vine-backup-btn,
#monitor-backup-panel-content.collapsed input[type="checkbox"],
#monitor-backup-panel-content.collapsed input[type="number"],
#monitor-backup-panel-content.collapsed label {
  pointer-events: none !important;
  cursor: default !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  #monitor-backup-panel-content .backup-management-section {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 10px !important;
    padding: 12px !important;
  }

  #monitor-backup-panel-content .backup-action-btn.a-button .a-button-text,
  #monitor-backup-panel-content .import-btn-label .a-button-text {
    font-size: 0.9em !important;
    padding: 10px 14px !important;
  }

  #monitor-backup-panel-content input[type="number"] {
    flex: 1 !important;
    min-width: 50px !important;
  }

  #monitor-backup-panel-content #backup-status-message {
    margin-left: 0 !important;
    margin-top: 8px !important;
    text-align: center !important;
    white-space: normal !important;
  }

  /* ============================ */
  /* Notifications Monitor tweaks */
  /* ============================ */

  /* 2) Tighten control groups in monitor controls */
  #vh-notification-monitor-controls .vh-control-group,
  #vh-nm-filters .vh-control-group {
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
    /* tighter gap */
    margin-right: 10px !important;
    /* less spacing between groups */
  }

  #vh-nm-filters .vh-control-group>label,
  #vh-notification-monitor-controls .vh-control-group>label {
    margin-right: 6px !important;
    min-width: auto !important;
    /* avoid overâ€‘wide labels */
  }

  #vh-nm-filters .vh-control-group input,
  #vh-nm-filters .vh-control-group select,
  #vh-notification-monitor-controls .vh-control-group input,
  #vh-notification-monitor-controls .vh-control-group select {
    min-width: 0 !important;
    /* allow controls to shrink */
  }

  /* 3) Keep filters a fixed, narrow width on large screens (avoid elongation) */
  /* Note: When filters are in grid (grid column 3), the grid rule above handles sizing */
  /* This rule applies flex/width only when filters are NOT in grid context */
  #vh-nm-filters {
    margin-left: auto !important;
    flex: 0 0 520px !important;
    width: 520px !important;
    max-width: 520px !important;
    min-width: 480px !important;
    /* Allow slight compression when in tight spaces */
  }

  /* Header container: adapt to content (shrink/grow) and center */
  /* Match sleek theme - use same specificity (no body[data-hash] selector) */
  /* Override inline styles: display:flex and max-width:500px that cause square collapse */
  #vh-notifications-monitor-header-ui {
    display: block !important;
    /* Override inline display:flex */
    width: fit-content !important;
    /* shrink when items disappear */
    max-width: none !important;
    /* Override inline max-width: 500px - allow natural expansion */
    margin: 0 auto 32px auto !important;
    /* center the header card */
  }

  /* On small screens, allow full width for usability */
  @media (max-width: 720px) {
    #vh-notifications-monitor-header-ui {
      max-width: 100% !important;
      /* Don't exceed viewport on small screens */
    }
  }

  /* Prevent children from forcing the header to stretch full width */
  /* 1) Neutralize the left stack wrapper that has inline flex-grow:1 */
  /* Match sleek theme exactly - use same specificity (no body[data-hash] selector) */
  #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"] {
    flex: 0 1 auto !important;
    width: auto !important;
    max-width: none !important;
  }

  /* 2) The inline-styled status block with width:100% should not expand the card */
  #vh-notifications-monitor-header-ui div[style*="display: flex"][style*="width: 100%"][style*="max-width: 600px"] {
    width: auto !important;
    max-width: 600px !important;
    flex: 0 1 auto !important;
  }

  /* Small screens: use full width for usability */
  @media (max-width: 720px) {
    #vh-notifications-monitor-header-ui {
      display: flex !important;
      width: 100% !important;
      max-width: 100% !important;
    }

    /* On small screens, allow the left stack to fill width naturally */
    #vh-notifications-monitor-header-ui>div[style*="flex-grow: 1"],
    #vh-notifications-monitor-header-ui div[style*="display: flex"][style*="width: 100%"][style*="max-width: 600px"] {
      flex: 1 1 100% !important;
      width: 100% !important;
      max-width: 100% !important;
    }
  }

  /* 5) Header row max width to accommodate expand btn on the right */
  body[data-hash="monitor"] #vh-notifications-monitor-header-ui .vh-header-row {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    max-width: 500px !important;
    /* around 500px */
  }

  #vh-notifications-monitor-header-ui .vh-header-row #monitor-backup-panel-trigger {
    margin-left: auto !important;
  }

  /* 4) Align Import Backup label with other buttons (fallback to complement JS) */
  #monitor-backup-panel-content .backup-buttons-group .import-btn-label {
    display: inline-flex !important;
    align-items: center !important;
  }
}

/* --- Monitor Header Minimize Feature --- */

/* Minimize Button */
.vh-minimize-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 24px !important;
  height: 8px !important;
  min-height: 8px !important;
  background-color: rgba(0, 0, 0, 0.2) !important;
  border-radius: 4px;
  cursor: pointer;
  z-index: 1000;
  transition: background-color 0.2s, transform 0.2s;
  display: block !important;
}

.vh-minimize-btn:hover {
  background-color: #619EE7;
  /* Blue accent */
  transform: scale(1.1);
}

/* Minimized State Container */
#vh-notifications-monitor-header-ui {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

#vh-notifications-monitor-header-ui.vh-minimized {
  padding: 4px 8px 4px 36px !important;
  /* Left padding for button */
  min-height: 40px !important;
  height: auto !important;
  gap: 10px !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
  overflow: visible !important;
  /* Allow dropdowns/popups if needed, but mainly to avoid cutting off content */
  display: flex !important;
  /* Ensure flex layout takes over */
}

/* Hide elements in minimized state */

/* 1. Hide the status info container (the second div in the grid, row 2, column 1) */
/* This targets the div with inline style containing "display: flex; flex-wrap: wrap; gap: 10px" */
#vh-notifications-monitor-header-ui.vh-minimized>div[style*="flex-grow"]>div[style*="display: flex"][style*="flex-wrap: wrap"] {
  display: none !important;
}

/* 2. Hide the Controls container completely */
#vh-notifications-monitor-header-ui.vh-minimized #vh-notification-monitor-controls {
  display: none !important;
}

/* 3. In filters, hide everything except the search input's wrapper */
#vh-notifications-monitor-header-ui.vh-minimized #vh-nm-filters>div>*:not([style*="display: flex"]) {
  display: none !important;
}

/* 3b. Within the filters flex container, hide everything except search input */
#vh-notifications-monitor-header-ui.vh-minimized #vh-nm-filters>div[style*="display: flex"]>*:not(#search-input),
#vh-notifications-monitor-header-ui.vh-minimized #vh-nm-filters>div[style*="display: grid"]>* {
  display: none !important;
}

#vh-notifications-monitor-header-ui.vh-minimized #vh-nm-tile-size-container {
  display: none !important;
}

/* Adjust Header Row */
#vh-notifications-monitor-header-ui.vh-minimized .vh-header-row {
  margin: 0 !important;
  padding: 0 !important;
  width: auto !important;
  flex-grow: 1 !important;
  max-width: none !important;
}

/* Scale down Icon and Title */
#vh-notifications-monitor-header-ui.vh-minimized .vh-icon-vh-48 {
  transform: scale(0.6);
  margin-right: 0px !important;
  transform-origin: left center;
}

#vh-notifications-monitor-header-ui.vh-minimized h2 {
  font-size: 14px !important;
  padding: 0 !important;
  margin: 0 !important;
  white-space: nowrap;
}

/* Moved Status Elements Container */
.vh-minimized-status-container {
  animation: fadeIn 0.3s ease-out;
  margin-left: 20px !important;
  margin-right: auto !important;
  /* Push filters to right? Or keep left? */
}

.vh-minimized-status-container .notice {
  font-size: 11px !important;
  display: flex;
  align-items: center;
  white-space: nowrap;
  margin: 0 !important;
  padding: 0 !important;
}

.vh-minimized-status-container .vh-switch-32 {
  transform: scale(0.5);
  margin-right: -4px !important;
  flex-shrink: 0;
}

/* Adjust Filters Container */
#vh-notifications-monitor-header-ui.vh-minimized #vh-nm-filters {
  margin: 0 !important;
  padding: 0 !important;
  width: auto !important;
  align-self: center !important;
}

#vh-notifications-monitor-header-ui.vh-minimized #vh-nm-filters>div {
  display: flex !important;
  gap: 0 !important;
  grid-template-columns: none !important;
}

#vh-notifications-monitor-header-ui.vh-minimized #search-input {
  width: 180px !important;
  height: 28px !important;
  font-size: 12px !important;
  padding: 0 8px !important;
  border-radius: 14px !important;
}

/* =============================
   Expanded-only anti-clipping resets (Monitor Header)
   Ensure full height of controls and filters when NOT minimized
   Applies regardless of which minimized class is used (.vh-header-minimized or .vh-minimized)
   ============================= */
body[data-hash="monitor"] #vh-notifications-monitor-header-ui:not(.vh-header-minimized):not(.vh-minimized) {
  overflow: visible !important;
  clip-path: none !important;
  -webkit-mask-image: none !important;
  backface-visibility: visible !important;
  transform: none !important;
}

/* Inner content wrapper (grid/flex container) */
body[data-hash="monitor"] #vh-notifications-monitor-header-ui:not(.vh-header-minimized):not(.vh-minimized) > div[style*="flex-grow: 1"] {
  overflow: visible !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
  transform: none !important;
  contain: none !important;
  isolation: auto !important;
  grid-auto-rows: auto !important;
  align-items: start !important;
  align-content: start !important;
}

/* Controls wrapper (direct or nested under the inner wrapper) */
body[data-hash="monitor"] #vh-notifications-monitor-header-ui:not(.vh-header-minimized):not(.vh-minimized) > div[style*="display: flex; flex-wrap: wrap; gap: 5px; margin: 5px 0"],
body[data-hash="monitor"] #vh-notifications-monitor-header-ui:not(.vh-header-minimized):not(.vh-minimized) > div[style*="flex-grow: 1"] > div[style*="display: flex; flex-wrap: wrap; gap: 5px; margin: 5px 0"] {
  overflow: visible !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
  transform: none !important;
  min-width: 0 !important;
}

/* Controls grid itself */
body[data-hash="monitor"] #vh-notifications-monitor-header-ui:not(.vh-header-minimized):not(.vh-minimized) .vh-notification-monitor-controls {
  overflow: visible !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
  min-width: 0 !important;
}

/* Filters block and its immediate grid/flex wrapper */
body[data-hash="monitor"] #vh-notifications-monitor-header-ui:not(.vh-header-minimized):not(.vh-minimized) #vh-nm-filters,
body[data-hash="monitor"] #vh-notifications-monitor-header-ui:not(.vh-header-minimized):not(.vh-minimized) #vh-nm-filters > div {
  overflow: visible !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
  transform: none !important;
  min-width: 0 !important;
  max-width: 100% !important;
}

/* Expanded-only: ensure no residual scaling from minimized state */
body[data-hash="monitor"] #vh-notifications-monitor-header-ui:not(.vh-header-minimized):not(.vh-minimized) .vh-header-row .vh-icon-48,
body[data-hash="monitor"] #vh-notifications-monitor-header-ui:not(.vh-header-minimized):not(.vh-minimized) .vh-header-row h2,
body[data-hash="monitor"] #vh-notifications-monitor-header-ui:not(.vh-header-minimized):not(.vh-minimized) .vh-header-status-inline .vh-switch-32 {
  transform: none !important;
}

/* =============================
   Monitor Header Mini Bar (minimized-only dedicated strip)
   Applies when any minimized class is present
   ============================= */
body[data-hash="monitor"] #vh-notifications-monitor-header-ui:is(.vh-barminimized, .vh-minimized, .vh-header-minimized) {
  position: relative !important;
  display: block !important;
  padding: 12px 16px 12px 48px !important; /* even fatter paddings; keep space for button */
  min-height: 56px !important;
  height: 56px !important;
  overflow: hidden !important;
}

/* Minimized: hide all direct children except legacy minimize button and the mini bar, but only after mini bar is ready */
body[data-hash="monitor"] #vh-notifications-monitor-header-ui.vh-mini-ready:is(.vh-barminimized, .vh-minimized, .vh-header-minimized) > *:not(#vh-mini-bar):not(.vh-minimize-btn) {
  display: none !important;
}

/* Hide the new pill entirely; legacy .vh-minimize-btn is the active control */
body[data-hash="monitor"] #vh-header-minimize-pill { display: none !important; }

/* Show and layout the mini bar */
body[data-hash="monitor"] #vh-notifications-monitor-header-ui #vh-mini-bar {
  display: none; /* default when not minimized */
}
body[data-hash="monitor"] #vh-notifications-monitor-header-ui.vh-mini-ready:is(.vh-barminimized, .vh-minimized, .vh-header-minimized) #vh-mini-bar {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  white-space: nowrap !important;
  min-width: 0 !important;
  height: 32px !important;
}
body[data-hash="monitor"] #vh-mini-bar > * { min-width: 0 !important; }

/* Brand cluster: icon + title */
body[data-hash="monitor"] #vh-mini-bar .vh-mini-brand {
  display: inline-flex !important;
  align-items: center !important;
  gap: 10px !important;
  min-width: 0 !important;
}
body[data-hash="monitor"] #vh-mini-bar .vh-mini-brand .vh-icon-48.vh-icon-vh-48 {
  transform: scale(0.9) !important;
  transform-origin: left center !important;
  flex: 0 0 auto !important;
}
body[data-hash="monitor"] #vh-mini-bar .vh-mini-brand h2 {
  font-size: 14px !important;
  line-height: 1 !important;
  margin: 0 !important;
  padding: 0 !important;
  max-width: clamp(140px, 22ch, 300px) !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

/* Actions cluster: only first two control groups, header labels hidden */
body[data-hash="monitor"] #vh-mini-bar .vh-mini-actions {
  display: inline-flex !important;
  align-items: center !important;
  gap: 10px !important;
  border-left: 1px solid rgba(0,0,0,0.08) !important;
  padding-left: 8px !important;
  min-width: 0 !important;
}
body[data-hash="monitor"] #vh-mini-bar .vh-mini-actions .vh-control-group {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  padding: 0 !important;
  margin: 0 !important;
  background: none !important;
  border: 0 !important;
  box-shadow: none !important;
}
/* Mini bar only: keep action buttons adjacent (inline), never stacked */
body[data-hash="monitor"] #vh-mini-bar .vh-mini-actions .vh-control-group .vh-control-buttons {
  display: inline-flex !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
  gap: 6px !important;
  white-space: nowrap !important;
}
body[data-hash="monitor"] #vh-mini-bar .vh-mini-actions .vh-control-group .vh-control-buttons label {
  display: inline-flex !important;
  align-items: center !important;
}
body[data-hash="monitor"] #vh-mini-bar .vh-mini-actions .vh-control-group .vh-control-header { display: none !important; }
body[data-hash="monitor"] #vh-mini-bar .vh-mini-actions .vh-control-buttons label { margin: 0 2px !important; }
body[data-hash="monitor"] #vh-mini-bar .vh-mini-actions .vh-control-buttons input[type="button"] {
  padding: 6px 14px !important;
  min-height: 30px !important;
  font-size: 12px !important;
}

/* Search cluster */
body[data-hash="monitor"] #vh-mini-bar .vh-mini-search {
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  min-width: 0 !important;
}
body[data-hash="monitor"] #vh-mini-bar .vh-mini-search label { font-size: 0 !important; margin: 0 !important; }
body[data-hash="monitor"] #vh-mini-bar .vh-mini-search #search-input {
  width: clamp(120px, 20vw, 170px) !important;
  min-width: 0 !important;
  height: 30px !important;
  padding: 4px 12px !important;
  border-radius: 15px !important;
  /* Match default header theming, keep only rounded shape here */
  background: var(--vh-bg-white, #ffffff) !important;
  color: var(--vh-text-main, #1a1a1a) !important;
  border: 1px solid var(--vh-border, #e0e6ef) !important; /* outline to match control buttons */
  outline: none !important;
  box-shadow: var(--vh-shadow-small, 0 1px 2px rgba(30,60,120,0.06)) !important; /* subtle baseline */
  transition: box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease !important;
}
/* Hover: copy the glow feel from buttons inside .vh-control-group */
body[data-hash="monitor"] #vh-mini-bar .vh-mini-search #search-input:hover {
  box-shadow: 0 2px 10px rgba(30,60,120,0.16), 0 1px 2px rgba(30,60,120,0.06) !important;
  border-color: var(--vh-border-hover, #d6dfec) !important;
}
body[data-hash="monitor"] #vh-mini-bar .vh-mini-search #search-input:focus {
  /* Make it really bloom when focused */
  box-shadow: 0 0 0 4px rgba(30,60,120,0.20), 0 8px 24px rgba(30,60,120,0.24) !important;
  border-color: var(--vh-border-focus, #c9d6eb) !important;
}
body[data-hash="monitor"] #vh-mini-bar .vh-mini-search #search-input::placeholder {
  color: #666 !important;
  opacity: 1 !important;
}

/* Status cluster */
body[data-hash="monitor"] #vh-mini-bar .vh-mini-status {
  display: inline-flex !important;
  align-items: center !important;
  gap: 12px !important;
  margin-left: auto !important;
  border-left: 1px solid rgba(0,0,0,0.08) !important;
  padding-left: 8px !important;
  min-width: 0 !important;
}
body[data-hash="monitor"] #vh-mini-bar .vh-mini-status .notice {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  margin: 0 !important;
  padding: 0 !important;
  background: none !important;
  box-shadow: none !important;
  border: 0 !important;
}
body[data-hash="monitor"] #vh-mini-bar .vh-mini-status .notice > div { font-size: 0 !important; min-width: 0 !important; }
body[data-hash="monitor"] #vh-mini-bar .vh-mini-status .notice > div span[id^="description"] {
  font-size: 12px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-width: clamp(120px, 24vw, 220px) !important;
}
body[data-hash="monitor"] #vh-mini-bar .vh-mini-status .vh-switch-32 { transform: scale(0.85) !important; transform-origin: left center !important; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  body[data-hash="monitor"] #vh-mini-bar * { transition: none !important; animation: none !important; }
}`;

        // Modernized Settings (header gear) + Insightfulness Features toggle
        const VM_HIDE_INSIGHTFULNESS_KEY = 'vine_modernized_hide_insightfulness';
        const VM_INSIGHTFULNESS_STYLE_ID = 'vine-modernized-insightfulness-style';
        const VM_SETTINGS_NAV_ITEM_ID = 'vvp-modernized-settings-link';
        const VM_CSS_THEMING_KEY = 'vine_modernized_css_theming_enabled';
        const VM_CSS_THEMING_STYLE_ID = 'vine-modernized-css-theming-style';
        const VM_SEARCH_IN_TABS_KEY = 'vine_modernized_search_in_tabs';
        const VM_SEARCH_IN_TABS_STYLE_ID = 'vine-modernized-search-in-tabs-style';
        const VM_SEARCH_IN_TABS_CONTAINER_ID = 'vvp-tabs-search-container';
        const VM_POTLUCK_PLACEHOLDER_TOGGLE_VISIBLE_KEY = 'vine_potluck_placeholders_toggle_visible';

        const VM_SEARCH_IN_TABS_CONTENT = `
  body.vvp-search-in-tabs .vvp-container-search.vvp-container-right-align,
  body.vvp-search-in-tabs .a-section.vvp-container-right-align.vvp-container-search {
    display: none !important;
  }

  body.vvp-search-in-tabs #vvp-tabs-search-container {
    margin-left: auto !important;
    list-style: none !important;
    display: inline-flex !important;
    align-items: center !important;
    align-self: center !important;
    position: relative !important;
    padding: 0 !important;
    color: var(--tab-text, inherit) !important;
  }

  body.vvp-search-in-tabs #vvp-tabs-search-container .a-search {
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    border: none !important;
    border-radius: 999px !important;
    padding: 6px 10px !important;
    background: transparent !important;
    position: relative !important;
    box-shadow: none !important;
    outline: none !important;
    filter: none !important;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  body.vvp-search-in-tabs #vvp-tabs-search-container .a-search::after {
    content: "" !important;
    position: absolute !important;
    left: 10px !important;
    right: 10px !important;
    bottom: 0 !important;
    height: 3px !important;
    background: var(--tab-bg-active, #659C43) !important;
    transform: scaleX(0) !important;
    transform-origin: left center !important;
    transition: transform 0.25s ease !important;
  }

  body.vvp-search-in-tabs #vvp-tabs-search-container .a-search.vvp-tabs-search-expanded::after {
    transform: scaleX(1) !important;
  }

  body.vvp-search-in-tabs #vvp-tabs-search-container .a-search .a-icon-search {
    color: currentColor !important;
    width: 16px !important;
    height: 16px !important;
    cursor: pointer !important;
    flex: 0 0 auto !important;
  }

  body.vvp-search-in-tabs #vvp-tabs-search-container .a-search input[type="search"] {
    width: 0 !important;
    min-width: 0 !important;
    opacity: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    outline: none !important;
    background: transparent !important;
    color: inherit !important;
    font-size: 14px !important;
    transition: width 0.25s ease, opacity 0.2s ease, padding 0.25s ease;
  }

  body.vvp-search-in-tabs #vvp-tabs-search-container .a-search.vvp-tabs-search-expanded input[type="search"] {
    width: 480px !important;
    opacity: 1 !important;
    padding: 0 8px 0 24px !important;
  }

  body.vvp-search-in-tabs #vvp-tabs-search-container .a-search.vvp-tabs-search-expanded {
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
    filter: none !important;
  }

  body.vvp-search-in-tabs #vvp-tabs-search-container input[type="search"]:focus {
    box-shadow: none !important;
    outline: none !important;
    border: none !important;
  }

  body.vvp-search-in-tabs #vvp-theme-toggle-container {
    margin-left: 12px !important;
  }

  @media (max-width: 720px) {
    body.vvp-search-in-tabs #vvp-tabs-search-container .a-search.vvp-tabs-search-expanded input[type="search"] {
      width: 320px !important;
      padding-left: 22px !important;
    }
  }

  /* ==== Product Photo Preview (overlay + modal) ==== */
  .vh-photo-preview-overlay {
    position: fixed !important;
    inset: 0 !important;
    background: rgba(0, 0, 0, 0.66) !important;
    display: none !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 999999 !important;
    animation: fadeIn 0.12s ease-out;
  }

  .vh-photo-preview-overlay.show { display: flex !important; }

  .vh-photo-preview-modal {
    position: relative !important;
    max-width: 90vw !important;
    max-height: 90vh !important;
    background: #fff !important;
    border-radius: 8px !important;
    padding: 16px 52px !important;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5) !important;
  }

  .vh-photo-preview-image {
    max-width: 86vw !important;
    max-height: 80vh !important;
    object-fit: contain !important;
    display: block !important;
    border-radius: 4px !important;
  }

  .vh-photo-preview-nav {
    position: absolute !important;
    top: 0 !important;
    bottom: 0 !important;
    width: 48px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #111 !important;
    background: transparent !important;
    border: none !important;
    cursor: pointer !important;
    font-size: 28px !important;
    opacity: 0.8 !important;
    transition: opacity 0.15s ease;
  }

  .vh-photo-preview-nav:hover { opacity: 1 !important; }
  .vh-photo-preview-nav:active { opacity: 0.9 !important; }
  .vh-photo-preview-nav.prev { left: 0 !important; }
  .vh-photo-preview-nav.next { right: 0 !important; }

  .vh-photo-preview-close {
    position: absolute !important;
    top: 8px !important;
    right: 8px !important;
    width: 36px !important;
    height: 36px !important;
    border-radius: 18px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: rgba(0,0,0,0.06) !important;
    color: #111 !important;
    border: none !important;
    cursor: pointer !important;
  }

  .vh-photo-preview-counter {
    position: absolute !important;
    bottom: 8px !important;
    right: 16px !important;
    padding: 4px 8px !important;
    background: rgba(0,0,0,0.55) !important;
    color: #fff !important;
    border-radius: 12px !important;
    font-size: 12px !important;
  }

  .vh-photo-preview-loading {
    position: absolute !important;
    inset: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .vh-photo-spinner {
    width: 42px !important;
    height: 42px !important;
    border: 4px solid rgba(0,0,0,0.2) !important;
    border-top-color: #2196f3 !important;
    border-radius: 50% !important;
    animation: spin 0.9s linear infinite !important;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

        function getHideInsightfulnessEnabled() {
            const stored = localStorage.getItem(VM_HIDE_INSIGHTFULNESS_KEY);
            if (stored === null) {
                localStorage.setItem(VM_HIDE_INSIGHTFULNESS_KEY, '1');
                return true;
            }
            return stored !== '0' && stored !== 'false';
        }

        function setHideInsightfulnessEnabled(on) {
            localStorage.setItem(VM_HIDE_INSIGHTFULNESS_KEY, on ? '1' : '0');
        }

        function getPotluckPlaceholderToggleVisible() {
            const stored = localStorage.getItem(VM_POTLUCK_PLACEHOLDER_TOGGLE_VISIBLE_KEY);
            if (stored === null) {
                localStorage.setItem(VM_POTLUCK_PLACEHOLDER_TOGGLE_VISIBLE_KEY, '1');
                return true;
            }
            return stored !== '0' && stored !== 'false';
        }

        function setPotluckPlaceholderToggleVisible(on) {
            localStorage.setItem(VM_POTLUCK_PLACEHOLDER_TOGGLE_VISIBLE_KEY, on ? '1' : '0');
        }

        function updatePotluckPlaceholderVisibility() {
            const wrapper = document.getElementById('vine-potluck-placeholders-wrapper');
            if (wrapper) {
                wrapper.style.display = getPotluckPlaceholderToggleVisible() ? 'flex' : 'none';
            }
        }

        function ensureInsightfulnessStyleEl() {
            let styleEl = document.getElementById(VM_INSIGHTFULNESS_STYLE_ID);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = VM_INSIGHTFULNESS_STYLE_ID;
                (document.head || document.documentElement).appendChild(styleEl);
            }
            return styleEl;
        }

        function getReviewQualityScoreColIndex1Based() {
            const th = document.getElementById('vvp-reviews-table--review-quality-score-heading');
            if (!th) return null;
            const table = th.closest('table');
            if (!table || !table.classList.contains('vvp-reviews-table')) return null;
            const idx0 = th.cellIndex;
            if (!Number.isFinite(idx0) || idx0 < 0) return null;
            return idx0 + 1;
        }

        function updateInsightfulnessFeaturesVisibility() {
            const styleEl = ensureInsightfulnessStyleEl();
            const enabled = getHideInsightfulnessEnabled();
            if (!enabled) {
                styleEl.textContent = '';
                return;
            }

            const { pathname, search } = window.location;
            const params = new URLSearchParams(search);

            const css = [];

            if (pathname === '/vine/account') {
                css.push(`#vvp-rotw-carousel { display: none !important; }`);
            }

            if (pathname === '/vine/vine-reviews' && params.get('review-type') === 'completed') {
                const col = getReviewQualityScoreColIndex1Based();
                if (col) {
                    css.push(`table.vvp-reviews-table > tbody > tr > :nth-child(${col}) { display: none !important; }`);
                }
            }

            styleEl.textContent = css.join('\n');
        }

        function getCssThemingEnabled() {
            const stored = localStorage.getItem(VM_CSS_THEMING_KEY);
            if (stored === null) {
                localStorage.setItem(VM_CSS_THEMING_KEY, '1');
                return true;
            }
            return stored !== '0' && stored !== 'false';
        }

        function setCssThemingEnabled(on) {
            localStorage.setItem(VM_CSS_THEMING_KEY, on ? '1' : '0');
        }

        function ensureCssThemingStyleEl() {
            let styleEl = document.getElementById(VM_CSS_THEMING_STYLE_ID);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = VM_CSS_THEMING_STYLE_ID;
                (document.head || document.documentElement).appendChild(styleEl);
            }
            return styleEl;
        }

        function updateCssThemingVisibility() {
            const styleEl = ensureCssThemingStyleEl();
            const enabled = getCssThemingEnabled();
            if (!enabled) {
                styleEl.textContent = '';
                removeEarlyThemeStyle();
                return;
            }
            styleEl.textContent = VM_CSS_THEMING_CONTENT;
            removeEarlyThemeStyle();
        }

        function getSearchInTabsEnabled() {
            const stored = localStorage.getItem(VM_SEARCH_IN_TABS_KEY);
            if (stored === null) {
                localStorage.setItem(VM_SEARCH_IN_TABS_KEY, '1');
                return true;
            }
            return stored !== '0' && stored !== 'false';
        }

        function setSearchInTabsEnabled(on) {
            localStorage.setItem(VM_SEARCH_IN_TABS_KEY, on ? '1' : '0');
        }

        function ensureSearchInTabsStyleEl() {
            let styleEl = document.getElementById(VM_SEARCH_IN_TABS_STYLE_ID);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = VM_SEARCH_IN_TABS_STYLE_ID;
                (document.head || document.documentElement).appendChild(styleEl);
            }
            return styleEl;
        }

        function getVineSearchBar() {
            return document.querySelector(`#${VM_SEARCH_IN_TABS_CONTAINER_ID} .a-search`) ||
                document.querySelector('.vvp-container-search .a-search');
        }

        function ensureTabsSearchContainer() {
            const tabs = document.querySelector('body .a-tabs[data-action="a-tabs"]');
            if (!tabs) return null;

            let container = document.getElementById(VM_SEARCH_IN_TABS_CONTAINER_ID);
            if (!container) {
                container = document.createElement('li');
                container.id = VM_SEARCH_IN_TABS_CONTAINER_ID;
            }

            if (container.parentElement !== tabs) {
                const themeToggle = document.getElementById('vvp-theme-toggle-container');
                if (themeToggle && themeToggle.parentElement === tabs) {
                    tabs.insertBefore(container, themeToggle);
                } else {
                    tabs.appendChild(container);
                }
            }

            return container;
        }

        function initTabsSearchBehavior(searchBar) {
            if (!searchBar || searchBar.dataset.vvpTabsSearchInit === 'true') return;
            const icon = searchBar.querySelector('.a-icon-search');
            const input = searchBar.querySelector('input[type="search"]');
            if (!icon || !input) return;

            searchBar.dataset.vvpTabsSearchInit = 'true';

            let hoverTimer = null;

            const expand = () => {
                searchBar.classList.add('vvp-tabs-search-expanded');
                input.focus();
            };

            const triggerExpand = (e) => {
                e.preventDefault();
                e.stopPropagation();
                expand();
            };

            icon.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            icon.addEventListener('pointerup', triggerExpand);
            icon.addEventListener('mouseenter', () => {
                if (hoverTimer) {
                    clearTimeout(hoverTimer);
                    hoverTimer = null;
                }
                expand();
            });
            icon.addEventListener('mouseleave', () => {
                if (hoverTimer) {
                    clearTimeout(hoverTimer);
                    hoverTimer = null;
                }
            });

            input.addEventListener('focus', () => {
                searchBar.classList.add('vvp-tabs-search-expanded');
            });

            searchBar.addEventListener('focusout', (e) => {
                setTimeout(() => {
                    const dropdown = document.getElementById('vine-search-autocomplete-dropdown');
                    const isAutocompleteTarget = dropdown &&
                        (dropdown.contains(e.relatedTarget) ||
                            dropdown.contains(document.activeElement) ||
                            dropdown.matches(':hover'));

                    if (!searchBar.contains(document.activeElement) && !isAutocompleteTarget) {
                        searchBar.classList.remove('vvp-tabs-search-expanded');
                    }
                }, 0);
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    input.blur();
                    searchBar.classList.remove('vvp-tabs-search-expanded');
                }
            });
        }

        function moveSearchBarToTabs() {
            const searchBar = getVineSearchBar();
            if (!searchBar) return false;

            const container = ensureTabsSearchContainer();
            if (!container) return false;

            if (!container.contains(searchBar)) {
                container.appendChild(searchBar);
            }

            initTabsSearchBehavior(searchBar);
            return true;
        }

        function moveSearchBarToOriginal() {
            const searchBar = getVineSearchBar();
            if (!searchBar) return false;

            const originalContainer = document.querySelector('.vvp-container-search.vvp-container-right-align') ||
                document.querySelector('.vvp-container-search');
            if (!originalContainer) return false;

            if (!originalContainer.contains(searchBar)) {
                const searchButton = originalContainer.querySelector('#vvp-search-button');
                if (searchButton) {
                    originalContainer.insertBefore(searchBar, searchButton);
                } else {
                    originalContainer.insertBefore(searchBar, originalContainer.firstChild);
                }
            }

            searchBar.classList.remove('vvp-tabs-search-expanded');
            const tabsContainer = document.getElementById(VM_SEARCH_IN_TABS_CONTAINER_ID);
            if (tabsContainer && tabsContainer.childElementCount === 0) {
                tabsContainer.remove();
            }
            return true;
        }

        function updateSearchInTabsUI() {
            if (!document.body) return;
            const styleEl = ensureSearchInTabsStyleEl();
            const enabled = getSearchInTabsEnabled();
            const originalContainer = document.querySelector('.vvp-container-search.vvp-container-right-align') ||
                document.querySelector('.vvp-container-search');
            if (!enabled) {
                styleEl.textContent = '';
                document.body.classList.remove('vvp-search-in-tabs');
                moveSearchBarToOriginal();
                if (originalContainer && originalContainer.dataset.vvpTabsHidden === '1') {
                    originalContainer.style.display = originalContainer.dataset.vvpTabsDisplay || '';
                    delete originalContainer.dataset.vvpTabsHidden;
                    delete originalContainer.dataset.vvpTabsDisplay;
                }
                return;
            }
            styleEl.textContent = VM_SEARCH_IN_TABS_CONTENT;
            document.body.classList.add('vvp-search-in-tabs');
            moveSearchBarToTabs();
            if (originalContainer) {
                if (originalContainer.dataset.vvpTabsHidden !== '1') {
                    originalContainer.dataset.vvpTabsDisplay = originalContainer.style.display || '';
                }
                originalContainer.style.display = 'none';
                originalContainer.dataset.vvpTabsHidden = '1';
            }
        }

        function getSettingsGearSvg() {
            return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="height: 1rem; width: 1rem; display: block;">
                <path fill="currentColor" d="M19.14,12.94c0.04-0.31,0.06-0.63,0.06-0.94s-0.02-0.63-0.06-0.94l2.03-1.58c0.18-0.14,0.22-0.41,0.1-0.61l-1.92-3.32c-0.12-0.2-0.37-0.28-0.59-0.2l-2.39,0.96c-0.5-0.38-1.04-0.69-1.62-0.92L14.4,2.81C14.37,2.59,14.18,2.43,13.95,2.43h-3.9c-0.23,0-0.42,0.16-0.45,0.38L9.24,5.39C8.66,5.62,8.12,5.93,7.62,6.31L5.23,5.35c-0.22-0.08-0.47,0-0.59,0.2L2.72,8.87c-0.12,0.2-0.08,0.47,0.1,0.61l2.03,1.58C4.81,11.37,4.8,11.69,4.8,12s0.02,0.63,0.06,0.94l-2.03,1.58c-0.18,0.14-0.22,0.41-0.1,0.61l1.92,3.32c0.12,0.2,0.37,0.28,0.59,0.2l2.39-0.96c0.5,0.38,1.04,0.69,1.62,0.92l0.36,2.58c0.03,0.22,0.22,0.38,0.45,0.38h3.9c0.23,0,0.42-0.16,0.45-0.38l0.36-2.58c0.58-0.23,1.12-0.54,1.62-0.92l2.39,0.96c0.22,0.08,0.47,0,0.59-0.2l1.92-3.32c0.12-0.2,0.08-0.47-0.1-0.61L19.14,12.94z M12,15.5c-1.93,0-3.5-1.57-3.5-3.5s1.57-3.5,3.5-3.5s3.5,1.57,3.5,3.5S13.93,15.5,12,15.5z"/>
            </svg>
        `.trim();
        }

        function showModernizedSettings() {
            const hideInsight = getHideInsightfulnessEnabled();
            const cssThemingEnabled = getCssThemingEnabled();
            const searchInTabsEnabled = getSearchInTabsEnabled();
            const potluckPlaceholderVisible = getPotluckPlaceholderToggleVisible();

            const modal = document.createElement('div');
            modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 10000;`;

            const content = document.createElement('div');
            content.style.cssText = `
            background: white; padding: 24px; border-radius: 8px;
            max-width: 560px; width: 92%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            max-height: 90vh; overflow-y: auto;`;

            content.innerHTML = `
            <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 400;">Modernized settings</h2>

            <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
                <div>
                    <label style="display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" id="vms-hide-insightfulness">
                        <span>Hide Insightfulness Features</span>
                    </label>
                </div>
                <div>
                    <label style="display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" id="vms-css-theming-enabled">
                        <span>Enable CSS Theming</span>
                    </label>
                </div>
                <div>
                    <label style="display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" id="vms-search-in-tabs">
                        <span>Vine Search Bar in Tabs</span>
                    </label>
                </div>
                <div>
                    <label style="display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" id="vms-potluck-placeholders-enabled">
                        <span>Show RFY Placeholder Controls</span>
                    </label>
                </div>
            </div>
        `;

            modal.appendChild(content);
            document.body.appendChild(modal);

            const hideInsightInput = content.querySelector('#vms-hide-insightfulness');
            const cssThemingInput = content.querySelector('#vms-css-theming-enabled');
            const searchInTabsInput = content.querySelector('#vms-search-in-tabs');

            hideInsightInput.checked = !!hideInsight;
            hideInsightInput.addEventListener('change', () => {
                const on = !!hideInsightInput.checked;
                setHideInsightfulnessEnabled(on);
                updateInsightfulnessFeaturesVisibility();
            });

            cssThemingInput.checked = !!cssThemingEnabled;
            cssThemingInput.addEventListener('change', () => {
                const on = !!cssThemingInput.checked;
                setCssThemingEnabled(on);
                updateCssThemingVisibility();
            });

            searchInTabsInput.checked = !!searchInTabsEnabled;
            searchInTabsInput.addEventListener('change', () => {
                const on = !!searchInTabsInput.checked;
                setSearchInTabsEnabled(on);
                updateSearchInTabsUI();
            });

            const potluckPlaceholderInput = content.querySelector('#vms-potluck-placeholders-enabled');
            potluckPlaceholderInput.checked = !!potluckPlaceholderVisible;
            potluckPlaceholderInput.addEventListener('change', () => {
                const on = !!potluckPlaceholderInput.checked;
                setPotluckPlaceholderToggleVisible(on);
                updatePotluckPlaceholderVisibility();
            });

            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        }

        function injectModernizedSettingsNavItem() {
            if (document.getElementById(VM_SETTINGS_NAV_ITEM_ID)) return true;

            const list = document.querySelector('ul.vvp-header-links-container');
            if (!list) return false;

            const li = document.createElement('li');
            li.id = VM_SETTINGS_NAV_ITEM_ID;
            li.className = 'vvp-header-link';

            const a = document.createElement('a');
            a.className = 'a-link-normal';
            a.href = 'javascript:void(0)';
            a.setAttribute('role', 'button');
            a.setAttribute('aria-label', 'Modernized settings');
            a.title = 'Modernized settings';
            a.style.display = 'flex';
            a.style.alignItems = 'center';
            a.style.justifyContent = 'center';
            a.style.setProperty('min-width', 'auto', 'important');
            a.style.setProperty('padding', '6px 10px', 'important');
            a.innerHTML = getSettingsGearSvg();

            a.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                try { showModernizedSettings(); } catch (err) { console.error('Open modernized settings failed', err); }
            });

            li.appendChild(a);
            list.appendChild(li);
            return true;
        }

        (function initModernizedSettingsFeatures() {
            // Ensure default is set early so "checked by default" is consistent
            getHideInsightfulnessEnabled();
            getCssThemingEnabled();
            getSearchInTabsEnabled();
            getPotluckPlaceholderToggleVisible();

            const tick = () => {
                injectModernizedSettingsNavItem();
                updateInsightfulnessFeaturesVisibility();
                updateCssThemingVisibility();
                updateSearchInTabsUI();
            };

            tick();
            window.addEventListener('hashchange', tick);
            window.addEventListener('popstate', tick);
            setInterval(tick, 1000);
        })();

        function addFavoriteButton(tile) {
            if (tile.querySelector('.favorite-btn')) return; // Already there

            // Try multiple ways to get ASIN (handles both regular queues and NM)
            let asin = tile.querySelector('input[data-asin]')?.dataset.asin ||
                tile.getAttribute?.('data-asin') ||
                null;

            // Fallback for NM items: extract from ID like "vh-notification-B0FNCRVB6N"
            if (!asin && tile.id?.startsWith('vh-notification-')) {
                const match = tile.id.match(/vh-notification-(.+)/);
                if (match && match[1]) {
                    asin = match[1];
                }
            }

            if (!asin) {
                // Silently skip placeholder tiles (they may get ASIN data later and will be caught by polling)
                // Only log if tile appears to be a real item (has image or title), not a placeholder
                const hasImage = tile.querySelector('img');
                const hasTitle = tile.querySelector('.a-truncate-full, .a-truncate-cut');
                if (hasImage || hasTitle) {
                    // This might be a real tile that's missing ASIN - log as debug info
                    // It will be retried by polling later
                }
                return; // Skip tiles without ASIN for now
            }

            // --- Create the button ---
            const btn = document.createElement('span');
            btn.className = 'favorite-btn';
            btn.innerHTML = createUnfavoritedHeartSVG();
            btn.title = 'Add to Favorites';
            btn.dataset.asin = asin;

            if (isFavorited(asin)) {
                btn.classList.add('favorited');
                btn.innerHTML = createFavoritedHeartSVG();
                btn.title = 'Remove from Favorites';
            }

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleFavorite(tile, btn);
            });

            // Add listener to "See details" button to store data for the modal
            const detailsInput = tile.querySelector('.vvp-details-btn .a-button-input');
            if (detailsInput) {
                detailsInput.addEventListener('mousedown', () => {
                    g_lastClickedItemData = getItemDataFromTile(tile);
                    console.log('Vine Modernized: Stored item data for modal:', g_lastClickedItemData);
                }, true);
            }

            // --- Find or create an image wrapper and append button ---
            const img = tile.querySelector('img');
            const imgContainer = tile.querySelector('.vh-img-container') || tile.querySelector('.vvp-item-image-container');

            // For notification monitor, check vh-img-container first
            let wrapper = null;

            if (imgContainer) {
                // Container already exists, use it or create wrapper inside
                wrapper = imgContainer.querySelector('.vvp-item-image-container');
                if (!wrapper && img) {
                    // Create wrapper inside the container
                    wrapper = document.createElement('div');
                    wrapper.className = 'vvp-item-image-container';
                    img.parentNode.insertBefore(wrapper, img);
                    wrapper.appendChild(img);
                } else if (!wrapper && !img) {
                    // No image yet, create empty wrapper
                    wrapper = document.createElement('div');
                    wrapper.className = 'vvp-item-image-container';
                    imgContainer.appendChild(wrapper);
                }
            } else if (img) {
                // No container yet, find where to insert based on image position
                wrapper = img.closest('.vvp-item-image-container');
                if (!wrapper) {
                    wrapper = document.createElement('div');
                    wrapper.className = 'vvp-item-image-container';
                    img.parentNode.insertBefore(wrapper, img);
                    wrapper.appendChild(img);
                }
            }

            if (!wrapper) {
                console.warn('Vine Modernized: Could not find or create image container for favorite button');
                return;
            }

            // Add the button to the image's wrapper.
            wrapper.appendChild(btn);
        }

        // --- BUY NOW FEATURE ---
        function readCookie(name) {
            const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
            return m ? decodeURIComponent(m[1]) : null;
        }

        // Sanitize CSRF tokens pulled from cookies/meta
        function sanitizeCsrfToken(token) {
            if (!token) return null;
            let t = String(token).trim();
            // Strip surrounding quotes if present
            if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith('\'') && t.endsWith('\''))) {
                t = t.slice(1, -1);
            }
            return t;
        }

        // Return all viable anti-CSRF candidates in priority order (deduped & sanitized)
        function getAntiCsrfCandidates() {
            const candidates = [];
            const push = (v) => { const s = sanitizeCsrfToken(v); if (s) candidates.push(s); };
            // Prefer meta tags first
            push(document.querySelector('meta[name="anti-csrftoken-a2z"]')?.content);
            push(document.querySelector('meta[name="csrf-token"]')?.content);
            // Prefer regional auth token over x-acbca, then global fallback
            push(readCookie('at-acbca')); // amazon.ca
            push(readCookie('x-acbca'));
            push(readCookie('at-main'));
            // Deduplicate preserving order
            const seen = new Set();
            return candidates.filter(t => (t && !seen.has(t) && seen.add(t)));
        }

        // Backwards-compatible single-token getter (first candidate)
        function getAntiCsrfToken() {
            const arr = getAntiCsrfCandidates();
            return arr[0] || null;
        }

        // --- CSRF token acquisition via Vine UI page (cached) ---
        let g_vineCsrfCache = { token: null, ts: 0 };
        let g_vineCsrfSource = null; // 'current-meta' | 'iframe-meta' | 'fetch-parse' | 'cookie-candidate' | null
        let g_vineNoReferrerReachable = true; // flips to false if 404/not reachable
        const VINE_CSRF_TTL_MS = 12 * 60 * 1000; // 12 minutes

        function getCachedVineCsrf() {
            try {
                const raw = localStorage.getItem('vvp_vine_csrf_cache');
                if (!raw) return null;
                const obj = JSON.parse(raw);
                if (!obj?.token || !obj?.ts) return null;
                return obj;
            } catch { return null; }
        }

        function setCachedVineCsrf(token) {
            g_vineCsrfCache = { token, ts: Date.now() };
            try { localStorage.setItem('vvp_vine_csrf_cache', JSON.stringify(g_vineCsrfCache)); } catch { }
        }

        async function ensureVineCsrfToken(options = {}) {
            const { forceRefresh = false } = options;
            const debug = (localStorage.getItem('vvp_buy_now_debug') || '').toLowerCase();
            const now = Date.now();

            // 1) Use in-memory cache if fresh
            if (!forceRefresh && g_vineCsrfCache.token && (now - g_vineCsrfCache.ts) < VINE_CSRF_TTL_MS) {
                return g_vineCsrfCache.token;
            }

            // 2) Try localStorage cache
            if (!forceRefresh) {
                const cached = getCachedVineCsrf();
                if (cached && (now - cached.ts) < VINE_CSRF_TTL_MS) {
                    g_vineCsrfCache = cached;
                    return cached.token;
                }
            }

            // 3) Try current document meta
            const metaNow = sanitizeCsrfToken(document.querySelector('meta[name="anti-csrftoken-a2z"]')?.content || document.querySelector('meta[name="csrf-token"]')?.content);
            if (metaNow) {
                if (debug.includes('log')) console.info('Vine Modernized: CSRF source=current-meta len=', String(metaNow).length);
                g_vineCsrfSource = 'current-meta';
                setCachedVineCsrf(metaNow);
                return metaNow;
            }

            // Helper to finalize
            const finish = (token, source) => {
                if (token) {
                    if (debug.includes('log')) console.info('Vine Modernized: CSRF source=' + source + ' len=', String(token).length);
                    g_vineCsrfSource = source;
                    setCachedVineCsrf(token);
                    return token;
                }
                return null;
            };

            // 4) Try hidden iframe to /vine/no-referrer (same-origin)
            try {
                const token = await new Promise((resolve, reject) => {
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    iframe.src = `${location.origin}/vine/no-referrer`;
                    const onCleanup = () => setTimeout(() => iframe.remove(), 0);
                    iframe.onload = () => {
                        try {
                            const doc = iframe.contentDocument;
                            const t = sanitizeCsrfToken(doc?.querySelector('meta[name="anti-csrftoken-a2z"]')?.content || doc?.querySelector('meta[name="csrf-token"]')?.content);
                            onCleanup();
                            resolve(t || null);
                        } catch (e) { onCleanup(); resolve(null); }
                    };
                    iframe.onerror = () => { onCleanup(); resolve(null); };
                    document.body.appendChild(iframe);
                });
                const t = finish(token, 'iframe-meta');
                if (t) return t;
            } catch { /* ignore */ }

            // 5) Fallback: fetch and parse HTML
            try {
                const res = await fetch('/vine/no-referrer', { method: 'GET', credentials: 'include' });
                g_vineNoReferrerReachable = res.ok;
                if (res.ok) {
                    const html = await res.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const token = sanitizeCsrfToken(doc.querySelector('meta[name="anti-csrftoken-a2z"]')?.content || doc.querySelector('meta[name="csrf-token"]')?.content);
                    const t = finish(token, 'fetch-parse');
                    if (t) return t;
                }
            } catch { /* ignore */ }

            // 6) Last resort: cookie candidates
            const fallback = getAntiCsrfToken();
            if (debug.includes('log')) console.info('Vine Modernized: CSRF source=cookie-candidate len=', fallback ? String(fallback).length : 0);
            g_vineCsrfSource = 'cookie-candidate';
            if (fallback) setCachedVineCsrf(fallback);
            return fallback;
        }

        async function resolveVariationAsin(recommendationId, fallbackAsin) {
            if (!recommendationId) return fallbackAsin;
            try {
                const res = await fetch(`/vine/api/recommendations/${encodeURIComponent(recommendationId)}`, {
                    method: 'GET',
                    credentials: 'include'
                });
                if (!res.ok) return fallbackAsin;
                const data = await res.json();
                // If API signals error or no result, use fallback
                if (!data?.result || data?.error) return fallbackAsin;
                const vars = data?.result?.variations;
                if (Array.isArray(vars) && vars.length && vars[0]?.asin) return vars[0].asin;
                const item = data?.result?.item;
                return item?.asin || fallbackAsin;
            } catch (e) {
                return fallbackAsin;
            }
        }

        async function createVineVoiceOrder({ recommendationId, recommendationType, itemAsin }) {
            const body = JSON.stringify({
                recommendationId,
                recommendationType: recommendationType || 'VINE_FOR_ALL',
                itemAsin,
                isAsinTangoEligible: true
            });
            const debug = (localStorage.getItem('vvp_buy_now_debug') || '').toLowerCase();

            async function postOnce(forceRefresh = false) {
                const csrf = await ensureVineCsrfToken({ forceRefresh });
                const headers = {
                    'content-type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json, text/javascript, */*; q=0.01'
                };
                if (csrf) headers['anti-csrftoken-a2z'] = csrf;
                if (debug.includes('log')) {
                    console.info('Vine Modernized: voiceOrders post', forceRefresh ? '(force token refresh)' : '', {
                        hasAntiHeader: Boolean(csrf),
                        tokenLen: csrf ? String(csrf).length : 0,
                        referrer: `${location.origin}/vine/no-referrer`
                    });
                }
                const res = await fetch('/vine/api/voiceOrders', {
                    method: 'POST',
                    credentials: 'include',
                    headers,
                    body,
                    referrer: `${location.origin}/vine/no-referrer`,
                    referrerPolicy: 'strict-origin-when-cross-origin'
                });
                return res;
            }

            // First attempt with current/best token
            let res = await postOnce(false);
            if (res.status === 401 || res.status === 403) {
                // Force refresh token and retry once
                if (debug.includes('log')) console.warn('Vine Modernized: 401/403 on voiceOrders, retrying with fresh token');
                res = await postOnce(true);
            }
            if (!res.ok) throw new Error(`voiceOrders HTTP ${res.status}`);
            return res.json();
        }

        function submitVineCheckout({ asin, offerListingId }) {
            // Prefer the existing hidden form if present (same as modal uses)
            let form = document.querySelector('#vvp-checkout-buy-now');
            if (!form) {
                // Create a compatible hidden form if the page doesn’t have one yet
                form = document.createElement('form');
                form.id = 'vvp-checkout-buy-now';
                form.method = 'post';
                form.action = 'https://www.amazon.ca/checkout/entry/buynow?pipelineType=Chewbacca';
                form.target = '_blank';
                form.style.display = 'none';
                document.body.appendChild(form);
            }

            const set = (name, val) => {
                let input = form.querySelector(`input[name="${name}"]`);
                if (!input) {
                    input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = name;
                    form.appendChild(input);
                }
                input.value = val;
            };

            set('skipCart', '1');
            set('quantity', '1');
            set('asin', asin);
            set('offerListingID', offerListingId); // already URL-encoded from API

            // Ensure Vine policy fields are present; keep existing values if the form already has them
            const existingPolicy = form.querySelector('input[name="vinePurchasePolicyCode"]')?.value || 'AmazonVine';
            set('vinePurchasePolicyCode', existingPolicy);
            const existingPromo = form.querySelector('input[name="vinePromotionId"]')?.value;
            if (existingPromo) set('vinePromotionId', existingPromo);

            form.target = '_blank';
            form.action = 'https://www.amazon.ca/checkout/entry/buynow?pipelineType=Chewbacca';
            form.method = 'post';
            form.submit();
        }

        async function handleBuyNowForTile(tile) {
            // New primary path: drive the official UI flow only (no direct POSTs)
            // Optional: warm up recommendation context to match native behavior
            try {
                // Mark this flow as a Buy Now-initiated checkout so only this path appends vvp_auto
                (function markBuyNowActive() {
                    try {
                        const now = Date.now();
                        // short-lived activity marker used only in this tab to gate form submission patch
                        sessionStorage.setItem('vvp_buy_now_active', '1');
                        sessionStorage.setItem('vvp_buy_now_active_ts', String(now));
                        // origin marker used by the SPC page (new tab) to confirm this came from Buy Now
                        localStorage.setItem('vvp_checkout_origin', 'vine-buy-now');
                        localStorage.setItem('vvp_checkout_ts', String(now));
                    } catch { }
                })();

                const item = getItemDataFromTile(tile);
                if (item?.recommendationId) {
                    try { await fetch(`/vine/api/recommendations/${encodeURIComponent(item.recommendationId)}`, { credentials: 'include' }); } catch { }
                }

                const fallbackPref = (localStorage.getItem('vvp_buy_now_fallback') || 'auto').toLowerCase();
                const hideDuringAuto = fallbackPref !== 'manual' && fallbackPref !== 'off';

                let hideStyle = null;
                if (hideDuringAuto) {
                    hideStyle = document.getElementById('vvp-hide-modal-style');
                    if (!hideStyle) {
                        hideStyle = document.createElement('style');
                        hideStyle.id = 'vvp-hide-modal-style';
                        // Hide both the modal container and its scroller/backdrop to avoid flash
                        // Keep it hidden until after we dispatch Request click; we'll remove later.
                        hideStyle.textContent = '.a-popover-modal,.a-modal-scroller{opacity:0!important;pointer-events:none!important;visibility:hidden!important;}';
                        document.head.appendChild(hideStyle);
                    }
                }

                await openModalAndRequestProduct(tile);

                // Remove the hiding style a bit later to avoid brief flash if modal lingers
                if (hideStyle) setTimeout(() => { hideStyle?.remove?.(); }, 4000);

                // Clear the activity marker after a short delay to avoid leaking into manual flows
                setTimeout(() => {
                    try {
                        sessionStorage.removeItem('vvp_buy_now_active');
                        sessionStorage.removeItem('vvp_buy_now_active_ts');
                    } catch { }
                }, 15000);
            } catch (err) {
                console.error('Vine Modernized: UI automation Buy Now failed', err);
                // If automation failed, reveal the modal (if hidden) so the user can proceed manually
                const hideStyle = document.getElementById('vvp-hide-modal-style');
                if (hideStyle) hideStyle.remove();
                alert('Unable to open checkout automatically. The Product Details modal should be visible so you can click Request product.');
                // Ensure activity marker is cleared on failure
                try {
                    sessionStorage.removeItem('vvp_buy_now_active');
                    sessionStorage.removeItem('vvp_buy_now_active_ts');
                } catch { }
            }
        }

        // Utility: wait for a selector to appear within timeout
        function waitForSelector(selector, timeout = 6000, root = document) {
            return new Promise((resolve, reject) => {
                const el = root.querySelector(selector);
                if (el) return resolve(el);
                const start = Date.now();
                const iv = setInterval(() => {
                    const node = root.querySelector(selector);
                    if (node) {
                        clearInterval(iv);
                        resolve(node);
                    } else if (Date.now() - start >= timeout) {
                        clearInterval(iv);
                        reject(new Error(`Timeout waiting for selector: ${selector}`));
                    }
                }, 100);
            });
        }

        // Primary Buy Now path: mimic the UI reliably and click native Request
        async function openModalAndRequestProduct(tile) {
            // Helper to dispatch a realistic click sequence
            const dispatchSeq = (el) => {
                try {
                    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                } catch {
                    try { el.click?.(); } catch { }
                }
            };

            // Get the ASIN of the tile we want to buy
            const targetItem = getItemDataFromTile(tile);
            if (!targetItem || !targetItem.asin) {
                throw new Error('Could not get item data from tile for Buy Now');
            }
            const targetAsin = targetItem.asin;

            // 0) Check if modal is already open and verify it's for the correct item
            let modalContent = document.querySelector('.a-popover-modal #vvp-product-details-modal--content');
            let modalHasCorrectItem = false;

            if (modalContent) {
                // Quick check if the modal contains the correct ASIN (check immediately, then once more if needed)
                const modalAsinInput = modalContent.querySelector('input[data-asin]');
                let modalAsin = modalAsinInput?.dataset?.asin || modalAsinInput?.getAttribute?.('data-asin');

                // If ASIN not found immediately, wait just once briefly (modal might still be loading)
                if (!modalAsin) {
                    await new Promise(r => setTimeout(r, 150));
                    const retryInput = modalContent.querySelector('input[data-asin]');
                    modalAsin = retryInput?.dataset?.asin || retryInput?.getAttribute?.('data-asin');
                }

                modalHasCorrectItem = (modalAsin === targetAsin);

                // If the modal has the wrong item, close it quickly
                if (!modalHasCorrectItem && modalAsin) {
                    const modalRoot = modalContent.closest('.a-popover');
                    if (modalRoot) {
                        // Try to find and click a close button
                        const closeBtn = modalRoot.querySelector('[aria-label*="close" i], .a-button-close, [data-action*="close" i]');
                        if (closeBtn) {
                            try { closeBtn.click(); } catch { }
                        } else {
                            // Fallback: try pressing Escape key
                            try {
                                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                            } catch { }
                        }
                        // Quick wait for modal to close (most modals close instantly)
                        await new Promise(r => setTimeout(r, 200));
                    }
                }
            }

            // 1) Open the modal via the existing See details control (if not already open with correct item)
            if (!modalHasCorrectItem) {
                const detailsWrapper = tile.querySelector('.vvp-details-btn');
                const openBtn = detailsWrapper?.querySelector('.a-button-input') || detailsWrapper;
                if (!openBtn) throw new Error('Details button not found for Buy Now');
                dispatchSeq(openBtn);
                // 2) Wait for the modal content to exist
                modalContent = await waitForSelector('.a-popover-modal #vvp-product-details-modal--content', 8000, document);
            }

            // 3) Wait for spinners to finish (both content and hero image spinners if present)
            const waitForIdle = async () => {
                const start = Date.now();
                const timeout = 10000;
                while (Date.now() - start < timeout) {
                    const spinner = document.querySelector('#vvp-product-details-modal--spinner');
                    const heroSpin = document.querySelector('#vvp-product-details-modal--hero-image-spinner');
                    const busy = (el) => el && getComputedStyle(el).display !== 'none';
                    if (!busy(spinner) && !busy(heroSpin)) break;
                    await new Promise(r => setTimeout(r, 120));
                }
            };
            await waitForIdle();

            // 4) Find the correct target to click: the wrapper with the AUI data-action
            // Prefer the data-action container, then the wrapper span id, then inner input as last resort
            const modalRoot = modalContent.closest('.a-popover') || document;
            let clickTarget = modalRoot.querySelector('[data-action="vvp-request-product"]');
            if (!clickTarget) clickTarget = modalRoot.querySelector('#vvp-product-details-modal--request-btn');
            if (!clickTarget) clickTarget = modalRoot.querySelector('#vvp-product-details-modal--request-btn .a-button-input');
            if (!clickTarget) throw new Error('Request button not found in modal');

            // Guard against accidental double-submits (this flow previously clicked both the wrapper and inner input).
            // Use a short per-modal cooldown so repeated DOM observers or click sequences can’t submit twice.
            try {
                const now = Date.now();
                const last = parseInt(modalRoot.dataset.vvpBuyNowRequestTs || '0', 10);
                if (Number.isFinite(last) && now - last < 1500) return;
                modalRoot.dataset.vvpBuyNowRequestTs = String(now);
            } catch { /* ignore */ }

            // 5) Ensure the button is enabled
            const isDisabled = (el) => el.classList?.contains('a-button-disabled') || el.getAttribute?.('aria-disabled') === 'true';
            const enabledWaitStart = Date.now();
            while (isDisabled(clickTarget) && Date.now() - enabledWaitStart < 8000) {
                await new Promise(r => setTimeout(r, 120));
            }

            // 6) Click exactly once. Clicking the wrapper already triggers the AUI action; clicking the inner input
            // as well can cause duplicate "Request product" submissions.
            dispatchSeq(clickTarget);
        }

        // === AUTO-CHECKOUT SETTINGS + CHECKOUT FLAGGING ===
        (function initAutoCheckoutSettings() {
            const LS_KEY = 'vvp_auto_checkout';

            function isAutoCheckoutEnabled() {
                const v = (localStorage.getItem(LS_KEY) || 'false').toLowerCase();
                return v === 'true';
            }

            function setAutoCheckoutEnabled(val) {
                try { localStorage.setItem(LS_KEY, String(Boolean(val))); } catch { }
                updateAutoMenuUI();
            }

            function findVineItemsTab() {
                // Prefer explicit id if present
                let tab = document.getElementById('vvp-vine-items-tab');
                if (tab) return tab;
                // Heuristics: a tab anchor/button that points to vine-items
                const candidates = Array.from(document.querySelectorAll('.a-tabs [role="tab"], .a-tabs a, .a-tabs button'));
                for (const el of candidates) {
                    const href = el.getAttribute('href') || '';
                    const txt = (el.textContent || '').toLowerCase();
                    if (href.includes('vine-items') || txt.includes('vine items') || txt.trim() === 'items') {
                        return el.closest('[role="tab"]') || el;
                    }
                }
                return null;
            }

            // Create dropdown menu similar to theme toggle dropdown, matching tab width
            let autoMenu, openTimer, closeTimer, hoverArea;
            function createAutoMenu() {
                const tab = findVineItemsTab();
                if (!tab) return false;

                // Container that overlays under the tab area
                const containerId = 'vvp-auto-checkout-menu-container';
                if (document.getElementById(containerId)) return true;

                const container = document.createElement('div');
                container.id = containerId;
                container.style.position = 'relative';

                // Insert container wrapping the tab element to align widths
                const parent = tab.parentElement;
                if (!parent) return false;
                parent.insertBefore(container, tab);
                container.appendChild(tab);

                // Dropdown panel
                autoMenu = document.createElement('div');
                autoMenu.id = 'vvp-auto-checkout-dropdown';
                autoMenu.style.position = 'absolute';
                autoMenu.style.left = '0';
                autoMenu.style.top = '100%';
                autoMenu.style.background = '#fff';
                autoMenu.style.border = '1px solid #ddd';
                autoMenu.style.boxShadow = '0 2px 8px rgba(0,0,0,.15)';
                autoMenu.style.zIndex = '1000';
                autoMenu.style.overflow = 'hidden';
                autoMenu.style.maxHeight = '0';
                autoMenu.style.opacity = '0';
                autoMenu.style.transition = 'max-height .25s ease, opacity .2s ease';

                const option = document.createElement('button');
                option.type = 'button';
                option.className = 'vvp-auto-menu-option';
                option.style.display = 'block';
                option.style.width = '100%';
                option.style.padding = '10px 12px';
                option.style.textAlign = 'left';
                option.style.background = 'transparent';
                option.style.border = 'none';
                option.style.cursor = 'pointer';
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    setAutoCheckoutEnabled(!isAutoCheckoutEnabled());
                    hideMenu();
                });
                autoMenu.appendChild(option);

                container.appendChild(autoMenu);

                // Hover logic on the tab (open after 1s, and do not close when moving pointer into the dropdown)
                hoverArea = tab;
                const openDelayMs = 1000; // show after 1 second
                const onEnter = () => {
                    clearTimeout(openTimer);
                    clearTimeout(closeTimer);
                    openTimer = setTimeout(() => showMenu(), openDelayMs);
                };
                const onLeave = () => {
                    // Delay closing slightly to allow cursor to move into the dropdown without it disappearing
                    clearTimeout(openTimer);
                    clearTimeout(closeTimer);
                    closeTimer = setTimeout(() => hideMenu(), 220);
                };
                hoverArea.addEventListener('mouseenter', onEnter);
                hoverArea.addEventListener('mouseleave', onLeave);
                autoMenu.addEventListener('mouseenter', () => {
                    // If the user moves into the dropdown, keep it open and cancel any pending close
                    clearTimeout(openTimer);
                    clearTimeout(closeTimer);
                    showMenu();
                });
                autoMenu.addEventListener('mouseleave', () => {
                    // Close after a short grace period when leaving the dropdown
                    clearTimeout(closeTimer);
                    closeTimer = setTimeout(() => hideMenu(), 220);
                });

                // Match width to tab
                function syncWidth() {
                    try {
                        const w = getComputedStyle(tab).width;
                        autoMenu.style.width = w;
                    } catch { }
                }
                syncWidth();
                window.addEventListener('resize', syncWidth);

                updateAutoMenuUI();
                return true;
            }

            function showMenu() {
                if (!autoMenu) return;
                autoMenu.style.maxHeight = '200px';
                autoMenu.style.opacity = '1';
            }
            function hideMenu() {
                if (!autoMenu) return;
                autoMenu.style.maxHeight = '0';
                autoMenu.style.opacity = '0';
            }

            function updateAutoMenuUI() {
                const btn = document.querySelector('#vvp-auto-checkout-dropdown .vvp-auto-menu-option');
                if (!btn) return;
                const enabled = isAutoCheckoutEnabled();
                btn.textContent = `Auto Place Order: ${enabled ? 'On' : 'Off'}`;
            }

            function waitForTabAndInit(attempt = 0) {
                if (createAutoMenu()) return;
                if (attempt < 40) setTimeout(() => waitForTabAndInit(attempt + 1), 250);
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => waitForTabAndInit());
            } else {
                waitForTabAndInit();
            }

            // Helper to check if this submission was initiated by Buy Now (not manual Request Product)
            function isBuyNowActive(maxAgeMs = 60000) {
                try {
                    const active = sessionStorage.getItem('vvp_buy_now_active') === '1';
                    const ts = parseInt(sessionStorage.getItem('vvp_buy_now_active_ts') || '0', 10);
                    if (!active || !ts) return false;
                    return (Date.now() - ts) < maxAgeMs;
                } catch { return false; }
            }

            // Intercept checkout form submit to append vvp_auto flag ONLY for Buy Now initiated flow
            document.addEventListener('submit', (e) => {
                const form = e.target;
                if (!(form instanceof HTMLFormElement)) return;
                if (form.id !== 'vvp-checkout-buy-now') return;
                try {
                    if (!isBuyNowActive()) return; // do not tag manual flows
                    const enabled = isAutoCheckoutEnabled();
                    const action = form.getAttribute('action') || '';
                    const url = new URL(action, location.origin);
                    url.searchParams.set('vvp_auto', enabled ? 'true' : 'false');
                    form.setAttribute('action', url.toString());
                    // Also set a session flag to use on the target page in case Amazon strips unknown params
                    try {
                        sessionStorage.setItem('vvp_auto_checkout', enabled ? 'true' : 'false');
                        sessionStorage.setItem('vvp_auto_checkout_ts', String(Date.now()));
                        // And localStorage so the new tab can read it across tabs
                        localStorage.setItem('vvp_auto_checkout', enabled ? 'true' : 'false');
                        localStorage.setItem('vvp_auto_checkout_ts', String(Date.now()));
                        // Mark origin for SPC page to double-confirm Buy Now origin
                        localStorage.setItem('vvp_auto_checkout_origin', 'vine');
                    } catch { }
                } catch { }
            }, true);

            // Some AUI flows submit the form programmatically via form.submit(), which bypasses submit events.
            // Monkey‑patch HTMLFormElement.prototype.submit to ensure vvp_auto is appended in that case too.
            (function patchFormSubmitOnce() {
                try {
                    const FLAG = '__vvp_submit_patched__';
                    if (HTMLFormElement.prototype[FLAG]) return; // already patched
                    const nativeSubmit = HTMLFormElement.prototype.submit;
                    Object.defineProperty(HTMLFormElement.prototype, FLAG, { value: true, configurable: false });

                    HTMLFormElement.prototype.submit = function patchedSubmit() {
                        try {
                            if (this && this.id === 'vvp-checkout-buy-now') {
                                if (!isBuyNowActive()) {
                                    return nativeSubmit.apply(this, arguments);
                                }
                                // Append vvp_auto flag and set short‑lived storage markers
                                const enabled = isAutoCheckoutEnabled();
                                const action = this.getAttribute('action') || '';
                                const url = new URL(action, location.origin);
                                url.searchParams.set('vvp_auto', enabled ? 'true' : 'false');
                                this.setAttribute('action', url.toString());
                                try {
                                    const now = String(Date.now());
                                    sessionStorage.setItem('vvp_auto_checkout', enabled ? 'true' : 'false');
                                    sessionStorage.setItem('vvp_auto_checkout_ts', now);
                                    localStorage.setItem('vvp_auto_checkout', enabled ? 'true' : 'false');
                                    localStorage.setItem('vvp_auto_checkout_ts', now);
                                    // Mark origin for SPC page to confirm Buy Now
                                    localStorage.setItem('vvp_auto_checkout_origin', 'vine');
                                } catch { }
                                // Optional debug
                                if ((localStorage.getItem('vvp_buy_now_debug') || '').includes('log')) {
                                    console.log('Vine Modernized: patched form.submit applied vvp_auto=', enabled);
                                }
                            }
                        } catch { }
                        return nativeSubmit.apply(this, arguments);
                    };
                } catch { }
            })();
        })();

        function ensureBuyNowButtonRow(tile, providedDetailsBtn = null, providedBuyBtn = null) {
            try {
                if (!tile) return null;

                const content = tile.querySelector('.vvp-item-tile-content') || tile;
                const detailsBtn = providedDetailsBtn || tile.querySelector('.vvp-details-btn');
                const buyBtn = providedBuyBtn || tile.querySelector('.vvp-buy-now-btn');

                if (!detailsBtn || !buyBtn) return null;

                const detailsContainer = detailsBtn.closest?.('.vh-btn-container');
                const buyContainer = buyBtn.closest?.('.vh-btn-container');
                let container = (detailsContainer && detailsContainer.contains(detailsBtn)) ? detailsContainer : null;
                if (!container && buyContainer && buyContainer.contains(buyBtn)) container = buyContainer;

                if (!container || !container.classList?.contains('vh-btn-container')) {
                    container = document.createElement('span');
                    container.className = 'vh-btn-container';
                    container.style.display = 'flex';

                    const parent = detailsBtn.parentElement || content;
                    parent.insertBefore(container, detailsBtn);
                }

                // Move/ensure both buttons live inside the same row container
                if (detailsBtn.parentElement !== container) {
                    container.insertBefore(detailsBtn, container.firstChild);
                }
                if (buyBtn.parentElement !== container) {
                    container.appendChild(buyBtn);
                }

                // Ensure ordering: details first, buy second
                if (detailsBtn.nextElementSibling !== buyBtn) {
                    try {
                        container.insertBefore(detailsBtn, buyBtn);
                    } catch { }
                }

                // Safety: make sure container is flex even if some other style overrides it
                if (container.style.display !== 'flex') container.style.display = 'flex';

                return container;
            } catch {
                return null;
            }
        }

        function addBuyNowButton(tile) {
            if (!tile) return;

            // Skip placeholder tiles (empty vine items) - remove any existing Buy Now buttons
            if (tile.classList?.contains('vh-placeholder-tile')) {
                const existingBuyBtn = tile.querySelector('.vvp-buy-now-btn');
                if (existingBuyBtn) {
                    existingBuyBtn.remove();
                }
                return;
            }

            // If Buy Now already exists (Amazon or previously injected), just normalize layout.
            if (tile.querySelector('.vvp-buy-now-btn')) {
                ensureBuyNowButtonRow(tile);
                return;
            }

            // Find the button container where "See details" lives, or fall back to content area
            const content = tile.querySelector('.vvp-item-tile-content') || tile;
            const detailsBtn = tile.querySelector('.vvp-details-btn');

            // Create the Buy Now button styled like Amazon secondary button
            const buyBtn = document.createElement('span');
            buyBtn.className = 'a-button a-button-base vvp-buy-now-btn';
            buyBtn.innerHTML = '<span class="a-button-inner"><span class="a-button-text" aria-hidden="true">Buy Now</span></span>';
            buyBtn.style.marginLeft = '8px';

            buyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBuyNowForTile(tile);
            });

            if (detailsBtn) {
                // Always keep Details + Buy Now in the same flex row container for consistent layout
                const row = ensureBuyNowButtonRow(tile, detailsBtn, buyBtn);
                if (!row) {
                    (detailsBtn.parentElement || content).appendChild(buyBtn);
                }
            } else {
                content.appendChild(buyBtn);
            }
        }

        function getItemDataFromTile(tile) {
            // Try multiple selectors for ASIN input
            const detailsInput = tile.querySelector('.vvp-details-btn input.a-button-input') ||
                tile.querySelector('input[data-asin]') ||
                tile.querySelector('[data-asin]');

            if (!detailsInput) {
                console.warn('Vine Modernized: Could not find ASIN input in tile');
                return null;
            }

            // Extract ASIN - can be from dataset or data attribute
            let asin = detailsInput.dataset.asin || detailsInput.getAttribute('data-asin');

            // Fallback: try getting ASIN from tile's data-asin attribute
            if (!asin && tile.hasAttribute) {
                asin = tile.getAttribute('data-asin');
            }

            // If still no ASIN, try from ID (for NM items like "vh-notification-B0FNCRVB6N")
            if (!asin && tile.id?.startsWith('vh-notification-')) {
                const match = tile.id.match(/vh-notification-(.+)/);
                if (match && match[1]) {
                    asin = match[1];
                }
            }

            if (!asin) {
                console.warn('Vine Modernized: Could not extract ASIN from tile');
                return null;
            }

            return {
                asin: asin,
                title: tile.querySelector('.a-truncate-full')?.textContent.trim() ||
                    tile.querySelector('.a-truncate-cut')?.textContent.trim() ||
                    'Unknown Title',
                imgUrl: tile.querySelector('img')?.src ||
                    tile.getAttribute?.('data-img-url') ||
                    '',
                link: tile.querySelector('.a-link-normal')?.href ||
                    tile.querySelector('a[href]')?.href ||
                    '#',
                isParentAsin: detailsInput.dataset.isParentAsin || detailsInput.getAttribute?.('data-is-parent-asin') || 'false',
                isPreRelease: detailsInput.dataset.isPreRelease || detailsInput.getAttribute?.('data-is-pre-release') || 'false',
                recommendationId: detailsInput.dataset.recommendationId || detailsInput.getAttribute?.('data-recommendation-id') || '',
                recommendationType: detailsInput.dataset.recommendationType || detailsInput.getAttribute?.('data-recommendation-type') || 'VINE_FOR_ALL'
            };
        }

        function toggleFavorite(tile, btn) {
            const itemData = getItemDataFromTile(tile);
            toggleFavoriteByData(itemData);
        }

        function toggleFavoriteByData(itemData) {
            if (!itemData || !itemData.asin) return;

            const asin = itemData.asin;
            let favorites = getFavorites();
            const existingItemIndex = favorites.findIndex(item => item.asin === asin);
            const isCurrentlyFavorited = existingItemIndex !== -1 && !favorites[existingItemIndex].deleted;

            if (isCurrentlyFavorited) {
                // Soft-deletion: mark as deleted with current timestamp
                if (existingItemIndex !== -1) {
                    favorites[existingItemIndex] = {
                        ...favorites[existingItemIndex],
                        deleted: true,
                        timestamp: Date.now()
                    };
                }
                console.log(`Vine Modernized: Unfavorited item ${asin} (soft-delete).`);
            } else {
                // Add or Restore item
                const favoriteItem = {
                    ...itemData,
                    deleted: false,
                    timestamp: Date.now()
                };
                if (existingItemIndex !== -1) {
                    favorites[existingItemIndex] = favoriteItem;
                } else {
                    favorites.push(favoriteItem);
                }
                console.log(`Vine Modernized: Favorited item ${asin}. Data:`, favoriteItem);
            }

            saveFavorites(favorites);

            // Mark as changed for cloud sync
            markFavoritesAsChanged();

            // Update all buttons for this ASIN on the page (tile and modal)
            const newFavoritedState = !isCurrentlyFavorited;
            document.querySelectorAll(`.favorite-btn[data-asin="${asin}"]`).forEach(btn => {
                if (newFavoritedState) {
                    btn.classList.add('favorited');
                    btn.innerHTML = createFavoritedHeartSVG();
                    btn.title = 'Remove from Favorites';
                } else {
                    btn.classList.remove('favorited');
                    btn.innerHTML = createUnfavoritedHeartSVG();
                    btn.title = 'Add to Favorites';
                }
            });

            if (document.querySelector('#vvp-favorites-container')?.style.display !== 'none') {
                renderFavoritesPage();
            }
        }

        // ===== PRODUCT PHOTO PREVIEW =====
        // Fetch product images by parsing ImageBlockATF from the product page
        async function fetchProductImages(productUrl) {
            if (!productUrl || typeof productUrl !== 'string') throw new Error('Invalid product URL');
            const html = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: productUrl,
                    onload: r => resolve(r.responseText),
                    onerror: e => reject(new Error('Network error while fetching product page'))
                });
            });

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // Prefer the script after collections-collect-button, fallback to any script with ImageBlockATF
            const collectBtn = tempDiv.querySelector('.collections-collect-button');
            let scriptTag = null;
            if (collectBtn) {
                let el = collectBtn.nextElementSibling;
                while (el) {
                    if (el.tagName === 'SCRIPT' && el.type === 'text/javascript' && el.textContent.includes('ImageBlockATF')) {
                        scriptTag = el; break;
                    }
                    el = el.nextElementSibling;
                }
            }
            if (!scriptTag) {
                scriptTag = Array.from(tempDiv.querySelectorAll('script'))
                    .find(s => s.type === 'text/javascript' && s.textContent.includes('ImageBlockATF'));
            }
            if (!scriptTag) throw new Error('No image script found');

            const match = scriptTag.textContent.match(/var\s+data\s*=\s*(\{[\s\S]*?\});/);
            if (!match) throw new Error('No image data found');

            let dataObj = null;
            try {
                // eslint-disable-next-line no-eval
                dataObj = eval('(' + match[1] + ')');
            } catch (e) {
                throw new Error('Image data eval failed');
            }

            const colorImages = dataObj && dataObj.colorImages && dataObj.colorImages.initial;
            if (!Array.isArray(colorImages) || colorImages.length === 0) throw new Error('No images found');

            // Normalize to array of display URLs (prefer large > hiRes > thumb per request)
            const urls = colorImages
                .map(im => im?.large || im?.hiRes || im?.thumb)
                .filter(Boolean);
            // Deduplicate while preserving order
            const seen = new Set();
            const deduped = urls.filter(u => { if (seen.has(u)) return false; seen.add(u); return true; });
            if (deduped.length === 0) throw new Error('No image URL found');
            return deduped;
        }

        function createPhotoPreviewModal(imageUrls, startIndex = 0) {
            if (!Array.isArray(imageUrls) || imageUrls.length === 0) return;
            let idx = Math.max(0, Math.min(startIndex | 0, imageUrls.length - 1));

            const overlay = document.createElement('div');
            overlay.className = 'vh-photo-preview-overlay show';

            const panel = document.createElement('div');
            panel.className = 'vh-photo-preview-modal';
            overlay.appendChild(panel);

            const counter = document.createElement('div');
            counter.className = 'vh-photo-preview-counter';
            panel.appendChild(counter);

            const closeBtn = document.createElement('button');
            closeBtn.className = 'vh-photo-preview-close';
            closeBtn.title = 'Close';
            closeBtn.innerHTML = '&#10005;';
            panel.appendChild(closeBtn);

            const prevBtn = document.createElement('button');
            prevBtn.className = 'vh-photo-preview-nav prev';
            prevBtn.setAttribute('aria-label', 'Previous photo');
            prevBtn.textContent = '‹';
            panel.appendChild(prevBtn);

            const nextBtn = document.createElement('button');
            nextBtn.className = 'vh-photo-preview-nav next';
            nextBtn.setAttribute('aria-label', 'Next photo');
            nextBtn.textContent = '›';
            panel.appendChild(nextBtn);

            const img = document.createElement('img');
            img.className = 'vh-photo-preview-image';
            panel.appendChild(img);

            const loading = document.createElement('div');
            loading.className = 'vh-photo-preview-loading';
            loading.innerHTML = '<div class="vh-photo-spinner"></div>';
            panel.appendChild(loading);

            function updateCounter() {
                counter.textContent = `${idx + 1} / ${imageUrls.length}`;
            }

            function preload(i) {
                if (i < 0 || i >= imageUrls.length) return;
                const p = new Image();
                p.src = imageUrls[i];
            }

            function show(index) {
                idx = (index + imageUrls.length) % imageUrls.length;
                // Ensure spinner is visible while image is loading (override CSS !important)
                try { loading.style.setProperty('display', 'flex', 'important'); } catch { loading.style.display = 'flex'; }
                // Hide spinner once loaded or failed
                img.onload = () => {
                    try { loading.style.setProperty('display', 'none', 'important'); } catch { loading.style.display = 'none'; }
                };
                img.onerror = () => {
                    try { loading.style.setProperty('display', 'none', 'important'); } catch { loading.style.display = 'none'; }
                };
                img.src = imageUrls[idx];
                updateCounter();
                // Preload neighbors
                preload(idx + 1);
                preload(idx - 1);
            }

            function close() {
                document.removeEventListener('keydown', onKey);
                overlay.remove();
            }

            function onKey(e) {
                if (e.key === 'Escape') { e.preventDefault(); close(); }
                else if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
                else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
            }

            overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
            closeBtn.addEventListener('click', close);
            prevBtn.addEventListener('click', () => show(idx - 1));
            nextBtn.addEventListener('click', () => show(idx + 1));
            document.addEventListener('keydown', onKey);

            document.body.appendChild(overlay);
            show(idx);
        }

        // Attach click handlers to product thumbnails on all queue types
        function getTileForImage(imgEl) {
            return imgEl.closest?.('.vvp-item-tile') || imgEl.closest?.('.vh-tile') || imgEl.closest?.('[id^="vh-notification-"]') || null;
        }

        function getProductUrlFromTile(tile) {
            // Try existing helper for tile data
            try {
                const data = getItemDataFromTile(tile);
                if (data && data.link && data.link.startsWith('http')) return data.link;
            } catch { }
            // Fallbacks
            const a = tile.querySelector?.('.a-link-normal[href]') || tile.querySelector?.('a[href]');
            return a?.href || null;
        }

        function installPhotoPreviewListeners() {
            if (document.body.__vhPhotoPreviewBound) return;
            document.body.__vhPhotoPreviewBound = true;
            document.addEventListener('click', async (e) => {
                const imgEl = e.target && (e.target.matches?.('.vvp-item-image-container img, .vh-img-container img') ? e.target : e.target.closest?.('.vvp-item-image-container img, .vh-img-container img'));
                if (!imgEl) return;
                const tile = getTileForImage(imgEl);
                if (!tile) return;

                // Do not interfere with clicks that are explicitly opening details or links
                if (imgEl.closest('a, button, .vvp-details-btn')) return;

                e.preventDefault();
                e.stopPropagation();

                const productUrl = getProductUrlFromTile(tile);
                if (!productUrl) return;

                // Show temporary overlay with spinner while fetching
                const tempOverlay = document.createElement('div');
                tempOverlay.className = 'vh-photo-preview-overlay show';
                tempOverlay.innerHTML = '<div class="vh-photo-preview-modal"><div class="vh-photo-preview-loading"><div class="vh-photo-spinner"></div></div></div>';
                document.body.appendChild(tempOverlay);
                try {
                    const images = await fetchProductImages(productUrl);
                    tempOverlay.remove();
                    const startIdx = 0; // Could map to clicked thumb later
                    createPhotoPreviewModal(images, startIdx);
                } catch (err) {
                    console.warn('Vine Modernized: Photo preview failed:', err?.message || err);
                    tempOverlay.remove();
                    // Graceful failure: no alert to avoid noise
                }
            }, true);
        }

        // Initialize listeners once DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', installPhotoPreviewListeners);
        } else {
            installPhotoPreviewListeners();
        }

        // Helper function to create unfavorited heart SVG
        function createUnfavoritedHeartSVG() {
            return `<svg fill="none" viewBox="0 0 19 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" height="32" width="32" style="display: block;"><path d="M14.916 4.436c-1.204-1.265-3.31-1.34-4.589-.15l-.15.15-.677.595-.677-.67c-1.204-1.264-3.31-1.338-4.588-.074-.076.074-.076.074-.15.149-1.28 1.338-1.28 3.495 0 4.834l5.114 5.206c.075.075.15.149.301.149.075 0 .226 0 .3-.074l5.116-5.207c1.279-1.413 1.279-3.57 0-4.908z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5"></path></svg>`;
        }

        // Helper function to create favorited heart SVG
        function createFavoritedHeartSVG() {
            return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" height="32" width="32" style="display: block;"><path d="M11.35 19.723c.17.176.407.277.65.277.243 0 .48-.1.65-.277l6.679-6.918a5.02 5.02 0 001.5-2.476A5.17 5.17 0 0021 9.023C21 6.253 18.813 4 16.125 4c-.422 0-.853.06-1.28.18A4.915 4.915 0 0012 6.35a4.915 4.915 0 00-2.845-2.17A4.741 4.741 0 007.875 4C5.187 4 3 6.253 3 9.023a5.173 5.173 0 001.168 3.258c.154.185.323.362.503.524l6.679 6.918z" fill="currentColor"></path></svg>`;
        }

        function getFavorites() {
            return JSON.parse(localStorage.getItem('vine_favorites') || '[]');
        }

        function saveFavorites(favorites) {
            localStorage.setItem('vine_favorites', JSON.stringify(favorites));
            console.log('Vine Modernized: Favorites saved to localStorage.', favorites);
        }

        function isFavorited(asin) {
            return getFavorites().some(item => item.asin === asin && !item.deleted);
        }

        // Merge local and cloud favorites with deduplication by ASIN
        // Prioritizes items with timestamps (newer items take precedence)
        function mergeFavorites(localFavorites, cloudFavorites) {
            const merged = new Map();

            // Helper function to compare items by timestamp
            const getItemPriority = (item) => ({
                item,
                timestamp: item.timestamp || 0
            });

            // Combine all items and group by ASIN
            const allItems = [...localFavorites, ...cloudFavorites];
            const itemsByAsin = new Map();

            allItems.forEach(item => {
                const asin = item.asin;
                if (!itemsByAsin.has(asin)) {
                    itemsByAsin.set(asin, []);
                }
                itemsByAsin.get(asin).push(item);
            });

            // For each ASIN, keep the item with the most recent timestamp
            itemsByAsin.forEach((items, asin) => {
                if (items.length === 1) {
                    merged.set(asin, items[0]);
                } else {
                    // Sort by timestamp (newest first), fallback to first item if no timestamps
                    const sortedItems = items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    merged.set(asin, sortedItems[0]);
                }
            });

            // Convert back to array
            return Array.from(merged.values());
        }

        // Track previously visible panel/tab so we can return from Favorites
        let g_prevVisiblePanel = null;
        let g_prevActiveTabLi = null;
        let g_openedFavoritesFromMonitor = false;
        let g_originalUrlBeforeFavorites = null;

        function showFavoritesPage(skipUrlUpdate = false) {
            if (!skipUrlUpdate) {
                g_originalUrlBeforeFavorites = window.location.href;
                const url = new URL(window.location.href);
                let search = url.search;
                if (search) {
                    if (!search.includes('favorites')) search += '&favorites';
                } else {
                    search = '?favorites';
                }
                window.history.replaceState({}, '', url.pathname + search + url.hash);
            }
            // Save current state (visible panel + active tab)
            const panels = Array.from(document.querySelectorAll('div.a-tab-content[data-a-name]'));
            g_prevVisiblePanel = panels.find(p => {
                const cs = window.getComputedStyle(p);
                return cs && cs.display !== 'none';
            }) || null;
            g_prevActiveTabLi = document.querySelector('ul.a-tabs li.a-active') || null;

            // Detect if we are on Notifications Monitor (#monitor...)
            const hash = (window.location.hash || '').toLowerCase();
            g_openedFavoritesFromMonitor = hash.startsWith('#monitor');

            document.querySelectorAll('div.a-tab-content[data-a-name]').forEach(panel => {
                panel.style.display = 'none';
            });

            const favContainer = document.querySelector('#vvp-favorites-container');
            if (favContainer) {
                favContainer.style.display = 'block';
            }

            document.querySelectorAll('ul.a-tabs li').forEach(li => li.classList.remove('a-active'));
            const favTab = document.querySelector('#vvp-favorites-tab');
            if (favTab) {
                favTab.classList.add('a-active');
            }

            // Toggle Back button visibility based on monitor context
            const backBtnWrapper = document.getElementById('vvp-fav-back-btn');
            if (backBtnWrapper) {
                backBtnWrapper.style.display = g_openedFavoritesFromMonitor ? '' : 'none';
            }

            renderFavoritesPage();
        }

        function hideFavoritesPage() {
            const favContainer = document.querySelector('#vvp-favorites-container');
            if (favContainer) {
                favContainer.style.display = 'none';
            }
            const favTab = document.querySelector('#vvp-favorites-tab');
            if (favTab) {
                favTab.classList.remove('a-active');
            }

            // Hide back button when leaving Favorites
            const backBtnWrapper = document.getElementById('vvp-fav-back-btn');
            if (backBtnWrapper) backBtnWrapper.style.display = 'none';

            // Restore URL
            if (window.location.search.includes('favorites')) {
                const url = new URL(window.location.href);
                let search = url.search.replace(/&?favorites(=[^&]*)?/, '').replace(/^\?&/, '?');
                if (search === '?') search = '';
                window.history.replaceState({}, '', url.pathname + search + url.hash);
            }
        }

        // Return to Notifications Monitor (or previously active panel) without leaving the page
        function returnToMonitorFromFavorites() {
            // First hide favorites UI (does not navigate)
            hideFavoritesPage();

            // Do NOT click any Amazon tab anchors — they may navigate the page.
            // Instead, manually restore the previously visible panel and active tab styling.

            // Determine which panel to show
            let panelToShow = g_prevVisiblePanel;
            if (!panelToShow) {
                // Fallback: show the first non-favorites panel
                panelToShow = Array.from(document.querySelectorAll('div.a-tab-content[data-a-name]'))
                    .find(p => (p.getAttribute('data-a-name') || '') !== 'favorites') || null;
            }
            if (panelToShow) {
                panelToShow.style.display = 'block';
            }

            // Restore active tab class without triggering navigation
            const allTabs = document.querySelectorAll('ul.a-tabs li');
            allTabs.forEach(li => li.classList.remove('a-active'));
            const tabToActivate = (g_prevActiveTabLi && document.body.contains(g_prevActiveTabLi))
                ? g_prevActiveTabLi
                : document.querySelector('ul.a-tabs li[id^="vvp-"]:not(#vvp-favorites-tab)');
            if (tabToActivate) {
                tabToActivate.classList.add('a-active');
            }

            // If we came from the monitor view, nudge layout/observers without navigation
            if (g_openedFavoritesFromMonitor) {
                try {
                    // Minor layout refresh that some Amazon widgets rely on
                    window.dispatchEvent(new Event('resize'));
                    setTimeout(() => window.dispatchEvent(new Event('scroll')), 0);
                } catch (e) {
                    // no-op
                }
            }

            // Clean up state
            g_prevActiveTabLi = null;
            g_prevVisiblePanel = null;
            g_openedFavoritesFromMonitor = false;
        }

        function renderFavoritesPage() {
            const grid = document.querySelector('#vvp-favorites-grid');
            const favorites = getFavorites().filter(item => !item.deleted);

            // Sort favorites by timestamp (most recent first), with fallback for items without timestamps
            const sortedFavorites = favorites.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            console.log('Vine Modernized: Rendering favorites page with items:', sortedFavorites);

            if (!grid) {
                console.error('Vine Modernized: Favorites grid not found!');
                return;
            }
            grid.innerHTML = '';

            if (sortedFavorites.length === 0) {
                grid.innerHTML = '<p class="a-spacing-large a-text-center">You have not favorited any items yet.</p>';
                return;
            }

            sortedFavorites.forEach(item => {
                const tile = document.createElement('div');
                tile.className = 'vvp-item-tile';
                tile.innerHTML = `
                <div class="vvp-item-tile-content">
                    <div class="vvp-item-image-container">
                        <img alt="" src="${item.imgUrl}">
                    </div>
                    <div class="vvp-item-product-title-container">
                        <a class="a-link-normal" target="_blank" rel="noopener" href="${item.link}">
                            <span class="a-truncate-full">${item.title}</span>
                        </a>
                    </div>
                    <span class="a-button a-button-primary vvp-details-btn">
                        <span class="a-button-inner">
                            <input data-asin="${item.asin}"
                                   data-is-parent-asin="${item.isParentAsin || 'false'}"
                                   data-is-pre-release="${item.isPreRelease || 'false'}"
                                   data-recommendation-id="${item.recommendationId || ''}"
                                   data-recommendation-type="${item.recommendationType || 'VINE_FOR_ALL'}"
                                   class="a-button-input" type="submit">
                            <span class="a-button-text">See details</span>
                        </span>
                    </span>
                </div>`;
                addFavoriteButton(tile);
                addBuyNowButton(tile);
                grid.appendChild(tile);
            });
            console.log(`Vine Modernized: Rendered ${favorites.length} items to favorites grid.`);
        }

        function setSearchBarStyle() {
            const searchBar = document.querySelector('.vvp-container-search');
            if (!searchBar) return;
            if (USE_MODERN_SEARCH_SHADOW) {
                searchBar.classList.add('modern-search-shadow');
            } else {
                searchBar.classList.remove('modern-search-shadow');
            }
        }

        // Run on page load and after any dynamic updates
        setSearchBarStyle();


        // --- SEARCH AUTOCOMPLETE DROPDOWN FEATURE ---
        (function initSearchAutocomplete() {
            const DEBOUNCE_DELAY = 400; // Wait 400ms after user stops typing
            const MIN_QUERY_LENGTH = 2; // Minimum characters before searching
            let searchTimeout = null;
            let currentRequest = null;
            let resultsCache = new Map(); // Cache for search results
            let dropdown = null;
            let allSearchResults = []; // Store all results for infinite scroll
            let currentPage = 1;
            let isLoadingMore = false;
            let hasMoreResults = false;
            let currentSearchQuery = '';

            // Find the search input field
            function findSearchInput() {
                return document.querySelector(
                    `#${VM_SEARCH_IN_TABS_CONTAINER_ID} input[type="search"], ` +
                    `.vvp-container-search input[type="search"], ` +
                    `#${VM_SEARCH_IN_TABS_CONTAINER_ID} input[name="search"], ` +
                    `.vvp-container-search input[name="search"], ` +
                    `#${VM_SEARCH_IN_TABS_CONTAINER_ID} .a-search input, ` +
                    `.vvp-container-search .a-search input`
                );
            }

            function getSearchContext() {
                const searchInput = findSearchInput();
                if (!searchInput) {
                    return { searchInput: null, searchContainer: null, searchBar: null };
                }

                const searchBar = searchInput.closest('.a-search');
                const searchContainer = searchInput.closest(`#${VM_SEARCH_IN_TABS_CONTAINER_ID}`) ||
                    searchInput.closest('.vvp-container-search');

                return { searchInput, searchContainer, searchBar };
            }

            // Create dropdown UI
            function createDropdown() {
                if (dropdown) return dropdown;

                dropdown = document.createElement('div');
                dropdown.id = 'vine-search-autocomplete-dropdown';
                dropdown.className = 'vine-autocomplete-dropdown';
                dropdown.style.cssText = `
                position: absolute;
                background: white;
                border: 1px solid #ddd;
                border-radius: 24px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-height: 500px;
                overflow-y: auto;
                overflow-x: hidden;
                z-index: 10000;
                margin-top: 4px;
                opacity: 0;
                transform: translateY(-10px) scale(0.95);
                pointer-events: none;
                transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                            transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            `;
                return dropdown;
            }

            function ensureDropdownContainer(searchContainer) {
                if (!dropdown || !searchContainer) return;

                const computedStyle = window.getComputedStyle(searchContainer);
                if (computedStyle.position === 'static') {
                    searchContainer.style.position = 'relative';
                }

                if (!searchContainer.contains(dropdown)) {
                    searchContainer.appendChild(dropdown);
                }
            }

            // Position dropdown relative to search bar
            function updateDropdownPosition() {
                if (!dropdown) return;

                const { searchContainer, searchBar } = getSearchContext();

                if (!searchContainer || !searchBar) return;
                ensureDropdownContainer(searchContainer);

                // Use requestAnimationFrame for smooth positioning
                requestAnimationFrame(() => {
                    // Get search bar position relative to container
                    const searchBarRect = searchBar.getBoundingClientRect();
                    const containerRect = searchContainer.getBoundingClientRect();

                    // Calculate position relative to container
                    const leftOffset = searchBarRect.left - containerRect.left;
                    const width = searchBarRect.width;
                    const topOffset = searchBarRect.bottom - containerRect.top + 4; // 4px margin

                    // Position dropdown to match search bar width and alignment
                    dropdown.style.left = `${leftOffset}px`;
                    dropdown.style.width = `${width}px`;
                    dropdown.style.top = `${topOffset}px`;
                    dropdown.style.right = 'auto';
                });
            }

            // Animate dropdown show
            function showDropdown() {
                if (!dropdown) return;
                dropdown.style.display = 'block';
                // Force reflow
                dropdown.offsetHeight;
                // Trigger animation
                requestAnimationFrame(() => {
                    dropdown.style.opacity = '1';
                    dropdown.style.transform = 'translateY(0) scale(1)';
                    dropdown.style.pointerEvents = 'auto';
                });
                // Signal UI that autocomplete is open (used to retract bottom card)
                document.body.classList.add('vine-autocomplete-open');
            }

            // Animate dropdown hide
            function hideDropdown() {
                if (!dropdown) return;
                dropdown.style.opacity = '0';
                dropdown.style.transform = 'translateY(-10px) scale(0.95)';
                dropdown.style.pointerEvents = 'none';
                // Wait for animation to complete before hiding
                setTimeout(() => {
                    if (dropdown && dropdown.style.opacity === '0') {
                        dropdown.style.display = 'none';
                    }
                }, 250);
                // Remove signal class when autocomplete closes
                document.body.classList.remove('vine-autocomplete-open');
            }

            // Extract first N words from title
            function getFirstNWords(title, n = 5) {
                const words = title.trim().split(/\s+/).slice(0, n);
                return words.join(' ');
            }

            // Parse product data from tile
            function parseProductFromTile(tile) {
                const titleEl = tile.querySelector('.a-truncate-full') ||
                    tile.querySelector('.a-truncate-cut') ||
                    tile.querySelector('.vvp-item-product-title-container a');

                if (!titleEl) return null;

                const title = titleEl.textContent.trim();
                if (!title) return null;

                const imgEl = tile.querySelector('img');
                const imgUrl = imgEl ? imgEl.src : '';

                const linkEl = tile.querySelector('.a-link-normal[href]') ||
                    tile.querySelector('a[href*="/dp/"]') ||
                    tile.querySelector('a[href*="/gp/product/"]');
                const productUrl = linkEl ? linkEl.href : '';

                // Get ASIN from data attribute or input
                const asinInput = tile.querySelector('input[data-asin]');
                const asin = asinInput ? asinInput.dataset.asin : '';

                // Build search URL using first 5 words
                const searchQuery = getFirstNWords(title, 5);
                const baseUrl = window.location.origin + window.location.pathname;
                const searchUrl = `${baseUrl}?search=${encodeURIComponent(searchQuery)}`;

                return {
                    title,
                    imgUrl,
                    productUrl,
                    searchUrl,
                    asin
                };
            }

            // Fetch and parse search results
            async function fetchSearchResults(query, page = 1) {
                if (!query || query.length < MIN_QUERY_LENGTH) return { products: [], hasMore: false };

                // For cached results, return all products (only for page 1)
                const cacheKey = query.toLowerCase().trim();
                if (page === 1 && resultsCache.has(cacheKey)) {
                    console.log('Vine Modernized: Using cached search results for:', query);
                    const cached = resultsCache.get(cacheKey);
                    // Cache stores both products and hasMore info
                    if (Array.isArray(cached)) {
                        // Legacy format - just products array
                        return { products: cached, hasMore: false };
                    } else {
                        // New format - object with products and hasMore
                        return cached;
                    }
                }

                // Cancel previous request if still pending
                if (currentRequest) {
                    currentRequest.abort();
                    currentRequest = null;
                }

                // Build search URL with pagination if needed
                let searchUrl = `${window.location.origin}${window.location.pathname}?search=${encodeURIComponent(query)}`;
                if (page > 1) {
                    searchUrl += `&page=${page}`;
                }

                return new Promise((resolve, reject) => {
                    currentRequest = GM_xmlhttpRequest({
                        method: 'GET',
                        url: searchUrl,
                        onload: (response) => {
                            currentRequest = null;
                            if (response.status !== 200) {
                                console.error('Vine Modernized: Search request failed with status:', response.status);
                                resolve({ products: [], hasMore: false });
                                return;
                            }

                            try {
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(response.responseText, 'text/html');
                                const tiles = doc.querySelectorAll('#vvp-items-grid .vvp-item-tile');

                                const products = [];
                                tiles.forEach(tile => {
                                    const product = parseProductFromTile(tile);
                                    if (product) {
                                        products.push(product);
                                    }
                                });

                                // Check if there are more results (pagination exists)
                                const pagination = doc.querySelector('.a-pagination');
                                const hasMore = pagination && pagination.querySelector('.a-last:not(.a-disabled)') !== null;

                                // Cache all results for first page (with pagination info)
                                if (page === 1) {
                                    resultsCache.set(cacheKey, { products, hasMore });

                                    // Limit cache size (keep last 50 queries)
                                    if (resultsCache.size > 50) {
                                        const firstKey = resultsCache.keys().next().value;
                                        resultsCache.delete(firstKey);
                                    }
                                }

                                console.log(`Vine Modernized: Found ${products.length} products for query:`, query);
                                resolve({ products, hasMore });
                            } catch (error) {
                                console.error('Vine Modernized: Error parsing search results:', error);
                                resolve({ products: [], hasMore: false });
                            }
                        },
                        onerror: (error) => {
                            currentRequest = null;
                            console.error('Vine Modernized: Search request error:', error);
                            resolve({ products: [], hasMore: false });
                        }
                    });
                });
            }

            // Render dropdown with results (with infinite scroll support)
            function renderDropdown(results, query, append = false) {
                if (!dropdown) return;

                if (!append) {
                    allSearchResults = [];
                    currentPage = 1;
                    hasMoreResults = false;
                    dropdown.innerHTML = '';
                }

                if (!results || results.length === 0) {
                    if (!append) {
                        dropdown.innerHTML = `
                        <div class="vine-autocomplete-empty" style="padding: 16px; text-align: center; color: #888; font-size: 14px;">
                            No results found for "${query}"
                        </div>
                    `;
                        showDropdown();
                    }
                    return;
                }

                // Add results to our collection
                allSearchResults.push(...results);

                results.forEach((product, index) => {
                    const item = document.createElement('div');
                    item.className = 'vine-autocomplete-item';
                    item.style.cssText = `
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    cursor: pointer;
                    transition: background 0.2s;
                    border-bottom: 1px solid #f0f0f0;
                `;

                    // Hover effect
                    item.addEventListener('mouseenter', () => {
                        item.style.background = '#f5f5f5';
                    });
                    item.addEventListener('mouseleave', () => {
                        item.style.background = 'white';
                    });

                    // Product image
                    const imgContainer = document.createElement('div');
                    imgContainer.style.cssText = `
                    width: 50px;
                    height: 50px;
                    flex-shrink: 0;
                    margin-right: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f9f9f9;
                    border-radius: 4px;
                    overflow: hidden;
                `;

                    const img = document.createElement('img');
                    img.src = product.imgUrl || '';
                    img.alt = product.title;
                    img.style.cssText = `
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                `;
                    img.onerror = () => {
                        img.style.display = 'none';
                        imgContainer.innerHTML = '<span style="color: #ccc; font-size: 12px;">No image</span>';
                    };
                    imgContainer.appendChild(img);

                    // Product title (clickable, goes to search results)
                    const titleContainer = document.createElement('div');
                    titleContainer.style.cssText = `
                    flex: 1;
                    min-width: 0;
                    overflow: hidden;
                `;

                    const titleLink = document.createElement('a');
                    titleLink.href = product.searchUrl;
                    titleLink.textContent = product.title;
                    titleLink.style.cssText = `
                    color: #007185;
                    text-decoration: none;
                    font-size: 14px;
                    display: block;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                `;
                    titleLink.addEventListener('click', (e) => {
                        e.stopPropagation();
                        window.location.href = product.searchUrl;
                    });

                    titleContainer.appendChild(titleLink);
                    item.appendChild(imgContainer);
                    item.appendChild(titleContainer);

                    // Product page button (right side)
                    if (product.productUrl) {
                        const buttonContainer = document.createElement('div');
                        buttonContainer.style.cssText = `
                        margin-left: 12px;
                        flex-shrink: 0;
                    `;

                        const productBtn = document.createElement('a');
                        productBtn.href = product.productUrl;
                        productBtn.target = '_blank';
                        productBtn.rel = 'noopener';
                        productBtn.textContent = 'View';
                        productBtn.className = 'vine-autocomplete-view-btn';
                        productBtn.style.cssText = `
                        padding: 6px 12px;
                        background: #ffce12;
                        color: #000;
                        text-decoration: none;
                        border-radius: 4px;
                        font-size: 13px;
                        font-weight: 500;
                        display: inline-block;
                        transition: background 0.2s;
                    `;
                        // Only add hover styles if not in dark theme (dark theme uses CSS)
                        const isDarkTheme = document.body.classList.contains('amazon-vine-dark-theme') ||
                            document.body.classList.contains('dark') ||
                            document.documentElement.classList.contains('dark');
                        if (!isDarkTheme) {
                            productBtn.addEventListener('mouseenter', () => {
                                productBtn.style.background = '#f0c14b';
                            });
                            productBtn.addEventListener('mouseleave', () => {
                                productBtn.style.background = '#ffce12';
                            });
                        }
                        productBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                        });

                        buttonContainer.appendChild(productBtn);
                        item.appendChild(buttonContainer);
                    }

                    dropdown.appendChild(item);
                });

                // Setup infinite scroll if there are more results
                if (hasMoreResults) {
                    setupInfiniteScroll();
                }

                // Update position before showing (in case search bar moved)
                updateDropdownPosition();
                showDropdown();
            }

            // Setup infinite scroll for dropdown
            function setupInfiniteScroll() {
                if (!dropdown) return;

                // Remove existing scroll listener if any
                const existingHandler = dropdown._scrollHandler;
                if (existingHandler) {
                    dropdown.removeEventListener('scroll', existingHandler);
                }

                // Create throttled scroll handler
                let scrollTimeout = null;
                const scrollHandler = () => {
                    if (scrollTimeout) return;
                    scrollTimeout = setTimeout(() => {
                        handleDropdownScroll();
                        scrollTimeout = null;
                    }, 100); // Throttle to every 100ms
                };

                // Store handler reference for cleanup
                dropdown._scrollHandler = scrollHandler;

                // Add scroll listener
                dropdown.addEventListener('scroll', scrollHandler);
            }

            // Handle dropdown scroll for infinite loading
            async function handleDropdownScroll() {
                if (!dropdown || isLoadingMore || !hasMoreResults) return;

                const scrollTop = dropdown.scrollTop;
                const scrollHeight = dropdown.scrollHeight;
                const clientHeight = dropdown.clientHeight;

                // Load more when user is 50px from bottom
                if (scrollTop + clientHeight >= scrollHeight - 50) {
                    isLoadingMore = true;

                    // Show loading indicator
                    const loadingIndicator = document.createElement('div');
                    loadingIndicator.className = 'vine-autocomplete-loading';
                    loadingIndicator.innerHTML = '<div style="padding: 12px; text-align: center; color: #888; font-size: 13px;">Loading more...</div>';
                    dropdown.appendChild(loadingIndicator);

                    try {
                        currentPage++;
                        const result = await fetchSearchResults(currentSearchQuery, currentPage);

                        if (result.products && result.products.length > 0) {
                            // Remove loading indicator
                            loadingIndicator.remove();

                            // Render new results
                            renderDropdown(result.products, currentSearchQuery, true);
                            hasMoreResults = result.hasMore;
                        } else {
                            loadingIndicator.remove();
                            hasMoreResults = false;
                        }
                    } catch (error) {
                        console.error('Vine Modernized: Error loading more results:', error);
                        loadingIndicator.remove();
                        hasMoreResults = false;
                    } finally {
                        isLoadingMore = false;
                    }
                }
            }

            // Perform search
            async function performSearch(query) {
                if (!query || query.length < MIN_QUERY_LENGTH) {
                    hideDropdown();
                    return;
                }

                currentSearchQuery = query;
                currentPage = 1;
                isLoadingMore = false;

                const result = await fetchSearchResults(query, 1);
                hasMoreResults = result.hasMore;
                renderDropdown(result.products, query, false);
            }

            // Debounced search handler
            function handleSearchInput(e) {
                const query = e.target.value.trim();

                // Clear existing timeout
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }

                // Hide dropdown if query is too short
                if (query.length < MIN_QUERY_LENGTH) {
                    hideDropdown();
                    return;
                }

                // Set new timeout
                searchTimeout = setTimeout(() => {
                    performSearch(query);
                }, DEBOUNCE_DELAY);
            }

            // Close dropdown when clicking outside
            function handleClickOutside(e) {
                if (!dropdown) return;

                const { searchContainer } = getSearchContext();
                if (!searchContainer) return;

                if (!searchContainer.contains(e.target) && !dropdown.contains(e.target)) {
                    hideDropdown();
                }
            }

            // Initialize autocomplete
            function initAutocomplete() {
                const { searchInput, searchContainer } = getSearchContext();
                if (!searchInput) {
                    console.log('Vine Modernized: Search input not found, will retry...');
                    return false;
                }

                // Check if already initialized
                if (searchInput.dataset.autocompleteInitialized === 'true') {
                    return true;
                }

                if (!searchContainer) {
                    console.log('Vine Modernized: Search container not found');
                    return false;
                }

                // Create dropdown
                createDropdown();
                if (!dropdown) return false;

                // Position dropdown relative to search bar
                updateDropdownPosition();

                // Update position on window resize and scroll
                const updatePosition = () => updateDropdownPosition();
                window.addEventListener('resize', updatePosition);
                window.addEventListener('scroll', updatePosition, true);

                // Watch for search bar position changes (layout shifts)
                const positionObserver = new MutationObserver(() => {
                    updateDropdownPosition();
                });
                positionObserver.observe(searchContainer, {
                    attributes: true,
                    attributeFilter: ['style', 'class'],
                    childList: true,
                    subtree: true
                });

                ensureDropdownContainer(searchContainer);

                // Add input event listener
                searchInput.addEventListener('input', handleSearchInput);
                searchInput.addEventListener('focus', () => {
                    updateDropdownPosition(); // Update position on focus
                    if (searchInput.value.trim().length >= MIN_QUERY_LENGTH && dropdown.children.length > 0) {
                        showDropdown();
                    }
                });

                // Handle Escape key
                searchInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && dropdown) {
                        hideDropdown();
                    }
                });

                // Close dropdown on outside click
                document.addEventListener('click', handleClickOutside);

                // Mark as initialized
                searchInput.dataset.autocompleteInitialized = 'true';

                console.log('Vine Modernized: Search autocomplete initialized');
                return true;
            }

            // Wait for search input to appear and initialize
            function waitForSearchInput(attempt = 0) {
                if (initAutocomplete()) {
                    return;
                }

                if (attempt < 20) {
                    setTimeout(() => waitForSearchInput(attempt + 1), 250);
                } else {
                    console.warn('Vine Modernized: Could not find search input after retries');
                }
            }

            // Start initialization
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => waitForSearchInput());
            } else {
                waitForSearchInput();
            }

            // Re-initialize after dynamic page updates (e.g., tab switches)
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1) {
                                const searchInput = node.querySelector ? node.querySelector(
                                    `#${VM_SEARCH_IN_TABS_CONTAINER_ID} input[type="search"], ` +
                                    `.vvp-container-search input[type="search"]`
                                ) : null;
                                if (searchInput && searchInput.dataset.autocompleteInitialized !== 'true') {
                                    setTimeout(() => waitForSearchInput(), 100);
                                }
                            }
                        });
                    }
                });
            });

            observer.observe(document.body, { childList: true, subtree: true });

            console.log('Vine Modernized: Search autocomplete feature loaded');
        })();

        // --- PARTIAL PAGE UPDATE FOR CATEGORY FILTERS (robust version) ---
        const FILTER_COLLAPSE_STORAGE_KEY = 'vh_filter_collapsed';
        const FILTER_COLLAPSED_HEIGHT = 20;
        const FILTER_TOGGLE_ID = 'vh-filter-toggle';
        const FILTER_TOGGLE_TRANSITION_MS = 400;
        const FILTER_GRID_TRANSITION_MS = 400;
        let filterToggleLabelTimeout = null;
        let filterSequenceTimeout = null;
        let filterGridTimeout = null;

        function isFilterCollapsed() {
            return localStorage.getItem(FILTER_COLLAPSE_STORAGE_KEY) === 'true';
        }

        function setFilterCollapsedPreference(value) {
            localStorage.setItem(FILTER_COLLAPSE_STORAGE_KEY, value ? 'true' : 'false');
        }

        function updateFilterToggleLabel(toggleLink, collapsed) {
            if (!toggleLink) return;
            toggleLink.textContent = collapsed ? 'Show categories' : 'Collapse';
        }

        function applyFilterGridCollapsedState(collapsed) {
            if (collapsed) {
                document.body.setAttribute('data-vh-filter-grid-collapsed', 'true');
            } else {
                document.body.removeAttribute('data-vh-filter-grid-collapsed');
            }
        }

        function applyFilterCollapsedState(collapsed, options = {}) {
            const { animate = false } = options;
            const filterContainer = document.getElementById('vvp-filter-container');
            if (!filterContainer) return;

            if (!animate) {
                if (collapsed) {
                    document.body.setAttribute('data-vh-filter-collapsed', 'true');
                    filterContainer.style.height = `${FILTER_COLLAPSED_HEIGHT}px`;
                } else {
                    document.body.removeAttribute('data-vh-filter-collapsed');
                    filterContainer.style.height = '';
                }
                return;
            }

            const startHeight = filterContainer.getBoundingClientRect().height;
            filterContainer.style.height = `${startHeight}px`;

            if (collapsed) {
                requestAnimationFrame(() => {
                    document.body.setAttribute('data-vh-filter-collapsed', 'true');
                    filterContainer.style.height = `${FILTER_COLLAPSED_HEIGHT}px`;
                });
            } else {
                document.body.removeAttribute('data-vh-filter-collapsed');
                const targetHeight = filterContainer.scrollHeight;
                requestAnimationFrame(() => {
                    filterContainer.style.height = `${targetHeight}px`;
                });
            }

            const handleTransitionEnd = (event) => {
                if (event.propertyName !== 'height') return;
                if (!collapsed) {
                    filterContainer.style.height = '';
                }
                filterContainer.removeEventListener('transitionend', handleTransitionEnd);
            };
            filterContainer.addEventListener('transitionend', handleTransitionEnd);
        }

        function handleFilterToggleClick(event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            const toggleLink = event.currentTarget;
            const nextCollapsed = !isFilterCollapsed();

            setFilterCollapsedPreference(nextCollapsed);
            if (filterSequenceTimeout) {
                clearTimeout(filterSequenceTimeout);
            }
            if (filterGridTimeout) {
                clearTimeout(filterGridTimeout);
            }
            if (filterToggleLabelTimeout) {
                clearTimeout(filterToggleLabelTimeout);
            }

            if (nextCollapsed) {
                applyFilterCollapsedState(true, { animate: true });
                filterGridTimeout = setTimeout(() => {
                    applyFilterGridCollapsedState(true);
                }, FILTER_TOGGLE_TRANSITION_MS);
            } else {
                applyFilterGridCollapsedState(false);
                filterSequenceTimeout = setTimeout(() => {
                    applyFilterCollapsedState(false, { animate: true });
                }, FILTER_GRID_TRANSITION_MS);
            }

            filterToggleLabelTimeout = setTimeout(() => {
                updateFilterToggleLabel(toggleLink, nextCollapsed);
            }, FILTER_TOGGLE_TRANSITION_MS + FILTER_GRID_TRANSITION_MS);
        }

        function injectFilterCollapseToggle() {
            const nodesContainer = document.getElementById('vvp-browse-nodes-container');
            if (!nodesContainer) return;
            const headerRow = nodesContainer.querySelector('p');
            if (!headerRow) return;

            let toggleLink = headerRow.querySelector(`#${FILTER_TOGGLE_ID}`);
            if (!toggleLink) {
                toggleLink = document.createElement('a');
                toggleLink.id = FILTER_TOGGLE_ID;
                toggleLink.className = 'a-link-normal';
                toggleLink.href = '#';
                toggleLink.addEventListener('click', handleFilterToggleClick);
                headerRow.appendChild(toggleLink);
            }

            const collapsed = isFilterCollapsed();
            updateFilterToggleLabel(toggleLink, collapsed);
            applyFilterCollapsedState(collapsed, { animate: false });
            applyFilterGridCollapsedState(collapsed);
        }

        function enablePartialCategoryUpdates() {
            const nodesContainer = document.getElementById('vvp-browse-nodes-container');
            if (!nodesContainer) return;
            if (nodesContainer.dataset.vhPartialCategoryUpdates === 'true') return;
            nodesContainer.dataset.vhPartialCategoryUpdates = 'true';

            nodesContainer.addEventListener('click', function (e) {
                // Only handle left-clicks without modifier keys
                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                const link = e.target.closest('a.a-link-normal');
                if (!link || !link.href || link.target === '_blank') return;
                if (link.id === FILTER_TOGGLE_ID) return;
                if (link.origin !== location.origin) return;

                e.preventDefault();

                // Optional: show loading indicator
                const gridContainer = document.getElementById('vvp-items-grid-container');
                if (gridContainer) {
                    gridContainer.style.opacity = '0.5';
                }

                fetch(link.href)
                    .then(res => res.text())
                    .then(html => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const newGrid = doc.getElementById('vvp-items-grid-container');
                        if (newGrid && gridContainer) {
                            gridContainer.replaceWith(newGrid);
                            history.pushState(null, '', link.href);
                        }
                    })
                    .catch(err => {
                        alert('Failed to load category. Please try again.');
                        console.error('Partial update error:', err);
                    })
                    .finally(() => {
                        if (gridContainer) {
                            gridContainer.style.opacity = '';
                        }
                    });
            });
        }

        // Wait for DOM and sidebar to exist
        function waitForCategorySidebarAndEnable(attempt = 0) {
            if (document.getElementById('vvp-browse-nodes-container') && document.getElementById('vvp-items-grid-container')) {
                enablePartialCategoryUpdates();
                injectFilterCollapseToggle();
            } else if (attempt < 20) {
                setTimeout(() => waitForCategorySidebarAndEnable(attempt + 1), 250);
            }
        }
        window.vineWaitForCategorySidebarAndEnable = waitForCategorySidebarAndEnable;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => waitForCategorySidebarAndEnable());
        } else {
            waitForCategorySidebarAndEnable();
        }

        // --- PARTIAL PAGE UPDATE FOR TAB BUTTONS ---
        function enablePartialTabUpdates() {
            let isTabLoading = false; // Throttle flag
            let lastTabHandler = null;
            function attachHandler() {
                const tabContainer = document.getElementById('vvp-items-button-container');
                const sectionContainer = document.querySelector('.a-section.vvp-items-container');
                if (!tabContainer || !sectionContainer) return;

                // Remove previous handler if any
                if (lastTabHandler) tabContainer.removeEventListener('click', lastTabHandler);
                lastTabHandler = function (e) {
                    if (isTabLoading) return; // Prevent rapid clicks
                    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                    const link = e.target.closest('a');
                    if (!link || !link.getAttribute('href') || link.target === '_blank') return;

                    // Robust URL resolution
                    const url = new URL(link.getAttribute('href'), window.location.href).toString();

                    if (url.indexOf(location.origin) !== 0) return;

                    e.preventDefault();

                    isTabLoading = true;
                    sectionContainer.style.opacity = '0.5';

                    fetch(url, { credentials: 'same-origin' })
                        .then(res => res.text())
                        .then(html => {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, 'text/html');
                            const newSection = doc.querySelector('.a-section.vvp-items-container');
                            if (newSection) {
                                sectionContainer.replaceWith(newSection);
                                history.pushState(null, '', url);

                                // Update button state
                                document.querySelectorAll('#vvp-items-button-container .a-button').forEach(btn => {
                                    btn.classList.remove('a-button-selected');
                                });
                                // Find the button whose link matches the new URL (ignoring query order)
                                const newActive = Array.from(document.querySelectorAll('#vvp-items-button-container a')).find(a => {
                                    try {
                                        return new URL(a.getAttribute('href'), window.location.href).toString() === url;
                                    } catch { return false; }
                                });
                                if (newActive) {
                                    newActive.closest('.a-button').classList.add('a-button-selected');
                                }

                                // Re-initialize tab-dependent features
                                reinitializeTabFeatures();
                                // Re-attach the handler since the container was replaced
                                setTimeout(attachHandler, 0);
                            }
                        })
                        .catch(err => {
                            alert('Failed to load tab. Please try again.');
                            console.error('Partial tab update error:', err);
                        })
                        .finally(() => {
                            sectionContainer.style.opacity = '';
                            isTabLoading = false;
                        });
                };
                tabContainer.addEventListener('click', lastTabHandler);
            }

            // Initial attach
            attachHandler();
        }

        // Wait for DOM and tab container to exist
        function waitForTabContainerAndEnable(attempt = 0) {
            if (document.getElementById('vvp-items-button-container') && document.querySelector('.a-section.vvp-items-container')) {
                enablePartialTabUpdates();
            } else if (attempt < 20) {
                setTimeout(() => waitForTabContainerAndEnable(attempt + 1), 250);
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => waitForTabContainerAndEnable());
        } else {
            waitForTabContainerAndEnable();
        }

        // =============================
        // Vine Helper related elements
        // =============================

        // Add a data-hash attribute to <body> for CSS targeting
        function updateBodyHashAttr() {
            if (window.location.hash) {
                document.body.setAttribute('data-hash', window.location.hash.replace(/^#/, ''));
            } else {
                document.body.removeAttribute('data-hash');
            }
        }

        // Add a data-queue attribute to <body> for CSS targeting (e.g. queue=potluck)
        function updateBodyQueueAttr() {
            const queue = new URLSearchParams(window.location.search).get('queue');
            if (queue) {
                document.body.setAttribute('data-queue', queue);
            } else {
                document.body.removeAttribute('data-queue');
            }
        }
        window.addEventListener('hashchange', updateBodyHashAttr);
        window.addEventListener('hashchange', updateBodyQueueAttr);
        window.addEventListener('popstate', updateBodyQueueAttr);
        updateBodyHashAttr();
        updateBodyQueueAttr();

        // =============================
        // User Tier: Orders counter
        // =============================
        // Appends "[Orders: x/y]" to #user-tier-info, where:
        // - x = number of orders placed today (from /vine/orders table)
        // - y = tier daily max (Silver=3, Gold=8)
        (function initUserTierOrdersCounter() {
            const ORDERS_EL_ID = 'vh-orders-info';
            const CACHE_KEY = 'vh_orders_today_cache_v1';
            const CACHE_MAX_AGE_MS = 30 * 1000;
            const CLICK_TRIGGER_DELAY_MS = 30 * 1000; // fetch/update 30s after order action click

            // Cooldown / rate limit for auto refreshes (tweak as desired)
            const AUTO_REFRESH_MAX_PER_WINDOW = 3;
            const AUTO_REFRESH_WINDOW_MS = 2 * 60 * 1000;

            let inFlightRefresh = null;
            let lastDayKey = null;
            let pendingAutoRefreshTimer = null;
            let pendingAutoRefreshReason = 'order-action';
            let autoRefreshHistory = []; // timestamps of started refreshes (in-memory)

            function pad2(n) {
                return String(n).padStart(2, '0');
            }

            function formatLocalYyyyMmDd(date) {
                return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
            }

            function getTodayKey() {
                return formatLocalYyyyMmDd(new Date());
            }

            function getTierMaxFromTierInfo(tierInfoEl) {
                if (!tierInfoEl) return null;
                const text = (tierInfoEl.textContent || '').toLowerCase();
                if (text.includes('silver') || tierInfoEl.querySelector('.vh-icon-medal-silver')) return 3;
                if (text.includes('gold') || tierInfoEl.querySelector('.vh-icon-medal-gold')) return 8;
                return null;
            }

            function getOrdersEl() {
                const tierInfoEl = document.getElementById('user-tier-info');
                if (!tierInfoEl) return null;
                return tierInfoEl.querySelector(`#${ORDERS_EL_ID}`);
            }

            function ensureOrdersEl() {
                const tierInfoEl = document.getElementById('user-tier-info');
                if (!tierInfoEl) return null;

                let ordersEl = tierInfoEl.querySelector(`#${ORDERS_EL_ID}`);
                if (!ordersEl) {
                    ordersEl = document.createElement('span');
                    ordersEl.id = ORDERS_EL_ID;
                    ordersEl.title = 'Today’s Vine orders count';
                    tierInfoEl.appendChild(ordersEl);
                }

                const max = getTierMaxFromTierInfo(tierInfoEl);
                if (!ordersEl.textContent || !ordersEl.textContent.includes('[Orders:')) {
                    ordersEl.textContent = ` [Orders: —/${max ?? '—'}]`;
                } else if (max != null && /\/[—?]?\]/.test(ordersEl.textContent)) {
                    ordersEl.textContent = ordersEl.textContent.replace(/\/[—?]?\]/, `/${max}]`);
                }

                return ordersEl;
            }

            function readCache() {
                try {
                    const raw = localStorage.getItem(CACHE_KEY);
                    if (!raw) return null;
                    const parsed = JSON.parse(raw);
                    if (!parsed || typeof parsed !== 'object') return null;
                    if (typeof parsed.dayKey !== 'string') return null;
                    if (typeof parsed.count !== 'number') return null;
                    if (typeof parsed.updatedAt !== 'number') return null;
                    return parsed;
                } catch {
                    return null;
                }
            }

            function writeCache(dayKey, count) {
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify({ dayKey, count, updatedAt: Date.now() }));
                } catch { }
            }

            function clearCache() {
                try {
                    localStorage.removeItem(CACHE_KEY);
                } catch { }
            }

            function parseOrdersCountTodayFromHtml(htmlText, todayKey) {
                try {
                    const doc = new DOMParser().parseFromString(htmlText, 'text/html');
                    const table = doc.querySelector('table.a-normal.vvp-orders-table');
                    if (!table) return 0;

                    const cells = Array.from(table.querySelectorAll('tr.vvp-orders-table--row td[data-order-timestamp]'));
                    let count = 0;
                    for (const td of cells) {
                        const tsRaw = td.getAttribute('data-order-timestamp');
                        const ts = Number(tsRaw);
                        if (Number.isFinite(ts)) {
                            const day = formatLocalYyyyMmDd(new Date(ts));
                            if (day === todayKey) count += 1;
                            continue;
                        }
                        const textDate = (td.textContent || '').trim();
                        if (textDate === todayKey) count += 1;
                    }
                    return count;
                } catch (err) {
                    console.warn('Vine Modernized: Failed to parse /vine/orders for daily order count', err);
                    return 0;
                }
            }

            async function fetchOrdersCountToday() {
                const todayKey = getTodayKey();
                const url = new URL('/vine/orders', window.location.origin);
                const res = await fetch(url.toString(), { credentials: 'include' });
                if (!res.ok) throw new Error(`Failed to fetch orders page: ${res.status}`);
                const htmlText = await res.text();
                return { todayKey, count: parseOrdersCountTodayFromHtml(htmlText, todayKey) };
            }

            async function refreshOrdersInfo({ force = false, reason = '' } = {}) {
                const ordersEl = ensureOrdersEl();
                const tierInfoEl = document.getElementById('user-tier-info');
                if (!ordersEl || !tierInfoEl) return;

                const max = getTierMaxFromTierInfo(tierInfoEl);
                const todayKey = getTodayKey();
                lastDayKey = todayKey;

                if (!force) {
                    const cached = readCache();
                    if (cached && cached.dayKey === todayKey && (Date.now() - cached.updatedAt) <= CACHE_MAX_AGE_MS) {
                        ordersEl.textContent = ` [Orders: ${cached.count}/${max ?? '—'}]`;
                        return;
                    }
                }

                if (inFlightRefresh) {
                    try {
                        const result = await inFlightRefresh;
                        ordersEl.textContent = ` [Orders: ${result.count}/${max ?? '—'}]`;
                    } catch { }
                    return;
                }

                ordersEl.textContent = ` [Orders: …/${max ?? '—'}]`;

                inFlightRefresh = (async () => {
                    const result = await fetchOrdersCountToday();
                    writeCache(result.todayKey, result.count);
                    return result;
                })();

                try {
                    const result = await inFlightRefresh;
                    ordersEl.textContent = ` [Orders: ${result.count}/${max ?? '—'}]`;
                } catch (err) {
                    console.warn('Vine Modernized: Failed to refresh orders info', { reason, err });
                    ordersEl.textContent = ` [Orders: ?/${max ?? '—'}]`;
                } finally {
                    inFlightRefresh = null;
                }
            }

            function pruneAutoRefreshHistory(now = Date.now()) {
                const cutoff = now - AUTO_REFRESH_WINDOW_MS;
                autoRefreshHistory = autoRefreshHistory.filter(ts => ts >= cutoff);
            }

            function canStartAutoRefresh(now = Date.now()) {
                pruneAutoRefreshHistory(now);
                return autoRefreshHistory.length < AUTO_REFRESH_MAX_PER_WINDOW;
            }

            async function runAutoRefresh(reason = 'order-action') {
                // If a refresh is already in flight, join it (don’t count against the cooldown).
                if (inFlightRefresh) {
                    try { await refreshOrdersInfo({ force: true, reason }); } catch { }
                    return;
                }

                const now = Date.now();
                if (!canStartAutoRefresh(now)) {
                    console.log('Vine Modernized: Orders auto-refresh rate-limited', {
                        windowMs: AUTO_REFRESH_WINDOW_MS,
                        max: AUTO_REFRESH_MAX_PER_WINDOW
                    });
                    return;
                }

                autoRefreshHistory.push(now);
                try { await refreshOrdersInfo({ force: true, reason }); } catch { }
            }

            function scheduleRefreshAfterOrderAttempt(reason = 'order-action') {
                pendingAutoRefreshReason = reason || 'order-action';
                if (pendingAutoRefreshTimer) {
                    clearTimeout(pendingAutoRefreshTimer);
                    pendingAutoRefreshTimer = null;
                }
                pendingAutoRefreshTimer = window.setTimeout(() => {
                    pendingAutoRefreshTimer = null;
                    runAutoRefresh(pendingAutoRefreshReason);
                }, CLICK_TRIGGER_DELAY_MS);
            }

            function handleGlobalClickCapture(e) {
                const target = e.target instanceof Element ? e.target : null;
                if (!target) return;

                const isBuyNow = !!target.closest('.vvp-buy-now-btn');
                if (isBuyNow) {
                    scheduleRefreshAfterOrderAttempt('order-action');
                    return;
                }

                const isRequest = !!target.closest(
                    '#vvp-product-details-modal--request-btn,' +
                    ' #vvp-product-details-modal--request-btn .a-button-input,' +
                    ' [data-action="vvp-request-product"]'
                );
                if (isRequest) {
                    scheduleRefreshAfterOrderAttempt('order-action');
                }
            }

            function startTierInfoWatcher() {
                const tryInit = () => {
                    const tierInfoEl = document.getElementById('user-tier-info');
                    if (!tierInfoEl) return false;

                    ensureOrdersEl();

                    // Re-ensure our appended node if Vine Helper rewrites the span contents
                    if (!tierInfoEl._vhOrdersObserver) {
                        const obs = new MutationObserver(() => ensureOrdersEl());
                        obs.observe(tierInfoEl, { childList: true, subtree: true });
                        tierInfoEl._vhOrdersObserver = obs;
                    }

                    refreshOrdersInfo({ force: false, reason: 'init' }).catch(() => { });
                    return true;
                };

                if (tryInit()) return;

                const obs = new MutationObserver(() => {
                    if (tryInit()) obs.disconnect();
                });
                obs.observe(document.body, { childList: true, subtree: true });
            }

            function checkDayRollover() {
                const todayKey = getTodayKey();
                if (lastDayKey && todayKey !== lastDayKey) {
                    clearCache();
                    const ordersEl = ensureOrdersEl();
                    if (ordersEl) {
                        const tierInfoEl = document.getElementById('user-tier-info');
                        const max = getTierMaxFromTierInfo(tierInfoEl);
                        ordersEl.textContent = ` [Orders: —/${max ?? '—'}]`;
                    }
                    refreshOrdersInfo({ force: true, reason: 'day-rollover' }).catch(() => { });
                }
                lastDayKey = todayKey;
            }

            document.addEventListener('click', handleGlobalClickCapture, true);
            startTierInfoWatcher();
            lastDayKey = getTodayKey();
            window.setInterval(checkDayRollover, 60 * 1000);
            window.addEventListener('focus', checkDayRollover);
        })();

        // Move Notification Monitor header elements into the main card for #monitor (robust version)
        function moveMonitorHeaderElements(attempt = 0) {
            if (window.location.hash !== '#monitor') return;
            const ui = document.getElementById('vh-notifications-monitor-header-ui');
            if (!ui) return;
            // Do not rearrange while minimized to avoid ping-pong with the mini bar mover
            if (ui.classList && (ui.classList.contains('vh-barminimized') || ui.classList.contains('vh-minimized') || ui.classList.contains('vh-header-minimized'))) {
                return;
            }
            const card = document.querySelector('#vh-notifications-monitor-header-ui > div[style*="flex-grow: 1"]');
            const icon = document.querySelector('#vh-notifications-monitor-header .vh-icon-48.vh-icon-vh-48');
            const h2 = document.querySelector('#vh-notifications-monitor-header h2');
            const tier = document.querySelector('#vh-notifications-monitor-header #user-tier-info');
            const statsCol = card && card.querySelector('div[style*="flex: 1 1 200px"]');
            const filters = document.querySelector('#vh-notifications-monitor-header-ui > #vh-nm-filters');
            if (!card || !icon || !h2 || !tier || !statsCol || !filters) {
                if (attempt < 20) setTimeout(() => moveMonitorHeaderElements(attempt + 1), 100);
                return;
            }
            // Create or find the header row
            let headerRow = card.querySelector('.vh-header-row');
            if (!headerRow) {
                headerRow = document.createElement('div');
                headerRow.className = 'vh-header-row';
                card.prepend(headerRow);
            }
            // Move icon and h2 into header row
            if (icon.parentNode !== headerRow) headerRow.appendChild(icon);
            if (h2.parentNode !== headerRow) headerRow.appendChild(h2);
            normalizeMonitorHeaderRowOrder(headerRow);
            // Move user tier info into the left stats column
            if (tier.parentNode !== statsCol) statsCol.appendChild(tier);
            // Move the filter card to the very bottom of the main card
            if (filters.parentNode !== card || card.lastElementChild !== filters) {
                card.appendChild(filters);
            }
        }

        function normalizeMonitorHeaderRowOrder(headerRow) {
            try {
                if (!headerRow) return;
                const icon = document.querySelector('#vh-notifications-monitor-header .vh-icon-48.vh-icon-vh-48');
                const title = document.querySelector('#vh-notifications-monitor-header h2');

                if (icon && icon.parentNode === headerRow) headerRow.prepend(icon);
                if (title && title.parentNode === headerRow) {
                    const afterIcon = (icon && icon.parentNode === headerRow) ? icon.nextSibling : headerRow.firstChild;
                    if (afterIcon !== title) headerRow.insertBefore(title, afterIcon);
                }
                // Tile controls are now in a-tabs, not in header row
            } catch { /* no-op */ }
        }
        // MutationObserver to re-run move logic if header UI changes
        function observeMonitorHeaderUI() {
            const headerUI = document.getElementById('vh-notifications-monitor-header-ui');
            if (!headerUI) {
                setTimeout(observeMonitorHeaderUI, 200);
                return;
            }
            // Attach only once per headerUI
            if (headerUI._vhHeaderObserver) return;

            // Debounce mover to avoid storms
            const scheduleMove = () => {
                if (headerUI._vhHeaderMoveScheduled) return;
                headerUI._vhHeaderMoveScheduled = true;
                setTimeout(() => {
                    headerUI._vhHeaderMoveScheduled = false;
                    try { moveMonitorHeaderElements(); } catch { }
                }, 80);
            };

            const observer = new MutationObserver(() => scheduleMove());
            observer.observe(headerUI, { childList: true, subtree: true });
            headerUI._vhHeaderObserver = observer;
        }
        window.addEventListener('DOMContentLoaded', () => {
            moveMonitorHeaderElements();
            observeMonitorHeaderUI();
        });
        window.addEventListener('hashchange', () => {
            moveMonitorHeaderElements();
            observeMonitorHeaderUI();
        });
        setTimeout(() => {
            moveMonitorHeaderElements();
            observeMonitorHeaderUI();
        }, 1000);


        // =============================
        // Monitor Header: Mini Bar (minimized-only dedicated strip)
        // =============================
        (function initMonitorMiniBar() {
            const MIN_KEY = 'vine_nm_header_barminimized';
            const MIN_CLASS = 'vh-barminimized';
            const LEGACY_MIN_CLASSES = ['vh-minimized', 'vh-header-minimized'];
            const ALL_MIN_CLASSES = [MIN_CLASS, ...LEGACY_MIN_CLASSES];

            // WeakMaps to remember original positions for restoration
            const originParent = new WeakMap();
            const originNext = new WeakMap();
            // Track the exact control groups moved into the mini bar so we can restore them reliably
            let movedGroups = [];

            function getHeaderUI() {
                if (window.location.hash !== '#monitor') return null;
                return document.getElementById('vh-notifications-monitor-header-ui');
            }

            function prefersReducedMotion() {
                try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
            }

            function rememberOrigin(node) {
                if (!node || originParent.has(node)) return;
                const p = node.parentNode || null;
                const n = node.nextSibling || null;
                originParent.set(node, p);
                originNext.set(node, n);
            }

            function restoreNode(node) {
                const p = originParent.get(node);
                const n = originNext.get(node);
                if (p) {
                    try {
                        if (n && n.parentNode === p) {
                            p.insertBefore(node, n);
                        } else {
                            p.appendChild(node);
                        }
                    } catch { p.appendChild(node); }
                }
            }

            function moveWithFade(node, target, before = null) {
                // Move a node while applying a lightweight fade/slide-in animation.
                if (!node || !target) return;

                const reduce = prefersReducedMotion();

                // Move first (so the element ends up in the correct place deterministically).
                if (before && before.parentNode === target) target.insertBefore(node, before);
                else target.appendChild(node);

                if (reduce) return;

                const DURATION_MS = 400;
                const EASING = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

                // Preserve any CSS transform that may already apply in the destination (e.g., scaled icons).
                let baseTransform = 'none';
                try { baseTransform = getComputedStyle(node).transform || 'none'; } catch { }

                const fromTransform = baseTransform === 'none'
                    ? 'translateY(-4px)'
                    : `${baseTransform} translateY(-4px)`;

                // Prefer WAAPI so we don't leave inline styles behind.
                try {
                    if (typeof node.animate === 'function') {
                        try { node._vhMoveAnim?.cancel?.(); } catch { }
                        const anim = node.animate(
                            [
                                { opacity: 0, transform: fromTransform },
                                { opacity: 1, transform: baseTransform }
                            ],
                            { duration: DURATION_MS, easing: EASING, fill: 'both' }
                        );
                        node._vhMoveAnim = anim;
                        anim.finished.finally(() => {
                            try { anim.cancel(); } catch { }
                            try { if (node._vhMoveAnim === anim) delete node._vhMoveAnim; } catch { }
                        });
                        return;
                    }
                } catch { /* fall through */ }

                // Fallback: CSS transition via inline styles (cleaned up after).
                try {
                    node.style.willChange = 'opacity, transform';
                    node.style.transition = `opacity ${DURATION_MS}ms ${EASING}, transform ${DURATION_MS}ms ${EASING}`;
                    node.style.opacity = '0';
                    node.style.transform = fromTransform;
                    // Force reflow then animate to the final state
                    node.getBoundingClientRect();
                    node.style.opacity = '1';
                    node.style.transform = baseTransform;
                    setTimeout(() => {
                        node.style.transition = '';
                        node.style.willChange = '';
                        node.style.opacity = '';
                        node.style.transform = '';
                    }, DURATION_MS + 60);
                } catch { /* ignore */ }
            }

            function ensureMiniBarSkeleton() {
                const ui = getHeaderUI();
                if (!ui) return null;
                let bar = ui.querySelector('#vh-mini-bar');
                if (!bar) {
                    bar = document.createElement('div');
                    bar.id = 'vh-mini-bar';
                    bar.className = 'vh-mini-bar';
                    bar.style.display = 'none'; // visible only when minimized via CSS
                    const brand = document.createElement('div');
                    brand.className = 'vh-mini-brand';
                    const actions = document.createElement('div');
                    actions.className = 'vh-mini-actions';
                    const search = document.createElement('div');
                    search.className = 'vh-mini-search';
                    const status = document.createElement('div');
                    status.className = 'vh-mini-status';
                    bar.appendChild(brand);
                    bar.appendChild(actions);
                    bar.appendChild(search);
                    bar.appendChild(status);
                    ui.appendChild(bar);
                }
                // Mark ready so minimized CSS won’t hide content before skeleton exists
                ui.classList.add('vh-mini-ready');
                return bar;
            }

            function queryNodes() {
                const icon = document.querySelector('#vh-notifications-monitor-header .vh-icon-48.vh-icon-vh-48');
                const title = document.querySelector('#vh-notifications-monitor-header h2');
                const controlsGrid = document.querySelector('#vh-notifications-monitor-header-ui .vh-notification-monitor-controls');
                const groups = controlsGrid ? Array.from(controlsGrid.querySelectorAll('.vh-control-group')).slice(0, 2) : [];
                const searchInput = document.getElementById('search-input');
                let searchLabel = null;
                if (searchInput) {
                    // Try to find a preceding label node within the same container
                    const parent = searchInput.parentElement;
                    if (parent) {
                        const maybeLabel = parent.querySelector('label');
                        if (maybeLabel && maybeLabel.contains(searchInput) === false) {
                            searchLabel = maybeLabel;
                        } else if (searchInput.previousElementSibling && searchInput.previousElementSibling.tagName === 'LABEL') {
                            searchLabel = searchInput.previousElementSibling;
                        }
                    }
                }
                const statusSW = document.getElementById('statusSW');
                const statusWS = document.getElementById('statusWS');
                return { icon, title, groups, searchInput, searchLabel, statusSW, statusWS };
            }

            function enterMiniBar() {
                const ui = getHeaderUI(); if (!ui) return;
                const bar = ensureMiniBarSkeleton(); if (!bar) return;
                const brand = bar.querySelector('.vh-mini-brand');
                const actions = bar.querySelector('.vh-mini-actions');
                const search = bar.querySelector('.vh-mini-search');
                const status = bar.querySelector('.vh-mini-status');
                const { icon, title, groups, searchInput, searchLabel, statusSW, statusWS } = queryNodes();

                if (icon) { rememberOrigin(icon); moveWithFade(icon, brand); }
                if (title) { rememberOrigin(title); moveWithFade(title, brand); }

                // Move first two control groups (entire groups, headers will be hidden by CSS inside the mini bar)
                movedGroups = [];
                groups.forEach(g => { if (g) { rememberOrigin(g); moveWithFade(g, actions); movedGroups.push(g); } });

                if (searchInput) {
                    rememberOrigin(searchInput);
                    // Ensure accessibility label when the original label might not move
                    if (!searchInput.getAttribute('aria-label')) searchInput.setAttribute('aria-label', 'Search');
                    moveWithFade(searchInput, search);
                }
                if (searchLabel) { rememberOrigin(searchLabel); moveWithFade(searchLabel, search); }

                if (statusSW) { rememberOrigin(statusSW); moveWithFade(statusSW, status); }
                if (statusWS) { rememberOrigin(statusWS); moveWithFade(statusWS, status); }
            }

            function exitMiniBar() {
                const { icon, title, /* groups (don't trust),*/ searchInput, searchLabel, statusSW, statusWS } = queryNodes();
                const toRestore = [icon, title, ...(movedGroups || []), searchLabel, searchInput, statusSW, statusWS];
                toRestore.forEach(n => { if (n) restoreNode(n); });
                movedGroups = [];
                normalizeMonitorHeaderRowOrder(getHeaderUI()?.querySelector?.('.vh-header-row'));
            }

            function applyMinState(minimized) {
                const ui = getHeaderUI(); if (!ui) return;
                const wasActive = ALL_MIN_CLASSES.some(c => ui.classList.contains(c));

                // If the requested state matches and classes are already consistent, bail out to avoid mutation loops
                if (minimized === wasActive) {
                    // One‑time normalization: if minimized but some classes are missing, add them; if expanded but any remain, remove them
                    let changed = false;
                    if (minimized) {
                        ALL_MIN_CLASSES.forEach(c => { if (!ui.classList.contains(c)) { ui.classList.add(c); changed = true; } });
                        if (!changed) return; // fully consistent and no need to move nodes again
                    } else {
                        ALL_MIN_CLASSES.forEach(c => { if (ui.classList.contains(c)) { ui.classList.remove(c); changed = true; } });
                        if (!changed) return; // fully consistent already
                    }
                    // If we fell through here, classes changed but overall state remains the same; avoid re-running moves to prevent thrash
                    return;
                }

                // State is actually changing → update classes and move/restore nodes
                if (minimized) {
                    ALL_MIN_CLASSES.forEach(c => ui.classList.add(c));
                    enterMiniBar();
                } else {
                    ALL_MIN_CLASSES.forEach(c => ui.classList.remove(c));
                    exitMiniBar();
                    // After restoring nodes, re-run header layout to ensure icon/title/controls are inside header
                    try { setTimeout(() => moveMonitorHeaderElements(), 0); } catch { }
                    try { setTimeout(() => moveMonitorHeaderElements(), 120); } catch { }
                }
            }

            function syncFromLegacyClasses() {
                const ui = getHeaderUI(); if (!ui) return;
                const minimized = LEGACY_MIN_CLASSES.some(c => ui.classList.contains(c)) || ui.classList.contains(MIN_CLASS);
                applyMinState(minimized);
            }

            function loadPersistedState() {
                try {
                    const val = localStorage.getItem(MIN_KEY);
                    return val === '1';
                } catch { return false; }
            }

            function savePersistedState(minimized) {
                try { localStorage.setItem(MIN_KEY, minimized ? '1' : '0'); } catch { }
            }

            function toggleMinState(explicit) {
                const ui = getHeaderUI(); if (!ui) return;
                const anyActive = ALL_MIN_CLASSES.some(c => ui.classList.contains(c));
                const targetState = (typeof explicit === 'boolean') ? explicit : !anyActive;
                applyMinState(targetState);
                savePersistedState(targetState);
                // Also mirror into legacy keys so they stay in sync
                try {
                    const s = targetState ? '1' : '0';
                    localStorage.setItem('vine_nm_header_minimized', s);
                    localStorage.setItem('vine_nm_header_minimized_bool', String(!!targetState));
                    localStorage.setItem('vine_monitor_minimized', targetState ? 'true' : 'false');
                } catch { }
            }

            function bindPill() {
                const ui = getHeaderUI(); if (!ui) return;
                const pill = document.getElementById('vh-header-minimize-pill');
                if (!pill || pill.dataset.vhMiniBarBound) return;
                pill.dataset.vhMiniBarBound = '1';
                pill.addEventListener('click', () => toggleMinState());
                // Toggle via Enter/Space
                pill.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMinState(); }
                });
            }

            function observeClassSync() {
                const ui = getHeaderUI(); if (!ui) return;
                if (ui._vhMiniBarObserver) return;
                const obs = new MutationObserver((muts) => {
                    for (const m of muts) {
                        if (m.type === 'attributes' && m.attributeName === 'class') {
                            syncFromLegacyClasses();
                            break;
                        }
                    }
                });
                obs.observe(ui, { attributes: true });
                ui._vhMiniBarObserver = obs;
            }

            // Expose a small public API so other parts (legacy minimize button) can toggle the mini bar
            if (!window.VHMiniBar) window.VHMiniBar = {};
            window.VHMiniBar.toggle = toggleMinState;
            window.VHMiniBar.set = applyMinState;
            window.VHMiniBar.isMinimized = function () {
                const ui = getHeaderUI();
                return !!(ui && ui.classList.contains(MIN_CLASS));
            };
            window.VHMiniBar.enter = enterMiniBar;
            window.VHMiniBar.exit = exitMiniBar;

            function boot(attempt = 0) {
                const ui = getHeaderUI();
                if (!ui) {
                    if (attempt < 30) setTimeout(() => boot(attempt + 1), 200);
                    return;
                }
                ensureMiniBarSkeleton();
                bindPill();
                observeClassSync();

                // Load and apply persisted state
                const persisted = loadPersistedState();
                applyMinState(persisted);
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', boot);
            } else {
                boot();
            }
            window.addEventListener('hashchange', () => setTimeout(boot, 50));
        })();


        // =============================
        // Monitor Settings: Toggle "Buy Now" button visibility
        // =============================
        (function initMonitorSettingsBuyNowToggle() {
            const KEY = 'vine_monitor_buy_now_enabled'; // '1' show (default), '0' hide

            // Some flows use `#monitor?` or other suffixes; treat any `#monitor...` as monitor mode.
            function onMonitor() { return (window.location.hash || '').toLowerCase().startsWith('#monitor'); }

            function isEnabled() {
                try {
                    const v = localStorage.getItem(KEY);
                    return v !== '0';
                } catch { return true; }
            }

            function setEnabled(enabled) {
                try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch { }
                applyBuyNowVisibility();
            }

            function isBuyNowElement(el) {
                if (!el || !(el instanceof HTMLElement)) return false;
                const id = (el.id || '').toLowerCase();
                const cls = (el.className || '').toString().toLowerCase();
                const tag = el.tagName;
                const type = (el.getAttribute('type') || '').toLowerCase();
                const val = (el.getAttribute('value') || '').toLowerCase();
                const text = (el.textContent || '').toLowerCase();
                // Known ids/classes
                if (id.includes('buy-now') || id.includes('buynow')) return true;
                if (cls.includes('buy-now') || cls.includes('buynow')) return true;
                // Our injected Buy Now control is a <span> with this class
                if (cls.includes('vvp-buy-now-btn')) return true;
                // Typical control elements
                if (tag === 'BUTTON' || tag === 'A' || (tag === 'INPUT' && (type === 'button' || type === 'submit'))) {
                    if (text.includes('buy now') || val.includes('buy now')) return true;
                }
                // Buttons inside the checkout form
                if (el.closest && el.closest('#vvp-checkout-buy-now')) return true;
                return false;
            }

            function queryBuyNowCandidates(root) {
                const scope = root || document;
                const nodes = Array.from(scope.querySelectorAll('button, a, input[type="button"], input[type="submit"], .vvp-buy-now-btn, form#vvp-checkout-buy-now input, form#vvp-checkout-buy-now button'));
                return nodes.filter(isBuyNowElement);
            }

            function applyBuyNowVisibility(root) {
                if (!onMonitor()) return;
                const show = isEnabled();
                const nodes = queryBuyNowCandidates(root);
                nodes.forEach(el => {
                    if (show) {
                        if (el.dataset.vhBuyNowHidden === '1') {
                            el.style.display = el.dataset.vhOriginalDisplay || '';
                            delete el.dataset.vhOriginalDisplay;
                            delete el.dataset.vhBuyNowHidden;
                        }
                    } else {
                        if (el.dataset.vhBuyNowHidden !== '1') {
                            el.dataset.vhOriginalDisplay = el.style.display || '';
                            el.style.display = 'none';
                            el.dataset.vhBuyNowHidden = '1';
                        }
                    }
                });
            }

            // Observe grid for dynamic changes
            let gridObserver = null;
            function observeItemsGrid() {
                if (!onMonitor()) return;
                const grid = document.getElementById('vvp-items-grid') || document.querySelector('[id*="items-grid"]');
                if (!grid) return;
                if (gridObserver) return;
                let scheduled = false;
                gridObserver = new MutationObserver(() => {
                    if (scheduled) return;
                    scheduled = true;
                    setTimeout(() => { scheduled = false; applyBuyNowVisibility(grid); }, 60);
                });
                gridObserver.observe(grid, { childList: true, subtree: true });
            }

            // Inject inline setting into existing Monitor Backup/Settings panel
            function injectSettingInline() {
                if (!onMonitor()) return false;
                const panel = document.getElementById('monitor-backup-panel-content');
                if (!panel) return false;
                const container = panel.querySelector('.backup-auto-section') || panel.querySelector('.backup-management-section') || panel;
                if (container.querySelector('#vh-setting-buy-now-inline')) return true;
                const label = document.createElement('label');
                label.id = 'vh-setting-buy-now-inline';
                label.className = 'backup-input-label';
                label.style.display = 'inline-flex';
                label.style.alignItems = 'center';
                label.style.gap = '8px';
                label.style.marginLeft = '8px';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.id = 'vh-setting-buy-now-inline-checkbox';
                input.checked = isEnabled();
                input.addEventListener('change', () => setEnabled(input.checked));
                const span = document.createElement('span');
                span.textContent = 'Show "Buy Now" buttons';
                label.appendChild(input);
                label.appendChild(span);
                container.appendChild(label);
                return true;
            }

            function bindSettingsButton() { /* no-op: the real settings button already opens showMonitorSettings() */ }

            // Removed: inline injection and late binding retry, since the toggle now lives inside the Monitor Settings modal

            function boot() {
                if (!onMonitor()) return;
                applyBuyNowVisibility();
                observeItemsGrid();
                // Settings toggle lives inside showMonitorSettings() modal; no injection into backup panel
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', boot);
            } else {
                boot();
            }
            window.addEventListener('hashchange', () => setTimeout(boot, 50));

            // Expose a tiny public API for the Monitor Settings modal to use
            if (!window.VHBuyNow) window.VHBuyNow = {};
            window.VHBuyNow.isEnabled = isEnabled;
            window.VHBuyNow.setEnabled = setEnabled;
            window.VHBuyNow.apply = applyBuyNowVisibility;
        })();


        // --- Disable opt-out button on account page ---
        if (window.location.pathname === '/vine/account') {
            function disableOptOutButton() {
                const btn = document.querySelector("input[name='vvp-opt-out-of-vine']");
                if (!btn) return;
                btn.disabled = true;
                btn.title = 'why though?';
                btn.style.cursor = 'not-allowed';
                btn.style.opacity = '0.5';
                btn.style.pointerEvents = 'auto'; // allow hover for tooltip
                btn.style.background = '#e5e5e5';

                btn.style.borderColor = '#ccc';
                // Remove any existing event listeners by replacing the element
                const newBtn = btn.cloneNode(true);
                newBtn.disabled = true;
                newBtn.title = 'why though?';
                newBtn.style.cursor = 'not-allowed';
                newBtn.style.opacity = '0.5';
                newBtn.style.pointerEvents = 'auto';
                newBtn.style.background = '#e5e5e5';

                newBtn.style.borderColor = '#ccc';
                newBtn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); return false; });
                newBtn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); return false; });
                btn.parentNode.replaceChild(newBtn, btn);
            }
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', disableOptOutButton);
            } else {
                disableOptOutButton();
            }
        }

        // --- Auto-close error alerts with fade animation ---
        function initAutoCloseErrorAlerts() {
            // Amazon has changed the alert IDs over time; support known variants.
            const TARGET_ALERT_IDS = new Set([
                'vvp-generic-request-error-msg',          // legacy
                'vvp-product-not-available-error-msg',   // current (reported)
            ]);

            // Function to close alert with fade animation
            function closeAlertWithFade(alert) {
                if (!alert || alert.classList.contains('closing')) return;

                // Prefer using the alert's own close button (if wired) to keep any internal cleanup behavior.
                try {
                    const btn = alert.querySelector('button.vh-alert-close-btn');
                    if (btn && typeof btn.click === 'function') {
                        btn.click();
                        if (!alert.isConnected) return;
                    }
                } catch { /* ignore */ }

                alert.classList.add('closing');
                alert.style.transition = 'opacity 0.5s ease-out';
                alert.style.opacity = '0';

                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.parentNode.removeChild(alert);
                    }
                }, 500); // Wait for fade animation to complete
            }

            // Function to setup auto-close for an alert
            function setupAutoClose(alert) {
                if (!alert || alert.dataset.autoCloseSetup) return;

                alert.dataset.autoCloseSetup = 'true';

                // Auto-close after 10 seconds
                const timeoutId = setTimeout(() => {
                    closeAlertWithFade(alert);
                }, 10000);

                // Store timeout ID for potential cleanup
                alert.dataset.timeoutId = timeoutId;

                // Also handle manual close button clicks
                const closeBtn = alert.querySelector('.vh-alert-close-btn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        clearTimeout(timeoutId);
                        closeAlertWithFade(alert);
                    });
                }

                console.log('Vine Modernized: Auto-close setup for error alert (10 seconds)');
            }

            function isTargetAlert(node) {
                try {
                    if (!node || node.nodeType !== 1) return false;
                    if (TARGET_ALERT_IDS.has(node.id)) return true;
                    // Fallback: only consider error alerts that carry the explicit close button class used by Vine Helper
                    return node.classList?.contains('a-alert-error') && !!node.querySelector?.('button.vh-alert-close-btn');
                } catch {
                    return false;
                }
            }

            // Watch for error alerts to appear
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1) {
                                // Check if the error alert was added directly
                                if (isTargetAlert(node)) setupAutoClose(node);

                                // Or if it was added within a subtree
                                try {
                                    const selector = Array.from(TARGET_ALERT_IDS).map(id => `#${id}`).join(', ');
                                    const candidates = selector ? node.querySelectorAll?.(selector) : [];
                                    candidates?.forEach?.((el) => setupAutoClose(el));
                                } catch { /* ignore */ }
                            }
                        });
                    }
                });
            });

            // Start observing
            observer.observe(document.body, { childList: true, subtree: true });

            // Also check if alert already exists
            try {
                const selector = Array.from(TARGET_ALERT_IDS).map(id => `#${id}`).join(', ');
                if (selector) {
                    document.querySelectorAll(selector).forEach(setupAutoClose);
                }
            } catch { /* ignore */ }
        }

        // Initialize auto-close for error alerts
        initAutoCloseErrorAlerts();

        // === Remove Burger Menu from Monitor Pages ===
        function removeBurgerMenuFromMonitorPages() {
            // Check if we're on a monitor page
            if (window.location.hash !== '#monitor') return;

            // Remove the burger menu if it exists
            const burgerMenu = document.getElementById('vine-burger-menu');
            if (burgerMenu) {
                burgerMenu.remove();
                console.log('Vine Modernized: Removed burger menu from monitor page');
            }

            // Also remove the entire filter container if it exists
            const filterContainer = document.getElementById('vvp-filter-container');
            if (filterContainer) {
                filterContainer.remove();
                console.log('Vine Modernized: Removed filter container from monitor page');
            }
        }

        // Watch for hash changes and remove burger menu when navigating to monitor pages
        function initMonitorPageCleanup() {
            // Remove burger menu on initial load if on monitor page
            removeBurgerMenuFromMonitorPages();

            // Watch for hash changes
            window.addEventListener('hashchange', () => {
                removeBurgerMenuFromMonitorPages();
            });

            // Also watch for DOM changes in case the menu gets added dynamically
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1) {
                                // Check if burger menu or filter container was added
                                if (node.id === 'vine-burger-menu' || node.id === 'vvp-filter-container') {
                                    removeBurgerMenuFromMonitorPages();
                                }
                                // Check if they were added as children
                                if (node.querySelector && (node.querySelector('#vine-burger-menu') || node.querySelector('#vvp-filter-container'))) {
                                    removeBurgerMenuFromMonitorPages();
                                }
                            }
                        });
                    }
                });
            });

            observer.observe(document.body, { childList: true, subtree: true });
        }

        // Initialize monitor page cleanup
        initMonitorPageCleanup();

        // === RFY (Potluck) Auto-Reload Feature ===
        (function initPotluckAutoReload() {
            // Only enable for potluck queue specifically
            const isPotluckUrl = () => {
                const url = window.location.href;
                // Use regex to match queue=potluck specifically (not queue=encore or queue=last_chance)
                return /queue=potluck(\D|$)/.test(url);
            };
            const isMonitorPage = () => window.location.hash === '#monitor';
            const TOGGLE_KEY = 'vine_potluck_autoreload_enabled';
            const INTERVAL_KEY = 'vine_potluck_autoreload_interval';
            const DEFAULT_INTERVAL = 60; // seconds
            let reloadInterval = null;
            let currentInterval = getInterval();

            // Don't initialize if on monitor page
            if (isMonitorPage()) {
                return;
            }
            // Don't initialize if not on potluck URL
            if (!isPotluckUrl()) {
                return;
            }

            function getToggleState() {
                return localStorage.getItem(TOGGLE_KEY) === 'true';
            }
            function setToggleState(val) {
                localStorage.setItem(TOGGLE_KEY, val ? 'true' : 'false');
            }
            function getInterval() {
                const val = parseInt(localStorage.getItem(INTERVAL_KEY), 10);
                return (isNaN(val) || val < 5) ? DEFAULT_INTERVAL : val;
            }
            function setIntervalValue(val) {
                localStorage.setItem(INTERVAL_KEY, val);
            }

            function createToggleUI() {
                // Don't create UI if on monitor page
                if (isMonitorPage()) {
                    return;
                }
                // Don't create UI if not on potluck URL
                if (!isPotluckUrl()) {
                    return;
                }

                // Ensure the parent container exists
                let parentContainer = document.querySelector('.a-section.vvp-items-container');
                if (!parentContainer) {
                    parentContainer = document.createElement('div');
                    parentContainer.className = 'a-section vvp-items-container';
                    parentContainer.style.cssText = 'flex-direction: column; align-items: stretch;';

                    // Find where to insert it - look for the main content area
                    const mainContent = document.querySelector('.a-section.vvp-tab-content') ||
                        document.querySelector('[data-a-name]') ||
                        document.querySelector('.a-section');
                    if (mainContent) {
                        mainContent.appendChild(parentContainer);
                    } else {
                        // Fallback: insert before any existing content
                        const firstSection = document.querySelector('.a-section');
                        if (firstSection) {
                            firstSection.parentNode.insertBefore(parentContainer, firstSection);
                        } else {
                            document.body.appendChild(parentContainer);
                        }
                    }
                }

                // Ensure the grid container exists
                let gridContainer = document.getElementById('vvp-items-grid-container');
                if (!gridContainer) {
                    gridContainer = document.createElement('div');
                    gridContainer.id = 'vvp-items-grid-container';
                    gridContainer.innerHTML = '<p>No items available at this time. The auto-reload feature will continue to check for new items.</p>';
                    parentContainer.appendChild(gridContainer);
                }

                // Always remove any existing toggle before creating a new one
                const oldToggle = document.getElementById('vine-potluck-autoreload-toggle');
                if (oldToggle) oldToggle.remove();

                const wrapper = document.createElement('div');
                wrapper.id = 'vine-potluck-autoreload-toggle';
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.justifyContent = 'flex-end';
                wrapper.style.gap = '0.5em';
                wrapper.style.margin = '0 0 8px 0';

                const label = document.createElement('label');
                label.style.cursor = 'pointer';
                label.style.fontSize = '1em';
                label.style.display = 'flex';
                label.style.alignItems = 'center';
                label.title = 'Automatically reloads the Recommended For You grid at your chosen interval.';
                label.innerHTML = `<input type="checkbox" style="margin-right: 0.5em;"> Auto-reload RFY every <input type="number" min="5" max="3600" value="${currentInterval}" style="width: 4em; margin: 0 0.3em;"> second(s)`;
                const checkbox = label.querySelector('input[type="checkbox"]');
                const numberInput = label.querySelector('input[type="number"]');
                checkbox.checked = getToggleState();
                numberInput.value = currentInterval;

                checkbox.addEventListener('change', () => {
                    setToggleState(checkbox.checked);
                    if (checkbox.checked) {
                        startAutoReload();
                    } else {
                        stopAutoReload();
                    }
                });
                numberInput.addEventListener('change', () => {
                    let val = parseInt(numberInput.value, 10);
                    if (isNaN(val) || val < 5) val = DEFAULT_INTERVAL;
                    numberInput.value = val;
                    setIntervalValue(val);
                    currentInterval = val;
                    if (getToggleState()) {
                        startAutoReload(); // Restart with new interval
                    }
                });
                wrapper.appendChild(label);

                // --- Placeholder Items Feature ---
                const placeholderWrapper = document.createElement('div');
                placeholderWrapper.id = 'vine-potluck-placeholders-wrapper';
                placeholderWrapper.style.display = getPotluckPlaceholderToggleVisible() ? 'flex' : 'none';
                placeholderWrapper.style.alignItems = 'center';
                placeholderWrapper.style.gap = '0.5em';
                placeholderWrapper.style.marginLeft = '12px';
                placeholderWrapper.style.paddingLeft = '12px';
                placeholderWrapper.style.borderLeft = '1px solid #ddd';

                const placeholderEnabledKey = 'vine_potluck_placeholders_enabled';
                const placeholderCountKey = 'vine_potluck_placeholders_count';
                const getPlaceholderEnabled = () => localStorage.getItem(placeholderEnabledKey) === 'true';
                const setPlaceholderEnabled = (val) => localStorage.setItem(placeholderEnabledKey, val ? 'true' : 'false');
                const getPlaceholderCount = () => parseInt(localStorage.getItem(placeholderCountKey), 10) || 12;
                const setPlaceholderCount = (val) => localStorage.setItem(placeholderCountKey, val);

                const placeholderLabel = document.createElement('label');
                placeholderLabel.style.cursor = 'pointer';
                placeholderLabel.style.display = 'flex';
                placeholderLabel.style.alignItems = 'center';
                placeholderLabel.title = 'Inject placeholder tiles to test grid layout.';
                placeholderLabel.innerHTML = `<input type="checkbox" style="margin-right: 0.5em;"> Placeholders: <input type="number" min="1" max="100" value="${getPlaceholderCount()}" style="width: 3.5em; margin: 0 0.3em;">`;

                const placeholderCheckbox = placeholderLabel.querySelector('input[type="checkbox"]');
                const placeholderNumberInput = placeholderLabel.querySelector('input[type="number"]');
                placeholderCheckbox.checked = getPlaceholderEnabled();

                const placeholderApplyBtn = document.createElement('button');
                placeholderApplyBtn.textContent = 'OK';
                placeholderApplyBtn.className = 'a-button-text';
                placeholderApplyBtn.style.cssText = 'padding: 2px 8px; font-size: 0.9em; height: 24px; border-radius: 4px; border: 1px solid #bbb; background: #f0f0f0; cursor: pointer;';

                const runPlaceholderInjection = () => {
                    const isEnabled = placeholderCheckbox.checked;
                    const count = parseInt(placeholderNumberInput.value, 10) || 12;
                    setPlaceholderEnabled(isEnabled);
                    setPlaceholderCount(count);

                    // Clear existing placeholders first
                    document.querySelectorAll('.vh-placeholder-tile').forEach(el => el.remove());

                    if (isEnabled) {
                        injectPlaceholderTiles(count);
                    }
                };

                placeholderApplyBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    runPlaceholderInjection();
                });

                placeholderWrapper.appendChild(placeholderLabel);
                placeholderWrapper.appendChild(placeholderApplyBtn);
                wrapper.appendChild(placeholderWrapper);

                // Run on initial UI creation if enabled
                if (getPlaceholderEnabled()) {
                    setTimeout(() => injectPlaceholderTiles(getPlaceholderCount()), 500);
                }

                parentContainer.insertBefore(wrapper, parentContainer.firstChild);
                // Ensure parent stacks children vertically
                if (parentContainer && getComputedStyle(parentContainer).display === 'flex') {
                    parentContainer.style.flexDirection = 'column';
                    parentContainer.style.alignItems = 'stretch'; // optional, for full width
                }
            }

            function injectPlaceholderTiles(count) {
                const grid = document.getElementById('vvp-items-grid');
                if (!grid) return;

                for (let i = 0; i < count; i++) {
                    const tile = document.createElement('div');
                    tile.className = 'vvp-item-tile vh-gridview vh-placeholder-tile';
                    tile.dataset.asin = `PLACEHOLDER-${i}`;
                    tile.innerHTML = `
                    <div class="vvp-item-tile-content">
                        <div class="vh-status" style="height: 24px;"></div>
                        <div class="vvp-item-badges"></div>
                        <div class="vvp-item-image-container">
                            <div class="vh-img-container">
                                <img src="https://m.media-amazon.com/images/I/01RmID949pL._SS210_.png" alt="Placeholder">
                            </div>
                            <div class="vh-date-added" style="position: absolute; bottom: 4px; left: 4px; font-size: 10px; background: rgba(0,0,0,0.6); color: white; padding: 2px 4px; border-radius: 3px;">Sample Item</div>
                        </div>
                        <div class="vvp-item-product-title-container">
                            <a class="a-link-normal" href="#">
                                <span class="a-truncate" data-a-word-break="normal" data-a-max-rows="2" style="line-height: 1.3em !important; max-height: 2.6em;">
                                    <span class="a-truncate-full a-offscreen">[Sample] This is a placeholder item for layout testing - #${i + 1}</span>
                                    <span class="a-truncate-cut" aria-hidden="true" style="height: 2.6em; visibility: visible;">[Sample] This is a placeholder item for layout testing...</span>
                                </span>
                            </a>
                        </div>
                        <span class="vh-btn-container" style="display: flex;">
                            <span class="a-button a-button-primary vvp-details-btn">
                                <span class="a-button-inner">
                                    <span class="a-button-text">See details</span>
                                </span>
                            </span>
                            <span class="a-button a-button-base vvp-buy-now-btn" style="margin-left: 8px;">
                                <span class="a-button-inner">
                                    <span class="a-button-text">Buy Now</span>
                                </span>
                            </span>
                        </span>
                    </div>
                `;
                    grid.appendChild(tile);
                }

                // Re-trigger layout normalization or observers if needed
                if (typeof observeItemsGrid === 'function') observeItemsGrid();
                if (typeof updateResultsCountText === 'function') updateResultsCountText();
            }

            function replaceGridWithNew(newGrid) {
                const oldGrid = document.getElementById('vvp-items-grid-container');
                if (oldGrid && newGrid) {
                    oldGrid.replaceWith(newGrid);
                    // Re-initialize observers/features that depend on the grid
                    if (typeof observeItemsGrid === 'function') observeItemsGrid();
                    if (typeof setSearchBarStyle === 'function') setSearchBarStyle();
                }
            }

            async function reloadGrid() {
                // Don't reload if on monitor page
                if (isMonitorPage()) {
                    return;
                }
                // Don't reload if not on potluck URL
                if (!isPotluckUrl()) {
                    return;
                }

                const gridContainer = document.getElementById('vvp-items-grid-container');
                if (!gridContainer) return;
                gridContainer.style.opacity = '0.5';
                try {
                    const res = await fetch(window.location.href, { credentials: 'same-origin' });
                    const html = await res.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const newGrid = doc.getElementById('vvp-items-grid-container');
                    if (newGrid) {
                        replaceGridWithNew(newGrid);

                        // Re-inject placeholders if enabled
                        const placeholderEnabledKey = 'vine_potluck_placeholders_enabled';
                        const placeholderCountKey = 'vine_potluck_placeholders_count';
                        if (localStorage.getItem(placeholderEnabledKey) === 'true') {
                            const count = parseInt(localStorage.getItem(placeholderCountKey), 10) || 12;
                            injectPlaceholderTiles(count);
                        }
                    }
                } catch (err) {
                    console.error('Vine Modernized: Potluck auto-reload error:', err);
                } finally {
                    const gridContainer2 = document.getElementById('vvp-items-grid-container');
                    if (gridContainer2) gridContainer2.style.opacity = '';
                }
            }

            function startAutoReload() {
                // Don't start auto-reload if on monitor page
                if (isMonitorPage()) {
                    return;
                }
                // Don't start auto-reload if not on potluck URL
                if (!isPotluckUrl()) {
                    return;
                }

                stopAutoReload();
                reloadInterval = setInterval(reloadGrid, currentInterval * 1000);
            }
            function stopAutoReload() {
                if (reloadInterval) clearInterval(reloadInterval);
                reloadInterval = null;
            }

            // Observe for grid container to appear (in case of partial reloads)
            function waitForGridAndInit(attempt = 0) {
                // Don't initialize if on monitor page
                if (isMonitorPage()) {
                    return;
                }
                // Don't initialize if not on potluck URL
                if (!isPotluckUrl()) {
                    return;
                }

                const gridContainer = document.getElementById('vvp-items-grid-container');
                if (gridContainer) {
                    createToggleUI();
                    if (getToggleState()) startAutoReload();
                } else if (attempt < 20) {
                    setTimeout(() => waitForGridAndInit(attempt + 1), 250);
                }
            }
            // Expose for re-initialization after tab switch
            window.vinePotluckWaitForGridAndInit = waitForGridAndInit;

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => waitForGridAndInit());
            } else {
                waitForGridAndInit();
            }
            // Clean up on navigation
            window.addEventListener('beforeunload', stopAutoReload);
        })();

        // === AI (Encore) Auto-Reload Feature ===
        (function initEncoreAutoReload() {
            // Only enable for encore queue specifically
            const isEncoreUrl = () => {
                const url = window.location.href;
                // Use regex to match queue=encore specifically (not queue=potluck or queue=last_chance)
                return /queue=encore(\D|$)/.test(url);
            };
            const isMonitorPage = () => window.location.hash === '#monitor';
            const TOGGLE_KEY = 'vine_encore_autoreload_enabled';
            const INTERVAL_KEY = 'vine_encore_autoreload_interval';
            const DEFAULT_INTERVAL = 60; // seconds
            let reloadInterval = null;
            let currentInterval = getInterval();

            // Don't initialize if on monitor page
            if (isMonitorPage()) {
                return;
            }
            // Don't initialize if not on encore URL
            if (!isEncoreUrl()) {
                return;
            }

            function getToggleState() {
                return localStorage.getItem(TOGGLE_KEY) === 'true';
            }
            function setToggleState(val) {
                localStorage.setItem(TOGGLE_KEY, val ? 'true' : 'false');
            }
            function getInterval() {
                const val = parseInt(localStorage.getItem(INTERVAL_KEY), 10);
                return (isNaN(val) || val < 5) ? DEFAULT_INTERVAL : val;
            }
            function setIntervalValue(val) {
                localStorage.setItem(INTERVAL_KEY, val);
            }

            function createToggleUI() {
                // Don't create UI if on monitor page
                if (isMonitorPage()) {
                    return;
                }
                // Don't create UI if not on encore URL
                if (!isEncoreUrl()) {
                    return;
                }

                // Ensure the parent container exists
                let parentContainer = document.querySelector('.a-section.vvp-items-container');
                if (!parentContainer) {
                    parentContainer = document.createElement('div');
                    parentContainer.className = 'a-section vvp-items-container';
                    parentContainer.style.cssText = 'flex-direction: column; align-items: stretch;';

                    // Find where to insert it - look for the main content area
                    const mainContent = document.querySelector('.a-section.vvp-tab-content') ||
                        document.querySelector('[data-a-name]') ||
                        document.querySelector('.a-section');
                    if (mainContent) {
                        mainContent.appendChild(parentContainer);
                    } else {
                        // Fallback: insert before any existing content
                        const firstSection = document.querySelector('.a-section');
                        if (firstSection) {
                            firstSection.parentNode.insertBefore(parentContainer, firstSection);
                        } else {
                            document.body.appendChild(parentContainer);
                        }
                    }
                }

                // Ensure the grid container exists
                let gridContainer = document.getElementById('vvp-items-grid-container');
                if (!gridContainer) {
                    gridContainer = document.createElement('div');
                    gridContainer.id = 'vvp-items-grid-container';
                    gridContainer.innerHTML = '<p>No items available at this time. The auto-reload feature will continue to check for new items.</p>';
                    parentContainer.appendChild(gridContainer);
                }

                // Always remove any existing toggle before creating a new one
                const oldToggle = document.getElementById('vine-encore-autoreload-toggle');
                if (oldToggle) oldToggle.remove();

                const wrapper = document.createElement('div');
                wrapper.id = 'vine-encore-autoreload-toggle';
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.justifyContent = 'flex-end';
                wrapper.style.gap = '0.5em';
                wrapper.style.margin = '0 0 8px 0';

                const label = document.createElement('label');
                label.style.cursor = 'pointer';
                label.style.fontSize = '1em';
                label.style.display = 'flex';
                label.style.alignItems = 'center';
                label.title = 'Automatically reloads the AI feed grid at your chosen interval.';
                label.innerHTML = `<input type="checkbox" style="margin-right: 0.5em;"> Auto-reload AI every <input type="number" min="5" max="3600" value="${currentInterval}" style="width: 4em; margin: 0 0.3em;"> second(s)`;
                const checkbox = label.querySelector('input[type="checkbox"]');
                const numberInput = label.querySelector('input[type="number"]');
                checkbox.checked = getToggleState();
                numberInput.value = currentInterval;

                checkbox.addEventListener('change', () => {
                    setToggleState(checkbox.checked);
                    if (checkbox.checked) {
                        startAutoReload();
                    } else {
                        stopAutoReload();
                    }
                });
                numberInput.addEventListener('change', () => {
                    let val = parseInt(numberInput.value, 10);
                    if (isNaN(val) || val < 5) val = DEFAULT_INTERVAL;
                    numberInput.value = val;
                    setIntervalValue(val);
                    currentInterval = val;
                    if (getToggleState()) {
                        startAutoReload(); // Restart with new interval
                    }
                });
                wrapper.appendChild(label);
                parentContainer.insertBefore(wrapper, parentContainer.firstChild);
                // Ensure parent stacks children vertically
                if (parentContainer && getComputedStyle(parentContainer).display === 'flex') {
                    parentContainer.style.flexDirection = 'column';
                    parentContainer.style.alignItems = 'stretch'; // optional, for full width
                }
            }

            function replaceGridWithNew(newGrid) {
                const oldGrid = document.getElementById('vvp-items-grid-container');
                if (oldGrid && newGrid) {
                    oldGrid.replaceWith(newGrid);
                    // Re-initialize observers/features that depend on the grid
                    if (typeof observeItemsGrid === 'function') observeItemsGrid();
                    if (typeof setSearchBarStyle === 'function') setSearchBarStyle();
                }
            }

            async function reloadGrid() {
                // Don't reload if on monitor page
                if (isMonitorPage()) {
                    return;
                }
                // Don't reload if not on encore URL
                if (!isEncoreUrl()) {
                    return;
                }

                const gridContainer = document.getElementById('vvp-items-grid-container');
                if (!gridContainer) return;
                gridContainer.style.opacity = '0.5';
                try {
                    const res = await fetch(window.location.href, { credentials: 'same-origin' });
                    const html = await res.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const newGrid = doc.getElementById('vvp-items-grid-container');
                    if (newGrid) {
                        replaceGridWithNew(newGrid);
                    }
                } catch (err) {
                    console.error('Vine Modernized: Encore auto-reload error:', err);
                } finally {
                    const gridContainer2 = document.getElementById('vvp-items-grid-container');
                    if (gridContainer2) gridContainer2.style.opacity = '';
                }
            }

            function startAutoReload() {
                // Don't start auto-reload if on monitor page
                if (isMonitorPage()) {
                    return;
                }
                // Don't start auto-reload if not on encore URL
                if (!isEncoreUrl()) {
                    return;
                }

                stopAutoReload();
                reloadInterval = setInterval(reloadGrid, currentInterval * 1000);
            }
            function stopAutoReload() {
                if (reloadInterval) clearInterval(reloadInterval);
                reloadInterval = null;
            }

            // Observe for grid container to appear (in case of partial reloads)
            function waitForGridAndInit(attempt = 0) {
                // Don't initialize if on monitor page
                if (isMonitorPage()) {
                    return;
                }
                // Don't initialize if not on encore URL
                if (!isEncoreUrl()) {
                    return;
                }

                const gridContainer = document.getElementById('vvp-items-grid-container');
                if (gridContainer) {
                    createToggleUI();
                    if (getToggleState()) startAutoReload();
                } else if (attempt < 20) {
                    setTimeout(() => waitForGridAndInit(attempt + 1), 250);
                }
            }
            // Expose for re-initialization after tab switch
            window.vineEncoreWaitForGridAndInit = waitForGridAndInit;

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => waitForGridAndInit());
            } else {
                waitForGridAndInit();
            }
            // Clean up on navigation
            window.addEventListener('beforeunload', stopAutoReload);
        })();

        // --- Re-initialize tab-dependent features after tab switch ---
        function reinitializeTabFeatures() {
            // Remove any existing auto-reload toggle UI
            const oldPotluckToggle = document.getElementById('vine-potluck-autoreload-toggle');
            if (oldPotluckToggle) oldPotluckToggle.remove();
            const oldEncoreToggle = document.getElementById('vine-encore-autoreload-toggle');
            if (oldEncoreToggle) oldEncoreToggle.remove();
            // Re-initialize auto-reload toggle if on Potluck or Encore tab and not on monitor page
            const url = window.location.href;
            // Use regex to match queue=potluck or queue=encore specifically
            const isPotluckUrl = /queue=potluck(\D|$)/.test(url);
            const isEncoreUrl = /queue=encore(\D|$)/.test(url);
            if (isPotluckUrl && window.location.hash !== '#monitor' && window.vinePotluckWaitForGridAndInit) {
                window.vinePotluckWaitForGridAndInit();
            }
            if (isEncoreUrl && window.location.hash !== '#monitor' && window.vineEncoreWaitForGridAndInit) {
                window.vineEncoreWaitForGridAndInit();
            }

            // Re-initialize favorites tab if on appropriate page
            const oldFavTab = document.getElementById('vvp-favorites-tab');
            const oldFavContainer = document.getElementById('vvp-favorites-container');

            if (shouldShowFavoritesTab()) {
                // Remove old tab and container if they exist
                if (oldFavTab) oldFavTab.remove();
                if (oldFavContainer) oldFavContainer.remove();

                // Re-create them with fade-in animation
                setTimeout(() => {
                    createFavoritesTab();
                    createFavoritesContainer();
                }, 100);
            } else {
                // Remove tab and container if we're not on a favorites-capable page
                if (oldFavTab) oldFavTab.remove();
                if (oldFavContainer) oldFavContainer.remove();
            }

            if (window.vineWaitForCategorySidebarAndEnable) {
                window.vineWaitForCategorySidebarAndEnable();
            }
        }

        // =============================
        // VINE HELPER'S NOTIFICATION MONITOR (NM) QUALITY OF LIFE TWEAKS
        // =============================

        // === Auto-Reconnection for WebSocket Disconnections ===
        (function initNotificationMonitorTweaks() {
            let statusWSObserver = null;
            let lastConnectionState = null;
            let autoReconnectInProgress = false;
            let lastTriggerTime = 0;

            // Function to open monitor tab and auto-close it
            function openMonitorTabForReconnection() {
                if (autoReconnectInProgress) return;

                autoReconnectInProgress = true;
                // Use current origin to support all Amazon domains (.com, .ca, .co.uk, etc.)
                const monitorUrl = `${window.location.origin}/vine/vine-items?queue=encore#monitor?`;
                const newTab = window.open(monitorUrl, '_blank');

                if (newTab) {
                    // Set a flag in sessionStorage so the new tab knows it should auto-close
                    sessionStorage.setItem('vine_auto_close_monitor_tab', 'true');

                    // Wait for the new tab to load, then inject the auto-close script
                    const injectAutoCloseScript = () => {
                        try {
                            // Check if tab is still open and accessible
                            if (newTab.closed) return;

                            // Wait for the document to be ready
                            if (newTab.document && newTab.document.readyState !== 'loading') {
                                const script = newTab.document.createElement('script');
                                script.textContent = `
                                (function() {
                                    const startTime = Date.now();
                                    const MIN_WAIT_TIME = 2500;
                                    const MAX_WAIT_TIME = 15000;
                                    let checkInterval = null;
                                    let hasClosed = false;

                                    function checkAndClose() {
                                        if (hasClosed) {
                                            if (checkInterval) clearInterval(checkInterval);
                                            return;
                                        }

                                        const headerUI = document.getElementById('vh-notifications-monitor-header-ui');
                                        const statusWS = document.getElementById('statusWS');
                                        const isConnected = statusWS && statusWS.querySelector('.vh-icon-switch-on') !== null;

                                        const conditionsMet = headerUI !== null && isConnected;
                                        const elapsedTime = Date.now() - startTime;

                                        if (conditionsMet && elapsedTime >= MIN_WAIT_TIME) {
                                            hasClosed = true;
                                            if (checkInterval) clearInterval(checkInterval);
                                            console.log('Vine Modernized: Monitor tab auto-closing after detecting UI elements and connection (elapsed: ' + Math.round(elapsedTime) + 'ms)');
                                            window.close();
                                        }
                                    }

                                    // Start checking every 200ms once DOM is ready
                                    if (document.readyState === 'loading') {
                                        document.addEventListener('DOMContentLoaded', () => {
                                            checkInterval = setInterval(checkAndClose, 200);
                                            setTimeout(checkAndClose, 500);
                                        });
                                    } else {
                                        checkInterval = setInterval(checkAndClose, 200);
                                        setTimeout(checkAndClose, 500);
                                    }
                                })();
                            `;
                                newTab.document.head.appendChild(script);
                                console.log('Vine Modernized: Monitor tab opened for automatic connection re-establishment');
                            } else {
                                // Document not ready yet, retry after a short delay
                                setTimeout(injectAutoCloseScript, 100);
                            }
                        } catch (error) {
                            // Tab might have security restrictions or be closed
                            console.log('Vine Modernized: Could not inject auto-close script into new tab');
                        }
                    };

                    // Try to inject immediately, or wait for tab to load
                    if (newTab.document && newTab.document.readyState !== 'loading') {
                        injectAutoCloseScript();
                    } else {
                        // Wait for the tab to load
                        const checkLoad = setInterval(() => {
                            try {
                                if (newTab.closed) {
                                    clearInterval(checkLoad);
                                    return;
                                }
                                if (newTab.document && newTab.document.readyState !== 'loading') {
                                    clearInterval(checkLoad);
                                    injectAutoCloseScript();
                                }
                            } catch (e) {
                                // Tab might not be accessible yet
                            }
                        }, 100);

                        // Stop checking after 5 seconds if still not accessible
                        setTimeout(() => clearInterval(checkLoad), 5000);
                    }
                } else {
                    console.warn('Vine Modernized: Could not open monitor tab (popup blocked?)');
                }

                // Reset the flag after a delay to allow for future reconnections
                setTimeout(() => {
                    autoReconnectInProgress = false;
                }, 10000);
            }

            // Auto-close logic that runs in the new tab (checking sessionStorage flag)
            (function checkAutoCloseFlag() {
                if (sessionStorage.getItem('vine_auto_close_monitor_tab') === 'true' && window.location.hash === '#monitor') {
                    sessionStorage.removeItem('vine_auto_close_monitor_tab');

                    const startTime = Date.now();
                    const MIN_WAIT_TIME = 2500;
                    const MAX_WAIT_TIME = 15000;
                    let checkInterval = null;
                    let hasClosed = false;

                    function checkAndClose() {
                        if (hasClosed) {
                            if (checkInterval) clearInterval(checkInterval);
                            return;
                        }

                        const headerUI = document.getElementById('vh-notifications-monitor-header-ui');
                        const statusWS = document.getElementById('statusWS');
                        const isConnected = statusWS && statusWS.querySelector('.vh-icon-switch-on') !== null;

                        const conditionsMet = headerUI !== null && isConnected;
                        const elapsedTime = Date.now() - startTime;

                        if (conditionsMet && elapsedTime >= MIN_WAIT_TIME) {
                            hasClosed = true;
                            if (checkInterval) clearInterval(checkInterval);
                            console.log('Vine Modernized: Monitor tab auto-closing after detecting UI elements and connection (elapsed: ' + Math.round(elapsedTime) + 'ms)');
                            window.close();
                        } else if (elapsedTime >= MAX_WAIT_TIME) {
                            hasClosed = true;
                            if (checkInterval) clearInterval(checkInterval);
                            console.log('Vine Modernized: Monitor tab auto-closing after maximum wait time (' + MAX_WAIT_TIME + 'ms)');
                            window.close();
                        }
                    }

                    // Start checking once DOM is ready
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', () => {
                            checkInterval = setInterval(checkAndClose, 200);
                            setTimeout(checkAndClose, 500);
                        });
                    } else {
                        checkInterval = setInterval(checkAndClose, 200);
                        setTimeout(checkAndClose, 500);
                    }
                }
            })();

            // Function to check connection status and handle changes
            function checkConnectionStatus() {
                const statusWS = document.getElementById('statusWS');
                const descriptionWS = document.getElementById('descriptionWS');

                if (!statusWS || !descriptionWS) return;

                const currentState = {
                    isConnected: statusWS.querySelector('.vh-icon-switch-on') !== null,
                    description: descriptionWS.textContent.trim()
                };

                // Check if state has changed
                if (lastConnectionState === null) {
                    lastConnectionState = currentState;
                    console.log('Vine Modernized: Initial connection state detected:', currentState);
                    return;
                }

                // Only trigger auto-reconnection for the specific "Remotely disconnected" message
                const targetDisconnectMessage = "Remotely disconnected, reload the page. Upgrade your membership to get more connections";


                // Check if we've transitioned to the specific disconnect state
                // Only trigger if we're coming from a different state AND landing on the target message
                if (lastConnectionState.description !== targetDisconnectMessage &&
                    currentState.description === targetDisconnectMessage) {

                    // Prevent rapid successive triggers (within 30 seconds)
                    const now = Date.now();
                    if (now - lastTriggerTime < 30000) {
                        console.log('Vine Modernized: Auto-reconnect triggered too recently, skipping');
                        return;
                    }

                    console.log('Vine Modernized: Specific disconnect message detected, triggering auto-reconnection');
                    console.log('Vine Modernized: Transition from:', lastConnectionState.description, 'to:', currentState.description);
                    lastTriggerTime = now;
                    openMonitorTabForReconnection();
                }
                // Check if connection was restored from the specific disconnect state
                else if (lastConnectionState.description === targetDisconnectMessage &&
                    currentState.description !== targetDisconnectMessage) {
                    console.log('Vine Modernized: Connection restored from disconnect state');
                    console.log('Vine Modernized: Transition from:', lastConnectionState.description, 'to:', currentState.description);
                }
                // Log other connection state changes for debugging (but don't act on them)
                else if (lastConnectionState.description !== currentState.description) {
                    console.log('Vine Modernized: Connection state changed (no action):', {
                        from: lastConnectionState.description,
                        to: currentState.description,
                        action: 'monitoring (no auto-reconnect)'
                    });
                }

                lastConnectionState = currentState;
            }

            // Make the statusWS element clickable with auto-close functionality
            // DISABLED: Click functionality removed per user request
            function makeStatusWSClickable() {
                // Function disabled - click to re-establish connection removed
                return;
            }

            // Start monitoring the statusWS element for changes
            function startStatusMonitoring() {
                const statusWS = document.getElementById('statusWS');
                if (!statusWS) return;

                // Stop any existing observer
                if (statusWSObserver) {
                    statusWSObserver.disconnect();
                }

                // Create new observer to watch for changes in the statusWS element
                statusWSObserver = new MutationObserver((mutations) => {
                    let shouldCheck = false;

                    mutations.forEach((mutation) => {
                        // Check if the switch icon changed
                        if (mutation.type === 'childList' || mutation.type === 'attributes') {
                            shouldCheck = true;
                        }
                        // Check if the description text changed
                        if (mutation.target && mutation.target.id === 'descriptionWS') {
                            shouldCheck = true;
                        }
                    });

                    if (shouldCheck) {
                        setTimeout(checkConnectionStatus, 100); // Small delay to ensure DOM is updated
                    }
                });

                // Observe the statusWS element and its children
                statusWSObserver.observe(statusWS, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class']
                });

                // Also observe the description element specifically
                const descriptionWS = document.getElementById('descriptionWS');
                if (descriptionWS) {
                    statusWSObserver.observe(descriptionWS, {
                        childList: true,
                        characterData: true
                    });
                }

                console.log('Vine Modernized: Status monitoring started for statusWS element');
            }

            // Watch for the statusWS element to appear
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1) {
                                // Check if the element was added directly
                                if (node.id === 'statusWS') {
                                    makeStatusWSClickable();
                                    startStatusMonitoring();
                                }
                                // Check if the element was added as a child
                                const statusWS = node.querySelector ? node.querySelector('#statusWS') : null;
                                if (statusWS) {
                                    makeStatusWSClickable();
                                    startStatusMonitoring();
                                }
                            }
                        });
                    }
                });
            });

            // Start observing
            observer.observe(document.body, { childList: true, subtree: true });

            // Also check if element already exists
            if (document.getElementById('statusWS')) {
                makeStatusWSClickable();
                startStatusMonitoring();
            }

            console.log('Vine Modernized: Notification Monitor tweaks initialized with real-time monitoring');
        })();

        // === NOTIFICATION-RELATED UI ENHANCEMENTS AND SCROLL JUMP PREVENTION ===
        // This section addresses issues related to notifications and page behavior:
        // 1. Fixes notification close button hrefs to preserve current page/hash.
        // 2. Prevents unwanted page scroll-to-top behavior when "Failed order detected"
        //    notifications appear, restoring the user's previous scroll position.
        function handleNotificationUIAndScrollFixes() {
            const AUTO_CLOSE_DELAY_MS = 2000;
            const autoCloseTimers = new WeakMap();

            // Store scroll position for failed order notifications
            let savedScrollPosition = null;

            function scheduleAutoClose(notification) {
                if (!notification || notification.nodeType !== 1) return;
                if (!notification.classList || !notification.classList.contains('vh-notification-box')) return;

                const existingTimer = autoCloseTimers.get(notification);
                if (existingTimer) clearTimeout(existingTimer);

                const timer = setTimeout(() => {
                    if (!document.contains(notification)) return;
                    notification.remove();
                }, AUTO_CLOSE_DELAY_MS);

                autoCloseTimers.set(notification, timer);
            }

            // Function to check if notification is a "Failed order detected" notification
            function isFailedOrderNotification(notification) {
                if (!notification) return false;
                const titleElement = notification.querySelector('.vh-notification-title, h3, h4, .vh-notification-content');
                if (!titleElement) return false;
                const titleText = titleElement.textContent.trim().toLowerCase();
                return titleText.includes('failed order detected') || titleText.includes('failed order');
            }

            // Function to save current scroll position
            function saveScrollPosition() {
                savedScrollPosition = {
                    x: window.scrollX || window.pageXOffset || document.documentElement.scrollLeft,
                    y: window.scrollY || window.pageYOffset || document.documentElement.scrollTop,
                    timestamp: Date.now()
                };
                console.log('Vine Modernized: Saved scroll position for failed order notification:', savedScrollPosition);
            }

            // Function to restore saved scroll position
            function restoreScrollPosition() {
                if (savedScrollPosition) {
                    // Only restore if saved within the last 30 seconds
                    const timeDiff = Date.now() - savedScrollPosition.timestamp;
                    if (timeDiff < 30000) {
                        window.scrollTo(savedScrollPosition.x, savedScrollPosition.y);
                        console.log('Vine Modernized: Restored scroll position after failed order notification');
                    } else {
                        console.log('Vine Modernized: Scroll position too old, not restoring');
                    }
                    savedScrollPosition = null;
                }
            }

            // Function to fix close button href for a notification
            function fixCloseButtonHref(notification) {
                if (!notification) return;

                const closeLink = notification.querySelector('.vh-notification-close a[href="#"]');
                if (closeLink) {
                    // Preserve the current hash or default to #monitor
                    const currentHash = window.location.hash || '#monitor';
                    closeLink.href = currentHash;
                    console.log('Vine Modernized: Fixed notification close button href to:', currentHash);

                    // Add scroll position restoration for failed order notifications
                    if (isFailedOrderNotification(notification)) {
                        closeLink.addEventListener('click', (e) => {
                            // Small delay to ensure notification is closed before restoring scroll
                            setTimeout(restoreScrollPosition, 100);
                        });
                    }
                }
            }

            // Function to extract ASIN from failed order notification
            function extractAsinFromFailedOrderNotification(notification) {
                if (!notification) return null;
                const contentElement = notification.querySelector('.vh-notification-content');
                if (!contentElement) return null;

                const contentText = contentElement.textContent.trim();
                // Pattern: "Item B07RFBGPKR failed to order with error ITEM_NOT_IN_ENROLLMENT"
                const asinMatch = contentText.match(/Item\s+([A-Z0-9]{10})\s+failed/);
                if (asinMatch && asinMatch[1]) {
                    return asinMatch[1];
                }
                return null;
            }

            // Function to mark a tile as unavailable in restored feed
            function markTileAsUnavailable(asin) {
                if (!asin) return false;

                // Only process if we're on the monitor page
                if (window.location.hash !== '#monitor') return false;

                const tile = document.querySelector(`#vvp-items-grid .vvp-item-tile[data-asin="${asin}"]`);
                if (!tile) return false;

                // Only mark tiles that are from restored backup (have data-userscript-injected attribute)
                if (!tile.hasAttribute('data-userscript-injected')) return false;

                // Check if already marked as unavailable
                if (tile.querySelector('.unavailable-banner')) return true;

                // Find the image container
                const imgContainer = tile.querySelector('.vh-img-container');
                if (!imgContainer) return false;

                // Create and add unavailable banner
                const banner = document.createElement('div');
                banner.className = 'unavailable-banner';
                banner.style.cssText = 'isolation: isolate;';
                banner.textContent = 'Unavailable';

                // Insert banner at the beginning of the image container
                imgContainer.insertBefore(banner, imgContainer.firstChild);

                // Mark tile with data attribute
                tile.setAttribute('data-unavailable', 'true');

                console.log(`Vine Modernized: Marked tile ${asin} as unavailable in restored feed`);
                return true;
            }

            // Function to handle notification appearance
            function handleNotificationAppearance(notification) {
                fixCloseButtonHref(notification);

                // Handle scroll position for failed order notifications
                if (isFailedOrderNotification(notification)) {
                    // Only save on encore/encore#monitor pages
                    const url = window.location.href;
                    const isEncorePage = /queue=encore(\D|$)/.test(url);
                    const isMonitorPage = window.location.hash === '#monitor';

                    if (isEncorePage || isMonitorPage) {
                        saveScrollPosition();
                        console.log('Vine Modernized: Detected failed order notification on encore page, scroll position saved');

                        // Set up dynamic scroll restoration - watch for browser jumping to top
                        setupDynamicScrollRestoration();
                    }

                    // Mark item as unavailable in restored feed if applicable
                    const asin = extractAsinFromFailedOrderNotification(notification);
                    if (asin) {
                        // Small delay to ensure notification is fully rendered
                        setTimeout(() => {
                            markTileAsUnavailable(asin);
                        }, 100);
                    }
                }

                scheduleAutoClose(notification);
            }

            // Function to dynamically restore scroll position when browser jumps to top
            function setupDynamicScrollRestoration() {
                let scrollRestored = false;
                let lastScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

                function handleScroll() {
                    if (scrollRestored) {
                        // Clean up listener once restoration is complete
                        window.removeEventListener('scroll', handleScroll);
                        return;
                    }

                    const currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

                    // Detect if browser jumped to top (scroll position decreased significantly)
                    // Threshold: if we were scrolled down and now we're near the top
                    if (lastScrollY > 100 && currentScrollY <= 50) {
                        console.log('Vine Modernized: Detected browser jump to top, restoring saved scroll position');
                        restoreScrollPosition();
                        scrollRestored = true;

                        // Clean up listener
                        window.removeEventListener('scroll', handleScroll);
                        return;
                    }

                    lastScrollY = currentScrollY;
                }

                // Also set a timeout as fallback (in case browser doesn't scroll)
                const fallbackTimeout = setTimeout(() => {
                    if (!scrollRestored) {
                        console.log('Vine Modernized: Fallback timeout reached, restoring scroll position');
                        restoreScrollPosition();
                        scrollRestored = true;
                        window.removeEventListener('scroll', handleScroll);
                    }
                }, 3000); // 3 second fallback

                // Start listening for scroll events
                window.addEventListener('scroll', handleScroll, { passive: true });
            }

            // Watch for Vine Helper notifications to appear
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1) {
                                // Check if a Vine Helper notification was added directly
                                if (node.classList && node.classList.contains('vh-notification-box')) {
                                    handleNotificationAppearance(node);
                                }
                                // Check if Vine Helper notifications were added as children
                                const notifications = node.querySelectorAll ? node.querySelectorAll('.vh-notification-box') : [];
                                notifications.forEach(handleNotificationAppearance);
                            }
                        });
                    }
                });
            });

            // Start observing
            observer.observe(document.body, { childList: true, subtree: true });

            // Also handle any existing notifications
            const existingNotifications = document.querySelectorAll('.vh-notification-box');
            existingNotifications.forEach(handleNotificationAppearance);
        }

        // Initialize notification-related UI enhancements and scroll jump prevention
        handleNotificationUIAndScrollFixes();


        // === INFINITE SCROLL FOR REVIEWS TABLE ===
        (function initReviewsInfiniteScroll() {
            if (window.location.pathname !== '/vine/vine-reviews') return;

            // Add search CSS styles for reviews (borrowed from orders)
            (function () {
                if (document.getElementById('vine-reviews-search-style')) return;
                const style = document.createElement('style');
                style.id = 'vine-reviews-search-style';
                style.textContent = `
                .vine-reviews-search-btn {
                  background: none; border: none; outline: none; cursor: pointer;
                  display: flex; align-items: center; justify-content: center;
                  padding: 6px 10px; border-radius: 50%; transition: background 0.2s;
                  font-size: 22px; color: #444;
                }
                .vine-reviews-search-btn:hover { background: #f2f2f2; }
                .vine-reviews-search-field-outer {
                  display: flex; align-items: center; position: relative;
                  min-width: 40px; max-width: 400px;
                  transition: max-width 0.35s cubic-bezier(0.4,0,0.2,1), background 0.2s;
                  background: #fff; border-radius: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;
                }
                .vine-reviews-search-field-outer.vine-reviews-search-active {
                  max-width: 400px; background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,0.13);
                }
                .vine-reviews-search-field-inner {
                  width: 0; opacity: 0; border: none; outline: none; font-size: 16px;
                  background: transparent; padding: 0 0;
                  transition: width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.2s; color: #222;
                }
                .vine-reviews-search-field-outer.vine-reviews-search-active .vine-reviews-search-field-inner {
                  width: 180px; opacity: 1; padding: 12px 16px 12px 16px;
                }
                .vine-reviews-search-field-inner:focus {
                  outline: none !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                .vine-reviews-search-close-btn {
                  background: none; border: none; outline: none; cursor: pointer;
                  font-size: 20px; color: #888; margin-left: 2px; opacity: 0.7;
                  transition: color 0.2s, opacity 0.2s;
                }
                .vine-reviews-search-close-btn:hover { color: #b12704; opacity: 1; }
                .vine-reviews-search-spinner {
                  width: 18px; height: 18px; border: 2px solid #b12704; border-top: 2px solid #fff;
                  border-radius: 50%; animation: vine-spin 0.7s linear infinite; margin-left: 8px;
                }
                @keyframes vine-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .vine-reviews-search-no-results {
                  text-align: center; color: #b12704; font-size: 16px; padding: 32px 0;
                }
            `;
                document.head.appendChild(style);
            })();

            // --- Inject right-align style for .vine-heading-right in reviews heading ---
            (function injectReviewsHeadingRightStyle() {
                if (document.getElementById('vine-reviews-heading-right-style')) return;
                const style = document.createElement('style');
                style.id = 'vine-reviews-heading-right-style';
                style.textContent = `
                .vvp-reviews-table--heading-top {
                    display: flex !important;
                    flex-direction: row;
                    justify-content: flex-start;
                    align-items: center;
                }
                .vvp-reviews-table--heading-top .vine-heading-right {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    margin-left: auto;
                    gap: 16px;
                    margin-right: 24px;
                }
            `;
                document.head.appendChild(style);
            })();

            // --- Helpers to find/ensure heading containers ---
            function ensureReviewsHeadingContainers() {
                // Try multiple selectors for the heading
                const headingTop = document.querySelector('.vvp-reviews-table--heading-top') ||
                    document.querySelector('.vvp-reviews-table--heading') ||
                    document.querySelector('[data-a-name="reviews"] .a-section:first-child') ||
                    document.querySelector('.a-section:has(.a-pagination)') ||
                    document.querySelector('.a-section:has(table)');

                if (!headingTop) {
                    console.warn('Vine Modernized: Reviews infinite scroll - No heading container found');
                    return { left: null, right: null };
                }

                let left = headingTop.querySelector('.vine-heading-left');
                let right = headingTop.querySelector('.vine-heading-right');

                if (!left) {
                    left = document.createElement('div');
                    left.className = 'vine-heading-left';
                    headingTop.appendChild(left);
                    console.log('Vine Modernized: Reviews infinite scroll - Created left heading container');
                }

                if (!right) {
                    right = document.createElement('div');
                    right.className = 'vine-heading-right';
                    headingTop.appendChild(right);
                    console.log('Vine Modernized: Reviews infinite scroll - Created right heading container');
                }

                return { left, right };
            }

            // --- Persistent toggle state ---
            const TOGGLE_KEY = 'vine_reviews_infinite_scroll_enabled';
            function getToggleState() {
                return localStorage.getItem(TOGGLE_KEY) === 'true';
            }
            function setToggleState(val) {
                localStorage.setItem(TOGGLE_KEY, val ? 'true' : 'false');
            }

            // --- UI: Toggle Switch ---
            function addInfiniteScrollToggle() {
                // Remove any existing toggle
                const oldToggle = document.querySelector('.vine-infinite-scroll-toggle-container');
                if (oldToggle && oldToggle.parentNode) oldToggle.parentNode.removeChild(oldToggle);

                // Create container
                const container = document.createElement('div');
                container.className = 'vine-infinite-scroll-toggle-container';
                container.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0 0 0 auto;
            `;

                // Label
                const label = document.createElement('label');
                label.textContent = 'Infinite Scroll';
                label.style.cssText = `
                font-weight: normal;
                font-size: 15px;
                margin-right: 4px;
                cursor: pointer;
            `;

                // Switch
                const toggle = document.createElement('input');
                toggle.type = 'checkbox';
                toggle.className = 'vine-infinite-scroll-toggle';
                toggle.style.transform = 'scale(1.2)';
                toggle.checked = getToggleState();
                toggle.title = 'Toggle infinite scrolling for reviews table';
                toggle.addEventListener('change', function () {
                    setToggleState(this.checked);
                    setInfiniteScrollEnabled(this.checked);
                });

                container.appendChild(label);
                container.appendChild(toggle);

                // Try to place in the right heading container
                const { right } = ensureReviewsHeadingContainers();
                if (right) {
                    right.appendChild(container);
                    console.log('Vine Modernized: Reviews infinite scroll - Toggle added to right heading container');
                } else {
                    // Fallback: try to find any suitable container
                    const headingTop = document.querySelector('.vvp-reviews-table--heading-top') ||
                        document.querySelector('.vvp-reviews-table--heading') ||
                        document.querySelector('[data-a-name="reviews"] .a-section:first-child') ||
                        document.querySelector('.a-section:has(.a-pagination)') ||
                        document.querySelector('.a-section:has(table)');

                    if (headingTop) {
                        headingTop.appendChild(container);
                        console.log('Vine Modernized: Reviews infinite scroll - Toggle added to heading container as fallback');
                    } else {
                        // Last resort: use the fallback function
                        console.log('Vine Modernized: Reviews infinite scroll - Using fallback toggle placement');
                        addInfiniteScrollToggleFallback();
                        return;
                    }
                }
            }

            // --- Search Feature Variables ---
            let originalReviewsTableHTML = null;
            let originalReviewsPaginationHTML = null;
            let reviewsSearchActive = false;

            // --- Infinite Scroll Logic ---
            let infiniteScrollEnabled = getToggleState();
            let infiniteScrollCurrentPage = 1;
            let infiniteScrollMaxPage = null;
            let infiniteScrollLoading = false;
            let infiniteScrollTable = null;
            let infiniteScrollContainer = null;
            let infiniteScrollObserver = null;

            function getCurrentPageFromDOM() {
                const selected = document.querySelector('ul.a-pagination li.a-selected a');
                if (selected) {
                    const n = parseInt(selected.textContent.trim(), 10);
                    if (!isNaN(n)) return n;
                }
                // fallback: try to parse from URL
                const m = window.location.search.match(/[?&]page=(\d+)/);
                if (m) return parseInt(m[1], 10);
                return 1;
            }
            function getMaxPageFromDOM() {
                const pag = document.querySelector('ul.a-pagination');
                if (!pag) return null;
                let max = 1;
                pag.querySelectorAll('a').forEach(a => {
                    const n = parseInt(a.textContent.trim(), 10);
                    if (!isNaN(n) && n > max) max = n;
                });
                return max;
            }

            function showLoadingIndicator(show, message = 'Loading more reviews...') {
                let indicator = document.querySelector('#infinite-scroll-indicator');
                if (!indicator) {
                    indicator = document.createElement('div');
                    indicator.id = 'infinite-scroll-indicator';
                    indicator.style.textAlign = 'center';
                    indicator.style.padding = '40px';
                    indicator.style.display = 'none';
                    indicator.style.fontSize = '16px';
                    indicator.style.color = '#888';
                    const table = document.querySelector('.a-normal.vvp-reviews-table');
                    if (table && table.parentNode) table.parentNode.appendChild(indicator);
                }
                if (show) {
                    indicator.innerHTML = `<span>${message}</span>`;
                    indicator.style.display = 'block';
                } else {
                    indicator.style.display = 'none';
                }
            }

            function attachInfiniteScroll() {
                if (!infiniteScrollContainer) return;
                detachInfiniteScroll();
                // Use IntersectionObserver for bottom detection
                infiniteScrollObserver = new IntersectionObserver(async (entries) => {
                    if (!infiniteScrollEnabled || infiniteScrollLoading) return;
                    if (entries.some(e => e.isIntersecting)) {
                        await loadNextInfiniteScrollPage();
                    }
                }, { root: null, threshold: 0.1 });
                // Add a sentinel div at the end of the table
                let sentinel = document.querySelector('.vine-infinite-scroll-sentinel');
                if (!sentinel) {
                    sentinel = document.createElement('div');
                    sentinel.className = 'vine-infinite-scroll-sentinel';
                    sentinel.style.height = '32px';
                    sentinel.style.width = '100%';
                    infiniteScrollTable.parentElement.appendChild(sentinel);
                }
                infiniteScrollObserver.observe(sentinel);
            }
            function detachInfiniteScroll() {
                if (infiniteScrollObserver) {
                    infiniteScrollObserver.disconnect();
                    infiniteScrollObserver = null;
                }
                // Remove sentinel
                const sentinel = document.querySelector('.vine-infinite-scroll-sentinel');
                if (sentinel && sentinel.parentNode) sentinel.parentNode.removeChild(sentinel);
                showLoadingIndicator(false);
            }

            async function loadNextInfiniteScrollPage() {
                if (infiniteScrollLoading) return;
                if (infiniteScrollMaxPage && infiniteScrollCurrentPage >= infiniteScrollMaxPage) {
                    showLoadingIndicator(true, 'No more reviews.');
                    return;
                }
                infiniteScrollLoading = true;
                showLoadingIndicator(true);
                const nextPage = infiniteScrollCurrentPage + 1;
                // Find the next page URL from pagination bar (even if hidden)
                let nextUrl = null;
                const pag = document.querySelector('ul.a-pagination');
                if (pag) {
                    const a = Array.from(pag.querySelectorAll('a')).find(a => {
                        const n = parseInt(a.textContent.trim(), 10);
                        return n === nextPage;
                    });
                    if (a) nextUrl = a.href;
                }
                if (!nextUrl) {
                    // fallback: construct from current URL
                    const url = new URL(window.location.href);
                    url.searchParams.set('page', nextPage);
                    nextUrl = url.toString();
                }
                try {
                    const response = await fetch(nextUrl, { credentials: 'same-origin' });
                    const text = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'text/html');
                    const newTable = doc.querySelector('.a-normal.vvp-reviews-table');
                    if (!newTable) {
                        showLoadingIndicator(true, 'No more reviews.');
                        infiniteScrollLoading = false;
                        return;
                    }
                    // Extract new rows (skip header)
                    const newRows = Array.from(newTable.querySelectorAll('tbody tr'));
                    if (!newRows.length) {
                        showLoadingIndicator(true, 'No more reviews.');
                        infiniteScrollLoading = false;
                        return;
                    }
                    // Append new rows to current table (skip header row if already present)
                    const tbody = infiniteScrollTable.querySelector('tbody');
                    // If first row is a heading, skip it
                    let startIdx = 0;
                    if (newRows[0].classList.contains('vvp-reviews-table--heading-row')) startIdx = 1;
                    for (let i = startIdx; i < newRows.length; i++) {
                        tbody.appendChild(newRows[i]);
                    }
                    infiniteScrollCurrentPage = nextPage;
                    showLoadingIndicator(false);
                } catch (e) {
                    showLoadingIndicator(true, 'Failed to load more reviews.');
                } finally {
                    infiniteScrollLoading = false;
                }
            }

            function setInfiniteScrollEnabled(enabled) {
                infiniteScrollEnabled = enabled;
                if (enabled) {
                    // Don't enable infinite scroll if search is active
                    if (reviewsSearchActive) return;
                    // Hide pagination bar
                    const pag = document.querySelector('ul.a-pagination');
                    if (pag) pag.style.display = 'none';
                    // Reset state
                    infiniteScrollCurrentPage = getCurrentPageFromDOM();
                    infiniteScrollMaxPage = getMaxPageFromDOM();
                    infiniteScrollTable = document.querySelector('.a-normal.vvp-reviews-table');
                    infiniteScrollContainer = infiniteScrollTable ? infiniteScrollTable.parentElement : null;
                    attachInfiniteScroll();
                } else {
                    // Show pagination bar
                    const pag = document.querySelector('ul.a-pagination');
                    if (pag) pag.style.display = '';
                    detachInfiniteScroll();
                }
            }

            // --- Initialize on DOM ready ---
            function waitForReviewsTableAndInit(attempt = 0) {
                // Debug: Log DOM structure for troubleshooting
                if (attempt === 0) {
                    debugReviewsPageStructure();
                }

                // Try multiple selectors for the heading and table
                const heading = document.querySelector('.vvp-reviews-table--heading-top') ||
                    document.querySelector('.vvp-reviews-table--heading') ||
                    document.querySelector('[data-a-name="reviews"] .a-section:first-child') ||
                    document.querySelector('.a-section:has(.a-pagination)') ||
                    document.querySelector('.a-section:has(table)');

                const table = document.querySelector('.a-normal.vvp-reviews-table') ||
                    document.querySelector('.vvp-reviews-table') ||
                    document.querySelector('table[data-a-name="reviews"]') ||
                    document.querySelector('.a-section table') ||
                    document.querySelector('table:has(tbody tr)');

                console.log('Vine Modernized: Reviews infinite scroll - Found elements:', {
                    heading: heading ? heading.className : 'not found',
                    table: table ? table.className : 'not found',
                    attempt: attempt
                });

                if (heading && table) {
                    console.log('Vine Modernized: Reviews infinite scroll - Initializing toggle');
                    addInfiniteScrollToggle();
                    setInfiniteScrollEnabled(getToggleState());
                    // Add search button
                    setTimeout(() => {
                        addReviewsSearchButton();
                    }, 100);
                } else if (attempt < 20) {
                    setTimeout(() => waitForReviewsTableAndInit(attempt + 1), 300);
                } else {
                    console.warn('Vine Modernized: Reviews infinite scroll - Could not find required elements after 20 attempts');
                    // Try to create toggle anyway with a fallback location
                    if (table) {
                        console.log('Vine Modernized: Reviews infinite scroll - Creating toggle with fallback location');
                        addInfiniteScrollToggleFallback();
                        setInfiniteScrollEnabled(getToggleState());
                        // Try to add search button with fallback
                        setTimeout(() => {
                            addReviewsSearchButton();
                        }, 100);
                    }
                }
            }

            // Add search button for reviews
            function addReviewsSearchButton() {
                console.log('[VineReviewsSearch] Injection attempt');
                // Always try to find or create the left heading container
                let headingTop = document.querySelector('.vvp-reviews-table--heading-top');
                if (!headingTop) {
                    console.log('[VineReviewsSearch] .vvp-reviews-table--heading-top not found');
                    return false;
                }
                let left = headingTop.querySelector('.vine-heading-left');
                if (!left) {
                    left = document.createElement('div');
                    left.className = 'vine-heading-left';
                    headingTop.appendChild(left);
                    console.log('[VineReviewsSearch] Created .vine-heading-left');
                }
                // Only inject if not already present
                if (left.querySelector('.vine-reviews-search-field-outer')) {
                    console.log('[VineReviewsSearch] Search button already present');
                    return true;
                }
                // Container for animation
                const outer = document.createElement('div');
                outer.className = 'vine-reviews-search-field-outer';
                // Magnifying glass button
                const btn = document.createElement('button');
                btn.className = 'vine-reviews-search-btn';
                btn.title = 'Search reviews by product title';
                btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99c.41.41 1.09.41 1.5 0s.41-1.09 0-1.5l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`;
                outer.appendChild(btn);
                // Text field
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'vine-reviews-search-field-inner';
                input.placeholder = 'Search product title...';
                input.setAttribute('aria-label', 'Search product titles in reviews');
                outer.appendChild(input);
                // Close button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'vine-reviews-search-close-btn';
                closeBtn.title = 'Close search';
                closeBtn.innerHTML = '&times;';
                closeBtn.style.display = 'none';
                outer.appendChild(closeBtn);
                // Spinner
                const spinner = document.createElement('div');
                spinner.className = 'vine-reviews-search-spinner';
                spinner.style.display = 'none';
                outer.appendChild(spinner);

                // Append at the beginning to place search button first
                left.insertBefore(outer, left.firstChild);
                // Ensure visible
                outer.style.display = 'flex';
                outer.style.visibility = 'visible';
                btn.style.display = 'flex';
                btn.style.visibility = 'visible';
                console.log('[VineReviewsSearch] Search button injected into .vine-heading-left');

                // --- Animation and focus logic ---
                function activate() {
                    outer.classList.add('vine-reviews-search-active');
                    input.style.display = 'block';
                    closeBtn.style.display = 'block';
                    btn.style.display = 'none';
                    setTimeout(() => input.focus(), 120);
                }
                function deactivate() {
                    outer.classList.remove('vine-reviews-search-active');
                    input.value = '';
                    input.style.display = '';
                    closeBtn.style.display = 'none';
                    btn.style.display = '';
                    spinner.style.display = 'none';
                    // Only restore table if a search was actually performed
                    if (reviewsSearchActive) {
                        restoreOriginalReviewsTable();
                        reviewsSearchActive = false;
                    }
                }
                btn.addEventListener('click', activate);
                closeBtn.addEventListener('click', deactivate);
                input.addEventListener('keydown', function (e) {
                    if (e.key === 'Escape') {
                        deactivate();
                    } else if (e.key === 'Enter') {
                        doReviewsSearch(input.value.trim());
                    }
                });
                // Note: Removed blur event listener - search only closes via X button or Escape key
                return true;
            }

            // Save original reviews table state
            function saveOriginalReviewsTable() {
                if (!originalReviewsTableHTML) {
                    const table = document.querySelector('.a-normal.vvp-reviews-table');
                    if (table) originalReviewsTableHTML = table.querySelector('tbody').innerHTML;
                }
                if (!originalReviewsPaginationHTML) {
                    const pag = document.querySelector('ul.a-pagination');
                    if (pag) originalReviewsPaginationHTML = pag.outerHTML;
                }
            }

            // Restore original reviews table state
            function restoreOriginalReviewsTable() {
                if (originalReviewsTableHTML) {
                    const table = document.querySelector('.a-normal.vvp-reviews-table');
                    if (table) table.querySelector('tbody').innerHTML = originalReviewsTableHTML;
                }
                if (originalReviewsPaginationHTML) {
                    const pag = document.querySelector('ul.a-pagination');
                    if (pag && pag.parentNode) pag.outerHTML = originalReviewsPaginationHTML;
                }
            }

            // Search reviews functionality (copied from orders implementation)
            async function doReviewsSearch(query) {
                if (!query) {
                    restoreOriginalReviewsTable();
                    reviewsSearchActive = false;
                    return;
                }
                saveOriginalReviewsTable();
                reviewsSearchActive = true;
                detachInfiniteScroll();
                const spinner = document.querySelector('.vine-reviews-search-spinner');
                if (spinner) spinner.style.display = 'inline-block';
                let maxPage = 1;
                const pag = document.querySelector('ul.a-pagination');
                if (pag) {
                    pag.querySelectorAll('a').forEach(a => {
                        const n = parseInt(a.textContent.trim(), 10);
                        if (!isNaN(n) && n > maxPage) maxPage = n;
                    });
                }
                let matches = [];
                for (let page = 1; page <= maxPage; page++) {
                    let url = new URL(window.location.href);
                    url.searchParams.set('page', page);
                    let html = null;
                    try {
                        html = await new Promise((resolve, reject) => {
                            GM_xmlhttpRequest({
                                method: 'GET',
                                url: url.toString(),
                                onload: r => resolve(r.responseText),
                                onerror: reject
                            });
                        });
                    } catch (e) { continue; }
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const rows = doc.querySelectorAll('.a-normal.vvp-reviews-table tbody tr');
                    for (let i = 1; i < rows.length; i++) { // Skip header row
                        const row = rows[i];
                        let title = '';
                        const titleEl = row.querySelector('.a-truncate-cut');
                        if (titleEl && titleEl.textContent.trim()) {
                            title = titleEl.textContent.trim();
                        } else {
                            const altTitleEl = row.querySelector('.a-truncate-full, .a-link-normal, [data-testid="product-title"]');
                            if (altTitleEl && altTitleEl.textContent.trim()) {
                                title = altTitleEl.textContent.trim();
                            }
                        }
                        const prodUrl = row.querySelector('.vvp-reviews-table--text-col a')?.href || '';
                        if (title && title.toLowerCase().includes(query.toLowerCase())) {
                            matches.push({ rowHTML: row.outerHTML, url: prodUrl });
                        }
                    }
                }
                const table = document.querySelector('.a-normal.vvp-reviews-table');
                if (!table) return;
                const tbody = table.querySelector('tbody');
                const headerRow = tbody.querySelector('tr');
                const headerRowClone = headerRow ? headerRow.cloneNode(true) : null;
                tbody.innerHTML = '';
                if (headerRowClone) tbody.appendChild(headerRowClone);
                if (matches.length === 0) {
                    const tr = document.createElement('tr');
                    const td = document.createElement('td');
                    td.colSpan = headerRowClone ? headerRowClone.children.length : 5;
                    td.className = 'vine-reviews-search-no-results';
                    td.textContent = 'No results found.';
                    tr.appendChild(td);
                    tbody.appendChild(tr);
                    if (spinner) spinner.style.display = 'none';
                    return;
                }
                for (let i = 0; i < matches.length; i++) {
                    const temp = document.createElement('tbody');
                    temp.innerHTML = matches[i].rowHTML;
                    const row = temp.firstElementChild;
                    tbody.appendChild(row);
                }
                if (spinner) spinner.style.display = 'none';
            }

            // Fallback function to add toggle when heading is not found
            function addInfiniteScrollToggleFallback() {
                // Remove any existing toggle
                const oldToggle = document.querySelector('.vine-infinite-scroll-toggle-container');
                if (oldToggle && oldToggle.parentNode) oldToggle.parentNode.removeChild(oldToggle);

                // Create container
                const container = document.createElement('div');
                container.className = 'vine-infinite-scroll-toggle-container';
                container.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 10px 0;
                padding: 8px 12px;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                justify-content: center;
            `;

                // Label
                const label = document.createElement('label');
                label.textContent = 'Infinite Scroll';
                label.style.cssText = `
                font-weight: normal;
                font-size: 15px;
                margin-right: 4px;
                cursor: pointer;
            `;

                // Switch
                const toggle = document.createElement('input');
                toggle.type = 'checkbox';
                toggle.className = 'vine-infinite-scroll-toggle';
                toggle.style.transform = 'scale(1.2)';
                toggle.checked = getToggleState();
                toggle.title = 'Toggle infinite scrolling for reviews table';
                toggle.addEventListener('change', function () {
                    setToggleState(this.checked);
                    setInfiniteScrollEnabled(this.checked);
                });

                container.appendChild(label);
                container.appendChild(toggle);

                // Try to find a good place to insert the toggle
                const table = document.querySelector('.a-normal.vvp-reviews-table') ||
                    document.querySelector('.vvp-reviews-table') ||
                    document.querySelector('table[data-a-name="reviews"]') ||
                    document.querySelector('.a-section table') ||
                    document.querySelector('table:has(tbody tr)');

                if (table && table.parentNode) {
                    // Insert before the table
                    table.parentNode.insertBefore(container, table);
                    console.log('Vine Modernized: Reviews infinite scroll - Toggle added with fallback placement');
                } else {
                    // Last resort: add to body
                    document.body.appendChild(container);
                    console.log('Vine Modernized: Reviews infinite scroll - Toggle added to body as last resort');
                }
            }

            // Debug function to help identify DOM structure
            function debugReviewsPageStructure() {
                console.log('Vine Modernized: Reviews infinite scroll - Debugging page structure...');

                // Log all sections
                const sections = document.querySelectorAll('.a-section');
                console.log('Found sections:', sections.length);
                sections.forEach((section, index) => {
                    console.log(`Section ${index}:`, {
                        className: section.className,
                        hasTable: !!section.querySelector('table'),
                        hasPagination: !!section.querySelector('.a-pagination'),
                        textContent: section.textContent.substring(0, 100) + '...'
                    });
                });

                // Log all tables
                const tables = document.querySelectorAll('table');
                console.log('Found tables:', tables.length);
                tables.forEach((table, index) => {
                    console.log(`Table ${index}:`, {
                        className: table.className,
                        id: table.id,
                        dataName: table.getAttribute('data-a-name'),
                        rows: table.querySelectorAll('tr').length
                    });
                });

                // Log pagination
                const pagination = document.querySelector('.a-pagination');
                console.log('Pagination found:', !!pagination);
                if (pagination) {
                    console.log('Pagination structure:', pagination.outerHTML);
                }
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => waitForReviewsTableAndInit());
            } else {
                waitForReviewsTableAndInit();
            }

            // Fallback: keep trying to inject search button every 500ms until it's present
            (function tryInjectReviewsSearchButtonInterval() {
                const interval = setInterval(() => {
                    const success = addReviewsSearchButton();
                    if (success) clearInterval(interval);
                }, 500);
            })();
        })();

        // === SYNC ON PAGE UNLOAD (Session-based) ===
        window.addEventListener('beforeunload', (e) => {
            // Only sync once per session on page unload
            if (!g_hasSessionAutoSynced && canAutoSync() && g_favoritesHasUnsavedChanges) {
                g_hasSessionAutoSynced = true;

                // Attempt synchronous sync (browsers limit async in beforeunload)
                // We use navigator.sendBeacon as a fallback for critical data
                console.log('Vine Modernized: Attempting page unload sync (1/session)');

                // Try to sync synchronously (may or may not complete)
                attemptAutoSync('page unload').catch(err => {
                    console.error('Vine Modernized: Page unload sync failed:', err);
                });

                // Show a warning about unsaved changes
                const quota = getSyncQuota();
                if (quota.count < PASTEBIN_DAILY_LIMIT) {
                    // Note: Most modern browsers ignore custom messages
                    e.returnValue = 'You have unsaved favorites changes. Auto-sync in progress...';
                }
            }
        });

        // === ADD CSS FOR TOGGLE SWITCH ===
        (function addToggleSwitchCSS() {
            if (document.getElementById('vine-toggle-switch-css')) return;
            const style = document.createElement('style');
            style.id = 'vine-toggle-switch-css';
            style.textContent = `
            .vine-switch {
                position: relative;
                display: inline-block;
                width: 40px;
                height: 20px;
            }
            .vine-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .vine-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .3s;
                border-radius: 20px;
            }
            .vine-slider:before {
                position: absolute;
                content: "";
                height: 14px;
                width: 14px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .3s;
                border-radius: 50%;
            }
            .vine-switch input:checked + .vine-slider {
                background-color: #007185;
            }
            .vine-switch input:checked + .vine-slider:before {
                transform: translateX(20px);
            }
        `;
            document.head.appendChild(style);
        })();

        // === THEME TOGGLE FEATURE ===
        (function initThemeToggle() {
            const STORAGE_KEY_SLEEK = 'vvp_sleek_dark_theme';
            const STYLE_ID_SLEEK = 'vh-sleek-dark-theme-style';

            function getSleekDarkThemeState() {
                return localStorage.getItem(STORAGE_KEY_SLEEK) === 'true';
            }

            function toggleSleekDarkTheme(enabled) {
                localStorage.setItem(STORAGE_KEY_SLEEK, enabled);
                const existingStyle = document.getElementById(STYLE_ID_SLEEK);

                if (enabled) {
                    if (!existingStyle) {
                        let css = GM_getResourceText("sleekCSS");
                        if (css) {
                            console.log('Vine Modernized: External CSS resource fetched, length:', css.length);

                            // Strip Stylus/Stylus-specific @-moz-document wrapper if present
                            // Most shared userstyles use this to scope the style, but it breaks raw injection.
                            if (css.includes('@-moz-document')) {
                                css = css.replace(/@-moz-document[^{]*\{/, '');
                                css = css.replace(/}\s*$/, ''); // Remove the very last closing brace
                                console.log('Vine Modernized: Stripped @-moz-document wrapper from Sleek Dark Theme');
                            }

                            const style = document.createElement('style');
                            style.id = STYLE_ID_SLEEK;
                            style.textContent = css;
                            document.head.appendChild(style);
                            removeEarlyThemeStyle();
                            console.log('Vine Modernized: Sleek Dark Theme applied');
                        } else {
                            const errorMsg = 'Vine Modernized: [ERROR] Failed to fetch Sleek Dark Theme (resource returned null/empty). Check if sleekCSS is defined in @resource and script has permissions.';
                            console.error(errorMsg);
                            alert(errorMsg);
                        }
                    }
                } else {
                    if (existingStyle) {
                        existingStyle.remove();
                        console.log('Vine Modernized: Sleek Dark Theme removed');
                    }
                }
                updateToggleUI();
            }

            function createToggleUI() {
                // Check if toggle already exists
                if (document.getElementById('vvp-theme-toggle-container')) {
                    return;
                }

                const tabs = document.querySelector('body .a-tabs[data-action="a-tabs"]');
                if (!tabs) return;

                // Create container
                const container = document.createElement('div');
                container.id = 'vvp-theme-toggle-container';

                // Create button
                const btn = document.createElement('button');
                btn.id = 'vvp-theme-toggle-btn';
                btn.innerHTML = '&#9776;'; // Hamburger icon
                btn.title = 'Toggle theme style';

                // Create dropdown
                const dropdown = document.createElement('div');
                dropdown.id = 'vvp-theme-toggle-dropdown';

                const lightOption = document.createElement('button');
                lightOption.className = 'theme-option';
                lightOption.innerHTML = 'Light Mode <span class="checkmark">✓</span>';

                const darkOption = document.createElement('button');
                darkOption.className = 'theme-option';
                darkOption.innerHTML = 'Dark Mode <span class="checkmark">✓</span>';

                dropdown.appendChild(lightOption);
                dropdown.appendChild(darkOption);

                container.appendChild(btn);
                container.appendChild(dropdown);
                tabs.appendChild(container);

                // Add styles if not present
                if (!document.getElementById('vvp-theme-toggle-style')) {
                    const style = document.createElement('style');
                    style.id = 'vvp-theme-toggle-style';
                    style.textContent = `
                    #vvp-theme-toggle-dropdown .theme-option.active .checkmark {
                        display: inline !important;
                    }
                `;
                    document.head.appendChild(style);
                }

                // Event listeners
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('show');
                });

                lightOption.addEventListener('click', () => {
                    toggleSleekDarkTheme(false);
                    dropdown.classList.remove('show');
                });

                darkOption.addEventListener('click', () => {
                    toggleSleekDarkTheme(true);
                    dropdown.classList.remove('show');
                });

                // Close dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (!container.contains(e.target)) {
                        dropdown.classList.remove('show');
                    }
                });

                updateToggleUI();
            }

            function updateToggleUI() {
                const dropdown = document.getElementById('vvp-theme-toggle-dropdown');
                if (!dropdown) return;
                const options = dropdown.querySelectorAll('.theme-option');
                const lightOption = options[0];
                const darkOption = options[1];
                const isDarkEnabled = getSleekDarkThemeState();

                if (lightOption) {
                    lightOption.classList.toggle('active', !isDarkEnabled);
                }
                if (darkOption) {
                    darkOption.classList.toggle('active', isDarkEnabled);
                }
            }

            // Initialize Modernized style by default
            document.body.classList.add('vvp-modern-style');

            // Initialize sleek dark theme if enabled
            if (getSleekDarkThemeState()) {
                toggleSleekDarkTheme(true);
            }

            // Create toggle UI
            function waitForTabsAndCreateUI(attempt = 0) {
                const tabs = document.querySelector('body .a-tabs[data-action="a-tabs"]');
                if (tabs) {
                    createToggleUI();
                } else if (attempt < 20) {
                    setTimeout(() => waitForTabsAndCreateUI(attempt + 1), 250);
                }
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => waitForTabsAndCreateUI());
            } else {
                waitForTabsAndCreateUI();
            }
        })();

        window.addEventListener('beforeunload', () => {
            vhModernized_isRestoredFeedActive = false;
            console.log('Vine Modernized: Reset restored feed state on beforeunload');
        });

        window.addEventListener('hashchange', () => {
            if (window.location.hash !== '#monitor') {
                vhModernized_isRestoredFeedActive = false;
                console.log('Vine Modernized: Reset restored feed state on hashchange');
            }
        });

        // --- SIDEBAR AJAX SYNC ---
        // Refreshes the category sidebar when the URL changes (e.g. via partial page loads)
        (function initSidebarSync() {
            let lastUrl = window.location.href;

            function refreshSidebar(prevUrl) {
                const currentUrl = window.location.href;
                console.log('Vine Modernized: URL changed, refreshing sidebar content...');
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: currentUrl,
                    onload: function (response) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, 'text/html');
                        const newContainer = doc.getElementById('vvp-browse-nodes-container');
                        const oldContainer = document.getElementById('vvp-browse-nodes-container');

                        if (newContainer && oldContainer) {
                            try {
                                const oldParams = new URL(prevUrl).searchParams;
                                const newParams = new URL(currentUrl).searchParams;
                                const oldPn = oldParams.get('pn');
                                const newPn = newParams.get('pn');

                                // If we are in the same parent category, disable the slide-down animation
                                if (oldPn === newPn && oldPn !== null) {
                                    oldContainer.classList.add('vvp-no-slide');
                                } else {
                                    oldContainer.classList.remove('vvp-no-slide');
                                }
                            } catch (e) {
                                oldContainer.classList.remove('vvp-no-slide');
                            }

                            oldContainer.innerHTML = newContainer.innerHTML;
                            console.log('Vine Modernized: Sidebar content synchronized successfully.');

                            injectFilterCollapseToggle();

                            // Re-initialize infinite scroll to pick up new categorial pagination links
                            if (typeof window.vineInfiniteScrollInit === 'function') {
                                setTimeout(() => {
                                    window.vineInfiniteScrollInit();
                                }, 800);
                            }
                        }
                    },
                    onerror: function (err) {
                        console.error('Vine Modernized: Failed to refresh sidebar:', err);
                    }
                });
            }

            // Monitor URL changes
            setInterval(() => {
                const currentUrl = window.location.href;
                if (currentUrl !== lastUrl) {
                    const prevUrl = lastUrl;
                    lastUrl = currentUrl;
                    // Only refresh if we're on the vine-items page
                    if (window.location.pathname.includes('/vine/vine-items')) {
                        refreshSidebar(prevUrl);
                    }
                }
            }, 500);
        })();
    }
})();
