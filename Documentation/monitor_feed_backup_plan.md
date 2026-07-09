# Notification Monitor Feed Backup and Restore Feature - Implementation Plan

## Document Information
- **Feature**: Notification Monitor Feed Backup and Restore
- **Target Script**: amazon-vine-modernized.user.js
- **Date**: November 7, 2025
- **Version**: 1.0

---

## Table of Contents
1. [Overview](#overview)
2. [Goals and Requirements](#goals-and-requirements)
3. [Storage Format](#storage-format)
4. [Data Extraction Mechanisms](#data-extraction-mechanisms)
5. [Backup Storage and Retrieval](#backup-storage-and-retrieval)
6. [Backup Triggers](#backup-triggers)
7. [Restore Logic](#restore-logic)
8. [Backup Retention Policies](#backup-retention-policies)
9. [Concurrency Control](#concurrency-control)
10. [Error Handling and User Feedback](#error-handling-and-user-feedback)
11. [UI Elements and Integration](#ui-elements-and-integration)
12. [CSS Updates](#css-updates)
13. [Implementation Checklist](#implementation-checklist)

---

## Overview

This feature implements backup and restore functionality for the Notification Monitor feed (`#monitor` hash page) in Amazon Vine Modernized. Users can preserve snapshots of their notification feed items and restore them later, useful for:

- Analyzing item patterns over time
- Tracking availability trends
- Preventing data loss from accidental page refreshes
- Comparing feed states across different time periods

The feature provides both manual control and intelligent automatic backups based on inactivity thresholds, similar to the existing favorites feature.

---

## Goals and Requirements

### Primary Goals
1. **Backup Capability**: Store complete snapshots of notification feed items
2. **Restore Capability**: Repopulate the feed from saved backups
3. **Import/Export**: Allow users to save/load backups as JSON files
4. **Automatic Backups**: Trigger backups after periods of inactivity
5. **Manual Control**: Provide explicit backup/restore buttons

### User Experience Requirements
- **Non-Intrusive**: UI should integrate seamlessly with existing monitor page
- **Expandable Panel**: Use collapsible interface to avoid clutter
- **Clear Feedback**: Provide status messages for all operations
- **Persistent State**: Remember user preferences across sessions

### Compatibility Requirements
- **Favorites Feature**: Ensure favorite buttons work on restored items
- **Search Feature**: Restored items must be searchable
- **Infinite Scroll**: Don't conflict with existing scroll behavior
- **VineHelper Integration**: Maintain compatibility with VH's notification system

---

## Storage Format

### JSON Structure

Backups will be stored as JSON objects containing metadata and item data:

```json
{
  "timestamp": 1699380000000,
  "name": "Manual Backup 2024-11-07 10:30 AM",
  "itemCount": 150,
  "items": [
    "<div class=\"vvp-item-tile vh-gridview\" id=\"vh-notification-B0FTYB61D7\">...</div>",
    "<div class=\"vvp-item-tile vh-gridview\" id=\"vh-notification-B0ABCD1234\">...</div>"
  ]
}
```

### Storage Keys

#### LocalStorage Keys
- `vine_monitor_feed_backups` - Main backup storage (array of backup objects)
- `vine_monitor_last_activity` - Timestamp of last feed activity
- `vine_monitor_last_auto_backup` - Timestamp of last automatic backup
- `vine_monitor_auto_backup_enabled` - Boolean flag for auto-backup feature
- `vine_monitor_min_items_backup` - Minimum item count for auto-backup (default: 100)

### Data Types

**Backup Object Properties:**
- `timestamp` (number): Unix timestamp when backup was created
- `name` (string): User-friendly display name
- `itemCount` (number): Number of items in backup (for UI display)
- `items` (array): Array of HTML strings (outerHTML of each tile)

---

## Data Extraction Mechanisms

### Primary Approach: Full outerHTML Preservation

**Rationale**: The notification monitor's HTML structure is complex with nested divs, custom classes, and VineHelper-specific attributes. Storing complete HTML ensures perfect restoration without fragile reconstruction logic.

#### Target Elements
```javascript
// Target: <div class="vvp-item-tile vh-gridview" id="vh-notification-ASIN">
const tiles = document.querySelectorAll('#vvp-items-grid .vvp-item-tile.vh-gridview');
```

#### Extraction Function
```javascript
/**
 * Extract HTML from a single tile element
 * @param {HTMLElement} tileElement - The tile DOM element
 * @returns {string} Complete outerHTML of the tile
 */
function extractItemHtmlFromTile(tileElement) {
    if (!tileElement) return null;
    return tileElement.outerHTML;
}

/**
 * Extract all current feed items
 * @returns {Array<string>} Array of HTML strings
 */
function extractAllCurrentFeedItems() {
    const grid = document.querySelector('#vvp-items-grid');
    if (!grid) return [];
    
    const tiles = grid.querySelectorAll('.vvp-item-tile.vh-gridview');
    const items = [];
    
    tiles.forEach(tile => {
        const html = extractItemHtmlFromTile(tile);
        if (html) items.push(html);
    });
    
    return items;
}
```

### Secondary Approach: Hybrid Data Storage

**Use Case**: If full HTML storage causes localStorage quota issues, implement hybrid approach.

#### Data Structure
```javascript
{
    dataAttributes: {
        'data-asin': 'B0FTYB61D7',
        'data-recommendation-id': '...',
        // ... other data-* attributes
    },
    innerHtml: '<div class="vvp-item-tile-content">...</div>'
}
```

#### Hybrid Extraction Function
```javascript
/**
 * Extract data attributes and innerHTML separately
 * @param {HTMLElement} tileElement - The tile DOM element
 * @returns {Object} Object with dataAttributes and innerHtml
 */
function extractItemDataHybrid(tileElement) {
    if (!tileElement) return null;
    
    const dataAttributes = {};
    Array.from(tileElement.attributes).forEach(attr => {
        if (attr.name.startsWith('data-')) {
            dataAttributes[attr.name] = attr.value;
        }
    });
    
    const content = tileElement.querySelector('.vvp-item-tile-content');
    const innerHtml = content ? content.innerHTML : '';
    
    return {
        dataAttributes,
        innerHtml,
        id: tileElement.id,
        className: tileElement.className
    };
}
```

**Recommendation**: Start with primary approach (full outerHTML). Only implement hybrid if localStorage quota errors occur in practice.

---

## Backup Storage and Retrieval

### Core Functions

#### 1. Get Backups
```javascript
/**
 * Retrieve all backups from localStorage
 * @returns {Array<Object>} Array of backup objects
 */
function getMonitorFeedBackups() {
    try {
        const stored = localStorage.getItem('vine_monitor_feed_backups');
        if (!stored) return [];
        return JSON.parse(stored);
    } catch (error) {
        console.error('Vine Modernized: Failed to parse backups:', error);
        return [];
    }
}
```

#### 2. Save Backup
```javascript
/**
 * Save a new backup with retention policies applied
 * @param {Object} backupObject - Backup object to save
 * @returns {boolean} Success status
 */
function saveMonitorFeedBackup(backupObject) {
    try {
        let backups = getMonitorFeedBackups();
        
        // Add new backup
        backups.push(backupObject);
        
        // Apply retention policies
        backups = applyRetentionPolicies(backups);
        
        // Save to localStorage
        localStorage.setItem('vine_monitor_feed_backups', JSON.stringify(backups));
        
        console.log('Vine Modernized: Backup saved successfully');
        return true;
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            handleQuotaExceeded();
        } else {
            console.error('Vine Modernized: Failed to save backup:', error);
        }
        return false;
    }
}
```

#### 3. Delete Backup
```javascript
/**
 * Delete a specific backup by timestamp
 * @param {number} timestamp - Timestamp of backup to delete
 * @returns {boolean} Success status
 */
function deleteMonitorFeedBackup(timestamp) {
    try {
        let backups = getMonitorFeedBackups();
        backups = backups.filter(b => b.timestamp !== timestamp);
        localStorage.setItem('vine_monitor_feed_backups', JSON.stringify(backups));
        return true;
    } catch (error) {
        console.error('Vine Modernized: Failed to delete backup:', error);
        return false;
    }
}
```

#### 4. Load Backup
```javascript
/**
 * Load and restore items from a backup
 * @param {Object} backupObject - Backup object to restore
 * @returns {boolean} Success status
 */
function loadMonitorFeedItemsFromBackup(backupObject) {
    if (!backupObject || !backupObject.items) {
        console.error('Vine Modernized: Invalid backup object');
        return false;
    }
    
    try {
        const grid = document.querySelector('#vvp-items-grid');
        if (!grid) {
            console.error('Vine Modernized: Items grid not found');
            return false;
        }
        
        // Clear current items
        grid.innerHTML = '';
        
        // Restore items (primary approach: full HTML)
        grid.innerHTML = backupObject.items.join('');
        
        // Re-initialize features that depend on item tiles
        reinitializeItemDependentFeatures();
        
        console.log(`Vine Modernized: Restored ${backupObject.itemCount} items from backup`);
        return true;
    } catch (error) {
        console.error('Vine Modernized: Failed to load backup:', error);
        return false;
    }
}

/**
 * Re-initialize features after restoration
 */
function reinitializeItemDependentFeatures() {
    // Re-initialize favorites feature
    if (typeof observeItemsGrid === 'function') {
        observeItemsGrid();
    }
    
    // Trigger any other observers that need to process new tiles
    // (This ensures favorite buttons, search functionality, etc. work on restored items)
}
```

---

## Backup Triggers

### 1. Manual Backup

**User Action**: User clicks "Create Manual Backup" button in settings panel.

```javascript
/**
 * Create a manual backup triggered by user
 */
function createManualFeedBackup() {
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
            items: items
        };
        
        const success = saveMonitorFeedBackup(backup);
        
        if (success) {
            showToast(`Backup created with ${items.length} items`, 'success');
            updateBackupsList();
        } else {
            showToast('Failed to create backup', 'error');
        }
    } finally {
        isPerformingBackupOrRestore = false;
    }
}
```

### 2. Automatic Backup (Inactivity-Based)

**Trigger Conditions**:
- User has enabled auto-backup feature
- At least `MIN_ITEMS_FOR_BACKUP` items in feed (default: 100)
- `MONITOR_INACTIVITY_THRESHOLD` time has passed since last activity (default: 1 hour)
- Sufficient time since last auto-backup (prevent duplicates)

#### Constants
```javascript
const MONITOR_INACTIVITY_THRESHOLD = 3600000; // 1 hour in milliseconds
const MIN_ITEMS_FOR_BACKUP = 100; // Minimum items required
const LAST_ACTIVITY_TIMESTAMP_KEY = 'vine_monitor_last_activity';
const LAST_AUTO_BACKUP_TIMESTAMP_KEY = 'vine_monitor_last_auto_backup';
```

#### Activity Tracking
```javascript
/**
 * Update last activity timestamp
 * Call this when new items load or user interacts with monitor page
 */
function updateLastActivityTimestamp() {
    localStorage.setItem(LAST_ACTIVITY_TIMESTAMP_KEY, Date.now().toString());
}
```

#### Scheduler Function
```javascript
/**
 * Check if auto-backup should be triggered
 * Called periodically (every 5-10 minutes)
 */
function checkAutoBackupConditions() {
    // Don't run if manual backup/restore in progress
    if (isPerformingBackupOrRestore) return;
    
    // Check if auto-backup is enabled
    const autoBackupEnabled = localStorage.getItem('vine_monitor_auto_backup_enabled') === 'true';
    if (!autoBackupEnabled) return;
    
    // Get timestamps
    const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_TIMESTAMP_KEY) || '0');
    const lastAutoBackup = parseInt(localStorage.getItem(LAST_AUTO_BACKUP_TIMESTAMP_KEY) || '0');
    const now = Date.now();
    
    // Calculate time since last activity and last backup
    const timeSinceActivity = now - lastActivity;
    const timeSinceLastBackup = now - lastAutoBackup;
    
    // Check item count
    const grid = document.querySelector('#vvp-items-grid');
    const itemCount = grid ? grid.querySelectorAll('.vvp-item-tile.vh-gridview').length : 0;
    
    // Conditions for auto-backup:
    // 1. Enough time passed since last activity
    // 2. Enough items in feed
    // 3. Sufficient time since last auto-backup (prevent rapid duplicates)
    const shouldBackup = 
        timeSinceActivity >= MONITOR_INACTIVITY_THRESHOLD &&
        itemCount >= MIN_ITEMS_FOR_BACKUP &&
        timeSinceLastBackup >= (MONITOR_INACTIVITY_THRESHOLD / 2);
    
    if (shouldBackup) {
        createAutomaticFeedBackup();
    }
}

// Start periodic checker (every 5 minutes)
setInterval(checkAutoBackupConditions, 5 * 60 * 1000);
```

#### Automatic Backup Function
```javascript
/**
 * Create an automatic backup (non-intrusive)
 */
function createAutomaticFeedBackup() {
    if (isPerformingBackupOrRestore) return;
    
    isPerformingBackupOrRestore = true;
    
    try {
        const items = extractAllCurrentFeedItems();
        
        if (items.length < MIN_ITEMS_FOR_BACKUP) {
            return; // Silently skip if not enough items
        }
        
        const now = Date.now();
        const backup = {
            timestamp: now,
            name: `Auto Backup ${formatDateTime(now)}`,
            itemCount: items.length,
            items: items
        };
        
        const success = saveMonitorFeedBackup(backup);
        
        if (success) {
            // Update last auto-backup timestamp
            localStorage.setItem(LAST_AUTO_BACKUP_TIMESTAMP_KEY, now.toString());
            
            // Subtle feedback (optional: status message in settings panel)
            updateStatusMessage(`Auto-backup created (${items.length} items)`);
            
            console.log(`Vine Modernized: Auto-backup created with ${items.length} items`);
        }
    } finally {
        isPerformingBackupOrRestore = false;
    }
}
```

---

## Restore Logic

### Initial Empty State

When the page loads on `https://www.amazon.ca/vine/vine-items?queue=encore#monitor` and `vvp-items-grid` has no children:
- Show "Restore from Last Backup" button prominently
- Disable button if no backups exist
- Display tooltip: "No backups available" when disabled

### Confirmation for Non-Empty Feed

```javascript
/**
 * Restore feed from backup with confirmation if feed is not empty
 * @param {Object} backupObject - Backup to restore
 */
function restoreMonitorFeed(backupObject) {
    if (!backupObject) return;
    
    // Check if feed is currently populated
    const grid = document.querySelector('#vvp-items-grid');
    const currentItemCount = grid ? grid.querySelectorAll('.vvp-item-tile.vh-gridview').length : 0;
    
    if (currentItemCount > 0) {
        // Feed is not empty - show confirmation
        const confirmed = confirm(
            `The feed currently has ${currentItemCount} items.\n\n` +
            `Restoring from backup will replace them with ${backupObject.itemCount} items.\n\n` +
            `Continue?`
        );
        
        if (!confirmed) return;
    }
    
    // Set concurrency flag
    isPerformingBackupOrRestore = true;
    
    try {
        // Perform restoration
        const success = loadMonitorFeedItemsFromBackup(backupObject);
        
        if (success) {
            showToast(`Restored ${backupObject.itemCount} items from backup`, 'success');
        } else {
            showToast('Failed to restore backup', 'error');
        }
    } finally {
        isPerformingBackupOrRestore = false;
    }
}
```

### Post-Restoration Re-initialization

**Critical**: After restoring items, explicitly trigger re-initialization of features:

```javascript
function reinitializeItemDependentFeatures() {
    // 1. Re-initialize favorites feature observer
    if (typeof observeItemsGrid === 'function') {
        console.log('Vine Modernized: Re-initializing favorites observer after restore');
        observeItemsGrid();
    }
    
    // 2. Re-initialize search autocomplete if present
    // (Search should automatically work on new DOM elements)
    
    // 3. Process any mutation observers that need to see the new tiles
    // The existing MutationObserver should pick up the changes automatically
    
    // 4. Update any cached references to tile elements
    // (Most features should query DOM dynamically, so this may not be needed)
}
```

---

## Backup Retention Policies

### Maximum Age Policy

**Rule**: Delete backups older than 7 days.

```javascript
const MAX_BACKUP_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Remove backups older than maximum age
 * @param {Array<Object>} backups - Array of backup objects
 * @returns {Array<Object>} Filtered backups
 */
function removeExpiredBackups(backups) {
    const now = Date.now();
    return backups.filter(backup => {
        const age = now - backup.timestamp;
        return age <= MAX_BACKUP_AGE_MS;
    });
}
```

### Maximum Count Policy

**Rule**: Keep maximum of 20 backups (oldest deleted first).

```javascript
const MAX_BACKUP_COUNT = 20;

/**
 * Limit backups to maximum count
 * @param {Array<Object>} backups - Array of backup objects
 * @returns {Array<Object>} Limited backups
 */
function limitBackupCount(backups) {
    if (backups.length <= MAX_BACKUP_COUNT) return backups;
    
    // Sort by timestamp (oldest first)
    backups.sort((a, b) => a.timestamp - b.timestamp);
    
    // Keep only the newest MAX_BACKUP_COUNT backups
    return backups.slice(-MAX_BACKUP_COUNT);
}
```

### Combined Policy Application

```javascript
/**
 * Apply all retention policies to backups array
 * @param {Array<Object>} backups - Array of backup objects
 * @returns {Array<Object>} Cleaned backups array
 */
function applyRetentionPolicies(backups) {
    // Remove expired backups first
    backups = removeExpiredBackups(backups);
    
    // Then limit count
    backups = limitBackupCount(backups);
    
    return backups;
}
```

### Cleanup Execution Points

Run cleanup:
1. When saving a new backup (`saveMonitorFeedBackup`)
2. When loading backups list (`getMonitorFeedBackups`)
3. Periodically as part of auto-backup scheduler

---

## Concurrency Control

### Global Flag

Prevent simultaneous backup/restore operations:

```javascript
let isPerformingBackupOrRestore = false;
```

### Usage Pattern

```javascript
function anyBackupOrRestoreOperation() {
    // Check flag at start
    if (isPerformingBackupOrRestore) {
        console.warn('Vine Modernized: Operation already in progress');
        return;
    }
    
    // Set flag
    isPerformingBackupOrRestore = true;
    
    try {
        // ... perform operation ...
    } catch (error) {
        // Handle errors
    } finally {
        // Always clear flag (even on errors)
        isPerformingBackupOrRestore = false;
    }
}
```

### UI Integration

```javascript
/**
 * Update UI button states based on concurrency flag
 */
function updateButtonStates() {
    const buttons = document.querySelectorAll(
        '#manual-backup-btn, #restore-last-backup-btn, .restore-backup-btn'
    );
    
    buttons.forEach(btn => {
        if (isPerformingBackupOrRestore) {
            btn.disabled = true;
            btn.title = 'Operation in progress...';
        } else {
            btn.disabled = false;
            btn.title = btn.getAttribute('data-original-title') || '';
        }
    });
}
```

### Auto-Backup Integration

```javascript
function checkAutoBackupConditions() {
    // Skip auto-backup if any operation is in progress
    if (isPerformingBackupOrRestore) {
        console.log('Vine Modernized: Skipping auto-backup, operation in progress');
        return;
    }
    
    // ... rest of auto-backup logic ...
}
```

---

## Error Handling and User Feedback

### Error Types and Handlers

#### 1. LocalStorage Quota Exceeded

```javascript
function handleQuotaExceeded() {
    const message = 
        'Backup failed: Storage quota exceeded.\n\n' +
        'Try:\n' +
        '• Delete older backups\n' +
        '• Export backups to free space\n' +
        '• Reduce backup frequency';
    
    alert(message);
    
    // Optionally open settings panel to show backup list
    showBackupManagementPanel();
}
```

#### 2. JSON Parsing Errors

```javascript
function validateBackupJSON(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        
        // Validate structure
        if (!Array.isArray(data) && !data.items) {
            throw new Error('Invalid backup format: expected array or backup object');
        }
        
        // Validate backup object properties
        if (data.items) {
            if (!data.timestamp || !data.name || !Array.isArray(data.items)) {
                throw new Error('Invalid backup format: missing required properties');
            }
        }
        
        return { valid: true, data };
    } catch (error) {
        return { 
            valid: false, 
            error: error.message 
        };
    }
}
```

#### 3. File Import/Export Errors

```javascript
/**
 * Export all backups to a JSON file
 */
function exportMonitorFeedBackups() {
    try {
        const backups = getMonitorFeedBackups();
        
        if (backups.length === 0) {
            showToast('No backups to export', 'warning');
            return;
        }
        
        const dataStr = JSON.stringify(backups, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `vine-monitor-backups-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast(`Exported ${backups.length} backup(s)`, 'success');
    } catch (error) {
        console.error('Vine Modernized: Export failed:', error);
        showToast('Failed to export backups', 'error');
    }
}

/**
 * Import backups from a JSON file
 */
function importMonitorFeedBackups(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onerror = () => {
        showToast('Failed to read file', 'error');
    };
    
    reader.onload = (e) => {
        try {
            const validation = validateBackupJSON(e.target.result);
            
            if (!validation.valid) {
                showToast(`Invalid backup file: ${validation.error}`, 'error');
                return;
            }
            
            const importedData = validation.data;
            const importedBackups = Array.isArray(importedData) ? importedData : [importedData];
            
            let currentBackups = getMonitorFeedBackups();
            const existingTimestamps = new Set(currentBackups.map(b => b.timestamp));
            
            // Only import backups that don't already exist
            const newBackups = importedBackups.filter(b => !existingTimestamps.has(b.timestamp));
            
            if (newBackups.length === 0) {
                showToast('No new backups to import', 'warning');
                return;
            }
            
            // Merge and save
            currentBackups = [...currentBackups, ...newBackups];
            currentBackups = applyRetentionPolicies(currentBackups);
            
            localStorage.setItem('vine_monitor_feed_backups', JSON.stringify(currentBackups));
            
            showToast(`Imported ${newBackups.length} backup(s)`, 'success');
            updateBackupsList();
        } catch (error) {
            console.error('Vine Modernized: Import failed:', error);
            showToast('Failed to import backups', 'error');
        } finally {
            event.target.value = ''; // Reset file input
        }
    };
    
    reader.readAsText(file);
}
```

### User Feedback System

#### Toast Notifications

```javascript
/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', 'warning', 'info'
 */
function showToast(message, type = 'info') {
    // Remove existing toast if present
    const existingToast = document.querySelector('.vine-backup-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `vine-backup-toast vine-toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
```

#### Status Messages (Non-Intrusive)

```javascript
/**
 * Update status message in settings panel
 * @param {string} message - Status message
 */
function updateStatusMessage(message) {
    const statusEl = document.querySelector('#backup-status-message');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.style.opacity = '1';
    
    // Fade out after 5 seconds
    setTimeout(() => {
        statusEl.style.opacity = '0';
    }, 5000);
}
```

---

## UI Elements and Integration

### Overview

The UI will be integrated into the existing `vh-notifications-monitor-header-ui` panel using an expandable section to avoid cluttering the interface.

### Expandable Panel Trigger

#### Location
Place a chevron symbol (`▸`) in the bottom-left area of `vh-notifications-monitor-header-ui`.

#### Behavior
- **Collapsed State**: Show `▸` symbol
- **Expanded State**: Show `▾` symbol
- **Transition**: Smooth height animation when toggling
- **Persistence**: Remember state in localStorage

#### HTML Structure

```html
<!-- Add to vh-notifications-monitor-header-ui -->
<div id="monitor-backup-panel-trigger" class="backup-panel-trigger">
    <button id="backup-expand-btn" class="backup-expand-icon" aria-label="Show/hide backup controls">
        ▸
    </button>
</div>

<div id="monitor-backup-panel-content" class="backup-panel-content collapsed">
    <!-- Backup/restore controls go here -->
</div>
```

### Primary Controls

#### 1. Restore from Last Backup Button

**Location**: Beside `vine-encore-consent-btn` (visible by default when feed is empty)

```html
<button id="restore-last-backup-btn" class="vine-encore-consent-btn" disabled>
    Restore from Last Backup
</button>
```

**Behavior**:
- Disabled if no backups exist
- Shows tooltip "No backups available" when disabled
- Prominent placement for easy access when feed is empty

#### 2. Backup Management Section

**Location**: Inside expandable panel

```html
<div class="backup-management-section">
    <div class="backup-controls-row">
        <button id="manual-backup-btn" class="backup-action-btn">
            Create Manual Backup
        </button>
        
        <label class="backup-toggle-label">
            <input type="checkbox" id="auto-backup-toggle">
            <span>Auto Backup</span>
        </label>
        
        <label class="backup-input-label">
            Min Items for Auto Backup:
            <input type="number" id="min-items-input" min="50" max="500" value="100">
        </label>
    </div>
    
    <div class="backup-list-section">
        <h4>Available Backups</h4>
        <div id="backup-list-container" class="backup-list scrollable">
            <!-- Dynamic backup entries will be inserted here -->
        </div>
    </div>
    
    <div class="backup-import-export-row">
        <button id="export-backups-btn" class="backup-action-btn">
            Export All Backups
        </button>
        
        <label for="import-backups-input" class="backup-action-btn import-btn-label">
            Import Backups
        </label>
        <input type="file" id="import-backups-input" accept=".json" style="display: none
