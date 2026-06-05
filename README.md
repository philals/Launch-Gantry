# Launch Gantry 🚀

One-click GNOME dock icons for your dev projects. Click an icon — your IDE opens, docker starts, npm runs. Everything in place before you've made your first coffee.

Configure once in YAML. Works across machines without leaking your local paths.

## How it works

You define your projects in `launcher.config.yml`. Running `node generate.js` produces:

- An SVG icon (or uses your own custom PNG) per project
- A bash launcher script per project
- A `.desktop` file per project, symlinked into GNOME's application registry

The icons appear in Activities search and can be pinned to the dock.

## Setup

```bash
git clone <repo>
cd launch-gantry
npm install
cp launcher.config.example.yml launcher.config.yml
# Edit launcher.config.yml with your projects
node generate.js
```

## Config

```yaml
defaults:
  ide: /usr/bin/code   # full path to your IDE binary

projects:
  - name: My App
    tla: APP           # 1–4 letters shown on the generated icon
    color: "#4A90D9"   # icon background colour
    path: ~/code/my-app
    icon: icons/my-app.png   # optional — uses generated SVG icon if omitted
    docker:
      - name: Dev Stack
        command: docker-compose up -d
    npm:
      - name: Dev Server
        command: npm run dev
```

See `launcher.config.example.yml` for a full documented example.

## Custom icons

Drop PNG files into the `icons/` folder and reference them with the `icon` field in your config. Any size works — 256×256 or 512×512 recommended for crisp dock display.

The `icons/` folder is committed to the repo. Your personal config (`launcher.config.yml`) and generated output (`output/`) are gitignored.

## Usage

```bash
node generate.js                    # regenerate all projects
node generate.js --project APP      # regenerate one project by TLA
node generate.js --clean            # remove all generated files and symlinks
```

## Requirements

- Ubuntu with GNOME
- Node.js 18+
- Ghostty terminal (for npm command windows)

## How docker and npm commands open

- **Docker** (`up -d`): runs silently in the background — no terminal window
- **npm**: opens a Ghostty terminal window with your full shell environment loaded

## Machine setup

`launcher.config.yml` is gitignored — your local paths never leave your machine. On a new machine: clone, `npm install`, copy the example config, fill in your paths, generate.

## License

MIT
