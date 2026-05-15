# Project Agent Context

This file is the primary handoff document for AI agents working on this project.
Read it at the start of every session. Update the session log and roadmap checkboxes before ending a session.

---

## Current Status

**The app is fully functional and building.** Core v1 features are complete.
Frontend builds with Vite, Rust backend compiles with Cargo, CI/CD is wired up on GitHub Actions.
The app is not yet distributed — no release tag has been cut.

---

## What's Built

- [x] Tauri v2 + React 18 + TypeScript + Vite scaffold
- [x] Live split preview (CodeMirror 6 editor + marked v12 renderer)
- [x] Syntax highlighting in preview (highlight.js, GitHub light/dark themes)
- [x] Native file open / save / save-as / new (Tauri plugin-dialog + plugin-fs)
- [x] Dark/light theme — OS detection, manual toggle, persisted in localStorage
- [x] Resizable split pane (pointer capture drag, ratio persisted in localStorage)
- [x] Collapse/restore editor and preview panels independently
- [x] Keyboard shortcuts: Ctrl+O, Ctrl+S, Ctrl+Shift+S, Ctrl+N, F1
- [x] Dirty state tracking + unsaved-changes warning on close
- [x] Status bar (filename, word count, char count)
- [x] Markdown reference modal (F1 / ? button) — 8 sections of syntax cheat sheet
- [x] GitHub Actions CI (ci.yml — builds on every push)
- [x] GitHub Actions release workflow (release.yml — draft release on v* tags)

---

## Roadmap

Tick off items as they are completed. Add the session date in parentheses.

### Tier 1 — Quick wins

- [ ] Recent files list (last 10 opened, shown in a dropdown from the toolbar)
- [ ] Word wrap toggle (button in toolbar, persisted in localStorage)
- [ ] Font size controls (+/− buttons for editor and preview independently)
- [ ] Scroll sync (editor and preview scroll positions stay linked)

### Tier 2 — Medium effort

- [ ] Auto-save (write to disk every 30s when dirty, indicator in status bar)
- [ ] Export to HTML (save rendered preview as standalone .html file)
- [ ] Distraction-free mode (F11 hides toolbar + status bar)
- [ ] Custom preview CSS (user can supply a .css file to style the preview)

### Tier 3 — Bigger features

- [ ] Folder sidebar (open a directory, browse .md files in a tree panel)
- [ ] Multiple tabs (open several files at once)
- [ ] Find & Replace (in-editor, CodeMirror already has the engine)
- [ ] Print / PDF export (target the preview pane via browser print)

---

## Architecture Quick Reference

Key files an agent needs to know:

| File | Role |
|---|---|
| `src/App.tsx` | Root component. All state, keyboard shortcuts, layout wiring. |
| `src/components/Toolbar.tsx` | Top bar. Add new buttons here; add corresponding prop + handler in App.tsx. |
| `src/components/SplitPane.tsx` | Drag-to-resize pane. `leftVisible`/`rightVisible` props control collapse. |
| `src/components/HelpModal.tsx` | F1 reference modal. SECTIONS array drives the content. |
| `src/hooks/useFileSystem.ts` | All Tauri file I/O. `openFile`, `saveFile`, `saveFileAs`. |
| `src/hooks/useTheme.ts` | Theme state. Sets `document.documentElement.dataset.theme`. |
| `src/hooks/useMarkdown.ts` | Renders markdown to sanitized HTML string. Memoized on content. |
| `src/lib/markdownRenderer.ts` | Configures marked + highlight.js once at module load. |
| `src/lib/codemirrorSetup.ts` | Returns CM6 extension array. Accepts `isDark` to swap themes. |
| `src/styles/themes.css` | All CSS custom properties. Also holds toolbar, split-pane, modal, status-bar styles. |
| `src/styles/preview.css` | Prose typography for the rendered HTML pane. |
| `src/styles/hljs-themes.css` | Syntax highlight colors, scoped to `[data-theme]`. |
| `src-tauri/src/lib.rs` | Rust entry. Only registers plugins — add new Tauri plugins here. |
| `src-tauri/capabilities/default.json` | Tauri v2 permissions. Must be updated when adding new plugins. |

### Patterns to follow

- **New toolbar button:** add to `Toolbar.tsx` props interface + JSX, wire handler in `App.tsx`.
- **New modal:** follow `HelpModal.tsx` pattern — backdrop click + Escape key to close.
- **New localStorage preference:** read in `useState` initializer, write in `useEffect` on change.
- **New Tauri plugin:** add to `Cargo.toml`, register in `lib.rs`, declare permission in `capabilities/default.json`.
- **Theme-aware styles:** use `var(--color-*)` everywhere, override with `[data-theme="dark"]` selector.

---

## Key Decisions

These were made deliberately — don't change them without a reason.

- **marked over remark/unified:** synchronous parse, single package, no async flicker in live preview.
- **highlight.js over shiki:** synchronous, tree-shakable. Shiki requires async init which complicates the marked renderer hook.
- **No basicSetup in CodeMirror:** `basicSetup={false}` gives full control over the extension list. Extensions live in `codemirrorSetup.ts`.
- **CSS custom properties for theming:** no JS theme logic in components — only `document.documentElement.dataset.theme` changes. Everything else is CSS.
- **Pointer capture for SplitPane drag:** `setPointerCapture` on the divider so drag works even when pointer leaves the element.
- **DOMPurify on all rendered HTML:** even in a desktop app, malicious .md files can cause self-XSS.
- **`fs:scope-home-recursive` capability:** broadest practical scope without being unrestricted. Files outside home dir are denied.

---

## Environment Quirks

Things that caused problems — don't repeat them.

- **`os=win32` in `.npmrc`:** The Claude Code bash environment has `os=linux` in its global `~/.npmrc`, which prevents `@rollup/rollup-win32-x64-msvc` (the rollup native Windows binary) from installing. The project `.npmrc` overrides this with `os=win32`. CI workflows strip this line on non-Windows runners via `sed -i '/^os=/d' .npmrc`.
- **Rust not in PowerShell PATH:** Rust installs to `%USERPROFILE%\.cargo\bin` but this may not be in the PATH of a fresh PowerShell session. Prepend it: `$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"`.
- **VS Build Tools 2019 (not 2022):** The installed version is 2019. Tauri v2 builds fine with it — don't assume 2022 is required.
- **`tauri.conf.json` `bundle.icon`:** Must reference at least one icon or Tauri's Windows resource file generator errors during `cargo build`. Icon lives at `src-tauri/icons/icon.ico`.
- **`ubuntu-22.04` in CI (not `ubuntu-latest`):** Use the pinned version. `ubuntu-latest` may shift and break webkit2gtk package names.

---

## Session Log

Most recent first. Add a brief entry at the end of each session.

### 2026-05-16
- Initialized project from scratch (Tauri v2 + React 18 + TypeScript)
- Implemented all v1 features: editor, preview, file I/O, theme, split pane, status bar
- Added Markdown reference modal (HelpModal, F1 shortcut)
- Set up GitHub Actions CI (`ci.yml`) and release workflow (`release.yml`)
- Pushed to GitHub: https://github.com/tonchi888/my-md-editor
- Updated PLAN.md and README.md with roadmap and agent context

---

*Update this file at the end of every session: tick completed roadmap items, append to the session log.*
