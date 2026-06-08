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

export function generateGantryDesktop(entries, { iconPath }) {
  if (entries.length === 0) return ''

  const actions = entries.map(e => e.tla).join(';') + ';'
  const actionSections = entries.map(e => `
[Desktop Action ${e.tla}]
Name=${e.name}
Exec=${e.scriptPath}`).join('\n')

  return `[Desktop Entry]
Version=1.0
Type=Application
Name=Launch Gantry
Comment=LG project launcher
Icon=${iconPath}
Exec=notify-send "Launch Gantry" "Right-click to select a project"
Terminal=false
Categories=Development;
Actions=${actions}
${actionSections}
`
}
