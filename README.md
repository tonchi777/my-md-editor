# my-md-editor

A lightweight, cross-platform Markdown editor and viewer built with Tauri v2 and React.

## Why

Most Markdown editors are either web-only (no native file access) or Electron-based (~80MB+ bundles, high memory). This app uses Tauri to ship a native desktop binary under 10MB while keeping the UI in React/TypeScript.

## Features (v1)

- Live split preview — editor and rendered output side-by-side, updates as you type
- Native file open/save via OS dialogs (`Ctrl+O`, `Ctrl+S`, `Ctrl+Shift+S`)
- Syntax highlighting in fenced code blocks (JS, TS, Python, Rust, Go, and more)
- Dark/light theme — follows OS preference, manually overridable, persists across restarts
- Resizable split pane with collapse/restore for each panel
- Dirty state indicator and unsaved-changes warning on close

## Stack

| Layer | Technology |
|---|---|
| Desktop runtime | [Tauri v2](https://tauri.app) |
| Frontend | React 19 + TypeScript + Vite |
| Editor | CodeMirror 6 |
| Markdown parser | marked v18 |
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

The release binary and installer are output to `src-tauri/target/release/bundle/`.

## Project Structure

```
my-md-editor/
├── src/                    # React/TypeScript frontend
│   ├── components/         # UI components
│   ├── hooks/              # useFileSystem, useTheme, useMarkdown
│   ├── lib/                # marked + CodeMirror configuration
│   ├── styles/             # CSS custom properties and theme files
│   └── types/              # Shared TypeScript interfaces
└── src-tauri/              # Rust/Tauri backend
    ├── capabilities/       # Plugin permission declarations (Tauri v2)
    └── src/                # Rust entry point and plugin registration
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save |
| `Ctrl+Shift+S` | Save As |
| `Ctrl+N` | New file |

## Known Limitations (v1)

- Images with relative paths in `.md` files won't render
- Files outside your home directory may be blocked by the sandbox
- No scroll sync between editor and preview panes

## License

MIT
