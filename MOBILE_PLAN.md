# Pasulong MD — Mobile Plan (Tauri Mobile)

> **Status:** Not started. This document is a reference plan for when mobile development begins.
> Tauri Mobile targets iOS and Android from the same Rust + React codebase.

---

## Why Tauri Mobile

Tauri v2 ships with iOS and Android support using the same architecture as the desktop app — a Rust backend and a WebView frontend. The existing React frontend, markdown renderer, CodeMirror editor, and export logic all carry over without rewriting. The native layer (file I/O, dialogs) just swaps to mobile-specific Tauri plugins.

Alternatives considered and set aside:
- **Capacitor** — no Rust backend, JS-only native bridge, weaker plugin ecosystem for file access
- **React Native** — full rewrite of all components, CodeMirror doesn't work there
- **PWA** — no real file system access, not installable on iOS without Safari quirks

---

## What Carries Over (Unchanged or Near-Unchanged)

| Piece | Status |
|---|---|
| `marked` + `highlight.js` markdown rendering | Carries over as-is |
| DOMPurify sanitization | Carries over as-is |
| `docx` export logic (`exportDocx.ts`) | Carries over as-is |
| HTML export logic (`exportHtml.ts`) | Carries over as-is |
| CodeMirror 6 editor | Carries over — needs touch tuning |
| Theme system (CSS custom properties) | Carries over — needs mobile viewport tweaks |
| `markdownRenderer.ts` / `codemirrorSetup.ts` | Carries over as-is |
| Rust plugin registration (`lib.rs`) | Structure carries over — plugins change |

---

## What Must Change

### 1. Layout — Split Pane → Single Pane with Toggle

The side-by-side editor/preview layout doesn't fit a phone screen.

**Replace with:**
- Single active pane at a time (editor or preview)
- A toggle button in the toolbar to switch modes
- On tablet (iPad/large Android), the split pane could be conditionally re-enabled using a CSS media query or a JS breakpoint check

`SplitPane.tsx` would either be bypassed on mobile or replaced with a simpler tab/toggle wrapper.

### 2. File System — Sandbox-Aware I/O

Desktop uses `fs:scope-home-recursive` which gives broad home-directory access. Mobile OSes don't allow this.

**iOS:** Files live in the app sandbox or iCloud Drive. Open/save goes through the system document picker (`UIDocumentPickerViewController`).

**Android:** Files go through the Storage Access Framework (SAF) — also a system picker.

**Tauri plugin to use:** `tauri-plugin-fs` works on mobile but the capability scope must change. The document picker is exposed via `tauri-plugin-dialog` (same plugin used on desktop for `open`/`save` dialogs — it maps to the native picker on mobile automatically).

The folder sidebar (`FolderSidebar.tsx`) will need rethinking — browsing arbitrary directories is restricted. Could be replaced with a "recents" list or limited to the app's document sandbox.

### 3. Keyboard Shortcuts → Touch UI

All `Ctrl+*`, `F1`, `F2`, `F11` shortcuts are meaningless on mobile. The toolbar must carry all actions.

