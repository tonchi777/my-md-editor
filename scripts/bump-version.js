#!/usr/bin/env node
// Usage: node scripts/bump-version.js [patch|minor|major]
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const arg = process.argv[2];
if (!['patch', 'minor', 'major'].includes(arg)) {
  console.error('Usage: node scripts/bump-version.js [patch|minor|major]');
  process.exit(1);
}

// Read current version from package.json
const pkgPath = join(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);

let newVersion;
if (arg === 'major') newVersion = `${major + 1}.0.0`;
else if (arg === 'minor') newVersion = `${major}.${minor + 1}.0`;
else newVersion = `${major}.${minor}.${patch + 1}`;

// Update package.json
pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Updated package.json → ${newVersion}`);

// Update src-tauri/tauri.conf.json
const tauriPath = join(root, 'src-tauri', 'tauri.conf.json');
const tauri = JSON.parse(readFileSync(tauriPath, 'utf-8'));
tauri.version = newVersion;
writeFileSync(tauriPath, JSON.stringify(tauri, null, 2) + '\n');
console.log(`Updated tauri.conf.json → ${newVersion}`);

// Prepend new entry stub to CHANGELOG.md after [Unreleased]
const changelogPath = join(root, 'CHANGELOG.md');
const changelog = readFileSync(changelogPath, 'utf-8');
const today = new Date().toISOString().slice(0, 10);
const marker = '## [Unreleased]\n\n';
const pos = changelog.indexOf(marker);
if (pos === -1) {
  console.warn('CHANGELOG.md missing [Unreleased] section — skipping changelog update');
} else {
  const newEntry = `## [${newVersion}] - ${today}\n\n### Added\n- \n\n### Changed\n- \n\n### Fixed\n- \n\n`;
  const updated = changelog.slice(0, pos + marker.length) + newEntry + changelog.slice(pos + marker.length);
  writeFileSync(changelogPath, updated);
  console.log(`Added [${newVersion}] stub to CHANGELOG.md`);
}

console.log('');
console.log(`Next steps:`);
console.log(`  1. Fill in CHANGELOG.md`);
console.log(`  2. git add -A && git commit -m "Release v${newVersion}"`);
console.log(`  3. git tag v${newVersion} && git push origin v${newVersion}`);
