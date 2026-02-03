# GitMarks Main Implementation Plan

## Overview

Implement the full GitMarks Chrome Extension that syncs GitHub repository manifest files to Chrome bookmarks. The PoC has validated GitHub OAuth Device Flow, token storage, and repo API access.

## Prerequisites (Human Action)

- GitHub OAuth App exists with Device Flow enabled
- `WXT_GITHUB_APP_CLIENT_ID` set in `.env`

---

## Phase 1: Foundation Setup

### 1.1 Install Dependencies

```bash
bun add tailwindcss postcss autoprefixer @ark-ui/react valibot
```

### 1.2 Configure Tailwind CSS

**Create `tailwind.config.js`:**
```js
export default {
  content: ["./entrypoints/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

**Create `postcss.config.js`:**
```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

**Delete:** `entrypoints/options/style.css`

**Update `entrypoints/options/main.tsx`:** Import Tailwind base styles

### 1.3 Update Manifest Permissions

**Modify `wxt.config.ts`:**
```typescript
permissions: ["storage", "bookmarks", "alarms"],
```

---

## Phase 2: Data Models and Storage

### 2.1 Create Type Definitions

**`lib/types/connection.ts`:**
```typescript
export type Connection = {
  id: string;
  repoFullName: string;
  repoOwner: string;
  repoName: string;
  srcDir: string;
  targetFolderId: string;
  targetFolderPath: string;
  enabled: boolean;
  lastSyncedAt: string | null;
  lastSyncedCommitSha: string | null;  // For skip-if-unchanged optimization
  lastSyncError: string | null;
  createdAt: string;
};
```

**`lib/types/manifest.ts`:** (with Valibot schemas)
```typescript
import * as v from "valibot";

// Valibot schema for manifest.json validation
export const ManifestBookmarkSchema = v.object({
  name: v.string(),
  location: v.string(),
});

export const ManifestJSONSchema = v.array(ManifestBookmarkSchema);

// Inferred types from schemas
export type ManifestBookmark = v.InferOutput<typeof ManifestBookmarkSchema>;
export type ManifestJSON = v.InferOutput<typeof ManifestJSONSchema>;

// Resolved bookmark after processing
export type ResolvedBookmark = { name: string; url: string };
```

**`lib/types/user.ts`:**
```typescript
export type GitHubUser = { login: string; avatar_url: string; name: string | null };
```

### 2.2 Storage Utilities

**`lib/storage/connections.ts`:** CRUD for connections (get/save/add/update/remove)

**`lib/storage/user.ts`:** Cache GitHub user info

---

## Phase 3: Validation Logic

**`lib/validation/target-folder.ts`:**
- Validate target folder doesn't overlap with existing connections
- Check ancestor/descendant relationships using Chrome bookmarks API

**`lib/validation/src-dir.ts`:**
- Validate srcDir is not empty ("/" is valid)

---

## Phase 4: GitHub API Extensions

**Modify `lib/github/api.ts`:**

```typescript
// Add: Fetch authenticated user
export const fetchUser = async (token: string): Promise<GitHubUser>;

// Add: Fetch file content (with base64 decoding)
export const fetchFileContent = async (
  token: string, owner: string, repo: string, path: string
): Promise<string>;

// Add: Fetch latest commit SHA for a path (for skip-if-unchanged optimization)
// Uses: GET /repos/{owner}/{repo}/commits?path={path}&per_page=1
export const fetchLatestCommitSha = async (
  token: string, owner: string, repo: string, path: string
): Promise<string>;
```

**Modify `lib/github/types.ts`:**

Add to `RepoContent`:
```typescript
content?: string;   // Base64 encoded
encoding?: string;  // "base64"
```

---

## Phase 5: Manifest Parsing

**`lib/manifest/parser.ts`:**

```typescript
export const parseManifest = async (
  manifestContent: string,
  srcDir: string,
  token: string,
  owner: string,
  repo: string
): Promise<ResolvedBookmark[]>;
```

- Parse JSON and validate with Valibot (`v.parse(ManifestJSONSchema, data)`)
- Throw descriptive error if schema validation fails
- For URLs: use as-is
- For relative paths (e.g., `./foobar.js`): fetch file content, wrap as `javascript:` bookmarklet
- Exclude entries where referenced file doesn't exist

---

## Phase 6: Chrome Bookmarks Integration

**`lib/bookmarks/api.ts`:**
- `getAllFolders()`: Get all folders with hierarchical paths
- `getFolderById()`: Get single folder
- `folderExists()`: Check if folder still exists
- `getBookmarksInFolder()`: List direct children

**`lib/bookmarks/sync.ts`:**
```typescript
export const syncBookmarksToFolder = async (
  targetFolderId: string,
  bookmarks: ResolvedBookmark[]
): Promise<number>;
```
- Delete existing bookmarks in folder
- Create new bookmarks from manifest
- Return count

---

## Phase 7: Sync Engine

**`lib/sync/sync-connection.ts`:**
```typescript
export const syncConnection = async (
  connection: Connection,
  token: string,
  options?: { force?: boolean }  // force=true skips commit hash check
): Promise<{ success: boolean; bookmarkCount?: number; skipped?: boolean; error?: string }>;
```