**Changes needed:**
- Larger tap targets (minimum 44×44pt — Apple's HIG guideline)
- Toolbar possibly moves to the bottom of the screen (thumb reach on phones)
- Consider a floating action button or bottom sheet for secondary actions (export, recent files, etc.)
- The Find & Replace bar needs to work with a virtual keyboard (CodeMirror's built-in panel should handle this, but needs testing)

### 4. Tabs — Reduced or Replaced

Multi-tab UI (`TabBar.tsx`) is a desktop pattern. On mobile:
- Option A: Keep tabs but make them a horizontal scroll row (acceptable on tablet)
- Option B: Replace with a "files" drawer / bottom sheet showing open documents
- Option C: Single-file only for v1 mobile, add tabs later

Recommendation: single-file for v1, revisit tabs as a drawer for v2.

### 5. Export — Share Sheet Instead of Save Dialog

On mobile, "save file" often means "share to another app" or "save to Files/Drive."

`tauri-plugin-dialog`'s `save` dialog maps to the system share sheet on iOS/Android. HTML, DOCX, and TXT exports should work through this. PDF export via the browser print dialog (`window.print()`) may not behave the same on mobile WebViews — needs investigation.

### 6. Status Bar — Virtual Keyboard Overlap

The status bar at the bottom of the screen will be covered by the virtual keyboard when editing. It needs to move above the keyboard or be hidden while the keyboard is visible.

CSS `env(safe-area-inset-*)` and the `visualViewport` API handle this on modern mobile browsers/WebViews.

---

## Build Environment Prerequisites

This is the most friction-heavy part for a first mobile build.

### For iOS (requires macOS)
- macOS machine (cannot build iOS apps on Windows or Linux)
- Xcode (latest stable, from Mac App Store)
- Apple Developer account — $99/year, required for device testing and App Store distribution
- iOS Simulator (comes with Xcode) — good for most testing
- Physical device registered in your developer account for on-device testing
- Provisioning profile and signing certificate (Xcode mostly automates this)

### For Android (Windows is fine)
- Android Studio — for the SDK, emulator, and build tools
- Java 17+ (bundled with Android Studio)
- Android SDK (API level 24+ recommended — covers ~97% of active Android devices)
- A virtual device (AVD) via Android Studio's emulator, or a physical Android device with USB debugging enabled
- No paid account required for sideloading; Google Play Console is $25 one-time for store distribution

### Tauri Mobile CLI setup
```bash
# Install Tauri CLI with mobile support (already included in tauri-cli v2)
cargo install tauri-cli

# iOS target
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim

# Android targets
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android

# Initialize mobile in the project (run once)
npm run tauri ios init
npm run tauri android init
```

---

## Phased Roadmap

### Phase 1 — Get It Running (Proof of Concept)

Goal: app opens on a device/emulator, editor works, file open/save works.

- [ ] Add mobile targets to the Tauri project (`tauri ios init` / `tauri android init`)
- [ ] Replace split-pane layout with single-pane + edit/preview toggle
- [ ] Verify `tauri-plugin-dialog` open/save maps to native document picker
- [ ] Basic responsive CSS: toolbar scales, font sizes readable, no overflow
- [ ] Verify CodeMirror renders and basic typing works with virtual keyboard
- [ ] Get a dev build running on iOS Simulator and Android Emulator

### Phase 2 — Usable UX

Goal: feels like a real mobile app, not a desktop app shrunk down.

- [ ] Bottom toolbar (or sticky top bar) with thumb-friendly tap targets
- [ ] Keyboard-aware layout (status bar clears virtual keyboard)
- [ ] Touch-optimized CodeMirror: larger cursor, scroll behavior, selection handles
- [ ] Markdown export via share sheet (HTML, DOCX, TXT)
- [ ] Recent files (replaces folder sidebar for v1)
- [ ] Dark/light theme respects mobile OS preference (already works via CSS — verify)
- [ ] Safe area insets (notch, home indicator)

### Phase 3 — Distribution

Goal: app in stores.

- [ ] App icons at all required sizes (iOS: 1024×1024 base; Android: various densities)
- [ ] iOS: create App Store Connect listing, submit for review
- [ ] Android: create Play Console listing, submit for review
- [ ] Set up a separate CI job for mobile builds (GitHub Actions with macOS runner for iOS)

### Phase 4 — Feature Parity (stretch)

- [ ] Multiple open files (drawer-based, not tab bar)
- [ ] Folder/iCloud Drive browsing
- [ ] PDF export (investigate WKWebView print on iOS)
- [ ] Find & Replace tuned for virtual keyboard flow

---

## Known Risks and Open Questions

| Risk | Notes |
|---|---|
| **Tauri Mobile maturity** | As of 2025, Tauri mobile is production-capable but younger than the desktop side. Expect rough edges in plugins and documentation. Check the Tauri GitHub for known mobile issues before starting. |
| **CodeMirror touch UX** | Mobile text editing in a WebView is notoriously tricky — autocorrect, autocapitalize, selection handles, virtual keyboard resize events. Budget time for this. |
| **PDF export on iOS** | `window.print()` in WKWebView opens a print dialog on iOS but behavior differs from desktop. May need to export as HTML and let the user print from Safari instead. |
| **iOS build requires macOS** | If you only have Windows, iOS builds require either a Mac or a CI runner (GitHub Actions macOS runners are available but slow and billed per minute). |
| **App Store review** | Apple reviews all apps. A Markdown editor is a low-risk category but first-time submissions often get rejected for minor policy reasons (metadata, screenshots, privacy policy). Budget 1–2 iterations. |
| **File access on iOS** | iOS is stricter than Android. Test file open/save on a real device, not just the simulator — the document picker behaves differently. |

---

## Reference Links

- [Tauri Mobile Guide](https://tauri.app/distribute/mobile/)
- [Tauri iOS Prerequisites](https://tauri.app/start/prerequisites/#ios)
- [Tauri Android Prerequisites](https://tauri.app/start/prerequisites/#android)
- [tauri-plugin-fs (mobile)](https://github.com/tauri-apps/tauri-plugin-fs)
- [Apple Human Interface Guidelines — Touch Targets](https://developer.apple.com/design/human-interface-guidelines/buttons)
- [CodeMirror 6 Mobile Notes](https://codemirror.net/docs/ref/)

---

*Written 2026-05-28. Revisit when starting Phase 1 — check Tauri Mobile release notes for anything that changed.*
