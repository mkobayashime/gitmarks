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
- GitHub OAuth Device Flow authentication
- Repository connection management
- Manifest file parsing from GitHub repos
- Automatic periodic sync (hourly) + manual sync
- Skip-if-unchanged optimization using commit SHA
- Bookmarklet support (relative paths wrapped as `javascript:` URLs)

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
│  - Alarm-based periodic sync (60 min interval)               │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│  Sync Engine (lib/sync/)                                     │
│  - syncConnection: Single repo sync with commit SHA check    │
│  - syncAllConnections: Batch sync for enabled connections    │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│  Data Layer                                                  │
│  ├── lib/storage/     - Connection/user CRUD (chrome.storage)│
│  ├── lib/github/api.ts - OAuth Device Flow, repo/file fetch  │
│  ├── lib/bookmarks/   - Chrome bookmarks API wrapper         │
│  └── lib/manifest/    - JSON parsing with Valibot validation │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Auth**: GitHub OAuth Device Flow → token stored in chrome.storage
2. **Add Connection**: User selects repo → target folder → connection saved
3. **Sync**:
   - Fetch latest commit SHA for `srcDir`
   - Skip if unchanged (unless forced)
   - Fetch `manifest.json` from repo
   - Validate with Valibot
   - Resolve URLs and fetch bookmarklet files
   - Clear folder → create new bookmarks
   - Update `lastSyncedCommitSha`

### Key Types

- `Connection`: Repo config + sync state
- `ManifestBookmark`: `{ name, location }` from manifest.json
- `ResolvedBookmark`: `{ name, url }` after processing

### External APIs

- GitHub REST API: Repos, contents, commits, user
- Chrome Extension API: Storage, Bookmarks, Alarms