**Sync algorithm with commit hash optimization:**
1. Validate target folder exists
2. Fetch latest commit SHA for `srcDir` via `fetchLatestCommitSha()`
3. **Skip check:** If `!options?.force` and `commitSha === connection.lastSyncedCommitSha`:
   - Return `{ success: true, skipped: true }` (no sync needed)
4. Fetch `srcDir/manifest.json`
5. Parse and validate with Valibot, resolve bookmarks
6. Sync to target folder
7. Update connection: `lastSyncedAt`, `lastSyncedCommitSha`, `lastSyncError`

**`lib/sync/sync-all.ts`:**
```typescript
export const syncAllConnections = async (): Promise<SyncResult[]>;
```
- Iterates enabled connections
- Uses default (non-forced) sync, allowing skip optimization
- Manual "Pull" button in UI uses `force: true` to always sync

---

## Phase 8: Background Service

**`entrypoints/background.ts`:**
```typescript
export default defineBackground(() => {
  const SYNC_ALARM_NAME = "gitmarks-sync";
  const SYNC_INTERVAL_MINUTES = 60;

  browser.runtime.onInstalled.addListener(() => {
    browser.alarms.create(SYNC_ALARM_NAME, { periodInMinutes: SYNC_INTERVAL_MINUTES });
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === SYNC_ALARM_NAME) {
      void syncAllConnections();
    }
  });
});
```

---

## Phase 9: React UI Components

### Component Structure

```
entrypoints/options/
├── main.tsx              # Toast provider, Tailwind import
├── App.tsx               # Main container with state
├── components/
│   ├── Header.tsx        # Auth state, sign in/out
│   ├── ConnectionCard.tsx    # Compact/expanded states
│   ├── ConnectionList.tsx    # Card list + add placeholder
│   ├── AddConnectionModal.tsx
│   ├── LoginModal.tsx
│   ├── DisconnectConfirmModal.tsx
│   ├── FolderSelect.tsx      # Ark UI Select
│   ├── RepoCombobox.tsx      # Ark UI Combobox
│   ├── SyncButton.tsx        # Pull + Spinner
│   └── ErrorSection.tsx
└── hooks/
    ├── useAuth.ts
    ├── useConnections.ts
    ├── useRepositories.ts
    ├── useBookmarkFolders.ts
    ├── useSync.ts
    └── useToast.ts
```

### Key UI Behaviors

- **Header:** Show avatar/username when logged in; Sign in/out buttons
- **ConnectionCard compact:** Repo name, status indicator, last synced
- **ConnectionCard expanded:** Toggle, srcDir input, folder select, Pull/Disconnect buttons
- **Modals:** Use Ark UI Dialog for login, add connection, disconnect confirmation
- **Validation errors:** Show inline in forms and in card error section
- **Toasts:** Bottom-right, auto-dismiss, success/error/info types

---

## Files Summary

| Action | Path |
|--------|------|
| CREATE | `tailwind.config.js` |
| CREATE | `postcss.config.js` |
| CREATE | `lib/types/connection.ts` |
| CREATE | `lib/types/manifest.ts` |
| CREATE | `lib/types/user.ts` |
| CREATE | `lib/storage/connections.ts` |
| CREATE | `lib/storage/user.ts` |
| CREATE | `lib/validation/target-folder.ts` |
| CREATE | `lib/validation/src-dir.ts` |
| CREATE | `lib/manifest/parser.ts` |
| CREATE | `lib/bookmarks/api.ts` |
| CREATE | `lib/bookmarks/sync.ts` |
| CREATE | `lib/sync/sync-connection.ts` |
| CREATE | `lib/sync/sync-all.ts` |
| CREATE | `entrypoints/background.ts` |
| CREATE | `entrypoints/options/components/*.tsx` (10 files) |
| CREATE | `entrypoints/options/hooks/*.ts` (6 files) |
| MODIFY | `wxt.config.ts` |
| MODIFY | `lib/github/api.ts` |
| MODIFY | `lib/github/types.ts` |
| MODIFY | `entrypoints/options/main.tsx` |
| REWRITE | `entrypoints/options/App.tsx` |
| DELETE | `entrypoints/options/style.css` |

---

## Verification

### Manual Testing Checklist

1. **Auth Flow**
   - Sign in via Device Flow opens modal with code
   - Opening github.com/device and entering code completes auth
   - User avatar/name appears in header
   - Sign out clears auth but keeps connections (disabled)

2. **Connection Management**
   - Add connection: select repo, set srcDir, select folder
   - Validation rejects empty srcDir
   - Validation rejects overlapping target folders
   - Toggle enable/disable auto-saves
   - Disconnect shows confirmation, removes connection

3. **Sync**
   - Pull button triggers sync with spinner (always syncs, force=true)
   - Bookmarks appear in target folder
   - URL bookmarks work
   - Bookmarklet files are wrapped as `javascript:` URLs
   - Missing files are excluded
   - Invalid manifest.json shows Valibot validation error
   - Errors show in card and toast

4. **Periodic Sync**
   - Background alarm created on install
   - Sync runs every hour for enabled connections
   - Unchanged repos are skipped (commit SHA check)
   - Only changed repos trigger actual bookmark updates

### Automated Verification

```bash
make typecheck   # Type checking
make lint.fix    # Linting
bun run dev      # Dev server - test in Chrome
```

Load the extension in Chrome and test all flows manually.
