# Pasulong MD

A lightweight, cross-platform Markdown editor built with Tauri v2 and React.

## Why

Most Markdown editors are either web-only (no native file access) or Electron-based (~80MB+ bundles, high memory). This app uses Tauri to ship a native desktop binary under 10MB while keeping the UI in React/TypeScript.

## Features

- Live split preview — editor and rendered output side-by-side, updates as you type
- Native file open/save via OS dialogs
- File association — double-click any `.md` file in Explorer to open it directly in the app
- Multiple tabs (Ctrl+T / Ctrl+W / Ctrl+Tab)
- Folder sidebar — browse and open `.md` files from a directory
- Find & Replace (Ctrl+F)
- Syntax highlighting in fenced code blocks (JS, TS, Python, Rust, Go, and more)
- Dark/light theme — follows OS preference, manually overridable, persists across restarts
- Resizable split pane with collapse/restore for each panel
- Auto-save every 30 seconds when the file is dirty
- Export to HTML, plain text (.txt), DOCX, or PDF/print
- Distraction-free mode (F11)
- Custom preview CSS
- Markdown reference modal (F1) — quick cheat sheet for syntax
- About modal — app info and version
- Dirty state indicator and unsaved-changes warning on close

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
| `F1` | Markdown reference |
| `F11` | Toggle distraction-free mode |
| Info button | About Pasulong MD |

## Roadmap

### Tier 1 — Quick wins
- [x] Recent files list (last 10 opened)
- [x] Word wrap toggle
- [x] Font size controls (+/− for editor and preview)
- [x] Scroll sync between editor and preview
- [ ] Word count goal (set a target, show progress in status bar)

### Tier 2 — Medium effort
- [x] Auto-save (every 30s when dirty)
- [x] Export to HTML (standalone file with inlined CSS)
- [x] Export to plain text (.txt)
- [x] Distraction-free mode (F11)
- [x] Custom preview CSS

### Tier 3 — Bigger features
- [x] Folder sidebar (browse .md files in a directory)
- [x] Multiple tabs
- [x] Find & Replace (Ctrl+F)
- [x] Print / PDF export
- [x] Export to DOCX (via `docx` npm package)

### Tier 4 — Polish
- [x] App name and branding (Pasulong MD)
- [x] Custom icon
- [x] About modal
- [x] File association (open `.md` files from Explorer/Finder)

## CI/CD

Two GitHub Actions workflows:
- **`ci.yml`** — builds on every push to `master` (Ubuntu, Windows, macOS)
- **`release.yml`** — triggered by `v*` tags, publishes a draft release with platform installers

To cut a release:
```bash
git tag v0.1.0
git push origin v0.1.0
```

The release workflow publishes a **draft** GitHub release named `Pasulong MD vX.Y.Z` with installers for Windows (`.msi`/`.exe`), macOS (`.dmg`, universal binary), and Linux (`.AppImage`/`.deb`/`.rpm`). Promote the draft to publish it.

## Known Limitations

- Images with relative paths in `.md` files won't render
- Files outside the home directory may be blocked by the Tauri sandbox

## License

MIT
