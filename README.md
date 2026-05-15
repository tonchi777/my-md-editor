# my-md-editor

A lightweight, cross-platform Markdown editor and viewer built with Tauri v2 and React.

## Why

Most Markdown editors are either web-only (no native file access) or Electron-based (~80MB+ bundles, high memory). This app uses Tauri to ship a native desktop binary under 10MB while keeping the UI in React/TypeScript.

## Features

- Live split preview — editor and rendered output side-by-side, updates as you type
- Native file open/save via OS dialogs
- Syntax highlighting in fenced code blocks (JS, TS, Python, Rust, Go, and more)
- Dark/light theme — follows OS preference, manually overridable, persists across restarts
- Resizable split pane with collapse/restore for each panel
- Markdown reference modal (F1) — quick cheat sheet for syntax
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

- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs) (stable toolchain)
- Tauri v2 system dependencies — see [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (opens the app window)
npm run tauri dev

# Build a release binary
npm run tauri build
```

The release binary and installer land in `src-tauri/target/release/bundle/`.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save |
| `Ctrl+Shift+S` | Save As |
| `Ctrl+N` | New file |
| `F1` | Markdown reference |

## Roadmap

### Tier 1 — Quick wins
- [ ] Recent files list (last 10 opened)
- [ ] Word wrap toggle
- [ ] Font size controls (+/− for editor and preview)
- [ ] Scroll sync between editor and preview
- [ ] Word count goal (set a target, show progress in status bar)

### Tier 2 — Medium effort
- [ ] Auto-save (every 30s when dirty)
- [ ] Export to HTML (standalone file with inlined CSS)
- [ ] Export to plain text (.txt)
- [ ] Distraction-free mode (F11)
- [ ] Custom preview CSS

### Tier 3 — Bigger features
- [ ] Folder sidebar (browse .md files in a directory)
- [ ] Multiple tabs
- [ ] Find & Replace
- [ ] Print / PDF export
- [ ] Export to DOCX (via `docx` npm package or pandoc)

## CI/CD

Two GitHub Actions workflows:
- **`ci.yml`** — builds on every push to `master` (Ubuntu, Windows, macOS)
- **`release.yml`** — triggered by `v*` tags, publishes a draft release with platform installers

To cut a release:
```bash
git tag v0.1.0
git push origin v0.1.0
```

## Known Limitations

- Images with relative paths in `.md` files won't render
- Files outside the home directory may be blocked by the Tauri sandbox
- No scroll sync yet (on the roadmap)

## License

MIT
