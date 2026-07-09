## Overview
- Introduce drag-and-drop ordering for all message components (Item Condition, Testing Status, Location, Price, URL) in Global Defaults.
- Reorganize Global Defaults into a responsive two-column layout with draggable component cards and smooth animations.
- Simplify condition options to only essentials and remove optional custom text feature entirely.
- Replace per-item "Customize" with a horizontal block ordering system: interactive blocks with toggle and long-press editing popovers.
- Relocate Reset Per-Item to top-right of the Selected Listings header; remove "Preview All".

## Data Model
- Global:
  - Add `globalConfig.order: string[]` → default: `["itemCondition","testingStatus","location","price","url"]`.
  - Keep `globalConfig.components` values (`itemCondition.value`, `testingStatus.enabled/text`, `location.value`; `customText` removed).
  - Collapse presets to essentials: `presets.itemConditionOptions = ["100% BRAND NEW, OPEN BOX!","Like New","Used - Good","Used - Fair"]`; remove dynamic custom option logic.
- Per-item:
  - Support optional `perItemConfig[url].order: string[]` (overrides global order per row).
  - Per-item `components` overrides remain for values and toggles; remove any `customText` fields.

## Persistence
- Continue using `localStorage`:
  - `vine_modal_global_defaults`: store `order`, `components`, and include flags.
  - `vine_modal_per_item_configs`: store per-URL `order` and component overrides.
- Migration/cleanup on modal open:
  - Delete `vine_modal_custom_options_itemCondition` and `vine_modal_custom_options_location` keys.
  - Strip `components.customText` from any loaded configs.

## Global Defaults UI
- Two-column responsive grid:
  - Each component rendered as a draggable card: title, enable/disable toggle, and inline editor (dropdown for Item Condition/Location; text for Testing Status; numeric for Price; checkbox for URL).
  - Drag-and-drop to reorder cards; reflow with ghost placeholder and animated transitions.
  - Reset Defaults restores values and `order` to default.
- Visuals:
  - Clear drag handle area, hover/active states, drop target highlight, smooth `transform` + `transition` animations.

## Drag-and-Drop Implementation
- Use pointer events for cross-device support:
  - On `pointerdown`, capture start index; create ghost/placeholder; apply `position:absolute` + `transform` for the dragged card; update `order` on drop.
  - Collision detection via card midpoints; reinsert placeholder when crossing thresholds.
  - Keyboard fallback: arrow keys move focused card left/right/top/bottom in order.

## Selected Listings Block UI
- Message column → single-row horizontal block rail:
  - Blocks: `Item Condition`, `Testing Status`, `Location`, `Price`, `URL`.
  - Horizontal drag to change per-item order; sliding mechanism with animated reflow.
  - Click toggles enabled/disabled (color + icon change).
  - Long-press (≈450ms) opens popover to edit the block's content:
    - Item Condition: dropdown (essentials only)
    - Testing Status: text input
    - Location: dropdown (essentials only)
    - Price: numeric override
    - URL: no content; only toggle
  - Persist per-item edits and `order` immediately; update preview live.
- Remove existing "Customize" button and textarea; replace with block rail.

## Header & Actions
- Table header ("Selected Listings") top-right:
  - Move `Reset Per-Item` button here, aligned with the Edit toggle.
  - Remove "Preview All" button.
- Keep "Export CSV" and "Cancel" actions in footer.

## Message Generation
- Update `buildPreamble(item, price, config)`:
  - Iterate over `order` and include enabled blocks in that order.
  - For `Price` block: append `Retails for $<effectivePrice>.` when enabled.
  - For `URL` block: append `Amazon Listing: <url>` when enabled.
  - Compose message from Item Condition, Testing Status, Location without custom text and join with `\n\n`; maintain divider line.

## CSS & Animations
- Global Defaults:
  - Card styles with drag handles, shadow elevation on drag, placeholder styling, drop highlight.
  - Two-column grid that collapses to one column ≤768px.
- Block Rail:
  - Flex row with overflow-x for narrow screens; blocks with distinct labels, toggled state classes.
  - Popover styles anchored to blocks; touch-friendly hit areas.
- Transitions:
  - `transition: transform 180ms ease, box-shadow 180ms ease` for smooth DnD.

## Removals
- Remove Optional Custom Text UI and code (global and per-item).
- Remove custom item condition option logic and keys; no dynamic additions.
- Remove "Preview All".

## Integration Points
- File references:
  - Update `globalConfig` and persistence near `augment-vine-orders.user.js:312–318`.
  - Update `getMergedConfigForUrl(url)` deep-merge to include `order` overrides at `augment-vine-orders.user.js:1129–1134`.
  - Replace `composeMessage` and `buildPreamble` logic at `augment-vine-orders.user.js:1136–1154`.
  - Replace Global Defaults section DOM and handlers in `showCustomizationModal` at `augment-vine-orders.user.js:2530–2630`.
  - Replace per-item message column UI with block rail at `augment-vine-orders.user.js:2650–2724` and associated events.
  - Move Reset Per-Item to header row near `augment-vine-orders.user.js:2759–2782` and remove Preview All.

## Testing Plan
- Ordering persistence:
  - Reorder cards globally; reload; verify `order` restored.
  - Reorder blocks per item; reopen modal; verify per-item `order` restored.
- Reset:
  - Reset Defaults restores values and global `order`; per-item rail follows merged global when overrides absent.
  - Reset Per-Item in header clears all per-item `order` and content overrides.
- Interactions:
  - Drag cards/blocks; verify animations and drop feedback.
  - Toggle blocks; ensure visual states and preview correspond.
  - Long-press opens popover; edit values; validate and persist.
- Message generation:
  - Confirm ordered composition matches global/per-item `order` and enabled states.
- Responsiveness:
  - Two-column layout behaves on desktop; collapses on mobile; block rail scrolls horizontally with touch.

## Assumptions
- Vanilla JS implementation for DnD and long-press interactions; no external libraries.
- No real database; references to “database fields” map to removal of localStorage custom option keys and associated logic.
- Existing export flow remains unchanged other than preamble composition order.
