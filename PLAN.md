# Implementation Plan: Lightweight Cross-Platform Markdown Editor

## Context

Building a desktop markdown editor/viewer from scratch. The goal is a lightweight, fast, native-feeling app — not a bloated Electron clone. Tauri v2 keeps the binary under ~5MB while still letting us use the full React/TypeScript ecosystem for the UI.

**v1 scope:** live split preview, file open/save, syntax highlighting in code blocks, dark/light theme with OS awareness.

---

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Desktop runtime | Tauri v2 | ~5MB binary vs ~80MB Electron |
| Frontend | React 19 + TypeScript + Vite | Modern, fast HMR |
| Editor | CodeMirror 6 via `@uiw/react-codemirror` | Modular, tree-shakable, proper MD support |
| Markdown parser | `marked` v18 | Synchronous (no async flicker), single package |
| Syntax highlighting | `highlight.js` v11 | Synchronous, tree-shakable language imports |
| Icons | `lucide-react` | Lightweight, consistent |
| Sanitization | `dompurify` | Prevent self-XSS from malicious .md files |

---

## Directory Structure

```
my-md-editor/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── Toolbar.tsx         — Open/Save/New/theme-toggle/collapse buttons
│   │   ├── Editor.tsx          — CodeMirror 6 wrapper
│   │   ├── Preview.tsx         — dangerouslySetInnerHTML with DOMPurify'd HTML
│   │   ├── SplitPane.tsx       — Pointer-event drag resizer (no library)
│   │   └── StatusBar.tsx       — Filename, word count, dirty indicator
│   ├── hooks/
│   │   ├── useFileSystem.ts    — Tauri plugin-fs + plugin-dialog wrappers
│   │   ├── useTheme.ts         — OS detection + manual toggle + localStorage
│   │   └── useMarkdown.ts      — marked.parse() + DOMPurify, memoized
│   ├── lib/
│   │   ├── markdownRenderer.ts — marked instance + hljs renderer config
│   │   └── codemirrorSetup.ts  — CM6 extension array
│   ├── styles/
│   │   ├── themes.css          — CSS custom properties, :root + [data-theme="dark"]
│   │   ├── preview.css         — Prose typography
│   │   ├── editor.css          — CM6 container sizing
│   │   └── hljs-themes.css     — github-light / github-dark scoped by data-theme
│   └── types/index.ts          — FileState, Theme interfaces
└── src-tauri/
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── capabilities/
    │   └── default.json        — CRITICAL: plugin permission declarations
    └── src/
        ├── main.rs
        └── lib.rs              — Just plugin init, zero custom commands
```

---

## Key Dependencies

### npm (production)

```json
{
  "@tauri-apps/api": "^2.11.0",
  "@tauri-apps/plugin-dialog": "^2.7.1",
  "@tauri-apps/plugin-fs": "^2.5.1",
  "@uiw/react-codemirror": "^4.25.9",
  "@codemirror/lang-markdown": "^6.5.0",
  "@codemirror/language-data": "^6.5.0",
  "@codemirror/theme-one-dark": "^6.1.3",
  "marked": "^18.0.3",
  "highlight.js": "^11.11.1",
  "dompurify": "^3.4.3",
  "lucide-react": "^0.511.0",
  "react": "^19.2.6",
  "react-dom": "^19.2.6"
}
```

### Rust (`src-tauri/Cargo.toml`)

```toml
tauri = { version = "2", features = [] }
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

---

## Key Implementation Details

### Rust side (`lib.rs`) — intentionally minimal

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

All file I/O goes through the Tauri plugin bridge — no custom `#[tauri::command]` needed for v1.

### Capabilities (`capabilities/default.json`) — Tauri v2 permission system

```json
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "dialog:allow-open",
    "dialog:allow-save",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "fs:allow-exists",
    "fs:scope-home-recursive"
  ]
}
```

> Note: `fs:scope-home-recursive` grants access to the user's home directory tree. Files outside this scope (e.g. network drives) will be denied in v1.

### Theme system — pure CSS, no JS in components

- `useTheme.ts` only sets `document.documentElement.dataset.theme = "light" | "dark"`
- All components use `var(--color-*)` CSS custom properties
- hljs code block colors scoped via `[data-theme]` attribute — no conditional CSS imports

### marked v18 renderer

> v18 changed the `renderer.code` signature from positional args to an object parameter.

```typescript
renderer.code = ({ text, lang }) => {
  const language = hljs.getLanguage(lang || "") ? lang! : "plaintext";
  const highlighted = hljs.highlight(text, { language }).value;
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
};
```

### SplitPane — pointer events, no library

Drag divider updates `splitRatio` state (clamped 0.2–0.8), persisted in `localStorage`. Collapse via `flex: 0 0 0; overflow: hidden` on the hidden panel.

### Keyboard shortcuts — wired in `App.tsx`

- `Ctrl+S` → save
- `Ctrl+O` → open
- `Ctrl+N` → new
- `window.onbeforeunload` guard when file is dirty

### Release profile — keeps binary small

```toml
[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
strip = true
panic = "abort"
```

---

## Implementation Phases

| # | Phase | Key outputs |
|---|---|---|
| 1 | **Scaffold** | `npm create tauri-app@latest`, verify window opens |
| 2 | **Install deps** | All npm packages + Rust plugin crates |
| 3 | **Rust + capabilities** | `lib.rs` plugin init + `capabilities/default.json` |
| 4 | **Theme system** | `themes.css` + `useTheme.ts`, toggle works |
| 5 | **Markdown pipeline** | `markdownRenderer.ts` + `useMarkdown.ts` + `hljs-themes.css` |
| 6 | **Editor** | `codemirrorSetup.ts` + `Editor.tsx`, live preview wired |
| 7 | **Layout** | `SplitPane.tsx` + styles, resize/collapse tested |
| 8 | **File system** | `useFileSystem.ts` + `Toolbar.tsx`, open/save/dirty state |
| 9 | **Status bar + polish** | `StatusBar.tsx`, keyboard shortcuts, `onbeforeunload` |
| 10 | **Release build** | `npm run tauri build`, verify binary ≤ 10MB |

---

## Verification Checklist

- [ ] Open .md file via toolbar + `Ctrl+O`, content appears in both panes
- [ ] Typing in editor updates preview in real time (~16ms)
- [ ] Fenced code blocks render with syntax highlighting (JS, Python, Rust)
- [ ] `Ctrl+S` saves to same file without dialog; Save As shows dialog
- [ ] Dirty indicator appears on edit, clears on save
- [ ] Close with unsaved changes → OS confirmation dialog
- [ ] Theme toggle switches light/dark; code colors update too
- [ ] OS `prefers-color-scheme` respected on first launch; persists in localStorage
- [ ] Drag split divider; ratio persists on restart
- [ ] Collapse/restore each pane independently
- [ ] Release binary size ≤ 10MB

---

## Known v1 Limitations

- Images with relative paths won't resolve (no `baseUrl` set)
- Files outside the home directory may be denied by `fs:scope-home-recursive`
- No scroll sync between editor and preview panes
