This document provides a comprehensive inventory of every feature, tweak, and logic enhancement contained within the **Amazon Vine Modernized** userscript, based on the provided source code and target HTML. As a coding agent, you do not need to re-implement every single feature listed here, they are simply for reference. 

---

## Project Background & "The Why"
The Amazon Vine portal is the primary gateway for "Voices" to request free products. However, the native interface suffers from significant "technical debt"—utilizing web design standards from the early 2010s. 

**The primary motivations for this project were:**
*   **UI/UX Optimization & Ergonomic Refactoring:** The native site is cluttered with standard retail headers, footers, and "Everywhere Carts" that are irrelevant to the Vine workflow. This creates high cognitive load and distracts from the primary task: finding and reviewing products. The original site is a "Desktop-locked" experience. It utilizes fixed-width tables and lacks touch-friendly targets, rendering it nearly impossible to use effectively on smartphones or tablets. Amazon's layout is inefficient. 
*   **The Velocity Gap:** In the Vine program, high-demand items are claimed in seconds. Amazon’s native UI requires multiple clicks and modal loading times, putting manual users at a disadvantage.
*   **Discovery Friction:** Navigating thousands of items across dozens of pages with full-page reloads makes finding relevant products an exhausting chore.
*   **Information Silos:** User data, such as "Favorited" items, were non-existent.
*   **Mobile Neglect:** The native site is virtually unusable on smartphones, lacking responsiveness and touch-friendly controls.

---

### 1. Core UI & Global Theming
*   **Early Theme Injection:** Injects critical CSS at `document-start` to set the color scheme and background before the browser renders the original UI, preventing "flash of unstyled content" (FOUC).
*   **External "Sleek" Theme Support:** Support for an external "Sleek Dark Theme" CSS resource with logic to strip `@-moz-document` wrappers for standard browser compatibility.
*   **Custom Tab Titles:** Dynamically changes the browser tab title based on the current Vine queue (e.g., "Vine - RFY", "Vine - AFA", "Vine - AI", "Vine - Reviews") with a delay to prevent Amazon's scripts from overwriting it.
*   **Horizontal Scrollbar Guard:** A global mechanism that monitors the document width and forcefully hides the horizontal scrollbar unless content truly protrudes beyond a 40px margin of error.
*   **Navigation Bar Auto-Hide:**
    *   Hides the top Amazon navigation bar by default.
    *   Logic to show the navbar only when the mouse is within 50px of the top.
    *   0.5-second delay timer on hover to prevent accidental triggers.
    *   Hides immediately when the mouse leaves the top area or hovers over specific Vine header elements.
*   **Transparent Logo:** Replaces the standard Amazon logo with a transparent version for better theme integration.
*   **Global Theme Toggle:** Adds a hamburger menu icon (`☰`) to the tab bar allowing users to switch between Light and Sleek Dark modes via a custom dropdown.

---

### 2. Navigation & Discovery Enhancements
*   **Modernized Tab Bar:** 
    *   Redesigns the main navigation tabs (`Vine Items`, `Reviews`, etc.) with a "Modern" style featuring bold underline indicators instead of boxy buttons.
    *   Center-reveal hover animations for tab underlines.
*   **Partial Page (AJAX) Tab Updates:** Replaces full page reloads with background fetches when switching between main tabs, updating only the content container and the URL.
*   **Category Sidebar Redesign:**
    *   Transforms the "Browse" nodes into a floating card with modern padding and border-radius.
    *   **Collapse/Expand Toggle:** Adds a "Collapse" link to the sidebar header to hide the category list.
    *   **Partial Category Updates:** Logic to fetch category grid results via AJAX without reloading the entire page.
    *   **Sidebar Sync:** Logic to periodically re-sync the category count and links if the URL changes via external means.
*   **Root Page Cleanup:** On the base `/vine/vine-items` page, the script clears the item container and deselects the "All" button to provide a cleaner entry point.
*   **Search Bar Modernization:** 
    *   Redesigns the search input with high-contrast borders or modern shadows (toggleable).
    *   **Search in Tabs:** Optional logic to move the entire search bar into the tab bar as a collapsible icon that expands on hover/focus.
*   **Search Autocomplete Dropdown:** 
    *   A custom-built autocomplete system that fetches live results as the user types.
    *   **Infinite Scroll inside Search:** Logic to load more search results within the dropdown as the user scrolls to the bottom.
    *   **Keyword Parsing:** Logic to extract the first 5 words of a product title to perform a search.
    *   **Result Caching:** Maps and stores query results to prevent redundant network requests.

---

### 3. Product Grid & Item Cards
*   **Responsive Grid System:** Replaces Amazon's layout with a custom CSS Grid that uses `minmax` logic to fit as many items as possible based on screen width.
*   **Tile Scale Controls:** Adds `+` and `−` buttons to the tab bar to dynamically scale the size of product tiles (from 60% to 160%).
*   **Visual Tile Enhancements:** 
    *   Adds soft-shadows and border-radius to items.
    *   **Hover Scaling:** Tiles slightly scale up and gain deeper shadows on mouse-over.
*   **Product Photo Previewer:**
    *   Allows users to click a product thumbnail to open a full-screen high-res image gallery.
    *   **Image Block Scraping:** Logic to fetch the `ImageBlockATF` script from the product's detail page to find all available photos.
    *   **Navigation Controls:** Keyboard (arrows/Esc) and on-screen navigation for browsing multiple product photos.
