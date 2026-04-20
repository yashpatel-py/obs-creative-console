import { PluginSDK } from '@logitech/plugin-sdk';
import { obsConnection } from './src/obs-connection.js';

// Recording
import { ToggleRecordAction } from './src/actions/record-toggle.js';
import { StartRecordAction } from './src/actions/record-start.js';
import { StopRecordAction } from './src/actions/record-stop.js';

// Streaming
import { ToggleStreamAction } from './src/actions/stream-toggle.js';
import { StartStreamAction } from './src/actions/stream-start.js';
import { StopStreamAction } from './src/actions/stream-stop.js';

// Replay Buffer
import {
  StartReplayBufferAction,
  StopReplayBufferAction,
  ToggleReplayBufferAction,
  SaveReplayBufferAction,
} from './src/actions/replay-buffer.js';

// Screenshot & Studio Mode
import { ScreenshotAction } from './src/actions/screenshot.js';
import { ToggleStudioModeAction } from './src/actions/studio-mode.js';

// Virtual Camera
import {
  ToggleVirtualCameraAction,
  StartVirtualCameraAction,
  StopVirtualCameraAction,
} from './src/actions/virtual-camera.js';

// Audio — Mic
import { MuteMicAction, UnmuteMicAction, ToggleMicMuteAction } from './src/actions/mute-mic.js';

// Audio — Desktop
import { MuteDesktopAction, UnmuteDesktopAction, ToggleDesktopMuteAction } from './src/actions/mute-desktop.js';

// Audio — Volume dial
import { MicVolumeAction, DesktopVolumeAction } from './src/actions/volume-adjust.js';

// Scenes (config-driven)
import { makeSceneAction } from './src/actions/scene-switch.js';
import { makeScenePreviewAction } from './src/actions/scene-preview.js';

// Source Visibility (config-driven)
import { makeSourceVisibilityActions } from './src/actions/source-visibility.js';

const pluginSDK = new PluginSDK();

// ── Recording ────────────────────────────────────────────────────────────────
pluginSDK.registerAction(new ToggleRecordAction());
pluginSDK.registerAction(new StartRecordAction());
pluginSDK.registerAction(new StopRecordAction());

// ── Streaming ────────────────────────────────────────────────────────────────
pluginSDK.registerAction(new ToggleStreamAction());
pluginSDK.registerAction(new StartStreamAction());
pluginSDK.registerAction(new StopStreamAction());

// ── Replay Buffer ────────────────────────────────────────────────────────────
pluginSDK.registerAction(new StartReplayBufferAction());
pluginSDK.registerAction(new StopReplayBufferAction());
pluginSDK.registerAction(new ToggleReplayBufferAction());
pluginSDK.registerAction(new SaveReplayBufferAction());

// ── Screenshot & Studio Mode ─────────────────────────────────────────────────
pluginSDK.registerAction(new ScreenshotAction());
pluginSDK.registerAction(new ToggleStudioModeAction());

// ── Virtual Camera ───────────────────────────────────────────────────────────
pluginSDK.registerAction(new ToggleVirtualCameraAction());
pluginSDK.registerAction(new StartVirtualCameraAction());
pluginSDK.registerAction(new StopVirtualCameraAction());

// ── Audio — Mic ──────────────────────────────────────────────────────────────
pluginSDK.registerAction(new MuteMicAction());
pluginSDK.registerAction(new UnmuteMicAction());
pluginSDK.registerAction(new ToggleMicMuteAction());

// ── Audio — Desktop ──────────────────────────────────────────────────────────
pluginSDK.registerAction(new MuteDesktopAction());
pluginSDK.registerAction(new UnmuteDesktopAction());
pluginSDK.registerAction(new ToggleDesktopMuteAction());

// ── Audio — Volume dial ───────────────────────────────────────────────────────
pluginSDK.registerAction(new MicVolumeAction());
pluginSDK.registerAction(new DesktopVolumeAction());

// ── Scenes — Program + Preview (one action per scene in config) ───────────────
for (const sceneName of obsConnection.config.scenes) {
  pluginSDK.registerAction(new (makeSceneAction(sceneName))());
  pluginSDK.registerAction(new (makeScenePreviewAction(sceneName))());
}

// ── Source Visibility (show/hide/toggle per source in config) ─────────────────
for (const sourceName of obsConnection.config.sources) {
  for (const action of makeSourceVisibilityActions(sourceName)) {
    pluginSDK.registerAction(action);
  }
}

// Connect to OBS in background — auto-reconnects every 5s if OBS isn't open
obsConnection.connect();

await pluginSDK.connect();
