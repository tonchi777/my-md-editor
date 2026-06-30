# Project Agent Context

This file is the primary handoff document for AI agents working on this project.
Read it at the start of every session. Update the session log and roadmap checkboxes before ending a session.

---

## Current Status

**v0.1.2 in progress (2026-06-06).** All Tier 1–4 features shipped in v0.1.1. LaTeX math rendering added post-release.
Frontend builds with Vite, Rust backend compiles with Cargo, CI/CD is wired up on GitHub Actions.
Installers published as a GitHub draft release at https://github.com/tonchi888/my-md-editor.

---

## What's Built

- [x] Tauri v2 + React 18 + TypeScript + Vite scaffold
- [x] Live split preview (CodeMirror 6 editor + marked v12 renderer)
- [x] Syntax highlighting in preview (highlight.js, GitHub light/dark themes)
- [x] Native file open / save / save-as / new (Tauri plugin-dialog + plugin-fs)
- [x] Dark/light theme — OS detection, manual toggle, persisted in localStorage
- [x] Resizable split pane (pointer capture drag, ratio persisted in localStorage)
- [x] Collapse/restore editor and preview panels independently
- [x] Keyboard shortcuts: Ctrl+O, Ctrl+S, Ctrl+Shift+S, Ctrl+N, Ctrl+T, Ctrl+W, Ctrl+Tab, Ctrl+F, F1, F2, F11
- [x] Dirty state tracking + unsaved-changes warning on close
- [x] Status bar (filename, word count, char count)
- [x] Multiple tabs (TabBar — open several files, cycle with Ctrl+Tab)
- [x] Folder sidebar (FolderSidebar — browse .md files in a directory, deduplicates open tabs)
- [x] Find & Replace (Ctrl+F — in-editor via CodeMirror search panel)
- [x] Recent files list (last 10 opened, clock icon in toolbar)
- [x] Word wrap toggle + font size controls (+/− for editor and preview)
- [x] Scroll sync between editor and preview
- [x] Auto-save every 30 seconds when dirty, indicator in status bar
- [x] Export to HTML (standalone with inlined CSS)
- [x] Export to DOCX (via `docx` npm package)
- [x] Export to plain text (.txt)
- [x] Print / PDF export (browser print dialog, filename suggested from open file)
- [x] Distraction-free mode (F11 hides toolbar + status bar)
- [x] Custom preview CSS (CustomCssModal — palette icon in toolbar)
- [x] Help modal tabbed UI — Shortcuts, Markdown Reference, Changelog, About (F1)
- [x] F2 shortcut jumps directly to Markdown reference tab
- [x] File association — double-click .md in Explorer to open in app
- [x] App name/icon/branding (Pasulong MD)
- [x] Sidebar spans full height beside tab bar; toolbar wraps at narrow widths
- [x] GFM line breaks (single newline → `<br>`)
- [x] Version bump script (`npm run version:bump patch|minor|major`)
- [x] GitHub Actions CI (ci.yml — builds on every push to master)
- [x] GitHub Actions release workflow (release.yml — draft release on v* tags)

---

## Roadmap

Tick off items as they are completed. Add the session date in parentheses.

### Tier 1 — Quick wins

- [x] Recent files list (last 10 opened, shown in a dropdown from the toolbar)
- [x] Word wrap toggle (button in toolbar, persisted in localStorage)
- [x] Font size controls (+/− buttons for editor and preview independently)
- [x] Scroll sync (editor and preview scroll positions stay linked)
- [ ] Word count goal (set a target, show progress in status bar)

### Tier 2 — Medium effort

- [x] Auto-save (write to disk every 30s when dirty, indicator in status bar)
- [x] Export to HTML (save rendered preview as standalone .html file with inlined CSS)
- [x] Export to plain text (.txt — strip markdown syntax, useful for copy-paste into plain editors)
- [x] Distraction-free mode (F11 hides toolbar + status bar)
- [x] Custom preview CSS (user can supply a .css file to style the preview)

### Tier 3 — Bigger features

- [x] Folder sidebar (open a directory, browse .md files in a tree panel)
- [x] Multiple tabs (open several files at once)
- [x] Find & Replace (in-editor, CodeMirror already has the engine)
- [x] Print / PDF export (target the preview pane via browser print)
- [x] Export to DOCX (via the `docx` npm package)

### Tier 4 — Polish

- [x] App name and branding (Pasulong MD)
- [x] Custom icon
- [x] About tab inside Help modal
- [x] File association (open `.md` files from Explorer/Finder)
- [x] Sidebar spans full height beside the tab bar
- [x] Sidebar deduplicates already-open files (switches to existing tab)
- [x] Toolbar wraps to second row at narrow widths
- [x] Changelog (CHANGELOG.md + `npm run version:bump` script)
- [x] GFM line breaks (`breaks: true`) matching GitHub behavior
- [x] F2 shortcut for Markdown reference tab
- [x] LaTeX math rendering — inline `$...$` and block `$$...$$` via KaTeX (2026-06-06)
- [x] Rename tab — hover pencil icon on any tab to set a custom name; custom name feeds into Save / Save As / export default filenames (2026-06-30)

---

## Architecture Quick Reference

Key files an agent needs to know:

