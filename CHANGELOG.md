# Changelog

All notable changes to Pasulong MD are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.1.4] - 2026-09-27

### Added
- Outline tab in the sidebar — lists the document's headings; click one to jump to it in the editor (and preview)
- Quick open (Ctrl+P) — fuzzy-search Markdown files in the sidebar folder (including subfolders) and your recent files
- External change detection — open files with no unsaved edits reload automatically when changed on disk; with unsaved edits, a banner offers Reload or Keep mine; deleted files get a Save to restore option
- Folder sidebar auto-refreshes when files are added, removed, or renamed in the open folder
- Refresh button in the folder sidebar header for a manual reload

### Changed
- Sidebar keeps its open folder when hidden and shown again
- Auto-save skips a file while an external-change conflict is unresolved, so it never overwrites someone else's edits

## [0.1.3] - 2026-08-07

### Added
- Rename tab — hover over a tab and click the pencil icon to give it a custom name; the custom name is used as the default filename in Save, Save As, and all export dialogs

## [0.1.2] - 2026-06-06

### Added
- LaTeX math rendering via KaTeX — inline `$...$` and block `$$...$$` syntax now renders as typeset equations in the preview

## [0.1.1] - 2026-05-18

### Added
- F2 shortcut jumps directly to the Markdown reference tab in the Help modal
- Help modal reorganized into tabs: Shortcuts, Markdown Reference, Changelog, About
- Version bump script: `npm run version:bump patch|minor|major`

### Changed
- Sidebar now uses full-height layout; toolbar wraps to a second row at narrow widths instead of hiding buttons
- PDF / Print now suggests the open file's name as the default save filename
- Markdown rendering: single newlines now produce line breaks (GFM `breaks: true`), matching GitHub behavior

### Fixed
- Dark mode: editor theme and native title bar now correctly reflect the active theme on launch and toggle
- DOCX export: fixed paragraph spacing and multi-page layout
- Print / PDF: fixed inconsistent margins on overflow pages
- Custom CSS modal: textarea was not typeable (clicking it dismissed the modal); now uses robust backdrop-click detection and auto-focuses on open

## [0.1.0] - 2026-05-17

### Added
- Live split preview with syntax-highlighted fenced code blocks (JS, TS, Python, Rust, Go, and more)
- Multiple tabs — Ctrl+T new tab, Ctrl+W close, Ctrl+Tab cycle
- Folder sidebar — browse and open `.md` files in a directory
- Find & Replace (Ctrl+F)
- Native file open / save via OS dialogs (Ctrl+O / Ctrl+S / Ctrl+Shift+S)
- File association — double-click a `.md` file in Explorer to open it directly in the app
- Export to HTML (standalone with inlined CSS), DOCX, plain text (.txt), and PDF via print dialog
- Auto-save every 30 seconds when a file has unsaved changes
- Distraction-free mode (F11 / Esc)
- Dark / light theme following OS preference, with manual override, persists across restarts
- Resizable split pane with collapse and restore for each panel
- Custom preview CSS via palette icon in toolbar
- Scroll sync between editor and preview panels
- Recent files list (last 10 opened, clock icon in toolbar)
- Word wrap toggle and font size controls (+/−)
- Help modal with keyboard shortcuts, Markdown reference, and changelog (F1)
- Custom app icon and About modal (info icon in toolbar)
- GitHub Actions CI/CD: builds on every push to master, publishes draft releases on `v*` tags
