import { PluginSDK, type Action } from '@logitech/plugin-sdk';
import { obsConnection } from './src/obs-connection.js';
import { discoverOBS, DEFAULT_MIC_SOURCE, DEFAULT_DESKTOP_SOURCE } from './src/obs-discover.js';

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

// ── Discover everything in OBS and register an action for each item ──────────
const cfg = obsConnection.config;
// Manual source overrides from the config file — blank means auto-detect on every discovery
const { micSource: micOverride, desktopSource: desktopOverride } = cfg;
const registered = new Set<string>();

function registerOnce(action: Action) {
  if (registered.has(action.name)) return;
  registered.add(action.name);
  pluginSDK.registerAction(action);
}

async function discoverAndRegister() {
  const obs = await discoverOBS(obsConnection.obs);

  // Patch mic/desktop source into the actions that reference config, preferring manual overrides
  // and keeping the previous guess if OBS didn't return its input list this time
  const config = obsConnection.config;
  config.micSource = micOverride || obs.micSource || config.micSource || DEFAULT_MIC_SOURCE;
  config.desktopSource = desktopOverride || obs.desktopSource || config.desktopSource || DEFAULT_DESKTOP_SOURCE;

  // ── Scenes ──────────────────────────────────────────────────────────────────
  for (const sceneName of obs.scenes) {
    registerOnce(new (makeSceneAction(sceneName))());
    registerOnce(new (makeScenePreviewAction(sceneName))());
  }

  // ── Source Visibility + Projector ────────────────────────────────────────────
  for (const sourceName of obs.sources) {
    for (const action of makeSourceVisibilityActions(sourceName)) {
      registerOnce(action);
    }
    registerOnce(new (makeSourceProjectorAction(sourceName))());
  }

  // ── Filters ──────────────────────────────────────────────────────────────────
  for (const { sourceName, filterName } of obs.filters) {
    registerOnce(new (makeFilterToggleAction(sourceName, filterName))());
  }

  // ── Transitions ───────────────────────────────────────────────────────────────
  for (const t of obs.transitions) {
    registerOnce(new (makeSetTransitionAction(t))());
  }

  // ── Scene Collections ────────────────────────────────────────────────────────
  for (const c of obs.sceneCollections) {
    registerOnce(new (makeSceneCollectionAction(c))());
  }

  // ── Profiles ──────────────────────────────────────────────────────────────────
  for (const p of obs.profiles) {
    registerOnce(new (makeProfileAction(p))());
  }

  // ── Audio Monitor (all audio inputs) ─────────────────────────────────────────
  for (const src of [...obs.audioInputs, ...obs.audioOutputs]) {
    registerOnce(new (makeAudioMonitorAction(src))());
  }

  // ── Text Sources (presets from config only) ───────────────────────────────────
  for (const { sourceName, presets } of cfg.textSources) {
    registerOnce(new (makeTextCycleAction(sourceName, presets))());
  }

  console.log(`[OBS] Discovered: ${obs.scenes.length} scenes, ${obs.sources.length} sources, ${obs.filters.length} filters, ${obs.transitions.length} transitions`);
}

// ── Connect to OBS ────────────────────────────────────────────────────────────
// Discover on every connection — at startup, and whenever OBS is opened later or restarted.
// Startup waits for whichever discovery finishes first.
let finishFirstDiscovery = () => {};
const firstDiscovery = new Promise<void>((resolve) => { finishFirstDiscovery = resolve; });
obsConnection.onConnected(() => {
  discoverAndRegister()
    .catch((e) => console.warn('[OBS] Discovery failed:', (e as Error).message))
    .finally(() => finishFirstDiscovery());
});

try {
  // Wait up to 10s for OBS — if it's not open, plugin still works with static actions
  await Promise.race([
    obsConnection.connect(),
    new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10_000)),
  ]);
} catch {
  console.warn('[OBS] Not reachable at startup — static actions only. Will retry in background.');
  obsConnection.connectWithRetry();
}

// Register discovered actions before Options+ asks for the action list. Every discovery
// request has its own timeout, so this finishes even if OBS drops or freezes mid-discovery.
if (obsConnection.isConnected()) await firstDiscovery;

await pluginSDK.connect();
