// src/install.js
import {
  mkdirSync,
  writeFileSync,
  chmodSync,
  symlinkSync,
  unlinkSync,
  rmSync,
  existsSync,
  readdirSync,
  lstatSync,
  readlinkSync,
} from "node:fs";
import { join, basename } from "node:path";
import { homedir } from "node:os";

const APPLICATIONS_DIR = join(homedir(), ".local", "share", "applications");

export function ensureOutputDirs(outputDir) {
  mkdirSync(join(outputDir, "icons"), { recursive: true });
  mkdirSync(join(outputDir, "scripts"), { recursive: true });
  mkdirSync(join(outputDir, "desktop"), { recursive: true });
  mkdirSync(APPLICATIONS_DIR, { recursive: true });
}

export function writeIcon(outputDir, tla, svgContent) {
  const filePath = join(outputDir, "icons", `${tla.toLowerCase()}.svg`);
  writeFileSync(filePath, svgContent, "utf8");
  return filePath;
}

export function writeScript(outputDir, tla, scriptContent) {
  const filePath = join(outputDir, "scripts", `${tla.toLowerCase()}.sh`);
  writeFileSync(filePath, scriptContent, "utf8");
  chmodSync(filePath, 0o755);
  return filePath;
}

export function writeDesktop(outputDir, tla, desktopContent) {
  const filePath = join(outputDir, "desktop", `${tla.toLowerCase()}.desktop`);
  writeFileSync(filePath, desktopContent, "utf8");
  return filePath;
}

export function symlinkDesktop(desktopFilePath) {
  const linkPath = join(APPLICATIONS_DIR, basename(desktopFilePath));
  if (existsSync(linkPath)) unlinkSync(linkPath);
  symlinkSync(desktopFilePath, linkPath);
}

export function clean(outputDir) {
  // Remove any symlink in APPLICATIONS_DIR pointing into this project's output dir,
  // including stale ones left behind after a directory rename.
  if (existsSync(APPLICATIONS_DIR)) {
    for (const file of readdirSync(APPLICATIONS_DIR)) {
      const linkPath = join(APPLICATIONS_DIR, file);
      try {
        if (!lstatSync(linkPath).isSymbolicLink()) continue;
        const target = readlinkSync(linkPath);
        if (target.startsWith(outputDir)) unlinkSync(linkPath);
      } catch {
        // ignore unreadable entries
      }
    }
  }
  if (existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true, force: true });
  }
}