*   **Dynamic Button Row:** Normalizes the "See Details" and "Buy Now" buttons into a single flex row that scales proportionally with the tile size.
*   **"Buy Now" Button Injection:** 
    *   Injects a "Buy Now" button into every tile.
    *   **UI Automation:** When clicked, it opens the hidden Amazon detail modal in the background, waits for the "Request Product" button to become active, and clicks it automatically.
    *   **Auto-Order Logic:** Appends a `vvp_auto` flag to the checkout form to signal the order should be placed immediately.

---

### 4. Interactive & Social Features
*   **Favorites System:**
    *   **Heart Button Injection:** Adds a heart icon to the top-right of every product image (including inside the Details modal).
    *   **Soft Deletion Logic:** Items are never truly deleted locally; they are marked with a `deleted: true` flag and a timestamp to facilitate smart syncing between multiple devices.
    *   **Favorites Page:** A dedicated custom tab and view that renders all saved items in a grid.
    *   **Export/Import:** Logic to save favorites to a JSON file or restore them from a file.
*   **Amazon Reviewer Tools Integration:**
    *   **Orders Counter:** Appends a live count of today's orders to the "User Tier" info (e.g., `[Orders: 5/8]`).
    *   **Live Scraping:** Fetches the `/vine/orders` page in the background to calculate the count.
    *   **Actor Logic:** Identifies if a user is "Silver" (3 orders) or "Gold" (8 orders) to set the daily limit.

---

### 5. Vine Helper & Monitor (#monitor) Tweaks
*   **Header Card Redesign:** Reorganizes the Vine Helper Notification Monitor (VHNM) header into a structured 3-column dashboard.
*   **Header Minimize/Maximize:**
    *   Adds a dedicated minimize strip to the top of the monitor UI.
    *   **Mini Bar Mode:** When minimized, the header transforms into a slim 56px strip containing only the brand icon, search bar, and connection status.
*   **Auto-Backup System:**
    *   **Delta-Based Triggers:** Automatically creates a local/cloud backup when the script detects 100+ new ASINs in the monitor feed.
    *   **Manual Snapshots:** "Backup Feed Now" button to save the current state of the monitor grid.
    *   **Backup Management:** A modal to view, restore, or delete past snapshots.
    *   **Retention Policy:** Automatically cleans up backups older than a user-defined period (default 7 days).
*   **Feed Restoration Logic:** 
    *   Allows "re-injecting" a saved backup into the live grid. 
    *   **Custom Search Integration:** Extends the search bar logic to filter these "injected" items.
*   **Auto-Reconnection Logic:** Monitors the VHNM connection status and automatically opens/closes a background tab to re-establish the WebSocket if a "Remote Disconnect" is detected.
*   **Scroll-Jump Prevention:** Detects when "Failed Order" notifications cause the page to jump to the top and automatically restores the user's previous scroll position.
*   **Potluck (RFY) Auto-Reload:** 
    *   Adds a toggle to automatically refresh the RFY page at a set interval (e.g., every 60 seconds).
    *   **Placeholder Injection:** Logic to inject "Sample" tiles to test the grid layout when the RFY queue is empty.

---

### 6. Cloud Sync (Pastebin Backend)
*   **Multi-Device Synchronization:** Uses Pastebin to sync Favorites and Monitor Feed backups across different computers.
*   **Smart Merge Logic:** When syncing, the script compares timestamps of items; the version with the newest timestamp (even if it's a "deleted" marker) wins.
*   **Compression Engine:** 
    *   **GZIP/Web-Streams:** Compresses large JSON data (like monitor feeds) to stay under Pastebin's 512KB free limit.
    *   **LZ-String Fallback:** Secondary compression if Web-Streams are unavailable.
*   **User Key Recovery:** 
    *   **Token Paste:** Logic to store the API User Key in an unlisted "Vine - Account Token" paste.
    *   **Self-Healing:** Other devices can fetch this token automatically using a "Recovery Paste ID" to avoid re-entering passwords.
*   **Sync Triggers:**
    *   **Inactivity Sync:** Triggers 30 minutes after the last "Favorite" action.
    *   **Tab-Close Sync:** Triggers when the user navigates away from the Favorites tab.
    *   **Unload Sync:** Final attempt to sync when the browser tab is closed.
*   **Quota Management:** Tracks daily syncs to prevent hitting Pastebin's API limits and displays warnings to the user.

---

### 7. Tables & Management
*   **Reviews Table Infinite Scroll:** Removes pagination on the Reviews page, loading subsequent pages automatically as the user scrolls.
*   **Reviews Table Search:** Injects a magnifying glass into the Reviews header that allows live searching of all review pages by product title.
*   **Insightfulness Feature Toggle:** Logic to hide the "Review Insightfulness Score" and "Reviews with Media" metrics for a cleaner "Classic" experience.
*   **Alert Auto-Close:** Automatically fades out Amazon's error/info alerts (like "Item not available") after 10 seconds.
*   **Opt-Out Protection:** Disables the "Opt out of Vine" button on the account page and adds a "why though?" tooltip to prevent accidental account deletion.
*   **EWC Flyout Removal:** Forcefully removes the Amazon "Everywhere Cart" (side-sheet popover) which often interferes with the custom Vine layout.
