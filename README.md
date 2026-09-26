# Pasulong MD

A lightweight, cross-platform Markdown editor built with Tauri v2 and React.

## Why

Most Markdown editors are either web-only (no native file access) or Electron-based (~80MB+ bundles, high memory). This app uses Tauri to ship a native desktop binary under 10MB while keeping the UI in React/TypeScript.

## Features

- Live split preview — editor and rendered output side-by-side, updates as you type
- Native file open/save via OS dialogs
- File association — double-click any `.md` file in Explorer to open it directly in the app
- Multiple tabs (Ctrl+T / Ctrl+W / Ctrl+Tab)
- Folder sidebar — browse and open `.md` files from a directory; refreshes automatically when files are added, removed, or renamed
- Outline — sidebar tab listing the document's headings; click one to jump to it
- Quick open (Ctrl+P) — fuzzy-search files in the sidebar folder and your recent files
- External change detection — open files reload when changed on disk; if you have unsaved edits, choose Reload or Keep mine
- Find & Replace (Ctrl+F)
- Syntax highlighting in fenced code blocks (JS, TS, Python, Rust, Go, and more)
- Dark/light theme — follows OS preference, manually overridable, persists across restarts
- Resizable split pane with collapse/restore for each panel
- Auto-save every 30 seconds when the file is dirty
- Export to HTML, plain text (.txt), DOCX, or PDF/print
- Distraction-free mode (F11)
- Custom preview CSS
- Help modal (F1) — keyboard shortcuts, Markdown reference, changelog, and About, all in one tabbed modal
- Dirty state indicator and unsaved-changes warning on close
- Toolbar wraps to a second row at narrow window widths — no buttons ever hidden

## Stack

