// ==UserScript==
// @name         Amazon Vine Modernized
// @namespace    http://tampermonkey.net/
// @version      0.4.7
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
// ==/UserScript==

(function () {
    'use strict';
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
    const PASTEBIN_DAILY_LIMIT = 20;
    const PASTEBIN_WARNING_THRESHOLD = 15;
    const PASTEBIN_AUTO_DISABLE_THRESHOLD = 18;
    const PASTEBIN_LOGIN_URL = 'https://pastebin.com/api/api_login.php';
    const PASTEBIN_POST_URL = 'https://pastebin.com/api/api_post.php';
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
            api_user_password: null
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

    async function pastebinRequest(data) {
        const params = new URLSearchParams(data);
        console.log('Vine Modernized: [DEBUG] pastebinRequest starting...', { option: data.api_option, name: data.api_paste_name });

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: PASTEBIN_POST_URL,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: params.toString(),
                timeout: 30000, // 30 second timeout
                onload: (response) => {
                    console.log('Vine Modernized: [DEBUG] pastebinRequest onload', { status: response.status });
                    if (response.status === 200) {
                        const text = response.responseText.trim();
                        if (text.startsWith('Bad API request')) {
                            console.error('Vine Modernized: [DEBUG] pastebinRequest Bad API request:', text);
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
            compressToBase64: function(input) {
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
            decompressFromBase64: function(input) {
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
            let triple = bytes[i] << 16;
            let pad = '==';
            if (i + 1 < len) {
                triple |= bytes[i + 1] << 8;
                pad = '=';
            }
            base64 +=
                lookup[(triple >> 18) & 63] +
                lookup[(triple >> 12) & 63] +
                (i + 1 < len ? lookup[(triple >> 6) & 63] : '=') +
                pad;
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
        // Decode base64
        const binaryString = atob(rest);
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

            const ids = items.map((it) => {
                if (it == null) return '';
                if (typeof it === 'string' || typeof it === 'number') return String(it);
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

    async function deletePastebinPaste(pasteKey) {
        const config = loadPastebinConfig();
        const data = {
            api_dev_key: config.api_dev_key,
            api_user_key: config.api_user_key,
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

    async function listUserPastes() {
        const config = loadPastebinConfig();
        const data = {
            api_dev_key: config.api_dev_key,
            api_user_key: config.api_user_key,
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
            console.log('Vine Modernized: Found paste - key:', key, 'title:', title);
            pastes.push({ key, title, date });
        });

        console.log('Vine Modernized: Total pastes found:', pastes.length);
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

    // Wrapper functions for feed backups - WITH compression to reduce size
    async function syncFeedBackupToCloud(backupObject) {
        // Compute a stable signature to prevent uploading identical content from non-milestone triggers
        const LS_LAST_SIGNATURE_KEY = 'vine_nm_feed_last_backup_sig';

        function getLastSignature() {
            try { return localStorage.getItem(LS_LAST_SIGNATURE_KEY) || ''; } catch { return ''; }
        }
        function setLastSignature(sig) {
            try { localStorage.setItem(LS_LAST_SIGNATURE_KEY, sig || ''); } catch {}
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
            try { localStorage.setItem(LS_LAST_MULTIPLE_KEY, String(m)); } catch {}
        }

        function getLastTriggerTs() {
            const raw = localStorage.getItem(LS_LAST_TRIGGER_TS_KEY);
            const n = raw ? parseInt(raw, 10) : 0;
            return Number.isFinite(n) && n > 0 ? n : 0;
        }

        function setLastTriggerTs(ts) {
            try { localStorage.setItem(LS_LAST_TRIGGER_TS_KEY, String(ts)); } catch {}
        }

        function getLastSignature() {
            try { return localStorage.getItem(LS_LAST_SIGNATURE_KEY) || ''; } catch { return ''; }
        }

        function setLastSignature(sig) {
            try { localStorage.setItem(LS_LAST_SIGNATURE_KEY, sig || ''); } catch {}
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
                    alert(`Failed to sync to cloud: ${error.message}`);
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
                    alert(`Failed to sync to cloud: ${error.message}`);
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
            const now = Date.now();

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

        async function saveMonitorFeedBackup(backupObject) {
            try {
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
                    } catch {}
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

        function showToast(message, type = 'info') {
            const existingToast = document.querySelector('.vine-backup-toast');
            if (existingToast) existingToast.remove();
            const toast = document.createElement('div');
            toast.className = `vine-backup-toast vine-toast-${type}`;
            toast.textContent = message;
            toast.style.cssText = 'position:fixed; left:50%; transform:translateX(-50%); bottom:24px; background:#111; color:#fff; padding:10px 14px; border-radius:8px; z-index:9999; box-shadow:0 6px 16px rgba(0,0,0,0.25);';
            document.body.appendChild(toast);
            setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
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
                });
                // Set initial visibility
                updateMinItemsVisibility();
                // Move this control into the new Settings modal: hide original UI here
                const autoLabel = autoToggle.closest('label');
                if (autoLabel) autoLabel.style.display = 'none';
            }
            if (minItemsInput) {
                const currentMin = parseInt(localStorage.getItem('vine_monitor_min_items_backup') || '150');
                minItemsInput.value = String(currentMin);
                minItemsInput.addEventListener('change', () => {
                    const val = Math.max(50, Math.min(500, parseInt(minItemsInput.value || '150')));
                    localStorage.setItem('vine_monitor_min_items_backup', String(val));
                    minItemsInput.value = String(val);
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
            if (!backupObject || !backupObject.items) {
                console.error('Vine Modernized: Invalid backup object');
                return false;
            }
            try {
                // Handle compressed backups (new format) and legacy uncompressed ones
                let items = backupObject.items;

                if (backupObject.compressed || (typeof items === 'string' && items.startsWith(PASTE_COMPRESSION_MARKER))) {
                    try {
                        const jsonStr = await decompressString(items);
                        items = JSON.parse(jsonStr);
                        // Optionally normalize the object in-memory so future uses don't need to decompress again
                        backupObject.items = items;
                        backupObject.compressed = true;
                        console.log('Vine Modernized: Decompressed backup items successfully');
                    } catch (e) {
                        console.error('Vine Modernized: Failed to decompress backup items:', e);
                        return false;
                    }
                }

                if (!Array.isArray(items)) {
                    console.error('Vine Modernized: Backup items are not an array after (de)compression');
                    return false;
                }

                const grid = document.querySelector('#vvp-items-grid');
                if (!grid) {
                    console.error('Vine Modernized: Items grid not found');
                    return false;
                }
                grid.innerHTML = items.join('');
                grid.querySelectorAll('.vvp-item-tile').forEach(el => el.setAttribute('data-userscript-injected', 'true'));
                reinitializeItemDependentFeatures();
                console.log(`Vine Modernized: Restored ${backupObject.itemCount} items from backup`);
                return true;
            } catch (error) {
                console.error('Vine Modernized: Failed to load backup:', error);
                return false;
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
                const success = await loadMonitorFeedItemsFromBackup(backupObject);
                if (success) {
                    vhModernized_isRestoredFeedActive = true;
                    showToast(`Restored ${backupObject.itemCount} items from backup`, 'success');
                    document.title = `VHNM (${backupObject.itemCount})`;
                    initCustomSearchForRestoredFeed();
                } else {
                    showToast('Failed to restore backup', 'error');
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

        const MONITOR_INACTIVITY_THRESHOLD = 1800000; // 30 minutes
        const LAST_ACTIVITY_TIMESTAMP_KEY = 'vine_monitor_last_activity';
        const LAST_AUTO_BACKUP_TIMESTAMP_KEY = 'vine_monitor_last_auto_backup';

        function updateLastActivityTimestamp() {
            localStorage.setItem(LAST_ACTIVITY_TIMESTAMP_KEY, Date.now().toString());
        }

        function checkAutoBackupConditions() {
            if (isPerformingBackupOrRestore) return;
            const isMonitorPage = () => window.location.hash === '#monitor';
            if (!isMonitorPage()) return;
            const autoBackupEnabled = localStorage.getItem('vine_monitor_auto_backup_enabled') === 'true';
            if (!autoBackupEnabled) return;
            const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_TIMESTAMP_KEY) || '0');
            const lastAutoBackup = parseInt(localStorage.getItem(LAST_AUTO_BACKUP_TIMESTAMP_KEY) || '0');
            const now = Date.now();
            const timeSinceActivity = now - lastActivity;
            const timeSinceLastBackup = now - lastAutoBackup;
            const minItems = parseInt(localStorage.getItem('vine_monitor_min_items_backup') || '100');
            const grid = document.querySelector('#vvp-items-grid');
            const itemCount = grid ? grid.querySelectorAll('.vvp-item-tile').length : 0;
            const shouldBackup = timeSinceActivity >= MONITOR_INACTIVITY_THRESHOLD &&
                itemCount >= minItems &&
                timeSinceLastBackup >= (MONITOR_INACTIVITY_THRESHOLD / 2);
            if (shouldBackup) {
                createAutomaticFeedBackup();
            }
        }

        async function createAutomaticFeedBackup() {
            if (isPerformingBackupOrRestore) return;
            isPerformingBackupOrRestore = true;
            try {
                const items = extractAllCurrentFeedItems();
                const minItems = parseInt(localStorage.getItem('vine_monitor_min_items_backup') || '100');
                if (items.length < minItems) { return; }
                const now = Date.now();
                const backup = {
                    timestamp: now,
                    name: `Auto Backup ${formatDateTime(now)}`,
                    itemCount: items.length,
                    items
                };

                // Skip if unchanged since last backup (using same signature as cloud sync)
                try {
                    const sig = await computeFeedSignatureAsync(backup);
                    const lastSig = localStorage.getItem('vine_nm_feed_last_backup_sig') || '';
                    if (sig && sig === lastSig) {
                        console.log('Vine Modernized: Auto-backup skipped — feed unchanged since last backup.');
                        return;
                    }
                } catch (e) {
                    console.warn('Vine Modernized: Failed to compute signature for auto-backup; proceeding cautiously.', e);
                }

                const success = await saveMonitorFeedBackup(backup);
                if (success) {
                    localStorage.setItem(LAST_AUTO_BACKUP_TIMESTAMP_KEY, now.toString());
                    updateStatusMessage(`Auto-backup created (${items.length} items)`);
                    console.log(`Vine Modernized: Auto-backup created with ${items.length} items`);
                }
            } finally {
                isPerformingBackupOrRestore = false;
            }
        }

        // Update activity when tiles are added
        (function initActivityObserver() {
            const attach = () => {
                const grid = document.querySelector('#vvp-items-grid');
                if (!grid) { setTimeout(attach, 500); return; }
                const obs = new MutationObserver(muts => {
                    for (const m of muts) {
                        if (m.addedNodes && m.addedNodes.length > 0) {
                            updateLastActivityTimestamp();
                            break;
                        }
                    }
                });
                obs.observe(grid, { childList: true });
            };
            attach();
        })();

        // Periodic checker
        setInterval(checkAutoBackupConditions, 5 * 60 * 1000);

        function ensureMonitorConsentOnScrollEnd() {
            // Show the toggle button for monitor page
            if (!isMonitorPage()) return;
            // Always show the toggle button on monitor page
            showMonitorConsentUI();
        }

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
                    newItems.forEach(item => {
                        itemsGrid.appendChild(document.importNode(item, true));
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
            }
        }

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

            // Create new observer for this grid
            itemsGridObserver = new MutationObserver(mutations => {
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

        // Insert before the theme toggle if it exists, otherwise append
        const themeToggle = tabsContainer.querySelector('#vvp-theme-toggle-container');
        if (themeToggle) {
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
                <div style="padding: 16px; border-bottom: 1px solid #eee;">
                    <div style="font-weight: 600; margin-bottom: 8px;">Cloud Sync</div>
                    <div id="sync-status" style="font-size: 13px; color: #666;"></div>
                    <div id="sync-quota" style="font-size: 12px; color: #888; margin-top: 4px;"></div>
                    <div id="unsaved-changes-notice" style="display: none; margin-top: 8px; padding: 8px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; font-size: 12px; color: #856404;">
                        <strong>⚠️ Unsaved changes detected</strong>
                        <div id="unsaved-count" style="margin-top: 4px;"></div>
                    </div>
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

        // Clear previous handlers
        toCloud.onclick = null;
        fromCloud.onclick = null;
        autoToggleBtn.onclick = null;

        if (context === 'feed') {
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
            toCloud.onclick = (e) => { e.stopPropagation(); handleSyncToCloud(false); };
            fromCloud.onclick = async (e) => { e.stopPropagation(); await handleSyncFromCloud(); };
            autoCheckbox.checked = localStorage.getItem('vine_favorites_auto_sync') === 'true';
            autoToggleBtn.onclick = (e) => handleAutoSyncToggle(e);
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
                         <h3 class="a-spacing-medium" style="font-size: 24px; font-weight: 300; margin: 0;">Your Favorited Items</h3>
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

        // Update main status
        if (!isPastebinConfigured()) {
            statusEl.innerHTML = '<span style="color: #b12704;">⚠️ Not configured</span>';
            if (quotaEl) quotaEl.innerHTML = '';
        } else {
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
                alert(`Failed to sync to cloud: ${error.message}`);
            }
            if (statusEl) statusEl.innerHTML = '<span style="color: #b12704;">Sync failed ✗</span>';
        } finally {
            g_favoritesSyncInProgress = false;
        }
    }

    async function handleSyncFromCloud() {
        if (g_favoritesSyncInProgress) {
            alert('Sync already in progress...');
            return;
        }

        if (!isPastebinConfigured()) {
            showPastebinSettings();
            return;
        }

        const confirmed = confirm('This will merge cloud favorites with your local favorites. Continue?');
        if (!confirmed) return;

        g_favoritesSyncInProgress = true;
        const statusEl = document.querySelector('#sync-status');
        if (statusEl) statusEl.innerHTML = '<span style="color: #007185;">Importing... ⏳</span>';

        try {
            const paste = await findFavoritesPaste();
            if (!paste) {
                alert('No favorites found in cloud. Please sync to cloud first.');
                updateSyncStatus();
                return;
            }

            const content = await getPastebinPaste(paste.key);
            const cloudFavorites = JSON.parse(content);

            if (!Array.isArray(cloudFavorites)) {
                throw new Error('Invalid favorites data in cloud');
            }

            // Merge with local favorites
            const localFavorites = getFavorites();
            const mergedFavorites = mergeFavorites(localFavorites, cloudFavorites);

            // Save merged favorites
            saveFavorites(mergedFavorites);

            // Update UI
            renderFavoritesPage();
            updateSyncStatus();

            alert(`✓ Successfully imported ${cloudFavorites.length} favorites from cloud.\nMerged with ${localFavorites.length} local favorites.\nTotal: ${mergedFavorites.length} favorites.`);
        } catch (error) {
            console.error('Vine Modernized: Import from cloud failed:', error);
            alert(`Failed to import from cloud: ${error.message}`);
            if (statusEl) statusEl.innerHTML = '<span style="color: #b12704;">Import failed ✗</span>';
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

            // Fetch cloud favorites
            const cloudFavorites = await handleSyncFromCloud();
            console.log(`Vine Modernized: Retrieved ${cloudFavorites.length} cloud favorites`);

            // Merge favorites (local takes priority)
            const mergedFavorites = mergeFavorites(localFavorites, cloudFavorites);
            console.log(`Vine Modernized: Merged into ${mergedFavorites.length} total favorites`);

            // Save merged favorites locally
            saveFavorites(mergedFavorites);

            // Push merged favorites to cloud
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
            background: white; padding: 24px; border-radius: 8px;
            max-width: 550px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            max-height: 90vh; overflow-y: auto;
        `;

        content.innerHTML = `
            <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 400;">Pastebin API Settings</h2>
            <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">
                Configure your Pastebin API credentials to enable cloud sync for favorites.
                Get your API Dev Key from <a href="https://pastebin.com/doc_api" target="_blank" style="color: #007185;">Pastebin API documentation</a>
            </p>

            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">API Dev Key *</label>
                <input type="text" id="api-dev-key" value="${config.api_dev_key || ''}"
                    placeholder="Enter your Pastebin API Dev Key" required
                    style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-family: monospace;">
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                    Required to access Pastebin API
                </div>
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">Pastebin Username</label>
                <input type="text" id="api-username" value="${config.api_user_name || ''}"
                    placeholder="Enter your Pastebin username"
                    style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                    Your Pastebin account username (required to post under your account)
                </div>
            </div>

            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">Pastebin Password</label>
                <input type="password" id="api-password" value="${config.api_user_password || ''}"
                    placeholder="Enter your Pastebin password"
                    style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                    Your Pastebin account password (will be used to generate User Key)
                </div>
            </div>

            <div style="margin-bottom: 16px;">
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

            <div id="pastebin-status" style="margin-bottom: 16px; padding: 10px; border-radius: 4px; display: none; font-size: 14px;"></div>

            <div style="display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap;">
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
                    <span class="a-button-inner"><span class="a-button-text">Save Settings</span></span>
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

                // Automatically save the configuration
                const newConfig = {
                    api_dev_key: devKey,
                    api_user_name: username,
                    api_user_password: password,
                    api_user_key: userKey
                };
                savePastebinConfig(newConfig);

                showStatus('✓ User Key generated and saved successfully!');
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
                api_user_key: userKey || null
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
        const minItems = parseInt(localStorage.getItem('vine_monitor_min_items_backup') || '150');

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
            </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        const autoBackupInput = content.querySelector('#ms-auto-backup');
        const minItemsInput = content.querySelector('#ms-min-items');
        const minItemsRow = content.querySelector('#ms-min-items-row');
        const enableMonitorInput = content.querySelector('#ms-enable-monitor');
        // Immediate-apply behavior: persist and sync on change

        // Initialize
        autoBackupInput.checked = !!autoEnabled;
        minItemsInput.value = String(isFinite(minItems) ? minItems : 150);
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

        const clampMinItems = (val) => Math.max(50, Math.min(500, parseInt(val || '150')));
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

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }

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
        try { localStorage.setItem('vvp_vine_csrf_cache', JSON.stringify(g_vineCsrfCache)); } catch {}
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
            (function markBuyNowActive(){
                try {
                    const now = Date.now();
                    // short-lived activity marker used only in this tab to gate form submission patch
                    sessionStorage.setItem('vvp_buy_now_active', '1');
                    sessionStorage.setItem('vvp_buy_now_active_ts', String(now));
                    // origin marker used by the SPC page (new tab) to confirm this came from Buy Now
                    localStorage.setItem('vvp_checkout_origin', 'vine-buy-now');
                    localStorage.setItem('vvp_checkout_ts', String(now));
                } catch {}
            })();

            const item = getItemDataFromTile(tile);
            if (item?.recommendationId) {
                try { await fetch(`/vine/api/recommendations/${encodeURIComponent(item.recommendationId)}`, { credentials: 'include' }); } catch {}
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
                } catch {}
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
            } catch {}
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
                try { el.click?.(); } catch {}
            }
        };

        // 0) If modal is already open, skip re-opening
        let modalContent = document.querySelector('.a-popover-modal #vvp-product-details-modal--content');
        if (!modalContent) {
            // 1) Open the modal via the existing See details control
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

        // 5) Ensure the button is enabled
        const isDisabled = (el) => el.classList?.contains('a-button-disabled') || el.getAttribute?.('aria-disabled') === 'true';
        const enabledWaitStart = Date.now();
        while (isDisabled(clickTarget) && Date.now() - enabledWaitStart < 8000) {
            await new Promise(r => setTimeout(r, 120));
        }

        // 6) Click the wrapper (preferred), and as a backup click the inner input
        dispatchSeq(clickTarget);
        const innerInput = clickTarget.querySelector?.('.a-button-input');
        if (innerInput) dispatchSeq(innerInput);
    }

    // === AUTO-CHECKOUT SETTINGS + CHECKOUT FLAGGING ===
    (function initAutoCheckoutSettings() {
        const LS_KEY = 'vvp_auto_checkout';

        function isAutoCheckoutEnabled() {
            const v = (localStorage.getItem(LS_KEY) || 'false').toLowerCase();
            return v === 'true';
        }

        function setAutoCheckoutEnabled(val) {
            try { localStorage.setItem(LS_KEY, String(Boolean(val))); } catch {}
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
                } catch {}
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
                } catch {}
            } catch {}
        }, true);

        // Some AUI flows submit the form programmatically via form.submit(), which bypasses submit events.
        // Monkey‑patch HTMLFormElement.prototype.submit to ensure vvp_auto is appended in that case too.
        (function patchFormSubmitOnce(){
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
                            } catch {}
                            // Optional debug
                            if ((localStorage.getItem('vvp_buy_now_debug')||'').includes('log')) {
                                console.log('Vine Modernized: patched form.submit applied vvp_auto=', enabled);
                            }
                        }
                    } catch {}
                    return nativeSubmit.apply(this, arguments);
                };
            } catch {}
        })();
    })();

    function addBuyNowButton(tile) {
        if (!tile || tile.querySelector('.vvp-buy-now-btn')) return; // Avoid duplicates

        // Find the button container where "See details" lives, or fall back to content area
        const content = tile.querySelector('.vvp-item-tile-content') || tile;
        const btnContainer = tile.querySelector('.vh-btn-container') || content;
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

        if (detailsBtn && detailsBtn.parentElement) {
            // Place to the right of "See details"
            detailsBtn.parentElement.appendChild(buyBtn);
        } else {
            btnContainer.appendChild(buyBtn);
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
        const isCurrentlyFavorited = favorites.some(item => item.asin === asin);

        if (isCurrentlyFavorited) {
            favorites = favorites.filter(item => item.asin !== asin);
            console.log(`Vine Modernized: Unfavorited item ${asin}.`);
        } else {
            // Add timestamp when favoriting new items
            const favoriteItem = {
                ...itemData,
                timestamp: Date.now()
            };
            favorites.push(favoriteItem);
            console.log(`Vine Modernized: Favorited item ${asin}. Data:`, favoriteItem);
        }

        saveFavorites(favorites);

        // Mark as changed for cloud sync
        markFavoritesAsChanged();

        // Update all buttons for this ASIN on the page (tile and modal)
        document.querySelectorAll(`.favorite-btn[data-asin="${asin}"]`).forEach(btn => {
            if (isCurrentlyFavorited) {
                btn.classList.remove('favorited');
                btn.innerHTML = createUnfavoritedHeartSVG();
                btn.title = 'Add to Favorites';
            } else {
                btn.classList.add('favorited');
                btn.innerHTML = createFavoritedHeartSVG();
                btn.title = 'Remove from Favorites';
            }
        });

        if (document.querySelector('#vvp-favorites-container')?.style.display !== 'none') {
            renderFavoritesPage();
        }
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
        return getFavorites().some(item => item.asin === asin);
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

    function showFavoritesPage() {
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
    }

    function renderFavoritesPage() {
        const grid = document.querySelector('#vvp-favorites-grid');
        const favorites = getFavorites();

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
            // Try multiple selectors for robustness
            const searchContainer = document.querySelector('.vvp-container-search');
            if (!searchContainer) return null;

            const input = searchContainer.querySelector('input[type="search"]') ||
                searchContainer.querySelector('input[name="search"]') ||
                searchContainer.querySelector('.a-search input');

            return input;
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

        // Position dropdown relative to search bar
        function updateDropdownPosition() {
            if (!dropdown) return;

            const searchContainer = document.querySelector('.vvp-container-search');
            const searchBar = searchContainer?.querySelector('.a-search');

            if (!searchContainer || !searchBar) return;

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

            const searchContainer = document.querySelector('.vvp-container-search');
            if (!searchContainer) return;

            if (!searchContainer.contains(e.target) && !dropdown.contains(e.target)) {
                hideDropdown();
            }
        }

        // Initialize autocomplete
        function initAutocomplete() {
            const searchInput = findSearchInput();
            if (!searchInput) {
                console.log('Vine Modernized: Search input not found, will retry...');
                return false;
            }

            // Check if already initialized
            if (searchInput.dataset.autocompleteInitialized === 'true') {
                return true;
            }

            const searchContainer = document.querySelector('.vvp-container-search');
            if (!searchContainer) {
                console.log('Vine Modernized: Search container not found');
                return false;
            }

            // Create dropdown
            createDropdown();
            if (!dropdown) return false;

            // Make search container position relative for dropdown positioning
            const computedStyle = window.getComputedStyle(searchContainer);
            if (computedStyle.position === 'static') {
                searchContainer.style.position = 'relative';
            }

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

            // Append dropdown to search container
            if (!searchContainer.contains(dropdown)) {
                searchContainer.appendChild(dropdown);
            }

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
                            const searchInput = node.querySelector ? node.querySelector('.vvp-container-search input[type="search"]') : null;
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

    // --- SIDEBAR BURGER MENU TOGGLE ---
    function injectSidebarBurgerMenu() {
        const filterContainer = document.getElementById('vvp-filter-container');
        const sidebar = document.getElementById('vvp-browse-nodes-container');
        if (!filterContainer || !sidebar) return;

        // Prevent duplicate burger
        if (document.getElementById('vine-burger-menu')) return;

        // --- Persistent state logic ---
        function getQueueName() {
            const m = window.location.href.match(/queue=([a-zA-Z0-9_]+)/);
            return m ? m[1] : 'default';
        }
        const queueName = getQueueName();
        const STORAGE_KEY = `vine_burger_menu_state_${queueName}`;
        function saveSidebarState(collapsed) {
            localStorage.setItem(STORAGE_KEY, collapsed ? 'collapsed' : 'open');
        }
        function getSidebarState() {
            return localStorage.getItem(STORAGE_KEY) || 'open';
        }

        // Create burger button
        const burger = document.createElement('button');
        burger.id = 'vine-burger-menu';
        burger.innerHTML = '&#9776;'; // ☰
        burger.title = 'Show/hide categories';
        burger.setAttribute('aria-label', 'Show or hide categories');
        burger.style.cssText = `
            font-size: 2em;
            background: none;
            border: none;
            cursor: pointer;
            margin: 0.5em 0.5em 0.5em 0;
            color: inherit;
            z-index: 1001;
            align-self: flex-start;
        `;

        // Insert burger before the sidebar
        filterContainer.insertBefore(burger, filterContainer.firstChild);

        // Toggle sidebar on click (toggle class on parent)
        burger.addEventListener('click', () => {
            filterContainer.classList.toggle('sidebar-collapsed');
            const isCollapsed = filterContainer.classList.contains('sidebar-collapsed');
            saveSidebarState(isCollapsed);
        });

        // Add a CSS rule for burger hover and sidebar-collapsed
        const style = document.createElement('style');
        style.textContent = `
            #vine-burger-menu:hover {
                background: rgba(0,0,0,0.07);
                border-radius: 4px;
            }
            #vvp-browse-nodes-container {
                transition: all 0.2s;
            }
            #vvp-filter-container.sidebar-collapsed #vvp-browse-nodes-container {
                display: none !important;
            }
        `;
        document.head.appendChild(style);

        // --- Restore sidebar state on load ---
        if (getSidebarState() === 'collapsed') {
            filterContainer.classList.add('sidebar-collapsed');
        } else {
            filterContainer.classList.remove('sidebar-collapsed');
        }
    }

    // Wait for DOM and sidebar to exist
    function waitForSidebarAndInject(attempt = 0) {
        // Prevent burger menu on monitor pages
        if (window.location.hash === '#monitor') return;
        if (document.getElementById('vvp-filter-container') && document.getElementById('vvp-browse-nodes-container')) {
            injectSidebarBurgerMenu();
        } else if (attempt < 20) {
            setTimeout(() => waitForSidebarAndInject(attempt + 1), 250);
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => waitForSidebarAndInject());
    } else {
        waitForSidebarAndInject();
    }

    // --- PARTIAL PAGE UPDATE FOR CATEGORY FILTERS (robust version) ---
    function enablePartialCategoryUpdates() {
        const nodesContainer = document.getElementById('vvp-browse-nodes-container');
        if (!nodesContainer) return;

        nodesContainer.addEventListener('click', function (e) {
            // Only handle left-clicks without modifier keys
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const link = e.target.closest('a.a-link-normal');
            if (!link || !link.href || link.target === '_blank') return;
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
        } else if (attempt < 20) {
            setTimeout(() => waitForCategorySidebarAndEnable(attempt + 1), 250);
        }
    }
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
    window.addEventListener('hashchange', updateBodyHashAttr);
    updateBodyHashAttr();

    // Move Notification Monitor header elements into the main card for #monitor (robust version)
    function moveMonitorHeaderElements(attempt = 0) {
        if (window.location.hash !== '#monitor') return;
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
        // Move user tier info into the left stats column
        if (tier.parentNode !== statsCol) statsCol.appendChild(tier);
        // Move the filter card to the very bottom of the main card
        if (filters.parentNode !== card || card.lastElementChild !== filters) {
            card.appendChild(filters);
        }
    }
    // MutationObserver to re-run move logic if header UI changes
    function observeMonitorHeaderUI() {
        const headerUI = document.getElementById('vh-notifications-monitor-header-ui');
        if (!headerUI) {
            setTimeout(observeMonitorHeaderUI, 200);
            return;
        }
        const observer = new MutationObserver(() => moveMonitorHeaderElements());
        observer.observe(headerUI, { childList: true, subtree: true });
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
        // Function to close alert with fade animation
        function closeAlertWithFade(alert) {
            if (!alert || alert.classList.contains('closing')) return;

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

        // Watch for error alerts to appear
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            // Check if the error alert was added directly
                            if (node.id === 'vvp-generic-request-error-msg') {
                                setupAutoClose(node);
                            }
                            // Check if the error alert was added as a child
                            const errorAlert = node.querySelector ? node.querySelector('#vvp-generic-request-error-msg') : null;
                            if (errorAlert) {
                                setupAutoClose(errorAlert);
                            }
                        }
                    });
                }
            });
        });

        // Start observing
        observer.observe(document.body, { childList: true, subtree: true });

        // Also check if alert already exists
        const existingAlert = document.getElementById('vvp-generic-request-error-msg');
        if (existingAlert) {
            setupAutoClose(existingAlert);
        }
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
        // Store scroll position for failed order notifications
        let savedScrollPosition = null;

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
        const STORAGE_KEY = 'vvp_theme_style';

        function getThemeStyle() {
            return localStorage.getItem(STORAGE_KEY) || 'modern';
        }

        function setThemeStyle(style) {
            localStorage.setItem(STORAGE_KEY, style);
            document.body.classList.remove('vvp-legacy-style', 'vvp-modern-style');
            if (style === 'legacy') {
                document.body.classList.add('vvp-legacy-style');
            } else {
                document.body.classList.add('vvp-modern-style');
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

            const modernOption = document.createElement('button');
            modernOption.className = 'theme-option';
            modernOption.innerHTML = 'Modern Tabs <span class="checkmark">✓</span>';

            const legacyOption = document.createElement('button');
            legacyOption.className = 'theme-option';
            legacyOption.innerHTML = 'Legacy Tabs <span class="checkmark">✓</span>';

            dropdown.appendChild(modernOption);
            dropdown.appendChild(legacyOption);

            container.appendChild(btn);
            container.appendChild(dropdown);
            tabs.appendChild(container);

            // Event listeners
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });

            modernOption.addEventListener('click', () => {
                setThemeStyle('modern');
                dropdown.classList.remove('show');
            });

            legacyOption.addEventListener('click', () => {
                setThemeStyle('legacy');
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
            const modernOption = document.querySelector('#vvp-theme-toggle-dropdown .theme-option');
            const legacyOption = document.querySelectorAll('#vvp-theme-toggle-dropdown .theme-option')[1];
            const currentStyle = getThemeStyle();

            if (modernOption && legacyOption) {
                modernOption.classList.toggle('active', currentStyle === 'modern');
                legacyOption.classList.toggle('active', currentStyle === 'legacy');
            }
        }

        // Initialize theme based on stored preference
        const initialStyle = getThemeStyle();
        document.body.classList.add(initialStyle === 'legacy' ? 'vvp-legacy-style' : 'vvp-modern-style');

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
})();
