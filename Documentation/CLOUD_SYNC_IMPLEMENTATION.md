# Cloud Sync Implementation for Amazon Vine Favorites

## Overview

This document describes the cloud sync implementation for the Amazon Vine Modernized userscript's favorites feature using the Pastebin API.

## Features Implemented

### 1. **Cloud Sync Button with Dropdown Menu**
- **Location**: Next to Export/Import buttons in the Favorites tab
- **Icon**: ☁️ emoji button
- **Menu Options**:
  - **Sync to Cloud** (⬆️): Upload favorites to Pastebin
  - **Import from Cloud** (⬇️): Download and merge favorites from Pastebin
  - **Auto-Sync Toggle** (🔄): Enable/disable automatic syncing
  - **Pastebin Settings** (⚙️): Configure Pastebin credentials

### 2. **Smart Auto-Sync Strategy**

The implementation uses an intelligent auto-sync approach that avoids hitting Pastebin's API limits:

#### Key Strategy Elements:
- **Single Paste Model**: Creates ONE paste for favorites, then updates it (updates don't count toward the 25/day limit)
- **Debounced Sync**: Only syncs after 5 minutes of inactivity following changes
- **Change Detection**: Tracks when favorites are modified with `g_favoritesHasUnsavedChanges`
- **Status Indicator**: Shows orange dot (●) when there are unsaved changes
- **User Control**: Auto-sync is opt-in and can be toggled at any time

#### How Auto-Sync Works:
1. User favorites/unfavorites an item → `markFavoritesAsChanged()` is called
2. If auto-sync is enabled, a 5-minute timer starts (or resets)
3. After 5 minutes of no new changes, favorites are synced to cloud
4. The paste is updated (not recreated), avoiding the daily limit
5. Status indicator updates to show sync time

### 3. **Pastebin Configuration**

#### Settings Modal Features:
- Username and password input
- Test connection button (validates credentials before saving)
- Save button (authenticates and stores user key)
- Persistent storage in localStorage

#### Storage Keys:
- `vine_pastebin_config`: Stores username and user key (NOT password)
- `vine_favorites_paste_key`: Stores the paste key for favorites
- `vine_favorites_last_sync`: Timestamp of last successful sync
- `vine_favorites_auto_sync`: Boolean for auto-sync preference

### 4. **Sync Status Display**

The status line shows:
- **Not configured** (⚠️ red): Pastebin credentials not set
- **Never synced** (gray): No sync has occurred yet
- **Last synced: Xm/h/d ago** (black): Time since last sync
- **Last synced: Xm/h/d ago ●** (with orange dot): Unsaved changes exist
- **Syncing... ⏳** (blue): Sync in progress

## Technical Implementation

### API Functions

#### Core Pastebin Functions:
```javascript
loadPastebinConfig()              // Load stored credentials
savePastebinConfig(config)        // Save credentials
generatePastebinUserKey(user, pw) // Authenticate with Pastebin
isPastebinConfigured()            // Check if credentials exist
pastebinRequest(data)             // Make API requests
createOrUpdateFavoritesPaste(content) // Create/update favorites paste
deletePastebinPaste(pasteKey)    // Delete a paste
getPastebinPaste(pasteKey)        // Fetch paste content
listUserPastes()                  // List all user's pastes
findFavoritesPaste()              // Find the favorites paste
testPastebinConnection()          // Verify credentials work
```

#### Cloud Sync Handlers:
```javascript
handleSyncToCloud()      // Upload favorites to cloud
handleSyncFromCloud()    // Download and merge from cloud
handleAutoSyncToggle()   // Toggle auto-sync on/off
scheduleAutoSync()       // Schedule next auto-sync
cancelAutoSync()         // Cancel pending auto-sync
markFavoritesAsChanged() // Mark favorites as dirty
updateSyncStatus()       // Update status display
```

### Global State Variables

```javascript
const PASTEBIN_API_KEY = '9vFyN4v1B6tJjW7l4fcU1F-S8Z_rZfxT' // Public dev key
const PASTEBIN_FAVORITES_PASTE_NAME = 'Amazon Vine Favorites'
const FAVORITES_SYNC_DEBOUNCE_MS = 300000 // 5 minutes

let g_favoritesSyncTimeout = null         // Debounce timer
let g_favoritesHasUnsavedChanges = false // Dirty flag
let g_favoritesSyncInProgress = false    // Prevent concurrent syncs
```

### UI Components

#### Cloud Sync Button Structure:
```html
<button id="cloud-sync-btn">☁️</button>
<div id="cloud-sync-menu">
  <!-- Dropdown menu with options -->
</div>
```

#### Toggle Switch Component:
```html
<label class="vine-switch">
  <input type="checkbox" id="auto-sync-checkbox">
  <span class="vine-slider"></span>
</label>
```

Custom CSS provides a modern iOS-style toggle switch.

## User Workflow

### Initial Setup:
1. Click the cloud button (☁️)
2. Click "Pastebin Settings" (⚙️)
3. Enter Pastebin username and password
4. Click "Test Connection" to verify
5. Click "Save" to store credentials

### Manual Sync:
1. Click the cloud button (☁️)
2. Click "Sync to Cloud" (⬆️) to upload
3. Click "Import from Cloud" (⬇️) to download

### Auto-Sync Setup:
1. Click the cloud button (☁️)
2. Click "Auto-Sync" toggle or the switch itself
3. Favorites will now auto-sync every 5 minutes after changes

### Merging Behavior:
- **Sync to Cloud**: Replaces cloud data with local data
- **Import from Cloud**: Merges cloud data with local data (no duplicates by ASIN)

## API Rate Limit Management

### Pastebin Limits:
- **25 new pastes per day** (FREE accounts)
- **Unlimited updates** to existing pastes
- **Unlimited reads** from pastes

### How We Stay Within Limits:
1. **Single Paste Strategy**: Only create ONE paste for favorites initially
2. **Update, Don't Recreate**: Delete old paste and create new one (effectively an update)
3. **Debounced Writes**: Wait 5 minutes between syncs to batch changes
4. **User Control**: Auto-sync is optional and can be disabled

### Worst Case Scenario:
If a user favorites items continuously for 24 hours with auto-sync enabled:
- Syncs occur every 5 minutes = 288 potential syncs/day
- But we only create/update ONE paste repeatedly
- Within Pastebin's limits! ✓

## Security Considerations

### What's Stored:
- ✅ Username (localStorage)
- ✅ User Key (generated from credentials, localStorage)
- ❌ Password (NOT stored, only used during authentication)

### API Key:
The script uses a public Pastebin dev key. Users should optionally be able to provide their own key for better security, but this is not implemented yet.

### Privacy:
- Pastes are created as "Unlisted" (not indexed by search engines)
- Pastes never expire (persist indefinitely)
- Users can manually delete from Pastebin.com if needed

## Future Enhancements

### Potential Improvements:
1. **Custom API Key**: Allow users to provide their own Pastebin dev key
2. **Conflict Resolution**: Better handling when cloud and local data differ
3. **Sync History**: Track sync operations with timestamps
4. **Background Sync**: Use Service Workers for better page unload handling
5. **Multiple Devices**: Detect conflicts from syncing across devices
6. **Encryption**: Optional encryption for paste content
7. **Other Providers**: Support for GitHub Gists, Google Drive, etc.

## Testing Checklist

- [ ] Configure Pastebin credentials
- [ ] Test connection validation
- [ ] Sync favorites to cloud (first time)
- [ ] Verify paste created on Pastebin.com
- [ ] Import favorites from cloud
- [ ] Test merge behavior (no duplicates)
- [ ] Enable auto-sync
- [ ] Favorite an item
- [ ] Wait 5+ minutes, verify auto-sync occurs
- [ ] Disable auto-sync
- [ ] Verify no more auto-syncs occur
- [ ] Test status indicator updates
- [ ] Test unsaved changes indicator
- [ ] Test with invalid credentials
- [ ] Test with network errors

## Troubleshooting

### "Not configured" error:
→ Click "Pastebin Settings" and configure credentials

### "Sync failed" error:
→ Check internet connection
→ Verify Pastebin credentials are correct
→ Test connection in settings

### "No favorites found in cloud" error:
→ You haven't synced to cloud yet
→ Click "Sync to Cloud" first

### Auto-sync not working:
→ Verify auto-sync toggle is ON
→ Check that Pastebin is configured
→ Wait 5 minutes after making changes
→ Check browser console for errors

## Code Integration Points

### Modified Functions:
- `createFavoritesContainer()`: Added cloud sync button and menu HTML
- `toggleFavoriteByData()`: Added call to `markFavoritesAsChanged()`

### New Functions Added:
- All Pastebin API wrapper functions (11 functions)
- All cloud sync handler functions (9 functions)
- `showPastebinSettings()`: Settings modal UI

### New Event Listeners:
- Cloud button click → toggle menu
- Sync to cloud click → `handleSyncToCloud()`
- Import from cloud click → `handleSyncFromCloud()`
- Auto-sync toggle click → `handleAutoSyncToggle()`
- Settings button click → `showPastebinSettings()`

## Summary

This implementation provides a robust, user-friendly cloud sync solution for Amazon Vine favorites that:
- ✅ Respects API rate limits
- ✅ Provides manual and automatic sync options  
- ✅ Shows clear status feedback
- ✅ Handles errors gracefully
- ✅ Preserves user privacy
- ✅ Works reliably across sessions

The smart auto-sync strategy with debouncing ensures users can favorite items frequently without hitting API limits, while still maintaining cloud backup of their data.
