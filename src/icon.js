// src/icon.js
const FONT_SIZE = { 1: 56, 2: 48, 3: 36, 4: 28 }

export function generateIcon({ tla, color }) {
  const fontSize = FONT_SIZE[tla.length] ?? 24
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="16" fill="${color}"/>
  <text x="64" y="64" font-family="monospace" font-weight="bold" font-size="${fontSize}" fill="white" text-anchor="middle" dominant-baseline="central">${tla}</text>
</svg>`
}
