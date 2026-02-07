以下の要件を満たす `targetFolder` を選択するためのポップアップを `FolderSelectPopup` component として実装して

ただしグレーや赤系のカラーパレットはが使われている部分は既存の options page のデザインに合わせて zinc-* や pink-* に変更すること
どうしても避けられない場合を除きインラインスタイルや CSS を直接書くのは避け、Tailwind CSS での指定で完結させること

## Folder Popup — UI Specification
Overall Container
A modal/popup panel for selecting a bookmark folder destination.

- Width: fills the container, height fits content
- Background: zinc-900 (very dark gray, near-black)
- Border: 1px solid zinc-700 (inside-aligned), all sides
- Corner radius: 8px
- Layout: vertical (children stack top-to-bottom)
- Font: Inter throughout

### Section 1: Tree Container (folder tree)

- Layout: vertical, no gap between rows
- Padding: 8px top and bottom, 0px left/right
- Width: fills the popup width

Each row is a tree row (horizontal flex, vertically centered, height 32px, full width). The rows represent a collapsible folder tree.

Tree Row Structure
Each row contains, left-to-right with an 8px gap:

1. Chevron icon (14×14, Lucide icon set):
      - chevron-down for expanded folders
      - chevron-right for collapsed folders
      - For leaf-level items within an expanded parent: replaced with an invisible 14×14 spacer (empty frame, no icon)
2. Folder icon (14×14, Lucide folder)
3. Folder name (text, Inter, 13px, normal weight)

Indentation Levels
Indentation is controlled by left padding on each row:

- Root level (e.g. "Bookmarks Bar", "Other Bookmarks"): padding [0, 12] (12px left and right)
- Depth 1 (e.g. "Dev Tools", "Synced", "Shopping"): padding [0, 12, 0, 36] (36px left, 12px right)
- Depth 2 (e.g. "bookmarks", "reading-list", "work"): padding [0, 8, 0, 56] (56px left, 8px right)

Row Color States

- Normal (unselected, collapsed): chevron #888888, folder icon #888888, text #CCCCCC, no background
- Normal (unselected, expanded parent): chevron #888888, folder icon #E53935 (red), text #CCCCCC, no background
- Hovered (unselected): background #FFFFFF0A (white at ~4% opacity), corner radius 6px. Same icon/text colors as normal.
- Selected: background #E539351A (red at ~10% opacity), corner radius 6px. The chevron is replaced by a check icon (Lucide check), colored #E53935. Folder icon #E53935. Text #E53935, font weight 500 (medium).

So to summarize the color logic:

- Expanded parent folders get a red folder icon (but gray chevron and white text)
- The selected folder gets all-red treatment: red check icon, red folder icon, red text (medium weight), red-tinted background
- Collapsed/leaf folders are all gray/white with no background

#### Tree Content (example data)

Row|Depth|State|Chevron|Name
---|---|---|---|---
1|0|Expanded|chevron-down|Bookmarks Bar
2|1|Collapsed|chevron-right|Dev Tools
3|1|Expanded|chevron-down|Synced
4|2|Selected|check|bookmarks
5|2|Normal (hovered)|spacer|reading-list
6|2|Normal|spacer|work
7|1|Collapsed|chevron-right|Shopping
8|0|Collapsed|chevron-right|Other Bookmarks

### Section 2: Footer

- Layout: horizontal, space-between (left group and right group pushed to opposite ends), vertically centered
- Height: 48px
- Width: fills popup width
- Padding: 0px top/bottom, 12px left/right
- Top border: 1px solid #2A2A2A (only top edge, inside-aligned) — acts as a separator from the tree

Footer Left Group
Horizontal layout, vertically centered, 6px gap. Contains:

1. "New folder" button (text-style/ghost button):
    - Lucide folder-plus icon, 14×14, #888888
    - Text "New folder", Inter, 12px, weight 500, #888888
1. Vertical separator: 1×14px rectangle, fill #333333
1. "Refresh" button (text-style/ghost button):
    - Lucide refresh-cw icon, 13×13, #888888
    - Text "Refresh", Inter, 12px, weight 500, #888888

Footer Right Group
Horizontal layout, vertically centered, 8px gap. Contains:

1. "Cancel" button (outlined):

    - Padding: 6px vertical, 14px horizontal
    - Corner radius: 6px
    - Border: 1px solid #333333 (inside-aligned)
    - No background fill
    - Text "Cancel", Inter, 12px, weight 500, #CCCCCC

1. "Select" button (primary/filled):

    - Padding: 6px vertical, 14px horizontal
    - Corner radius: 6px
    - Background: #E53935 (red)
    - No border
    - Text "Select", Inter, 12px, weight 500, #FFFFFF (white)

#### Color Palette Summary

Token|Hex|Usage
---|---|---
Background|#1A1A1A|Popup background
Border / Separator|#2A2A2A|Popup border, footer top border
Separator (footer)|#333333|Vertical separator, Cancel button border
Muted text/icons|#888888|Collapsed icons, footer buttons
Body text|#CCCCCC|Folder names, Cancel button text
White|#FFFFFF|Select button text
Primary/Red|#E53935|Selected state, expanded folder icons, Select button bg
Selected row bg|#E539351A|~10% red tint
Hover row bg|FFFFFF0A|~4% white tint

### Icon Set

All icons use Lucide icon font at 14×14 (13×13 for refresh-cw): chevron-down, chevron-right, check, folder, folder-plus, refresh-cw
