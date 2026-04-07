/**
 * Cross-platform build combiner for JAXX Suite.
 * Merges all 4 sub-app builds into a single dist/ folder for Firebase Hosting.
 */
import { cpSync, mkdirSync, rmSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const dist = resolve(root, 'dist');

// Clean previous dist
if (existsSync(dist)) {
  rmSync(dist, { recursive: true, force: true });
}
mkdirSync(dist, { recursive: true });

const copies = [
  { src: 'landing/dist', dest: 'dist' },
  { src: 'ReCORE/dist',  dest: 'dist/ReCORE' },
  { src: 'BRIDGE/dist',  dest: 'dist/bridge' },
  { src: 'PROCTOR/dist', dest: 'dist/proctor' },
];

for (const { src, dest } of copies) {
  const srcPath  = resolve(root, src);
  const destPath = resolve(root, dest);
  mkdirSync(destPath, { recursive: true });
  cpSync(srcPath, destPath, { recursive: true });
  console.log(`✓ ${src} → ${dest}`);
}

console.log('\nAll apps combined into dist/');
