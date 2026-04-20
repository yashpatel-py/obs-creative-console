# OBS Controller — Logitech MX Creative Console Plugin

Full OBS Studio control for the [Logitech MX Creative Console](https://www.logitech.com/en-us/products/keyboards/mx-creative-console.html). Auto-discovers your scenes, sources, filters, and transitions — drag any action onto any key or dial with zero manual configuration.

## Features

- **Auto-discovery** — connects to OBS at startup and registers actions for every scene, source, filter, transition, profile, and scene collection automatically
- **Recording** — start, stop, toggle
- **Streaming** — start, stop, toggle
- **Replay Buffer** — start, stop, toggle, save clip
- **Virtual Camera** — start, stop, toggle
- **Studio Mode** — toggle
- **Screenshot** — capture current scene
- **Scenes** — switch to program or send to preview (Studio Mode)
- **Source Visibility** — show, hide, toggle per source
- **Filters** — toggle any filter on any source
- **Audio** — mute/unmute mic & desktop audio, volume via dial
- **Audio Monitor** — cycle monitoring mode per source
- **Transitions** — switch type, adjust duration via dial
- **Scene Collections** — switch between collections
- **Profiles** — switch between profiles
- **Projectors** — open fullscreen projector for program, preview, or any source
- **macOS Notifications** — get notified when recording starts/stops, stream goes live, replay is saved

## Requirements

- Logitech MX Creative Console
- [Logi Options+](https://www.logitech.com/en-us/software/logi-options-plus.html) 6.1+
- [OBS Studio](https://obsproject.com) 28+ (WebSocket server built in)
- Node.js 22+

## Setup

**1. Enable OBS WebSocket server**

In OBS: `Tools → WebSocket Server Settings → Enable WebSocket server`

Note the port (default `4455`) and password.

**2. Run setup**

```bash
npm install
npm run setup
```

The setup verifies your OBS connection and saves credentials to `~/.obs-controller-config.json`.

**3. Build and load**

```bash
npm run build
npm run link
```

Open Logi Options+ — the plugin appears under **OBS Controller**. Drag any action onto your keys or dial.

## Configuration

The config file at `~/.obs-controller-config.json` only needs your WebSocket credentials:

```json
{
  "host": "localhost",
  "port": 4455,
  "password": "your-password",
  "micSource": "",
  "desktopSource": "",
  "textSources": []
}
```

- `micSource` / `desktopSource` — leave blank to auto-detect, or set the exact source name from OBS Audio Mixer
- `textSources` — optional text source presets cycled on key press:
  ```json
  "textSources": [
    { "sourceName": "Stream Status", "presets": ["BRB", "Live", "Offline"] }
  ]
  ```

After changing the config, run `npm run build && npm run link` to reload.

## Development

```bash
npm run watch   # build + live-reload into Options+
npm run unlink  # remove plugin from Options+
```

## Publishing

```bash
npm run build:pack
```

Submit the generated `.lplug4` file at [marketplace.logitech.com/contribute](https://marketplace.logitech.com/contribute).

## License

MIT © Yash Patel