| File | Role |
|---|---|
| `src/App.tsx` | Root component. All state, keyboard shortcuts, layout wiring. |
| `src/components/Toolbar.tsx` | Top bar. Add new buttons here; add corresponding prop + handler in App.tsx. |
| `src/components/Editor.tsx` | CodeMirror 6 editor wrapper. |
| `src/components/Preview.tsx` | Sanitized HTML preview pane. |
| `src/components/TabBar.tsx` | Multi-tab management UI. |
| `src/components/SplitPane.tsx` | Drag-to-resize pane. `leftVisible`/`rightVisible` props control collapse. |
| `src/components/FolderSidebar.tsx` | Directory browser panel. Deduplicates already-open tabs. |
| `src/components/StatusBar.tsx` | Word count / char count / filename bar. |
| `src/components/HelpModal.tsx` | F1 tabbed modal — Shortcuts, Markdown Reference, Changelog, About. |
| `src/components/ExportMenu.tsx` | HTML / DOCX / TXT / PDF export dropdown. |
| `src/components/CustomCssModal.tsx` | Custom CSS editor modal (palette icon in toolbar). |
| `src/components/RecentFilesMenu.tsx` | Recent files dropdown (clock icon in toolbar). |
| `src/components/RenameModal.tsx` | Rename tab modal (pencil icon on tab hover). |
| `src/hooks/useFileSystem.ts` | All Tauri file I/O. `openFile`, `saveFile`, `saveFileAs`. |
| `src/hooks/useTheme.ts` | Theme state. Sets `document.documentElement.dataset.theme`. |
| `src/hooks/useMarkdown.ts` | Renders markdown to sanitized HTML string. Memoized on content. |
| `src/lib/markdownRenderer.ts` | Configures marked + highlight.js + KaTeX (math rendering) once at module load. |
| `src/lib/codemirrorSetup.ts` | Returns CM6 extension array. Accepts `isDark` to swap themes. |
| `src/lib/exportHtml.ts` | Standalone HTML export logic (inlines CSS). |
| `src/lib/exportDocx.ts` | DOCX export via `docx` npm package. |
| `src/types/index.ts` | Shared TypeScript types (Tab, etc.). |
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
- **DOMPurify on all rendered HTML:** even in a desktop app, malicious .md files can cause self-XSS. KaTeX math elements (`ADD_TAGS` / `ADD_ATTR`) are explicitly allowed through.
- **KaTeX `output: "html"`:** MathML output disabled — pure HTML spans are simpler for DOMPurify and avoid browser MathML inconsistencies.
- **`fs:scope-home-recursive` capability:** broadest practical scope without being unrestricted. Files outside home dir are denied.

---

## Environment Quirks

Things that caused problems — don't repeat them.

- **`os=win32` in `.npmrc`:** The Claude Code bash environment has `os=linux` in its global `~/.npmrc`, which prevents `@rollup/rollup-win32-x64-msvc` (the rollup native Windows binary) from installing. The project `.npmrc` overrides this with `os=win32`. CI workflows strip this line on non-Windows runners via `sed -i '/^os=/d' .npmrc`.
- **Rust not in PowerShell PATH:** Rust installs to `%USERPROFILE%\.cargo\bin` but this may not be in the PATH of a fresh PowerShell session. Prepend it: `$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"`.
- **VS Build Tools 2019 (not 2022):** The installed version is 2019. Tauri v2 builds fine with it — don't assume 2022 is required.
- **`tauri.conf.json` `bundle.icon`:** Must reference at least one icon or Tauri's Windows resource file generator errors during `cargo build`. Icon lives at `src-tauri/icons/icon.ico`.
- **`ubuntu-22.04` in CI (not `ubuntu-latest`):** Use the pinned version. `ubuntu-latest` may shift and break webkit2gtk package names.
- **Release commit message convention:** Start with `Release v` (e.g. `Release v0.1.2`). CI skips this pattern to avoid running in parallel with the Release workflow on the same commit.

---

## Session Log

Most recent first. Add a brief entry at the end of each session.

### 2026-06-30
- Added rename tab feature: hover pencil icon on any tab to set a custom name; custom name is used as the default filename in Save, Save As, and all export dialogs
- Added `RenameModal` component
- Updated `useFileSystem.saveFileAs` to accept an optional `defaultPath` parameter
- Updated `handleSave`, `handleSaveAs`, and all export handlers to pass `activeTab.label` as the suggested filename

### 2026-06-06
- Added LaTeX math rendering: `katex` + `marked-katex-extension`; DOMPurify configured to pass math elements; KaTeX CSS imported in main.tsx
- Improved CI/Release workflow: CI skips on "Release v*" commits to avoid redundant parallel builds; type-check added to Release workflow instead

### 2026-05-18
- Implemented all Tier 4 polish: file association, full-height sidebar, toolbar wrap, F2 shortcut, tabbed Help modal, GFM breaks, version bump script
- Fixed: dark mode on launch, DOCX spacing, print margins, custom CSS modal not typeable
- Released v0.1.1

### 2026-05-17
- Implemented all Tier 1–3 features: tabs, sidebar, Find & Replace, recent files, word wrap, font size, scroll sync, auto-save, HTML/DOCX/TXT/PDF export, distraction-free mode, custom CSS
- Released v0.1.0

### 2026-05-16
- Initialized project from scratch (Tauri v2 + React 18 + TypeScript)
- Implemented all v1 features: editor, preview, file I/O, theme, split pane, status bar
- Added Markdown reference modal (HelpModal, F1 shortcut)
- Set up GitHub Actions CI (`ci.yml`) and release workflow (`release.yml`)
- Pushed to GitHub: https://github.com/tonchi888/my-md-editor
- Updated PLAN.md and README.md with roadmap and agent context

---

*Update this file at the end of every session: tick completed roadmap items, append to the session log.*
