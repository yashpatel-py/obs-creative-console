import { PluginSDK } from '@logitech/plugin-sdk';
import { obsConnection } from './src/obs-connection.js';
import { discoverOBS } from './src/obs-discover.js';

// Static actions (always available)
import { ToggleRecordAction } from './src/actions/record-toggle.js';
import { StartRecordAction } from './src/actions/record-start.js';
import { StopRecordAction } from './src/actions/record-stop.js';
import { ToggleStreamAction } from './src/actions/stream-toggle.js';
import { StartStreamAction } from './src/actions/stream-start.js';
import { StopStreamAction } from './src/actions/stream-stop.js';
import { StartReplayBufferAction, StopReplayBufferAction, ToggleReplayBufferAction, SaveReplayBufferAction } from './src/actions/replay-buffer.js';
import { ScreenshotAction } from './src/actions/screenshot.js';
import { ToggleStudioModeAction } from './src/actions/studio-mode.js';
import { ToggleVirtualCameraAction, StartVirtualCameraAction, StopVirtualCameraAction } from './src/actions/virtual-camera.js';
import { MuteMicAction, UnmuteMicAction, ToggleMicMuteAction } from './src/actions/mute-mic.js';
import { MuteDesktopAction, UnmuteDesktopAction, ToggleDesktopMuteAction } from './src/actions/mute-desktop.js';
import { MicVolumeAction, DesktopVolumeAction } from './src/actions/volume-adjust.js';
import { TransitionDurationAction } from './src/actions/transition.js';
import { OpenProgramProjectorAction, OpenPreviewProjectorAction } from './src/actions/projector.js';

// Dynamic action factories (built from OBS discovery)
import { makeSceneAction } from './src/actions/scene-switch.js';
import { makeScenePreviewAction } from './src/actions/scene-preview.js';
import { makeSourceVisibilityActions } from './src/actions/source-visibility.js';
import { makeSetTransitionAction } from './src/actions/transition.js';
import { makeFilterToggleAction } from './src/actions/filter-toggle.js';
import { makeTextCycleAction } from './src/actions/text-cycle.js';
import { makeAudioMonitorAction } from './src/actions/audio-monitor.js';
import { makeSceneCollectionAction } from './src/actions/scene-collection.js';
import { makeProfileAction } from './src/actions/profile.js';
import { makeSourceProjectorAction } from './src/actions/projector.js';

const pluginSDK = new PluginSDK();

// ── Static actions (always registered, work even if OBS is offline) ───────────
pluginSDK.registerAction(new ToggleRecordAction());
pluginSDK.registerAction(new StartRecordAction());
pluginSDK.registerAction(new StopRecordAction());
pluginSDK.registerAction(new ToggleStreamAction());
pluginSDK.registerAction(new StartStreamAction());
pluginSDK.registerAction(new StopStreamAction());
pluginSDK.registerAction(new StartReplayBufferAction());
pluginSDK.registerAction(new StopReplayBufferAction());
pluginSDK.registerAction(new ToggleReplayBufferAction());
pluginSDK.registerAction(new SaveReplayBufferAction());
pluginSDK.registerAction(new ScreenshotAction());
pluginSDK.registerAction(new ToggleStudioModeAction());
pluginSDK.registerAction(new ToggleVirtualCameraAction());
pluginSDK.registerAction(new StartVirtualCameraAction());
pluginSDK.registerAction(new StopVirtualCameraAction());
pluginSDK.registerAction(new MuteMicAction());
pluginSDK.registerAction(new UnmuteMicAction());
pluginSDK.registerAction(new ToggleMicMuteAction());
pluginSDK.registerAction(new MuteDesktopAction());
pluginSDK.registerAction(new UnmuteDesktopAction());
pluginSDK.registerAction(new ToggleDesktopMuteAction());
pluginSDK.registerAction(new MicVolumeAction());
pluginSDK.registerAction(new DesktopVolumeAction());
pluginSDK.registerAction(new TransitionDurationAction());
pluginSDK.registerAction(new OpenProgramProjectorAction());
pluginSDK.registerAction(new OpenPreviewProjectorAction());

// ── Connect to OBS and discover everything ────────────────────────────────────
const cfg = obsConnection.config;

try {
  // Wait up to 10s for OBS — if it's not open, plugin still works with static actions
  await Promise.race([
    obsConnection.connect(),
    new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10_000)),
  ]);

  const obs = await discoverOBS(obsConnection.obs);

  // Override auto-detected sources with manual config if set
  const micSource = cfg.micSource || obs.micSource;
  const desktopSource = cfg.desktopSource || obs.desktopSource;

  // Patch mic/desktop source into the actions that reference config
  obsConnection.config.micSource = micSource;
  obsConnection.config.desktopSource = desktopSource;

  // ── Scenes ──────────────────────────────────────────────────────────────────
  for (const sceneName of obs.scenes) {
    pluginSDK.registerAction(new (makeSceneAction(sceneName))());
    pluginSDK.registerAction(new (makeScenePreviewAction(sceneName))());
  }

  // ── Source Visibility + Projector ────────────────────────────────────────────
  for (const sourceName of obs.sources) {
    for (const action of makeSourceVisibilityActions(sourceName)) {
      pluginSDK.registerAction(action);
    }
    pluginSDK.registerAction(new (makeSourceProjectorAction(sourceName))());
  }

  // ── Filters ──────────────────────────────────────────────────────────────────
  for (const { sourceName, filterName } of obs.filters) {
    pluginSDK.registerAction(new (makeFilterToggleAction(sourceName, filterName))());
  }

  // ── Transitions ───────────────────────────────────────────────────────────────
  for (const t of obs.transitions) {
    pluginSDK.registerAction(new (makeSetTransitionAction(t))());
  }

  // ── Scene Collections ────────────────────────────────────────────────────────
  for (const c of obs.sceneCollections) {
    pluginSDK.registerAction(new (makeSceneCollectionAction(c))());
  }

  // ── Profiles ──────────────────────────────────────────────────────────────────
  for (const p of obs.profiles) {
    pluginSDK.registerAction(new (makeProfileAction(p))());
  }

  // ── Audio Monitor (all audio inputs) ─────────────────────────────────────────
  for (const src of [...obs.audioInputs, ...obs.audioOutputs]) {
    pluginSDK.registerAction(new (makeAudioMonitorAction(src))());
  }

  // ── Text Sources (presets from config only) ───────────────────────────────────
  for (const { sourceName, presets } of cfg.textSources) {
    pluginSDK.registerAction(new (makeTextCycleAction(sourceName, presets))());
  }

  console.log(`[OBS] Discovered: ${obs.scenes.length} scenes, ${obs.sources.length} sources, ${obs.filters.length} filters, ${obs.transitions.length} transitions`);
} catch {
  console.warn('[OBS] Not reachable at startup — static actions only. Will retry in background.');
  obsConnection.connectWithRetry();
}

await pluginSDK.connect();
