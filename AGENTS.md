# GitMarks

This is a repository for a Chrome Extension called GitMarks.

## Keeping This File Updated

When completing tasks, update this file and report the updates summary if you:

- Update utilities, hooks, or shared functions already documented, or add new ones.
- Change architectural patterns or data flow
- Add new external dependencies or APIs
- Establish new coding conventions

## Language / Package manager

- TypeScript
- Bun (as a package manager and runtime)
  - Always use Bun over npm, yarn, pnpm or Node.

## Framework

WXT (https://wxt.dev/)

## Lint

Use these `make` commands, or execute the corresponding commands specified in `Makefile` directly if needed.

- `make lint.fix`
- `make typecheck`

## Coding rules

- Prefer arrow functions over `function` expressions.

---

## Architecture Overview

### Purpose
Chrome Extension that syncs GitHub repository manifest files to Chrome bookmarks.

### Key Features
- GitHub OAuth Device Flow authentication with automatic token refresh (GitHub App User Access Token)
- Repository connection management
- Cross-browser connection settings sync (via chrome.storage.sync)
- **Recursive manifest discovery** - Finds all manifest.json files in srcDir and subdirectories
- **Nested bookmark folders** - Creates subfolders matching repository directory structure
- Manifest file parsing from GitHub repos
- Automatic periodic sync (configurable interval) + manual sync
- Skip-if-unchanged optimization using commit SHA
- Bookmarklet support

### Architecture Layers

```
┌──────────────────────────────────────────────────────────────┐
│  UI Layer (entrypoints/options/)                             │
│  - React + Tailwind CSS + Ark UI components                  │
│  - Auth state, connection management, sync controls          │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│  Background Service (entrypoints/background.ts)              │
│  - WXT background script                                     │
│  - Alarm-based periodic sync (configurable interval)         │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│  Sync Engine (lib/sync/)                                     │
│  - syncConnection: Single repo sync with commit SHA check    │
│  - syncAllConnections: Batch sync for enabled connections    │
│  - findManifestFiles: Recursive manifest discovery           │
│  - syncBookmarksToSubfolders: Nested folder sync             │
│  - getOrCreateFolder: Create nested bookmark folders         │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│  Data Layer                                                  │
│  ├── lib/storage/     - Connection/user CRUD (chrome.storage)│
│  ├── lib/github/auth.ts - Device Flow, token refresh         │
│  ├── lib/github/api.ts - Repo/file/user fetch               │
│  ├── lib/bookmarks/   - Chrome bookmarks API wrapper         │
│  └── lib/manifest/    - JSON parsing with Valibot validation │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Auth**: GitHub OAuth Device Flow → `AuthData` (token + refresh metadata) stored in chrome.storage.local
   - `getValidToken()` checks expiry before every API call; refreshes automatically if within 5-min buffer
   - Refresh token rotation: each refresh issues a new `refresh_token`
   - If refresh token is also expired, storage is cleared → re-auth required
2. **Add Connection**: User selects repo → target folder → connection saved
   - Configuration (repo settings, enabled status) → chrome.storage.sync
   - State (folder IDs, sync timestamps) → chrome.storage.local
3. **Cross-Browser Sync**:
   - Connection settings sync across browsers via chrome.storage.sync
   - Browser-specific state (folder IDs) remains local
   - Orphan configs (synced without local state) auto-resolve on mount
   - Deleted connections cleanup orphaned local state
4. **Sync**:
   - Fetch latest commit SHA for `srcDir`
   - Skip if unchanged (unless forced)
   - Recursively find all `manifest.json` files in srcDir
   - For each manifest:
     - Fetch and validate with Valibot
     - Resolve URLs and fetch bookmarklet files
     - Create corresponding subfolder structure
   - Clear all existing bookmarks in target folder
   - Create new bookmarks in respective subfolders
   - Update `lastSyncedCommitSha`

### Key Types

- `ConnectionConfig`: Synced across browsers (repo settings, enabled status)
- `ConnectionState`: Browser-specific (folder IDs, sync timestamps)
- `Connection`: Merged type (ConnectionConfig & ConnectionState) for backward compatibility
- `ManifestBookmark`: `{ name, location }` from manifest.json
- `ResolvedBookmark`: `{ name, url }` after processing
- `ManifestLocation`: `{ path: string, relativePath: string }` - Location of each manifest file
- `SyncTarget`: `{ bookmarks: ResolvedBookmark[], subfolderPath?: string }` - Target for subfolder sync

### External APIs

- GitHub REST API: Repos, contents, commits, user
- Chrome Extension API: Storage (sync + local), Bookmarks, Alarms

### Storage Architecture

**Split Storage for Cross-Browser Sync:**
- `chrome.storage.sync` - Connection configurations (synced across browsers)
  - Key: `sync:gitmarks_connections`
  - Includes: repo settings, target folder path, enabled status
- `chrome.storage.local` - Browser-specific state (local only)
  - Key: `local:gitmarks_connection_state`
  - Includes: folder IDs, sync timestamps, errors
- `chrome.storage.local` - User data (local only)
  - Keys: `local:gitmarks_user`, `local:github_auth_data`
  - `local:github_auth_data` stores `AuthData`: `{ accessToken, refreshToken?, expiresAt?, refreshTokenExpiresAt? }`
  - Each browser requires separate authentication
- `chrome.storage.sync` - Extension settings (synced across browsers)
  - Key: `sync:gitmarks_settings`
  - Includes: sync interval in minutes
  - Settings are validated with Valibot schema with fallback values
