# Studio Controller — Logitech MX Creative Console Plugin

Control [OBS Studio](https://obsproject.com) from the [Logitech MX Creative Console](https://www.logitech.com/en-us/products/keyboards/mx-creative-console.html). Auto-discovers your scenes, sources, filters, and transitions — drag any action onto any key or dial, no per-action setup needed.

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
- **macOS Notifications** — get notified when recording starts/stops, stream goes live, replay is saved, the scene changes, or the virtual camera turns on/off

## Requirements

- Logitech MX Creative Console
- [Logi Options+](https://www.logitech.com/en-us/software/logi-options-plus.html) 2.2+ on macOS, 1.97+ on Windows
- [OBS Studio](https://obsproject.com) 28+ (WebSocket server built in)

## Install

**1. Enable the OBS WebSocket server**

In OBS: `Tools → WebSocket Server Settings → Enable WebSocket server`

Note the port (default `4455`) and, if authentication is on, the password (`Show Connect Info`).

**2. Install the plugin**

Install **Studio Controller** from the Logi Marketplace in Logi Options+.

**3. Add your WebSocket password**

On first run the plugin creates `~/.studio-controller-config.json` (`%USERPROFILE%\.studio-controller-config.json` on Windows). If OBS authentication is on, set the `password` field in that file to your WebSocket password (see [Configuration](#configuration)).

While it isn't connected, the plugin retries every few seconds and re-reads the file each time, so there's no need to restart anything. Your scenes, sources, filters, and transitions are discovered when it connects. If it connected after it started (because OBS was opened later, or you just added the password) and they don't appear in Options+, keep OBS open and choose **Restart Logi Plugin Service** in Logi Options+ settings.

Drag any action onto your keys or dial.

## Build from source

Requires Node.js 22+.

```bash
npm install
npm run setup   # verifies your OBS connection and saves ~/.studio-controller-config.json
npm run build
npm run link
```

Open Logi Options+ — the plugin appears under **Studio Controller**.

## Configuration

The config file at `~/.studio-controller-config.json` only needs your WebSocket credentials:

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

Connection settings (`host`, `port`, `password`) are re-read every time the plugin connects to OBS. For other changes, choose **Restart Logi Plugin Service** in Logi Options+ settings (or, when building from source, run `npm run build && npm run link`).

If you used the plugin when it was called OBS Controller, your old `~/.obs-controller-config.json` is copied to the new location automatically.

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

Studio Controller is an unofficial, community-built plugin. It is not affiliated with, endorsed by, or sponsored by the OBS Project. OBS and OBS Studio are trademarks of their respective owners.