| Layer | Technology |
|---|---|
| Desktop runtime | [Tauri v2](https://tauri.app) |
| Frontend | React 18 + TypeScript + Vite |
| Editor | CodeMirror 6 |
| Markdown parser | marked v12 |
| Syntax highlighting | highlight.js v11 |
| Sanitization | DOMPurify |

## Prerequisites

- [Node.js](https://nodejs.org) 18+ — JavaScript runtime
- [Rust](https://rustup.rs) (stable toolchain) — required by Tauri to compile the desktop wrapper
- On Windows: [VS C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the "Desktop development with C++" workload

To verify everything is installed, run these in a terminal:

```
node --version    # should print v18 or higher
rustc --version   # should print something like rustc 1.x.x
cargo --version   # should print something like cargo 1.x.x
```

If `rustc` or `cargo` are not found, install Rust first (see link above) then **restart your terminal** so the path updates.

## Getting Started

**First time only — install dependencies:**

```
npm install
```

**Start the app in development mode:**

```
npm run tauri dev
```

This compiles the Rust backend (takes 1–3 minutes the first time, much faster after that) and opens the app window. The frontend hot-reloads as you edit files in `src/` — no restart needed for UI changes. Rust changes in `src-tauri/` require a full restart.

**Build a release binary** (optional — produces an installable file):

```
npm run tauri build
```

The installer lands in `src-tauri/target/release/bundle/` — on Windows that's an `.msi` and a standalone `.exe`.

> **Frontend-only preview (no Rust needed):** If Rust isn't installed yet, you can still run `npm run dev` to open the app in a browser at `http://localhost:1420`. File open/save won't work (those need the Tauri backend) but the editor and preview render normally — useful for testing UI changes.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save |
| `Ctrl+Shift+S` | Save As |
| `Ctrl+N` | New file (in active tab) |
| `Ctrl+T` | New tab |
| `Ctrl+W` | Close tab |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Ctrl+F` | Find & Replace |
| `Ctrl+P` | Quick open |
| `F1` | Help modal (Shortcuts / Markdown / Changelog / About) |
| `F2` | Markdown reference |
| `F11` | Toggle distraction-free mode |

## Roadmap

This is the single plan for the project. Tiers group work by effort; **Next up** sets priority. Design notes for larger items are collapsed under each tier.

### Next up
_To be decided — pick from the tiers below._

### Tier 1 — Quick wins
- [ ] Word count goal (set a target, show progress in status bar)
- [ ] Smart lists — Enter continues bullets/numbers, Tab / Shift+Tab indents
- [ ] GitHub-style callouts (`> [!NOTE]`, `> [!WARNING]`) and footnotes (`[^1]`)

### Tier 2 — Medium effort
- [ ] Formatting shortcuts — Ctrl+B bold, Ctrl+I italic, Ctrl+Shift+X strikethrough
- [ ] Reopen last tabs, folder and cursor positions on launch
- [ ] Mermaid diagrams in fenced ` ```mermaid ` blocks
- [ ] Clickable task checkboxes in preview (updates the source)
- [ ] Auto-align Markdown tables

<details>
<summary>Design notes — formatting shortcuts</summary>

- Implement as a CodeMirror keymap in `src/lib/codemirrorSetup.ts`, with helpers in a new `src/lib/formatting.ts`. One transaction per edit, so undo/redo works naturally and the cursor doesn't jump.
- With a selection: wrap it in markers (`**`, `*`, `~~`). With no selection: insert the markers and put the cursor between them.
- Toggle: if the text right around the selection already matches the markers, remove them instead. Only exact boundary matches count, so existing nesting isn't broken.
- Underline is left out: Markdown has no syntax for it (only HTML `<u>`), and Ctrl+U is a poor key for it anyway.
- Later: inline code, heading levels (Ctrl+1–6), blockquote, link insertion (Ctrl+K), toolbar buttons, and a "Formatting" section in the Help modal.
- Open questions: support `_` / `__` delimiters? Skip formatting inside code blocks?
</details>

### Tier 3 — Bigger features
- [ ] Image rendering for relative paths
- [ ] Paste images from the clipboard into `assets/` (depends on image rendering)
- [ ] Command palette (Ctrl+Shift+P)
- [ ] Online sync via cloud storage (Google Drive first, then Dropbox / OneDrive)
- [ ] Mobile app (iOS / Android via Tauri Mobile)

<details>
<summary>Design notes — image rendering</summary>

- Goal: `![alt](./pic.png)` renders in the preview and carries through to exports.
- Proposed modes: **auto-copy** (default; copy referenced images into an `assets/` folder next to the `.md` file), **link-only** (use paths as-is, show a placeholder if broken), **absolute** (resolve to a full local path). Chosen from a toolbar dropdown and saved in localStorage.
- **Resolve before building:** the WebView blocks raw `file://` URLs, and the auto-copy design still ended up handing `file://` paths to the preview. Tauri's asset protocol (`convertFileSrc` plus an `assetProtocol` scope in `tauri.conf.json`) can serve local files to the WebView directly. It may remove the need for copying altogether. Prototype this first.
- Rendering: images need async work (copying or path resolution), but marked's renderer is synchronous. Collect image paths first, resolve them all, then parse, and keep the result in `useMarkdown` state instead of `useMemo`.
- Copying: `readFile` + `writeFile` (the fs plugin has no copy command). Name clashes get `_1`, `_2`… suffixes. Cache results so images aren't re-copied on every keystroke.
- Exports: the HTML export copies `assets/` next to the output file, DOCX embeds the images, and TXT drops them.
- Leave for later: drag-and-drop images, a "clean up assets" command.
</details>

<details>
<summary>Design notes — online sync</summary>

- Use existing cloud storage through its own API instead of running a backend. Start with Google Drive (Drive API v3), then add Dropbox (API v2) and OneDrive (Microsoft Graph).
- Auth: OAuth 2.0, redirecting back to the app via a custom URI scheme (`pasulong://oauth`) or a localhost loopback. Store tokens securely (`tauri-plugin-store` or the OS keychain) and handle token refresh.
- Make API calls from the frontend so existing JS SDKs can be reused. External hosts must be allowed in the CSP.
- Conflicts: the providers use last-write-wins. Compare `lastModified` before saving and warn if the remote copy is newer. This is fine for one person working across devices, not for real-time collaboration.
- Offline: cache files locally, queue writes and send them when back online, and show synced / pending / error in the status bar.
- Phases: (1) Drive: sign in, open/save, pick a sync folder → (2) remote files in the sidebar → (3) conflict detection → (4) offline queue → (5) more providers. Phase 1 is roughly 2–3 weeks.
- Open questions: sync per file or per folder? Mix local and cloud files? How to handle images? A privacy policy will be needed once the app touches users' cloud data.
</details>

<details>
<summary>Design notes — mobile</summary>

- Tauri Mobile reuses the Rust + React codebase. The renderer, sanitization, exports, theming and CodeMirror all carry over.
- Must change: the split pane becomes one pane with an edit/preview toggle (split view could return on tablets). File access goes through the system document picker (via `tauri-plugin-dialog`), and the folder sidebar is replaced by recent files at first. Keyboard shortcuts give way to touch toolbars with 44pt tap targets, and saving/exporting goes through the share sheet. The status bar must stay clear of the on-screen keyboard (`visualViewport`, `env(safe-area-inset-*)`).
- Tabs: one file at a time in v1; multiple files later via a drawer.
- Builds: iOS requires macOS, Xcode and an Apple Developer account ($99/yr). Android works on Windows with Android Studio, Java 17+ and API 24+ ($25 one-time for Play Store). Run `rustup target add` for each target, then `npm run tauri ios init` / `android init`.
- Phases: (1) proof of concept running in the simulator/emulator → (2) proper mobile UX → (3) store listings and mobile CI → (4) feature parity (multiple files, iCloud/folder browsing, PDF export).
- Risks: text editing on touch screens inside a WebView, `window.print()` in iOS's WebView, strict iOS file access (test on a real device), App Store review taking 1–2 rounds.
</details>

### Shipped

See [CHANGELOG.md](CHANGELOG.md) for release-by-release detail.

- **Editing:** CodeMirror editor with live split preview, Find & Replace, word wrap toggle, font size controls, scroll sync
- **Files & tabs:** native open/save dialogs, multiple tabs, rename tab (custom name feeds save/export filenames), recent files (last 10), quick open (Ctrl+P), `.md` file association, auto-save every 30s, reload / conflict banner when an open file changes on disk
- **Sidebar:** Files and Outline tabs, full-height, deduplicates already-open files, auto-refreshes on disk changes, manual refresh button, keeps its folder when hidden
- **Preview:** syntax-highlighted code blocks, LaTeX math (KaTeX), GFM line breaks, custom preview CSS
- **Export:** HTML (inlined CSS), DOCX, plain text, Print / PDF
- **UI:** dark/light theme, resizable and collapsible panes, distraction-free mode (F11), toolbar wraps at narrow widths, Help modal (F1 / F2)
- **Project:** Pasulong MD branding and icon, changelog + `npm run version:bump`, CI and draft-release workflows

## CI/CD

Two GitHub Actions workflows:
- **`ci.yml`** — builds on every push to `master` (Ubuntu, Windows, macOS)
- **`release.yml`** — triggered by `v*` tags, publishes a draft release with platform installers

To cut a release:
```bash
npm run version:bump patch   # or minor / major
# fill in CHANGELOG.md
git add -A && git commit -m "Release vX.Y.Z"
git tag vX.Y.Z
git push origin master
git push origin vX.Y.Z
```

The release workflow publishes a **draft** GitHub release named `Pasulong MD vX.Y.Z` with installers for Windows (`.msi`/`.exe`), macOS (`.dmg`, universal binary), and Linux (`.AppImage`/`.deb`/`.rpm`). Promote the draft to publish it.

## Known Limitations

- Images with relative paths in `.md` files won't render (planned — see Roadmap, Tier 3)
- Files outside the home directory may be blocked by the Tauri sandbox

## License

MIT
