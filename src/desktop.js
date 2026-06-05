// src/desktop.js
export function generateDesktop(project, { iconPath, scriptPath }) {
  return `[Desktop Entry]
Version=1.0
Type=Application
Name=${project.name}
Comment=${project.tla} dev environment
Icon=${iconPath}
Exec=${scriptPath}
Terminal=false
Categories=Development;
`
}
