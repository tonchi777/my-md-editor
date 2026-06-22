# Online Sync — Option A: Cloud Storage Providers

Piggyback on existing cloud storage (Google Drive, Dropbox, OneDrive) rather than running a backend.

## Concept

Users authenticate with their preferred provider and choose a sync folder. Pasulong MD reads and writes `.md` files through the provider's API instead of (or in addition to) direct local file access. No server to operate — the provider handles storage, redundancy, and cross-device availability.

## What needs to be built

### 1. Auth flow (per provider)
- OAuth 2.0 login in a Tauri webview or external browser
- Secure token storage (Tauri's `tauri-plugin-store` or OS keychain)
- Token refresh handling

### 2. Provider API integration
Each provider has its own SDK/REST API:

| Provider | API | SDK |
|---|---|---|
| Google Drive | Drive REST API v3 | `googleapis` (Node) or raw HTTP from Rust |
| Dropbox | Dropbox API v2 | `dropbox-sdk-js` or raw HTTP |
| OneDrive | Microsoft Graph API | `@microsoft/microsoft-graph-client` |

For a first pass, support one provider (Google Drive is the broadest user base).

### 3. Sync folder selection
- Let the user pick or create a folder in their cloud storage (e.g. `Pasulong MD/`)
- Store the folder ID/path in app config

### 4. File operations via API
Replace or wrap the current Tauri file commands with cloud equivalents:
- List files → show in sidebar
- Open file → download content, open in tab
- Save file → upload/patch content

### 5. Conflict handling
This is the main limitation of Option A: conflict resolution is whatever the provider does — typically last-write-wins. Acceptable for single-user / "follow me across devices" use case. Not suitable for real-time collaboration.

Mitigations:
- Track local `lastModified` timestamp and compare before saving
- Warn the user if the remote version is newer than the local copy
- Optionally keep a local cache and diff before overwriting

### 6. Offline mode
- Cache the last-fetched content locally
- Queue writes when offline, flush when connectivity returns
- Show sync status in the status bar (synced / pending / error)

## Tauri-specific notes

- HTTP requests to external APIs must be allowed in `tauri.conf.json` under `allowlist` / `csp`
- Prefer making API calls from the **frontend** (fetch/axios) to reuse existing JS SDKs rather than Rust HTTP clients
- OAuth redirect URIs: use a custom URI scheme (`pasulong://oauth`) registered with the OS, or a localhost loopback server

## Scope estimate

| Phase | Work |
|---|---|
| 1 — Google Drive MVP | Auth, open/save single file via API, sync folder config |
| 2 — Sidebar integration | List remote files, open from sidebar |
| 3 — Conflict detection | Timestamp check, warn on overwrite |
| 4 — Offline queue | Local cache, write queue, status indicator |
| 5 — Additional providers | Dropbox, OneDrive |

A usable Phase 1 is probably 2–3 weeks of focused work. Full multi-provider support with offline queue is a much larger undertaking.

## Open questions

- Should sync be per-file or per-folder? (Folder is more natural for power users)
- Do we support both local and cloud files simultaneously, or make sync opt-in per tab?
- How do we handle non-`.md` assets (images) referenced in documents?
- Privacy: do we need a privacy policy once we touch user cloud data?
