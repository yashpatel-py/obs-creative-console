import OBSWebSocket from 'obs-websocket-js';

export type DiscoveredData = {
  scenes: string[];
  sources: string[];           // deduplicated across all scenes
  audioInputs: string[];       // all audio input sources
  audioOutputs: string[];      // all audio output sources
  micSource: string;           // best-guess mic ('' if OBS didn't return its input list)
  desktopSource: string;       // best-guess desktop audio ('' if OBS didn't return its input list)
  filters: Array<{ sourceName: string; filterName: string }>;
  transitions: string[];
  sceneCollections: string[];
  profiles: string[];
};

// OBS's default names for the mic and desktop audio sources
export const DEFAULT_MIC_SOURCE = 'Mic/Aux';
export const DEFAULT_DESKTOP_SOURCE = 'Desktop Audio';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch { return fallback; }
}

// A request in flight when OBS drops or freezes never settles, so give each one a deadline
const REQUEST_TIMEOUT_MS = 5_000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), REQUEST_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function discoverOBS(obs: OBSWebSocket): Promise<DiscoveredData> {
  const call = (req: string, data?: Record<string, unknown>) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    withTimeout((obs as any).call(req, data) as Promise<unknown>, req);

  // ── Scenes ──────────────────────────────────────────────────────────────────
  const sceneData = await safe(
    () => call('GetSceneList') as Promise<{ scenes: Array<{ sceneName: string }> }>,
    { scenes: [] }
  );
  const scenes = sceneData.scenes.map((s) => s.sceneName).reverse(); // OBS returns newest-first

  // ── All sources across every scene (deduplicated) ───────────────────────────
  const sourceSet = new Set<string>();
  for (const sceneName of scenes) {
    const itemData = await safe(
      () => call('GetSceneItemList', { sceneName }) as Promise<{
        sceneItems: Array<{ sourceName: string; inputKind?: string }>;
      }>,
      { sceneItems: [] }
    );
    for (const item of itemData.sceneItems) {
      if (item.sourceName) sourceSet.add(item.sourceName);
    }
  }
  const sources = [...sourceSet];

  // ── All inputs ───────────────────────────────────────────────────────────────
  type InputList = { inputs: Array<{ inputName: string; inputKind: string }> };
  const inputData = await safe<InputList | null>(
    () => call('GetInputList') as Promise<InputList>,
    null
  );
  const inputs = inputData?.inputs ?? [];

  const MIC_KINDS = [
    'coreaudio_input_capture',
    'wasapi_input_capture',
    'pulse_input_capture',
    'alsa_input_capture',
  ];
  const DESKTOP_KINDS = [
    'coreaudio_output_capture',
    'wasapi_output_capture',
    'pulse_output_capture',
  ];

  const audioInputs = inputs
    .filter((i) => MIC_KINDS.includes(i.inputKind) || /mic|microphone/i.test(i.inputName))
    .map((i) => i.inputName);

  const audioOutputs = inputs
    .filter((i) => DESKTOP_KINDS.includes(i.inputKind) || /desktop|speaker|output/i.test(i.inputName))
    .map((i) => i.inputName);

  // Best-guess defaults — blank if the input list is unavailable, so callers can keep an earlier guess
  const micSource = !inputData ? '' : (
    audioInputs[0] ??
    inputs.find((i) => /mic/i.test(i.inputName))?.inputName ??
    DEFAULT_MIC_SOURCE
  );

  const desktopSource = !inputData ? '' : (
    audioOutputs[0] ??
    inputs.find((i) => /desktop|speaker/i.test(i.inputName))?.inputName ??
    DEFAULT_DESKTOP_SOURCE
  );

  // ── Filters for every source ─────────────────────────────────────────────────
  const filters: Array<{ sourceName: string; filterName: string }> = [];
  for (const sourceName of sources) {
    const filterData = await safe(
      () => call('GetSourceFilterList', { sourceName }) as Promise<{
        filters: Array<{ filterName: string }>;
      }>,
      { filters: [] }
    );
    for (const f of filterData.filters) {
      filters.push({ sourceName, filterName: f.filterName });
    }
  }

  // ── Transitions ──────────────────────────────────────────────────────────────
  const transitionData = await safe(
    () => call('GetSceneTransitionList') as Promise<{
      transitions: Array<{ transitionName: string }>;
    }>,
    { transitions: [] }
  );
  const transitions = transitionData.transitions.map((t) => t.transitionName);

  // ── Scene collections ────────────────────────────────────────────────────────
  const collectionData = await safe(
    () => call('GetSceneCollectionList') as Promise<{ sceneCollections: string[] }>,
    { sceneCollections: [] }
  );

  // ── Profiles ──────────────────────────────────────────────────────────────────
  const profileData = await safe(
    () => call('GetProfileList') as Promise<{ profiles: string[] }>,
    { profiles: [] }
  );

  return {
    scenes,
    sources,
    audioInputs,
    audioOutputs,
    micSource,
    desktopSource,
    filters,
    transitions,
    sceneCollections: collectionData.sceneCollections,
    profiles: profileData.profiles,
  };
}
